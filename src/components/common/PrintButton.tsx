'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export interface ColumnDef<T> {
  header: string;
  accessorKey?: keyof T;
  render?: (item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface SummaryStatItem {
  label: string;
  value: string | number;
}

export interface PrintButtonProps<T> {
  title: string;
  subtitle?: string;
  columns: ColumnDef<T>[];
  data: T[];
  label?: string;
  signatures?: { leftLabel: string; rightLabel: string };
  summaryStats?: SummaryStatItem[];
}

export function PrintButton<T>({
  title,
  subtitle,
  columns,
  data,
  label = 'In danh sách',
  signatures = { leftLabel: 'Cố vấn học tập (CVHT)', rightLabel: 'Lớp trưởng' },
  summaryStats,
}: PrintButtonProps<T>) {
  const currentDate = new Date().toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const handlePrint = () => {
    window.print();
  };

  const getAlignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'left':
      default:
        return 'text-left';
    }
  };

  return (
    <>
      {/* Nút bấm in (Hiển thị trên web, ẩn khi in) */}
      <button
        type="button"
        onClick={handlePrint}
        className="no-print inline-flex cursor-pointer items-center gap-2 rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 active:scale-[0.98]"
      >
        <Printer size={16} />
        <span>{label}</span>
      </button>

      {/* Giao diện xem trước & khi in (Chỉ hiển thị khi in hoặc trong Print Mode) */}
      <div className="print-only hidden">
        {/* CSS Print Rules */}
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * {
              visibility: hidden !important;
            }
            .print-only, .print-only * {
              visibility: visible !important;
            }
            .print-only {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              display: block !important;
              padding: 20px !important;
              background: #fff !important;
              color: #000 !important;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
          }
        `}} />

        <div className="w-full font-sans">
          {/* Header tờ in */}
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wide">{title}</h1>
            {subtitle && <p className="text-sm font-medium text-gray-700 mt-1">{subtitle}</p>}
            <p className="text-xs text-gray-500 italic mt-1">Ngày in: {currentDate}</p>
          </div>

          {/* Dòng thống kê tổng hợp (nếu có) */}
          {summaryStats && summaryStats.length > 0 && (
            <div className="mb-4 p-3 border border-gray-300 rounded bg-gray-50 flex items-center justify-around text-xs font-semibold">
              {summaryStats.map((st, idx) => (
                <div key={idx} className="text-center">
                  <span className="text-gray-600 font-medium">{st.label}: </span>
                  <span className="text-black font-bold">{st.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Bảng dữ liệu in */}
          <table className="w-full border-collapse border border-gray-400 text-xs">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-400">
                <th className="border border-gray-400 p-2 text-center w-10">STT</th>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`border border-gray-400 p-2 font-bold ${getAlignClass(col.align)}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="border border-gray-400 p-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                data.map((item, rowIdx) => (
                  <tr key={rowIdx} className="border-b border-gray-300">
                    <td className="border border-gray-400 p-2 text-center">{rowIdx + 1}</td>
                    {columns.map((col, colIdx) => (
                      <td
                        key={colIdx}
                        className={`border border-gray-400 p-2 ${getAlignClass(col.align)}`}
                      >
                        {col.render
                          ? col.render(item)
                          : col.accessorKey
                          ? (item[col.accessorKey] as React.ReactNode)
                          : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Khối ký tên cuối trang */}
          <div className="mt-12 grid grid-cols-2 text-center text-xs font-semibold">
            <div>
              <p className="uppercase">{signatures.leftLabel}</p>
              <p className="text-[10px] text-gray-500 italic font-normal mt-0.5">(Ký và ghi rõ họ tên)</p>
              <div className="h-20" />
            </div>
            <div>
              <p className="uppercase">{signatures.rightLabel}</p>
              <p className="text-[10px] text-gray-500 italic font-normal mt-0.5">(Ký và ghi rõ họ tên)</p>
              <div className="h-20" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
