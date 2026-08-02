'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  AlertCircle,
  Eye,
  EyeOff,
  HelpCircle,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_Auth } from '../../api/API_Auth';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { UserRole } from '../../types/common';
import { getUserFriendlyError } from '../../utils/errorHelper';
import { useToast } from '../../components/common/ToastProvider';
import ForgotPassword from './forgotPassword';

const LoginSchema = Yup.object().shape({
  username: Yup.string().trim().required('Vui lòng nhập tên đăng nhập'),
  password: Yup.string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự')
    .max(50, 'Mật khẩu tối đa 50 ký tự')
    .required('Vui lòng nhập mật khẩu'),
  captchaCode: Yup.string().trim().required('Vui lòng nhập mã captcha'),
});

const FORM_WIDTH = 720;

function useFitScale(baseWidth: number, basePadding = 32) {
  const [scale, setScale] = useState(1);
  const outerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      if (!outerRef.current) return;
      const available = outerRef.current.offsetWidth - basePadding;
      const next = Math.min(1, available / baseWidth);
      setScale(Math.max(0.35, next));
    }

    update();
    const ro = new ResizeObserver(update);
    if (outerRef.current) ro.observe(outerRef.current);
    window.addEventListener('resize', update);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [baseWidth, basePadding]);

  return { scale, outerRef };
}

