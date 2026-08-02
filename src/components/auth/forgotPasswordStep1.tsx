'use client';

import React, { useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { API_Auth } from '../../api/API_Auth';
import { getUserFriendlyError } from '../../utils/errorHelper';

interface ForgotPasswordStep1Props {
  onSuccess: (identifier: string, email: string) => void;
  onBack: () => void;
}

export default function ForgotPasswordStep1({ onSuccess, onBack }: ForgotPasswordStep1Props) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = identifier.trim();
    if (!trimmed) {
      setError('Vui lòng nhập tên đăng nhập hoặc email');
      return;
    }

    // Basic email format validation if the user includes '@'
    if (trimmed.includes('@')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) {
        setError('Định dạng email không hợp lệ');
        return;
      }
    }

    try {
      setLoading(false); // reset/clear
      setLoading(true);
      const res = await API_Auth.forgotPassword(trimmed);
      // Backend should return the target masked or full email to display
      const email = res?.email || (trimmed.includes('@') ? trimmed : 'email của bạn');
      onSuccess(trimmed, email);
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Không tìm thấy tài khoản hoặc hệ thống gặp sự cố. Vui lòng thử lại.'));
    } finally {
      setLoading(false);
    }
  };

  const isButtonDisabled = !identifier.trim() || loading;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-bold text-white tracking-wide">Quên mật khẩu</h2>
        <p className="text-xs text-white/70 font-medium">
          Nhập tên đăng nhập hoặc email đăng ký để nhận mã xác nhận OTP.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-bold text-white/90 uppercase tracking-wider">
          Tên đăng nhập hoặc Email
        </label>
        <input
          type="text"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            if (error) setError('');
          }}
          disabled={loading}
          placeholder="Nhập username hoặc email..."
          className={`h-11 w-full rounded-xl border bg-white px-4 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-[#ED1C24]/20 ${
            error
              ? 'border-red-400 focus:border-[#ED1C24]'
              : 'border-gray-200 focus:border-[#ED1C24]'
          }`}
        />
        {error && (
          <div className="flex items-start gap-1.5 text-xs font-bold text-red-200 animate-shake">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-300" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isButtonDisabled}
        className="w-full h-11 bg-white hover:bg-white/90 active:scale-[0.99] text-[#2B2E7F] text-sm font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Gửi mã xác nhận
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-white/80 hover:text-white font-semibold transition"
        >
          &larr; Quay lại đăng nhập
        </button>
      </div>
    </form>
  );
}
