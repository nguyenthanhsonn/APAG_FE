'use client';

import React, { useState } from 'react';
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
import { FACULTY_CLASSES, STUDENTS_BY_CLASS, StudentRecord } from '@/utils/mockFacultyData';
import { PrintButton } from '@/components/common/PrintButton';

interface Props {
  classId: string;
}

const STATUS_LABEL: Record<string, string> = {
  APPROVED: 'Đã duyệt',
  WAITING_APPROVAL: 'Chờ Lớp duyệt',
  REJECTED: 'Trả về',
  NOT_SUBMITTED: 'Chưa nộp',
};

export function FacultyClassDetailView({ classId }: Props) {
  const router = useRouter();

  // Tìm thông tin lớp từ mock data
  const classInfo = FACULTY_CLASSES.find((c) => c.id === classId);
  const initialStudents: StudentRecord[] = STUDENTS_BY_CLASS[classId] ?? [];

  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [classStatus, setClassStatus] = useState(classInfo?.status ?? 'IN_PROGRESS');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Nếu classId không tồn tại
  if (!classInfo) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center gap-6 p-6">
        <div className="text-center">
          <p className="text-6xl mb-4">🔍</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy lớp</h2>
          <p className="text-sm text-gray-500 mb-6">
            Lớp với mã <strong>{classId}</strong> không tồn tại trong hệ thống.
          </p>
          <button
            onClick={() => router.push('/faculty')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition cursor-pointer"
          >
            <ArrowLeft size={16} /> Quay lại danh sách lớp
          </button>
        </div>
      </div>
    );
  }

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = students.length;
  const approvedCount = students.filter((s) => s.status === 'APPROVED').length;
  const waitingCount = students.filter((s) => s.status === 'WAITING_APPROVAL').length;
  const notSubmittedCount = students.filter((s) => s.status === 'NOT_SUBMITTED').length;
  const rejectedCount = students.filter((s) => s.status === 'REJECTED').length;

  const handleFacultyApproveClass = () => {
    setClassStatus('FACULTY_APPROVED');
    // Tất cả sinh viên đang "WAITING_APPROVAL" sẽ chuyển sang "APPROVED"
    setStudents((prev) =>
      prev.map((s) => (s.status === 'WAITING_APPROVAL' ? { ...s, status: 'APPROVED' } : s))
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Back button + Header */}
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => router.push('/faculty')}
          className="self-start inline-flex items-center gap-2 text-sm text-gray-500 hover:text-teal-600 font-medium transition cursor-pointer group"
        >
          <ArrowLeft size={16} className="transition group-hover:-translate-x-0.5" />
          Quay lại danh sách lớp
        </button>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm mb-1">
              <Building2 size={16} />
              Khoa Công Nghệ Thông Tin • Học kỳ 2 (2025-2026)
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Chi tiết lớp {classInfo.className}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Lớp trưởng: <span className="font-semibold text-gray-700">{classInfo.leader}</span>
              {' · '}Sĩ số: <span className="font-semibold text-gray-700">{classInfo.totalStudents} SV</span>
            </p>
          </div>

          {/* Nút Duyệt toàn lớp — chỉ hiện khi đang PENDING_FACULTY */}
          {classStatus === 'PENDING_FACULTY' && (
            <button
              type="button"
              onClick={handleFacultyApproveClass}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-semibold text-sm transition cursor-pointer shadow-sm shrink-0"
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Sĩ số lớp</p>
            <p className="text-xl font-bold text-gray-900">{totalCount} SV</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Đã duyệt</p>
            <p className="text-xl font-bold text-emerald-600">{approvedCount} SV</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Clock size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Chờ Lớp duyệt</p>
            <p className="text-xl font-bold text-amber-600">{waitingCount} SV</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertCircle size={22} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Chưa nộp / Trả về</p>
            <p className="text-xl font-bold text-rose-600">{notSubmittedCount + rejectedCount} SV</p>
          </div>
        </div>
      </div>

      {/* Filter & Table Container */}
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
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-teal-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="WAITING_APPROVAL">Chờ Lớp duyệt</option>
                <option value="REJECTED">Trả về</option>
                <option value="NOT_SUBMITTED">Chưa nộp</option>
              </select>
            </div>
          </div>

          <div className="self-end sm:self-auto">
            <PrintButton
              title={`DANH SÁCH SINH VIÊN LỚP ${classInfo.className} – HỌC KỲ 2 (2025-2026)`}
              subtitle={`Lớp trưởng: ${classInfo.leader} | Khoa Công Nghệ Thông Tin`}
              label="In danh sách"
              summaryStats={[
                { label: 'Sĩ số', value: `${totalCount} SV` },
                { label: 'Đã duyệt', value: `${approvedCount} SV` },
                { label: 'Chờ duyệt', value: `${waitingCount} SV` },
                { label: 'Chưa nộp / Trả về', value: `${notSubmittedCount + rejectedCount} SV` },
              ]}
              signatures={{ leftLabel: 'Cố vấn học tập (CVHT)', rightLabel: 'Trưởng Khoa' }}
              data={filteredStudents}
              columns={[
                { header: 'Mã SV', accessorKey: 'code' },
                { header: 'Họ và tên', accessorKey: 'name' },
                {
                  header: 'Điểm tự đánh giá',
                  accessorKey: 'score',
                  align: 'center',
                  render: (s) => (s.score > 0 ? s.score : '-'),
                },
                { header: 'Xếp loại', accessorKey: 'rank', align: 'center' },
                {
                  header: 'Trạng thái',
                  align: 'left',
                  render: (s) => STATUS_LABEL[s.status] ?? s.status,
                },
                { header: 'Ngày nộp', accessorKey: 'date' },
              ]}
            />
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                <th className="py-3.5 px-4">Mã SV</th>
                <th className="py-3.5 px-4">Họ và tên</th>
                <th className="py-3.5 px-4 text-center">Điểm tự đánh giá</th>
                <th className="py-3.5 px-4 text-center">Xếp loại</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày nộp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    Không tìm thấy sinh viên phù hợp.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-teal-50/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-gray-700">{st.code}</td>
                    <td className="py-3.5 px-4 font-medium text-gray-900">{st.name}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-teal-600">
                      {st.score > 0 ? st.score : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {st.rank !== '-' ? (
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
                          {st.rank}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {st.status === 'APPROVED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                          <Check size={12} /> Đã duyệt
                        </span>
                      )}
                      {st.status === 'WAITING_APPROVAL' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                          <Clock size={12} /> Chờ Lớp duyệt
                        </span>
                      )}
                      {st.status === 'REJECTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 rounded-full border border-rose-200">
                          <AlertCircle size={12} /> Trả về
                        </span>
                      )}
                      {st.status === 'NOT_SUBMITTED' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                          Chưa nộp
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-xs">{st.date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
