'use client';

import { useEffect } from 'react';
import { BellRing, X } from 'lucide-react';

export interface NewEvaluationPopupInfo {
  title?: string;
  content?: string;
  semesterName?: string;
  deadline?: string;
  notificationId?: string;
  semesterId?: string;
}

interface NewEvaluationPopupProps {
  evaluationInfo: NewEvaluationPopupInfo | null;
  onClose: () => void;
  onViewDetail: () => void;
}

export function NewEvaluationPopup({ evaluationInfo, onClose, onViewDetail }: NewEvaluationPopupProps) {
  // Đóng popup khi bấm ESC
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Ngăn scroll body khi popup mở
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!evaluationInfo) return null;

  const titleText = evaluationInfo.title || 'Mở đánh giá rèn luyện';
  const contentText = evaluationInfo.content || 'Bạn có một phiếu tự đánh giá kết quả rèn luyện cần hoàn thành.';

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-eval-popup-title"
        aria-describedby="new-eval-popup-content"
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100 transition-all text-center z-10"
        style={{
          animation: 'popupFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Nút đóng */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Icon chuông đơn giản, tinh tế */}
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-8 ring-blue-50/60">
          <BellRing size={22} />
        </div>

        {/* Tiêu đề */}
        <h3 id="new-eval-popup-title" className="text-lg font-semibold text-gray-900">
          {titleText}
        </h3>

        {/* Nội dung thông báo */}
        <p
          id="new-eval-popup-content"
          className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-gray-600"
        >
          {contentText}
        </p>

        {/* Ghi chú phụ */}
        <p className="mt-3 text-xs text-gray-400">
          Bạn vẫn có thể xem lại thông báo này trong mục <strong>Thông báo</strong>.
        </p>

        {/* Nút hành động */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 cursor-pointer"
          >
            Để sau
          </button>
          <button
            type="button"
            onClick={onViewDetail}
            className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 cursor-pointer"
          >
            Đánh giá ngay
          </button>
        </div>
      </div>

      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
