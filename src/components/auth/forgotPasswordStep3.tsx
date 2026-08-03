'use client';

import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Check, X, AlertCircle, Loader2 } from 'lucide-react';

// Mock service placeholder for resetting password
// TODO: nối API thật khi có endpoint
const resetPasswordPlaceholder = async (
  identifier: string,
  otpCode: string,
  newPassword: string
): Promise<{ success: boolean }> => {
  console.log(`[Placeholder API] Resetting password for: ${identifier}, OTP: ${otpCode}, NewPassword: ${newPassword}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ success: true });
    }, 1500);
  });
};

interface ForgotPasswordStep3Props {
  identifier: string;
  otpCode: string;
  onSuccess: () => void;
}

export default function ForgotPasswordStep3({ identifier, otpCode, onSuccess }: ForgotPasswordStep3Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password requirements state
  const [reqs, setReqs] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  useEffect(() => {
    setReqs({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      number: /\d/.test(newPassword),
      specialChar: /[\W_]/.test(newPassword), // non-word character (special characters)
    });
  }, [newPassword]);

  const allReqsMet = reqs.length && reqs.uppercase && reqs.number && reqs.specialChar;
  const isMatch = newPassword === confirmPassword;
  const canSubmit = allReqsMet && isMatch && confirmPassword !== '' && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setError('');
    setLoading(true);

    try {
      const res = await resetPasswordPlaceholder(identifier, otpCode, newPassword);
      if (res.success) {
        onSuccess();
      } else {
        setError('Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
      }
    } catch {
      setError('Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-bold text-white tracking-wide">Đặt mật khẩu mới</h2>
        <p className="text-xs text-white/70 font-medium">
          Mật khẩu mới phải bảo đảm chứa tối thiểu các tiêu chuẩn an toàn sau:
        </p>
      </div>

      {/* Input: Mật khẩu mới */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-white/90 uppercase tracking-wider">
          Mật khẩu mới
        </label>
        <div className="relative">
          <input
            type={showNewPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            disabled={loading}
            placeholder="Nhập mật khẩu mới..."
            className="h-11 w-full rounded-xl border border-gray-200 bg-white pl-4 pr-10 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#ED1C24] focus:ring-2 focus:ring-[#ED1C24]/20"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((prev) => !prev)}
            className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 transition"
          >
            {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Input: Xác nhận mật khẩu mới */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-white/90 uppercase tracking-wider">
          Xác nhận mật khẩu mới
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading}
            placeholder="Xác nhận mật khẩu mới..."
            className={`h-11 w-full rounded-xl border bg-white pl-4 pr-10 text-sm font-semibold text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-[#ED1C24]/20 ${
              confirmPassword && !isMatch
                ? 'border-red-400 focus:border-[#ED1C24]'
                : 'border-gray-200 focus:border-[#ED1C24]'
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3.5 top-3 text-gray-400 hover:text-gray-600 transition"
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {confirmPassword && !isMatch && (
          <div className="flex items-center gap-1 text-xs font-bold text-red-200 animate-shake">
            <AlertCircle size={14} className="shrink-0 text-red-300" />
            <span>Mật khẩu xác nhận không khớp</span>
          </div>
        )}
      </div>

      {/* Checklist yêu cầu mật khẩu */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-3.5 space-y-2">
        <p className="text-[11px] font-bold text-white/80 uppercase tracking-wider mb-1">
          Yêu cầu mật khẩu:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            {reqs.length ? (
              <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
            ) : (
              <X size={14} className="text-white/30 shrink-0" strokeWidth={3} />
            )}
            <span className={reqs.length ? 'text-emerald-300' : 'text-white/60'}>Tối thiểu 8 ký tự</span>
          </div>

          <div className="flex items-center gap-1.5">
            {reqs.uppercase ? (
              <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
            ) : (
              <X size={14} className="text-white/30 shrink-0" strokeWidth={3} />
            )}
            <span className={reqs.uppercase ? 'text-emerald-300' : 'text-white/60'}>Có chữ in hoa</span>
          </div>

          <div className="flex items-center gap-1.5">
            {reqs.number ? (
              <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
            ) : (
              <X size={14} className="text-white/30 shrink-0" strokeWidth={3} />
            )}
            <span className={reqs.number ? 'text-emerald-300' : 'text-white/60'}>Có chữ số</span>
          </div>

          <div className="flex items-center gap-1.5">
            {reqs.specialChar ? (
              <Check size={14} className="text-emerald-400 shrink-0" strokeWidth={3} />
            ) : (
              <X size={14} className="text-white/30 shrink-0" strokeWidth={3} />
            )}
            <span className={reqs.specialChar ? 'text-emerald-300' : 'text-white/60'}>Có ký tự đặc biệt</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-1.5 text-xs font-bold text-red-200 animate-shake justify-center">
          <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-300" />
          <span>{error}</span>
        </div>
      )}

      {/* Button đặt lại mật khẩu */}
      <button
        type="submit"
        disabled={!canSubmit || loading}
        className="w-full h-11 bg-white hover:bg-white/90 active:scale-[0.99] text-[#2B2E7F] text-sm font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Đặt lại mật khẩu
      </button>
    </form>
  );
}
