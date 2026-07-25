'use client';

import { Search, ChevronDown } from 'lucide-react';
import type { SearchFilterBarProps } from '@/types/admin';

export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  filterValue = 'all',
  onFilterChange,
  searchPlaceholder,
  filterOptions,
  filterLabel = 'Trạng thái',
  children,
  variant = 'card',
}: SearchFilterBarProps) {
  return (
    <div className={
      variant === 'inline'
        ? 'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end'
        : 'bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4'
    }>

      {/* Search Input Box */}
      <div className="relative w-full sm:w-[280px]">
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-4 pr-10 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none transition bg-white"
        />
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
      </div>

      {/* Filter Options */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-2">
            {filterLabel && (
              <span className="text-xs font-semibold text-gray-500">{filterLabel}:</span>
            )}
            <div className="relative">
              <select
                value={filterValue}
                onChange={(e) => onFilterChange(e.target.value)}
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-8 py-1.5 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-gray-400 transition cursor-pointer"
              >
                {filterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={15} />
            </div>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
