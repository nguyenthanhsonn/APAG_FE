'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Lock, Upload, X, ChevronDown } from 'lucide-react';
import type { CouncilDeductionStepperProps as DeductionStepperProps } from '@/types/admin';
import { useShallow } from 'zustand/react/shallow';
import { useCouncilReviewStore, computeCouncilScores, type CouncilReviewState } from '@/store/councilReviewStore';

import { canEditReviewScores } from '@/utils/permissionHelpers';
import {
  REGULAR_SCORE_LEVEL_OPTIONS,
  ACADEMIC_RANK_OPTIONS,
  TASK_COMPLETION_LEVEL_A1_OPTIONS,
  TASK_COMPLETION_LEVEL_A2_OPTIONS,
  MANAGEMENT_SKILL_LEVEL_OPTIONS,
  SPECIAL_ACHIEVEMENT_LEVEL_OPTIONS,
} from '@/constants/evaluationEnums';

const DEDUCTION_WEIGHTS = [10, 3, 5, 5, 5, 5, 5, 10, 20];
const DeductionStepper = ({ isSv, index, value, onChange, disabled, weight, noViolationScore, allDeductions, currentUserRole, isReadOnly }: DeductionStepperProps) => {
  const sumOther = allDeductions.reduce((s, c, i) => (i === index ? s : s + (Number(c) || 0) * DEDUCTION_WEIGHTS[i]), 0);
  const baseScore = Number(noViolationScore) || 0;
  const remainingScore = Math.max(0, baseScore - sumOther);
  const maxTimes = weight > 0 ? Math.floor(remainingScore / weight) : 0;
  const disabledPlus = disabled || value >= maxTimes;
  const disabledMinus = disabled || value <= 0;
  const [localVal, setLocalVal] = useState(String(value));

  useEffect(() => { setLocalVal(String(value)); }, [value]);

  const parsedVal = parseInt(localVal.trim(), 10);
  const isInvalidInput = localVal.trim() !== '' && (
    isNaN(parsedVal) ||
    parsedVal < 0 ||
    parsedVal > maxTimes ||
    !/^\d+$/.test(localVal.trim())
  );

  const commit = () => {
    let n = parseInt(localVal.trim(), 10);
    if (isNaN(n)) n = 0;
    const clamped = Math.min(maxTimes, Math.max(0, n));
    setLocalVal(String(clamped));
    onChange(clamped);
  };

  const currentCount = isInvalidInput ? (isNaN(parsedVal) ? 0 : Math.max(0, parsedVal)) : value;
  const deductedPoints = Math.min(baseScore, currentCount * weight);

  const isReviewerRole = currentUserRole === 'class_leader' || currentUserRole === 'advisor';
  const isRoleLocked = disabled && !isReadOnly && ((currentUserRole === 'student' && !isSv) || (isReviewerRole && isSv));
  if (isRoleLocked) return (
    <div className="relative inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-md px-2 py-1">
      <Lock size={10} className="text-gray-400" />
      <span className="text-xs font-semibold text-gray-500">{value} lần (−{deductedPoints}đ)</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => {
            if (!disabledMinus && value > 0) {
              const newVal = Math.max(0, value - 1);
              onChange(newVal);
            }
          }}
          disabled={disabledMinus}
          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-l text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
        >
          <Minus size={10} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit();
              e.currentTarget.blur();
            }
          }}
          disabled={disabled}
          className={`w-10 h-7 text-center text-xs border-y font-bold disabled:bg-gray-100 outline-none transition-colors ${
            isInvalidInput
              ? 'border-red-500 text-red-600 bg-red-50 focus:border-red-500 ring-1 ring-red-500'
              : 'border-gray-300 bg-white text-gray-800 focus:border-blue-500'
          }`}
        />
        <button
          type="button"
          onClick={() => {
            if (!disabledPlus && value < maxTimes) {
              const newVal = Math.min(maxTimes, value + 1);
              onChange(newVal);
            }
          }}
          disabled={disabledPlus}
          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-r text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed"
        >
          <Plus size={10} />
        </button>
      </div>
      <span className={`text-xs font-semibold whitespace-nowrap ${deductedPoints > 0 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
        −{deductedPoints}đ
      </span>
    </div>
  );
};

const ScoreSelect = ({ options, value, onChange, disabled }: { options: {label:string;value:string}[]; value:string; onChange:(v:string)=>void; disabled:boolean }) => (
  <div className="relative inline-flex items-center w-full min-w-[80px]">
    <select
      value={value}
      onChange={e=>onChange(e.target.value)}
      disabled={disabled}
      className="w-full h-10 pl-2.5 pr-7 text-sm sm:text-base border border-gray-300 rounded-md bg-white text-gray-800 font-semibold outline-none appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm"
    >
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <div className="absolute right-2 pointer-events-none text-gray-500">
      <ChevronDown size={16} />
    </div>
  </div>
);

const NoteArea = ({ value, onChange, disabled }: { value:string; onChange:(v:string)=>void; disabled:boolean }) => (
  <textarea value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} rows={2} placeholder={disabled ? '' : 'Nhận xét / minh chứng...'} className="w-full text-xs sm:text-sm border border-gray-300 rounded px-2 py-1.5 resize-none outline-none focus:ring-1 focus:ring-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed leading-normal"/>
);

const MiniUpload = ({ fileKey, disabled, required }: { fileKey:string; disabled:boolean; required?:boolean }) => {
  const uploadedFiles = useCouncilReviewStore(s => s.uploadedFiles);
  const handleFileUpload = useCouncilReviewStore(s => s.handleFileUploadAction);
  const removeFile = useCouncilReviewStore(s => s.removeFileAction);
  const files = uploadedFiles[fileKey] || [];
  return (
    <div className="mt-1.5 space-y-1">
      {files.map((f,i)=>(
        <div key={i} className="flex items-center justify-between gap-2 text-[10px] text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 font-semibold">
          <span className="truncate max-w-[120px]">{f}</span>
          {!disabled&&<button type="button" onClick={()=>removeFile(fileKey,i)} className="text-red-500 hover:text-red-700"><X size={12}/></button>}
        </div>
      ))}
      {!disabled&& (
        <label className={`inline-flex items-center gap-1.5 text-[11px] font-bold cursor-pointer px-2.5 py-1.5 rounded-lg border transition-all duration-150 ${required&&files.length===0?'border-red-400 text-red-600 bg-red-50 hover:bg-red-100':'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'}`}>
          <Upload size={12}/>
          Đẩy file minh chứng
          <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={e=>handleFileUpload(fileKey,e)}/>
        </label>
      )}
    </div>
  );
};

const SectionHeaderRow = ({ tt, title, maxScore }: { tt:string; title:string; maxScore:number }) => (
  <tr className="bg-gray-100 border-t-2 border-b border-gray-300 font-extrabold">
    <td className="px-2 py-3 text-xs font-black text-gray-900 align-middle border-r border-gray-300 text-center whitespace-nowrap">{tt}</td>
    <td className="px-3 py-3 text-xs font-black text-gray-950 uppercase tracking-wider align-middle border-r border-gray-300" colSpan={2}>{title}</td>
    <td className="px-2 py-3 text-xs font-black text-gray-900 align-middle border-r border-gray-300 text-center whitespace-nowrap">{maxScore.toFixed(2)}</td>
    <td className="px-2 py-3 align-middle border-r border-gray-300" colSpan={2}></td>
    <td className="px-2 py-3 align-middle" colSpan={2}></td>
  </tr>
);

const LockedScore = () => <span className="text-[10px] text-red-500 italic font-semibold">(Hủy điểm)</span>;

export const CouncilCriteriaReviewTable = () => {
  // ── Read all state from council review store via fine-grained selectors ───
  const currentUserRole = useCouncilReviewStore(s => s.currentUserRole);
  const isReadOnly = useCouncilReviewStore(s => s.isReadOnly);
  const dbStudentTotalScore = useCouncilReviewStore(s => s.dbStudentTotalScore);
  const dbClassTotalScore = useCouncilReviewStore(s => s.dbClassTotalScore);
  const svScores = useCouncilReviewStore(useShallow((s: CouncilReviewState) => computeCouncilScores(s, true)));
  const classScores = useCouncilReviewStore(useShallow((s: CouncilReviewState) => computeCouncilScores(s, false)));
  const workflowStatus = useCouncilReviewStore(s => (s as any).workflowStatus || 'submitted');

  const isSvEditable = false;
  const isClassEditable = canEditReviewScores(currentUserRole, workflowStatus);

  const displaySvTotal = (isReadOnly && typeof dbStudentTotalScore === 'number')
    ? dbStudentTotalScore
    : svScores.total;

  const displayClassTotal = (!isClassEditable && typeof dbClassTotalScore === 'number')
    ? dbClassTotalScore
    : classScores.total;

  // Sec 1
  const svStudyAttitude = useCouncilReviewStore(s => s.svStudyAttitude);
  const svNckh = useCouncilReviewStore(s => s.svNckh);
  const svOlympic = useCouncilReviewStore(s => s.svOlympic);
  const svCreative = useCouncilReviewStore(s => s.svCreative);
  const svAcademicRank = useCouncilReviewStore(s => s.svAcademicRank);
  const classStudyAttitude = useCouncilReviewStore(s => s.classStudyAttitude);
  const classNckh = useCouncilReviewStore(s => s.classNckh);
  const classOlympic = useCouncilReviewStore(s => s.classOlympic);
  const classCreative = useCouncilReviewStore(s => s.classCreative);
  const classAcademicRank = useCouncilReviewStore(s => s.classAcademicRank);
  const isSvViolationSec1 = useCouncilReviewStore(s => s.isSvViolationSec1);
  const isClassViolationSec1 = useCouncilReviewStore(s => s.isClassViolationSec1);
  // Sec 2
  const svNoViolationScore = useCouncilReviewStore(s => s.svNoViolationScore);
  const svDeductions = useCouncilReviewStore(s => s.svDeductions);
  const classNoViolationScore = useCouncilReviewStore(s => s.classNoViolationScore);
  const classDeductions = useCouncilReviewStore(s => s.classDeductions);
  const deductionLabels = useCouncilReviewStore(s => s.deductionLabels);
  const isSvViolationSec2 = useCouncilReviewStore(s => s.isSvViolationSec2);
  const isClassViolationSec2 = useCouncilReviewStore(s => s.isClassViolationSec2);
  // Sec 3
  const svActivity1 = useCouncilReviewStore(s => s.svActivity1);
  const svActivity2 = useCouncilReviewStore(s => s.svActivity2);
  const svActivity3 = useCouncilReviewStore(s => s.svActivity3);
  const svActivity4 = useCouncilReviewStore(s => s.svActivity4);
  const svRewardPoints = useCouncilReviewStore(s => s.svRewardPoints);
  const classActivity1 = useCouncilReviewStore(s => s.classActivity1);
  const classActivity2 = useCouncilReviewStore(s => s.classActivity2);
  const classActivity3 = useCouncilReviewStore(s => s.classActivity3);
  const classActivity4 = useCouncilReviewStore(s => s.classActivity4);
  const classRewardPoints = useCouncilReviewStore(s => s.classRewardPoints);
  const isSvViolationSec3 = useCouncilReviewStore(s => s.isSvViolationSec3);
  const isClassViolationSec3 = useCouncilReviewStore(s => s.isClassViolationSec3);
  // Sec 4
  const svPolicy = useCouncilReviewStore(s => s.svPolicy);
  const svSolidarity = useCouncilReviewStore(s => s.svSolidarity);
  const svLocality = useCouncilReviewStore(s => s.svLocality);
  const classPolicy = useCouncilReviewStore(s => s.classPolicy);
  const classSolidarity = useCouncilReviewStore(s => s.classSolidarity);
  const classLocality = useCouncilReviewStore(s => s.classLocality);
  const isSvViolationSec4 = useCouncilReviewStore(s => s.isSvViolationSec4);
  const isClassViolationSec4 = useCouncilReviewStore(s => s.isClassViolationSec4);
  // Sec 5
  const svRoleType = useCouncilReviewStore(s => s.svRoleType);
  const svCadrePosition = useCouncilReviewStore(s => s.svCadrePosition);
  const svCadrePerformance = useCouncilReviewStore(s => s.svCadrePerformance);
  const svManagementLevel = useCouncilReviewStore(s => s.svManagementLevel);
  const svClassParticipation = useCouncilReviewStore(s => s.svClassParticipation);
  const svSpecialAchievement = useCouncilReviewStore(s => s.svSpecialAchievement);
  const classRoleType = useCouncilReviewStore(s => s.classRoleType);
  const classCadrePosition = useCouncilReviewStore(s => s.classCadrePosition);
  const classCadrePerformance = useCouncilReviewStore(s => s.classCadrePerformance);
  const classManagementLevel = useCouncilReviewStore(s => s.classManagementLevel);
  const classClassParticipation = useCouncilReviewStore(s => s.classClassParticipation);
  const classSpecialAchievement = useCouncilReviewStore(s => s.classSpecialAchievement);
  const isSvViolationSec5 = useCouncilReviewStore(s => s.isSvViolationSec5);
  const isClassViolationSec5 = useCouncilReviewStore(s => s.isClassViolationSec5);

  const isSvOfficer = ['CLASS_OFFICER', 'UNION_OFFICER', 'CLUB_OFFICER', 'cadre'].includes(String(svRoleType || ''));
  const isSvStudent = !isSvOfficer;
  const isClassOfficer = ['CLASS_OFFICER', 'UNION_OFFICER', 'CLUB_OFFICER', 'cadre'].includes(String(classRoleType || ''));
  const isClassStudent = !isClassOfficer;

  // Actions
  const setField = useCouncilReviewStore(s => s.setField);
  const handleDeductionChange = useCouncilReviewStore(s => s.handleDeductionChange);
  const setIsClassEdited = useCouncilReviewStore(s => s.setIsClassEdited);

  // Convenience setters derived from setField
  const setSvStudyAttitude = (v: string) => setField('svStudyAttitude', v);
  const setSvNckh = (v: boolean) => setField('svNckh', v);
  const setSvOlympic = (v: boolean) => setField('svOlympic', v);
  const setSvCreative = (v: boolean) => setField('svCreative', v);
  const setSvAcademicRank = (v: string) => setField('svAcademicRank', v);
  const setClassStudyAttitude = (v: string) => setField('classStudyAttitude', v);
  const setClassNckh = (v: boolean) => setField('classNckh', v);
  const setClassOlympic = (v: boolean) => setField('classOlympic', v);
  const setClassCreative = (v: boolean) => setField('classCreative', v);
  const setClassAcademicRank = (v: string) => setField('classAcademicRank', v);
  const setIsSvViolationSec1 = (v: boolean) => setField('isSvViolationSec1', v);
  const setIsClassViolationSec1 = (v: boolean) => setField('isClassViolationSec1', v);
  const setSvNoViolationScore = (v: number) => setField('svNoViolationScore', v);
  const setClassNoViolationScore = (v: number) => setField('classNoViolationScore', v);
  const setIsSvViolationSec2 = (v: boolean) => setField('isSvViolationSec2', v);
  const setIsClassViolationSec2 = (v: boolean) => setField('isClassViolationSec2', v);
  const setSvActivity1 = (v: string) => setField('svActivity1', v);
  const setSvActivity2 = (v: string) => setField('svActivity2', v);
  const setSvActivity3 = (v: string) => setField('svActivity3', v);
  const setSvActivity4 = (v: string) => setField('svActivity4', v);
  const setSvRewardPoints = (v: number) => setField('svRewardPoints', v);
  const setClassActivity1 = (v: string) => setField('classActivity1', v);
  const setClassActivity2 = (v: string) => setField('classActivity2', v);
  const setClassActivity3 = (v: string) => setField('classActivity3', v);
  const setClassActivity4 = (v: string) => setField('classActivity4', v);
  const setClassRewardPoints = (v: number) => setField('classRewardPoints', v);
  const setIsSvViolationSec3 = (v: boolean) => setField('isSvViolationSec3', v);
  const setIsClassViolationSec3 = (v: boolean) => setField('isClassViolationSec3', v);
  const setSvPolicy = (v: string) => setField('svPolicy', v);
  const setSvSolidarity = (v: string) => setField('svSolidarity', v);
  const setSvLocality = (v: string) => setField('svLocality', v);
  const setClassPolicy = (v: string) => setField('classPolicy', v);
  const setClassSolidarity = (v: string) => setField('classSolidarity', v);
  const setClassLocality = (v: string) => setField('classLocality', v);
  const setIsSvViolationSec4 = (v: boolean) => setField('isSvViolationSec4', v);
  const setIsClassViolationSec4 = (v: boolean) => setField('isClassViolationSec4', v);
  const setSvRoleType = (v: 'cadre' | 'student') => setField('svRoleType', v);
  const setSvCadrePosition = (v: string) => setField('svCadrePosition', v);
  const setSvCadrePerformance = (v: string) => setField('svCadrePerformance', v);
  const setSvManagementLevel = (v: string) => setField('svManagementLevel', v);
  const setSvClassParticipation = (v: number) => setField('svClassParticipation', v);
  const setSvSpecialAchievement = (v: string) => setField('svSpecialAchievement', v);
  const setClassRoleType = (v: 'cadre' | 'student') => setField('classRoleType', v);
  const setClassCadrePosition = (v: string) => setField('classCadrePosition', v);
  const setClassCadrePerformance = (v: string) => setField('classCadrePerformance', v);
  const setClassManagementLevel = (v: string) => setField('classManagementLevel', v);
  const setClassClassParticipation = (v: number) => setField('classClassParticipation', v);
  const setClassSpecialAchievement = (v: string) => setField('classSpecialAchievement', v);
  const setIsSvViolationSec5 = (v: boolean) => setField('isSvViolationSec5', v);
  const setIsClassViolationSec5 = (v: boolean) => setField('isClassViolationSec5', v);


  const [notes, setNotes] = useState<Record<string,string>>({});
  const setNote = (key: string, v: string) => setNotes(prev => ({...prev,[key]:v}));


  const editHint = (() => {
    if (isReadOnly) return 'Đã chốt điểm đánh giá, không được phép chỉnh sửa lại.';
    if (isClassEditable) {
      return currentUserRole === 'advisor'
        ? 'CVHT đang ở bước xử lý, có thể chỉnh sửa cột Điểm lớp đánh giá.'
        : 'Lớp trưởng đang ở bước xử lý, có thể chỉnh sửa cột Điểm lớp đánh giá.';
    }
    if (currentUserRole === 'advisor') return 'CVHT chỉ chỉnh sửa khi phiếu ở trạng thái lớp trưởng đã gửi lên CVHT.';
    if (currentUserRole === 'class_leader') return 'Lớp trưởng chỉ chỉnh sửa khi sinh viên đã nộp phiếu và chưa gửi lên CVHT.';
    return 'Cột Sinh viên tự đánh giá chỉ xem trong màn duyệt.';
  })();
  const markClassEdited = () => { setIsClassEdited(true); };
  const f = (s: number) => s.toFixed(2);
  const tdBase = 'px-2 py-3 align-top border-b border-gray-200 text-xs';
  const tdR = `${tdBase} border-r border-gray-200`;

  const ViolationCheckRow = (props: { label?: string; checked?: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) => {
    void props;
    return null;
  };

  const studyAttitudeOpts = REGULAR_SCORE_LEVEL_OPTIONS;
  const academicRankOpts = ACADEMIC_RANK_OPTIONS;

  const act1Opts = [
    {value:'GOOD_PARTICIPATION',label:'5đ - Tham gia và chấp hành tốt các hoạt động'},
    {value:'ABSENT_ONCE',label:'3đ - Vắng 01 buổi không có lý do'},
    {value:'ABSENT_TWICE',label:'2đ - Vắng 02 buổi không có lý do'},
    {value:'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',label:'0đ - Vắng từ 02 buổi trở lên không có lý do hoặc không tham gia'}
  ];
  const act2Opts = [
    {value:'FULL_EFFECTIVE_PARTICIPATION',label:'5đ - Tham gia đầy đủ, có hiệu quả các hoạt động lớp hoặc các đơn vị tổ chức ghi nhận'},
    {value:'EFFECTIVE_PARTICIPATION_FROM_HALF',label:'3đ - Tham gia có hiệu quả từ 50% các hoạt động trở lên được lớp hoặc đơn vị tổ chức ghi nhận'},
    {value:'ENCOURAGED_OTHERS',label:'2đ - Tích cực vận động mọi người tham gia hoặc hưởng ứng tích cực các phong trào'},
    {value:'ABSENT_OVER_HALF',label:'1đ - Vắng trên 50% số buổi của các hoạt động'},
    {value:'NOT_PARTICIPATED',label:'0đ - Không tham gia'}
  ];
  const act3Opts = [
    {value:'FULL_EFFECTIVE_PARTICIPATION',label:'5đ - Tham gia đầy đủ, có hiệu quả các hoạt động'},
    {value:'ACTIVE_ONE_OR_MORE',label:'3đ - Tham gia tích cực, có hiệu quả từ 01 hoạt động trở lên'},
    {value:'ACTIVE_SUPPORTER',label:'2đ - Là thành viên tích cực hưởng ứng các hoạt động'},
    {value:'ABSENT_OVER_HALF',label:'1đ - Vắng trên 50% số buổi của các hoạt động'},
    {value:'NOT_PARTICIPATED',label:'0đ - Không tham gia'}
  ];
  const act4Opts = [
    {value:'ACTIVE',label:'3đ - Tham gia tích cực'},
    {value:'PARTICIPATED',label:'2đ - Có tham gia'},
    {value:'POOR',label:'1đ - Tham gia khi được phân công'},
    {value:'NOT_PARTICIPATED',label:'0đ - Không tham gia'}
  ];
  const policyOpts = [
    {value:'GOOD_WITH_REWARD',label:'10đ - Chấp hành đúng và tham gia tuyên truyền tốt, được khen thưởng'},
    {value:'GOOD',label:'8đ - Chấp hành đúng và tham gia tuyên truyền tốt'},
    {value:'AVERAGE',label:'5đ - Chấp hành đúng các quy định'},
    {value:'VIOLATED',label:'0đ - Bị nhắc nhở, lập biên bản do vi phạm các quy định'}
  ];
  const solidarityOpts = [
    {value:'ACTIVE_WITH_REWARD',label:'10đ - Tích cực, nhiệt tình tham gia các hoạt động đạt hiệu quả được Học viện, các tổ chức khen thưởng'},
    {value:'ACTIVE',label:'8đ - Tham gia tích cực các hoạt động được lớp hoặc tập thể ghi nhận'},
    {value:'PARTICIPATED',label:'5đ - Có ý thức tham gia hoặc hưởng ứng các hoạt động'},
    {value:'DISUNITY',label:'0đ - Tham gia các hoạt động nhưng gây mất đoàn kết'},
    {value:'NOT_PARTICIPATED',label:'0đ - Không tham gia'}
  ];
  const localityOpts = [
    {value:'GOOD',label:'5đ - Có ý thức xây dựng tập thể lớp đoàn kết, giữ gìn giảng đường, nơi cư trú văn minh, sạch đẹp, thực hiện tốt văn hóa học đường'},
    {value:'ONE_WARNING',label:'1đ - Bị nhắc nhở hoặc kiểm điểm 1 lần'},
    {value:'TWO_WARNINGS',label:'0đ - Bị nhắc nhở hoặc kiểm điểm 2 lần'}
  ];
  const a1PerfOpts = TASK_COMPLETION_LEVEL_A1_OPTIONS;
  const a2PerfOpts = TASK_COMPLETION_LEVEL_A2_OPTIONS;
  const mgmtOpts = MANAGEMENT_SKILL_LEVEL_OPTIONS;

  const sec3Rows = [
    {tt:'1',max:5,key:'iii1',label:'Tham gia đầy đủ, tích cực các hoạt động chính trị, xã hội, các hoạt động tại giảng đường: nghe thời sự, học nghị quyết, tham gia các phong trào đoàn, hội ...',desc:'5đ/3đ/2đ/0đ',opts:act1Opts,svVal:svActivity1,svSet:setSvActivity1,clVal:classActivity1,clSet:setClassActivity1},
    {tt:'2',max:5,key:'iii2',label:'Ý thức tham gia các hoạt động văn hóa, văn nghệ, thể thao do Học viện/Phân viện, các tổ chức đoàn thể phát động',desc:'5đ/3đ/2đ/1đ/0đ',opts:act2Opts,svVal:svActivity2,svSet:setSvActivity2,clVal:classActivity2,clSet:setClassActivity2},
    {tt:'3',max:5,key:'iii3',label:'Tham gia các câu lạc bộ, Đội, Nhóm được tổ chức theo qui định (ngoài học thuật, NCKH)',desc:'5đ/3đ/2đ/1đ/0đ',opts:act3Opts,svVal:svActivity3,svSet:setSvActivity3,clVal:classActivity3,clSet:setClassActivity3},
    {tt:'4',max:3,key:'iii4',label:'Tham gia tuyên truyền, phòng chống tội phạm và các TNXH',desc:'3đ/2đ/1đ/0đ',opts:act4Opts,svVal:svActivity4,svSet:setSvActivity4,clVal:classActivity4,clSet:setClassActivity4},
  ];
  const sec4Rows = [
    {tt:'1',max:10,key:'iv1',label:'Ý thức chấp hành và tham gia tuyên truyền các chủ trương, đường lối của Đảng, chính sách pháp luật của Nhà nước, quy định nơi cư trú, giữ gìn an ninh- trật tự, an toàn giao thông, quy định trong cộng đồng',desc:'10đ/8đ/5đ/0đ',opts:policyOpts,svVal:svPolicy,svSet:setSvPolicy,clVal:classPolicy,clSet:setClassPolicy},
    {tt:'2',max:10,key:'iv2',label:'Tham gia các hoạt động nhân đạo, từ thiện vì cộng đồng, phong trào thanh niên tình nguyện, phong trào giúp đỡ nhân dân và bạn bè khi gặp thiên tai, khó khăn, hoạn nạn',desc:'10đ/8đ/5đ/0đ',opts:solidarityOpts,svVal:svSolidarity,svSet:setSvSolidarity,clVal:classSolidarity,clSet:setClassSolidarity},
    {tt:'3',max:5,key:'iv3',label:'Ý thức xây dựng mối quan hệ đoàn kết với bạn bè và tập thể; xây dựng, bảo vệ cảnh quan giảng đường, nơi cư trú văn minh, sạch đẹp, văn hóa học đường.',desc:'5đ/1đ/0đ',opts:localityOpts,svVal:svLocality,svSet:setSvLocality,clVal:classLocality,clSet:setClassLocality},
  ];



  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isReadOnly || !isClassEditable ? (
        <div className="text-center py-2.5 text-red-600 font-semibold border-b border-gray-200 bg-white text-sm">
          {editHint}
        </div>
      ) : (
        <div className="text-center py-2.5 text-amber-700 font-semibold border-b border-gray-200 bg-amber-50/50 text-sm">
          {editHint}
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 text-center font-bold">
              <th rowSpan={2} className="px-2 py-3 border-r border-gray-300 w-10 align-middle">TT</th>
              <th rowSpan={2} className="px-3 py-3 border-r border-gray-300 text-left align-middle" colSpan={2}>NỘI DUNG ĐÁNH GIÁ</th>
              <th rowSpan={2} className="px-2 py-3 border-r border-gray-300 w-24 align-middle">THANG ĐIỂM</th>
              <th colSpan={2} className="px-2 py-2 border-r border-gray-300">ĐIỂM SV TỰ ĐÁNH GIÁ</th>
              <th colSpan={2} className="px-2 py-2 border-gray-300">ĐIỂM LỚP ĐÁNH GIÁ</th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-300 text-xs font-bold text-gray-600 text-center uppercase">
              <th className="px-2 py-1.5 border-r border-gray-300 w-36">GHI CHÚ / MINH CHỨNG</th>
              <th className="px-2 py-1.5 border-r border-gray-300 w-28">ĐIỂM</th>
              <th className="px-2 py-1.5 border-r border-gray-300 w-36">GHI CHÚ / MINH CHỨNG</th>
              <th className="px-2 py-1.5 w-28">ĐIỂM</th>
            </tr>
          </thead>
          <tbody>
            {/* ═══ MỤC I ═══ */}
            <SectionHeaderRow tt="I" title="Ý thức tham gia học tập (căn cứ vào số tín chỉ trong 01 học kỳ ≥ số tín chỉ tối thiểu theo quy định của Học viện)" maxScore={20}/>
            <ViolationCheckRow label="[SV] Vi phạm thi cử nghiêm trọng (Hủy điểm Mục I)" checked={isSvViolationSec1} onChange={v=>{if(isSvEditable)setIsSvViolationSec1(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận vi phạm nghiêm trọng Mục I" checked={isClassViolationSec1} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec1(v);}}} disabled={!isClassEditable}/>

            {/* I.1 */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>1</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Ý thức và thái độ học tập (ý thức chuyên cần)</td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>6.00</td>
              <td className={tdR}><NoteArea value={notes['sv_i1']||''} onChange={v=>setNote('sv_i1',v)} disabled={!isSvEditable||isSvViolationSec1}/></td>
              <td className={tdR}>{isSvViolationSec1?<LockedScore/>:<ScoreSelect options={studyAttitudeOpts} value={svStudyAttitude} onChange={v=>{if(isSvEditable)setSvStudyAttitude(v);}} disabled={!isSvEditable||isSvViolationSec1}/>}</td>
              <td className={tdR}><NoteArea value={notes['cl_i1']||''} onChange={v=>setNote('cl_i1',v)} disabled={!isClassEditable||isClassViolationSec1}/></td>
              <td className={tdBase}>{isClassViolationSec1?<LockedScore/>:<ScoreSelect options={studyAttitudeOpts} value={classStudyAttitude} onChange={v=>{if(isClassEditable){markClassEdited();setClassStudyAttitude(v);}}} disabled={!isClassEditable||isClassViolationSec1}/>}</td>
            </tr>

            {/* I.2 */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>2</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>
                Ý thức và thái độ tham gia các hoạt động học thuật, hoạt động NCKH, thi Olympic các cấp và các cuộc thi chuyên môn nghiệp vụ từ cấp Khoa trở lên.
                <div className="text-[10px] text-red-500 font-semibold mt-1">Tất cả các hoạt động đính kèm đều cần minh chứng rõ ràng.</div>
              </td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>6.00</td>
              <td className={tdR}>
                <NoteArea value={notes['sv_i2']||''} onChange={v=>setNote('sv_i2',v)} disabled={!isSvEditable||isSvViolationSec1}/>
                
                {/* Upload Buttons for active check-boxes */}
                {svNckh && (
                  <div className="mt-2 border-t pt-1.5 border-gray-100">
                    <span className="text-[10px] font-bold text-gray-600 block">Minh chứng NCKH:</span>
                    <MiniUpload fileKey="sv_nckh" disabled={!isSvEditable} required/>
                  </div>
                )}
                {svOlympic && (
                  <div className="mt-2 border-t pt-1.5 border-gray-100">
                    <span className="text-[10px] font-bold text-gray-600 block">Minh chứng Olympic:</span>
                    <MiniUpload fileKey="sv_olympic" disabled={!isSvEditable} required/>
                  </div>
                )}
                {svCreative && (
                  <div className="mt-2 border-t pt-1.5 border-gray-100">
                    <span className="text-[10px] font-bold text-gray-600 block">Minh chứng Hoạt động học thuật:</span>
                    <MiniUpload fileKey="sv_creative" disabled={!isSvEditable} required/>
                  </div>
                )}
              </td>
              <td className={`${tdR} align-top pt-2`}>{isSvViolationSec1?<LockedScore/>:<div className="space-y-2">
                {[{k:'svNckh',lbl:'a) Tham gia đầy đủ hoạt động NCKH, học thuật (+2đ)',val:svNckh,set:setSvNckh},
                  {k:'svOly',lbl:'b) Có công bố KH hoặc dự thi Olympic (+2đ)',val:svOlympic,set:setSvOlympic},
                  {k:'svCre',lbl:'c) Đạt giải trong các cuộc thi NCKH, Olympic (+2đ)',val:svCreative,set:setSvCreative}].map(item=>(
                  <label key={item.k} className="flex items-start gap-1 cursor-pointer text-[11px] text-gray-700 leading-tight">
                    <input type="checkbox" checked={item.val} onChange={e=>{if(isSvEditable)item.set(e.target.checked);}} disabled={!isSvEditable} className="h-3.5 w-3.5 mt-0.5 rounded accent-blue-600 disabled:cursor-not-allowed disabled:opacity-45"/>
                    <span>{item.lbl}</span>
                  </label>
                ))}
              </div>}</td>
              <td className={tdR}><NoteArea value={notes['cl_i2']||''} onChange={v=>setNote('cl_i2',v)} disabled={!isClassEditable||isClassViolationSec1}/></td>
              <td className={`${tdBase} align-top pt-2`}>{isClassViolationSec1?<LockedScore/>:<div className="space-y-2">
                {[{k:'clNckh',lbl:'a) Tham gia đầy đủ hoạt động NCKH, học thuật (+2đ)',val:classNckh,set:setClassNckh},
                  {k:'clOly',lbl:'b) Có công bố KH hoặc dự thi Olympic (+2đ)',val:classOlympic,set:setClassOlympic},
                  {k:'clCre',lbl:'c) Đạt giải trong các cuộc thi NCKH, Olympic (+2đ)',val:classCreative,set:setClassCreative}].map(item=>(
                  <label key={item.k} className="flex items-start gap-1 cursor-pointer text-[11px] text-gray-700 leading-tight">
                    <input type="checkbox" checked={item.val} onChange={e=>{if(isClassEditable){markClassEdited();item.set(e.target.checked);}}} disabled={!isClassEditable} className="h-3.5 w-3.5 mt-0.5 rounded accent-indigo-600 disabled:cursor-not-allowed disabled:opacity-45"/>
                    <span>{item.lbl}</span>
                  </label>
                ))}
              </div>}</td>
            </tr>

            {/* I.3 */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>3</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Xếp loại học tập học kỳ (căn cứ vào điểm TBCHT)</td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>8.00</td>
              <td className={tdR}><NoteArea value={notes['sv_i3']||''} onChange={v=>setNote('sv_i3',v)} disabled={!isSvEditable||isSvViolationSec1}/></td>
              <td className={tdR}>{isSvViolationSec1?<LockedScore/>:<ScoreSelect options={academicRankOpts} value={svAcademicRank} onChange={v=>{if(isSvEditable)setSvAcademicRank(v);}} disabled={!isSvEditable||isSvViolationSec1}/>}</td>
              <td className={tdR}><NoteArea value={notes['cl_i3']||''} onChange={v=>setNote('cl_i3',v)} disabled={!isClassEditable||isClassViolationSec1}/></td>
              <td className={tdBase}>{isClassViolationSec1?<LockedScore/>:<ScoreSelect options={academicRankOpts} value={classAcademicRank} onChange={v=>{if(isClassEditable){markClassEdited();setClassAcademicRank(v);}}} disabled={!isClassEditable||isClassViolationSec1}/>}</td>
            </tr>

            {/* ═══ MỤC II ═══ */}
            <SectionHeaderRow tt="II" title="Đánh giá ý thức chấp hành nội quy, quy chế nhà trường" maxScore={25}/>
            <ViolationCheckRow label="[SV] Vi phạm nghiêm trọng quy chế thi / kỷ luật (Hủy điểm Mục II)" checked={isSvViolationSec2} onChange={v=>{if(isSvEditable)setIsSvViolationSec2(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận vi phạm nghiêm trọng Mục II" checked={isClassViolationSec2} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec2(v);}}} disabled={!isClassEditable}/>

            {/* II.1 header */}
            <tr className="bg-gray-50/80">
              <td className={`${tdR} text-center font-bold text-gray-700`}>1</td>
              <td colSpan={7} className="px-3 py-1.5 border-b border-gray-200 text-[11px] font-bold text-gray-800 italic">Phần cộng điểm</td>
            </tr>

            {/* II.1 điểm cộng item */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}></td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Chấp hành tốt, không vi phạm</td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>25.00</td>
              <td className={tdR}><NoteArea value={notes['sv_ii1']||''} onChange={v=>setNote('sv_ii1',v)} disabled={!isSvEditable||isSvViolationSec2}/></td>
              <td className={tdR}>{isSvViolationSec2?<LockedScore/>:<input type="number" min={0} max={25} value={svNoViolationScore ?? 0} onChange={e=>{if(isSvEditable)setSvNoViolationScore(Math.min(25,Math.max(0,parseInt(e.target.value)||0)));}} disabled={!isSvEditable} className="w-16 h-7 px-1.5 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100"/>}</td>
              <td className={tdR}><NoteArea value={notes['cl_ii1']||''} onChange={v=>setNote('cl_ii1',v)} disabled={!isClassEditable||isClassViolationSec2}/></td>
              <td className={tdBase}>{isClassViolationSec2?<LockedScore/>:<input type="number" min={0} max={25} value={classNoViolationScore ?? 0} onChange={e=>{if(isClassEditable){markClassEdited();setClassNoViolationScore(Math.min(25,Math.max(0,parseInt(e.target.value)||0)));} }} disabled={!isClassEditable} className="w-16 h-7 px-1.5 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100"/>}</td>
            </tr>

            {/* II.2 header */}
            <tr className="bg-gray-50/80">
              <td className={`${tdR} text-center font-bold text-gray-700`}>2</td>
              <td colSpan={7} className="px-3 py-1.5 border-b border-gray-200 text-[11px] font-bold text-gray-800 italic">Phần trừ điểm: Sinh viên vi phạm một số lỗi trong nội quy, quy chế, quy định (nhập số lần vi phạm):</td>
            </tr>

            {/* Deduction rows */}
            {deductionLabels.map((label,idx)=>(
              <tr key={idx} className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-bold text-gray-500 text-xs select-none`}>-</td>
                <td className={`${tdR} text-gray-600 text-[11px] leading-snug`} colSpan={2}>{label}</td>
                <td className={`${tdR} text-center text-red-600 text-[11px] font-bold`}>−{DEDUCTION_WEIGHTS[idx]}đ/lần</td>
                <td className={tdR}><NoteArea value={notes[`sv_ii2_${idx}`]||''} onChange={v=>setNote(`sv_ii2_${idx}`,v)} disabled={!isSvEditable||isSvViolationSec2}/></td>
                <td className={tdR}>{isSvViolationSec2?<LockedScore/>:<DeductionStepper isSv={true} index={idx} value={svDeductions[idx]} onChange={val=>handleDeductionChange(true,idx,val)} disabled={!isSvEditable||isSvViolationSec2} weight={DEDUCTION_WEIGHTS[idx]} noViolationScore={svNoViolationScore} allDeductions={svDeductions} currentUserRole={currentUserRole} isReadOnly={isReadOnly}/>}</td>
                <td className={tdR}><NoteArea value={notes[`cl_ii2_${idx}`]||''} onChange={v=>setNote(`cl_ii2_${idx}`,v)} disabled={!isClassEditable||isClassViolationSec2}/></td>
                <td className={tdBase}>{isClassViolationSec2?<LockedScore/>:<DeductionStepper isSv={false} index={idx} value={classDeductions[idx]} onChange={val=>{markClassEdited();handleDeductionChange(false,idx,val);}} disabled={!isClassEditable||isClassViolationSec2} weight={DEDUCTION_WEIGHTS[idx]} noViolationScore={classNoViolationScore} allDeductions={classDeductions} currentUserRole={currentUserRole} isReadOnly={isReadOnly}/>}</td>
              </tr>
            ))}

            {/* ═══ MỤC III ═══ */}
            <SectionHeaderRow tt="III" title="Đánh giá về ý thức và kết quả tham gia các hoạt động chính trị, xã hội, văn hóa, văn nghệ, thể thao, phòng chống tệ nạn xã hội" maxScore={20}/>
            <ViolationCheckRow label="[SV] Không tham gia (Hủy điểm Mục III)" checked={isSvViolationSec3} onChange={v=>{if(isSvEditable)setIsSvViolationSec3(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận không tham gia Mục III" checked={isClassViolationSec3} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec3(v);}}} disabled={!isClassEditable}/>

            {sec3Rows.map(row=>(
              <tr key={row.tt} className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-semibold text-gray-500`}>{row.tt}</td>
                <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>{row.label}</td>
                <td className={`${tdR} text-center font-bold text-gray-600`}>{row.max}.00</td>
                <td className={tdR}><NoteArea value={notes[`sv_${row.key}`]||''} onChange={v=>setNote(`sv_${row.key}`,v)} disabled={!isSvEditable||isSvViolationSec3}/></td>
                <td className={tdR}>{isSvViolationSec3?<LockedScore/>:<ScoreSelect options={row.opts} value={row.svVal} onChange={v=>{if(isSvEditable)row.svSet(v);}} disabled={!isSvEditable||isSvViolationSec3}/>}</td>
                <td className={tdR}><NoteArea value={notes[`cl_${row.key}`]||''} onChange={v=>setNote(`cl_${row.key}`,v)} disabled={!isClassEditable||isClassViolationSec3}/></td>
                <td className={tdBase}>{isClassViolationSec3?<LockedScore/>:<ScoreSelect options={row.opts} value={row.clVal} onChange={v=>{if(isClassEditable){markClassEdited();row.clSet(v);}}} disabled={!isClassEditable||isClassViolationSec3}/>}</td>
              </tr>
            ))}

            {/* III.5 khen thưởng */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>5</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Được khen thưởng, biểu dương trong các hoạt động tại mục III</td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>2.00</td>
              <td className={tdR}>
                <NoteArea value={notes['sv_iii5']||''} onChange={v=>setNote('sv_iii5',v)} disabled={!isSvEditable||isSvViolationSec3}/>
                
                {svRewardPoints > 0 && (
                  <div className="mt-2 border-t pt-1.5 border-gray-100">
                    <span className="text-[10px] font-bold text-gray-600 block">Minh chứng Khen thưởng:</span>
                    <MiniUpload fileKey="sv_reward" disabled={!isSvEditable||isSvViolationSec3} required={svRewardPoints>0}/>
                  </div>
                )}
              </td>
              <td className={tdR}>{isSvViolationSec3?<LockedScore/>:<input type="number" min={0} max={2} value={svRewardPoints ?? 0} onChange={e=>{if(isSvEditable)setSvRewardPoints(Math.min(2,Math.max(0,parseFloat(e.target.value)||0)));}} disabled={!isSvEditable} className="w-16 h-7 px-1.5 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100"/>}</td>
              <td className={tdR}><NoteArea value={notes['cl_iii5']||''} onChange={v=>setNote('cl_iii5',v)} disabled={!isClassEditable||isClassViolationSec3}/></td>
              <td className={tdBase}>{isClassViolationSec3?<LockedScore/>:<input type="number" min={0} max={2} value={classRewardPoints ?? 0} onChange={e=>{if(isClassEditable){markClassEdited();setClassRewardPoints(Math.min(2,Math.max(0,parseFloat(e.target.value)||0)));} }} disabled={!isClassEditable} className="w-16 h-7 px-1.5 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100"/>}</td>
            </tr>

            {/* ═══ MỤC IV ═══ */}
            <SectionHeaderRow tt="IV" title="Đánh giá về ý thức công dân trong quan hệ cộng đồng" maxScore={25}/>
            <ViolationCheckRow label="[SV] Vi phạm nghiêm trọng quan hệ cộng đồng (Hủy điểm Mục IV)" checked={isSvViolationSec4} onChange={v=>{if(isSvEditable)setIsSvViolationSec4(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận vi phạm Mục IV" checked={isClassViolationSec4} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec4(v);}}} disabled={!isClassEditable}/>
            {sec4Rows.map(row=>(
              <tr key={row.tt} className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-semibold text-gray-500`}>{row.tt}</td>
                <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>{row.label}</td>
                <td className={`${tdR} text-center font-bold text-gray-600`}>{row.max}.00</td>
                <td className={tdR}>
                  <NoteArea value={notes[`sv_${row.key}`]||''} onChange={v=>setNote(`sv_${row.key}`,v)} disabled={!isSvEditable||isSvViolationSec4}/>
                  {row.key==='iv1'&&svPolicy==='GOOD_WITH_REWARD'&& (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-[10px] font-bold text-gray-600 block">Minh chứng tuyên truyền xuất sắc:</span>
                      <MiniUpload fileKey="sv_policy" disabled={!isSvEditable} required/>
                    </div>
                  )}
                  {row.key==='iv2'&&svSolidarity==='excellent_achievements'&& (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-[10px] font-bold text-gray-600 block">Minh chứng thành tích đặc biệt:</span>
                      <MiniUpload fileKey="sv_solidarity" disabled={!isSvEditable} required/>
                    </div>
                  )}
                </td>
                <td className={tdR}>{isSvViolationSec4?<LockedScore/>:<ScoreSelect options={row.opts} value={row.svVal} onChange={v=>{if(isSvEditable)row.svSet(v);}} disabled={!isSvEditable||isSvViolationSec4}/>}</td>
                <td className={tdR}><NoteArea value={notes[`cl_${row.key}`]||''} onChange={v=>setNote(`cl_${row.key}`,v)} disabled={!isClassEditable||isClassViolationSec4}/></td>
                <td className={tdBase}>{isClassViolationSec4?<LockedScore/>:<ScoreSelect options={row.opts} value={row.clVal} onChange={v=>{if(isClassEditable){markClassEdited();row.clSet(v);}}} disabled={!isClassEditable||isClassViolationSec4}/>}</td>
              </tr>
            ))}

            {/* ═══ MỤC V ═══ */}
            <SectionHeaderRow tt="V" title="Đánh giá về ý thức và kết quả tham gia Ban cán sự lớp, BCH Đoàn, Ban chủ nhiệm các Ban, CLB, Đội, Hội, Nhóm được thành lập theo quy định." maxScore={10}/>
            <ViolationCheckRow label="[SV] Không tham gia đoàn thể (Hủy điểm Mục V)" checked={isSvViolationSec5} onChange={v=>{if(isSvEditable)setIsSvViolationSec5(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận không tham gia Mục V" checked={isClassViolationSec5} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec5(v);}}} disabled={!isClassEditable}/>

            {/* V.0 Bộ chọn Radio nhóm đối tượng */}
            <tr className="bg-indigo-50/60 border-b border-indigo-200">
              <td className={`${tdR} text-center font-bold text-indigo-900`}>V</td>
              <td className={`${tdR} text-gray-900 font-bold`} colSpan={2}>
                Chọn đối tượng đánh giá Mục V:
                <div className="text-xs text-gray-500 font-normal mt-0.5">
                  (Chọn 1 trong 2 nhóm — Hệ thống sẽ hiển thị nội dung đánh giá của phần được chọn)
                </div>
              </td>
              <td className={`${tdR} text-center font-bold text-indigo-800`}>10.00</td>
              <td className={tdR} colSpan={2}>
                <div className="flex flex-col gap-2">
                  {[
                    { v: 'cadre', lbl: '1. Cán bộ (BCS lớp, BCH Đảng, Đoàn, Hội, CLB...)' },
                    { v: 'student', lbl: '2. Tất cả các sinh viên trong lớp (Sinh viên thường)' },
                  ].map(opt => (
                    <label key={opt.v} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-800 cursor-pointer hover:text-blue-700">
                      <input
                        type="radio"
                        name="sv_role_council"
                        value={opt.v}
                        checked={opt.v === 'cadre' ? isSvOfficer : isSvStudent}
                        onChange={() => { if (isSvEditable) setSvRoleType(opt.v as 'cadre' | 'student'); }}
                        disabled={!isSvEditable || isSvViolationSec5}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{opt.lbl}</span>
                    </label>
                  ))}
                </div>
              </td>
              <td className={tdBase} colSpan={2}>
                <div className="flex flex-col gap-2">
                  {[
                    { v: 'cadre', lbl: '1. Cán bộ (BCS lớp, BCH Đảng, Đoàn, Hội, CLB...)' },
                    { v: 'student', lbl: '2. Tất cả các sinh viên trong lớp (Sinh viên thường)' },
                  ].map(opt => (
                    <label key={opt.v} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-800 cursor-pointer hover:text-indigo-700">
                      <input
                        type="radio"
                        name="cl_role_council"
                        value={opt.v}
                        checked={opt.v === 'cadre' ? isClassOfficer : isClassStudent}
                        onChange={() => { if (isClassEditable) { markClassEdited(); setClassRoleType(opt.v as 'cadre' | 'student'); } }}
                        disabled={!isClassEditable || isClassViolationSec5}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{opt.lbl}</span>
                    </label>
                  ))}
                </div>
              </td>
            </tr>

            {/* NHÁNH 1: Cán bộ (chỉ hiển thị khi chọn nhánh Cán bộ) */}
            {(isSvOfficer || isClassOfficer) && <>
              <tr className="bg-purple-50">
                <td className={`${tdR} text-center font-bold text-purple-900`}>1</td>
                <td colSpan={7} className="px-3 py-2 border-b border-purple-200 text-xs sm:text-sm font-bold text-purple-900 leading-snug">
                  🏅 1. BCS lớp, BCH các tổ chức Đảng, Đoàn thanh niên, Hội sinh viên, chi bộ sinh viên, các CLB và các tổ chức khác trong Học viện/Phân viện được thành lập theo quy định. (Thang điểm: 7.00)
                </td>
              </tr>
              {/* 1.a Vị trí */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-bold text-gray-600`}>a)</td>
                <td className={`${tdR} text-gray-800 font-medium leading-snug`} colSpan={2}>
                  <div className="font-bold text-gray-900 mb-1">
                    Ý thức, tinh thần, thái độ, uy tín và hiệu quả công việc của sinh viên được phân công nhiệm vụ quản lý lớp, các tổ chức Đảng, Đoàn thanh niên, Hội sinh viên, các CLB và các tổ chức khác trong Học viện/Phân viện được thành lập theo quy định.
                  </div>
                  <div className="text-xs text-gray-500 italic">Chọn nhóm vị trí chức vụ đảm nhiệm:</div>
                </td>
                <td className={`${tdR} text-center font-bold text-gray-700`}>7.00</td>
                <td className={tdR} colSpan={2}>
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        v: 'LEADER_GROUP',
                        lbl: '- Lớp trưởng, Lớp phó lớp sinh viên; Bí thư, Phó Bí thư chi đoàn; Bí thư và Phó Bí thư liên chi đoàn, Ủy viên BCH liên chi; Ủy viên BCH Đoàn Học viện, Phân viện; Ủy viên BCH Hội sinh viên; Chủ nhiệm, Phó Chủ nhiệm các Ban, CLB Hội, Đội, Bí thư, Phó Bí thư chi bộ sinh viên. (Thang điểm: 7.00)',
                      },
                      {
                        v: 'MEMBER_GROUP',
                        lbl: '- Ủy viên BCH chi đoàn; Chi ủy viên chi bộ Sinh viên, thành viên đội TN xung kích, Tổ trưởng, tổ phó các lớp; Ủy viên các Ban, CLB, Đội. (Thang điểm: 6.00)',
                      },
                    ].map(o => (
                      <label key={o.v} className="flex items-start gap-1.5 text-xs sm:text-sm text-gray-800 cursor-pointer">
                        <input
                          type="radio"
                          name="sv_pos_council"
                          value={o.v}
                          checked={svCadrePosition === o.v || (o.v === 'LEADER_GROUP' && svCadrePosition === 'a1') || (o.v === 'MEMBER_GROUP' && svCadrePosition === 'a2')}
                          onChange={() => { if (isSvEditable && isSvOfficer) setSvCadrePosition(o.v); }}
                          disabled={!isSvEditable || !isSvOfficer || isSvViolationSec5}
                          className="h-3.5 w-3.5 mt-0.5 text-blue-600"
                        />
                        <span className="leading-snug">{o.lbl}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className={tdBase} colSpan={2}>
                  <div className="flex flex-col gap-2">
                    {[
                      {
                        v: 'LEADER_GROUP',
                        lbl: '- Lớp trưởng, Lớp phó lớp sinh viên; Bí thư, Phó Bí thư chi đoàn; Bí thư và Phó Bí thư liên chi đoàn, Ủy viên BCH liên chi; Ủy viên BCH Đoàn Học viện, Phân viện; Ủy viên BCH Hội sinh viên; Chủ nhiệm, Phó Chủ nhiệm các Ban, CLB Hội, Đội, Bí thư, Phó Bí thư chi bộ sinh viên. (Thang điểm: 7.00)',
                      },
                      {
                        v: 'MEMBER_GROUP',
                        lbl: '- Ủy viên BCH chi đoàn; Chi ủy viên chi bộ Sinh viên, thành viên đội TN xung kích, Tổ trưởng, tổ phó các lớp; Ủy viên các Ban, CLB, Đội. (Thang điểm: 6.00)',
                      },
                    ].map(o => (
                      <label key={o.v} className="flex items-start gap-1.5 text-xs sm:text-sm text-gray-800 cursor-pointer">
                        <input
                          type="radio"
                          name="cl_pos_council"
                          value={o.v}
                          checked={classCadrePosition === o.v || (o.v === 'LEADER_GROUP' && classCadrePosition === 'a1') || (o.v === 'MEMBER_GROUP' && classCadrePosition === 'a2')}
                          onChange={() => { if (isClassEditable && isClassOfficer) { markClassEdited(); setClassCadrePosition(o.v); } }}
                          disabled={!isClassEditable || !isClassOfficer || isClassViolationSec5}
                          className="h-3.5 w-3.5 mt-0.5 text-indigo-600"
                        />
                        <span className="leading-snug">{o.lbl}</span>
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              {/* 1.a Mức độ hoàn thành nhiệm vụ */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-bold text-gray-400`}>-</td>
                <td className={`${tdR} text-gray-800 font-medium leading-snug`} colSpan={2}>
                  Mức độ hoàn thành nhiệm vụ được giao
                  <div className="text-xs text-gray-500 mt-0.5">
                    {svCadrePosition === 'LEADER_GROUP' || svCadrePosition === 'a1'
                      ? 'Nhóm 1: Xuất sắc: 7đ | Tốt: 6đ | Hoàn thành: 4đ | Không hoàn thành: 0đ'
                      : 'Nhóm 2: Xuất sắc: 6đ | Tốt: 5đ | Hoàn thành: 3đ | Không hoàn thành: 0đ'}
                  </div>
                  <div className="text-xs text-amber-700 font-medium mt-0.5">
                    (Bắt buộc tải minh chứng nếu đánh giá mức Hoàn thành xuất sắc nhiệm vụ)
                  </div>
                </td>
                <td className={`${tdR} text-center font-bold text-gray-600`}>
                  {svCadrePosition === 'LEADER_GROUP' || svCadrePosition === 'a1' ? '7.00' : '6.00'}
                </td>
                <td className={tdR}>
                  <NoteArea value={notes['sv_va2'] || ''} onChange={v => setNote('sv_va2', v)} disabled={!isSvEditable || !isSvOfficer || isSvViolationSec5} />
                  {(svCadrePerformance === 'EXCELLENT' || svCadrePerformance === 'excellent') && isSvOfficer && (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-[10px] font-bold text-gray-600 block">Minh chứng hoàn thành xuất sắc:</span>
                      <MiniUpload fileKey="sv_cadre_perf" disabled={!isSvEditable} required />
                    </div>
                  )}
                </td>
                <td className={tdR}>
                  {isSvViolationSec5 ? <LockedScore /> : (
                    <ScoreSelect
                      options={svCadrePosition === 'LEADER_GROUP' || svCadrePosition === 'a1' ? a1PerfOpts : a2PerfOpts}
                      value={svCadrePerformance}
                      onChange={v => { if (isSvEditable && isSvOfficer) setSvCadrePerformance(v); }}
                      disabled={!isSvEditable || !isSvOfficer || isSvViolationSec5}
                    />
                  )}
                </td>
                <td className={tdR}><NoteArea value={notes['cl_va2'] || ''} onChange={v => setNote('cl_va2', v)} disabled={!isClassEditable || !isClassOfficer || isClassViolationSec5} /></td>
                <td className={tdBase}>
                  {isClassViolationSec5 ? <LockedScore /> : (
                    <ScoreSelect
                      options={classCadrePosition === 'LEADER_GROUP' || classCadrePosition === 'a1' ? a1PerfOpts : a2PerfOpts}
                      value={classCadrePerformance}
                      onChange={v => { if (isClassEditable && isClassOfficer) { markClassEdited(); setClassCadrePerformance(v); } }}
                      disabled={!isClassEditable || !isClassOfficer || isClassViolationSec5}
                    />
                  )}
                </td>
              </tr>
              {/* 1.b Kỹ năng tổ chức / quản lý */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-bold text-gray-600`}>b)</td>
                <td className={`${tdR} text-gray-800 font-medium leading-snug`} colSpan={2}>
                  Kỹ năng tổ chức, quản lý lớp, quản lý các tổ chức Đảng, Đoàn thanh niên, Hội sinh viên. Trưởng phòng ở KTX, các Ban, CLB, Đội, Hội, nhóm đạt kết quả tốt, không có sinh viên trong lớp bị kỷ luật, không có thành viên trong Hội, Đội, nhóm, CLB vi phạm, sinh viên tham gia tích cực vào các hoạt động chung của lớp, khoa/đơn vị, Phân viện và Học viện.
                </td>
                <td className={`${tdR} text-center font-bold text-gray-600`}>3.00</td>
                <td className={tdR}><NoteArea value={notes['sv_va3'] || ''} onChange={v => setNote('sv_va3', v)} disabled={!isSvEditable || !isSvOfficer || isSvViolationSec5} /></td>
                <td className={tdR}>
                  {isSvViolationSec5 ? <LockedScore /> : (
                    <ScoreSelect
                      options={mgmtOpts}
                      value={svManagementLevel}
                      onChange={v => { if (isSvEditable && isSvOfficer) setSvManagementLevel(v); }}
                      disabled={!isSvEditable || !isSvOfficer || isSvViolationSec5}
                    />
                  )}
                </td>
                <td className={tdR}><NoteArea value={notes['cl_va3'] || ''} onChange={v => setNote('cl_va3', v)} disabled={!isClassEditable || !isClassOfficer || isClassViolationSec5} /></td>
                <td className={tdBase}>
                  {isClassViolationSec5 ? <LockedScore /> : (
                    <ScoreSelect
                      options={mgmtOpts}
                      value={classManagementLevel}
                      onChange={v => { if (isClassEditable && isClassOfficer) { markClassEdited(); setClassManagementLevel(v); } }}
                      disabled={!isClassEditable || !isClassOfficer || isClassViolationSec5}
                    />
                  )}
                </td>
              </tr>
            </>}

            {/* NHÁNH 2: Sinh viên thường (chỉ hiển thị khi chọn nhánh Sinh viên thường) */}
            {(isSvStudent || isClassStudent) && <>
              <tr className="bg-green-50">
                <td className={`${tdR} text-center font-bold text-green-900`}>2</td>
                <td colSpan={7} className="px-3 py-2 border-b border-green-200 text-xs sm:text-sm font-bold text-green-900">
                  📚 2. Tất cả các sinh viên trong lớp: (Thang điểm: Từ 0÷10 điểm)
                </td>
              </tr>
              {/* 2.a Tham gia hoạt động lớp */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-bold text-gray-600`}>a)</td>
                <td className={`${tdR} text-gray-800 font-medium leading-snug`} colSpan={2}>
                  Sinh viên tham gia đầy đủ các hoạt động, sinh hoạt của lớp, khoa, Học viện, có ý kiến tham gia xây dựng tập thể vững mạnh (trừ đối tượng ở tiểu mục 1, 2, 3 mục 5)
                  <div className="text-xs text-gray-500 mt-0.5">Chọn mức điểm: 0 ÷ 3 điểm</div>
                </td>
                <td className={`${tdR} text-center font-bold text-gray-600`}>3.00</td>
                <td className={tdR}><NoteArea value={notes['sv_vb1'] || ''} onChange={v => setNote('sv_vb1', v)} disabled={!isSvEditable || !isSvStudent || isSvViolationSec5} /></td>
                <td className={tdR}>
                  {isSvViolationSec5 ? <LockedScore /> : (
                    <select
                      value={svClassParticipation ?? 0}
                      onChange={e => { if (isSvEditable && isSvStudent) setSvClassParticipation(parseInt(e.target.value, 10) || 0); }}
                      disabled={!isSvEditable || !isSvStudent || isSvViolationSec5}
                      className="w-20 h-8 px-2 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100 cursor-pointer"
                    >
                      <option value={0}>0.00 đ</option>
                      <option value={1}>1.00 đ</option>
                      <option value={2}>2.00 đ</option>
                      <option value={3}>3.00 đ</option>
                    </select>
                  )}
                </td>
                <td className={tdR}><NoteArea value={notes['cl_vb1'] || ''} onChange={v => setNote('cl_vb1', v)} disabled={!isClassEditable || isClassViolationSec5} /></td>
                <td className={tdBase}>
                  {isClassViolationSec5 ? <LockedScore /> : (
                    <select
                      value={classClassParticipation ?? 0}
                      onChange={e => { if (isClassEditable && isClassStudent) { markClassEdited(); setClassClassParticipation(parseInt(e.target.value, 10) || 0); } }}
                      disabled={!isClassEditable || !isClassStudent || isClassViolationSec5}
                      className="w-20 h-8 px-2 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100 cursor-pointer"
                    >
                      <option value={0}>0.00 đ</option>
                      <option value={1}>1.00 đ</option>
                      <option value={2}>2.00 đ</option>
                      <option value={3}>3.00 đ</option>
                    </select>
                  )}
                </td>
              </tr>
              {/* 2.b Thành tích đặc biệt */}
              <tr className="hover:bg-gray-50 border-b border-gray-300">
                <td className={`${tdR} text-center font-bold text-gray-600`}>b)</td>
                <td className={`${tdR} text-gray-800 font-medium leading-snug`} colSpan={2}>
                  Sinh viên đạt được các thành tích đặc biệt trong học tập, rèn luyện, dũng cảm cứu người được cấp giấy chứng nhận hoặc có giấy khen
                  <div className="text-xs text-amber-700 font-medium mt-0.5">(Bắt buộc tải minh chứng nếu được khen thưởng)</div>
                </td>
                <td className={`${tdR} text-center font-bold text-gray-600`}>7.00</td>
                <td className={tdR}>
                  <NoteArea value={notes['sv_vb2'] || ''} onChange={v => setNote('sv_vb2', v)} disabled={!isSvEditable || !isSvStudent || isSvViolationSec5} />
                  {(svSpecialAchievement === 'SCHOOL_LEVEL_OR_HIGHER' || svSpecialAchievement === 'FACULTY_LEVEL') && isSvStudent && (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-[10px] font-bold text-gray-600 block">Minh chứng khen thưởng:</span>
                      <MiniUpload fileKey="sv_special_ach" disabled={!isSvEditable} required />
                    </div>
                  )}
                </td>
                <td className={tdR}>
                  {isSvViolationSec5 ? <LockedScore /> : (
                    <ScoreSelect
                      options={SPECIAL_ACHIEVEMENT_LEVEL_OPTIONS}
                      value={svSpecialAchievement}
                      onChange={v => { if (isSvEditable && isSvStudent) setSvSpecialAchievement(v); }}
                      disabled={!isSvEditable || !isSvStudent || isSvViolationSec5}
                    />
                  )}
                </td>
                <td className={tdR}><NoteArea value={notes['cl_vb2'] || ''} onChange={v => setNote('cl_vb2', v)} disabled={!isClassEditable || !isClassStudent || isClassViolationSec5} /></td>
                <td className={tdBase}>
                  {isClassViolationSec5 ? <LockedScore /> : (
                    <ScoreSelect
                      options={SPECIAL_ACHIEVEMENT_LEVEL_OPTIONS}
                      value={classSpecialAchievement}
                      onChange={v => { if (isClassEditable && isClassStudent) { markClassEdited(); setClassSpecialAchievement(v); } }}
                      disabled={!isClassEditable || !isClassStudent || isClassViolationSec5}
                    />
                  )}
                </td>
              </tr>
            </>}

            {/* ═══ TỔNG CỘNG ═══ */}
            <tr className="bg-indigo-50/70 text-indigo-950 font-black border-t border-indigo-200">
              <td className="px-3 py-3 border-r border-indigo-100 text-sm" colSpan={3}>Tổng cộng (Điểm chấm)</td>
              <td className="px-2 py-3 text-center border-r border-indigo-100 font-black">100</td>
              <td className="px-2 py-3 text-center border-r border-indigo-100 text-blue-700 text-sm font-black" colSpan={2}>{f(displaySvTotal)} / 100</td>
              <td className="px-2 py-3 text-center text-[#D93A3C] text-sm font-black" colSpan={2}>{f(displayClassTotal)} / 100</td>
            </tr>
            <tr className="bg-gray-50 text-gray-600 border-t border-gray-200 font-bold">
              <td className="px-3 py-2.5 text-xs border-r border-gray-200" colSpan={3}>Tổng cộng (Điểm thực nhận tối đa)</td>
              <td className="px-2 py-2.5 text-center border-r border-gray-200">100</td>
              <td className="px-2 py-2.5 text-center text-blue-600 border-r border-gray-200" colSpan={2}>100</td>
              <td className="px-2 py-2.5 text-center text-[#D93A3C]" colSpan={2}>100</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouncilCriteriaReviewTable;
