'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Check,
  ChevronLeft,
  ChevronRight,
  FileCheck,
  Eye,
} from 'lucide-react';
import { PrintButton } from '@/components/common/PrintButton';
import { API_Admin } from '@/api/API_Admin';
import { API_Faculty, type FacultyClassEvaluation, type FacultyClassEvaluationPage } from '@/api/API_Faculty';
import { API_Shared } from '@/api/API_Shared';
import { useAuthStore } from '@/store/authStore';
import type { AdminClass } from '@/types';
import { resolveFacultyId } from '@/utils/facultyEvaluationData';
import { getUserFriendlyError } from '@/utils/errorHelper';

interface Props {
  classId: string;
}

const STUDENTS_PER_PAGE = 10;
const PRINT_PAGE_SIZE = 100;

function formatSubmissionDate(submittedAt: string | null) {
  return submittedAt ? new Date(submittedAt).toLocaleDateString('vi-VN') : '-';
}

function getRawStatusLabel(rawStatus: string): string {
  const norm = String(rawStatus || '').trim().toLowerCase();
  switch (norm) {
    case 'submitted':
      return 'Chờ Lớp trưởng duyệt';
    case 'class_leader_approved':
      return 'Chờ CVHT duyệt';
    case 'class_approved':
      return 'Chờ Khoa duyệt';
    case 'faculty_approved':
      return 'Đã gửi PĐT';
    case 'finalized':
      return 'PĐT đã duyệt';
    case 'rejected':
      return 'Trả về';
    case 'draft':
    default:
      return 'Chưa nộp';
  }
}

function renderStatusBadge(rawStatus: string) {
  const norm = String(rawStatus || '').trim().toLowerCase();

  switch (norm) {
    case 'submitted':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 rounded-full border border-amber-300">
          <Clock size={12} /> Chờ Lớp trưởng duyệt
        </span>
      );
    case 'class_leader_approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-orange-800 bg-orange-50 rounded-full border border-orange-300">
          <Clock size={12} /> Chờ CVHT duyệt
        </span>
      );
    case 'class_approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-800 bg-blue-50 rounded-full border border-blue-300">
          <Clock size={12} /> Chờ Khoa duyệt
        </span>
      );
    case 'faculty_approved':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
          <Check size={12} /> Đã gửi PĐT
        </span>
      );
    case 'finalized':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-800 bg-teal-50 rounded-full border border-teal-300">
          <Check size={12} /> PĐT đã duyệt
        </span>
      );
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 rounded-full border border-rose-200">
          <AlertCircle size={12} /> Trả về
        </span>
      );
    case 'draft':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
          Chưa nộp
        </span>
      );
  }
}

