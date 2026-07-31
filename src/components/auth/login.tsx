'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { GraduationCap, Lock, User, AlertCircle, Eye, EyeOff, FlaskConical, Users, Building2, BarChart3, ArrowRight } from 'lucide-react';
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

const DEMO_ROLES = [
  {
    label: 'Lớp trưởng',
    sub: 'CNTT-K45A',
    href: '/class_leader',
    icon: Users,
    color: 'hover:border-amber-400',
    iconBg: 'bg-amber-50 text-amber-600',
  },
  {
    label: 'Khoa',
    sub: 'Công nghệ thông tin',
    href: '/faculty',
    icon: Building2,
    color: 'hover:border-blue-400',
    iconBg: 'bg-blue-50 text-blue-600',
  },
  {
    label: 'Phòng Đào tạo',
    sub: 'Chỉ xem báo cáo',
    href: '/training_department',
    icon: BarChart3,
    color: 'hover:border-purple-400',
    iconBg: 'bg-purple-50 text-purple-600',
  },
] as const;

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
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* ── Login Card ─────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <GraduationCap className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Đánh giá Rèn luyện Sinh viên
            </h1>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={20} />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={formik.handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nhập tên đăng nhập"
                  autoComplete="username"
                  {...formik.getFieldProps('username')}
                />
              </div>
              {formik.errors.username && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Nhập mật khẩu"
                  {...formik.getFieldProps('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none p-1 transition-colors select-none"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {formik.errors.password && (
                <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã captcha
              </label>
              <div className="flex flex-row items-center gap-3 w-full">
                <div className="relative flex-1">
                  <input
                    type="text"
                    className={`w-full px-4 py-3 border rounded-xl uppercase focus:ring-2 focus:ring-blue-500/20 outline-none transition-all duration-200 ${formik.touched.captchaCode && formik.errors.captchaCode
                      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20 animate-shake'
                      : 'border-gray-300 focus:border-blue-500'
                      }`}
                    placeholder="Nhập mã captcha"
                    autoComplete="off"
                    {...formik.getFieldProps('captchaCode')}
                    onChange={(e) => {
                      formik.handleChange(e);
                      if (formik.errors.captchaCode) {
                        formik.setFieldError('captchaCode', undefined);
                      }
                    }}
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex h-12 w-[140px] items-center justify-center overflow-hidden rounded-xl bg-white select-none relative">
                    {captchaImage ? (
                      <Image
                        src={captchaImage}
                        alt="Captcha"
                        width={140}
                        height={48}
                        unoptimized
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-400">
                        {captchaLoading ? '...' : 'Trống'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {formik.touched.captchaCode && formik.errors.captchaCode && (
                <p className="text-red-500 text-xs font-medium mt-1.5 flex items-center gap-1 animate-fade-in">
                  <span>{formik.errors.captchaCode}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={formik.isSubmitting || captchaLoading}
              className="w-full bg-[#3B5BDB] text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {formik.isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>

        {/* ── Demo Mock Roles ─────────────────────────────────────────── */}
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <FlaskConical size={14} className="shrink-0 text-amber-600" />
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
              Demo — Vào thẳng không cần đăng nhập
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ROLES.map((r) => {
              const Icon = r.icon;
              return (
                <Link
                  key={r.href}
                  href={r.href}
                  className={`group flex flex-col items-center gap-1.5 rounded-xl border border-[#E9ECEF] bg-white px-2 py-3 text-center transition hover:shadow-sm ${r.color}`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${r.iconBg}`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-[#1A1B1E] leading-tight">
                      {r.label}
                    </p>
                    <p className="text-[10px] text-[#868E96] mt-0.5 leading-tight">{r.sub}</p>
                  </div>
                  <ArrowRight size={12} className="text-[#ADB5BD] transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
