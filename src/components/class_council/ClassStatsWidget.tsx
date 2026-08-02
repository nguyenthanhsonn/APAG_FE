'use client';

import { CheckCircle2, Clock3, FileText, Users } from 'lucide-react';
import type { ClassStatsWidgetProps } from '@/types/admin';

const statMeta = [
  { key: 'total', label: 'Tổng SV', icon: Users, border: 'border-t-brand-secondary', bg: 'bg-brand-secondary/10', color: 'text-brand-secondary' },
  { key: 'submitted', label: 'Đã nộp', icon: FileText, border: 'border-t-[#E67700]', bg: 'bg-[#FFF9DB]', color: 'text-[#E67700]' },
  { key: 'approved', label: 'Đã duyệt', icon: CheckCircle2, border: 'border-t-[#2F9E44]', bg: 'bg-[#EBFBEE]', color: 'text-[#2F9E44]' },
  { key: 'notSubmitted', label: 'Chưa nộp', icon: Clock3, border: 'border-t-brand-primary', bg: 'bg-red-50', color: 'text-brand-primary' },
] as const;

export default function ClassStatsWidget({ total, submitted, approved, notSubmitted }: ClassStatsWidgetProps) {
  const values = { total, submitted, approved, notSubmitted };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statMeta.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.key} className={`ui-card flex items-center gap-4 border-t-[3px] p-5 ${stat.border}`}>
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
              <Icon size={22} />
            </div>
            <div>
              <p className="text-[13px] font-medium text-[#868E96]">{stat.label}</p>
              <p className="mt-0.5 text-[28px] font-bold leading-none text-[#1A1B1E]">{values[stat.key]}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
