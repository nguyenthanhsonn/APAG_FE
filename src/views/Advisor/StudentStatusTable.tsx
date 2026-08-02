'use client';

import { useState, useEffect } from 'react';
import { Bell, ClipboardCheck, FileSearch } from 'lucide-react';
import EvaluationStatusStepper from '@/components/common/EvaluationStatusStepper';
import type { StudentReviewStatus, CouncilStudentReview } from '@/types/admin';

export type { StudentReviewStatus, CouncilStudentReview };

/* ── Status badge metadata ── */
const statusMeta: Record<StudentReviewStatus, { label: string; className: string }> = {
  not_submitted: { label: 'Chưa nộp', className: 'bg-[#F1F3F5] text-[#495057]' },
  submitted: { label: 'Đã nộp', className: 'bg-[#EBFBEE] text-[#2F9E44]' },
};

/* ── Skeleton helpers ── */
function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#E9ECEF]">
      <td className="px-4 py-4"><SkeletonPulse className="h-4 w-8" /></td>
      <td className="px-4 py-4"><SkeletonPulse className="h-4 w-20" /></td>
      <td className="px-4 py-4"><SkeletonPulse className="h-4 w-28" /></td>
      <td className="px-4 py-4"><SkeletonPulse className="h-4 w-10" /></td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <SkeletonPulse className="h-5 w-16 rounded-full" />
          <SkeletonPulse className="h-5 w-24" />
        </div>
      </td>
      <td className="px-4 py-4 text-right"><SkeletonPulse className="ml-auto h-8 w-8 rounded-lg" /></td>
    </tr>
  );
}

/* ── Props ── */
interface StudentStatusTableProps {
  students: CouncilStudentReview[];
  loading?: boolean;
  onReview: (studentId: string) => void;
  onRemind?: (studentId: string) => void;
  hasActiveFilter?: boolean;
  onClearFilters?: () => void;
}

