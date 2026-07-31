'use client';

import { useState } from 'react';
import {
  Building2,
  CheckCheck,
  Clock,
  XCircle,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import { MOCK_FACULTY_INFO, MOCK_FACULTY_CLASSES } from '@/utils/mockFacultyData';
import { ClassApprovalTable } from '@/components/faculty/ClassApprovalTable';
import { PrintButton } from '@/components/common/PrintButton';
import { useToast } from '@/components/common/ToastProvider';
import type { FacultyClass, ClassFilterStatus } from '@/types/faculty';

export function FacultyDashboard() {
  const toast = useToast();
  const [classes, setClasses] = useState<FacultyClass[]>(MOCK_FACULTY_CLASSES);
  const [filterStatus, setFilterStatus] = useState<ClassFilterStatus>('all');
  const [keyword, setKeyword] = useState('');
  const [approving, setApproving] = useState(false);

  const facultyInfo = MOCK_FACULTY_INFO;

  const handleApprove = (classId: string) => {
    setApproving(true);
    setTimeout(() => {
      setClasses((prev) =>
        prev.map((c) => (c.id === classId ? { ...c, facultyApproved: true } : c))
      );
      toast.success('Đã duyệt lớp thành công. Kết quả đã được gửi lên Phòng Đào tạo.');
      setApproving(false);
    }, 700);
  };

  const handleApproveAll = () => {
    setApproving(true);
    setTimeout(() => {
      setClasses((prev) =>
        prev.map((c) => (c.councilApproved && !c.facultyApproved ? { ...c, facultyApproved: true } : c))
      );
      toast.success('Đã duyệt tất cả các lớp đủ điều kiện.');
      setApproving(false);
    }, 900);
  };

  const handleExportMock = () => {
    toast.success('Đã xuất báo cáo tổng hợp (Mock). File sẽ được tải về.');
  };

  const filteredClasses = classes.filter((c) => {
    let matchStatus = true;
    if (filterStatus === 'pending_council') matchStatus = !c.councilApproved;
    else if (filterStatus === 'pending_faculty') matchStatus = c.councilApproved && !c.facultyApproved;
    else if (filterStatus === 'approved') matchStatus = c.facultyApproved;

    const kw = keyword.trim().toLowerCase();
    const matchKw = !kw || c.name.toLowerCase().includes(kw) || c.code.toLowerCase().includes(kw);
    return matchStatus && matchKw;
  });

  const totalApproved = classes.filter((c) => c.facultyApproved).length;
  const totalPendingFaculty = classes.filter((c) => c.councilApproved && !c.facultyApproved).length;
  const totalPendingCouncil = classes.filter((c) => !c.councilApproved).length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6">

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="ui-page-title">Duyệt điểm rèn luyện</h1>
          <p className="mt-1 text-sm text-[#868E96]">
            {facultyInfo.name} &mdash; {facultyInfo.semester}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportMock}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#DEE2E6] bg-white px-4 py-2.5 text-sm font-semibold text-[#495057] transition hover:border-[#3B5BDB] hover:text-[#3B5BDB]"
          >
            <Download size={16} />
            Xuất báo cáo
          </button>
          <PrintButton label="In báo cáo" title="In báo cáo tổng hợp Khoa" />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EDF2FF] text-[#3B5BDB]">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#1A1B1E]">{classes.length}</p>
            <p className="text-xs font-medium text-[#868E96]">Tổng số lớp</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCheck size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#1A1B1E]">{totalApproved}</p>
            <p className="text-xs font-medium text-[#868E96]">Đã duyệt</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#1A1B1E]">{totalPendingFaculty}</p>
            <p className="text-xs font-medium text-[#868E96]">Chờ Khoa duyệt</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-[#E9ECEF] bg-white px-4 py-3 shadow-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
            <XCircle size={20} />
          </div>
          <div>
            <p className="text-lg font-extrabold text-[#1A1B1E]">{totalPendingCouncil}</p>
            <p className="text-xs font-medium text-[#868E96]">Chờ CVHT chốt</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ADB5BD]" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã lớp..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-lg border border-[#DEE2E6] py-2 pl-9 pr-4 text-sm focus:border-[#3B5BDB] focus:outline-none focus:ring-2 focus:ring-[#3B5BDB]/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-[#868E96]" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ClassFilterStatus)}
            className="rounded-lg border border-[#DEE2E6] px-3 py-2 text-sm text-[#495057] focus:border-[#3B5BDB] focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="approved">Đã duyệt</option>
            <option value="pending_faculty">Chờ Khoa duyệt</option>
            <option value="pending_council">Chờ CVHT chốt</option>
          </select>
        </div>
      </div>

      {/* Approval Table */}
      <ClassApprovalTable
        classes={filteredClasses}
        onApprove={handleApprove}
        onApproveAll={handleApproveAll}
        approving={approving}
        filterStatus={filterStatus}
      />
    </div>
  );
}
