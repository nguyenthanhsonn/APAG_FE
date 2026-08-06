import React, { useMemo } from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { z } from 'zod';

// ============================================================================
// 1. Zod Schema
// ============================================================================
export const mucVSchema = z.object({
  // Điểm Cán bộ (Mục 1.a & 1.b)
  cadrePosition: z.enum(['LEADER_GROUP', 'MEMBER_GROUP', 'NONE']).default('NONE'),
  cadrePerformance: z.enum(['EXCELLENT', 'GOOD', 'COMPLETE', 'INCOMPLETE']).default('INCOMPLETE'),
  managementLevel: z.enum(['HEAD', 'DEPUTY', 'MEMBER', 'NONE']).default('NONE'),

  // Điểm Sinh viên thường (Mục 2.a & 2.b)
  classParticipation: z.number().min(0).max(3).default(0),
  specialAchievement: z.enum(['SCHOOL_LEVEL_OR_HIGHER', 'FACULTY_LEVEL', 'NONE']).default('NONE'),

  // Ghi chú / Minh chứng
  notes: z.record(z.string(), z.string()).default({}),
  evidenceFiles: z.record(z.string(), z.string()).default({}),

  // Điểm đánh giá của Lớp (Class Reviewer)
  classReview: z
    .object({
      cadrePosition: z.enum(['LEADER_GROUP', 'MEMBER_GROUP', 'NONE']).default('NONE'),
      cadrePerformance: z.enum(['EXCELLENT', 'GOOD', 'COMPLETE', 'INCOMPLETE']).default('INCOMPLETE'),
      managementLevel: z.enum(['HEAD', 'DEPUTY', 'MEMBER', 'NONE']).default('NONE'),
      classParticipation: z.number().min(0).max(3).default(0),
      specialAchievement: z.enum(['SCHOOL_LEVEL_OR_HIGHER', 'FACULTY_LEVEL', 'NONE']).default('NONE'),
      notes: z.record(z.string(), z.string()).default({}),
    })
    .default({
      cadrePosition: 'NONE',
      cadrePerformance: 'INCOMPLETE',
      managementLevel: 'NONE',
      classParticipation: 0,
      specialAchievement: 'NONE',
      notes: {},
    }),
});

export type MucVFormData = z.infer<typeof mucVSchema>;

// ============================================================================
// Helper tính điểm Mục V chuẩn xác
// ============================================================================
export function calculateMucVScore(
  position?: string,
  performance?: string,
  mgmtLevel?: string,
  participation: number = 0,
  achievement?: string
): { totalScore: number; score1a: number; score1b: number; score2a: number; score2b: number } {
  let score1a = 0;
  if (position === 'LEADER_GROUP') {
    if (performance === 'EXCELLENT') score1a = 7;
    else if (performance === 'GOOD') score1a = 6;
    else if (performance === 'COMPLETE') score1a = 4;
  } else if (position === 'MEMBER_GROUP') {
    if (performance === 'EXCELLENT') score1a = 6;
    else if (performance === 'GOOD') score1a = 5;
    else if (performance === 'COMPLETE') score1a = 3;
  }

  let score1b = 0;
  if (position && position !== 'NONE') {
    if (mgmtLevel === 'HEAD') score1b = 3;
    else if (mgmtLevel === 'DEPUTY') score1b = 2;
    else if (mgmtLevel === 'MEMBER') score1b = 1;
  }

  const score1Total = Math.min(10, score1a + score1b);

  const score2a = Math.min(3, Math.max(0, Number(participation) || 0));
  let score2b = 0;
  if (achievement === 'SCHOOL_LEVEL_OR_HIGHER') score2b = 7;
  else if (achievement === 'FACULTY_LEVEL') score2b = 5;

  const score2Total = Math.min(10, Math.max(score2a, score2b));

  // Tối đa 10đ cho cả Mục V (ưu tiên điểm Cán bộ nếu có vị trí)
  const totalScore = Math.min(10, position && position !== 'NONE' ? score1Total : score2Total);

  return { totalScore, score1a, score1b, score2a, score2b };
}

