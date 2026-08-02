'use client';

import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import type { ClassLeaderStudent, StudentStatus, StudentStatusFilter } from '@/types/class_leader';

interface StudentConfirmTableProps {
  students: ClassLeaderStudent[];
  onConfirm: (studentId: string) => void;
  onConfirmAll: () => void;
  confirming: boolean;
  filterStatus: StudentStatusFilter;
}

const STATUS_CONFIG: Record<StudentStatus, { label: string; icon: React.ElementType; className: string }> = {
  confirmed: { label: 'Đã xác nhận', icon: CheckCircle2, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  submitted: { label: 'Chờ xác nhận', icon: Clock, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  not_submitted: { label: 'Chưa nộp', icon: XCircle, className: 'bg-red-50 text-red-700 border-red-200' },
};

export function StudentConfirmTable({
  students,
  onConfirm,
  onConfirmAll,
  confirming,
  filterStatus,
}: StudentConfirmTableProps) {
  const pendingCount = students.filter((s) => s.status === 'submitted').length;

  return (
    <div className="rounded-xl border border-[#E9ECEF] bg-white shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-[#E9ECEF] px-4 py-3">
        <p className="text-sm font-semibold text-[#1A1B1E]">
          {students.length} sinh viên{filterStatus !== 'all' ? ' (đã lọc)' : ''}
        </p>
        {pendingCount > 0 && (
          <button
            type="button"
            disabled={confirming}
            onClick={onConfirmAll}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 size={15} />
            Xác nhận tất cả ({pendingCount})
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#E9ECEF] bg-[#F8F9FA]">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96]">STT</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96]">Mã SV</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-[#868E96]">Họ và tên</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Điểm tự chấm</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Trạng thái</th>
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-[#868E96]">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E9ECEF]">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-sm font-medium text-[#868E96]">
                  Không có dữ liệu
                </td>
              </tr>
            ) : (
              students.map((student, index) => {
                const config = STATUS_CONFIG[student.status];
                const Icon = config.icon;
                return (
                  <tr key={student.id} className="transition hover:bg-[#F8F9FA]">
                    <td className="px-4 py-3 text-[#868E96]">{index + 1}</td>
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[#495057]">{student.code}</td>
                    <td className="px-4 py-3 font-semibold text-[#1A1B1E]">{student.fullName}</td>
                    <td className="px-4 py-3 text-center">
                      {student.selfScore !== null ? (
                        <span className="font-bold text-brand-secondary">{student.selfScore}</span>
                      ) : (
                        <span className="text-[#ADB5BD]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${config.className}`}>
                          <Icon size={12} />
                          {config.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {student.status === 'submitted' ? (
                        <button
                          type="button"
                          disabled={confirming}
                          onClick={() => onConfirm(student.id)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckCircle2 size={13} />
                          Xác nhận
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