export function FacultyClassDetailView({ classId }: Props) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const facultyId = resolveFacultyId(user);
  const [classInfo, setClassInfo] = useState<AdminClass | null>(null);
  const [classLoading, setClassLoading] = useState(true);
  const [classError, setClassError] = useState('');
  const [result, setResult] = useState<FacultyClassEvaluationPage | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const actionLock = useRef(false);

  useEffect(() => {
    if (!facultyId) return;
    let ignore = false;
    setClassLoading(true);
    setClassInfo(null);
    setClassError('');
    API_Shared.getClassDetails(classId)
      .then((detail) => {
        if (!ignore) setClassInfo(detail);
      })
      .catch((error) => {
        if (!ignore) setClassError(getUserFriendlyError(error, 'Không tải được thông tin lớp.'));
      })
      .finally(() => {
        if (!ignore) setClassLoading(false);
      });
    return () => { ignore = true; };
  }, [classId, facultyId]);

  useEffect(() => {
    if (!facultyId) return;
    let ignore = false;
    setPageLoading(true);
    setErrorMessage('');
    API_Faculty.getClassStudentEvaluations(classId, {
      page,
      limit: STUDENTS_PER_PAGE,
      search: searchTerm.trim(),
      status: statusFilter || undefined,
    })
      .then((response) => {
        if (ignore) return;
        const lastPage = Math.max(1, Math.ceil(response.total / response.limit));
        if (page > lastPage) setPage(lastPage);
        else setResult(response);
      })
      .catch((error) => {
        if (ignore) return;
        setResult(null);
        setErrorMessage(getUserFriendlyError(error, 'Không tải được danh sách sinh viên.'));
      })
      .finally(() => {
        if (!ignore) setPageLoading(false);
      });
    return () => { ignore = true; };
  }, [classId, facultyId, page, refresh, searchTerm, statusFilter]);

  const loading = classLoading || pageLoading || submitting;
  const students = result?.items ?? [];
  const total = result?.total ?? 0;
  const currentPage = result?.page ?? page;
  const limit = result?.limit ?? STUDENTS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const firstStudentIndex = (currentPage - 1) * limit;
  const totalStudents = result?.totalStudents ?? classInfo?.studentCount ?? 0;
  const approved = Boolean(result && totalStudents > 0 && result.approvedCount === totalStudents);
  const leader = classInfo?.classLeaders?.map((item) => item.fullName || item.username).filter(Boolean).join(', ');

  async function loadPrintData(): Promise<FacultyClassEvaluation[]> {
    const query = { limit: PRINT_PAGE_SIZE, search: searchTerm.trim(), status: statusFilter || undefined };
    const first = await API_Faculty.getClassStudentEvaluations(classId, { ...query, page: 1 });
    const pageCount = Math.ceil(first.total / first.limit);
    const remaining = await Promise.all(
      Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) =>
        API_Faculty.getClassStudentEvaluations(classId, { ...query, page: index + 2 }),
      ),
    );
    return [...first.items, ...remaining.flatMap((response) => response.items)];
  }

  const managedFaculty =
    (user as any)?.managedFaculty ||
    (user as any)?.managedFaculties?.[0] ||
    (user as any)?.faculty;
  const managedFacultyName = managedFaculty?.facultyName || managedFaculty?.name || 'Khoa được phân công';

  const handleFacultyApproveClass = async () => {
    if (actionLock.current || !result?.canSubmitToTrainingDepartment) return;

    actionLock.current = true;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await API_Admin.submitFacultyToTrainingDepartment(facultyId, { classId });
      setRefresh((value) => value + 1);
    } catch (error) {
      setErrorMessage(getUserFriendlyError(error, 'Không gửi được phiếu của lớp lên Phòng Đào tạo.'));
    } finally {
      actionLock.current = false;
      setSubmitting(false);
    }
  };

  if (!facultyId) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Tài khoản chưa được gán khoa</h2>
          <p className="text-sm text-gray-500 mb-6">Không thể tải dữ liệu thật khi tài khoản chưa có faculty assignment.</p>
          <button onClick={() => router.push('/faculty')} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
            <ArrowLeft size={16} /> Quay lại danh sách lớp
          </button>
        </div>
      </div>
    );
  }

  if (!classLoading && !classInfo) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy lớp</h2>
          <p className="text-sm text-gray-500 mb-6">
            Lớp với mã <strong>{classId}</strong> không có trong dữ liệu API của khoa đang đăng nhập.
          </p>
          {classError && <p className="text-sm font-medium text-rose-600 mb-4">{classError}</p>}
          <button onClick={() => router.push('/faculty')} className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700">
            <ArrowLeft size={16} /> Quay lại danh sách lớp
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push('/faculty')}
          className="group inline-flex cursor-pointer items-center gap-2 self-start text-sm font-medium text-gray-500 transition hover:text-brand-primary"
        >
          <ArrowLeft size={16} className="transition group-hover:-translate-x-0.5" />
          Quay lại danh sách lớp
        </button>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-secondary">
              <Building2 size={16} />
              {managedFacultyName}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết lớp {classInfo?.name || classId}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Lớp trưởng: <span className="font-semibold text-gray-700">{leader || '—'}</span>
              {' · '}Đã nộp: <span className="font-semibold text-gray-700">{result?.submittedCount ?? 0}/{totalStudents} sinh viên</span>
            </p>
          </div>

          {result?.canSubmitToTrainingDepartment && (
            <button
              type="button"
              disabled={loading}
              onClick={handleFacultyApproveClass}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              <FileCheck size={16} />
              Gửi PĐT
            </button>
          )}
          {approved && (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold shrink-0">
              <Check size={15} />
              Đã gửi PĐT
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/50">
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã SV..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="submitted">Chờ Lớp trưởng duyệt</option>
                <option value="class_leader_approved">Chờ CVHT duyệt</option>
                <option value="class_approved">Chờ Khoa duyệt</option>
                <option value="faculty_approved">Đã gửi PĐT</option>
                <option value="finalized">PĐT đã duyệt</option>
                <option value="rejected">Trả về</option>
                <option value="draft">Chưa nộp</option>
              </select>
            </div>
          </div>

          <div className="self-end sm:self-auto">
            <PrintButton
              title={`DANH SÁCH PHIẾU LỚP ${classInfo?.name || classId}`}
              subtitle={`${managedFacultyName} | Dữ liệu API`}
              label="In danh sách"
              signatures={{ leftLabel: 'Cố vấn học tập (CVHT)', rightLabel: 'Trưởng Khoa' }}
              data={students}
              loadData={loadPrintData}
              disabled={loading || !result}
              columns={[
                { header: 'Mã SV', accessorKey: 'code' },
                { header: 'Họ và tên', accessorKey: 'name' },
                { header: 'Điểm', accessorKey: 'score', align: 'center', render: (s) => (s.score ?? '-') },
                { header: 'Xếp loại', align: 'center', render: (s) => s.rank ?? '-' },
                { header: 'Trạng thái', align: 'left', render: (s) => getRawStatusLabel(s.status) },
                { header: 'Ngày nộp', render: (s) => formatSubmissionDate(s.submittedAt) },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                <th className="py-3.5 px-4">Mã SV</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4 text-center">Điểm</th>
                <th className="py-3.5 px-4 text-center">Xếp loại</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày nộp</th>
                <th className="py-3.5 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Không có dữ liệu sinh viên từ API.</td></tr>
              ) : students.map((st) => (
                <tr key={st.id} className="transition-colors hover:bg-brand-secondary/5">
                  <td className="py-3.5 px-4 font-mono font-semibold text-gray-700">{st.code}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-900">{st.name}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-brand-secondary">{st.score ?? '-'}</td>
                  <td className="py-3.5 px-4 text-center">
                    {st.rank ? <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">{st.rank}</span> : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-3.5 px-4">{renderStatusBadge(st.status)}</td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{formatSubmissionDate(st.submittedAt)}</td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      type="button"
                      disabled={st.status === 'not_submitted' && !st.evaluationId}
                      onClick={() => {
                        const targetId = st.evaluationId || st.id;
                        router.push(`/faculty/${classId}/${targetId}`);
                      }}
                      className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Eye size={13} />
                      {st.status === 'not_submitted' && !st.evaluationId ? 'Chưa nộp' : 'Chấm điểm'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && students.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50/50 px-4 py-3 text-sm text-gray-600">
            <p aria-live="polite">
              Hiển thị {firstStudentIndex + 1}–{firstStudentIndex + students.length} / {total} sinh viên
            </p>
            {totalPages > 1 && (
              <nav aria-label="Phân trang danh sách sinh viên" className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Trang trước"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronLeft size={16} aria-hidden="true" />
                </button>
                <span>Trang {currentPage} / {totalPages}</span>
                <button
                  type="button"
                  aria-label="Trang sau"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="rounded-lg border border-gray-200 bg-white p-2 hover:bg-gray-100 disabled:opacity-40"
                >
                  <ChevronRight size={16} aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
