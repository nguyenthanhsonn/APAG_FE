'use client';

import { User, ChevronUp, ChevronDown } from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

const admissionYears = ['2020', '2021', '2022', '2023', '2024'];
const facultyOptions: Array<{ id: string; name: string }> = [];
const majorOptions: Array<{ id: string; name: string; facultyId?: string }> = [];
const classOptions: Array<{ id: string; name: string; majorId?: string }> = [];

interface EvaluationHeaderSectionProps {
  expanded: boolean;
  onToggle: () => void;
  admissionYear: string;
  setAdmissionYear: (val: string) => void;
  facultyId: string;
  setFacultyId: (val: string) => void;
  majorId: string;
  setMajorId: (val: string) => void;
  classId: string;
  setClassId: (val: string) => void;
  studentCode: string;
  setStudentCode: (val: string) => void;
  fullName: string;
  setFullName: (val: string) => void;
  dateOfBirth: string;
  setDateOfBirth: (val: string) => void;
  phoneNumber: string;
  setPhoneNumber: (val: string) => void;
  semester: 'HK1' | 'HK2';
  setSemester: (val: 'HK1' | 'HK2') => void;
  academicYear: string;
  setAcademicYear: (val: string) => void;
  isSuspended: boolean;
  setIsSuspended: (val: boolean) => void;
  isSubmittedLate: boolean;
  setIsSubmittedLate: (val: boolean) => void;
}

export const EvaluationHeaderSection = ({
  expanded,
  onToggle,
  admissionYear,
  setAdmissionYear,
  facultyId,
  setFacultyId,
  majorId,
  setMajorId,
  classId,
  setClassId,
  studentCode,
  setStudentCode,
  fullName,
  setFullName,
  dateOfBirth,
  setDateOfBirth,
  phoneNumber,
  setPhoneNumber,
  semester,
  setSemester,
  academicYear,
  setAcademicYear,
  isSuspended,
  setIsSuspended,
  isSubmittedLate,
  setIsSubmittedLate,
}: EvaluationHeaderSectionProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-gray-50 border-b border-gray-100 hover:bg-gray-100/70 transition cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <User className="text-blue-600" size={20} />
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Thông tin sinh viên & Học kỳ</h2>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {expanded && (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            
            {/* Field: Năm trúng tuyển */}
            <CustomSelect
              value={admissionYear}
              onChange={(val) => setAdmissionYear(val)}
              options={admissionYears.map(year => ({ id: year, name: year }))}
              label="Năm trúng tuyển *"
            />

            {/* Field: Khoa quản lý */}
            <CustomSelect
              value={facultyId}
              onChange={(val) => setFacultyId(val)}
              options={facultyOptions}
              label="Khoa quản lý *"
            />

            {/* Field: Ngành học */}
            <CustomSelect
              value={majorId}
              onChange={(val) => setMajorId(val)}
              options={majorOptions}
              label="Ngành học *"
            />

            {/* Field: Lớp học */}
            <CustomSelect
              value={classId}
              onChange={(val) => setClassId(val)}
              options={classOptions}
              label="Lớp học *"
            />

            {/* Field: Mã sinh viên */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Mã sinh viên *</label>
              <input
                type="text"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white"
                placeholder="Nhập mã sinh viên"
              />
            </div>

            {/* Field: Họ và tên */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Họ và tên *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white"
              />
            </div>

            {/* Field: Ngày sinh */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Ngày sinh *</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white"
              />
            </div>

            {/* Field: Số điện thoại */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Số điện thoại</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white"
                placeholder="Nhập số điện thoại"
              />
            </div>

            {/* Field: Năm học */}
            <CustomSelect
              value={academicYear}
              onChange={(val) => setAcademicYear(val)}
              options={[]}
              label="Năm học *"
            />

            {/* Field: Học kỳ đánh giá */}
            <CustomSelect
              value={semester}
              onChange={(val) => setSemester(val as 'HK1' | 'HK2')}
              options={[
                { id: 'HK1', name: 'Học kỳ I' },
                { id: 'HK2', name: 'Học kỳ II' }
              ]}
              label="Học kỳ đánh giá *"
            />
          </div>

          {/* Special Compliance Flags */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
            <label className="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={isSuspended}
                onChange={(e) => setIsSuspended(e.target.checked)}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
              Bị đình chỉ học tập từ 30 ngày trở xuống (Xếp loại không quá Khá)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-amber-600 cursor-pointer min-h-[44px] sm:min-h-0">
              <input
                type="checkbox"
                checked={isSubmittedLate}
                onChange={(e) => setIsSubmittedLate(e.target.checked)}
                className="h-4.5 w-4.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              Nộp phiếu trễ hạn / Không đúng hạn (Xếp loại Yếu/Kém)
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
