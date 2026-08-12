'use client';

import { ChangeEvent } from 'react';
import { ChevronUp, ChevronDown, Upload, FileText } from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

interface EvaluationSection1Props {
  expanded: boolean;
  onToggle: () => void;
  currentUserRole: 'student' | 'class';
  setIsClassEdited: (val: boolean) => void;
  // Student states
  svStudyAttitude: string;
  setSvStudyAttitude: (val: string) => void;
  svNckh: boolean;
  setSvNckh: (val: boolean) => void;
  svOlympic: boolean;
  setSvOlympic: (val: boolean) => void;
  svCreative: boolean;
  setSvCreative: (val: boolean) => void;
  svAcademicRank: string;
  setSvAcademicRank: (val: string) => void;
  // Class states
  classStudyAttitude: string;
  setClassStudyAttitude: (val: string) => void;
  classNckh: boolean;
  setClassNckh: (val: boolean) => void;
  classOlympic: boolean;
  setClassOlympic: (val: boolean) => void;
  classCreative: boolean;
  setClassCreative: (val: boolean) => void;
  classAcademicRank: string;
  setClassAcademicRank: (val: string) => void;
  // Upload handlers & data
  uploadedFiles: Record<string, string[]>;
  handleFileUpload: (key: string, e: ChangeEvent<HTMLInputElement>) => void;
  removeFile: (key: string, index: number) => void;
  // Live Score summaries
  svSec1Score: number;
  classSec1Score: number;
  // Section violation checkbox
  isSvViolationSec1: boolean;
  setIsSvViolationSec1: (val: boolean) => void;
  isClassViolationSec1: boolean;
  setIsClassViolationSec1: (val: boolean) => void;
}

