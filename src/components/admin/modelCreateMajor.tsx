'use client';

import { useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, Hash, BookOpen, Building2 } from 'lucide-react';
import type { MajorFormValues, ModalCreateMajorProps } from '../../types';

const validationSchema = Yup.object({
  code: Yup.string()
    .max(20, 'Tối đa 20 ký tự')
    .required('Vui lòng nhập mã ngành'),
  name: Yup.string()
    .max(100, 'Tối đa 100 ký tự')
    .required('Vui lòng nhập tên ngành'),
  facultyId: Yup.string().required('Vui lòng chọn khoa quản lý'),
});

const defaultValues: MajorFormValues = {
  code: '',
  name: '',
  facultyId: '',
};

export default function ModalCreateMajor({
  isOpen,
  onClose,
  onSubmit,
  editData,
  faculties = [],
}: ModalCreateMajorProps) {
  const isEdit = !!editData;

  const formik = useFormik<MajorFormValues>({
    initialValues: editData
      ? { code: editData.code, name: editData.name, facultyId: editData.facultyId }
      : defaultValues,
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: (values: MajorFormValues, { resetForm }: { resetForm: (options?: any) => void }) => {
      onSubmit(values);
      resetForm();
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      formik.resetForm({
        values: editData
          ? { code: editData.code, name: editData.name, facultyId: editData.facultyId }
          : defaultValues,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const inputCls = (name: keyof MajorFormValues) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-[#1A1B1E] outline-none transition-all duration-150 focus:ring-2 ${
      formik.errors[name]
        ? 'border-[#C92A2A] focus:ring-[#C92A2A]/20'
        : 'border-[#DEE2E6] focus:border-[#4C6EF5] focus:ring-[#4C6EF5]/20'
    }`;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 cursor-pointer bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div
          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E9ECEF] px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-[#1A1B1E]">
                {isEdit ? 'Chỉnh sửa ngành học' : 'Thêm ngành học mới'}
              </h2>
              <p className="mt-0.5 text-xs text-[#868E96]">
                {isEdit ? 'Cập nhật thông tin ngành học' : 'Điền thông tin để tạo ngành học mới'}
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

          <form onSubmit={formik.handleSubmit} className="px-6 py-5 space-y-4">
            {/* Mã ngành */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#1A1B1E]">
                <Hash size={13} className="text-[#3B5BDB]" />
                Mã ngành <span className="text-[#C92A2A]">*</span>
              </label>
              <input
                type="text"
                className={inputCls('code')}
                placeholder="vd: CNTT"
                {...formik.getFieldProps('code')}
              />
              {formik.errors.code && (
                <p className="mt-1 text-xs text-[#C92A2A]">{formik.errors.code}</p>
              )}
            </div>

            {/* Tên ngành */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#1A1B1E]">
                <BookOpen size={13} className="text-[#3B5BDB]" />
                Tên ngành <span className="text-[#C92A2A]">*</span>
              </label>
              <input
                type="text"
                className={inputCls('name')}
                placeholder="vd: Công nghệ thông tin"
                {...formik.getFieldProps('name')}
              />
              {formik.errors.name && (
                <p className="mt-1 text-xs text-[#C92A2A]">{formik.errors.name}</p>
              )}
            </div>

            {/* Khoa */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#1A1B1E]">
                <Building2 size={13} className="text-[#3B5BDB]" />
                Khoa <span className="text-[#C92A2A]">*</span>
              </label>
              <select className={inputCls('facultyId')} {...formik.getFieldProps('facultyId')}>
                <option value="">-- Chọn khoa --</option>
                {faculties
                  .filter((f) => f.isActive)
                  .map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
              </select>
              {formik.errors.facultyId && (
                <p className="mt-1 text-xs text-[#C92A2A]">{formik.errors.facultyId}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#E9ECEF] pt-4">
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
                {isEdit ? 'Cập nhật' : 'Tạo ngành'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
