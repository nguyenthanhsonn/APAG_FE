'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, X } from 'lucide-react';
import { API_Admin, type TrainingDepartmentFacultyStat } from '@/api/API_Admin';
import type { AdminEvaluationItem, PaginatedResponse } from '@/types';
import { getUserFriendlyError } from '@/utils/errorHelper';

const PAGE_SIZE = 10;

function formatTerm(form: AdminEvaluationItem) {
  const semester = typeof form.semester === 'string'
    ? form.semester
    : form.semester?.name ?? form.semester?.semester;
  return [semester, form.academicYear].filter(Boolean).join(' · ') || '—';
}

export function FacultyEvaluationDetails({
  faculty,
  onClose,
}: {
  faculty: TrainingDepartmentFacultyStat;
  onClose: () => void;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<AdminEvaluationItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    heading.current?.focus();
  }, []);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError('');
    API_Admin.getTrainingDepartmentEvaluations({
      facultyId: faculty.id,
      page,
      limit: PAGE_SIZE,
    })
      .then((response) => {
        if (ignore) return;
        const lastPage = Math.max(1, Math.ceil(response.total / PAGE_SIZE));
        if (page > lastPage) setPage(lastPage);
        else setResult(response);
      })
      .catch((failure) => {
        if (ignore) return;
        setResult(null);
        setError(getUserFriendlyError(failure, 'Không tải được danh sách phiếu của khoa.'));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [faculty.id, page]);

  const total = result?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section aria-labelledby="faculty-evaluation-heading" className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
      <div className="flex items-start justify-between gap-3 border-b border-gray-100 p-4 sm:p-5">
        <div>
          <h2 ref={heading} tabIndex={-1} id="faculty-evaluation-heading" className="font-bold text-gray-900">
            {faculty.name}
          </h2>
          <p className="text-sm text-gray-600">Danh sách phiếu đã chuyển lên Phòng Đào tạo</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng danh sách phiếu"
          className="rounded-md p-1 text-gray-600 hover:bg-gray-100 cursor-pointer"
        >
          <X size={18} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 text-xs font-semibold uppercase">
            <tr>
              <th className="px-4 py-3 text-center w-12">STT</th>
              <th className="px-4 py-3">Sinh viên</th>
              <th className="px-4 py-3">Lớp</th>
              <th className="px-4 py-3">Học kỳ</th>
              <th className="px-4 py-3 text-center">Điểm tự đánh giá</th>
              <th className="px-4 py-3 text-center">Điểm lớp đánh giá</th>
              <th className="px-4 py-3 text-center w-36 whitespace-nowrap">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading || error || !result?.items.length ? (
              <tr>
                <td colSpan={7} className={`px-4 py-8 text-center ${error ? 'text-rose-700' : 'text-gray-500'}`}>
                  {loading ? 'Đang tải phiếu…' : error || 'Không có phiếu đánh giá nào.'}
                </td>
              </tr>
            ) : (
              result.items.map((form, index) => {
                const rowIndex = (page - 1) * PAGE_SIZE + index + 1;
                const selfScore = typeof (form as any).studentScore === 'number'
                  ? (form as any).studentScore
                  : typeof (form as any).selfScore === 'number'
                    ? (form as any).selfScore
                    : typeof (form as any).totalScore === 'number'
                      ? (form as any).totalScore
                      : '—';
                const classScore = typeof form.classScore === 'number'
                  ? form.classScore
                  : typeof form.finalScore === 'number'
                    ? form.finalScore
                    : '—';
                const classId = form.class?.id || (form as any).classId || 'class';

                return (
                  <tr key={form.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-center text-gray-500">{rowIndex}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{form.student?.fullName ?? '—'}</td>
                    <td className="px-4 py-3">{form.class?.code ?? '—'}</td>
                    <td className="px-4 py-3">{formatTerm(form)}</td>
                    <td className="px-4 py-3 text-center font-bold text-gray-900">{selfScore}</td>
                    <td className="px-4 py-3 text-center font-bold text-indigo-600">{classScore}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => router.push(`/training_department/${classId}/${form.id}`)}
                        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50/80 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-xs active:scale-95"
                      >
                        <Eye size={14} /> Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && total > 0 && (
        <nav aria-label="Phân trang phiếu đánh giá" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-sm">
          <span>{(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} / {total} phiếu</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => {
                setLoading(true);
                setPage(page - 1);
              }}
              className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <span>Trang {page}/{totalPages}</span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => {
                setLoading(true);
                setPage(page + 1);
              }}
              className="rounded-md border border-gray-200 px-3 py-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
            >
              Sau
            </button>
          </div>
        </nav>
      )}
    </section>
  );
}
