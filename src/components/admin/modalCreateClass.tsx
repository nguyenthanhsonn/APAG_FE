'use client';

import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { X, Hash, BookOpen, Building2, GraduationCap, Download } from 'lucide-react';
import { API_Admin } from '../../api/API_Admin';
import { getUserFriendlyError, toArray } from '../../utils/adminData';
import type { ClassFormValues, Major, ModalCreateClassProps } from '../../types';

const validationSchema = Yup.object({
  code: Yup.string()
    .max(20, 'Tối đa 20 ký tự')
    .required('Vui lòng nhập mã lớp'),
  name: Yup.string()
    .max(100, 'Tối đa 100 ký tự')
    .required('Vui lòng nhập tên lớp'),
  facultyId: Yup.string().required('Vui lòng chọn khoa'),
  majorId: Yup.string().required('Vui lòng chọn ngành'),
});

const defaultValues: ClassFormValues = {
  code: '',
  name: '',
  facultyId: '',
  majorId: '',
};

export default function ModalCreateClass({
  isOpen,
  onClose,
  onSubmit,
  editData,
  faculties = [],
  majors = [],
}: ModalCreateClassProps) {
  const isEdit = !!editData;
  const [majorOptions, setMajorOptions] = useState<Major[]>([]);
  const [majorLoading, setMajorLoading] = useState(false);
  const [majorError, setMajorError] = useState('');

  const formik = useFormik<ClassFormValues>({
    initialValues: editData
      ? { code: editData.code, name: editData.name, facultyId: editData.facultyId, majorId: editData.majorId }
      : defaultValues,
    validationSchema,
    validateOnBlur: false,
    validateOnChange: false,
    onSubmit: (values: ClassFormValues, { resetForm }: { resetForm: (options?: any) => void }) => {
      onSubmit(values);
      resetForm();
      onClose();
    },
  });

  const { resetForm } = formik;
  const selectedFacultyId = formik.values.facultyId;

  useEffect(() => {
    if (isOpen) {
      resetForm({
        values: editData
          ? { code: editData.code, name: editData.name, facultyId: editData.facultyId, majorId: editData.majorId }
          : defaultValues,
      });
    }
  }, [isOpen, editData, resetForm]);

  useEffect(() => {
    const loadMajorsByFaculty = async () => {
      if (!isOpen || !selectedFacultyId) {
        setMajorOptions([]);
        return;
      }

      try {
        setMajorLoading(true);
        setMajorError('');
        const data = await API_Admin.getFacultyMajors(selectedFacultyId, { page: 1, limit: 1000, isActive: true, includeDeleted: false });
        const nextMajors = toArray(data as any).map((m: any) => ({
          id: m.id || m._id || '',
          code: m.code || '',
          name: m.name || '',
          facultyId: m.facultyId || m.faculty_id || m.faculty?.id || m.faculty?._id || '',
          faculty: m.faculty,
          isActive: m.isActive ?? true,
        }));
        setMajorOptions(nextMajors);
      } catch (err) {
        setMajorOptions([]);
        setMajorError(getUserFriendlyError(err, 'Không thể tải danh sách ngành trong khoa.'));
      } finally {
        setMajorLoading(false);
      }
    };

    loadMajorsByFaculty();
  }, [isOpen, selectedFacultyId]);

  const filteredMajors = majorOptions.length > 0
    ? majorOptions
    : majors.filter((m) => m.facultyId === selectedFacultyId && m.isActive);

  const handleFacultyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    formik.setFieldValue('facultyId', e.target.value);
    formik.setFieldValue('majorId', '');
    setMajorOptions([]);
    setMajorError('');
  };

  if (!isOpen) return null;

  const inputCls = (name: keyof ClassFormValues) =>
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

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E9ECEF] px-6 py-4">
            <div>
              <h2 className="text-base font-bold text-[#1A1B1E]">
                {isEdit ? 'Chỉnh sửa lớp' : 'Thêm lớp mới'}
              </h2>
              <p className="mt-0.5 text-xs text-[#868E96]">
                {isEdit ? 'Cập nhật thông tin lớp học' : 'Điền thông tin để tạo lớp mới'}
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

            {/* Mã lớp */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#1A1B1E]">
                <Hash size={13} className="text-[#3B5BDB]" />
                Mã lớp <span className="text-[#C92A2A]">*</span>
              </label>
              <input
                type="text"
                className={inputCls('code')}
                placeholder="vd: CNTT-K18A"
                {...formik.getFieldProps('code')}
              />
              {formik.errors.code && (
                <p className="mt-1 text-xs text-[#C92A2A]">{formik.errors.code}</p>
              )}
            </div>

            {/* Tên lớp */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#1A1B1E]">
                <BookOpen size={13} className="text-[#3B5BDB]" />
                Tên lớp <span className="text-[#C92A2A]">*</span>
              </label>
              <input
                type="text"
                className={inputCls('name')}
                placeholder="vd: Công nghệ thông tin K18A"
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
              <select
                className={inputCls('facultyId')}
                value={formik.values.facultyId}
                onChange={handleFacultyChange}
              >
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

            {/* Ngành */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-[#1A1B1E]">
                <GraduationCap size={13} className="text-[#3B5BDB]" />
                Ngành / Chuyên ngành <span className="text-[#C92A2A]">*</span>
              </label>
              <select
                className={inputCls('majorId')}
                disabled={!selectedFacultyId || majorLoading}
                {...formik.getFieldProps('majorId')}
              >
                <option value="">
                  {!selectedFacultyId ? '-- Chọn khoa trước --' : majorLoading ? 'Đang tải ngành...' : '-- Chọn ngành --'}
                </option>
                {filteredMajors.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
              {formik.errors.majorId && (
                <p className="mt-1 text-xs text-[#C92A2A]">{formik.errors.majorId}</p>
              )}
              {majorError && (
                <p className="mt-1 text-xs text-[#C92A2A]">{majorError}</p>
              )}
              {formik.values.facultyId && !majorLoading && !majorError && filteredMajors.length === 0 && (
                <p className="mt-1 text-xs text-[#E67700]">
                  Khoa này chưa có ngành nào. Vui lòng tạo ngành trước.
                </p>
              )}
            </div>

            {/* Preview */}
            {formik.values.code && formik.values.name && (
              <div className="rounded-lg border border-[#EDF2FF] bg-[#F8F9FF] p-3">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[#868E96]">
                  Xem trước
                </p>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#EDF2FF] px-2 py-0.5 font-mono text-xs font-bold text-[#3B5BDB]">
                    {formik.values.code}
                  </span>
                  <span className="text-sm font-medium text-[#1A1B1E]">{formik.values.name}</span>
                </div>
                {formik.values.majorId && (
                  <p className="mt-1 text-xs text-[#868E96]">
                    Ngành: {filteredMajors.find((m) => m.id === formik.values.majorId)?.name} &nbsp;|&nbsp;
                    Khoa: {faculties.find((f) => f.id === formik.values.facultyId)?.name}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 border-t border-[#E9ECEF] pt-4">
              {!isEdit ? (
                <button
                  type="button"
                  onClick={() => alert('Tính năng import Excel cho quản lý Lớp học sẽ được hỗ trợ ở phiên bản tiếp theo.')}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-emerald-600 bg-white px-4 py-2 text-xs font-bold text-emerald-600 transition hover:bg-emerald-50 select-none"
                >
                  <Download size={13} />
                  Nhập từ Excel
                </button>
              ) : (
                <div />
              )}

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
                  className="cursor-pointer rounded-lg bg-[#0B3A82] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#104E92] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isEdit ? 'Cập nhật' : 'Tạo lớp'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}