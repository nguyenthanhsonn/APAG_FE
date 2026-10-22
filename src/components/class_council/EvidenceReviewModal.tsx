'use client';

import { useState } from 'react';
import { Check, ExternalLink, FileImage, FileText, X } from 'lucide-react';
import type { ReviewEvidence, EvidenceReviewModalProps } from '@/types/admin';

export type { ReviewEvidence };

export default function EvidenceReviewModal({
  isOpen,
  evidences,
  onClose,
  onApprove,
  onReject,
}: EvidenceReviewModalProps) {
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleApprove = (evidenceId: string) => {
    if (rejectingId === evidenceId) {
      setRejectingId(null);
      setReason('');
    }
    onApprove(evidenceId);
  };

  const handleReject = (evidenceId: string) => {
    if (rejectingId !== evidenceId) {
      setRejectingId(evidenceId);
      setReason('');
      return;
    }
    if (!reason.trim()) return;
    onReject(evidenceId, reason.trim());
    setRejectingId(null);
    setReason('');
  };

  return (
    <>
      <div className="fixed inset-0 z-40 cursor-pointer bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative flex max-h-[88vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-[#E9ECEF] px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-[#1A1B1E]">Minh chứng đính kèm</h2>
              <p className="mt-0.5 text-xs text-[#868E96]">Kiểm tra và xác nhận từng tệp minh chứng của sinh viên.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#868E96] transition hover:bg-[#F8F9FA] hover:text-[#1A1B1E]"
              aria-label="Đóng modal"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-3 overflow-y-auto px-6 py-5">
            {evidences.map((evidence) => {
              const FileIcon = evidence.fileType === 'pdf' ? FileText : FileImage;
              const isApproved = evidence.status === 'approved';
              const isRejected = evidence.status === 'rejected';

              return (
                <div
                  key={evidence.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    isApproved
                      ? 'border-[#D3F9D8] bg-[#F4FCE3]/20'
                      : isRejected
                        ? 'border-[#FFE3E3] bg-[#FFF5F5]/30'
                        : 'border-[#E9ECEF] bg-white'
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF2FF] text-[#3B5BDB]">
                        <FileIcon size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#1A1B1E]">{evidence.fileName}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#2F9E44]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#2F9E44]" />
                              Đã duyệt
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C92A2A]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#C92A2A]" />
                              Đã từ chối{evidence.rejectReason ? `: ${evidence.rejectReason}` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-[#868E96]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#ADB5BD]" />
                              Chờ duyệt
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={evidence.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#DEE2E6] bg-white px-3 py-2 text-sm font-semibold text-[#495057] transition hover:bg-[#F8F9FA]"
                      >
                        <ExternalLink size={15} />
                        Xem
                      </a>
                      <button
                        type="button"
                        onClick={() => handleApprove(evidence.id)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                          isApproved
                            ? 'bg-[#2F9E44] text-white shadow-sm ring-2 ring-[#2F9E44]/20 cursor-default'
                            : isRejected
                              ? 'border border-[#DEE2E6] bg-white text-[#868E96] hover:border-[#2F9E44] hover:text-[#2F9E44] hover:bg-[#EBFBEE] cursor-pointer'
                              : 'border border-[#2F9E44] bg-[#EBFBEE] text-[#2F9E44] hover:bg-[#2F9E44] hover:text-white cursor-pointer'
                        }`}
                      >
                        <Check size={15} className={isApproved ? 'stroke-[2.5]' : ''} />
                        {isApproved ? 'Đã duyệt' : 'Duyệt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(evidence.id)}
                        disabled={rejectingId === evidence.id && !reason.trim()}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          isRejected
                            ? 'bg-[#C92A2A] text-white shadow-sm ring-2 ring-[#C92A2A]/20 cursor-default'
                            : isApproved
                              ? 'border border-[#DEE2E6] bg-white text-[#868E96] hover:border-[#C92A2A] hover:text-[#C92A2A] hover:bg-[#FFF5F5] cursor-pointer'
                              : 'border border-[#C92A2A] bg-white text-[#C92A2A] hover:bg-[#FFF5F5] cursor-pointer'
                        }`}
                      >
                        <X size={15} className={isRejected ? 'stroke-[2.5]' : ''} />
                        {isRejected ? 'Đã từ chối' : 'Từ chối'}
                      </button>
                    </div>
                  </div>

                  {rejectingId === evidence.id && (
                    <div className="mt-3 border-t border-[#F1F3F5] pt-3">
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-[#868E96]">
                          Lý do từ chối <span className="text-[#C92A2A]">*</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => { setRejectingId(null); setReason(''); }}
                          className="cursor-pointer text-xs font-medium text-[#868E96] hover:text-[#1A1B1E]"
                        >
                          Hủy
                        </button>
                      </div>
                      <textarea
                        value={reason}
                        onChange={(event) => setReason(event.target.value)}
                        className="h-20 w-full rounded-lg border border-[#DEE2E6] p-2.5 text-sm text-[#1A1B1E] outline-none transition focus:border-[#C92A2A] focus:ring-2 focus:ring-[#C92A2A]/10"
                        placeholder="Nhập lý do từ chối minh chứng"
                        autoFocus
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => { setRejectingId(null); setReason(''); }}
                          className="cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold text-[#495057] transition hover:bg-[#F8F9FA]"
                        >
                          Đóng
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(evidence.id)}
                          disabled={!reason.trim()}
                          className="cursor-pointer rounded-lg bg-[#C92A2A] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#B02525] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Xác nhận từ chối
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {evidences.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#DEE2E6] px-4 py-10 text-center text-sm text-[#868E96]">
                Mục này chưa có minh chứng đính kèm.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
