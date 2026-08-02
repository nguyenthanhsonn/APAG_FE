'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_Auth } from '../api/API_Auth';
import { useAuthStore } from '../store/authStore';
import { getUserFriendlyError } from '../utils/errorHelper';

export const ChangePasswordPage = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
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

  const passwordRules = [
    { label: 'Ít nhất 8 ký tự', passed: newPassword.length >= 8 },
    { label: 'Một chữ cái viết hoa', passed: /[A-ZÀ-Ỵ]/.test(newPassword) },
    { label: 'Một chữ số', passed: /\d/.test(newPassword) },
  ];
  const strengthCount = passwordRules.filter((rule) => rule.passed).length;
  const strengthLabel = !newPassword
    ? 'Chưa nhập'
    : strengthCount <= 1
    ? 'Yếu'
    : strengthCount === 2
    ? 'Trung bình'
    : 'Mạnh';
  const strengthColor = !newPassword
    ? 'bg-slate-300'
    : strengthCount <= 1
    ? 'bg-red-400'
    : strengthCount === 2
    ? 'bg-amber-400'
    : 'bg-emerald-500';
  const homeHref = user?.role === 'admin'
    ? '/admin'
    : user?.role === 'advisor'
    ? '/advisor'
    : '/student';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) return setError('Vui lòng nhập mật khẩu hiện tại.');
    if (!newPassword) return setError('Vui lòng nhập mật khẩu mới.');
    if (newPassword.length < 6) return setError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
    if (newPassword === currentPassword) return setError('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
    if (newPassword !== confirmPassword) return setError('Mật khẩu xác nhận không khớp.');

    setLoading(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      await API_Auth.changePassword(accessToken, currentPassword, newPassword);
      setSuccess('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => logout(), 1200);
    } catch (err) {
      setError(getUserFriendlyError(err, 'Đã xảy ra lỗi khi đổi mật khẩu.'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'h-10 w-full rounded-lg border border-slate-300 bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 disabled:opacity-60';

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[#f6f8fc] px-4 py-3">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[380px] rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xl shadow-slate-200/70"
      >
        <div className="mb-4 text-center">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
            <KeyRound size={18} strokeWidth={2.4} />
          </div>
          <h1 className="text-xl font-bold text-slate-950">Đổi mật khẩu</h1>
          <p className="mx-auto mt-1 max-w-[300px] text-xs leading-5 text-slate-600">
            Cập nhật thông tin đăng nhập của bạn để bảo mật tài khoản tốt hơn.
          </p>
        </div>

        <div className="space-y-3">
          {success && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800">
              <CheckCircle size={16} className="shrink-0 text-emerald-600" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-800">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <PasswordField
            label="Mật khẩu hiện tại"
            value={currentPassword}
            onChange={setCurrentPassword}
            visible={showCurrent}
            onToggleVisible={() => setShowCurrent((value) => !value)}
            disabled={loading}
            placeholder="Nhập mật khẩu hiện tại"
            inputClass={inputClass}
          />
          <PasswordField
            label="Mật khẩu mới"
            value={newPassword}
            onChange={setNewPassword}
            visible={showNew}
            onToggleVisible={() => setShowNew((value) => !value)}
            disabled={loading}
            placeholder="Nhập mật khẩu mới"
            inputClass={inputClass}
          />
          <div className="-mt-1">
            <p className="mb-1 text-xs text-slate-500">
              Độ mạnh: <span className="font-bold text-slate-800">{strengthLabel}</span>
            </p>
            <div className="grid grid-cols-3 gap-1">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className={`h-1.5 rounded-full transition-colors ${item < strengthCount ? strengthColor : 'bg-slate-200'}`}
                />
              ))}
            </div>
          </div>
          <PasswordField
            label="Xác nhận mật khẩu mới"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirm}
            onToggleVisible={() => setShowConfirm((value) => !value)}
            disabled={loading}
            placeholder="Nhập lại mật khẩu mới"
            inputClass={inputClass}
          />

          <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3.5 py-2.5 text-xs text-slate-700">
            <p className="mb-2 font-bold text-slate-900">Yêu cầu mật khẩu:</p>
            <div className="space-y-1">
              {passwordRules.map((rule) => (
                <div key={rule.label} className="flex items-center gap-2">
                  {rule.passed ? (
                    <CheckCircle size={14} className="shrink-0 text-blue-700" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-400 bg-white" />
                  )}
                  <span className={rule.passed ? 'font-semibold text-slate-900' : 'text-slate-600'}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white shadow-sm shadow-blue-700/20 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              <span className="truncate">{loading ? 'Đang cập nhật...' : 'Thay đổi mật khẩu'}</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(homeHref)}
              disabled={loading}
              className="inline-flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Quay lại
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
  disabled,
  placeholder,
  inputClass,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
  disabled: boolean;
  placeholder: string;
  inputClass: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-bold text-slate-900">
        {label}
      </label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={inputClass}
        />
        <button
          type="button"
          onClick={onToggleVisible}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
