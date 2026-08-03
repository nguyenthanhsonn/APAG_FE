'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, Download } from 'lucide-react';
import type { ModalAddStudentProps, AddStudentFormValues } from '../../types';
import ModalImportExcel from './modalImportExcel';

const validationSchema = Yup.object({
  studentCode: Yup.string()
    .min(3, 'Tối thiểu 3 ký tự')
    .required('Vui lòng nhập mã sinh viên'),
  fullName: Yup.string()
    .min(2, 'Tối thiểu 2 ký tự')
    .required('Vui lòng nhập họ tên sinh viên'),
  dateOfBirth: Yup.string().required('Vui lòng chọn ngày sinh'),
  phoneNumber: Yup.string()
    .matches(/^[0-9]{9,11}$/, 'Số điện thoại không hợp lệ')
    .required('Vui lòng nhập số điện thoại'),
  classId: Yup.string().required('Vui lòng chọn lớp học'),
});

export default function ModalAddStudent({
  isOpen,
  onClose,
  onSubmit,
  defaultClassId = '',
  classes = [],
  onImportSuccess,
}: ModalAddStudentProps) {
  const [importOpen, setImportOpen] = useState(false);

  const formik = useFormik<AddStudentFormValues>({
    initialValues: {
      studentCode: '',
      fullName: '',
      dateOfBirth: '',
      phoneNumber: '',
      classId: defaultClassId,
    },
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: (values: AddStudentFormValues, { resetForm }: { resetForm: (options?: any) => void }) => {
      onSubmit({
        studentCode: values.studentCode,
        fullName: values.fullName,
        dateOfBirth: values.dateOfBirth,
        phoneNumber: values.phoneNumber,
        classId: values.classId,
      });
      resetForm();
      onClose();
    },
  });

  useEffect(() => {
    if (isOpen) {
      formik.resetForm({
        values: {
          studentCode: '',
          fullName: '',
          dateOfBirth: '',
          phoneNumber: '',
          classId: defaultClassId,
        },
      });
      setImportOpen(false);
    }
    // formik methods are stable enough here; adding the whole object would reset on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultClassId]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in backdrop-blur-[2px]" onClick={onClose}>
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Thêm sinh viên vào lớp</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={formik.handleSubmit} className="p-6 space-y-4">
            {/* Lớp học */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Lớp học</label>
              <select
                className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-[#1A1B1E] outline-none transition focus:ring-2 focus:ring-blue-500/20"
                {...formik.getFieldProps('classId')}
                disabled
              >
                <option value="">Chọn lớp học</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mã sinh viên */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mã sinh viên</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập mã sinh viên"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm text-[#1A1B1E] outline-none transition focus:ring-2 ${
                    formik.errors.studentCode ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20'
                  }`}
                  {...formik.getFieldProps('studentCode')}
                />
              </div>
              {formik.errors.studentCode && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.studentCode}</p>
              )}
            </div>

            {/* Họ tên */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Họ tên</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nhập họ tên sinh viên"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm text-[#1A1B1E] outline-none transition focus:ring-2 ${
                    formik.errors.fullName ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20'
                  }`}
                  {...formik.getFieldProps('fullName')}
                />
              </div>
              {formik.errors.fullName && (
                <p className="mt-1 text-xs text-red-500">{formik.errors.fullName}</p>
              )}
            </div>

            {/* Ngày sinh & Số điện thoại */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày sinh</label>
                <input
                  type="date"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm text-[#1A1B1E] outline-none transition focus:ring-2 ${
                    formik.errors.dateOfBirth ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20'
                  }`}
                  {...formik.getFieldProps('dateOfBirth')}
                />
                {formik.errors.dateOfBirth && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.dateOfBirth}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  placeholder="Nhập SĐT"
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm text-[#1A1B1E] outline-none transition focus:ring-2 ${
                    formik.errors.phoneNumber ? 'border-red-500 focus:ring-red-500/20' : 'border-gray-200 focus:ring-blue-500/20'
                  }`}
                  {...formik.getFieldProps('phoneNumber')}
                />
                {formik.errors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-500">{formik.errors.phoneNumber}</p>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
              <div>
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 select-none"
                >
                  <Download size={13} />
                  Nhập từ Excel
                </button>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 rounded-xl transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={formik.isSubmitting}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-[#0B3A82] hover:bg-[#104E92] rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  Thêm sinh viên
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <ModalImportExcel
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          if (onImportSuccess) {
            onImportSuccess();
          }
          onClose();
        }}
        classId={defaultClassId}
      />
    </>
  );
}