export default function Login() {
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaImage, setCaptchaImage] = useState('');
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const wrongCaptchaCountRef = useRef(0);
  const toast = useToast();
  const { scale, outerRef } = useFitScale(FORM_WIDTH, 32);

  const loadCaptcha = async (showError = false) => {
    try {
      setCaptchaLoading(true);
      const captcha = await API_Auth.getCaptcha();
      setCaptchaId(captcha.captchaId || '');
      setCaptchaImage(captcha.image || '');
    } catch (err: any) {
      if (showError) setError(getUserFriendlyError(err, 'Không thể tải mã xác nhận. Vui lòng thử lại.'));
    } finally {
      setCaptchaLoading(false);
    }
  };

  useEffect(() => { loadCaptcha(false); }, []);

  const getRoleHome = (role: UserRole) => {
    switch (role) {
      case 'admin':               return '/admin';
      case 'advisor':            return '/advisor';
      case 'class_leader':        return '/class_leader';
      case 'faculty':             return '/faculty';
      case 'training_department': return '/training_department';
      case 'student':
      default: return '/student';
    }
  };

  const formik = useFormik<Yup.InferType<typeof LoginSchema>>({
    initialValues: { username: '', password: '', captchaCode: '' },
    validationSchema: LoginSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values, { setSubmitting }) => {
      setError('');
      try {
        if (!captchaId) {
          setError('Vui lòng tải lại mã captcha.');
          await loadCaptcha(true);
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
          await loadCaptcha(false);
          wrongCaptchaCountRef.current += 1;
          if (wrongCaptchaCountRef.current >= 3) {
            wrongCaptchaCountRef.current = 0;
            toast.error('Bạn đã nhập sai nhiều lần, mã captcha mới đã được tạo.');
          }
        } else {
          setError(getUserFriendlyError(err, 'Đăng nhập không thành công. Vui lòng kiểm tra lại.'));
          formik.setFieldValue('captchaCode', '');
          await loadCaptcha(false);
        }
      } finally {
        setSubmitting(false);
      }
    },
  });

  const inputCls = (hasError: boolean) =>
    `h-10 w-full rounded-xl border bg-white px-4 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 ${hasError
      ? 'border-red-400 focus:border-[#ED1C24] focus:ring-2 focus:ring-[#ED1C24]/20'
      : 'border-gray-300 focus:border-[#ED1C24] focus:ring-2 focus:ring-[#ED1C24]/20'
    }`;

  return (
    <div
      id="page-background"
      className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#2B2E7F]"
      style={{
        backgroundImage: "url('/apag-login-bg.png')",
        backgroundSize: 'contain',
        backgroundPosition: 'top center',
        backgroundRepeat: 'no-repeat',
      }}
    >


      {/* ── MAIN ───────────────────────────────────────────────────────────── */}
      <main
        id="scale-outer"
        ref={outerRef}
        className="relative z-10 flex w-full flex-1 items-center justify-center overflow-hidden py-6"
        style={{ minHeight: 'calc(100dvh - 108px)' }}
      >
        <div
          id="scale-inner"
          style={{
            width: FORM_WIDTH,
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 8px', flexShrink: 0 }}>
            <span style={{ marginRight: 16, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#fff', whiteSpace: 'nowrap' }}>
              Hệ thống Rèn luyện Sinh viên
            </span>
            {!showForgotPassword && (
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap text-white/90 transition hover:text-white"
              >
                <HelpCircle size={14} /> Quên mật khẩu?
              </button>
            )}
          </div>
          {showForgotPassword ? (
            <ForgotPassword
              onClose={(usernameOrEmail) => {
                setShowForgotPassword(false);
                if (usernameOrEmail) {
                  formik.setFieldValue('username', usernameOrEmail);
                }
              }}
            />
          ) : (
            <div
              data-login-card="true"
              style={{
                width: FORM_WIDTH,
                height: 'auto',
                borderRadius: '1.5rem',
                border: '1px solid rgba(255,255,255,0.20)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.55)',
                background: 'rgba(255,255,255,0.09)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Two-column body */}
              <div data-login-body="true" style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden' }}>
                {/* RIGHT — form */}
                <div style={{ flex: 1, padding: '24px 36px 28px', overflowY: 'auto' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>
                    Tài khoản hệ thống
                  </p>
                  <p style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 20 }}>Đăng nhập</p>

                  {error && (
                    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8, borderRadius: 12, border: '1px solid rgba(248,113,113,0.3)', background: 'rgba(239,68,68,0.15)', padding: '10px 12px', color: '#fff' }}>
                      <AlertCircle size={16} style={{ marginTop: 2, flexShrink: 0, color: '#fca5a5' }} />
                      <p style={{ fontSize: 13, fontWeight: 500 }}>{error}</p>
                    </div>
                  )}

                  <form onSubmit={formik.handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Tên đăng nhập</label>
                      <input type="text" placeholder="Nhập tên đăng nhập" autoComplete="username"
                        className={inputCls(!!formik.errors.username)}
                        {...formik.getFieldProps('username')} />
                      {formik.errors.username && <p style={{ marginTop: 2, fontSize: 11, fontWeight: 500, color: '#fca5a5' }}>{formik.errors.username}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Mật khẩu</label>
                      <div style={{ position: 'relative' }}>
                        <input type={showPassword ? 'text' : 'password'} placeholder="Nhập mật khẩu" autoComplete="current-password"
                          className={`${inputCls(!!formik.errors.password)} pr-10`}
                          {...formik.getFieldProps('password')} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#9ca3af' }}
                          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}>
                          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                      </div>
                      {formik.errors.password && <p style={{ marginTop: 2, fontSize: 11, fontWeight: 500, color: '#fca5a5' }}>{formik.errors.password}</p>}
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: 4, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Mã xác nhận</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

                        <input type="text" placeholder="Nhập mã" autoComplete="off"
                          className={`h-10 flex-1 rounded-xl border bg-white px-3 text-sm font-bold uppercase tracking-widest text-gray-900 outline-none transition placeholder:text-gray-400 placeholder:normal-case placeholder:tracking-normal ${formik.touched.captchaCode && formik.errors.captchaCode
                              ? 'border-red-400 focus:border-[#ED1C24] focus:ring-2 focus:ring-[#ED1C24]/20'
                              : 'border-gray-300 focus:border-[#ED1C24] focus:ring-2 focus:ring-[#ED1C24]/20'
                            }`}
                          {...formik.getFieldProps('captchaCode')}
                          onChange={(e) => { formik.handleChange(e); if (formik.errors.captchaCode) formik.setFieldError('captchaCode', undefined); }} />
                        <div
                          style={{ width: 112, height: 40, flexShrink: 0, borderRadius: 12, border: '1px solid #d1d5db', background: '#fff', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label="Mã captcha"
                        >
                          {captchaImage ? (
                            <Image src={captchaImage} alt="Captcha" width={108} height={36} unoptimized style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }} />
                          ) : (
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af' }}>{captchaLoading ? '...' : 'Trống'}</span>
                          )}
                        </div>
                      </div>
                      {formik.touched.captchaCode && formik.errors.captchaCode && (
                        <p style={{ marginTop: 2, fontSize: 11, fontWeight: 500, color: '#fca5a5' }}>{formik.errors.captchaCode}</p>
                      )}
                    </div>

                    <button type="submit" disabled={formik.isSubmitting || captchaLoading}
                      style={{ marginTop: 4, height: 44, width: '100%', borderRadius: 12, background: '#ED1C24', border: 'none', color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer', boxShadow: '0 4px 18px rgba(237,28,36,0.4)' }}>
                      {formik.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ position: 'relative', zIndex: 10, width: '100%', padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.45)', background: 'rgba(20,22,80,0.50)', backdropFilter: 'blur(6px)', flexShrink: 0 }}>
        Copyright © 2026 Học viện Phòng không – Không quân (APAG). All rights reserved.
      </footer>
    </div>
  );
}
