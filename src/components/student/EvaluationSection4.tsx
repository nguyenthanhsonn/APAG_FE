'use client';

import { ChangeEvent } from 'react';
import { ChevronUp, ChevronDown, Upload, FileText } from 'lucide-react';

interface EvaluationSection4Props {
  expanded: boolean;
  onToggle: () => void;
  currentUserRole: 'student' | 'class';
  setIsClassEdited: (val: boolean) => void;
  // Student values
  svPolicy: string;
  setSvPolicy: (val: string) => void;
  svSolidarity: string;
  setSvSolidarity: (val: string) => void;
  svLocality: string;
  setSvLocality: (val: string) => void;
  // Class values
  classPolicy: string;
  setClassPolicy: (val: string) => void;
  classSolidarity: string;
  setClassSolidarity: (val: string) => void;
  classLocality: string;
  setClassLocality: (val: string) => void;
  // Upload handlers & data
  uploadedFiles: Record<string, string[]>;
  handleFileUpload: (key: string, e: ChangeEvent<HTMLInputElement>) => void;
  removeFile: (key: string, index: number) => void;
  // Live Score summaries
  svSec4Score: number;
  classSec4Score: number;
  // Section violation checkbox
  isSvViolationSec4: boolean;
  setIsSvViolationSec4: (val: boolean) => void;
  isClassViolationSec4: boolean;
  setIsClassViolationSec4: (val: boolean) => void;
}

