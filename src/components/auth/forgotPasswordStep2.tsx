'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, AlertCircle, Loader2 } from 'lucide-react';
import { API_Auth } from '../../api/API_Auth';

// Mock service placeholder for verifying OTP
// TODO: nối API thật khi có endpoint
const verifyOtpPlaceholder = async (identifier: string, otpCode: string): Promise<{ valid: boolean }> => {
  console.log(`[Placeholder API] Verifying OTP for: ${identifier}, Code: ${otpCode}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      // For demonstration/testing: code '123456' or '888888' is valid
      if (otpCode === '123456' || otpCode === '888888') {
        resolve({ valid: true });
      } else {
        resolve({ valid: false });
      }
    }, 1200);
  });
};

interface ForgotPasswordStep2Props {
  identifier: string;
  email: string;
  onSuccess: (otpCode: string) => void;
  onBack: () => void;
}

export default function ForgotPasswordStep2({ identifier, email, onSuccess, onBack }: ForgotPasswordStep2Props) {
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Timers
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes (300 seconds)
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Format helper for email: e.g. "nguyenthank@gmail.com" -> "ngu***nk@gmail.com"
  const maskEmail = (str: string) => {
    if (!str.includes('@')) return str;
    const [name, domain] = str.split('@');
    if (name.length <= 4) return `${name[0]}***@${domain}`;
    return `${name.slice(0, 3)}***${name.slice(-2)}@${domain}`;
  };

  const maskedEmail = maskEmail(email);

  // Timer countdown hook for OTP validity (300 seconds)
  useEffect(() => {
    if (timeRemaining <= 0) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Cooldown timer hook for resending OTP (60 seconds)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus on first input box upon mounting
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (!/^\d*$/.test(val)) return; // numbers only

    const newOtp = [...otp];
    newOtp[index] = val.slice(-1); // store only the last character entered
    setOtp(newOtp);

    // Auto-focus the next box
    if (val && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Clear previous input and shift focus left
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputsRef.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pastedData)) return; // accept exactly 6 digits only

    const chars = pastedData.split('');
    setOtp(chars);
    inputsRef.current[5]?.focus();
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setOtp(new Array(6).fill(''));
    inputsRef.current[0]?.focus();

    try {
      setLoading(true);
      await API_Auth.forgotPassword(identifier);
      setResendCooldown(60); // start 60s cooldown
      setTimeRemaining(300); // reset validity timer to 5m
      setFailedAttempts(0); // reset incorrect count
    } catch {
      setError('Không thể gửi lại mã xác nhận. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeRemaining <= 0) {
      setError('Mã xác nhận đã hết hiệu lực. Vui lòng gửi lại mã mới.');
      return;
    }

    const otpCode = otp.join('');
    if (otpCode.length < 6) return;

    setError('');
    setLoading(true);

    try {
      const res = await verifyOtpPlaceholder(identifier, otpCode);
      if (res.valid) {
        onSuccess(otpCode);
      } else {
        // Handle invalid OTP
        setError('Mã xác nhận không hợp lệ. Vui lòng thử lại.');
        setOtp(new Array(6).fill(''));
        inputsRef.current[0]?.focus();
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 450);

        setFailedAttempts((prev) => {
          const next = prev + 1;
          if (next >= 5) {
            setError('Bạn đã nhập sai quá nhiều lần. Vui lòng yêu cầu mã mới.');
          }
          return next;
        });
      }
    } catch {
      setError('Gặp sự cố kết nối. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  // Timer format display: MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCodeComplete = otp.join('').length === 6;
  const isInputLocked = timeRemaining <= 0 || failedAttempts >= 5;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Banner thông báo thành công */}
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 flex items-start gap-2.5 text-emerald-100">
        <div className="h-5 w-5 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white mt-0.5">
          <Check size={12} strokeWidth={3} />
        </div>
        <div className="text-xs font-semibold leading-relaxed">
          Mã xác nhận đã được gửi đến hộp thư{' '}
          <span className="text-emerald-300 font-bold block">{maskedEmail}</span>
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <h2 className="text-xl font-bold text-white tracking-wide">Xác thực mã OTP</h2>
        <p className="text-xs text-white/70 font-medium">
          Mã gồm 6 chữ số được gửi qua email. Vui lòng nhập mã phía dưới:
        </p>
      </div>

      <div className="space-y-4">
        {/* Label và bộ 6 ô OTP */}
        <div className="space-y-2.5 text-center">
          <label className="block text-xs font-bold text-white/90 uppercase tracking-wider">
            Nhập mã xác nhận
          </label>
          <div
            className={`flex justify-center gap-2.5 ${
              isShaking ? 'animate-shake' : ''
            }`}
          >
            {otp.map((digit, idx) => (
              <input
                key={idx}
                type="text"
                maxLength={1}
                inputMode="numeric"
                pattern="[0-9]*"
                value={digit}
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                onPaste={idx === 0 ? handlePaste : undefined}
                disabled={loading || isInputLocked}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                className={`w-11 h-12 text-center text-lg font-black text-gray-900 rounded-xl border bg-white focus:ring-2 focus:ring-[#ED1C24]/20 outline-none transition ${
                  error
                    ? 'border-red-400 focus:border-[#ED1C24]'
                    : 'border-gray-200 focus:border-[#ED1C24]'
                } disabled:bg-gray-100/70 disabled:text-gray-400 disabled:cursor-not-allowed`}
              />
            ))}
          </div>
        </div>

        {/* Đồng hồ đếm ngược hiệu lực mã */}
        <div className="flex items-center justify-between text-xs font-semibold px-1">
          <span className={`${timeRemaining <= 0 ? 'text-red-300' : 'text-white/70'}`}>
            {timeRemaining > 0 ? (
              `Mã có hiệu lực trong ${formatTime(timeRemaining)}`
            ) : (
              'Mã xác nhận đã hết hạn'
            )}
          </span>
          <div>
            <span className="text-white/60">Không nhận được mã? </span>
            <button
              type="button"
              disabled={resendCooldown > 0 || loading}
              onClick={handleResend}
              className={`text-[#ED1C24] hover:text-red-400 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại'}
            </button>
          </div>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className="flex items-start gap-1.5 text-xs font-bold text-red-200 animate-shake justify-center">
            <AlertCircle size={14} className="shrink-0 mt-0.5 text-red-300" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={!isCodeComplete || loading || isInputLocked}
        className="w-full h-11 bg-white hover:bg-white/90 active:scale-[0.99] text-[#2B2E7F] text-sm font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {loading && <Loader2 size={16} className="animate-spin" />}
        Xác nhận
      </button>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-white/80 hover:text-white font-semibold transition"
        >
          &larr; Quay lại
        </button>
      </div>
    </form>
  );
}