// ============================================================================
// Component chính: MucVSection (Y như mẫu văn bản gốc)
// ============================================================================
interface MucVSectionProps {
  isReadOnly?: boolean;
  isClassEditable?: boolean;
}

export const MucVSection: React.FC<MucVSectionProps> = ({ isReadOnly = false, isClassEditable = false }) => {
  const { watch, setValue, control } = useFormContext<MucVFormData>();

  // Watch data SV
  const cadrePosition = watch('cadrePosition') || 'NONE';
  const cadrePerformance = watch('cadrePerformance') || 'INCOMPLETE';
  const managementLevel = watch('managementLevel') || 'NONE';
  const classParticipation = watch('classParticipation') ?? 0;
  const specialAchievement = watch('specialAchievement') || 'NONE';
  const notes = watch('notes') || {};
  const evidenceFiles = watch('evidenceFiles') || {};

  // Watch data Lớp
  const classReview = watch('classReview') || {
    cadrePosition: 'NONE',
    cadrePerformance: 'INCOMPLETE',
    managementLevel: 'NONE',
    classParticipation: 0,
    specialAchievement: 'NONE',
    notes: {},
  };

  // Tính điểm SV & Lớp
  const svScores = useMemo(
    () => calculateMucVScore(cadrePosition, cadrePerformance, managementLevel, classParticipation, specialAchievement),
    [cadrePosition, cadrePerformance, managementLevel, classParticipation, specialAchievement]
  );

  const classScores = useMemo(
    () =>
      calculateMucVScore(
        classReview.cadrePosition,
        classReview.cadrePerformance,
        classReview.managementLevel,
        classReview.classParticipation ?? 0,
        classReview.specialAchievement
      ),
    [
      classReview.cadrePosition,
      classReview.cadrePerformance,
      classReview.managementLevel,
      classReview.classParticipation,
      classReview.specialAchievement,
    ]
  );

  const tdBorder = 'border border-gray-400 px-2 py-1.5 text-xs text-gray-900 align-top';
  const tdCenter = 'border border-gray-400 px-1 py-1.5 text-center text-xs font-semibold align-top';
  const tdHeader = 'border border-gray-400 px-2 py-2 text-center text-xs font-bold bg-gray-100 uppercase tracking-tight';

  return (
    <div className="bg-white rounded-lg shadow border border-gray-300 overflow-hidden font-sans my-6">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-400 text-left bg-white text-xs">
          <thead>
            <tr>
              <th className={`${tdHeader} w-10`}>TT</th>
              <th className={`${tdHeader} min-w-[340px]`}>Nội dung đánh giá</th>
              <th className={`${tdHeader} w-24`}>Thang điểm</th>
              <th className={`${tdHeader} w-32`}>Điểm SV tự đánh giá</th>
              <th className={`${tdHeader} w-32`}>Điểm Lớp đánh giá</th>
              <th className={`${tdHeader} min-w-[180px]`}>Ghi chú <span className="font-normal block text-[10px] lowercase text-gray-600">(minh chứng các hoạt động)</span></th>
            </tr>
          </thead>
          <tbody>
            {/* ═══ DÒNG CHÍNH MỤC V ═══ */}
            <tr className="bg-gray-100/90 font-bold">
              <td className={tdCenter}>V.</td>
              <td className={`${tdBorder} font-bold`}>
                Đánh giá về ý thức và kết quả tham gia Ban cán sự lớp, BCH Đoàn, Ban chủ nhiệm các Ban, CLB, Đội, Hội, Nhóm được thành lập theo quy định.
              </td>
              <td className={`${tdCenter} font-bold`}>Từ 0÷10 điểm</td>
              <td className={`${tdCenter} text-blue-700 font-extrabold text-sm`}>{svScores.totalScore.toFixed(2)}</td>
              <td className={`${tdCenter} text-red-700 font-extrabold text-sm`}>{classScores.totalScore.toFixed(2)}</td>
              <td className={tdBorder}></td>
            </tr>

            {/* ═══ MỤC 1 ═══ */}
            <tr className="font-semibold bg-gray-50/50">
              <td className={tdCenter}>1</td>
              <td className={`${tdBorder} italic font-bold`}>
                BCS lớp, BCH các tổ chức Đảng, Đoàn thanh niên, Hội sinh viên, chi bộ sinh viên, các CLB và các tổ chức khác trong Học viện/Phân viện được thành lập theo quy định.
              </td>
              <td className={tdCenter}>7</td>
              <td className={tdCenter}></td>
              <td className={tdCenter}></td>
              <td className={tdBorder}></td>
            </tr>

            {/* ═══ MỤC 1.a ═══ */}
            <tr>
              <td className={tdCenter}>a)</td>
              <td className={tdBorder}>
                Ý thức, tinh thần, thái độ, uy tín và hiệu quả công việc của sinh viên được phân công nhiệm vụ quản lý lớp, các tổ chức Đảng, Đoàn thanh niên, Hội sinh viên, các CLB và các tổ chức khác trong Học viện/Phân viện được thành lập theo quy định.
              </td>
              <td className={tdCenter}>7</td>
              <td className={tdCenter}></td>
              <td className={tdCenter}></td>
              <td className={tdBorder}></td>
            </tr>

            {/* Sub-rows 1.a: Nhóm 1 */}
            <tr className="border-t border-dashed border-gray-300">
              <td className={`${tdCenter} text-gray-500`}>-</td>
              <td className={`${tdBorder} pl-4 leading-snug`}>
                Lớp trưởng, Lớp phó lớp sinh viên; Bí thư, Phó Bí thư chi đoàn; Bí thư và Phó Bí thư liên chi đoàn, Ủy viên BCH liên chi; Ủy viên BCH Đoàn Học viện, Phân viện; Ủy viên BCH Hội sinh viên; Chủ nhiệm, Phó Chủ nhiệm các Ban, CLB Hội, Đội, Bí thư, Phó Bí thư chi bộ sinh viên.
              </td>
              <td className={tdCenter}>7</td>
              <td className={tdCenter} colSpan={2}>
                <Controller
                  name="cadrePosition"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 bg-white font-medium cursor-pointer"
                    >
                      <option value="NONE">-- Không chọn nhóm này --</option>
                      <option value="LEADER_GROUP">Chọn: Nhóm Cán bộ cấp Trưởng / Phó (Max 7đ)</option>
                    </select>
                  )}
                />
              </td>
              <td className={tdBorder}>
                <input
                  type="text"
                  placeholder="Ghi chú / Minh chứng..."
                  value={notes['1a_leader'] || ''}
                  onChange={(e) => setValue('notes.1a_leader', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-[11px]"
                />
              </td>
            </tr>

            {/* Đánh giá mức độ hoàn thành Nhóm 1 */}
            {cadrePosition === 'LEADER_GROUP' && (
              <>
                <tr className="bg-blue-50/40">
                  <td className={`${tdCenter} text-blue-600`}>+</td>
                  <td className={`${tdBorder} pl-6 font-medium text-blue-900`}>Hoàn thành xuất sắc nhiệm vụ (được khen thưởng hoặc được lãnh đạo các đơn vị, CVHT, tập thể ghi nhận).</td>
                  <td className={tdCenter}>7</td>
                  <td className={tdCenter} colSpan={2} rowSpan={4}>
                    <Controller
                      name="cadrePerformance"
                      control={control}
                      render={({ field }) => (
                        <select
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-blue-400 rounded text-xs font-bold bg-white text-blue-900 focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          <option value="EXCELLENT">7đ - Hoàn thành xuất sắc</option>
                          <option value="GOOD">6đ - Hoàn thành tốt</option>
                          <option value="COMPLETE">4đ - Hoàn thành nhiệm vụ</option>
                          <option value="INCOMPLETE">0đ - Không hoàn thành</option>
                        </select>
                      )}
                    />
                  </td>
                  <td className={tdBorder} rowSpan={4}>
                    {cadrePerformance === 'EXCELLENT' && (
                      <input
                        type="text"
                        placeholder="Link file minh chứng Giấy khen..."
                        value={evidenceFiles['cadre_perf'] || ''}
                        onChange={(e) => setValue('evidenceFiles.cadre_perf', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-[11px] bg-white"
                      />
                    )}
                  </td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className={`${tdCenter} text-blue-600`}>+</td>
                  <td className={`${tdBorder} pl-6 text-gray-700`}>Hoàn thành tốt nhiệm vụ</td>
                  <td className={tdCenter}>6</td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className={`${tdCenter} text-blue-600`}>+</td>
                  <td className={`${tdBorder} pl-6 text-gray-700`}>Hoàn thành nhiệm vụ</td>
                  <td className={tdCenter}>4</td>
                </tr>
                <tr className="bg-blue-50/40">
                  <td className={`${tdCenter} text-blue-600`}>+</td>
                  <td className={`${tdBorder} pl-6 text-gray-700`}>Không hoàn thành nhiệm vụ</td>
                  <td className={tdCenter}>0</td>
                </tr>
              </>
            )}

            {/* Sub-rows 1.a: Nhóm 2 */}
            <tr className="border-t border-dashed border-gray-300">
              <td className={`${tdCenter} text-gray-500`}>-</td>
              <td className={`${tdBorder} pl-4 leading-snug`}>
                Ủy viên BCH chi đoàn; Chi ủy viên chi bộ Sinh viên, thành viên đội TN xung kích, Tổ trưởng, tổ phó các lớp; Ủy viên các Ban, CLB, Đội.
              </td>
              <td className={tdCenter}>6</td>
              <td className={tdCenter} colSpan={2}>
                <Controller
                  name="cadrePosition"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={isReadOnly}
                      className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 bg-white font-medium cursor-pointer"
                    >
                      <option value="NONE">-- Không chọn nhóm này --</option>
                      <option value="MEMBER_GROUP">Chọn: Nhóm Ủy viên / Tổ trưởng / Tổ phó (Max 6đ)</option>
                    </select>
                  )}
                />
              </td>
              <td className={tdBorder}></td>
            </tr>

            {/* Đánh giá mức độ hoàn thành Nhóm 2 */}
            {cadrePosition === 'MEMBER_GROUP' && (
              <>
                <tr className="bg-purple-50/40">
                  <td className={`${tdCenter} text-purple-600`}>+</td>
                  <td className={`${tdBorder} pl-6 font-medium text-purple-900`}>Hoàn thành xuất sắc nhiệm vụ (được khen thưởng hoặc được lãnh đạo các đơn vị, CVHT, tập thể ghi nhận)</td>
                  <td className={tdCenter}>6</td>
                  <td className={tdCenter} colSpan={2} rowSpan={4}>
                    <Controller
                      name="cadrePerformance"
                      control={control}
                      render={({ field }) => (
                        <select
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isReadOnly}
                          className="w-full px-2 py-1.5 border border-purple-400 rounded text-xs font-bold bg-white text-purple-900 focus:ring-1 focus:ring-purple-500 cursor-pointer"
                        >
                          <option value="EXCELLENT">6đ - Hoàn thành xuất sắc</option>
                          <option value="GOOD">5đ - Hoàn thành tốt</option>
                          <option value="COMPLETE">3đ - Hoàn thành nhiệm vụ</option>
                          <option value="INCOMPLETE">0đ - Không hoàn thành</option>
                        </select>
                      )}
                    />
                  </td>
                  <td className={tdBorder} rowSpan={4}>
                    {cadrePerformance === 'EXCELLENT' && (
                      <input
                        type="text"
                        placeholder="Link file minh chứng Giấy khen..."
                        value={evidenceFiles['cadre_perf'] || ''}
                        onChange={(e) => setValue('evidenceFiles.cadre_perf', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-2 py-1 border border-purple-300 rounded text-[11px] bg-white"
                      />
                    )}
                  </td>
                </tr>
                <tr className="bg-purple-50/40">
                  <td className={`${tdCenter} text-purple-600`}>+</td>
                  <td className={`${tdBorder} pl-6 text-gray-700`}>Hoàn thành tốt nhiệm vụ</td>
                  <td className={tdCenter}>5</td>
                </tr>
                <tr className="bg-purple-50/40">
                  <td className={`${tdCenter} text-purple-600`}>+</td>
                  <td className={`${tdBorder} pl-6 text-gray-700`}>Hoàn thành nhiệm vụ</td>
                  <td className={tdCenter}>3</td>
                </tr>
                <tr className="bg-purple-50/40">
                  <td className={`${tdCenter} text-purple-600`}>+</td>
                  <td className={`${tdBorder} pl-6 text-gray-700`}>Không hoàn thành nhiệm vụ</td>
                  <td className={tdCenter}>0</td>
                </tr>
              </>
            )}

            {/* ═══ MỤC 1.b ═══ */}
            <tr className="border-t border-gray-300">
              <td className={tdCenter}>b)</td>
              <td className={tdBorder}>
                Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn thanh niên, Hội sinh viên, Trưởng phòng ở KTX, các Ban, CLB, Đội, Hội, nhóm đạt kết quả tốt, không có sinh viên trong lớp bị kỷ luật, không có thành viên trong Hội, Đội, nhóm, CLB vi phạm, sinh viên tham gia tích cực vào các hoạt động chung của lớp, khoa/đơn vị, Phân viện và Học viện.
              </td>
              <td className={`${tdCenter} font-semibold`}>Từ 0÷3 điểm</td>
              <td className={`${tdCenter} font-bold text-blue-700`}>{svScores.score1b}đ</td>
              <td className={`${tdCenter} font-bold text-red-700`}>{classScores.score1b}đ</td>
              <td className={tdBorder}>
                <input
                  type="text"
                  placeholder="Ghi chú kỹ năng..."
                  value={notes['1b_mgmt'] || ''}
                  onChange={(e) => setValue('notes.1b_mgmt', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-[11px]"
                />
              </td>
            </tr>

            {/* Sub-rows 1.b */}
            <tr className="border-t border-dashed border-gray-300">
              <td className={`${tdCenter} text-gray-500`}>-</td>
              <td className={`${tdBorder} pl-4`}>Cấp trưởng: Liên chi đoàn, Lớp sinh viên, Lớp học phần, chi đoàn, chi bộ, chi hội, Chủ nhiệm các CLB, Đội.</td>
              <td className={tdCenter}>3</td>
              <td className={tdCenter} colSpan={2} rowSpan={3}>
                <Controller
                  name="managementLevel"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={isReadOnly || cadrePosition === 'NONE'}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-semibold bg-white cursor-pointer focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="NONE">0đ - Không thuộc các cấp</option>
                      <option value="HEAD">3đ - Cấp Trưởng</option>
                      <option value="DEPUTY">2đ - Cấp Phó</option>
                      <option value="MEMBER">1đ - Ủy viên</option>
                    </select>
                  )}
                />
              </td>
              <td className={tdBorder} rowSpan={3}></td>
            </tr>
            <tr className="border-t border-dashed border-gray-300">
              <td className={`${tdCenter} text-gray-500`}>-</td>
              <td className={`${tdBorder} pl-4`}>Cấp Phó: Liên chi đoàn, Lớp sinh viên, chi đoàn, chi bộ, chi hội, các CLB, Đội.</td>
              <td className={tdCenter}>2</td>
            </tr>
            <tr className="border-t border-dashed border-gray-300">
              <td className={`${tdCenter} text-gray-500`}>-</td>
              <td className={`${tdBorder} pl-4`}>Ủy viên: BCH Đoàn, Hội, CLB, Đội.</td>
              <td className={tdCenter}>1</td>
            </tr>

            {/* ═══ MỤC 2 ═══ */}
            <tr className="font-semibold bg-gray-50/50 border-t-2 border-gray-400">
              <td className={tdCenter}>2</td>
              <td className={`${tdBorder} font-bold`}>Tất cả các sinh viên trong lớp:</td>
              <td className={`${tdCenter} font-bold`}>Từ 0÷10 điểm</td>
              <td className={tdCenter}></td>
              <td className={tdCenter}></td>
              <td className={tdBorder}></td>
            </tr>

            {/* ═══ MỤC 2.a ═══ */}
            <tr>
              <td className={tdCenter}>a)</td>
              <td className={tdBorder}>
                Sinh viên tham gia đầy đủ các hoạt động, sinh hoạt của lớp, khoa, Học viện, có ý kiến tham gia xây dựng tập thể vững mạnh (trừ đối tượng ở tiểu mục 1, 2, 3 mục 5)
              </td>
              <td className={tdCenter}>3</td>
              <td className={tdCenter}>
                <Controller
                  name="classParticipation"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      disabled={isReadOnly || cadrePosition !== 'NONE'}
                      className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs text-center font-bold bg-white cursor-pointer disabled:bg-gray-100"
                    >
                      <option value={0}>0đ</option>
                      <option value={1}>1đ</option>
                      <option value={2}>2đ</option>
                      <option value={3}>3đ</option>
                    </select>
                  )}
                />
              </td>
              <td className={tdCenter}>
                {isClassEditable && (
                  <select
                    value={classReview.classParticipation ?? 0}
                    onChange={(e) => setValue('classReview.classParticipation', Number(e.target.value))}
                    className="w-full px-1.5 py-1 border border-indigo-300 rounded text-xs text-center font-bold bg-white cursor-pointer"
                  >
                    <option value={0}>0đ</option>
                    <option value={1}>1đ</option>
                    <option value={2}>2đ</option>
                    <option value={3}>3đ</option>
                  </select>
                )}
              </td>
              <td className={tdBorder}>
                <input
                  type="text"
                  placeholder="Ghi chú ý kiến đóng góp..."
                  value={notes['2a_part'] || ''}
                  onChange={(e) => setValue('notes.2a_part', e.target.value)}
                  disabled={isReadOnly}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-[11px]"
                />
              </td>
            </tr>

            {/* ═══ MỤC 2.b ═══ */}
            <tr>
              <td className={tdCenter}>b)</td>
              <td className={tdBorder}>
                Sinh viên đạt được các thành tích đặc biệt trong học tập, rèn luyện, dũng cảm cứu người được cấp giấy chứng nhận hoặc có giấy khen
              </td>
              <td className={tdCenter}>7</td>
              <td className={tdCenter} colSpan={2} rowSpan={3}>
                <Controller
                  name="specialAchievement"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      disabled={isReadOnly || cadrePosition !== 'NONE'}
                      className="w-full px-2 py-1.5 border border-emerald-400 rounded text-xs font-bold text-emerald-900 bg-white cursor-pointer disabled:bg-gray-100"
                    >
                      <option value="NONE">0đ - Không có khen thưởng</option>
                      <option value="SCHOOL_LEVEL_OR_HIGHER">7đ - Khen thưởng cấp Học viện trở lên</option>
                      <option value="FACULTY_LEVEL">5đ - Khen thưởng cấp Khoa trở lên</option>
                    </select>
                  )}
                />
              </td>
              <td className={tdBorder} rowSpan={3}>
                {specialAchievement !== 'NONE' && (
                  <input
                    type="text"
                    placeholder="Link Drive bằng khen / giấy khen..."
                    value={evidenceFiles['special_ach'] || ''}
                    onChange={(e) => setValue('evidenceFiles.special_ach', e.target.value)}
                    disabled={isReadOnly}
                    className="w-full px-2 py-1 border border-emerald-300 rounded text-[11px] bg-white"
                  />
                )}
              </td>
            </tr>

            {/* Sub-rows 2.b */}
            <tr className="border-t border-dashed border-gray-300">
              <td className={`${tdCenter} text-gray-500`}>-</td>
              <td className={`${tdBorder} pl-4`}>Được khen thưởng từ cấp Học viện trở lên</td>
              <td className={tdCenter}>7</td>
            </tr>
            <tr className="border-t border-dashed border-gray-300">
              <td className={`${tdCenter} text-gray-500`}>-</td>
              <td className={`${tdBorder} pl-4`}>Đạt khen thưởng từ cấp Khoa trở lên</td>
              <td className={tdCenter}>5</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MucVSection;
