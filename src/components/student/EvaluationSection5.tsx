'use client';

import { ChangeEvent } from 'react';
import { ChevronUp, ChevronDown, Upload, FileText } from 'lucide-react';

interface EvaluationSection5Props {
  expanded: boolean;
  onToggle: () => void;
  currentUserRole: 'student' | 'class';
  setIsClassEdited: (val: boolean) => void;
  // Student values
  svRoleType: 'cadre' | 'student';
  setSvRoleType: (val: 'cadre' | 'student') => void;
  svCadrePosition: 'a1' | 'a2';
  setSvCadrePosition: (val: 'a1' | 'a2') => void;
  svCadrePerformance: string;
  setSvCadrePerformance: (val: string) => void;
  svManagementLevel: string;
  setSvManagementLevel: (val: string) => void;
  svClassParticipation: number;
  setSvClassParticipation: (val: number) => void;
  svSpecialAchievement: string;
  setSvSpecialAchievement: (val: string) => void;
  // Class values
  classRoleType: 'cadre' | 'student';
  setClassRoleType: (val: 'cadre' | 'student') => void;
  classCadrePosition: 'a1' | 'a2';
  setClassCadrePosition: (val: 'a1' | 'a2') => void;
  classCadrePerformance: string;
  setClassCadrePerformance: (val: string) => void;
  classManagementLevel: string;
  setClassManagementLevel: (val: string) => void;
  classClassParticipation: number;
  setClassClassParticipation: (val: number) => void;
  classSpecialAchievement: string;
  setClassSpecialAchievement: (val: string) => void;
  // Upload handlers & data
  uploadedFiles: Record<string, string[]>;
  handleFileUpload: (key: string, e: ChangeEvent<HTMLInputElement>) => void;
  removeFile: (key: string, index: number) => void;
  // Live Score summaries
  svSec5Score: number;
  classSec5Score: number;
  // Section violation checkbox
  isSvViolationSec5: boolean;
  setIsSvViolationSec5: (val: boolean) => void;
  isClassViolationSec5: boolean;
  setIsClassViolationSec5: (val: boolean) => void;
}

