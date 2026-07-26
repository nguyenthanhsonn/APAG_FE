'use client';

import { useState, useEffect } from 'react';
import type { Column, DataTableProps } from '@/types/admin';

export type { Column };

export default function DataTable<T>({
  columns,
  data,
  pageSize = 8,
  emptyText = 'Không có dữ liệu',
  minHeight = 400,
  showSummary = true,
  paginationAlign = 'right',
  currentPage: controlledPage,
  totalItems,
  onPageChange,
  onRowClick,
}: DataTableProps<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const currentPage = controlledPage ?? internalPage;
  const setCurrentPage = (page: number | ((prev: number) => number)) => {
    const nextPage = typeof page === 'function' ? page(currentPage) : page;
    if (onPageChange) {
      onPageChange(nextPage);
    } else {
      setInternalPage(nextPage);
    }
  };

  // Reset to page 1 when data changes (e.g. search/filter changes)
  useEffect(() => {
    if (!onPageChange) {
      setInternalPage(1);
    }
  }, [data, onPageChange]);

  const isServerPaginated = totalItems !== undefined;
  const totalCount = totalItems ?? data.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages]);

  const paginatedData = isServerPaginated
    ? data
    : data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const showingStart = totalCount ? (currentPage - 1) * pageSize + 1 : 0;
  const showingEnd = Math.min((currentPage - 1) * pageSize + paginatedData.length, totalCount);

  // Determine title column: explicit cardTitle, or first non-actions column
  const titleColIndex = (() => {
    const explicit = columns.findIndex((c) => c.cardTitle);
    if (explicit >= 0) return explicit;
    return columns.findIndex((c) => c.key !== 'actions');
  })();

  const actionsColIndex = columns.findIndex((c) => c.key === 'actions');

  // Columns shown as "Label: Value" rows in card (skip title col and actions col)
  const bodyColumns = columns.filter(
    (_, i) => i !== titleColIndex && i !== actionsColIndex
  );

  // Pad table with empty rows to avoid layout jumps/collapsing
  const emptyRowCount = Math.max(0, pageSize - paginatedData.length);

  /* ── Shared Pagination ── */
  const Pagination = () =>
    totalCount > 0 ? (
      <div className="px-4 py-3 border-t border-gray-50 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-auto">
        {showSummary && (
          <div className="text-xs sm:text-sm text-[#868E96]">
            Hiển thị{' '}
            <span className="font-semibold text-[#1A1B1E]">
              {showingStart}-{showingEnd}
            </span>{' '}
            của{' '}
            <span className="font-semibold text-[#1A1B1E]">{totalCount}</span>{' '}
            kết quả
          </div>
        )}
        <div
          className={`flex items-center gap-2.5 self-center ${
            paginationAlign === 'left'
              ? 'sm:mr-auto'
              : showSummary
              ? 'sm:self-auto'
              : 'sm:ml-auto'
          }`}
        >
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-xs font-semibold text-[#ADB5BD] hover:text-[#495057] transition disabled:cursor-not-allowed disabled:opacity-30"
            title="Trang đầu"
          >
            |&lt;
          </button>
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-xs font-semibold text-[#ADB5BD] hover:text-[#495057] transition disabled:cursor-not-allowed disabled:opacity-30"
            title="Trang trước"
          >
            &lt;
          </button>

          {getPageNumbers().map((page, idx) => {
            if (page === '...') {
              return (
                <span
                  key={idx}
                  className="flex h-8 w-8 items-center justify-center text-sm text-[#868E96]"
                >
                  ...
                </span>
              );
            }
            const isCurrent = page === currentPage;
            return (
              <button
                key={idx}
                onClick={() => setCurrentPage(page as number)}
                className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-sm font-semibold transition ${
                  isCurrent
                    ? 'border border-[#104E92] bg-white text-[#104E92] shadow-sm font-bold'
                    : 'text-[#ADB5BD] hover:text-[#495057]'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-xs font-semibold text-[#ADB5BD] hover:text-[#495057] transition disabled:cursor-not-allowed disabled:opacity-30"
            title="Trang sau"
          >
            &gt;
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="flex h-8 w-8 cursor-pointer items-center justify-center text-xs font-semibold text-[#ADB5BD] hover:text-[#495057] transition disabled:cursor-not-allowed disabled:opacity-30"
            title="Trang cuối"
          >
            &gt;|
          </button>
        </div>
      </div>
    ) : null;

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col flex-1 mt-4"
      style={{ minHeight: minHeight ?? 480 }}
    >
      {/* ═══════════════════════════════════════════
          DESKTOP TABLE  (hidden on mobile <768px)
      ═══════════════════════════════════════════ */}
      <div className="hidden md:flex md:flex-col md:flex-1">
        <div className="w-full flex-1 overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[700px] lg:min-w-full">
            <thead>
              <tr className="bg-[#F8F9FA]">
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    style={{ width: col.width }}
                    className="text-left py-4 px-4 font-semibold text-[#495057] border-b border-[#E9ECEF] whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-[#F8F9FA] transition duration-150 ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, colIdx) => {
                    const cellValue =
                      col.key !== 'actions' ? row[col.key as keyof T] : undefined;
                    return (
                      <td
                        key={colIdx}
                        className="py-4 px-4 text-[#1A1B1E] max-w-[300px] truncate border-b border-[#E9ECEF]"
                      >
                        {col.render
                          ? col.render(cellValue, row)
                          : (cellValue as any)?.toString() || '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="py-12 text-center text-sm text-[#868E96] border-b border-[#E9ECEF]"
                  >
                    {emptyText}
                  </td>
                </tr>
              )}
              {/* Pad with empty rows to keep layout stretch */}
              {paginatedData.length > 0 &&
                Array.from({ length: emptyRowCount }).map((_, i) => (
                  <tr key={`empty-${i}`}>
                    {columns.map((_, colIdx) => (
                      <td
                        key={colIdx}
                        className="px-4 py-4 border-b border-[#E9ECEF]/60"
                      >
                        &nbsp;
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <Pagination />
      </div>

      {/* ═══════════════════════════════════════════
          MOBILE CARD LIST  (hidden on desktop ≥768px)
      ═══════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 md:hidden">
        {paginatedData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-[#868E96] text-sm">
            {emptyText}
          </div>
        ) : (
          <div className="divide-y divide-[#E9ECEF]">
            {paginatedData.map((row, rowIdx) => {
              const titleCol = columns[titleColIndex];
              const titleValue =
                titleCol && titleCol.key !== 'actions'
                  ? (row as any)[titleCol.key as string]
                  : undefined;

              const actionsCol =
                actionsColIndex >= 0 ? columns[actionsColIndex] : undefined;

              return (
                <div
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`p-4 animate-fade-in ${
                    onRowClick ? 'cursor-pointer active:bg-gray-50' : ''
                  }`}
                  style={{ animationDelay: `${rowIdx * 30}ms` }}
                >
                  {/* Card primary title */}
                  <div className="font-semibold text-[#1A1B1E] text-base mb-3 leading-snug">
                    {titleCol?.render
                      ? titleCol.render(titleValue, row)
                      : titleValue?.toString() || '—'}
                  </div>

                  {/* Body rows: label → value */}
                  <div className="space-y-2">
                    {bodyColumns.map((col, colIdx) => {
                      const val =
                        col.key !== 'actions'
                          ? (row as any)[col.key as string]
                          : undefined;
                      return (
                        <div key={colIdx} className="flex items-start justify-between gap-3">
                          <span className="text-xs text-[#868E96] shrink-0 pt-0.5 min-w-[80px]">
                            {col.label}
                          </span>
                          <span className="text-sm text-[#1A1B1E] text-right">
                            {col.render
                              ? col.render(val, row)
                              : val?.toString() || '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions row at bottom */}
                  {actionsCol && (
                    <div
                      className="mt-3 pt-3 border-t border-[#F1F3F5] flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {actionsCol.render?.(undefined, row)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <Pagination />
      </div>
    </div>
  );
}
