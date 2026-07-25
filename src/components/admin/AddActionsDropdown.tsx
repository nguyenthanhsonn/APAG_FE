'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Upload, UserPlus } from 'lucide-react';
import type { AddActionsDropdownProps } from '@/types/admin';

export const AddActionsDropdown = ({
  onAddStudent,
  onImportExcel,
  onAddUser,
}: AddActionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Đóng dropdown khi click ra ngoài hoặc bấm phím Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Nút FAB chính (hình tròn cố định 56x56px, màu xanh đậm) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#0B3A82] text-white shadow-lg shadow-blue-900/25 transition-all duration-300 hover:bg-[#104E92] hover:shadow-xl hover:shadow-blue-900/35 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#0B3A82]/50"
      >
        <Plus
          size={24}
          className={`transition-transform duration-300 ease-in-out ${
            isOpen ? 'rotate-[135deg]' : 'rotate-0'
          }`}
        />
      </button>

      {/* Dropdown Menu (Pop-up hướng lên trên, không có card bao ngoài, có animation) */}
      <div
        role="menu"
        aria-orientation="vertical"
        className={`absolute bottom-full right-0 mb-4 w-56 origin-bottom-right z-50 flex flex-col space-y-2.5 transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto scale-100'
            : 'opacity-0 translate-y-2 pointer-events-none scale-95'
        }`}
      >
        {/* Action 1: Thêm sinh viên */}
        <button
          type="button"
          role="menuitem"
          onClick={() => handleAction(onAddStudent)}
          style={{ transitionDelay: isOpen ? '50ms' : '0ms' }}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-blue-700 transition-all duration-300 ease-out hover:bg-blue-50/90 active:bg-blue-100/80 ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/90 text-blue-600 shadow-sm border border-blue-200/50">
            <Plus size={15} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-blue-700 leading-tight">Thêm sinh viên</p>
            <p className="text-[9px] font-normal text-blue-500/80 truncate mt-0.5">Tạo thủ công 1 sinh viên</p>
          </div>
        </button>

        {/* Action 2: Nhập sinh viên từ Excel */}
        <button
          type="button"
          role="menuitem"
          onClick={() => handleAction(onImportExcel)}
          style={{ transitionDelay: isOpen ? '100ms' : '0ms' }}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-emerald-700 transition-all duration-300 ease-out hover:bg-emerald-50/90 active:bg-emerald-100/80 ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100/90 text-emerald-600 shadow-sm border border-emerald-200/50">
            <Upload size={15} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-emerald-700 leading-tight">Nhập sinh viên từ Excel</p>
            <p className="text-[9px] font-normal text-emerald-600/80 truncate mt-0.5">Import hàng loạt từ file Excel</p>
          </div>
        </button>

        {/* Action 3: Thêm người dùng */}
        <button
          type="button"
          role="menuitem"
          onClick={() => handleAction(onAddUser)}
          style={{ transitionDelay: isOpen ? '150ms' : '0ms' }}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 transition-all duration-300 ease-out hover:bg-slate-100/90 active:bg-slate-200/85 ${
            isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1'
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#0B3A82] shadow-sm border border-slate-200/50">
            <UserPlus size={15} />
          </div>
          <div className="text-left min-w-0">
            <p className="font-semibold text-slate-800 leading-tight">Thêm người dùng</p>
            <p className="text-[9px] font-normal text-slate-500 truncate mt-0.5">Tạo tài khoản quản trị / cố vấn</p>
          </div>
        </button>
      </div>
    </div>
  );
};