export const EvaluationSection5 = ({
  expanded,
  onToggle,
  currentUserRole,
  setIsClassEdited,
  svRoleType,
  setSvRoleType,
  svCadrePosition,
  setSvCadrePosition,
  svCadrePerformance,
  setSvCadrePerformance,
  svManagementLevel,
  setSvManagementLevel,
  svClassParticipation,
  setSvClassParticipation,
  svSpecialAchievement,
  setSvSpecialAchievement,
  classRoleType,
  setClassRoleType,
  classCadrePosition,
  setClassCadrePosition,
  classCadrePerformance,
  setClassCadrePerformance,
  classManagementLevel,
  setClassManagementLevel,
  classClassParticipation,
  setClassClassParticipation,
  classSpecialAchievement,
  setClassSpecialAchievement,
  uploadedFiles,
  handleFileUpload,
  removeFile,
  svSec5Score,
  classSec5Score,
  isSvViolationSec5,
  setIsSvViolationSec5,
  isClassViolationSec5,
  setIsClassViolationSec5
}: EvaluationSection5Props) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50 border-b border-gray-100 hover:bg-gray-100/70 transition cursor-pointer"
        onClick={onToggle}
      >
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
            Mục V: Đánh giá về ý thức và kết quả tham gia Ban cán sự lớp, BCH Đoàn, Ban chủ nhiệm các Ban, CLB, Đội, Hội, Nhóm được thành lập theo quy định.
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Thang điểm: Từ 0÷10 điểm</p>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0 select-none">
          <div className="flex gap-2 text-xs font-bold text-gray-700">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">SV: {svSec5Score}đ</span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">Lớp: {classSec5Score}đ</span>
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
                checked={isSvViolationSec5}
                onChange={(e) => {
                  if (currentUserRole === 'student') {
                    setIsSvViolationSec5(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'student'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [SV] Không hoàn thành hoặc vi phạm hoạt động ban cán sự / Đoàn Hội (Hủy điểm Mục V)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isClassViolationSec5}
                onChange={(e) => {
                  if (currentUserRole === 'class') {
                    setIsClassEdited(true);
                    setIsClassViolationSec5(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'class'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [Lớp] Xác nhận hủy điểm hoạt động Mục V (Hủy điểm Mục V)
            </label>
          </div>

          {/* BCS & Staff Type selector */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800">1. BCS lớp, BCH các tổ chức Đảng, Đoàn thanh niên, Hội sinh viên, chi bộ sinh viên, các CLB và các tổ chức khác trong Học viện/Phân viện được thành lập theo quy định. (Thang điểm: 7đ)</h3>
            <p className="text-xs text-gray-500 mt-0.5">Lựa chọn đúng nhóm đối tượng để thiết lập bộ điểm rèn luyện.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              {/* SV Column */}
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1.5">Sinh viên tự chọn</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-start gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="svRoleType"
                      checked={svRoleType === 'cadre'}
                      onChange={() => setSvRoleType('cadre')}
                      disabled={currentUserRole !== 'student' || isSvViolationSec5}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0"
                    />
                    Nhóm 1: Lớp trưởng, Lớp phó; Bí thư, Phó Bí thư; Chủ nhiệm các Ban, CLB...
                  </label>
                  <label className="flex items-start gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="svRoleType"
                      checked={svRoleType === 'student'}
                      onChange={() => setSvRoleType('student')}
                      disabled={currentUserRole !== 'student' || isSvViolationSec5}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 mt-0.5 shrink-0"
                    />
                    Nhóm 2: Tất cả các sinh viên trong lớp còn lại
                  </label>
                </div>
              </div>

              {/* Class Column */}
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1.5">Lớp đánh giá chọn</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-start gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="classRoleType"
                      checked={classRoleType === 'cadre'}
                      onChange={() => {
                        setIsClassEdited(true);
                        setClassRoleType('cadre');
                      }}
                      disabled={currentUserRole !== 'class' || isClassViolationSec5}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mt-0.5 shrink-0"
                    />
                    Nhóm 1: Lớp trưởng, Lớp phó; Bí thư, Phó Bí thư; Chủ nhiệm các Ban, CLB...
                  </label>
                  <label className="flex items-start gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="classRoleType"
                      checked={classRoleType === 'student'}
                      onChange={() => {
                        setIsClassEdited(true);
                        setClassRoleType('student');
                      }}
                      disabled={currentUserRole !== 'class' || isClassViolationSec5}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 mt-0.5 shrink-0"
                    />
                    Nhóm 2: Tất cả các sinh viên trong lớp còn lại
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Condition 1: BCS / BCH option */}
          {((currentUserRole === 'student' && svRoleType === 'cadre') || (currentUserRole === 'class' && classRoleType === 'cadre')) && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Thiết lập dành cho Ban cán sự / Ban chấp hành (Mục 1)</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SV details */}
                {currentUserRole === 'student' && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-blue-700">Sinh viên tự chấm</h5>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">a) Ý thức, tinh thần, thái độ, uy tín và hiệu quả công việc được phân công</label>
                      <select
                        value={svCadrePosition}
                        onChange={(e) => setSvCadrePosition(e.target.value as 'a1' | 'a2')}
                        disabled={isSvViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="a1">Lớp trưởng, Lớp phó; Bí thư, Phó Bí thư; Chủ nhiệm, Phó Chủ nhiệm các Ban, CLB... (Max 7đ)</option>
                        <option value="a2">Ủy viên BCH chi đoàn; Chi ủy viên; Tổ trưởng, tổ phó các lớp; Ủy viên các Ban, CLB... (Max 6đ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Mức độ hoàn thành nhiệm vụ</label>
                      <select
                        value={svCadrePerformance}
                        onChange={(e) => setSvCadrePerformance(e.target.value)}
                        disabled={isSvViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="excellent">Hoàn thành xuất sắc nhiệm vụ (được khen thưởng hoặc được lãnh đạo các đơn vị, CVHT, tập thể ghi nhận) {svCadrePosition === 'a1' ? '(7 điểm)' : '(6 điểm)'}</option>
                        <option value="good">Hoàn thành tốt nhiệm vụ {svCadrePosition === 'a1' ? '(6 điểm)' : '(5 điểm)'}</option>
                        <option value="average">Hoàn thành nhiệm vụ {svCadrePosition === 'a1' ? '(4 điểm)' : '(3 điểm)'}</option>
                        <option value="unsatisfactory">Không hoàn thành nhiệm vụ (0 điểm)</option>
                      </select>
                      {svCadrePerformance === 'excellent' && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1">* Yêu cầu tải lên minh chứng Hoàn thành xuất sắc (giấy khen/giấy xác nhận)</p>
                      )}
                    </div>

                    {svCadrePerformance === 'excellent' && currentUserRole === 'student' && !isSvViolationSec5 && (
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition rounded-lg text-xs font-bold cursor-pointer min-h-[44px]">
                        <Upload size={14} />
                        Tải minh chứng hoàn thành xuất sắc
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload('sv_cadre_perf', e)}
                          className="hidden"
                        />
                      </label>
                    )}

                    {uploadedFiles['sv_cadre_perf'] && uploadedFiles['sv_cadre_perf'].length > 0 && (
                      <div className="space-y-1">
                        {uploadedFiles['sv_cadre_perf'].map((name, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 border rounded text-xs">
                            <span className="truncate max-w-[150px] text-gray-600 flex items-center gap-1">
                              <FileText size={12} className="text-blue-500" />
                              {name}
                            </span>
                            <button type="button" onClick={() => removeFile('sv_cadre_perf', idx)} className="text-red-500 font-bold">Xóa</button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">b) Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn, Hội, CLB... (Tối đa 3đ)</label>
                      <select
                        value={svManagementLevel}
                        onChange={(e) => setSvManagementLevel(e.target.value)}
                        disabled={isSvViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="head">Cấp trưởng: Liên chi đoàn, Lớp sinh viên, Lớp học phần, chi đoàn, chi bộ, chi hội, Chủ nhiệm các CLB, Đội (3 điểm)</option>
                        <option value="deputy">Cấp Phó: Liên chi đoàn, Lớp sinh viên, chi đoàn, chi bộ, chi hội, các CLB, Đội (2 điểm)</option>
                        <option value="member">Ủy viên: BCH Đoàn, Hội, CLB, Đội (1 điểm)</option>
                        <option value="none">Không giữ cấp quản lý (0 điểm)</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Class details */}
                {currentUserRole === 'class' && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-indigo-700">Lớp đánh giá</h5>
                    
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">a) Ý thức, tinh thần, thái độ, uy tín và hiệu quả công việc được phân công</label>
                      <select
                        value={classCadrePosition}
                        onChange={(e) => {
                          setIsClassEdited(true);
                          setClassCadrePosition(e.target.value as 'a1' | 'a2');
                        }}
                        disabled={isClassViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="a1">Lớp trưởng, Lớp phó; Bí thư, Phó Bí thư; Chủ nhiệm, Phó Chủ nhiệm các Ban, CLB... (Max 7đ)</option>
                        <option value="a2">Ủy viên BCH chi đoàn; Chi ủy viên; Tổ trưởng, tổ phó các lớp; Ủy viên các Ban, CLB... (Max 6đ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">Mức độ hoàn thành nhiệm vụ</label>
                      <select
                        value={classCadrePerformance}
                        onChange={(e) => {
                          setIsClassEdited(true);
                          setClassCadrePerformance(e.target.value);
                        }}
                        disabled={isClassViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="excellent">Hoàn thành xuất sắc nhiệm vụ (được khen thưởng hoặc được lãnh đạo các đơn vị, CVHT, tập thể ghi nhận) {classCadrePosition === 'a1' ? '(7 điểm)' : '(6 điểm)'}</option>
                        <option value="good">Hoàn thành tốt nhiệm vụ {classCadrePosition === 'a1' ? '(6 điểm)' : '(5 điểm)'}</option>
                        <option value="average">Hoàn thành nhiệm vụ {classCadrePosition === 'a1' ? '(4 điểm)' : '(3 điểm)'}</option>
                        <option value="unsatisfactory">Không hoàn thành nhiệm vụ (0 điểm)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">b) Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn, Hội, CLB... (Tối đa 3đ)</label>
                      <select
                        value={classManagementLevel}
                        onChange={(e) => {
                          setIsClassEdited(true);
                          setClassManagementLevel(e.target.value);
                        }}
                        disabled={isClassViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="head">Cấp trưởng: Liên chi đoàn, Lớp sinh viên, Lớp học phần, chi đoàn, chi bộ, chi hội, Chủ nhiệm các CLB, Đội (3 điểm)</option>
                        <option value="deputy">Cấp Phó: Liên chi đoàn, Lớp sinh viên, chi đoàn, chi bộ, chi hội, các CLB, Đội (2 điểm)</option>
                        <option value="member">Ủy viên: BCH Đoàn, Hội, CLB, Đội (1 điểm)</option>
                        <option value="none">Không giữ cấp quản lý (0 điểm)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Condition 2: Regular student option */}
          {((currentUserRole === 'student' && svRoleType === 'student') || (currentUserRole === 'class' && classRoleType === 'student')) && (
            <div className="p-4 bg-gray-50 rounded-xl space-y-4 border border-gray-200">
              <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Thiết lập dành cho Tất cả các sinh viên trong lớp (Mục 2)</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SV details */}
                {currentUserRole === 'student' && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-blue-700">Sinh viên tự chấm</h5>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">a) Sinh viên tham gia đầy đủ các hoạt động, sinh hoạt của lớp, khoa, Học viện, có ý kiến tham gia xây dựng tập thể vững mạnh (trừ đối tượng ở tiểu mục 1, 2, 3 mục 5) (0-3 điểm)</label>
                      <input
                        type="number"
                        max={3}
                        min={0}
                        value={svClassParticipation}
                        onChange={(e) => setSvClassParticipation(Math.min(3, Math.max(0, parseInt(e.target.value) || 0)))}
                        disabled={isSvViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">b) Sinh viên đạt được các thành tích đặc biệt trong học tập, rèn luyện, dũng cảm cứu người được cấp giấy chứng nhận hoặc có giấy khen</label>
                      <select
                        value={svSpecialAchievement}
                        onChange={(e) => setSvSpecialAchievement(e.target.value)}
                        disabled={isSvViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="none">Không có thành tích đặc biệt (0 điểm)</option>
                        <option value="national_intl">Được khen thưởng từ cấp Học viện trở lên (+7 điểm)</option>
                        <option value="provincial">Đạt khen thưởng từ cấp Khoa trở lên (+5 điểm)</option>
                      </select>
                      {svSpecialAchievement !== 'none' && (
                        <p className="text-[10px] text-amber-600 font-bold mt-1">* Yêu cầu tải lên minh chứng (Giấy khen/giấy xác nhận)</p>
                      )}
                    </div>

                    {svSpecialAchievement !== 'none' && currentUserRole === 'student' && !isSvViolationSec5 && (
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition rounded-lg text-xs font-bold cursor-pointer min-h-[44px]">
                        <Upload size={14} />
                        Tải minh chứng thành tích
                        <input
                          type="file"
                          onChange={(e) => handleFileUpload('sv_special_ach', e)}
                          className="hidden"
                        />
                      </label>
                    )}

                    {uploadedFiles['sv_special_ach'] && uploadedFiles['sv_special_ach'].length > 0 && (
                      <div className="space-y-1">
                        {uploadedFiles['sv_special_ach'].map((name, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 border rounded text-xs">
                            <span className="truncate max-w-[150px] text-gray-600 flex items-center gap-1">
                              <FileText size={12} className="text-blue-500" />
                              {name}
                            </span>
                            <button type="button" onClick={() => removeFile('sv_special_ach', idx)} className="text-red-500 font-bold">Xóa</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Class details */}
                {currentUserRole === 'class' && (
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-indigo-700">Lớp đánh giá</h5>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">a) Sinh viên tham gia đầy đủ các hoạt động, sinh hoạt của lớp, khoa, Học viện, có ý kiến tham gia xây dựng tập thể vững mạnh (trừ đối tượng ở tiểu mục 1, 2, 3 mục 5) (0-3 điểm)</label>
                      <input
                        type="number"
                        max={3}
                        min={0}
                        value={classClassParticipation}
                        onChange={(e) => {
                          setIsClassEdited(true);
                          setClassClassParticipation(Math.min(3, Math.max(0, parseInt(e.target.value) || 0)));
                        }}
                        disabled={isClassViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 uppercase mb-1">b) Sinh viên đạt được các thành tích đặc biệt trong học tập, rèn luyện, dũng cảm cứu người được cấp giấy chứng nhận hoặc có giấy khen</label>
                      <select
                        value={classSpecialAchievement}
                        onChange={(e) => {
                          setIsClassEdited(true);
                          setClassSpecialAchievement(e.target.value);
                        }}
                        disabled={isClassViolationSec5}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="none">Không có thành tích đặc biệt (0 điểm)</option>
                        <option value="national_intl">Được khen thưởng từ cấp Học viện trở lên (+7 điểm)</option>
                        <option value="provincial">Đạt khen thưởng từ cấp Khoa trở lên (+5 điểm)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
