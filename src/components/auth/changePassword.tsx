'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, X, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, KeyRound } from 'lucide-react';
import { API_Auth } from '../../api/API_Auth';
import { useAuthStore } from '../../store/authStore';
import { getUserFriendlyError } from '../../utils/errorHelper';
import type { ChangePasswordModalProps } from '@/types/common';

export const ChangePasswordModal = ({ isOpen, onClose }: ChangePasswordModalProps) => {
  const logout = useAuthStore((state) => state.logout);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleClose = useCallback(() => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setError('');
    setSuccess('');
    onClose();
  }, [onClose]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen, loading]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      await API_Auth.changePassword(accessToken, currentPassword, newPassword);
      setSuccess('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      setTimeout(() => {
        handleClose();
        logout();
      }, 1200);
    } catch (err: any) {
      setError(getUserFriendlyError(err, 'Đã xảy ra lỗi khi đổi mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-[#0B0F19]/45 backdrop-blur-[3px] transition-all duration-300"
        onClick={loading ? undefined : handleClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-[420px] transform overflow-hidden rounded-2xl bg-white p-6 shadow-[0_25px_60px_-15px_rgba(59,91,219,0.2)] border border-[#E9ECEF] transition-all animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-300 ease-out">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          disabled={loading}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition disabled:opacity-40 cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-linear-to-br from-[#3B5BDB] to-[#6741D9] text-white shadow-lg shadow-[#3B5BDB]/20 mb-3.5">
            <Lock size={22} className="stroke-[2.5]" />
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Đổi mật khẩu tài khoản
          </h2>
          <p className="text-xs text-gray-500 mt-1 max-w-[320px]">
            Nhập mật khẩu hiện tại và mật khẩu mới của bạn để bảo mật tài khoản.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Success Notification */}
          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <CheckCircle size={16} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}

          {/* Error Notification */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2.5 text-rose-800 text-xs font-semibold animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Field: Current Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <KeyRound size={16} />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#3B5BDB]/10 focus:border-[#3B5BDB] outline-none bg-white transition duration-200 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 cursor-pointer"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Field: New Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                placeholder="Tối thiểu 6 ký tự"
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#3B5BDB]/10 focus:border-[#3B5BDB] outline-none bg-white transition duration-200 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 cursor-pointer"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Field: Confirm Password */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1.5">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={16} />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full pl-10 pr-10 py-2.5 text-sm border border-gray-300 rounded-xl focus:ring-4 focus:ring-[#3B5BDB]/10 focus:border-[#3B5BDB] outline-none bg-white transition duration-200 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition p-1 cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F1F3F5] mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-700 rounded-xl transition cursor-pointer disabled:opacity-50 min-h-[42px]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-linear-to-r from-[#3B5BDB] to-[#6741D9] hover:from-[#2B49C4] hover:to-[#5532C0] rounded-xl shadow-lg shadow-[#3B5BDB]/20 hover:shadow-xl hover:shadow-[#3B5BDB]/30 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[42px]"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{loading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
