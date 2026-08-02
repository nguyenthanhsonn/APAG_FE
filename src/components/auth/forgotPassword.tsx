'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import ForgotPasswordStep1 from './forgotPasswordStep1';
import ForgotPasswordStep2 from './forgotPasswordStep2';
import ForgotPasswordStep3 from './forgotPasswordStep3';

interface ForgotPasswordProps {
  onClose: (usernameOrEmail?: string) => void;
}

export default function ForgotPassword({ onClose }: ForgotPasswordProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState('');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // Step transitions
  const handleStep1Success = (enteredIdentifier: string, sentEmail: string) => {
    setIdentifier(enteredIdentifier);
    setEmail(sentEmail);
    setStep(2);
  };

  const handleStep2Success = (verifiedOtp: string) => {
    setOtpCode(verifiedOtp);
    setStep(3);
  };

  const handleStep3Success = () => {
    setStep(4);
  };

  return (
    <div
      data-forgot-card="true"
      className="w-full min-h-[420px] p-6 sm:p-8 flex flex-col justify-between"
      style={{
        borderRadius: '1.5rem',
        border: '1px solid rgba(255,255,255,0.20)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
        background: 'rgba(255,255,255,0.09)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      {/* Header / Step indicator */}
      {step < 4 && (
        <div className="flex items-center justify-between max-w-xs mx-auto mb-6 w-full">
          {[1, 2, 3].map((num) => (
            <React.Fragment key={num}>
              <div className="flex items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    step >= num
                      ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                      : 'bg-white/10 text-white/40 border border-white/10'
                  }`}
                >
                  {num}
                </div>
                <span
                  className={`ml-2 text-xs font-bold transition-all duration-300 ${
                    step === num ? 'text-white font-black' : 'text-white/40 font-semibold'
                  }`}
                >
                  {num === 1 ? 'Định danh' : num === 2 ? 'Xác thực' : 'Thiết lập'}
                </span>
              </div>
              {num < 3 && (
                <div
                  className={`h-0.5 flex-1 min-w-[20px] mx-2 rounded transition-all duration-300 ${
                    step > num ? 'bg-red-600' : 'bg-white/15'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Render Steps with key to re-trigger animate-fade-in on step changes */}
      <div key={step} className="flex-1 flex flex-col justify-center animate-fade-in">
        {step === 1 && (
          <ForgotPasswordStep1
            onSuccess={handleStep1Success}
            onBack={() => onClose()}
          />
        )}

        {step === 2 && (
          <ForgotPasswordStep2
            identifier={identifier}
            email={email}
            onSuccess={handleStep2Success}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <ForgotPasswordStep3
            identifier={identifier}
            otpCode={otpCode}
            onSuccess={handleStep3Success}
          />
        )}

        {step === 4 && (
          <div className="text-center space-y-6 py-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 animate-scale-in">
              <Check size={32} strokeWidth={3} className="animate-[scaleIn_0.3s_ease-out]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-wide">Đặt lại mật khẩu thành công!</h2>
              <p className="text-xs text-white/70 font-medium leading-relaxed max-w-sm mx-auto">
                Mật khẩu của bạn đã được cập nhật thành công. Bạn có thể sử dụng mật khẩu mới này để đăng nhập ngay bây giờ.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onClose(identifier)}
              className="w-full max-w-xs h-11 bg-white hover:bg-white/90 active:scale-[0.99] text-[#2B2E7F] text-sm font-bold uppercase tracking-wider rounded-xl transition duration-150 shadow-md inline-flex items-center justify-center"
            >
              Về trang đăng nhập
            </button>
          </div>
        )}
      </div>
    </div>
  );
}