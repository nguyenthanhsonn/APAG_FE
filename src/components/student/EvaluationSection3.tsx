'use client';

import { ChangeEvent } from 'react';
import { ChevronUp, ChevronDown, Upload, FileText } from 'lucide-react';

interface EvaluationSection3Props {
  expanded: boolean;
  onToggle: () => void;
  currentUserRole: 'student' | 'class';
  setIsClassEdited: (val: boolean) => void;
  // Student values
  svActivity1: string;
  setSvActivity1: (val: string) => void;
  svActivity2: string;
  setSvActivity2: (val: string) => void;
  svActivity3: string;
  setSvActivity3: (val: string) => void;
  svActivity4: string;
  setSvActivity4: (val: string) => void;
  svRewardPoints: number;
  setSvRewardPoints: (val: number) => void;
  // Class values
  classActivity1: string;
  setClassActivity1: (val: string) => void;
  classActivity2: string;
  setClassActivity2: (val: string) => void;
  classActivity3: string;
  setClassActivity3: (val: string) => void;
  classActivity4: string;
  setClassActivity4: (val: string) => void;
  classRewardPoints: number;
  setClassRewardPoints: (val: number) => void;
  // Upload handlers & data
  uploadedFiles: Record<string, string[]>;
  handleFileUpload: (key: string, e: ChangeEvent<HTMLInputElement>) => void;
  removeFile: (key: string, index: number) => void;
  // Live Score summaries
  svSec3Score: number;
  classSec3Score: number;
  // Section violation checkbox
  isSvViolationSec3: boolean;
  setIsSvViolationSec3: (val: boolean) => void;
  isClassViolationSec3: boolean;
  setIsClassViolationSec3: (val: boolean) => void;
}

