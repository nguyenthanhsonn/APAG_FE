'use client';

import { useEffect, useState } from 'react';
import { Calendar, GraduationCap, Lock, Mail, Phone, School, User, X } from 'lucide-react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import type { CreateStudentPayload, ModalCreateManualStudentProps, CreateManualStudentFieldProps as FieldProps } from '../../types';
import { getUserFriendlyError } from '../../utils/errorHelper';

function Field({ label, icon: Icon, required, error, children }: FieldProps) {
  const normalizedError = Array.isArray(error) ? error[0] : error;

  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-[#1A1B1E]">
        <span className="mr-1 inline-flex items-center gap-1.5">
          <Icon size={13} className="text-[#3B5BDB]" />
          {label}
        </span>
        {required && <span className="text-[#C92A2A]">*</span>}
      </label>
      {children}
      {normalizedError && <p className="mt-1 text-xs text-[#C92A2A]">{normalizedError}</p>}
    </div>
  );
}

const defaultValues: CreateStudentPayload = {
  username: '',
  email: '',
  fullName: '',
  password: '',
  phone: '',
  dateOfBirth: '',
  studentCode: '',
  classId: '',
};

const validationSchema = Yup.object({
  username: Yup.string().min(3, 'Tối thiểu 3 ký tự').max(50, 'Tối đa 50 ký tự').required('Vui lòng nhập tên đăng nhập'),
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  fullName: Yup.string().min(2, 'Tối thiểu 2 ký tự').max(100, 'Tối đa 100 ký tự').required('Vui lòng nhập họ tên'),
  password: Yup.string().min(6, 'Tối thiểu 6 ký tự').max(50, 'Tối đa 50 ký tự').required('Vui lòng nhập mật khẩu'),
  phone: Yup.string().matches(/^[0-9]{9,11}$/, 'Số điện thoại không hợp lệ').optional(),
  dateOfBirth: Yup.string().optional(),
  studentCode: Yup.string().optional(),
  classId: Yup.string().optional(),
}).test('student-code-class-pair', function validateStudentClassPair(values) {
  const hasStudentCode = Boolean(values?.studentCode);
  const hasClassId = Boolean(values?.classId);

  if (hasStudentCode && !hasClassId) {
    return this.createError({
      path: 'classId',
      message: 'Đã nhập mã sinh viên thì cần chọn lớp',
    });
  }

  if (hasClassId && !hasStudentCode) {
    return this.createError({
      path: 'studentCode',
      message: 'Đã chọn lớp thì cần nhập mã sinh viên',
    });
  }

  return true;
});

export default function ModalCreateManualStudent({
  isOpen,
  onClose,
  onSubmit,
  classes,
}: ModalCreateManualStudentProps) {
  const [submitError, setSubmitError] = useState('');

  const formik = useFormik<CreateStudentPayload>({
    initialValues: defaultValues,
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        setSubmitError('');
        await onSubmit({
          ...values,
          phone: values.phone || undefined,
          dateOfBirth: values.dateOfBirth || undefined,
          studentCode: values.studentCode || undefined,
          classId: values.classId || undefined,
        });
        resetForm();
        onClose();
      } catch (err) {
        setSubmitError(getUserFriendlyError(err, 'Không thể tạo sinh viên. Vui lòng kiểm tra lại thông tin.'));
      } finally {
        setSubmitting(false);
      }
    },
  });

  useEffect(() => {
    if (isOpen) {
      setSubmitError('');
      formik.resetForm({ values: defaultValues });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const inputCls = (name: string) => {
    const hasError = !!formik.errors[name as keyof CreateStudentPayload];
    return `w-full rounded-lg border px-3 py-2.5 text-sm text-[#1A1B1E] outline-none transition-all duration-150 focus:ring-2 ${
      hasError
        ? 'border-[#C92A2A] focus:ring-[#C92A2A]/20'
        : 'border-[#DEE2E6] focus:border-[#4C6EF5] focus:ring-[#4C6EF5]/20'
    }`;
  };

  return (
    <>
      <div className="fixed inset-0 z-40 cursor-pointer bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E9ECEF] bg-white px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A1B1E]">Thêm sinh viên mới</h2>
              <p className="mt-0.5 text-xs text-[#868E96]">Tạo tài khoản sinh viên thủ công. Có thể gán lớp ngay nếu có mã sinh viên.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#868E96] transition hover:bg-[#F8F9FA] hover:text-[#1A1B1E]"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={formik.handleSubmit} className="p-6">
            {submitError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {submitError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Tên đăng nhập" icon={User} required error={formik.errors.username}>
                <input type="text" className={inputCls('username')} placeholder="Nhập tên đăng nhập" {...formik.getFieldProps('username')} />
              </Field>

              <Field label="Mật khẩu" icon={Lock} required error={formik.errors.password}>
                <input type="password" className={inputCls('password')} placeholder="Nhập mật khẩu" {...formik.getFieldProps('password')} />
              </Field>

              <Field label="Họ và tên" icon={User} required error={formik.errors.fullName}>
                <input type="text" className={inputCls('fullName')} placeholder="Nhập họ và tên" {...formik.getFieldProps('fullName')} />
              </Field>

              <Field label="Mã sinh viên" icon={GraduationCap} error={formik.errors.studentCode}>
                <input type="text" className={inputCls('studentCode')} placeholder="Nhập mã sinh viên" {...formik.getFieldProps('studentCode')} />
              </Field>

              <Field label="Email" icon={Mail} required error={formik.errors.email}>
                <input type="email" className={inputCls('email')} placeholder="Nhập email" {...formik.getFieldProps('email')} />
              </Field>

              <Field label="Số điện thoại" icon={Phone} error={formik.errors.phone}>
                <input type="text" className={inputCls('phone')} placeholder="Nhập số điện thoại" {...formik.getFieldProps('phone')} />
              </Field>

              <Field label="Ngày sinh" icon={Calendar} error={formik.errors.dateOfBirth}>
                <input type="date" className={inputCls('dateOfBirth')} {...formik.getFieldProps('dateOfBirth')} />
              </Field>

              <Field label="Lớp" icon={School} error={formik.errors.classId}>
                <select className={inputCls('classId')} {...formik.getFieldProps('classId')}>
                  <option value="">-- Chọn lớp --</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {[classItem.code, classItem.name].filter(Boolean).join(' - ')}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#E9ECEF] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-lg border border-[#DEE2E6] bg-white px-5 py-2 text-sm font-semibold text-[#495057] transition hover:bg-[#F8F9FA]"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={formik.isSubmitting}
                className="cursor-pointer rounded-lg bg-[#0B3A82] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#104E92] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Thêm sinh viên
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
