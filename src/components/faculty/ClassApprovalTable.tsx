'use client';

import { CheckCircle2, Clock, XCircle, CheckCheck } from 'lucide-react';
import type { FacultyClass, ClassFilterStatus } from '@/types/faculty';

interface ClassApprovalTableProps {
  classes: FacultyClass[];
  onApprove: (classId: string) => void;
  onApproveAll: () => void;
  approving: boolean;
  filterStatus: ClassFilterStatus;
}

function getClassStatus(cls: FacultyClass): { label: string; icon: React.ElementType; className: string } {
  if (cls.facultyApproved) return { label: 'Đã duyệt', icon: CheckCheck, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (cls.councilApproved) return { label: 'Chờ Khoa duyệt', icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'Chờ CVHT chốt', icon: XCircle, className: 'bg-slate-50 text-slate-600 border-slate-200' };
}

export function ClassApprovalTable({
  classes,
  onApprove,
  onApproveAll,
  approving,
  filterStatus,
}: ClassApprovalTableProps) {
  const pendingCount = classes.filter((c) => c.councilApproved && !c.facultyApproved).length;

  return (
    <div className="rounded-xl border border-[#E9ECEF] bg-white shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E9ECEF] px-4 py-3">
        <p className="text-sm font-semibold text-[#1A1B1E]">
          {classes.length} lớp{filterStatus !== 'all' ? ' (đã lọc)' : ''}
        </p>
        {pendingCount > 0 && (
          <button
            type="button"
            disabled={approving}
            onClick={onApproveAll}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck size={15} />
            Duyệt tất cả ({pendingCount})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96]">Lớp</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96]">CVHT</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96]">Khóa</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Tổng SV</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Đã nộp</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9ECEF]">
            {classes.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-sm font-medium text-[#868E96]">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              classes.map((cls) => {
                const status = getClassStatus(cls);
                const StatusIcon = status.icon;
                const canApprove = cls.councilApproved && !cls.facultyApproved;
                return (
                  <tr key={cls.id} className="transition hover:bg-[#F8F9FA]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#1A1B1E]">{cls.name}</p>
                      <p className="text-xs text-[#868E96] font-mono">{cls.code}</p>
                    </td>
                    <td className="px-4 py-3 text-[#495057]">{cls.advisorName}</td>
                    <td className="px-4 py-3 text-[#495057]">{cls.academicYear}</td>
                    <td className="px-4 py-3 text-center font-semibold text-[#1A1B1E]">{cls.totalStudents}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-semibold ${cls.submittedCount === cls.totalStudents ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {cls.submittedCount}/{cls.totalStudents}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {canApprove ? (
                        <button
                          type="button"
                          disabled={approving}
                          onClick={() => onApprove(cls.id)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-brand-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />
                          Duyệt
                        </button>
                      ) : (
                        <span className="text-xs text-[#ADB5BD]">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
