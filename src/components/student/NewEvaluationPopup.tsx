'use client';

import { useEffect, useRef } from 'react';
import { X, ClipboardList, ArrowRight } from 'lucide-react';

export interface NewEvaluationPopupInfo {
  title?: string;
  content?: string;
  semesterName?: string;
  deadline?: string;
  notificationId?: string;
}

interface NewEvaluationPopupProps {
  evaluationInfo: NewEvaluationPopupInfo | null;
  onClose: () => void;
  onViewDetail: () => void;
}

export function NewEvaluationPopup({ evaluationInfo, onClose, onViewDetail }: NewEvaluationPopupProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Đóng popup khi bấm ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onClose();
  };

  const titleText = evaluationInfo.title || 'Mở đánh giá rèn luyện';
  const contentText = evaluationInfo.content || 'Bạn có một phiếu tự đánh giá kết quả rèn luyện cần hoàn thành.';

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden animate-[fadeInScale_0.25s_ease-out]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-eval-popup-title"
        style={{
          animation: 'fadeInScale 0.22s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        {/* Header gradient */}
        <div className="relative bg-gradient-to-br from-[#3D4A6B] to-[#2A3550] px-6 pt-8 pb-10 text-white overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
          <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-white/5 blur-xl" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Đóng popup"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div className="relative z-10 mb-3 inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/15 backdrop-blur-sm">
            <ClipboardList size={24} className="text-white" />
          </div>

          {/* Title */}
          <h2
            id="new-eval-popup-title"
            className="relative z-10 text-xl font-bold leading-tight"
          >
            📋 {titleText}
          </h2>
          <p className="relative z-10 mt-1 text-sm text-white/75 leading-relaxed">
            {contentText}
          </p>
        </div>

        {/* Card overlap */}
        <div className="relative -mt-5 mx-4 mb-0 rounded-xl bg-white shadow-md border border-gray-100 px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-blue-50 flex items-center justify-center">
              <ClipboardList size={16} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">
                Thông báo đánh giá
              </p>
              <p className="text-sm font-bold text-gray-900 truncate">
                {titleText}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 pt-4 pb-5 flex flex-col sm:flex-row gap-2.5">
          <button
            onClick={onViewDetail}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-[#3D4A6B] hover:bg-[#2A3550] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Xem ngay
            <ArrowRight size={15} />
          </button>
          <button
            onClick={onClose}
            className="flex-1 inline-flex items-center justify-center text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Đã hiểu
          </button>
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] text-gray-400 pb-4 -mt-1">
          Bạn vẫn có thể xem lại thông báo này trong mục <strong>Thông báo</strong>.
        </p>
      </div>

      {/* Keyframe animation via style tag */}
      <style>{`
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.93) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </div>
  );
}
