'use client';

import { useState, useEffect } from 'react';
import { Bell, ClipboardCheck, Eye, FileSearch, ChevronLeft, ChevronRight } from 'lucide-react';
import type { StudentReviewStatus, CouncilStudentReview } from '@/types/admin';

export type { StudentReviewStatus, CouncilStudentReview };

/* ── Progress & Status Helper ── */
export function getWorkflowProgress(status?: string) {
  const norm = String(status || '').toLowerCase();
  switch (norm) {
    case 'finalized':
      return {
        percent: 100,
        label: 'Đã hoàn tất',
        barColor: 'bg-emerald-500',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    case 'class_approved':
      return {
        percent: 66,
        label: 'Chờ Admin duyệt',
        barColor: 'bg-indigo-500',
        badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      };
    case 'submitted':
      return {
        percent: 33,
        label: 'Chờ CVHT duyệt',
        barColor: 'bg-amber-500',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'rejected':
      return {
        percent: 20,
        label: 'Bị trả về',
        barColor: 'bg-red-500',
        badgeClass: 'bg-red-50 text-red-700 border-red-200',
      };
    case 'not_submitted':
    default:
      return {
        percent: 0,
        label: 'Chưa nộp',
        barColor: 'bg-gray-300',
        badgeClass: 'bg-gray-100 text-gray-600 border-gray-200',
      };
  }
}

/* ── Skeleton Helper ── */
function SkeletonPulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 ${className}`} />;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-4 py-4"><SkeletonPulse className="h-4 w-8" /></td>
      <td className="px-4 py-4"><SkeletonPulse className="h-4 w-20" /></td>
      <td className="px-4 py-4"><SkeletonPulse className="h-4 w-28" /></td>
      <td className="px-4 py-4"><SkeletonPulse className="h-4 w-10" /></td>
      <td className="px-4 py-4">
        <div className="space-y-1.5 w-36">
          <SkeletonPulse className="h-3.5 w-24" />
          <SkeletonPulse className="h-2 w-full rounded-full" />
        </div>
      </td>
      <td className="px-4 py-4 text-right"><SkeletonPulse className="ml-auto h-8 w-8 rounded-lg" /></td>
    </tr>
  );
}

/* ── Component Props ── */
export interface StudentProgressTableProps {
  students: CouncilStudentReview[];
  loading?: boolean;
  onReview: (studentId: string) => void;
  onRemind?: (studentId: string) => void;
  hasActiveFilter?: boolean;
  onClearFilters?: () => void;
}

export default function StudentProgressTable({
  students,
  loading = false,
  onReview,
  onRemind,
  hasActiveFilter = false,
  onClearFilters,
}: StudentProgressTableProps) {
  /* ── Pagination State ── */
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(page, totalPages);
  const paginated = students.slice((safeCurrentPage - 1) * PAGE_SIZE, safeCurrentPage * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [students.length]);

  /* ── Loading Skeleton State ── */
  if (loading) {
    return (
      <section className="space-y-3" aria-labelledby="student-list-heading">
        <h2 id="student-list-heading" className="text-base font-bold text-gray-900">
          Danh sách sinh viên
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[780px] text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="px-4 py-3.5">STT</th>
                  <th scope="col" className="px-4 py-3.5">Mã SV</th>
                  <th scope="col" className="px-4 py-3.5">Họ tên</th>
                  <th scope="col" className="px-4 py-3.5">SV tự chấm</th>
                  <th scope="col" className="px-4 py-3.5">Tiến trình</th>
                  <th scope="col" className="px-4 py-3.5 text-right">Thao tác</th>
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
      </section>
    );
  }

  /* ── Empty State ── */
  if (students.length === 0) {
    return (
      <section className="space-y-3" aria-labelledby="student-list-heading">
        <h2 id="student-list-heading" className="text-base font-bold text-gray-900">
          Danh sách sinh viên
        </h2>
        <div className="flex min-h-[340px] flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
            <FileSearch size={28} className="text-gray-400" />
          </div>
          <p className="text-sm font-semibold text-gray-800">Không tìm thấy sinh viên phù hợp</p>
          <p className="text-xs text-gray-500 max-w-sm">
            Không có sinh viên nào khớp với bộ lọc hoặc từ khóa tìm kiếm hiện tại.
          </p>
          {hasActiveFilter && onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-1 cursor-pointer text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </section>
    );
  }

  /* ── Desktop Table ── */
  const desktopTable = (
    <div className="hidden sm:block overflow-x-auto">
      <table className="w-full min-w-[780px] text-sm text-left border-collapse">
        <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-xs border-b border-gray-200 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <tr>
            <th scope="col" className="px-4 py-3.5">STT</th>
            <th scope="col" className="px-4 py-3.5">Mã SV</th>
            <th scope="col" className="px-4 py-3.5">Họ tên</th>
            <th scope="col" className="px-4 py-3.5">SV tự chấm</th>
            <th scope="col" className="px-4 py-3.5">Trạng thái</th>
            <th scope="col" className="px-4 py-3.5 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {paginated.map((student, index) => {
            const rowIndex = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;

            return (
              <tr
                key={student.id}
                className={`transition-colors hover:bg-indigo-50/40 ${
                  index % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'
                }`}
              >
                <td className="px-4 py-3.5 text-xs font-medium text-gray-400">{rowIndex}</td>
                <td className="px-4 py-3.5 font-semibold text-gray-900">{student.code}</td>
                <td className="px-4 py-3.5 font-medium text-gray-800">{student.fullName}</td>
                <td className="px-4 py-3.5">
                  {typeof student.selfScore === 'number' ? (
                    <span className="font-bold text-gray-900">{student.selfScore}</span>
                  ) : (
                    <span className="text-gray-400 font-normal">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5">
                  {student.status === 'submitted' ? (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      Đã nộp
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                      Chưa nộp
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    {student.status === 'submitted' ? (
                      <button
                        type="button"
                        onClick={() => onReview(student.id)}
                        aria-label={`Chấm điểm sinh viên ${student.fullName}`}
                        title="Chấm điểm phiếu đánh giá"
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
                      >
                        <ClipboardCheck size={15} />
                        Chấm điểm
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => onReview(student.id)}
                          aria-label={`Xem chi tiết sinh viên ${student.fullName}`}
                          title="Xem chi tiết phiếu đánh giá"
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 hover:text-gray-900 shadow-2xs"
                        >
                          <Eye size={15} />
                          Xem chi tiết
                        </button>
                        {onRemind && (
                          <button
                            type="button"
                            onClick={() => onRemind(student.id)}
                            aria-label={`Nhắc nộp phiếu sinh viên ${student.fullName}`}
                            title="Nhắc sinh viên nộp phiếu"
                            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 transition hover:bg-amber-100 hover:text-amber-700"
                          >
                            <Bell size={15} />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  /* ── Mobile Stacked Cards ── */
  const mobileCards = (
    <div className="flex flex-col gap-3 sm:hidden">
      {paginated.map((student, index) => {
        const rowIndex = (safeCurrentPage - 1) * PAGE_SIZE + index + 1;

        return (
          <div key={student.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                  <span>#{rowIndex}</span>
                  <span className="text-indigo-600 font-bold">{student.code}</span>
                </div>
                <h3 className="mt-0.5 truncate text-sm font-bold text-gray-900">
                  {student.fullName}
                </h3>
              </div>
              {student.status === 'submitted' ? (
                <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  Đã nộp
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                  Chưa nộp
                </span>
              )}
            </div>

            <div className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">SV tự chấm:</span>
                {typeof student.selfScore === 'number' ? (
                  <span className="font-bold text-gray-900">{student.selfScore} điểm</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>


            </div>

            <div className="mt-3 flex items-center justify-end gap-2 border-t border-gray-100 pt-2.5">
              <button
                type="button"
                onClick={() => onReview(student.id)}
                aria-label={`Xem hoặc chấm điểm sinh viên ${student.fullName}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                {student.status === 'submitted' ? (
                  <>
                    <ClipboardCheck size={14} /> Chấm điểm
                  </>
                ) : (
                  <>
                    <Eye size={14} /> Xem chi tiết
                  </>
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  /* ── Pagination Footer ── */
  const paginationFooter = (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gray-50/50 px-4 py-3 sm:flex-row">
      <p className="text-xs font-medium text-gray-500">
        Hiển thị <span className="font-semibold text-gray-800">{(safeCurrentPage - 1) * PAGE_SIZE + 1}–{Math.min(safeCurrentPage * PAGE_SIZE, students.length)}</span> / <span className="font-semibold text-gray-800">{students.length}</span> sinh viên
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={safeCurrentPage === 1}
          aria-label="Trang trước"
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPage(i + 1)}
            aria-label={`Trang ${i + 1}`}
            className={`flex h-8 min-w-[32px] cursor-pointer items-center justify-center rounded-lg text-xs font-semibold transition ${
              safeCurrentPage === i + 1
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {i + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={safeCurrentPage === totalPages}
          aria-label="Trang sau"
          className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <section className="space-y-3" aria-labelledby="student-list-heading">
      <h2 id="student-list-heading" className="text-base font-bold text-gray-900">
        Danh sách sinh viên
      </h2>
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-xs">
        {desktopTable}
        {mobileCards}
        {paginationFooter}
      </div>
    </section>
  );
}
