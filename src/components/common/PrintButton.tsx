'use client';

import { Printer } from 'lucide-react';

interface PrintButtonProps {
  label?: string;
  title?: string;
  className?: string;
  onBeforePrint?: () => void;
}

/**
 * Shared print button component — triggers window.print().
 * Used by class_leader and faculty roles.
 */
export function PrintButton({
  label = 'In',
  title = 'In trang hiện tại',
  className = '',
  onBeforePrint,
}: PrintButtonProps) {
  const handlePrint = () => {
    if (onBeforePrint) {
      onBeforePrint();
    }
    window.print();
  };

  return (
    <button
      type="button"
      title={title}
      onClick={handlePrint}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#DEE2E6] bg-white px-4 py-2.5 text-sm font-semibold text-[#495057] transition hover:border-[#3B5BDB] hover:text-[#3B5BDB] ${className}`}
    >
      <Printer size={16} />
      <span>{label}</span>
    </button>
  );
}
