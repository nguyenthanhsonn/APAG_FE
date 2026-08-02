'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, User, Lock, Mail, Phone, Calendar, ShieldCheck, Building2, GraduationCap } from 'lucide-react';
import type { StudentFormValues, ModalCreateStudentProps, CreateStudentFieldProps as FieldProps } from '../../types';

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

const currentYear = new Date().getFullYear();

const buildValidationSchema = (isEdit: boolean) => Yup.object({
  username: Yup.string()
    .min(3, 'Tối thiểu 3 ký tự')
    .max(50, 'Tối đa 50 ký tự')
    .required('Vui lòng nhập tên đăng nhập'),
  fullName: Yup.string()
    .min(2, 'Tối thiểu 2 ký tự')
    .max(100, 'Tối đa 100 ký tự')
    .required('Vui lòng nhập họ tên'),
  password: isEdit
    ? Yup.string().optional()
    : Yup.string()
        .min(8, 'Tối thiểu 8 ký tự')
        .max(50, 'Tối đa 50 ký tự')
        .required('Vui lòng nhập mật khẩu'),
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  phone: Yup.string()
    .matches(/^[0-9]{9,11}$/, 'Số điện thoại không hợp lệ')
    .optional(),
  dateOfBirth: Yup.string().optional(),
  studentCode: Yup.string().optional(),
  facultyId: Yup.string().test('faculty-required', 'Vui lòng chọn khoa phụ trách', function (value) {
    return this.parent.role !== 'faculty' || !!value;
  }),
  majorId: Yup.string().optional(),
  classId: Yup.string().test('class-required', 'Vui lòng chọn lớp phụ trách', function (value) {
    return !['advisor', 'class_leader'].includes(this.parent.role) || !!value;
  }),
  admissionYear: Yup.string().optional(),
  role: Yup.string().oneOf(['admin', 'class_leader', 'advisor', 'faculty', 'training_department']).required('Vui lòng chọn vai trò'),
});

const defaultValues: StudentFormValues = {
  username: '',
  fullName: '',
  password: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  studentCode: '',
  facultyId: '',
  majorId: '',
  classId: '',
  admissionYear: String(currentYear),
  role: 'admin',
};

