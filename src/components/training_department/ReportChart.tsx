'use client';

import type { TrainingDeptFacultyStats } from '@/types/training_department';

interface ReportSummaryCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: 'blue' | 'green' | 'amber' | 'purple';
}

const ACCENT_MAP: Record<string, string> = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  amber: 'bg-amber-50 border-amber-200 text-amber-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
};

export function ReportSummaryCard({ label, value, sub, accent = 'blue' }: ReportSummaryCardProps) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border px-5 py-4 ${ACCENT_MAP[accent]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">{label}</p>
      <p className="text-2xl font-extrabold leading-none">{value}</p>
      {sub && <p className="text-xs font-medium opacity-70">{sub}</p>}
    </div>
  );
}

interface ReportChartProps {
  data: TrainingDeptFacultyStats[];
}

function BarCell({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#E9ECEF]">
        <div
          className="h-full rounded-full bg-[#3B5BDB] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-[#3B5BDB]">{pct}%</span>
    </div>
  );
}

export function ReportChart({ data }: ReportChartProps) {
  const maxStudents = Math.max(...data.map((d) => d.totalStudents), 1);

  return (
    <div className="rounded-xl border border-[#E9ECEF] bg-white shadow-sm overflow-hidden">
      <div className="border-b border-[#E9ECEF] px-5 py-4">
        <h2 className="text-sm font-bold text-[#1A1B1E]">Thống kê theo Khoa</h2>
        <p className="mt-0.5 text-xs text-[#868E96]">Tỉ lệ hoàn thành và điểm trung bình mỗi khoa</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96]">Khoa</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Tổng lớp</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Tổng SV</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Đã nộp</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Đã duyệt</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96] min-w-[160px]">Tỉ lệ nộp</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">ĐTB</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9ECEF]">
            {data.map((row) => (
              <tr key={row.facultyId} className="transition hover:bg-[#F8F9FA]">
                <td className="px-4 py-3 font-semibold text-[#1A1B1E]">{row.facultyName}</td>
                <td className="px-4 py-3 text-center text-[#495057]">{row.totalClasses}</td>
                <td className="px-4 py-3 text-center text-[#495057]">{row.totalStudents}</td>
                <td className="px-4 py-3 text-center font-semibold text-amber-600">{row.submittedStudents}</td>
                <td className="px-4 py-3 text-center font-semibold text-emerald-600">{row.approvedStudents}</td>
                <td className="px-4 py-3">
                  <BarCell value={row.submittedStudents} max={maxStudents} />
                </td>
                <td className="px-4 py-3 text-center font-bold text-[#3B5BDB]">{row.avgScore.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
