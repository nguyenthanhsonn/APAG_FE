'use client';

import { Search } from 'lucide-react';
import CustomSelect from '../common/CustomSelect';
import type { ReviewStatusFilter, ClassReviewFilterBarProps } from '@/types/admin';

export type { ReviewStatusFilter };

const statusOptions = [
  { id: 'all', name: 'Tất cả' },
  { id: 'submitted', name: 'Đã nộp' },
  { id: 'not_submitted', name: 'Chưa nộp' },
];

export default function ClassReviewFilterBar({
  semester,
  semesterOptions = [],
  status,
  keyword,
  onSemesterChange,
  onStatusChange,
  onKeywordChange,
}: ClassReviewFilterBarProps) {
  return (
    <div className="ui-card p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_220px_1fr]">
        <CustomSelect
          label="Học kỳ"
          value={semester}
          onChange={onSemesterChange}
          options={[{ id: 'all', name: 'Tất cả học kỳ' }, ...semesterOptions]}
        />
        <CustomSelect
          label="Trạng thái"
          value={status}
          onChange={(value) => onStatusChange(value as ReviewStatusFilter)}
          options={statusOptions}
        />
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-600">Tìm kiếm</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868E96]" />
            <input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              className="h-10 w-full rounded-lg border border-[#DEE2E6] bg-white pl-9 pr-3 text-sm text-[#1A1B1E] outline-none transition focus:border-[#4C6EF5] focus:ring-2 focus:ring-[#4C6EF5]/20"
              placeholder="Tìm theo tên hoặc MSSV"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