export default function StudentStatusTable({
  students,
  loading = false,
  onReview,
  onRemind,
  hasActiveFilter = false,
  onClearFilters,
}: StudentStatusTableProps) {
  /* ── Pagination ── */
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paginated = students.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  // Reset to page 1 when students list changes
  useEffect(() => {
    setPage(1);
  }, [students.length]);

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="ui-card flex flex-col overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="bg-[#F8F9FA]">
                <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">STT</th>
                <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">Mã SV</th>
                <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">Họ tên</th>
                <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">SV tự chấm</th>
                <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">Tiến trình</th>
                <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[#868E96]">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  /* ── Empty state ── */
  if (students.length === 0) {
    return (
      <div className="ui-card flex min-h-[360px] flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <FileSearch size={32} className="text-gray-300" />
        </div>
        <p className="text-sm font-semibold text-[#495057]">Không tìm thấy sinh viên phù hợp</p>
        <p className="text-xs text-[#868E96]">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
        {hasActiveFilter && onClearFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="mt-1 cursor-pointer text-sm font-semibold text-[#4C6EF5] transition hover:text-[#3B5BDB]"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>
    );
  }

  /* ── Desktop table ── */
  const desktopTable = (
    <div className="hidden sm:block">
      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[780px] text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F8F9FA]">
              <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">STT</th>
              <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">Mã SV</th>
              <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">Họ tên</th>
              <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">SV tự chấm</th>
              <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide text-[#868E96]">Tiến trình</th>
              <th className="border-b border-[#E9ECEF] px-4 py-3.5 text-right text-xs font-semibold uppercase tracking-wide text-[#868E96]">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((student, index) => {
              const meta = statusMeta[student.status];
              const rowIndex = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;
              return (
                <tr
                  key={student.id}
                  className={`border-b border-[#E9ECEF] transition hover:bg-blue-50/40 ${index % 2 === 1 ? 'bg-gray-50/60' : ''}`}
                >
                  <td className="px-4 py-3.5 text-[#868E96] font-medium">{rowIndex}</td>
                  <td className="px-4 py-3.5 font-semibold text-[#1A1B1E]">{student.code}</td>
                  <td className="px-4 py-3.5 text-[#1A1B1E]">{student.fullName}</td>
                  <td className="px-4 py-3.5 text-[#1A1B1E]">{student.selfScore ?? <span className="text-[#ADB5BD]">—</span>}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className={`ui-badge ${meta.className}`}>{student.statusLabel || meta.label}</span>
                      <EvaluationStatusStepper status={student.workflowStatus || student.status} compact />
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {student.status === 'submitted' && (
                        <button
                          type="button"
                          onClick={() => onReview(student.id)}
                          aria-label="Xem chi tiết phiếu"
                          title="Xem chi tiết phiếu"
                          className="ui-icon-button cursor-pointer text-[#4C6EF5] hover:bg-blue-50"
                        >
                          <ClipboardCheck size={17} />
                        </button>
                      )}
                      {student.status === 'not_submitted' && onRemind && (
                        <button
                          type="button"
                          onClick={() => onRemind(student.id)}
                          aria-label="Nhắc nộp phiếu"
                          title="Nhắc nộp phiếu"
                          className="ui-icon-button cursor-pointer text-amber-500 hover:bg-amber-50"
                        >
                          <Bell size={17} />
                        </button>
                      )}
                      {student.status === 'not_submitted' && !onRemind && (
                        <span className="text-[#ADB5BD]">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ── Mobile card list ── */
  const mobileCards = (
    <div className="flex flex-col gap-3 sm:hidden">
      {paginated.map((student, index) => {
        const meta = statusMeta[student.status];
        const rowIndex = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;
        return (
          <div key={student.id} className="ui-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[#868E96]">#{rowIndex}</span>
                  <span className="text-xs font-semibold text-[#4C6EF5]">{student.code}</span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold text-[#1A1B1E]">{student.fullName}</p>
              </div>
              <span className={`ui-badge shrink-0 ${meta.className}`}>{student.statusLabel || meta.label}</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-[#E9ECEF] pt-3">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase text-[#868E96]">Tự chấm</p>
                  <p className="text-sm font-bold text-[#1A1B1E]">{student.selfScore ?? '—'}</p>
                </div>
                <EvaluationStatusStepper status={student.workflowStatus || student.status} compact />
              </div>
              <div className="flex items-center gap-1.5">
                {student.status === 'submitted' && (
                  <button
                    type="button"
                    onClick={() => onReview(student.id)}
                    aria-label="Xem chi tiết phiếu"
                    className="ui-icon-button cursor-pointer text-[#4C6EF5] hover:bg-blue-50"
                  >
                    <ClipboardCheck size={17} />
                  </button>
                )}
                {student.status === 'not_submitted' && onRemind && (
                  <button
                    type="button"
                    onClick={() => onRemind(student.id)}
                    aria-label="Nhắc nộp phiếu"
                    className="ui-icon-button cursor-pointer text-amber-500 hover:bg-amber-50"
                  >
                    <Bell size={17} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ── Pagination footer ── */
  const footer = (
    <div className="flex flex-col items-center justify-between gap-3 px-1 pt-4 sm:flex-row">
      <p className="text-xs font-medium text-[#868E96]">
        Hiển thị {(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, students.length)} / {students.length} sinh viên
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i + 1)}
              className={`flex h-8 min-w-[32px] cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition ${
                safeCurrentPage === i + 1
                  ? 'bg-[#4C6EF5] text-white shadow-sm'
                  : 'text-[#495057] hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="ui-card flex flex-col overflow-hidden p-0">
      <div className="p-0 sm:p-0">
        {desktopTable}
        {mobileCards}
      </div>
      <div className="border-t border-[#E9ECEF] px-4 py-3">
        {footer}
      </div>
    </div>
  );
}
