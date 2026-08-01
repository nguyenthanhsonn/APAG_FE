'use client';

import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Check,
  FileCheck,
  BookOpen
} from 'lucide-react';
import { PrintButton } from '@/components/common/PrintButton';

export function ClassLeaderDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [students, setStudents] = useState([
    { id: '1', code: 'SV001', name: 'Nguyễn Văn An', score: 85, rank: 'Tốt', status: 'WAITING_APPROVAL', date: '01/08/2026' },
    { id: '2', code: 'SV002', name: 'Trần Thị Bích', score: 92, rank: 'Xuất sắc', status: 'APPROVED', date: '01/08/2026' },
    { id: '3', code: 'SV003', name: 'Lê Hoàng Cường', score: 68, rank: 'Khá', status: 'WAITING_APPROVAL', date: '31/07/2026' },
    { id: '4', code: 'SV004', name: 'Phạm Minh Đức', score: 45, rank: 'Yếu', status: 'REJECTED', date: '30/07/2026' },
    { id: '5', code: 'SV005', name: 'Hoàng Thảo Dung', score: 88, rank: 'Tốt', status: 'APPROVED', date: '01/08/2026' },
    { id: '6', code: 'SV006', name: 'Đặng Quốc Hùng', score: 76, rank: 'Khá', status: 'NOT_SUBMITTED', date: '-' },
  ]);

  const handleApprove = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, status: 'APPROVED' } : s));
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalCount = students.length;
  const approvedCount = students.filter(s => s.status === 'APPROVED').length;
  const waitingCount = students.filter(s => s.status === 'WAITING_APPROVAL').length;
  const notSubmittedCount = students.filter(s => s.status === 'NOT_SUBMITTED').length;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-1">
            <BookOpen size={16} /> Lớp CNTT-K65A &bull; Học kỳ 2 (2025-2026)
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý & Duyệt điểm rèn luyện cấp Lớp</h1>
          <p className="text-sm text-gray-500 mt-1">Danh sách sinh viên và trạng thái nộp phiếu rèn luyện của lớp</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
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
            <p className="text-xs text-gray-500 font-medium">Chưa nộp phiếu</p>
            <p className="text-xl font-bold text-rose-600">{notSubmittedCount} SV</p>
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
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter size={16} className="text-gray-400 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="WAITING_APPROVAL">Chờ Lớp duyệt</option>
                <option value="APPROVED">Đã duyệt</option>
                <option value="REJECTED">Trả về</option>
                <option value="NOT_SUBMITTED">Chưa nộp</option>
              </select>
            </div>
          </div>

          <div className="self-end sm:self-auto">
            <PrintButton
              title="DANH SÁCH SINH VIÊN LỚP CNTT-K65A – HỌC KỲ 2 (2025-2026)"
              subtitle="Hệ thống Đánh giá Rèn luyện Sinh viên"
              data={filteredStudents}
              columns={[
                { header: 'Mã SV', accessorKey: 'code' },
                { header: 'Họ và tên', accessorKey: 'name' },
                { header: 'Điểm tự đánh giá', accessorKey: 'score', align: 'center', render: (s) => (s.score > 0 ? s.score : '-') },
                { header: 'Xếp loại', accessorKey: 'rank', align: 'center' },
                {
                  header: 'Trạng thái',
                  align: 'left',
                  render: (s) => {
                    if (s.status === 'APPROVED') return 'Đã duyệt';
                    if (s.status === 'WAITING_APPROVAL') return 'Chờ Lớp duyệt';
                    if (s.status === 'REJECTED') return 'Trả về';
                    return 'Chưa nộp';
                  },
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
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.map((st) => (
                <tr key={st.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-gray-700">{st.code}</td>
                  <td className="py-3.5 px-4 font-medium text-gray-900">{st.name}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-blue-600">{st.score > 0 ? st.score : '-'}</td>
                  <td className="py-3.5 px-4 text-center">
                    {st.rank !== '-' ? (
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-md">
                        {st.rank}
                      </span>
                    ) : '-'}
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
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {st.status === 'WAITING_APPROVAL' && (
                        <button
                          onClick={() => handleApprove(st.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <FileCheck size={13} /> Duyệt
                        </button>
                      )}
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