export const EvaluationSection3 = ({
  expanded,
  onToggle,
  currentUserRole,
  setIsClassEdited,
  svActivity1,
  setSvActivity1,
  svActivity2,
  setSvActivity2,
  svActivity3,
  setSvActivity3,
  svActivity4,
  setSvActivity4,
  svRewardPoints,
  setSvRewardPoints,
  classActivity1,
  setClassActivity1,
  classActivity2,
  setClassActivity2,
  classActivity3,
  setClassActivity3,
  classActivity4,
  setClassActivity4,
  classRewardPoints,
  setClassRewardPoints,
  uploadedFiles,
  handleFileUpload,
  removeFile,
  svSec3Score,
  classSec3Score,
  isSvViolationSec3,
  setIsSvViolationSec3,
  isClassViolationSec3,
  setIsClassViolationSec3
}: EvaluationSection3Props) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50 border-b border-gray-100 hover:bg-gray-100/70 transition cursor-pointer"
        onClick={onToggle}
      >
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            Mục III: Đánh giá về ý thức và kết quả tham gia các hoạt động chính trị, xã hội, văn hóa, văn nghệ, thể thao, phòng chống tệ nạn xã hội
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Thang điểm: Từ 0÷20 điểm</p>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0 select-none">
          <div className="flex gap-2 text-xs font-bold text-gray-700">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">SV: {svSec3Score}đ</span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">Lớp: {classSec3Score}đ</span>
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
                checked={isSvViolationSec3}
                onChange={(e) => {
                  if (currentUserRole === 'student') {
                    setIsSvViolationSec3(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'student'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [SV] Vi phạm nghiêm trọng hoạt động chính trị, xã hội, TNXH (Hủy điểm Mục III)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isClassViolationSec3}
                onChange={(e) => {
                  if (currentUserRole === 'class') {
                    setIsClassEdited(true);
                    setIsClassViolationSec3(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'class'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [Lớp] Xác nhận SV vi phạm nghiêm trọng hoạt động Mục III (Hủy điểm Mục III)
            </label>
          </div>

          {/* Criteria 3.1 */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800">3.1 Tham gia đầy đủ, tích cực các hoạt động chính trị, xã hội, các hoạt động tại giảng đường: nghe thời sự, học nghị quyết, tham gia các phong trào đoàn, hội ... (Điểm tối đa: 5đ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Sinh viên tự chấm</label>
                <select
                  value={svActivity1}
                  onChange={(e) => setSvActivity1(e.target.value)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="active">Tham gia và chấp hành tốt các hoạt động (5 điểm)</option>
                  <option value="full">Vắng 01 buổi không có lý do (3 điểm)</option>
                  <option value="excused">Vắng 02 buổi không có lý do (2 điểm)</option>
                  <option value="unexcused">Vắng từ 02 buổi trở lên không có lý do hoặc không tham gia (0 điểm)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp đánh giá</label>
                <select
                  value={classActivity1}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassActivity1(e.target.value);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="active">Tham gia và chấp hành tốt các hoạt động (5 điểm)</option>
                  <option value="full">Vắng 01 buổi không có lý do (3 điểm)</option>
                  <option value="excused">Vắng 02 buổi không có lý do (2 điểm)</option>
                  <option value="unexcused">Vắng từ 02 buổi trở lên không có lý do hoặc không tham gia (0 điểm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Criteria 3.2 */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800">3.2 Ý thức tham gia các hoạt động văn hóa, văn nghệ, thể thao do Học viện/Phân viện, các tổ chức đoàn thể phát động (Điểm tối đa: 5đ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Sinh viên tự chấm</label>
                <select
                  value={svActivity2}
                  onChange={(e) => setSvActivity2(e.target.value)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="many">Tham gia đầy đủ, có hiệu quả các hoạt động lớp hoặc các đơn vị tổ chức ghi nhận (5 điểm)</option>
                  <option value="some">Tham gia có hiệu quả từ 50% các hoạt động trở lên được lớp hoặc đơn vị tổ chức ghi nhận (3 điểm)</option>
                  <option value="active">Tích cực vận động mọi người tham gia hoặc hưởng ứng tích cực các phong trào (2 điểm)</option>
                  <option value="full">Vắng trên 50% số buổi của các hoạt động (1 điểm)</option>
                  <option value="none">Không tham gia (0 điểm)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp đánh giá</label>
                <select
                  value={classActivity2}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassActivity2(e.target.value);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="many">Tham gia đầy đủ, có hiệu quả các hoạt động lớp hoặc các đơn vị tổ chức ghi nhận (5 điểm)</option>
                  <option value="some">Tham gia có hiệu quả từ 50% các hoạt động trở lên được lớp hoặc đơn vị tổ chức ghi nhận (3 điểm)</option>
                  <option value="active">Tích cực vận động mọi người tham gia hoặc hưởng ứng tích cực các phong trào (2 điểm)</option>
                  <option value="full">Vắng trên 50% số buổi của các hoạt động (1 điểm)</option>
                  <option value="none">Không tham gia (0 điểm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Criteria 3.3 */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800">3.3 Tham gia các câu lạc bộ, Đội, Nhóm được tổ chức theo qui định (ngoài học thuật, NCKH) (Điểm tối đa: 5đ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Sinh viên tự chấm</label>
                <select
                  value={svActivity3}
                  onChange={(e) => setSvActivity3(e.target.value)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="prize_or_org">Tham gia đầy đủ, có hiệu quả các hoạt động (5 điểm)</option>
                  <option value="active">Tham gia tích cực, có hiệu quả từ 01 hoạt động trở lên (3 điểm)</option>
                  <option value="some">Là thành viên tích cực hưởng ứng các hoạt động (2 điểm)</option>
                  <option value="full">Vắng trên 50% số buổi của các hoạt động (1 điểm)</option>
                  <option value="none">Không tham gia (0 điểm)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp đánh giá</label>
                <select
                  value={classActivity3}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassActivity3(e.target.value);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="prize_or_org">Tham gia đầy đủ, có hiệu quả các hoạt động (5 điểm)</option>
                  <option value="active">Tham gia tích cực, có hiệu quả từ 01 hoạt động trở lên (3 điểm)</option>
                  <option value="some">Là thành viên tích cực hưởng ứng các hoạt động (2 điểm)</option>
                  <option value="full">Vắng trên 50% số buổi của các hoạt động (1 điểm)</option>
                  <option value="none">Không tham gia (0 điểm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Criteria 3.4 */}
          <div className="border-b pb-4">
            <h3 className="text-sm font-bold text-gray-800">3.4 Tham gia tuyên truyền, phòng chống tội phạm và các TNXH (Điểm tối đa: 3đ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Sinh viên tự chấm</label>
                <select
                  value={svActivity4}
                  onChange={(e) => setSvActivity4(e.target.value)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="active">Tham gia tích cực nhiều hoạt động hoặc có ý thức tố giác các TNXH (3 điểm)</option>
                  <option value="full">Tham gia một hoạt động đạt hiệu quả (2 điểm)</option>
                  <option value="some">Có ý thức tham gia hoặc hưởng ứng các hoạt động tuyên truyền phòng, chống TNXH (1 điểm)</option>
                  <option value="none">Bị nhắc nhở 1 lần do vi phạm các TNXH (chưa đến mức xử lý kỷ luật) (0 điểm)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp đánh giá</label>
                <select
                  value={classActivity4}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassActivity4(e.target.value);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="active">Tham gia tích cực nhiều hoạt động hoặc có ý thức tố giác các TNXH (3 điểm)</option>
                  <option value="full">Tham gia một hoạt động đạt hiệu quả (2 điểm)</option>
                  <option value="some">Có ý thức tham gia hoặc hưởng ứng các hoạt động tuyên truyền phòng, chống TNXH (1 điểm)</option>
                  <option value="none">Bị nhắc nhở 1 lần do vi phạm các TNXH (chưa đến mức xử lý kỷ luật) (0 điểm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Criteria 3.5 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800">3.5 Được khen thưởng, biểu dương trong các hoạt động tại mục III (Điểm tối đa: 2đ)</h3>
            <p className="text-xs text-gray-500">Nhập điểm khen thưởng tự chọn (max 2đ). Yêu cầu đính kèm minh chứng nếu có điểm.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SV Column */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-3">
                <label className="block text-xs font-bold text-blue-700">Sinh viên tự chấm</label>
                <input
                  type="number"
                  max={2}
                  min={0}
                  value={svRewardPoints}
                  onChange={(e) => setSvRewardPoints(Math.min(2, Math.max(0, parseInt(e.target.value) || 0)))}
                  disabled={currentUserRole !== 'student' || isSvViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                />

                {svRewardPoints > 0 && currentUserRole === 'student' && !isSvViolationSec3 && (
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition rounded-lg text-xs font-bold cursor-pointer min-h-[44px]">
                    <Upload size={14} />
                    Tải minh chứng
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload('sv_reward', e)}
                      className="hidden"
                    />
                  </label>
                )}

                {uploadedFiles['sv_reward'] && uploadedFiles['sv_reward'].length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles['sv_reward'].map((name, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 border rounded text-xs">
                        <span className="truncate max-w-[150px] text-gray-600 flex items-center gap-1">
                          <FileText size={12} className="text-blue-500" />
                          {name}
                        </span>
                        <button type="button" onClick={() => removeFile('sv_reward', idx)} className="text-red-500 font-bold">Xóa</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Column */}
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 flex flex-col gap-3">
                <label className="block text-xs font-bold text-indigo-700">Lớp đánh giá</label>
                <input
                  type="number"
                  max={2}
                  min={0}
                  value={classRewardPoints}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassRewardPoints(Math.min(2, Math.max(0, parseInt(e.target.value) || 0)));
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none h-11 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
