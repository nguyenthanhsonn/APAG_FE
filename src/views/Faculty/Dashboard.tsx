'use client';

import React, { useState } from 'react';
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
import { FACULTY_CLASSES, ClassRecord } from '@/utils/mockFacultyData';

export function FacultyDashboard() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [classes, setClasses] = useState<ClassRecord[]>(FACULTY_CLASSES);

  const handleFacultyApprove = (id: string) => {
    setClasses((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: 'FACULTY_APPROVED', approvedCount: c.submittedCount }
          : c
      )
    );
  };

  const filteredClasses = classes.filter((c) => {
    const matchesSearch =
      c.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.leader.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalClasses = classes.length;
  const approvedClasses = classes.filter((c) => c.status === 'FACULTY_APPROVED').length;
  const pendingClasses = classes.filter((c) => c.status === 'PENDING_FACULTY').length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-teal-600 font-semibold text-sm mb-1">
            <Building2 size={16} /> Khoa Công Nghệ Thông Tin &bull; Học kỳ 2 (2025-2026)
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Ban/Khoa Xét Duyệt Đánh Giá Rèn Luyện</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý và duyệt tổng hợp kết quả đánh giá điểm rèn luyện cấp Khoa</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng số lớp trực thuộc</p>
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

      {/* Table Container */}
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
                <option value="PENDING_FACULTY">Chờ Khoa duyệt</option>
                <option value="FACULTY_APPROVED">Khoa đã duyệt</option>
                <option value="IN_PROGRESS">Đang xử lý cấp lớp</option>
              </select>
            </div>
          </div>

          <div className="self-end sm:self-auto">
            <PrintButton
              title="BÁO CÁO TỔNG HỢP ĐÁNH GIÁ RÈN LUYỆN — KHOA CÔNG NGHỆ THÔNG TIN"
              subtitle="Học kỳ 2 (2025-2026)"
              label="In danh sách"
              summaryStats={[
                { label: 'Tổng số lớp', value: `${totalClasses} Lớp` },
                { label: 'Khoa đã duyệt', value: `${approvedClasses} Lớp` },
                { label: 'Chờ Khoa thẩm định', value: `${pendingClasses} Lớp` },
              ]}
              signatures={{
                leftLabel: 'Người lập báo cáo',
                rightLabel: 'Trưởng Khoa',
              }}
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

        {/* Classes Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
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
              {filteredClasses.map((c) => (
                <tr key={c.id} className="hover:bg-teal-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{c.className}</td>
                  <td className="py-3.5 px-4 text-gray-700">{c.leader}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{c.totalStudents} SV</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-teal-600">{c.submittedCount}/{c.totalStudents}</td>
                  <td className="py-3.5 px-4">
                    {c.status === 'FACULTY_APPROVED' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                        <Check size={12} /> Khoa đã duyệt
                      </span>
                    )}
                    {c.status === 'PENDING_FACULTY' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 rounded-full border border-amber-200">
                        <Clock size={12} /> Chờ Khoa duyệt
                      </span>
                    )}
                    {c.status === 'IN_PROGRESS' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-500 bg-gray-100 rounded-full">
                        Đang làm việc cấp Lớp
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-gray-500 text-xs">{c.date}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {c.status === 'PENDING_FACULTY' && (
                        <button
                          onClick={() => handleFacultyApprove(c.id)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <FileCheck size={13} /> Duyệt toàn lớp
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/faculty/${c.id}`)}
                        title="Xem chi tiết lớp"
                        className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
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