export const EvaluationSection1 = ({
  expanded,
  onToggle,
  currentUserRole,
  setIsClassEdited,
  svStudyAttitude,
  setSvStudyAttitude,
  svNckh,
  setSvNckh,
  svOlympic,
  setSvOlympic,
  svCreative,
  setSvCreative,
  svAcademicRank,
  setSvAcademicRank,
  classStudyAttitude,
  setClassStudyAttitude,
  classNckh,
  setClassNckh,
  classOlympic,
  setClassOlympic,
  classCreative,
  setClassCreative,
  classAcademicRank,
  setClassAcademicRank,
  uploadedFiles,
  handleFileUpload,
  removeFile,
  svSec1Score,
  classSec1Score,
  isSvViolationSec1,
  setIsSvViolationSec1,
  isClassViolationSec1,
  setIsClassViolationSec1
}: EvaluationSection1Props) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50 border-b border-gray-100 hover:bg-gray-100/70 transition cursor-pointer"
        onClick={onToggle}
      >
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Mục I: Ý thức tham gia học tập (căn cứ vào số tín chỉ trong 01 học kỳ ≥ số tín chỉ tối thiểu theo quy định của Học viện)
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Điểm tối đa: 20đ</p>
        </div>
        
        <div className="flex items-center gap-3 mt-2 sm:mt-0 select-none">
          <div className="flex gap-2 text-xs font-bold text-gray-700">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">SV: {svSec1Score}đ</span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">Lớp: {classSec1Score}đ</span>
          </div>
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 sm:p-6 space-y-6">
          {/* Section Violation override */}
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row gap-4 justify-between">
            <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isSvViolationSec1}
                onChange={(e) => {
                  if (currentUserRole === 'student') {
                    setIsSvViolationSec1(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'student'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [SV] Vi phạm nghiêm trọng quy định học tập (Hủy điểm Mục I)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isClassViolationSec1}
                onChange={(e) => {
                  if (currentUserRole === 'class') {
                    setIsClassEdited(true);
                    setIsClassViolationSec1(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'class'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [Lớp] Xác nhận SV vi phạm học tập nghiêm trọng (Hủy điểm Mục I)
            </label>
          </div>

          {/* Criteria 1.1 */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800">1.1 Ý thức và thái độ học tập (ý thức chuyên cần) (Điểm tối đa: 6đ)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Chọn mức điểm TB đánh giá thường xuyên học kỳ quy đổi để tự động điền.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* SV Column */}
              <div>
                <CustomSelect
                  value={svStudyAttitude}
                  onChange={(val) => setSvStudyAttitude(val)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec1}
                  options={[
                    { id: 'very_good', name: 'Điểm TB đánh giá thường xuyên học kỳ ≥9 (6 điểm)' },
                    { id: 'good', name: 'Điểm TB đánh giá thường xuyên học kỳ từ 7 đến cận 9 (5 điểm)' },
                    { id: 'fair', name: 'Điểm TB đánh giá thường xuyên học kỳ từ 5 đến cận 7 (4 điểm)' },
                    { id: 'average', name: 'Điểm TB đánh giá thường xuyên học kỳ từ 4 đến cận 5 (2 điểm)' },
                    { id: 'poor', name: 'Điểm TB đánh giá thường xuyên học kỳ từ 01 đến cận 04 (1 điểm)' },
                    { id: 'none', name: 'Điểm TB < 1 (0 điểm)' }
                  ]}
                  label="Sinh viên tự chấm"
                />
              </div>

              {/* Class Column */}
              <div>
                <CustomSelect
                  value={classStudyAttitude}
                  onChange={(val) => {
                    setIsClassEdited(true);
                    setClassStudyAttitude(val);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec1}
                  options={[
                    { id: 'very_good', name: 'Điểm TB đánh giá thường xuyên học kỳ ≥9 (6 điểm)' },
                    { id: 'good', name: 'Điểm TB đánh giá thường xuyên học kỳ từ 7 đến cận 9 (5 điểm)' },
                    { id: 'fair', name: 'Điểm TB đánh giá thường xuyên học kỳ từ 5 đến cận 7 (4 điểm)' },
                    { id: 'average', name: 'Điểm TB đánh giá thường xuyên học kỳ từ 4 đến cận 5 (2 điểm)' },
                    { id: 'poor', name: 'Điểm TB đánh giá thường xuyên học kỳ từ 01 đến cận 04 (1 điểm)' },
                    { id: 'none', name: 'Điểm TB < 1 (0 điểm)' }
                  ]}
                  label="Lớp đánh giá"
                />
              </div>
            </div>
          </div>

          {/* Criteria 1.2 */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800">1.2 Hoạt động học thuật, NCKH, Olympic (Điểm tối đa: 6đ)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Mỗi mục được chọn cộng 2 điểm. Tự động tính tổng tối đa 6đ. Yêu cầu tải lên minh chứng nếu chọn.</p>

            {/* Sub-item a */}
            <div className="mt-4 p-3 bg-gray-50 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="svNckh"
                    checked={currentUserRole === 'student' ? svNckh : classNckh}
                    disabled={(currentUserRole === 'student' && isSvViolationSec1) || (currentUserRole === 'class' && isClassViolationSec1)}
                    onChange={(e) => {
                      if (currentUserRole === 'student') {
                        setSvNckh(e.target.checked);
                      } else {
                        setIsClassEdited(true);
                        setClassNckh(e.target.checked);
                      }
                    }}
                    className="mt-1 h-4.5 w-4.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:bg-gray-200"
                  />
                  <div>
                    <label htmlFor="svNckh" className="text-xs font-semibold text-gray-800 cursor-pointer select-none">
                      a) Tham gia đầy đủ hoạt động NCKH / học thuật / chuyên môn (+2đ)
                    </label>
                    <p className="text-[10px] text-amber-600 font-bold">* Yêu cầu đính kèm minh chứng</p>
                  </div>
                </div>

                {((currentUserRole === 'student' && svNckh && !isSvViolationSec1) || (currentUserRole === 'class' && classNckh && !isClassViolationSec1)) && (
                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 transition rounded-lg text-xs font-bold cursor-pointer min-h-[44px]">
                    <Upload size={14} />
                    Tải minh chứng
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(currentUserRole === 'student' ? 'sv_nckh' : 'class_nckh', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {((currentUserRole === 'student' && uploadedFiles['sv_nckh']) || (currentUserRole === 'class' && uploadedFiles['class_nckh'])) && (
                <div className="space-y-1">
                  {(uploadedFiles[currentUserRole === 'student' ? 'sv_nckh' : 'class_nckh'] || []).map((name, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 border rounded-lg text-xs">
                      <span className="truncate max-w-[200px] text-gray-600 flex items-center gap-1">
                        <FileText size={12} className="text-blue-500" />
                        {name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(currentUserRole === 'student' ? 'sv_nckh' : 'class_nckh', idx)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-item b */}
            <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="svOlympic"
                    checked={currentUserRole === 'student' ? svOlympic : classOlympic}
                    disabled={(currentUserRole === 'student' && isSvViolationSec1) || (currentUserRole === 'class' && isClassViolationSec1)}
                    onChange={(e) => {
                      if (currentUserRole === 'student') {
                        setSvOlympic(e.target.checked);
                      } else {
                        setIsClassEdited(true);
                        setClassOlympic(e.target.checked);
                      }
                    }}
                    className="mt-1 h-4.5 w-4.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:bg-gray-200"
                  />
                  <div>
                    <label htmlFor="svOlympic" className="text-xs font-semibold text-gray-800 cursor-pointer select-none">
                      b) Có công bố khoa học / tham gia thi SV NCKH / Olympic (+2đ)
                    </label>
                    <p className="text-[10px] text-amber-600 font-bold">* Yêu cầu đính kèm minh chứng (giấy chứng nhận/link bài báo)</p>
                  </div>
                </div>

                {((currentUserRole === 'student' && svOlympic && !isSvViolationSec1) || (currentUserRole === 'class' && classOlympic && !isClassViolationSec1)) && (
                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 transition rounded-lg text-xs font-bold cursor-pointer min-h-[44px]">
                    <Upload size={14} />
                    Tải minh chứng
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(currentUserRole === 'student' ? 'sv_olympic' : 'class_olympic', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {((currentUserRole === 'student' && uploadedFiles['sv_olympic']) || (currentUserRole === 'class' && uploadedFiles['class_olympic'])) && (
                <div className="space-y-1">
                  {(uploadedFiles[currentUserRole === 'student' ? 'sv_olympic' : 'class_olympic'] || []).map((name, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 border rounded-lg text-xs">
                      <span className="truncate max-w-[200px] text-gray-600 flex items-center gap-1">
                        <FileText size={12} className="text-blue-500" />
                        {name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(currentUserRole === 'student' ? 'sv_olympic' : 'class_olympic', idx)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-item c */}
            <div className="mt-3 p-3 bg-gray-50 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="svCreative"
                    checked={currentUserRole === 'student' ? svCreative : classCreative}
                    disabled={(currentUserRole === 'student' && isSvViolationSec1) || (currentUserRole === 'class' && isClassViolationSec1)}
                    onChange={(e) => {
                      if (currentUserRole === 'student') {
                        setSvCreative(e.target.checked);
                      } else {
                        setIsClassEdited(true);
                        setClassCreative(e.target.checked);
                      }
                    }}
                    className="mt-1 h-4.5 w-4.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer disabled:bg-gray-200"
                  />
                  <div>
                    <label htmlFor="svCreative" className="text-xs font-semibold text-gray-800 cursor-pointer select-none">
                      c) Đạt giải trong cuộc thi SV NCKH / Olympic (+2đ)
                    </label>
                    <p className="text-[10px] text-amber-600 font-bold">* Yêu cầu đính kèm minh chứng (Giấy khen/Quyết định giải)</p>
                  </div>
                </div>

                {((currentUserRole === 'student' && svCreative && !isSvViolationSec1) || (currentUserRole === 'class' && classCreative && !isClassViolationSec1)) && (
                  <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 transition rounded-lg text-xs font-bold cursor-pointer min-h-[44px]">
                    <Upload size={14} />
                    Tải minh chứng
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(currentUserRole === 'student' ? 'sv_creative' : 'class_creative', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {((currentUserRole === 'student' && uploadedFiles['sv_creative']) || (currentUserRole === 'class' && uploadedFiles['class_creative'])) && (
                <div className="space-y-1">
                  {(uploadedFiles[currentUserRole === 'student' ? 'sv_creative' : 'class_creative'] || []).map((name, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white px-3 py-1.5 border rounded-lg text-xs">
                      <span className="truncate max-w-[200px] text-gray-600 flex items-center gap-1">
                        <FileText size={12} className="text-blue-500" />
                        {name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(currentUserRole === 'student' ? 'sv_creative' : 'class_creative', idx)}
                        className="text-red-500 hover:text-red-700 font-bold text-xs"
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Criteria 1.3 */}
          <div>
            <h3 className="text-sm font-bold text-gray-800">1.3 Xếp loại kết quả học tập học kỳ theo TBCHT lần 1 (Điểm tối đa: 8đ)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Điểm quy đổi tương ứng với xếp loại học lực học kỳ của sinh viên.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* SV Column */}
              <div>
                <CustomSelect
                  value={svAcademicRank}
                  onChange={(val) => setSvAcademicRank(val)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec1}
                  options={[
                    { id: 'excellent', name: 'Xuất sắc (8 điểm)' },
                    { id: 'good', name: 'Giỏi (7 điểm)' },
                    { id: 'fair', name: 'Khá (6 điểm)' },
                    { id: 'average', name: 'Trung bình (4 điểm)' },
                    { id: 'weak_no_warn', name: 'Yếu chưa bị cảnh báo (2 điểm)' },
                    { id: 'weak_warn', name: 'Yếu bị cảnh báo lần 1 (1 điểm)' },
                    { id: 'none', name: 'Kém (0 điểm)' }
                  ]}
                  label="Sinh viên tự chấm"
                />
              </div>

              {/* Class Column */}
              <div>
                <CustomSelect
                  value={classAcademicRank}
                  onChange={(val) => {
                    setIsClassEdited(true);
                    setClassAcademicRank(val);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec1}
                  options={[
                    { id: 'excellent', name: 'Xuất sắc (8 điểm)' },
                    { id: 'good', name: 'Giỏi (7 điểm)' },
                    { id: 'fair', name: 'Khá (6 điểm)' },
                    { id: 'average', name: 'Trung bình (4 điểm)' },
                    { id: 'weak_no_warn', name: 'Yếu chưa bị cảnh báo (2 điểm)' },
                    { id: 'weak_warn', name: 'Yếu bị cảnh báo lần 1 (1 điểm)' },
                    { id: 'none', name: 'Kém (0 điểm)' }
                  ]}
                  label="Lớp đánh giá"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