export const EvaluationSection4 = ({
  expanded,
  onToggle,
  currentUserRole,
  setIsClassEdited,
  svPolicy,
  setSvPolicy,
  svSolidarity,
  setSvSolidarity,
  svLocality,
  setSvLocality,
  classPolicy,
  setClassPolicy,
  classSolidarity,
  setClassSolidarity,
  classLocality,
  setClassLocality,
  uploadedFiles,
  handleFileUpload,
  removeFile,
  svSec4Score,
  classSec4Score,
  isSvViolationSec4,
  setIsSvViolationSec4,
  isClassViolationSec4,
  setIsClassViolationSec4
}: EvaluationSection4Props) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-gray-50 border-b border-gray-100 hover:bg-gray-100/70 transition cursor-pointer"
        onClick={onToggle}
      >
        <div>
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
            Mục IV: Đánh giá về ý thức công dân trong quan hệ cộng đồng
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">Thang điểm: Từ 0÷25 điểm</p>
        </div>

        <div className="flex items-center gap-3 mt-2 sm:mt-0 select-none">
          <div className="flex gap-2 text-xs font-bold text-gray-700">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md">SV: {svSec4Score}đ</span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">Lớp: {classSec4Score}đ</span>
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
                checked={isSvViolationSec4}
                onChange={(e) => {
                  if (currentUserRole === 'student') {
                    setIsSvViolationSec4(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'student'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [SV] Vi phạm an ninh trật tự công cộng / pháp luật (Hủy điểm Mục IV)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-red-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isClassViolationSec4}
                onChange={(e) => {
                  if (currentUserRole === 'class') {
                    setIsClassEdited(true);
                    setIsClassViolationSec4(e.target.checked);
                  }
                }}
                disabled={currentUserRole !== 'class'}
                className="h-4.5 w-4.5 rounded text-red-600 focus:ring-red-500"
              />
              [Lớp] Xác nhận SV vi phạm pháp luật / an ninh tự trị (Hủy điểm Mục IV)
            </label>
          </div>

          {/* Criteria 4.1 */}
          <div className="border-b pb-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-800">4.1 Ý thức chấp hành và tham gia tuyên truyền các chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước, quy định nơi cư trú, giữ gìn an ninh- trật tự, an toàn giao thông, quy định trong cộng đồng (Điểm tối đa: 10đ)</h3>
            <p className="text-xs text-gray-500 mt-0.5">* Mức "được địa phương / Học viện khen thưởng" yêu cầu đính kèm minh chứng.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SV Column */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-blue-700">Sinh viên tự chấm</label>
                <select
                  value={svPolicy}
                  onChange={(e) => setSvPolicy(e.target.value)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="excellent_propaganda">Chấp hành đúng và tham gia tuyên truyền tốt, được khen thưởng (10 điểm)</option>
                  <option value="good">Chấp hành đúng và tham gia tuyên truyền tốt (8 điểm)</option>
                  <option value="minor_violation">Chấp hành đúng các quy định (5 điểm)</option>
                  <option value="none">Bị nhắc nhở, lập biên bản do vi phạm các quy định (0 điểm)</option>
                </select>

                {svPolicy === 'excellent_propaganda' && currentUserRole === 'student' && !isSvViolationSec4 && (
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition rounded-lg text-xs font-bold cursor-pointer min-h-[44px]">
                    <Upload size={14} />
                    Tải minh chứng khen thưởng
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload('sv_policy', e)}
                      className="hidden"
                    />
                  </label>
                )}

                {uploadedFiles['sv_policy'] && uploadedFiles['sv_policy'].length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles['sv_policy'].map((name, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 border rounded text-xs">
                        <span className="truncate max-w-[150px] text-gray-600 flex items-center gap-1">
                          <FileText size={12} className="text-blue-500" />
                          {name}
                        </span>
                        <button type="button" onClick={() => removeFile('sv_policy', idx)} className="text-red-500 font-bold">Xóa</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Column */}
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp đánh giá</label>
                <select
                  value={classPolicy}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassPolicy(e.target.value);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="excellent_propaganda">Chấp hành đúng và tham gia tuyên truyền tốt, được khen thưởng (10 điểm)</option>
                  <option value="good">Chấp hành đúng và tham gia tuyên truyền tốt (8 điểm)</option>
                  <option value="minor_violation">Chấp hành đúng các quy định (5 điểm)</option>
                  <option value="none">Bị nhắc nhở, lập biên bản do vi phạm các quy định (0 điểm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Criteria 4.2 */}
          <div className="border-b pb-4 space-y-3">
            <h3 className="text-sm font-bold text-gray-800">4.2 Tham gia các hoạt động nhân đạo, từ thiện vì cộng đồng, phong trào thanh niên tình nguyện, phong trào giúp đỡ nhân dân và bạn bè khi gặp thiên tai, khó khăn, hoạn nạn (Điểm tối đa: 10đ)</h3>
            <p className="text-xs text-gray-500 mt-0.5">* Mức "được khen thưởng" yêu cầu đính kèm minh chứng.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SV Column */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-blue-700">Sinh viên tự chấm</label>
                <select
                  value={svSolidarity}
                  onChange={(e) => setSvSolidarity(e.target.value)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="excellent_achievements">Tích cực, nhiệt tình tham gia các hoạt động đạt hiệu quả được Học viện, các tổ chức khen thưởng (10 điểm)</option>
                  <option value="regular">Tham gia tích cực các hoạt động được lớp hoặc tập thể ghi nhận (8 điểm)</option>
                  <option value="some">Có ý thức tham gia hoặc hưởng ứng các hoạt động (5 điểm)</option>
                  <option value="minor_violation">Tham gia các hoạt động nhưng gây mất đoàn kết (0 điểm)</option>
                  <option value="none">Không tham gia (0 điểm)</option>
                </select>

                {svSolidarity === 'excellent_achievements' && currentUserRole === 'student' && !isSvViolationSec4 && (
                  <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition rounded-lg text-xs font-bold cursor-pointer min-h-[44px]">
                    <Upload size={14} />
                    Tải minh chứng khen thưởng tình nguyện
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload('sv_solidarity', e)}
                      className="hidden"
                    />
                  </label>
                )}

                {uploadedFiles['sv_solidarity'] && uploadedFiles['sv_solidarity'].length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles['sv_solidarity'].map((name, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white px-2 py-1 border rounded text-xs">
                        <span className="truncate max-w-[150px] text-gray-600 flex items-center gap-1">
                          <FileText size={12} className="text-blue-500" />
                          {name}
                        </span>
                        <button type="button" onClick={() => removeFile('sv_solidarity', idx)} className="text-red-500 font-bold">Xóa</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Class Column */}
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp đánh giá</label>
                <select
                  value={classSolidarity}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassSolidarity(e.target.value);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="excellent_achievements">Tích cực, nhiệt tình tham gia các hoạt động đạt hiệu quả được Học viện, các tổ chức khen thưởng (10 điểm)</option>
                  <option value="regular">Tham gia tích cực các hoạt động được lớp hoặc tập thể ghi nhận (8 điểm)</option>
                  <option value="some">Có ý thức tham gia hoặc hưởng ứng các hoạt động (5 điểm)</option>
                  <option value="minor_violation">Tham gia các hoạt động nhưng gây mất đoàn kết (0 điểm)</option>
                  <option value="none">Không tham gia (0 điểm)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Criteria 4.3 */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-800">4.3 Ý thức xây dựng mối quan hệ đoàn kết với bạn bè và tập thể; xây dựng, bảo vệ cảnh quan giảng đường, nơi cư trú văn minh, sạch đẹp, văn hóa học đường. (Điểm tối đa: 5đ)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* SV Column */}
              <div>
                <label className="block text-xs font-bold text-blue-700 mb-1">Sinh viên tự chấm</label>
                <select
                  value={svLocality}
                  onChange={(e) => setSvLocality(e.target.value)}
                  disabled={currentUserRole !== 'student' || isSvViolationSec4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="good">Có ý thức xây dựng tập thể lớp đoàn kết, giữ gìn giảng đường, nơi cư trú văn minh, sạch đẹp, thực hiện tốt văn hóa học đường (5 điểm)</option>
                  <option value="rewarded">Bị nhắc nhở hoặc kiểm điểm 1 lần (1 điểm)</option>
                  <option value="warned">Bị nhắc nhở hoặc kiểm điểm 2 lần (0 điểm)</option>
                </select>
              </div>

              {/* Class Column */}
              <div>
                <label className="block text-xs font-bold text-indigo-700 mb-1">Lớp đánh giá</label>
                <select
                  value={classLocality}
                  onChange={(e) => {
                    setIsClassEdited(true);
                    setClassLocality(e.target.value);
                  }}
                  disabled={currentUserRole !== 'class' || isClassViolationSec4}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-11 bg-white disabled:bg-gray-100 disabled:opacity-75 disabled:text-gray-500 disabled:border-gray-200"
                >
                  <option value="good">Có ý thức xây dựng tập thể lớp đoàn kết, giữ gìn giảng đường, nơi cư trú văn minh, sạch đẹp, thực hiện tốt văn hóa học đường (5 điểm)</option>
                  <option value="rewarded">Bị nhắc nhở hoặc kiểm điểm 1 lần (1 điểm)</option>
                  <option value="warned">Bị nhắc nhở hoặc kiểm điểm 2 lần (0 điểm)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
