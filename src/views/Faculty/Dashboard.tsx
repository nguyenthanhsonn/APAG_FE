'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  FileCheck,
} from 'lucide-react';
import { PrintButton } from '@/components/common/PrintButton';
import { API_Admin } from '@/api/API_Admin';
import { useAuthStore } from '@/store/authStore';
import type { AdminClass, AdminEvaluationItem, AdminMajor } from '@/types';
import {
  FacultyClassRecord,
  groupFacultyEvaluationsByClass,
  resolveFacultyId,
  toArray,
} from '@/utils/facultyEvaluationData';
import { getUserFriendlyError } from '@/utils/errorHelper';

export function FacultyDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const facultyId = resolveFacultyId(user);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classes, setClasses] = useState<FacultyClassRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadClasses = useCallback(async () => {
    if (!facultyId) {
      setClasses([]);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const [majorsResult, evaluationsResult] = await Promise.all([
        API_Admin.getFacultyMajors(facultyId, { page: 1, limit: 1000, isActive: true, includeDeleted: false }),
        API_Admin.getFacultyEvaluations(facultyId, { limit: 1000 }),
      ]);
      const majors = toArray<AdminMajor>(majorsResult);
      const classesByMajor = await Promise.all(
        majors.map((major) =>
          API_Admin.getMajorClasses(major.id, { page: 1, limit: 1000, isActive: true, includeDeleted: false }),
        ),
      );
      const facultyClasses = classesByMajor.flatMap((result) => toArray<AdminClass>(result));
      const evaluations = toArray<AdminEvaluationItem>(evaluationsResult);
      const recordsByClassId = new Map(groupFacultyEvaluationsByClass(evaluations).map((record) => [record.id, record]));

      setClasses(
        facultyClasses.map((classItem) => {
          const record = recordsByClassId.get(classItem.id);
          if (record) {
            return {
              ...record,
              className: classItem.name || classItem.code || record.className,
              leader:
                classItem.classLeaders?.map((item) => item.fullName || item.username).filter(Boolean).join(', ') ||
                record.leader,
              totalStudents: classItem.studentCount ?? record.totalStudents,
            };
          }

          return {
            id: classItem.id,
            className: classItem.name || classItem.code || 'Lớp chưa xác định',
            leader:
              classItem.classLeaders?.map((item) => item.fullName || item.username).filter(Boolean).join(', ') || '—',
            totalStudents: classItem.studentCount ?? 0,
            submittedCount: 0,
            approvedCount: 0,
            status: 'IN_PROGRESS',
            date: '-',
            evaluations: [],
          };
        }),
      );
    } catch (err: any) {
      setClasses([]);
      setErrorMessage(getUserFriendlyError(err, 'Không tải được danh sách lớp của khoa.'));
    } finally {
      setLoading(false);
    }
  }, [facultyId]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  const handleFacultyApprove = async (record: FacultyClassRecord) => {
    const pendingEvaluations = record.evaluations.filter((item) =>
      ['advisor_approved', 'faculty_rejected'].includes(item.rawStatus),
    );

    if (pendingEvaluations.length === 0) return;

    setLoading(true);
    setErrorMessage('');
    try {
      await Promise.all(
        pendingEvaluations.map((item) => API_Admin.approveFacultyEvaluation(item.evaluationId)),
      );
      await loadClasses();
    } catch (err: any) {
      setErrorMessage(getUserFriendlyError(err, 'Không duyệt được phiếu của lớp.'));
      setLoading(false);
    }
  };

  const filteredClasses = useMemo(() => classes.filter((c) => {
    const matchesSearch =
      c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.leader.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [classes, searchTerm, statusFilter]);

  const totalClasses = classes.length;
  const approvedClasses = classes.filter((c) => c.status === 'FACULTY_APPROVED').length;
  const pendingClasses = classes.filter((c) => c.status === 'PENDING_FACULTY').length;
  const managedFacultyName = (user as any)?.managedFaculties?.[0]?.facultyName || (user as any)?.faculty?.name || 'Khoa được phân công';

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-secondary">
            <Building2 size={16} /> {managedFacultyName}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ban/Khoa Xét Duyệt Đánh Giá Rèn Luyện</h1>
          <p className="text-sm text-gray-500 mt-1">Dữ liệu được lấy trực tiếp từ hệ thống theo tài khoản đang đăng nhập.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-brand-secondary/10 text-brand-secondary rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng số lớp có phiếu</p>
            <p className="text-2xl font-bold text-gray-900">{totalClasses} Lớp</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Khoa đã duyệt hoàn tất</p>
            <p className="text-2xl font-bold text-emerald-600">{approvedClasses} Lớp</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Chờ Khoa thẩm định</p>
            <p className="text-2xl font-bold text-amber-600">{pendingClasses} Lớp</p>
          </div>
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
                placeholder="Tìm theo tên lớp hoặc lớp trưởng..."
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
                <option value="PENDING_FACULTY">Chờ Khoa duyệt</option>
                <option value="FACULTY_APPROVED">Khoa đã duyệt</option>
                <option value="IN_PROGRESS">Đang xử lý cấp lớp</option>
              </select>
            </div>
          </div>

          <div className="self-end sm:self-auto">
            <PrintButton
              title="BÁO CÁO TỔNG HỢP ĐÁNH GIÁ RÈN LUYỆN"
              subtitle={managedFacultyName}
              label="In danh sách"
              summaryStats={[
                { label: 'Tổng số lớp', value: `${totalClasses} Lớp` },
                { label: 'Khoa đã duyệt', value: `${approvedClasses} Lớp` },
                { label: 'Chờ Khoa thẩm định', value: `${pendingClasses} Lớp` },
              ]}
              signatures={{ leftLabel: 'Người lập báo cáo', rightLabel: 'Trưởng Khoa' }}
              data={filteredClasses}
              columns={[
                { header: 'Tên Lớp', accessorKey: 'className' },
                { header: 'Lớp trưởng', accessorKey: 'leader' },
                { header: 'Sĩ số', accessorKey: 'totalStudents', align: 'center', render: (c) => `${c.totalStudents} SV` },
                { header: 'Đã nộp phiếu', align: 'center', render: (c) => `${c.submittedCount}/${c.totalStudents}` },
                {
                  header: 'Trạng thái Khoa',
                  align: 'left',
                  render: (c) => {
                    if (c.status === 'FACULTY_APPROVED') return 'Khoa đã duyệt';
                    if (c.status === 'PENDING_FACULTY') return 'Chờ Khoa duyệt';
                    return 'Đang làm việc cấp Lớp';
                  },
                },
                { header: 'Ngày chuyển', accessorKey: 'date' },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                <th className="py-3.5 px-4">Tên Lớp</th>
                <th className="py-3.5 px-4">Lớp trưởng</th>
                <th className="py-3.5 px-4 text-center">Sĩ số</th>
                <th className="py-3.5 px-4 text-center">Đã nộp phiếu</th>
                <th className="py-3.5 px-4">Trạng thái Khoa</th>
                <th className="py-3.5 px-4">Ngày chuyển</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Đang tải dữ liệu...</td></tr>
              ) : !facultyId ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Tài khoản này chưa được gán khoa phụ trách.</td></tr>
              ) : filteredClasses.length === 0 ? (
                <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Không có dữ liệu lớp từ API.</td></tr>
              ) : filteredClasses.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-brand-secondary/5">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{c.className}</td>
                  <td className="py-3.5 px-4 text-gray-700">{c.leader}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{c.totalStudents} SV</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-brand-secondary">{c.submittedCount}/{c.totalStudents}</td>
                  <td className="py-3.5 px-4">
                    {c.status === 'FACULTY_APPROVED' && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200"><Check size={12} /> Khoa đã duyệt</span>}
                    {c.status === 'PENDING_FACULTY' && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200"><Clock size={12} /> Chờ Khoa duyệt</span>}
                    {c.status === 'IN_PROGRESS' && <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">Đang làm việc cấp Lớp</span>}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{c.date}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.status === 'PENDING_FACULTY' && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => handleFacultyApprove(c)}
                          className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-primary px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                        >
                          <FileCheck size={13} /> Duyệt toàn lớp
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => router.push(`/faculty/${c.id}`)}
                        title="Xem chi tiết lớp"
                        className="cursor-pointer rounded-lg p-1.5 text-gray-400 transition hover:bg-brand-secondary/10 hover:text-brand-secondary"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
