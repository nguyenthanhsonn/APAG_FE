'use client';

import React, { createContext, useCallback, useContext, useMemo, useState, useRef, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, RotateCw, X, XCircle } from 'lucide-react';
import type { ToastType, ToastItem, ToastContextValue } from '@/types/common';

const ToastContext = createContext<ToastContextValue | null>(null);
const TOAST_DURATION_MS = 4200;

const toastStyles: Record<ToastType, { icon: React.ReactNode; className: string; progressClassName: string }> = {
  success: {
    icon: <CheckCircle size={18} />,
    className: 'border-green-100 bg-green-50 text-green-700',
    progressClassName: 'bg-green-500',
  },
  error: {
    icon: <XCircle size={18} />,
    className: 'border-red-100 bg-red-50 text-red-700',
    progressClassName: 'bg-red-500',
  },
  info: {
    icon: <Info size={18} />,
    className: 'border-blue-100 bg-blue-50 text-blue-700',
    progressClassName: 'bg-blue-500',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [conflict, setConflict] = useState<string | null>(null);
  useEffect(() => {
    const handler = (event: Event) => setConflict((event as CustomEvent<{ message?: string }>).detail?.message || 'Phiếu đã thay đổi. Vui lòng tải lại dữ liệu.');
    window.addEventListener('evaluation_conflict', handler);
    return () => window.removeEventListener('evaluation_conflict', handler);
  }, []);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const lastToastRef = useRef<{ message: string; type: ToastType; timestamp: number } | null>(null);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    (message: string, type: ToastType) => {
      const now = Date.now();

      // Deduplicate: từ chối nếu đã có toast cùng nội dung/loại trong 2 giây qua
      if (
        lastToastRef.current &&
        lastToastRef.current.message === message &&
        lastToastRef.current.type === type &&
        now - lastToastRef.current.timestamp < 2000
      ) {
        return;
      }

      // Deduplicate: từ chối nếu hiện đang có toast cùng nội dung/loại đang hiển thị
      setToasts((prev) => {
        const isDuplicate = prev.some((t) => t.message === message && t.type === type);
        if (isDuplicate) return prev;

        lastToastRef.current = { message, type, timestamp: now };
        const id = now + Math.random();
        window.setTimeout(() => removeToast(id), TOAST_DURATION_MS);
        return [...prev, { id, message, type, duration: TOAST_DURATION_MS }];
      });
    },
    [removeToast]
  );

  const [isReloading, setIsReloading] = useState(false);

  const value = useMemo(
    () => ({
      success: (message: string) => pushToast(message, 'success'),
      error: (message: string) => pushToast(message, 'error'),
      info: (message: string) => pushToast(message, 'info'),
    }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {conflict && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setConflict(null)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200 animate-in zoom-in-95">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setConflict(null)}
              className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="Đóng thông báo"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center">
              {/* Icon Container */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-8 ring-amber-50/50">
                <AlertTriangle size={28} />
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-bold text-gray-900">Dữ liệu đã được cập nhật</h3>

              {/* Message */}
              <p className="mb-3 text-sm text-gray-600 leading-relaxed font-medium">
                {conflict}
              </p>

              {/* Sub-note */}
              <div className="mb-6 rounded-xl bg-amber-50/80 border border-amber-200/60 p-3 text-left w-full flex items-start gap-2.5">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-normal">
                  Vui lòng tải lại trang để hiển thị thông tin mới nhất từ máy chủ. Các thao tác chưa lưu trên màn hình có thể bị hủy bỏ.
                </p>
              </div>

              {/* Actions */}
              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => setConflict(null)}
                  className="flex-1 cursor-pointer rounded-xl border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 hover:text-gray-900"
                >
                  Để sau
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsReloading(true);
                    window.location.reload();
                  }}
                  disabled={isReloading}
                  className="flex-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-amber-600 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-700 transition active:scale-[0.98] disabled:opacity-60"
                >
                  <RotateCw size={16} className={isReloading ? 'animate-spin' : ''} />
                  {isReloading ? 'Đang tải lại...' : 'Tải lại dữ liệu'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {children}
      <div className="fixed right-4 top-4 z-9999 flex w-[calc(100vw-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type];

          return (
            <div
              key={toast.id}
              className={`relative overflow-hidden rounded-xl border text-sm font-semibold shadow-lg shadow-black/10 ${style.className}`}
              role="status"
            >
              <div className="flex items-start gap-3 px-4 py-3">
                <span className="mt-0.5 shrink-0">{style.icon}</span>
                <p className="min-w-0 flex-1 leading-relaxed">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 rounded-lg p-1 opacity-70 transition hover:bg-white/60 hover:opacity-100"
                  aria-label="Đóng thông báo"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="h-1 w-full bg-black/5">
                <div
                  className={`h-full origin-left ${style.progressClassName}`}
                  style={{
                    animation: `toast-progress ${toast.duration}ms linear forwards`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        @keyframes toast-progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);

  if (!toast) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return toast;
}
