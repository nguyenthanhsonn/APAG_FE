'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Check,
  FileCheck,
  BookOpen,
} from 'lucide-react';
import { PrintButton } from '@/components/common/PrintButton';
import { API_Admin } from '@/api/API_Admin';
import { useAuthStore } from '@/store/authStore';
import type { AdminEvaluationItem } from '@/types';
import { FacultyStudentRecord, mapEvaluationToFacultyStudent, toArray } from '@/utils/facultyEvaluationData';

function resolveClassId(user: any): string {
  const firstClass = user?.managedClasses?.[0];
  return firstClass?.classId || firstClass?.id || user?.classId || user?.class?.id || '';
}

function resolveClassName(user: any): string {
  const firstClass = user?.managedClasses?.[0];
  return firstClass?.className || firstClass?.name || firstClass?.classCode || firstClass?.code || 'Lớp được phân công';
}

export function ClassLeaderDashboard() {
  const user = useAuthStore((state) => state.user);
  const classId = resolveClassId(user);
  const className = resolveClassName(user);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [students, setStudents] = useState<FacultyStudentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const loadStudents = useCallback(async () => {
    if (!classId) {
      setStudents([]);
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      const result = await API_Admin.getClassLeaderEvaluations(classId, { limit: 200 });
      const evaluations = toArray<AdminEvaluationItem>(result);
      setStudents(evaluations.map(mapEvaluationToFacultyStudent));
    } catch (err: any) {
      setStudents([]);
      setErrorMessage(err?.userMessage || err?.message || 'Không tải được danh sách phiếu của lớp.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    void loadStudents();
  }, [loadStudents]);

  const handleApprove = async (student: FacultyStudentRecord) => {
    setLoading(true);
    setErrorMessage('');
    try {
      await API_Admin.approveClassLeaderEvaluation(student.evaluationId, student.score);
      await loadStudents();
    } catch (err: any) {
      setErrorMessage(err?.userMessage || err?.message || 'Không duyệt được phiếu.');
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [students, searchTerm, statusFilter]);

  const totalCount = students.length;
  const approvedCount = students.filter((s) => s.status === 'APPROVED').length;
  const waitingCount = students.filter((s) => s.rawStatus === 'submitted').length;
  const notSubmittedCount = students.filter((s) => s.status === 'NOT_SUBMITTED').length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-brand-secondary">
            <BookOpen size={16} /> {className}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý & Duyệt điểm rèn luyện cấp Lớp</h1>
          <p className="text-sm text-gray-500 mt-1">Dữ liệu được lấy trực tiếp từ API theo lớp trưởng đang đăng nhập.</p>
        </div>
      </div>

      {errorMessage && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{errorMessage}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4"><div className="p-3 bg-brand-secondary/10 text-brand-secondary rounded-xl"><Users size={22} /></div><div><p className="text-xs text-gray-500 font-medium">Số phiếu</p><p className="text-xl font-bold text-gray-900">{totalCount} Phiếu</p></div></div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4"><div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 size={22} /></div><div><p className="text-xs text-gray-500 font-medium">Đã duyệt</p><p className="text-xl font-bold text-emerald-600">{approvedCount} Phiếu</p></div></div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4"><div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={22} /></div><div><p className="text-xs text-gray-500 font-medium">Chờ Lớp duyệt</p><p className="text-xl font-bold text-amber-600">{waitingCount} Phiếu</p></div></div>
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4"><div className="p-3 bg-rose-50 text-rose-600 rounded-xl"><AlertCircle size={22} /></div><div><p className="text-xs text-gray-500 font-medium">Chưa nộp phiếu</p><p className="text-xl font-bold text-rose-600">{notSubmittedCount} Phiếu</p></div></div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3 justify-between items-center bg-gray-50/50">
          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Tìm theo tên hoặc mã SV..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/20" />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-primary focus:outline-none">
                <option value="ALL">Tất cả trạng thái</option>
                <option value="WAITING_APPROVAL">Đang trong luồng</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Trả về</option>
                <option value="NOT_SUBMITTED">Chưa nộp</option>
              </select>
            </div>
          </div>

          <div className="self-end sm:self-auto">
            <PrintButton
              title={`DANH SÁCH PHIẾU ${className}`}
              subtitle="Hệ thống Đánh giá Rèn luyện Sinh viên"
              data={filteredStudents}
              columns={[
                { header: 'Mã SV', accessorKey: 'code' },
                { header: 'Họ và tên', accessorKey: 'name' },
                { header: 'Điểm', accessorKey: 'score', align: 'center', render: (s) => (s.score > 0 ? s.score : '-') },
                { header: 'Xếp loại', accessorKey: 'rank', align: 'center' },
                { header: 'Trạng thái', align: 'left', render: (s) => s.rawStatus },
                { header: 'Ngày nộp', accessorKey: 'date' },
              ]}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase"><th className="py-3.5 px-4">Mã SV</th><th className="py-3.5 px-4">Họ và tên</th><th className="py-3.5 px-4 text-center">Điểm</th><th className="py-3.5 px-4 text-center">Xếp loại</th><th className="py-3.5 px-4">Trạng thái</th><th className="py-3.5 px-4">Ngày nộp</th><th className="py-3.5 px-4 text-right">Thao tác</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Đang tải dữ liệu...</td></tr> : !classId ? <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Tài khoản này chưa được gán lớp trưởng cho lớp nào.</td></tr> : filteredStudents.length === 0 ? <tr><td colSpan={7} className="py-12 text-center text-sm text-gray-400">Không có dữ liệu phiếu từ API.</td></tr> : filteredStudents.map((st) => (
                <tr key={st.evaluationId} className="transition-colors hover:bg-brand-secondary/5">
                  <td className="py-3.5 px-4 font-mono font-semibold text-gray-700">{st.code}</td><td className="py-3.5 px-4 font-medium text-gray-900">{st.name}</td><td className="py-3.5 px-4 text-center font-bold text-brand-secondary">{st.score > 0 ? st.score : '-'}</td><td className="py-3.5 px-4 text-center">{st.rank !== '-' ? <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">{st.rank}</span> : '-'}</td>
                  <td className="py-3.5 px-4">{st.rawStatus === 'submitted' ? <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200"><Clock size={12} /> Chờ Lớp duyệt</span> : st.status === 'APPROVED' ? <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200"><Check size={12} /> Đã duyệt</span> : st.status === 'REJECTED' ? <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 rounded-full border border-rose-200"><AlertCircle size={12} /> Trả về</span> : <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">{st.rawStatus || 'Chưa nộp'}</span>}</td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{st.date}</td><td className="py-3.5 px-4 text-right"><div className="flex items-center justify-end gap-2">{st.rawStatus === 'submitted' && <button type="button" disabled={loading || st.score <= 0} onClick={() => handleApprove(st)} className="flex cursor-pointer items-center gap-1 rounded-lg bg-brand-primary px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"><FileCheck size={13} /> Duyệt</button>}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
