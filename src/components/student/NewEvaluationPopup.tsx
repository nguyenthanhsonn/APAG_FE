'use client';

import { useEffect } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
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

  const handleCardKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;

    e.preventDefault();
    onViewDetail();
  };

  const titleText = evaluationInfo.title || 'Nhắc nhở đánh giá rèn luyện';
  const contentText = evaluationInfo.content || 'Bạn có một phiếu tự đánh giá kết quả rèn luyện cần hoàn thành.';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
    >
      <div
        role="button"
        tabIndex={0}
        onClick={onViewDetail}
        onKeyDown={handleCardKeyDown}
        aria-labelledby="new-eval-popup-title"
        aria-describedby="new-eval-popup-content"
        className="group relative w-full max-w-lg cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#243362] via-[#1F2A44] to-[#111827] p-7 text-center text-white shadow-2xl outline-none transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_28px_80px_-32px_rgba(59,91,219,0.85)] focus-visible:ring-2 focus-visible:ring-blue-300 sm:p-8"
        style={{
          animation: 'fadeInScale 0.22s cubic-bezier(0.34, 1.4, 0.64, 1)',
        }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Đóng"
          className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          <X size={20} />
        </button>

        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-300 via-cyan-200 to-blue-400" />

        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-blue-300/25 bg-blue-400/15 text-blue-200 shadow-[0_0_34px_rgba(96,165,250,0.25)] animate-pulse">
          <BellRing size={38} strokeWidth={1.8} />
        </div>

        <h2 id="new-eval-popup-title" className="pr-8 text-xl font-bold leading-tight text-white sm:pr-0">
          {titleText}
        </h2>

        <p
          id="new-eval-popup-content"
          className="mt-4 whitespace-pre-line break-words text-sm leading-relaxed text-slate-200"
        >
          {contentText}
        </p>

        <p className="mt-6 text-xs leading-relaxed text-slate-400">
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
