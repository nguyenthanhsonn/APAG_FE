'use client';

import { CalendarDays, ChevronRight, School, Users } from 'lucide-react';
import type { CouncilClass, ClassCardProps } from '@/types/admin';

export type { CouncilClass };

export default function ClassCard({ classItem, onOpen }: ClassCardProps) {
  return (
    <button
      type="button"
      onClick={() => onOpen(classItem.id)}
      className="ui-card group flex min-h-[148px] w-full cursor-pointer flex-col justify-between p-5 text-left transition hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-secondary/10 text-brand-secondary">
            <School size={22} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold text-[#1A1B1E]">{classItem.name}</h2>
            {classItem.facultyName && <p className="mt-1 text-sm text-[#868E96]">{classItem.facultyName}</p>}
          </div>
        </div>
        <ChevronRight size={18} className="mt-1 shrink-0 text-[#ADB5BD] transition group-hover:translate-x-0.5 group-hover:text-brand-primary" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="ui-badge bg-[#F1F3F5] text-[#495057]">
          <Users size={13} className="mr-1" />
          {classItem.studentCount} SV
        </span>
        {classItem.academicYear && <span className="ui-badge bg-brand-secondary/10 text-brand-secondary">{classItem.academicYear}</span>}
        {classItem.semester && (
          <span className="ui-badge bg-[#FFF9DB] text-[#E67700]">
            <CalendarDays size={13} className="mr-1" />
            {classItem.semester}
          </span>
        )}
        {classItem.schoolYear && <span className="ui-badge bg-[#EBFBEE] text-[#2F9E44]">{classItem.schoolYear}</span>}
      </div>
    </button>
  );
}
