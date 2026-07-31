'use client';

import { useState } from 'react';
import {
  Users,
  GraduationCap,
  CheckCircle2,
  Clock,
  Filter,
  Search,
} from 'lucide-react';
import { MOCK_CLASS_INFO, MOCK_STUDENTS } from '@/utils/mockClassLeaderData';
import { StudentConfirmTable } from '@/components/class_leader/StudentConfirmTable';
import { PrintButton } from '@/components/common/PrintButton';
import { useToast } from '@/components/common/ToastProvider';
import type { ClassLeaderStudent, StudentStatusFilter } from '@/types/class_leader';

export function ClassLeaderDashboard() {
  const toast = useToast();
  const [students, setStudents] = useState<ClassLeaderStudent[]>(MOCK_STUDENTS);
  const [filterStatus, setFilterStatus] = useState<StudentStatusFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [confirming, setConfirming] = useState(false);

  const classInfo = MOCK_CLASS_INFO;

  const handleConfirm = (studentId: string) => {
    setConfirming(true);
    setTimeout(() => {
      setStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, status: 'confirmed' } : s))
      );
      toast.success('Đã xác nhận sinh viên tham gia buổi họp lớp.');
      setConfirming(false);
    }, 600);
  };

  const handleConfirmAll = () => {
    setConfirming(true);
    setTimeout(() => {
      setStudents((prev) =>
        prev.map((s) => (s.status === 'submitted' ? { ...s, status: 'confirmed' } : s))
      );
      toast.success('Đã xác nhận tất cả sinh viên đã nộp phiếu.');
      setConfirming(false);
    }, 800);
  };

  const filteredStudents = students.filter((s) => {
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const kw = keyword.trim().toLowerCase();
    const matchKw =
      !kw ||
      s.fullName.toLowerCase().includes(kw) ||
      s.code.toLowerCase().includes(kw);
    return matchStatus && matchKw;
  });

  const totalSubmitted = students.filter((s) => s.status === 'submitted' || s.status === 'confirmed').length;
  const totalConfirmed = students.filter((s) => s.status === 'confirmed').length;
  const totalNotSubmitted = students.filter((s) => s.status === 'not_submitted').length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6">

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="ui-page-title">Xác nhận buổi họp lớp</h1>
          <p className="mt-1 text-sm text-[#868E96]">
            {classInfo.name} &mdash; {classInfo.semester}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PrintButton label="In danh sách" title="In danh sách sinh viên" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF2FF] text-[#3B5BDB]">
            <Users size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#1A1B1E]">{students.length}</p>
            <p className="text-xs font-medium text-[#868E96]">Tổng sinh viên</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <GraduationCap size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#1A1B1E]">{totalSubmitted}</p>
            <p className="text-xs font-medium text-[#868E96]">Đã nộp phiếu</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#1A1B1E]">{totalConfirmed}</p>
            <p className="text-xs font-medium text-[#868E96]">Đã xác nhận</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#1A1B1E]">{totalNotSubmitted}</p>
            <p className="text-xs font-medium text-[#868E96]">Chưa nộp</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ADB5BD]" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã sinh viên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-lg border border-[#DEE2E6] py-2 pl-9 pr-4 text-sm focus:border-[#3B5BDB] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/10"
          />
        </div>
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-[#868E96]" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as StudentStatusFilter)}
            className="rounded-lg border border-[#DEE2E6] px-3 py-2 text-sm text-[#495057] focus:border-[#3B5BDB] focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="submitted">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="not_submitted">Chưa nộp</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <StudentConfirmTable
        students={filteredStudents}
        onConfirm={handleConfirm}
        onConfirmAll={handleConfirmAll}
        confirming={confirming}
        filterStatus={filterStatus}
      />

      {/* Print-only styles */}
      <style jsx global>{`
        @media print {
          body > * { display: none !important; }
          .print-area { display: block !important; }
        }
      `}</style>
    </div>
  );
}
