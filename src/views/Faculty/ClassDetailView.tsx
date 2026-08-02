'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Check,
  FileCheck,
} from 'lucide-react';
import { PrintButton } from '@/components/common/PrintButton';
import { API_Admin } from '@/api/API_Admin';
import { useAuthStore } from '@/store/authStore';
import type { AdminEvaluationItem } from '@/types';
import {
  FacultyClassRecord,
  FacultyStudentRecord,
  groupFacultyEvaluationsByClass,
  resolveFacultyId,
  toArray,
} from '@/utils/facultyEvaluationData';

interface Props {
  classId: string;
}

const STATUS_LABEL: Record<string, string> = {
  APPROVED: 'Đã duyệt',
  WAITING_APPROVAL: 'Đang trong luồng duyệt',
  REJECTED: 'Trả về',
  NOT_SUBMITTED: 'Chưa nộp',
};

export function FacultyClassDetailView({ classId }: Props) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const facultyId = resolveFacultyId(user);
  const [classInfo, setClassInfo] = useState<FacultyClassRecord | null>(null);
  const [students, setStudents] = useState<FacultyStudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadClassDetail = useCallback(async () => {
    if (!facultyId) {
      setClassInfo(null);
      setStudents([]);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const result = await API_Admin.getFacultyEvaluations(facultyId, { limit: 200 });
      const evaluations = toArray<AdminEvaluationItem>(result);
      const grouped = groupFacultyEvaluationsByClass(evaluations);
      const selectedClass = grouped.find((item) => item.id === classId) || null;

      setClassInfo(selectedClass);
      setStudents(selectedClass?.evaluations ?? []);
    } catch (err: any) {
      setClassInfo(null);
      setStudents([]);
      setErrorMessage(err?.userMessage || err?.message || 'Không tải được dữ liệu lớp từ API.');
    } finally {
      setLoading(false);
    }
  }, [facultyId, classId]);

  useEffect(() => {
    void loadClassDetail();
  }, [loadClassDetail]);

  const filteredStudents = useMemo(() => students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [students, searchTerm, statusFilter]);

  const totalCount = students.length;
  const approvedCount = students.filter((s) => s.status === 'APPROVED').length;
  const waitingCount = students.filter((s) => s.status === 'WAITING_APPROVAL').length;
  const notSubmittedCount = students.filter((s) => s.status === 'NOT_SUBMITTED').length;
  const rejectedCount = students.filter((s) => s.status === 'REJECTED').length;
  const classStatus = classInfo?.status ?? 'IN_PROGRESS';
  const managedFacultyName = (user as any)?.managedFaculties?.[0]?.facultyName || (user as any)?.faculty?.name || 'Khoa được phân công';

  const handleFacultyApproveClass = async () => {
    const pendingEvaluations = students.filter((item) =>
      ['advisor_approved', 'faculty_rejected'].includes(item.rawStatus),
    );

    if (pendingEvaluations.length === 0) return;

    setLoading(true);
    setErrorMessage('');
    try {
      await Promise.all(
        pendingEvaluations.map((item) => API_Admin.approveFacultyEvaluation(item.evaluationId)),
      );
      await loadClassDetail();
    } catch (err: any) {
      setErrorMessage(err?.userMessage || err?.message || 'Không duyệt được phiếu của lớp.');
      setLoading(false);
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

  if (!loading && !classInfo) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy lớp</h2>
          <p className="text-sm text-gray-500 mb-6">
            Lớp với mã <strong>{classId}</strong> không có trong dữ liệu API của khoa đang đăng nhập.
          </p>
          {errorMessage && <p className="text-sm font-medium text-rose-600 mb-4">{errorMessage}</p>}
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
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết lớp {classInfo?.className || classId}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Lớp trưởng: <span className="font-semibold text-gray-700">{classInfo?.leader || '—'}</span>
              {' · '}Số phiếu: <span className="font-semibold text-gray-700">{totalCount}</span>
            </p>
          </div>

          {classStatus === 'PENDING_FACULTY' && (
            <button
              type="button"
              disabled={loading}
              onClick={handleFacultyApproveClass}
              className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-brand-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50"
            >
              <FileCheck size={16} />
              Duyệt toàn lớp
            </button>
          )}
          {classStatus === 'FACULTY_APPROVED' && (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold shrink-0">
              <Check size={15} />
              Khoa đã duyệt
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-brand-secondary/10 text-brand-secondary rounded-xl"><Users size={22} /></div>
          <div><p className="text-xs text-gray-500 font-medium">Số phiếu</p><p className="text-xl font-bold text-gray-900">{totalCount} Phiếu</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={22} /></div>
          <div><p className="text-xs text-gray-500 font-medium">Đã duyệt</p><p className="text-xl font-bold text-emerald-600">{approvedCount} Phiếu</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={22} /></div>
          <div><p className="text-xs text-gray-500 font-medium">Đang trong luồng</p><p className="text-xl font-bold text-amber-600">{waitingCount} Phiếu</p></div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle size={22} /></div>
          <div><p className="text-xs text-gray-500 font-medium">Chưa nộp / Trả về</p><p className="text-xl font-bold text-rose-600">{notSubmittedCount + rejectedCount} Phiếu</p></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/50">
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên hoặc mã SV..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="WAITING_APPROVAL">Đang trong luồng</option>
                <option value="REJECTED">Trả về</option>
                <option value="NOT_SUBMITTED">Chưa nộp</option>
              </select>
            </div>
          </div>

          <div className="self-end sm:self-auto">
            <PrintButton
              title={`DANH SÁCH PHIẾU LỚP ${classInfo?.className || classId}`}
              subtitle={`${managedFacultyName} | Dữ liệu API`}
              label="In danh sách"
              summaryStats={[
                { label: 'Số phiếu', value: `${totalCount} Phiếu` },
                { label: 'Đã duyệt', value: `${approvedCount} Phiếu` },
                { label: 'Đang trong luồng', value: `${waitingCount} Phiếu` },
                { label: 'Chưa nộp / Trả về', value: `${notSubmittedCount + rejectedCount} Phiếu` },
              ]}
              signatures={{ leftLabel: 'Cố vấn học tập (CVHT)', rightLabel: 'Trưởng Khoa' }}
              data={filteredStudents}
              columns={[
                { header: 'Mã SV', accessorKey: 'code' },
                { header: 'Họ và tên', accessorKey: 'name' },
                { header: 'Điểm', accessorKey: 'score', align: 'center', render: (s) => (s.score > 0 ? s.score : '-') },
                { header: 'Xếp loại', accessorKey: 'rank', align: 'center' },
                { header: 'Trạng thái', align: 'left', render: (s) => STATUS_LABEL[s.status] ?? s.status },
                { header: 'Ngày nộp', accessorKey: 'date' },
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : filteredStudents.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-sm text-gray-400">Không có dữ liệu sinh viên từ API.</td></tr>
              ) : filteredStudents.map((st) => (
                <tr key={st.evaluationId} className="transition-colors hover:bg-brand-secondary/5">
                  <td className="py-3.5 px-4 font-mono font-semibold text-gray-700">{st.code}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-900">{st.name}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-brand-secondary">{st.score > 0 ? st.score : '-'}</td>
                  <td className="py-3.5 px-4 text-center">
                    {st.rank !== '-' ? <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">{st.rank}</span> : <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    {st.status === 'APPROVED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200"><Check size={12} /> Đã duyệt</span>}
                    {st.status === 'WAITING_APPROVAL' && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200"><Clock size={12} /> Đang trong luồng</span>}
                    {st.status === 'REJECTED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 rounded-full border border-rose-200"><AlertCircle size={12} /> Trả về</span>}
                    {st.status === 'NOT_SUBMITTED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">Chưa nộp</span>}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{st.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