export default function ModalCreateStudent({
  isOpen,
  onClose,
  onSubmit,
  editData,
  faculties = [],
  classes = [],
}: ModalCreateStudentProps) {
  const isEdit = !!editData;
  const [submitError, setSubmitError] = useState('');

  const formik = useFormik<StudentFormValues>({
    initialValues: editData ?? defaultValues,
    validationSchema: buildValidationSchema(isEdit),
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: async (
      values: StudentFormValues,
      { resetForm, setSubmitting }: { resetForm: (options?: any) => void; setSubmitting: (isSubmitting: boolean) => void }
    ) => {
      try {
        setSubmitError('');
        await onSubmit(values);
        resetForm();
        onClose();
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Không thể lưu thông tin người dùng. Vui lòng kiểm tra lại.');
      } finally {
        setSubmitting(false);
      }
    },
  });

  // Reset form khi mở modal mới hoặc chuyển qua edit
  useEffect(() => {
    if (isOpen) {
      setSubmitError('');
      formik.resetForm({ values: editData ?? defaultValues });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const inputCls = (name: string) => {
    const hasError = !!formik.errors[name as keyof StudentFormValues];
    return `w-full rounded-lg border px-3 py-2.5 text-sm text-[#1A1B1E] outline-none transition-all duration-150 focus:ring-2 ${
      hasError
        ? 'border-[#C92A2A] focus:ring-[#C92A2A]/20'
        : 'border-[#DEE2E6] focus:border-[#4C6EF5] focus:ring-[#4C6EF5]/20'
    }`;
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 cursor-pointer bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E9ECEF] bg-white px-6 py-4">
            <div>
              <h2 className="text-lg font-bold text-[#1A1B1E]">
                {isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </h2>
              <p className="mt-0.5 text-xs text-[#868E96]">
                {isEdit ? 'Cập nhật thông tin người dùng' : 'Tạo tài khoản nội bộ, không dùng cho sinh viên'}
              </p>
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

            <div className="space-y-4">
              {/* Username + Password */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tên đăng nhập" icon={User} required error={formik.errors.username}>
                  <input
                    type="text"
                    className={inputCls('username')}
                    placeholder="Nhập tên đăng nhập"
                    {...formik.getFieldProps('username')}
                  />
                </Field>

                <Field label="Mật khẩu" icon={Lock} required={!isEdit} error={formik.errors.password}>
                  <input
                    type="password"
                    className={`${inputCls('password')} ${isEdit ? 'cursor-not-allowed bg-[#F1F3F5] text-[#868E96]' : ''}`}
                    placeholder={isEdit ? 'Không đổi mật khẩu tại đây' : 'Nhập mật khẩu'}
                    disabled={isEdit}
                    {...formik.getFieldProps('password')}
                  />
                </Field>
              </div>

              <Field label="Vai trò" icon={ShieldCheck} required error={formik.errors.role}>
                <select
                  className={inputCls('role')}
                  value={formik.values.role}
                  onChange={(e) => {
                    const nextRole = e.target.value;
                    formik.setFieldValue('role', nextRole);
                    if (nextRole !== 'faculty') {
                      formik.setFieldValue('facultyId', '');
                    }
                    if (!['advisor', 'class_leader'].includes(nextRole)) {
                      formik.setFieldValue('classId', '');
                    }
                  }}
                >
                  <option value="admin">Quản trị viên</option>
                  <option value="class_leader">Lớp trưởng</option>
                  <option value="advisor">Cố vấn học tập</option>
                  <option value="faculty">Khoa</option>
                  <option value="training_department">Phòng Đào tạo</option>
                </select>
              </Field>

              {formik.values.role === 'faculty' && (
                <Field label="Khoa phụ trách" icon={Building2} required error={formik.errors.facultyId}>
                  <select
                    className={inputCls('facultyId')}
                    value={formik.values.facultyId}
                    onChange={(e) => formik.setFieldValue('facultyId', e.target.value)}
                  >
                    <option value="">-- Chọn khoa --</option>
                    {faculties
                      .filter((faculty) => faculty.isActive !== false)
                      .map((faculty) => (
                        <option key={faculty.id} value={faculty.id}>
                          {[faculty.code, faculty.name].filter(Boolean).join(' - ')}
                        </option>
                      ))}
                  </select>
                </Field>
              )}

              {['advisor', 'class_leader'].includes(formik.values.role) && (
                <Field label="Lớp phụ trách" icon={GraduationCap} required error={formik.errors.classId}>
                  <select
                    className={inputCls('classId')}
                    value={formik.values.classId}
                    onChange={(e) => formik.setFieldValue('classId', e.target.value)}
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes
                      .filter((classItem) => classItem.isActive !== false)
                      .map((classItem) => (
                        <option key={classItem.id} value={classItem.id}>
                          {[classItem.code, classItem.name].filter(Boolean).join(' - ')}
                        </option>
                      ))}
                  </select>
                </Field>
              )}

              {/* Họ tên */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Họ và tên" icon={User} required error={formik.errors.fullName}>
                  <input
                    type="text"
                    className={inputCls('fullName')}
                    placeholder="Nhập họ và tên"
                    {...formik.getFieldProps('fullName')}
                  />
                </Field>
              </div>

              {/* SĐT + Ngày sinh */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Số điện thoại" icon={Phone} error={formik.errors.phone}>
                  <input
                    type="text"
                    className={inputCls('phone')}
                    placeholder="Nhập số điện thoại"
                    {...formik.getFieldProps('phone')}
                  />
                </Field>

                <Field label="Ngày sinh" icon={Calendar} error={formik.errors.dateOfBirth}>
                  <input
                    type="date"
                    className={inputCls('dateOfBirth')}
                    {...formik.getFieldProps('dateOfBirth')}
                  />
                </Field>
              </div>

              {/* Email */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Email" icon={Mail} required error={formik.errors.email}>
                  <input
                    type="email"
                    className={inputCls('email')}
                    placeholder="Nhập email"
                    {...formik.getFieldProps('email')}
                  />
                </Field>
              </div>

            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 border-t border-[#E9ECEF] pt-4 mt-6">
              <div />
              
              <div className="flex items-center gap-3">
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
                  className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#0B3A82] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#104E92] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEdit ? 'Cập nhật' : 'Thêm người dùng'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

    </>
  );
}
