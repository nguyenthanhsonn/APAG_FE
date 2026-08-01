'use client';

import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Building2,
  FileSpreadsheet,
  Download,
  CheckCircle2
} from 'lucide-react';

export function TrainingDeptDashboard() {
  const facultyStats = [
    { name: 'Khoa Công nghệ thông tin', totalClasses: 12, totalStudents: 520, completedCount: 510, excellentRate: '35%' },
    { name: 'Khoa Điện - Điện tử', totalClasses: 10, totalStudents: 450, completedCount: 440, excellentRate: '28%' },
    { name: 'Khoa Kinh tế & QTKD', totalClasses: 15, totalStudents: 680, completedCount: 650, excellentRate: '42%' },
    { name: 'Khoa Ngoại ngữ', totalClasses: 8, totalStudents: 320, completedCount: 320, excellentRate: '45%' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Header Info */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm mb-1">
            <BarChart3 size={16} /> Phòng Đào Tạo &bull; Trường Đại học
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Báo Cáo & Thống Kê Điểm Rèn Luyện Toàn Trường</h1>
          <p className="text-sm text-gray-500 mt-1">Tổng hợp số liệu, xuất báo cáo và phê duyệt cấp Trường</p>
        </div>

        <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition cursor-pointer flex items-center gap-2 self-start sm:self-auto shadow-sm">
          <Download size={16} /> Xuất Báo Cáo Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng số SV toàn trường</p>
            <p className="text-2xl font-bold text-gray-900">1,970 SV</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Đã hoàn thành đánh giá</p>
            <p className="text-2xl font-bold text-emerald-600">1,920 SV</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Award size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tỷ lệ Xuất sắc / Tốt</p>
            <p className="text-2xl font-bold text-amber-600">76.4%</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Tổng số Khoa/Ban</p>
            <p className="text-2xl font-bold text-blue-600">4 Khoa</p>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-indigo-600" /> Thống kê tiến độ đánh giá theo từng Khoa
          </h2>
          <span className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
            Học kỳ 2 (2025-2026)
          </span>
        </div>

        {/* Faculty Summary Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase">
                <th className="py-3.5 px-4">Tên Khoa</th>
                <th className="py-3.5 px-4 text-center">Số Lớp</th>
                <th className="py-3.5 px-4 text-center">Tổng SV</th>
                <th className="py-3.5 px-4 text-center">SV Đã Duyệt</th>
                <th className="py-3.5 px-4 text-center">Tỷ lệ Xuất sắc</th>
                <th className="py-3.5 px-4 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {facultyStats.map((f, idx) => (
                <tr key={idx} className="hover:bg-indigo-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-gray-900">{f.name}</td>
                  <td className="py-3.5 px-4 text-center font-medium">{f.totalClasses} Lớp</td>
                  <td className="py-3.5 px-4 text-center font-medium">{f.totalStudents} SV</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">{f.completedCount} SV</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-indigo-600">{f.excellentRate}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-full border border-emerald-200">
                      <CheckCircle2 size={12} /> Đã chốt sổ
                    </span>
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
