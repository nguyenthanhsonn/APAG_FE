'use client';

import React, { useRef, useState } from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';
import type { ModalConfirmProps } from '@/types/common';

export default function ModalConfirm({
  isOpen,
  title,
  message,
  targetName,
  type = 'info',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  hasReasonInput = false,
  reasonValue = '',
  onReasonChange,
  reasonLabel = 'Lý do khóa tài khoản',
  reasonPlaceholder = 'Nhập lý do khóa tài khoản...',
  onConfirm,
  onCancel,
}: ModalConfirmProps) {
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const confirmOnce = async () => {
    if (lock.current) return;
    lock.current = true; setPending(true);
    try { await onConfirm(); }
    finally { lock.current = false; setPending(false); }
  };
  const cancel = () => { if (!lock.current) onCancel(); };
  if (!isOpen) return null;

  const getTheme = () => {
    switch (type) {
      case 'danger':
        return {
          icon: Trash2,
          iconBg: 'bg-[#FFF5F5]',
          iconColor: 'text-[#C92A2A]',
          confirmBtn: 'bg-[#C92A2A] hover:bg-[#B02525] focus:ring-[#C92A2A]/20',
          titleColor: 'text-[#C92A2A]',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-[#FFF9DB]',
          iconColor: 'text-[#E67700]',
          confirmBtn: 'bg-[#E67700] hover:bg-[#D06B00] focus:ring-[#E67700]/20',
          titleColor: 'text-[#E67700]',
        };
      case 'info':
      default:
        return {
          icon: Info,
          iconBg: 'bg-[#EDF2FF]',
          iconColor: 'text-[#3B5BDB]',
          confirmBtn: 'bg-[#3B5BDB] hover:bg-[#4C6EF5] focus:ring-[#3B5BDB]/20',
          titleColor: 'text-[#3B5BDB]',
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const renderMessage = () => {
    if (!targetName) {
      return <p className="mb-4 text-sm text-[#868E96] leading-relaxed">{message}</p>;
    }

    const parts = message.split(targetName);
    return (
      <p className="mb-4 text-sm text-[#868E96] leading-relaxed">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {part}
            {index < parts.length - 1 && (
              <span className="font-bold text-[#C92A2A]">
                {targetName}
              </span>
            )}
          </React.Fragment>
        ))}
      </p>
    );
  };

  const isConfirmDisabled = hasReasonInput && !reasonValue.trim();

  return (
    <>
      {/* Overlay backdrop */}
      <div
        className="fixed inset-0 z-50 cursor-pointer bg-black/40 backdrop-blur-[2px]"
        onClick={cancel}
      />

      {/* Modal dialog wrapper */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl transition-all duration-200">
          
          {/* Close button */}
          <button
            type="button"
            onClick={cancel}
            className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#868E96] transition hover:bg-[#F8F9FA] hover:text-[#1A1B1E]"
          >
            <X size={16} />
          </button>

          <div className="flex flex-col items-center text-center">
            {/* Visual Icon container */}
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-full ${theme.iconBg} ${theme.iconColor}`}>
              <Icon size={24} />
            </div>

            {/* Title */}
            <h3 className="mb-2 text-lg font-bold text-[#1A1B1E]">{title}</h3>

            {/* Message body with red highlighted name */}
            {renderMessage()}

            {/* Optional Reason Input field */}
            {hasReasonInput && (
              <div className="mb-5 w-full text-left">
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-[#868E96]">
                  {reasonLabel} <span className="text-[#C92A2A]">*</span>
                </label>
                <textarea
                  value={reasonValue}
                  onChange={(e) => onReasonChange?.(e.target.value)}
                  placeholder={reasonPlaceholder}
                  className="w-full h-20 rounded-lg border border-[#DEE2E6] p-2.5 text-sm text-[#1A1B1E] outline-none transition duration-150 focus:border-[#E67700] focus:ring-2 focus:ring-[#E67700]/10 placeholder:text-gray-400"
                />
              </div>
            )}

            {/* Confirmation actions */}
            <div className="flex w-full gap-3">
              <button
                type="button"
                onClick={cancel}
                className="flex-1 cursor-pointer rounded-lg border border-[#DEE2E6] bg-white py-2.5 text-sm font-semibold text-[#495057] transition hover:bg-[#F8F9FA]"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={confirmOnce}
                disabled={pending || isConfirmDisabled}
                className={`flex-1 cursor-pointer rounded-lg py-2.5 text-sm font-semibold text-white transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${theme.confirmBtn}`}
              >
                {pending ? 'Đang xử lý...' : confirmText}
              </button>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
