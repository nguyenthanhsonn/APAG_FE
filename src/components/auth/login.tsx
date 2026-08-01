'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Eye, EyeOff, HelpCircle, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_Auth } from '../../api/API_Auth';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { UserRole } from '../../types/common';
import { getUserFriendlyError } from '../../utils/errorHelper';
import { useToast } from '../../components/common/ToastProvider';

const LoginSchema = Yup.object().shape({
  username: Yup.string()
    .trim()
    .required('Vui lòng nhập tên đăng nhập'),
  password: Yup.string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .max(50, 'Mật khẩu tối đa 50 ký tự')
    .required('Vui lòng nhập mật khẩu'),
  captchaCode: Yup.string()
    .trim()
    .required('Vui lòng nhập mã captcha'),
});

export default function Login() {
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const wrongCaptchaCountRef = useRef(0);
  const toast = useToast();

  const loadCaptcha = async () => {
    try {
      setCaptchaLoading(true);
      const captcha = await API_Auth.getCaptcha();
      setCaptchaId(captcha.captchaId || '');
      setCaptchaImage(captcha.image || '');
    } catch (err: any) {
      setError(err.message || 'Không thể tải mã captcha. Vui lòng thử lại.');
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const getRoleHome = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return '/admin';
      case 'class_council':
        return '/class_council';
      case 'class_leader':
        return '/class_leader';
      case 'faculty':
        return '/faculty';
      case 'training_department':
        return '/training_department';
      case 'student':
      default:
        return '/student';
    }
  };

  const formik = useFormik<Yup.InferType<typeof LoginSchema>>({
    initialValues: {
      username: '',
      password: '',
      captchaCode: '',
    },
    validationSchema: LoginSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (
      values: Yup.InferType<typeof LoginSchema>,
      { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }
    ) => {
      setError('');
      try {
        if (!captchaId) {
          setError('Vui lòng tải lại mã captcha.');
          await loadCaptcha();
          return;
        }

        const success = await login(values.username, values.password, captchaId, values.captchaCode);
        if (success) {
          const user = useAuthStore.getState().user;
          router.push(user?.role ? getRoleHome(user.role) : '/student');
        } else {
          setError('Tên đăng nhập hoặc mật khẩu không đúng');
        }
      } catch (err: any) {
        const errMessage = err.message || '';
        const isCaptchaError =
          errMessage.toLowerCase().includes('captcha') ||
          errMessage.includes('xác thực') ||
          errMessage.includes('mã') ||
          (err.errors && JSON.stringify(err.errors).toLowerCase().includes('captcha'));

        if (isCaptchaError) {
          formik.setFieldError('captchaCode', 'Mã captcha không đúng, vui lòng nhập lại');
          formik.setFieldValue('captchaCode', '');
          await loadCaptcha();

          wrongCaptchaCountRef.current += 1;
          if (wrongCaptchaCountRef.current >= 3) {
            wrongCaptchaCountRef.current = 0;
            toast.error('Bạn đã nhập sai nhiều lần, mã captcha mới đã được tạo.');
          }
        } else {
          setError(getUserFriendlyError(err, 'Đăng nhập không thành công. Vui lòng kiểm tra lại tên đăng nhập và mật khẩu.'));
          formik.setFieldValue('captchaCode', '');
          await loadCaptcha();
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <main className="relative flex min-h-screen flex-col bg-[#252478] text-white">
      {/* Bottom Right Accent Red Circle */}
      <div className="absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-[#e31a22] opacity-90" />

      {/* Bottom Left Book Patterns */}
      <div className="absolute bottom-4 left-4 z-0 hidden md:block">
        <svg width="240" height="240" viewBox="0 0 240 240" fill="none" className="text-[#e31a22]/40">
          {Array.from({ length: 6 }).map((_, r) =>
            Array.from({ length: r + 1 }).map((_, c) => (
              <path
                key={`${r}-${c}`}
                d={`M ${c * 36 + 12} ${220 - r * 30} C ${c * 36 + 18} ${214 - r * 30}, ${c * 36 + 24} ${214 - r * 30}, ${c * 36 + 30} ${220 - r * 30} C ${c * 36 + 36} ${214 - r * 30}, ${c * 36 + 42} ${214 - r * 30}, ${c * 36 + 48} ${220 - r * 30}`}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            ))
          )}
        </svg>
      </div>

      {/* Top Red Header Wrapper */}
      <div className="relative z-20 w-full bg-[#e31a22] shadow-md">
        <div className="mx-auto flex max-w-[1220px] flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <div className="flex items-center gap-4">
            <div className="relative z-30 -mb-10 flex h-[72px] w-[150px] items-center justify-center rounded-xl bg-white p-2 shadow-[0_8px_24px_rgba(0,0,0,0.25)] sm:h-[82px] sm:w-[180px]">
              <Image
                src="/apag-logo.png"
                alt="APAG"
                width={170}
                height={90}
                priority
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80 sm:text-[13px]">CSMTS Portal</p>
              <h1 className="text-xl font-black uppercase tracking-wide text-white drop-shadow sm:text-2xl">APAG 1959</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-start gap-4 text-sm font-semibold text-white sm:justify-end">
            <span className="inline-flex cursor-pointer items-center gap-1.5 text-white/95 hover:text-white transition"><HelpCircle size={18} /> Quên Mật khẩu?</span>
            <span className="inline-flex cursor-pointer items-center gap-1.5 text-white/95 hover:text-white transition"><MessageSquare size={17} /> Góp ý</span>
            <span className="cursor-pointer text-white underline decoration-white/60 underline-offset-4 hover:text-white/80">Tiếng Việt</span>
            <span className="cursor-pointer text-white/80 hover:text-white">English</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1220px] flex-1 flex-col justify-center px-4 py-12 sm:px-8 lg:px-10">
        <section className="overflow-hidden rounded-[10px] border border-white/30 bg-white/5 shadow-[0_18px_70px_rgba(0,0,0,0.34)] backdrop-blur-[1px]">
          <div className="flex flex-wrap items-center justify-end gap-5 border-b border-white/20 bg-[#e31a22]/90 px-5 py-3 text-sm font-bold sm:text-base">
            <span className="text-white">Đăng nhập với:</span>
            {["Portal", "eLearning", "Diễn đàn", "Thư viện"].map((item, index) => (
              <label key={item} className="inline-flex cursor-pointer items-center gap-2 text-white">
                <span className={`h-4 w-4 rounded-full border-2 border-white bg-white ${index === 0 ? 'shadow-[inset_0_0_0_4px_#0ea5ff]' : ''}`} />
                <span className={index === 0 ? 'text-yellow-300' : ''}>{item}</span>
              </label>
            ))}
          </div>

          <div className="flex min-h-[350px] items-center justify-center bg-[#1a195c]/85 px-5 py-10 sm:px-8">
            <div className="w-full max-w-[540px] rounded-2xl border border-white/20 bg-white/10 p-5 shadow-[0_10px_35px_rgba(0,0,0,0.22)] backdrop-blur-md sm:p-6">
              {error && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                  <AlertCircle className="mt-0.5 shrink-0" size={18} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={formik.handleSubmit} className="space-y-4">
                <div className="grid grid-cols-[130px_1fr] items-center gap-3">
                  <label className="text-base font-semibold text-white">Tên Đăng nhập:</label>
                  <input
                    type="text"
                    className="h-12 rounded-lg border-2 border-[#e31a22] bg-white px-4 text-lg font-semibold text-slate-800 outline-none transition focus:border-[#ef1b2d] focus:ring-2 focus:ring-red-200"
                    placeholder="Nhập Tên đăng nhập"
                    autoComplete="username"
                    {...formik.getFieldProps('username')}
                  />
                </div>
                {formik.errors.username && <p className="pl-[143px] text-xs font-bold text-red-100">{formik.errors.username}</p>}

                <div className="grid grid-cols-[130px_1fr] items-center gap-3">
                  <label className="text-base font-semibold text-white">Mật khẩu:</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="h-12 w-full rounded-lg border-2 border-[#e31a22] bg-white px-4 pr-11 text-lg font-semibold text-slate-800 outline-none transition focus:border-[#ef1b2d] focus:ring-2 focus:ring-red-200"
                      placeholder="Nhập Mật khẩu"
                      autoComplete="current-password"
                      {...formik.getFieldProps('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition hover:text-[#e31a22]"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                {formik.errors.password && <p className="pl-[143px] text-xs font-bold text-red-100">{formik.errors.password}</p>}

                <div className="grid grid-cols-[130px_1fr] items-center gap-3">
                  <label className="text-base font-semibold text-white">Mã xác nhận:</label>
                  <div className="flex flex-row items-center gap-2">
                    <input
                      type="text"
                      className={`h-12 w-20 shrink-0 rounded-lg border-2 bg-red-100 px-3 text-lg font-bold uppercase text-slate-800 outline-none transition ${formik.touched.captchaCode && formik.errors.captchaCode ? 'border-red-600' : 'border-[#e31a22] focus:border-[#ef1b2d] focus:ring-2 focus:ring-red-200'}`}
                      placeholder="Mã"
                      autoComplete="off"
                      {...formik.getFieldProps('captchaCode')}
                      onChange={(e) => {
                        formik.handleChange(e);
                        if (formik.errors.captchaCode) formik.setFieldError('captchaCode', undefined);
                      }}
                    />

                    <button
                      type="button"
                      onClick={loadCaptcha}
                      disabled={captchaLoading}
                      className="flex h-12 w-28 shrink-0 items-center justify-center overflow-hidden rounded bg-white/90 px-1 shadow-inner transition hover:bg-white disabled:opacity-60"
                      aria-label="Tải lại mã captcha"
                    >
                      {captchaImage ? (
                        <Image
                          src={captchaImage}
                          alt="Captcha"
                          width={110}
                          height={40}
                          unoptimized
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold text-slate-500">{captchaLoading ? '...' : 'Trống'}</span>
                      )}
                    </button>

                    <button
                      type="submit"
                      disabled={formik.isSubmitting || captchaLoading}
                      className="h-12 flex-1 cursor-pointer rounded-lg border border-red-950 bg-linear-to-b from-[#e31a22] to-[#ab1016] px-2 text-base font-black text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_12px_rgba(0,0,0,0.25)] transition hover:from-[#f23842] hover:to-[#e31a22] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {formik.isSubmitting ? '...' : 'Đăng nhập'}
                    </button>
                  </div>
                </div>
                {formik.touched.captchaCode && formik.errors.captchaCode && <p className="pl-[143px] text-xs font-bold text-red-100">{formik.errors.captchaCode}</p>}
              </form>
            </div>
          </div>
        </section>

        <footer className="mt-8 rounded-[10px] bg-white px-6 py-5 text-lg font-black text-[#4b4b4b] sm:px-10">
          Copyright© 2026 APAG.
        </footer>
      </div>
    </main>
  );
}
