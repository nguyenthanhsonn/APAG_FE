'use client';

import { useState } from 'react';
import {
  BarChart3,
  Users,
  CheckCircle2,
  TrendingUp,
  Download,
} from 'lucide-react';
import {
  MOCK_FACULTY_STATS,
  MOCK_SCHOOL_STATS,
  MOCK_SCORE_DISTRIBUTION,
  MOCK_SEMESTERS,
} from '@/utils/mockTrainingDeptData';
import { ReportChart, ReportSummaryCard } from '@/components/training_department/ReportChart';
import { useToast } from '@/components/common/ToastProvider';

export function TrainingDeptDashboard() {
  const toast = useToast();
  const [selectedSemester, setSelectedSemester] = useState(MOCK_SEMESTERS[0].value);

  const stats = MOCK_SCHOOL_STATS;

  const handleExport = () => {
    toast.success('Đã xuất báo cáo toàn trường (Mock). File sẽ được tải về.');
  };

  const maxDistCount = Math.max(...MOCK_SCORE_DISTRIBUTION.map((d) => d.count), 1);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6">

      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="ui-page-title">Báo cáo & Thống kê toàn trường</h1>
          <p className="mt-1 text-sm text-[#868E96]">Chỉ xem — Phòng Đào tạo không thực hiện duyệt</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Semester Selector */}
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="rounded-lg border border-[#DEE2E6] px-3 py-2.5 text-sm text-[#495057] focus:border-[#3B5BDB] focus:outline-none"
          >
            {MOCK_SEMESTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#3B5BDB] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4C6EF5]"
          >
            <Download size={16} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Read-only disclaimer */}
      <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
        <BarChart3 size={18} className="shrink-0 text-[#3B5BDB]" />
        <p className="text-sm font-medium text-[#3B5BDB]">
          Đây là giao diện chỉ xem dành cho Phòng Đào tạo. Mọi hành động duyệt/sửa được thực hiện bởi Khoa và CVHT.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <ReportSummaryCard
          label="Tổng số Khoa"
          value={stats.totalFaculties}
          sub="khoa tham gia"
          accent="purple"
        />
        <ReportSummaryCard
          label="Tổng số lớp"
          value={stats.totalClasses}
          sub="lớp trong kỳ"
          accent="blue"
        />
        <ReportSummaryCard
          label="Tổng sinh viên"
          value={stats.totalStudents.toLocaleString('vi-VN')}
          sub={`Đã nộp: ${stats.submittedStudents}`}
          accent="amber"
        />
        <ReportSummaryCard
          label="Hoàn thành"
          value={`${stats.completionRate}%`}
          sub={`${stats.approvedStudents} SV đã duyệt`}
          accent="green"
        />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#E9ECEF] bg-white px-5 py-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Users size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1B1E]">Tỉ lệ nộp phiếu</p>
              <p className="text-xs text-[#868E96]">Trên tổng số sinh viên</p>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-600">
            {((stats.submittedStudents / stats.totalStudents) * 100).toFixed(1)}%
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E9ECEF]">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${(stats.submittedStudents / stats.totalStudents) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[#868E96]">{stats.submittedStudents.toLocaleString()} / {stats.totalStudents.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-[#E9ECEF] bg-white px-5 py-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1B1E]">Tỉ lệ đã duyệt</p>
              <p className="text-xs text-[#868E96]">Trên tổng số sinh viên</p>
            </div>
          </div>
          <p className="text-3xl font-extrabold text-emerald-600">
            {((stats.approvedStudents / stats.totalStudents) * 100).toFixed(1)}%
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E9ECEF]">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${(stats.approvedStudents / stats.totalStudents) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[#868E96]">{stats.approvedStudents.toLocaleString()} / {stats.totalStudents.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-[#E9ECEF] bg-white px-5 py-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EDF2FF] text-[#3B5BDB]">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#1A1B1E]">Phân phối điểm</p>
              <p className="text-xs text-[#868E96]">Toàn trường kỳ này</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {MOCK_SCORE_DISTRIBUTION.slice(0, 4).map((d) => (
              <div key={d.range} className="flex items-center gap-2">
                <p className="w-28 truncate text-[11px] font-medium text-[#495057]">{d.range.split('(')[0].trim()}</p>
                <div className="flex-1 overflow-hidden rounded-full bg-[#E9ECEF] h-1.5">
                  <div
                    className="h-full rounded-full bg-[#3B5BDB]"
                    style={{ width: `${(d.count / maxDistCount) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-[11px] font-bold text-[#3B5BDB]">{d.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Faculty Table */}
      <ReportChart data={MOCK_FACULTY_STATS} />

      {/* Score distribution full table */}
      <div className="rounded-xl border border-[#E9ECEF] bg-white shadow-sm overflow-hidden">
        <div className="border-b border-[#E9ECEF] px-5 py-4">
          <h2 className="text-sm font-bold text-[#1A1B1E]">Phân phối mức điểm toàn trường</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E9ECEF] bg-[#F8F9FA]">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96]">Mức điểm</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Số sinh viên</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96] min-w-[200px]">Tỉ lệ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {MOCK_SCORE_DISTRIBUTION.map((d) => (
                <tr key={d.range} className="hover:bg-[#F8F9FA]">
                  <td className="px-4 py-3 font-medium text-[#1A1B1E]">{d.range}</td>
                  <td className="px-4 py-3 text-center font-bold text-[#3B5BDB]">{d.count.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E9ECEF]">
                        <div
                          className="h-full rounded-full bg-[#3B5BDB]"
                          style={{ width: `${(d.count / maxDistCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs font-bold text-[#3B5BDB]">{d.percentage}%</span>
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
