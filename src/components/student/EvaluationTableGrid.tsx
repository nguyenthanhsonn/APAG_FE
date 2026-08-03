'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Upload, X, ChevronDown, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import type { GridDeductionStepperProps as DeductionStepperProps } from '@/types/student';
import { useEvaluationFormStore, computeEvaluationScores } from '@/store/evaluationFormStore';
import {
  ACADEMIC_RANK_OPTIONS,
  CLUB_ACTIVITY_LEVEL_OPTIONS,
  COMMUNITY_RELATIONSHIP_LEVEL_OPTIONS,
  CULTURE_SPORT_LEVEL_OPTIONS,
  LAW_COMPLIANCE_LEVEL_OPTIONS,
  MANAGEMENT_SKILL_LEVEL_OPTIONS,
  POLITICAL_ACTIVITY_LEVEL_OPTIONS,
  POSITION_GROUP_OPTIONS,
  REGULAR_SCORE_LEVEL_OPTIONS,
  SOCIAL_PREVENTION_LEVEL_OPTIONS,
  SPECIAL_ACHIEVEMENT_LEVEL_OPTIONS,
  TASK_COMPLETION_LEVEL_A1_OPTIONS,
  TASK_COMPLETION_LEVEL_A2_OPTIONS,
  VOLUNTEER_ACTIVITY_LEVEL_OPTIONS,
} from '@/constants/evaluationEnums';

const DEDUCTION_WEIGHTS = [10, 3, 5, 5, 5, 5, 5, 10, 20];
const DeductionStepper = ({ isSv, index, value, onChange, disabled, weight, noViolationScore, allDeductions, currentUserRole, isReadOnly }: DeductionStepperProps) => {
  const sumOther = allDeductions.reduce((s, c, i) => i === index ? s : s + (Number(c) || 0) * DEDUCTION_WEIGHTS[i], 0);
  const baseScore = Number(noViolationScore) || 0;
  const remainingScore = Math.max(0, baseScore - sumOther);
  const maxTimes = weight > 0 ? Math.ceil(remainingScore / weight) : 0;
  const disabledPlus = disabled || value >= maxTimes;
  const disabledMinus = disabled || value <= 0;
  const [localVal, setLocalVal] = useState(String(value));
  useEffect(() => { setLocalVal(String(value)); }, [value]);
  const commit = () => {
    const n = parseInt(localVal, 10);
    const clamped = Math.min(maxTimes, Math.max(0, isNaN(n) ? 0 : n));
    setLocalVal(String(clamped)); onChange(clamped);
  };
  const isRoleLocked = disabled && !isReadOnly && ((currentUserRole === 'student' && !isSv) || (currentUserRole === 'class' && isSv));
  if (isRoleLocked) return (
    <div className="relative group inline-flex items-center justify-center bg-gray-100 border border-gray-200 rounded-md w-16 h-8">
      <span className="text-sm font-bold text-gray-400">{value}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[11px] px-2 py-1.5 rounded-md shadow-lg w-44 text-center z-30 leading-snug">
        {currentUserRole === 'student' ? 'Cột Lớp/BCS đánh giá.' : 'Cột SV tự đánh giá.'}
      </div>
    </div>
  );
  return (
    <div className="flex items-center">
      <button type="button" onClick={() => onChange(value-1)} disabled={disabledMinus} className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l text-gray-500 hover:bg-gray-100 disabled:opacity-40"><Minus size={11}/></button>
      <input type="text" inputMode="numeric" value={localVal} onChange={e => /^\d*$/.test(e.target.value) && setLocalVal(e.target.value)} onBlur={commit} onKeyDown={e => e.key==='Enter' && commit()} disabled={disabled} className="w-11 h-8 text-center text-sm border-y border-gray-300 bg-white font-bold disabled:bg-gray-100 outline-none"/>
      <div className="relative group">
        <button type="button" onClick={() => onChange(value+1)} disabled={disabledPlus} className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r text-gray-500 hover:bg-gray-100 disabled:opacity-40"><Plus size={11}/></button>
        {disabledPlus && !disabled && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex bg-red-600 text-white text-[11px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-30 items-center gap-1">Đã đạt số lần tối đa</div>}
      </div>
    </div>
  );
};

const ScoreSelect = ({ options, value, onChange, disabled }: { options: {label:string;value:string}[]; value:string; onChange:(v:string)=>void; disabled:boolean }) => (
  <div className="relative inline-flex items-center w-full min-w-[72px]">
    <select
      value={value}
      onChange={e=>onChange(e.target.value)}
      disabled={disabled}
      className="w-full h-9 pl-2 pr-6 text-sm border border-gray-300 rounded bg-white text-gray-800 font-semibold outline-none appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
    >
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <div className="absolute right-1.5 pointer-events-none text-gray-400">
      <ChevronDown size={14} />
    </div>
  </div>
);

const NoteArea = ({ value, onChange, disabled }: { value:string; onChange:(v:string)=>void; disabled:boolean }) => (
  <textarea value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} rows={2} placeholder={disabled ? '' : 'Nhận xét / minh chứng...'} className="w-full text-xs border border-gray-300 rounded px-1.5 py-1 resize-none outline-none focus:ring-1 focus:ring-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed leading-snug"/>
);



const MiniUpload = ({ fileKey, disabled }: { fileKey:string; disabled:boolean; required?:boolean }) => {
  const uploadedFiles = useEvaluationFormStore(s => s.uploadedFiles);
  const fileUploadProgress = useEvaluationFormStore(s => s.fileProgress);
  const handleFileUpload = useEvaluationFormStore(s => s.handleFileUploadAction);
  const removeFile = useEvaluationFormStore(s => s.removeFileAction);

  const files = uploadedFiles[fileKey] || [];
  const keyProgress = fileUploadProgress?.[fileKey] || {};

  // Các file đang uploading (chưa có trong uploadedFiles nhưng có trong progress và chưa 'done'/'error')
  const pendingEntries = Object.entries(keyProgress).filter(
    ([name, pct]) => pct !== 'done' && pct !== 'error' && !files.some(f => f.name === name)
  );
  const errorEntries = Object.entries(keyProgress).filter(([, pct]) => pct === 'error');

  return (
    <div className="mt-1.5 space-y-1">
      {/* Các file đã upload thành công */}
      {files.map((f,i)=> {
        const hasUrl = Boolean(f.url);
        return (
        <div key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-1 font-semibold">
          <CheckCircle size={11} className="shrink-0 text-green-500" />
          <button
            type="button"
            onClick={() => {
              if (hasUrl) window.open(f.url, '_blank', 'noopener,noreferrer');
            }}
            disabled={!hasUrl}
            className="truncate max-w-[120px] text-left underline decoration-dotted underline-offset-2 hover:text-green-900 disabled:cursor-not-allowed disabled:no-underline disabled:text-green-700"
            title={hasUrl ? 'Click để xem minh chứng' : 'Minh chứng chưa có đường dẫn xem trực tiếp'}
          >
            {f.name}
          </button>
          {!disabled&&<button type="button" onClick={()=>removeFile(fileKey,i)} className="text-red-500 hover:text-red-700 ml-auto"><X size={12}/></button>}
        </div>
      );})}
      {/* Các file đang tải lên — hiển thị progress bar ngay tại chỗ */}
      {pendingEntries.map(([name, pct]) => (
        <div key={name} className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1">
          <div className="flex items-center gap-1.5 mb-1">
            <Loader2 size={11} className="shrink-0 text-blue-500 animate-spin" />
            <span className="truncate max-w-[130px] text-blue-700 font-semibold">{name}</span>
            <span className="ml-auto text-blue-600 font-bold">{pct as number}%</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 bg-blue-500 rounded-full transition-all duration-200"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      ))}
      {/* Các file bị lỗi upload */}
      {errorEntries.map(([name]) => (
        <div key={name} className="flex items-center gap-1.5 text-xs bg-red-50 border border-red-200 rounded px-2 py-1 text-red-700 font-semibold">
          <AlertCircle size={11} className="shrink-0 text-red-500" />
          <span className="truncate max-w-[120px]" title={name}>{name}</span>
          <span className="ml-auto text-red-500 text-[10px] font-normal">Lỗi — thử lại</span>
        </div>
      ))}
      {/* Nút upload */}
      {!disabled && (
        <label className="inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer px-2.5 py-1.5 rounded-lg border transition-all duration-150 border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100">
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
    <td className="px-2 py-3 text-sm font-black text-gray-900 align-middle border-r border-gray-300 text-center whitespace-nowrap">{tt}</td>
    <td className="px-3 py-3 text-sm font-black text-gray-950 uppercase tracking-wider align-middle border-r border-gray-300" colSpan={2}>{title}</td>
    <td className="px-2 py-3 text-sm font-black text-gray-900 align-middle border-r border-gray-300 text-center whitespace-nowrap">{maxScore.toFixed(2)}</td>
    <td className="px-2 py-3 align-middle border-r border-gray-300" colSpan={2}></td>
    <td className="px-2 py-3 align-middle" colSpan={2}></td>
  </tr>
);



const LockedScore = () => <span className="text-[10px] text-red-500 italic font-semibold">(Hủy điểm)</span>;

export const EvaluationTableGrid = () => {
  // ── Read all state from store via fine-grained selectors ──────────────────
  const currentUserRole = useEvaluationFormStore(s => s.currentUserRole);
  const isReadOnly = useEvaluationFormStore(s => s.isReadOnly);
  const fieldErrors = useEvaluationFormStore(s => s.fieldErrors);
  const svScores = {
    sec1: useEvaluationFormStore(s => computeEvaluationScores(s, true).sec1),
    sec2: useEvaluationFormStore(s => computeEvaluationScores(s, true).sec2),
    sec3: useEvaluationFormStore(s => computeEvaluationScores(s, true).sec3),
    sec4: useEvaluationFormStore(s => computeEvaluationScores(s, true).sec4),
    sec5: useEvaluationFormStore(s => computeEvaluationScores(s, true).sec5),
    total: useEvaluationFormStore(s => computeEvaluationScores(s, true).total),
  };
  const classScores = {
    sec1: useEvaluationFormStore(s => computeEvaluationScores(s, false).sec1),
    sec2: useEvaluationFormStore(s => computeEvaluationScores(s, false).sec2),
    sec3: useEvaluationFormStore(s => computeEvaluationScores(s, false).sec3),
    sec4: useEvaluationFormStore(s => computeEvaluationScores(s, false).sec4),
    sec5: useEvaluationFormStore(s => computeEvaluationScores(s, false).sec5),
    total: useEvaluationFormStore(s => computeEvaluationScores(s, false).total),
  };

  // Sec 1
  const svStudyAttitude = useEvaluationFormStore(s => s.svStudyAttitude);
  const svNckh = useEvaluationFormStore(s => s.svNckh);
  const svOlympic = useEvaluationFormStore(s => s.svOlympic);
  const svCreative = useEvaluationFormStore(s => s.svCreative);
  const svAcademicRank = useEvaluationFormStore(s => s.svAcademicRank);
  const classStudyAttitude = useEvaluationFormStore(s => s.classStudyAttitude);
  const classNckh = useEvaluationFormStore(s => s.classNckh);
  const classOlympic = useEvaluationFormStore(s => s.classOlympic);
  const classCreative = useEvaluationFormStore(s => s.classCreative);
  const classAcademicRank = useEvaluationFormStore(s => s.classAcademicRank);
  const isSvViolationSec1 = useEvaluationFormStore(s => s.isSvViolationSec1);
  const isClassViolationSec1 = useEvaluationFormStore(s => s.isClassViolationSec1);

  // Sec 2
  const svNoViolationScore = useEvaluationFormStore(s => s.svNoViolationScore);
  const svDeductions = useEvaluationFormStore(s => s.svDeductions);
  const classNoViolationScore = useEvaluationFormStore(s => s.classNoViolationScore);
  const classDeductions = useEvaluationFormStore(s => s.classDeductions);
  const deductionLabels = useEvaluationFormStore(s => s.deductionLabels);
  const isSvViolationSec2 = useEvaluationFormStore(s => s.isSvViolationSec2);
  const isClassViolationSec2 = useEvaluationFormStore(s => s.isClassViolationSec2);

  // Sec 3
  const svActivity1 = useEvaluationFormStore(s => s.svActivity1);
  const svActivity2 = useEvaluationFormStore(s => s.svActivity2);
  const svActivity3 = useEvaluationFormStore(s => s.svActivity3);
  const svActivity4 = useEvaluationFormStore(s => s.svActivity4);
  const svRewardPoints = useEvaluationFormStore(s => s.svRewardPoints);
  const classActivity1 = useEvaluationFormStore(s => s.classActivity1);
  const classActivity2 = useEvaluationFormStore(s => s.classActivity2);
  const classActivity3 = useEvaluationFormStore(s => s.classActivity3);
  const classActivity4 = useEvaluationFormStore(s => s.classActivity4);
  const classRewardPoints = useEvaluationFormStore(s => s.classRewardPoints);
  const isSvViolationSec3 = useEvaluationFormStore(s => s.isSvViolationSec3);
  const isClassViolationSec3 = useEvaluationFormStore(s => s.isClassViolationSec3);

  // Sec 4
  const svPolicy = useEvaluationFormStore(s => s.svPolicy);
  const svSolidarity = useEvaluationFormStore(s => s.svSolidarity);
  const svLocality = useEvaluationFormStore(s => s.svLocality);
  const classPolicy = useEvaluationFormStore(s => s.classPolicy);
  const classSolidarity = useEvaluationFormStore(s => s.classSolidarity);
  const classLocality = useEvaluationFormStore(s => s.classLocality);
  const isSvViolationSec4 = useEvaluationFormStore(s => s.isSvViolationSec4);
  const isClassViolationSec4 = useEvaluationFormStore(s => s.isClassViolationSec4);

  // Sec 5
  const svCadrePosition = useEvaluationFormStore(s => s.svCadrePosition);
  const svCadrePerformance = useEvaluationFormStore(s => s.svCadrePerformance);
  const svManagementLevel = useEvaluationFormStore(s => s.svManagementLevel);
  const svClassParticipation = useEvaluationFormStore(s => s.svClassParticipation);
  const svSpecialAchievement = useEvaluationFormStore(s => s.svSpecialAchievement);
  const classCadrePosition = useEvaluationFormStore(s => s.classCadrePosition);
  const classCadrePerformance = useEvaluationFormStore(s => s.classCadrePerformance);
  const classManagementLevel = useEvaluationFormStore(s => s.classManagementLevel);
  const classClassParticipation = useEvaluationFormStore(s => s.classClassParticipation);
  const classSpecialAchievement = useEvaluationFormStore(s => s.classSpecialAchievement);
  const isSvViolationSec5 = useEvaluationFormStore(s => s.isSvViolationSec5);
  const isClassViolationSec5 = useEvaluationFormStore(s => s.isClassViolationSec5);



  // Actions
  const setField = useEvaluationFormStore(s => s.setField);
  const handleDeductionChange = useEvaluationFormStore(s => s.handleDeductionChange);
  const setIsClassEdited = useEvaluationFormStore(s => s.setIsClassEdited);

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

  const setSvCadrePosition = (v: string) => setField('svCadrePosition', v);
  const setSvCadrePerformance = (v: string) => setField('svCadrePerformance', v);
  const setSvManagementLevel = (v: string) => setField('svManagementLevel', v);
  const setSvClassParticipation = (v: number) => setField('svClassParticipation', v);
  const setSvSpecialAchievement = (v: string) => setField('svSpecialAchievement', v);
  const setClassCadrePosition = (v: string) => setField('classCadrePosition', v);
  const setClassCadrePerformance = (v: string) => setField('classCadrePerformance', v);
  const setClassManagementLevel = (v: string) => setField('classManagementLevel', v);
  const setClassClassParticipation = (v: number) => setField('classClassParticipation', v);
  const setClassSpecialAchievement = (v: string) => setField('classSpecialAchievement', v);
  const setIsSvViolationSec5 = (v: boolean) => setField('isSvViolationSec5', v);
  const setIsClassViolationSec5 = (v: boolean) => setField('isClassViolationSec5', v);

  const [notes, setNotes] = useState<Record<string,string>>({});
  const setNote = (key: string, v: string) => setNotes(prev => ({...prev,[key]:v}));

  const isSvEditable = currentUserRole === 'student' && !isReadOnly;
  const isClassEditable = currentUserRole === 'class' && !isReadOnly;
  const markClassEdited = () => { if (currentUserRole === 'class') setIsClassEdited(true); };
  const f = (s: number) => s.toFixed(2);
  const tdBase = 'px-2 py-3 align-top border-b border-gray-200 text-sm';
  const tdR = `${tdBase} border-r border-gray-200`;
  const FieldError = ({ name }: { name: string }) => (
    fieldErrors[name] ? <p className="mt-1 text-[10px] font-semibold leading-snug text-red-600">{fieldErrors[name]}</p> : null
  );

  const ViolationCheckRow = ({ label, checked, onChange, disabled }: { label:string; checked:boolean; onChange:(v:boolean)=>void; disabled:boolean }) => {
    if (currentUserRole === 'student') return null;
    return (
      <tr className="bg-red-50">
        <td colSpan={8} className="px-3 py-1.5 border-b border-red-200">
          <label className="flex items-center gap-2 text-[11px] font-bold text-red-700 cursor-pointer select-none">
            <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)} disabled={disabled} className="h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500"/>
            {label}
          </label>
        </td>
      </tr>
    );
  };

  // Updated to match the approved table design.
  const studyAttitudeOpts = REGULAR_SCORE_LEVEL_OPTIONS;

  // Updated to match the approved table design.
  const academicRankOpts = ACADEMIC_RANK_OPTIONS;

  const act1Opts = POLITICAL_ACTIVITY_LEVEL_OPTIONS;
  const act2Opts = CULTURE_SPORT_LEVEL_OPTIONS;
  const act3Opts = CLUB_ACTIVITY_LEVEL_OPTIONS;
  const act4Opts = SOCIAL_PREVENTION_LEVEL_OPTIONS;
  const policyOpts = LAW_COMPLIANCE_LEVEL_OPTIONS;
  const solidarityOpts = VOLUNTEER_ACTIVITY_LEVEL_OPTIONS;
  const localityOpts = COMMUNITY_RELATIONSHIP_LEVEL_OPTIONS;
  const a1PerfOpts = TASK_COMPLETION_LEVEL_A1_OPTIONS;
  const a2PerfOpts = TASK_COMPLETION_LEVEL_A2_OPTIONS;
  const mgmtOpts = MANAGEMENT_SKILL_LEVEL_OPTIONS;
  const achieveOpts = SPECIAL_ACHIEVEMENT_LEVEL_OPTIONS;

  const sec3Rows = [
    {tt:'1',max:5,key:'iii1',label:'Ý thức tham gia công tác chính trị, xã hội, tình nguyện',desc:'5đ/3đ/2đ/0đ',opts:act1Opts,svVal:svActivity1,svSet:setSvActivity1,clVal:classActivity1,clSet:setClassActivity1},
    {tt:'2',max:5,key:'iii2',label:'Ý thức tham gia văn hóa, văn nghệ, thể dục thể thao',desc:'5đ/3đ/2đ/1đ/0đ',opts:act2Opts,svVal:svActivity2,svSet:setSvActivity2,clVal:classActivity2,clSet:setClassActivity2},
    {tt:'3',max:5,key:'iii3',label:'Ý thức tham gia các câu lạc bộ, Đội, Nhóm được tổ chức theo quy định (ngoài học thuật, NCKH)',desc:'5đ/3đ/2đ/1đ/0đ',opts:act3Opts,svVal:svActivity3,svSet:setSvActivity3,clVal:classActivity3,clSet:setClassActivity3},
    {tt:'4',max:3,key:'iii4',label:'Ý thức phòng chống tệ nạn xã hội',desc:'3đ/2đ/1đ/0đ',opts:act4Opts,svVal:svActivity4,svSet:setSvActivity4,clVal:classActivity4,clSet:setClassActivity4},
  ];
  const sec4Rows = [
    {tt:'1',max:10,key:'iv1',label:'Ý thức chấp hành chính sách, pháp luật Nhà nước và quy định địa phương, KTX nơi cư trú',desc:'10đ/8đ/5đ/0đ',opts:policyOpts,svVal:svPolicy,svSet:setSvPolicy,clVal:classPolicy,clSet:setClassPolicy},
    {tt:'2',max:10,key:'iv2',label:'Tham gia các hoạt động nhân đạo, từ thiện vì cộng đồng, phong trào thanh niên tình nguyện, phong trào giúp đỡ nhân dân và bạn bè khi gặp thiên tai, khó khăn, hoạn nạn',desc:'10đ/8đ/5đ/0đ',opts:solidarityOpts,svVal:svSolidarity,svSet:setSvSolidarity,clVal:classSolidarity,clSet:setClassSolidarity},
    {tt:'3',max:5,key:'iv3',label:'Ý thức xây dựng mối quan hệ đoàn kết với bạn bè và tập thể; xây dựng, bảo vệ cảnh quan giảng đường, nơi cư trú văn minh, sạch đẹp, văn hóa học đường',desc:'5đ/1đ/0đ',opts:localityOpts,svVal:svLocality,svSet:setSvLocality,clVal:classLocality,clSet:setClassLocality},
  ];
  const sec3FieldByKey: Record<string, string> = {
    iii1: 'svActivity1',
    iii2: 'svActivity2',
    iii3: 'svActivity3',
    iii4: 'svActivity4',
  };
  const sec4FieldByKey: Record<string, string> = {
    iv1: 'svPolicy',
    iv2: 'svSolidarity',
    iv3: 'svLocality',
  };



  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isReadOnly ? (
        <div className="text-center py-2.5 text-red-600 font-semibold border-b border-gray-200 bg-white text-sm">
          Giảng viên đã đánh giá, Sinh viên không được phép Đánh giá lại.
        </div>
      ) : (
        <div className="text-center py-2.5 text-amber-700 font-semibold border-b border-gray-200 bg-amber-50/50 text-sm">
          Giảng viên chưa lưu Điểm. Hãy nhấn nút <strong>Gửi đánh giá</strong> để lưu Điểm.
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
            <SectionHeaderRow tt="I" title="Ý thức tham gia học tập (căn cứ vào số tín chỉ trong 01 học kỳ ≥ số tín chỉ tối thiểu theo quy định của Học viện) " maxScore={20}/>
            <ViolationCheckRow label="[SV] Vi phạm thi cử nghiêm trọng (Hủy điểm Mục I)" checked={isSvViolationSec1} onChange={v=>{if(isSvEditable)setIsSvViolationSec1(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận vi phạm nghiêm trọng Mục I" checked={isClassViolationSec1} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec1(v);}}} disabled={!isClassEditable}/>

            {/* I.1 */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>1</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Ý thức và thái độ học tập, thực hành, thực tập, thực tế (ý thức chuyên cần)<div className="text-xs text-gray-400 mt-0.5">Tối đa 6đ — 6đ/5đ/4đ/2đ/1đ/0đ</div></td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>6.00</td>
              <td className={tdR}><NoteArea value={notes['sv_i1']||''} onChange={v=>setNote('sv_i1',v)} disabled={!isSvEditable||isSvViolationSec1}/></td>
              <td className={tdR}>{isSvViolationSec1?<LockedScore/>:<><ScoreSelect options={studyAttitudeOpts} value={svStudyAttitude} onChange={v=>{if(isSvEditable)setSvStudyAttitude(v);}} disabled={!isSvEditable||isSvViolationSec1}/><FieldError name="svStudyAttitude"/></>}</td>
              <td className={tdR}><NoteArea value={notes['cl_i1']||''} onChange={v=>setNote('cl_i1',v)} disabled={!isClassEditable||isClassViolationSec1}/></td>
              <td className={tdBase}>{isClassViolationSec1?<LockedScore/>:<ScoreSelect options={studyAttitudeOpts} value={classStudyAttitude} onChange={v=>{if(isClassEditable){markClassEdited();setClassStudyAttitude(v);}}} disabled={!isClassEditable||isClassViolationSec1}/>}</td>
            </tr>

            {/* I.2 */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>2</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>
                Ý thức và thái độ tham gia các hoạt động học thuật, hoạt động NCKH, thi Olympic các cấp và các cuộc thi chuyên môn nghiệp vụ từ cấp Khoa trở lên.
                <div className="text-xs text-red-500 font-semibold mt-1">Tất cả các hoạt động đính kèm đều cần minh chứng rõ ràng.</div>
              </td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>6.00</td>
              <td className={tdR}>
                <NoteArea value={notes['sv_i2']||''} onChange={v=>setNote('sv_i2',v)} disabled={!isSvEditable||isSvViolationSec1}/>
                
                {/* Upload Buttons for active check-boxes */}
                {svNckh && (
                  <div className="mt-2 border-t pt-1.5 border-gray-100">
                    <span className="text-xs font-bold text-gray-600 block">Minh chứng NCKH:</span>
                    <MiniUpload fileKey="sv_nckh" disabled={!isSvEditable} required/>
                  </div>
                )}
                {svOlympic && (
                  <div className="mt-2 border-t pt-1.5 border-gray-100">
                    <span className="text-xs font-bold text-gray-600 block">Minh chứng Olympic:</span>
                    <MiniUpload fileKey="sv_olympic" disabled={!isSvEditable} required/>
                  </div>
                )}
                {svCreative && (
                  <div className="mt-2 border-t pt-1.5 border-gray-100">
                    <span className="text-xs font-bold text-gray-600 block">Minh chứng Hoạt động học thuật:</span>
                    <MiniUpload fileKey="sv_creative" disabled={!isSvEditable} required/>
                  </div>
                )}
              </td>
              <td className={`${tdR} align-top pt-2`}>{isSvViolationSec1?<LockedScore/>:<div className="space-y-2">
                {[{k:'svNckh',lbl:'a) Tham gia đầy đủ hoạt động NCKH, học thuật (+2đ)',val:svNckh,set:setSvNckh},
                  {k:'svOly',lbl:'b) Có công bố KH hoặc dự thi Olympic (+2đ)',val:svOlympic,set:setSvOlympic},
                  {k:'svCre',lbl:'c) Đạt giải trong các cuộc thi NCKH, Olympic (+2đ)',val:svCreative,set:setSvCreative}].map(item=>(
                  <label key={item.k} className="flex items-start gap-1 cursor-pointer text-xs text-gray-700 leading-tight">
                    <input type="checkbox" checked={item.val} onChange={e=>{if(isSvEditable)item.set(e.target.checked);}} disabled={!isSvEditable} className="h-3.5 w-3.5 mt-0.5 rounded text-blue-600"/>
                    <span>{item.lbl}</span>
                  </label>
                ))}
                <FieldError name="svCreative"/>
              </div>}</td>
              <td className={tdR}><NoteArea value={notes['cl_i2']||''} onChange={v=>setNote('cl_i2',v)} disabled={!isClassEditable||isClassViolationSec1}/></td>
              <td className={`${tdBase} align-top pt-2`}>{isClassViolationSec1?<LockedScore/>:<div className="space-y-2">
                {[{k:'clNckh',lbl:'a) Tham gia đầy đủ hoạt động NCKH, học thuật (+2đ)',val:classNckh,set:setClassNckh},
                  {k:'clOly',lbl:'b) Có công bố KH hoặc dự thi Olympic (+2đ)',val:classOlympic,set:setClassOlympic},
                  {k:'clCre',lbl:'c) Đạt giải trong các cuộc thi NCKH, Olympic (+2đ)',val:classCreative,set:setClassCreative}].map(item=>(
                  <label key={item.k} className="flex items-start gap-1 cursor-pointer text-xs text-gray-700 leading-tight">
                    <input type="checkbox" checked={item.val} onChange={e=>{if(isClassEditable){markClassEdited();item.set(e.target.checked);}}} disabled={!isClassEditable} className="h-3.5 w-3.5 mt-0.5 rounded text-indigo-600"/>
                    <span>{item.lbl}</span>
                  </label>
                ))}
              </div>}</td>
            </tr>

            {/* I.3 */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>3</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Xếp loại học tập học kỳ (căn cứ vào điểm TBCHT)<div className="text-xs text-gray-400 mt-0.5">Tối đa 8đ — 8đ/7đ/6đ/4đ/2đ/1đ/0đ</div></td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>8.00</td>
              <td className={tdR}><NoteArea value={notes['sv_i3']||''} onChange={v=>setNote('sv_i3',v)} disabled={!isSvEditable||isSvViolationSec1}/></td>
              <td className={tdR}>{isSvViolationSec1?<LockedScore/>:<><ScoreSelect options={academicRankOpts} value={svAcademicRank} onChange={v=>{if(isSvEditable)setSvAcademicRank(v);}} disabled={!isSvEditable||isSvViolationSec1}/><FieldError name="svAcademicRank"/></>}</td>
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
              <td colSpan={7} className="px-3 py-2 border-b border-gray-200 text-sm font-bold text-gray-800 italic">Phần cộng điểm</td>
            </tr>

            {/* II.1 điểm cộng item */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}></td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Chấp hành tốt, không vi phạm<div className="text-xs text-gray-400 mt-0.5">(Điểm cộng tự nhập, tối đa 25đ)</div></td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>25.00</td>
              <td className={tdR}><NoteArea value={notes['sv_ii1']||''} onChange={v=>setNote('sv_ii1',v)} disabled={!isSvEditable||isSvViolationSec2}/></td>
              <td className={tdR}>{isSvViolationSec2?<LockedScore/>:<><input type="number" min={0} max={25} value={svNoViolationScore ?? 0} onChange={e=>{if(isSvEditable)setSvNoViolationScore(Math.min(25,Math.max(0,parseInt(e.target.value)||0)));}} disabled={!isSvEditable} className="w-16 h-8 px-1.5 text-center text-sm border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100"/><FieldError name="svNoViolationScore"/></>}</td>
              <td className={tdR}><NoteArea value={notes['cl_ii1']||''} onChange={v=>setNote('cl_ii1',v)} disabled={!isClassEditable||isClassViolationSec2}/></td>
              <td className={tdBase}>{isClassViolationSec2?<LockedScore/>:<input type="number" min={0} max={25} value={classNoViolationScore ?? 0} onChange={e=>{if(isClassEditable){markClassEdited();setClassNoViolationScore(Math.min(25,Math.max(0,parseInt(e.target.value)||0)));} }} disabled={!isClassEditable} className="w-16 h-8 px-1.5 text-center text-sm border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100"/>}</td>
            </tr>

            {/* II.2 header */}
            <tr className="bg-gray-50/80">
              <td className={`${tdR} text-center font-bold text-gray-700`}>2</td>
              <td colSpan={7} className="px-3 py-2 border-b border-gray-200 text-sm font-bold text-gray-800 italic">Phần trừ điểm: Sinh viên vi phạm một số lỗi trong nội quy, quy chế, quy định (nhập số lần vi phạm):</td>
            </tr>

            {/* Deduction rows */}
            {deductionLabels.map((label,idx)=>(
              <tr key={idx} className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-bold text-gray-500 text-sm select-none`}>-</td>
                <td className={`${tdR} text-gray-600 text-sm leading-snug`} colSpan={2}>{label}</td>
                <td className={`${tdR} text-center text-red-600 text-sm font-bold`}>−{DEDUCTION_WEIGHTS[idx]}đ/lần</td>
                <td className={tdR}><NoteArea value={notes[`sv_ii2_${idx}`]||''} onChange={v=>setNote(`sv_ii2_${idx}`,v)} disabled={!isSvEditable||isSvViolationSec2}/></td>
                <td className={tdR}>{isSvViolationSec2?<LockedScore/>:<><DeductionStepper isSv={true} index={idx} value={svDeductions[idx]} onChange={val=>handleDeductionChange(true,idx,val)} disabled={!isSvEditable||isSvViolationSec2} weight={DEDUCTION_WEIGHTS[idx]} noViolationScore={svNoViolationScore} allDeductions={svDeductions} currentUserRole={currentUserRole} isReadOnly={isReadOnly}/>{idx === 0 && <FieldError name="svDeductions"/>}</>}</td>
                <td className={tdR}><NoteArea value={notes[`cl_ii2_${idx}`]||''} onChange={v=>setNote(`cl_ii2_${idx}`,v)} disabled={!isClassEditable||isClassViolationSec2}/></td>
                <td className={tdBase}>{isClassViolationSec2?<LockedScore/>:<DeductionStepper isSv={false} index={idx} value={classDeductions[idx]} onChange={val=>{markClassEdited();handleDeductionChange(false,idx,val);}} disabled={!isClassEditable||isClassViolationSec2} weight={DEDUCTION_WEIGHTS[idx]} noViolationScore={classNoViolationScore} allDeductions={classDeductions} currentUserRole={currentUserRole} isReadOnly={isReadOnly}/>}</td>
              </tr>
            ))}

            {/* ═══ MỤC III ═══ */}
            <SectionHeaderRow tt="III" title="Hoạt động CT-XH, VH-VN-TT, phòng chống tệ nạn xã hội" maxScore={20}/>
            <ViolationCheckRow label="[SV] Không tham gia (Hủy điểm Mục III)" checked={isSvViolationSec3} onChange={v=>{if(isSvEditable)setIsSvViolationSec3(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận không tham gia Mục III" checked={isClassViolationSec3} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec3(v);}}} disabled={!isClassEditable}/>

            {sec3Rows.map(row=>(
              <tr key={row.tt} className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-semibold text-gray-500`}>{row.tt}</td>
                <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>{row.label}<div className="text-[10px] text-gray-400 mt-0.5">Tối đa {row.max}đ — {row.desc}</div></td>
                <td className={`${tdR} text-center font-bold text-gray-600`}>{row.max}.00</td>
                <td className={tdR}><NoteArea value={notes[`sv_${row.key}`]||''} onChange={v=>setNote(`sv_${row.key}`,v)} disabled={!isSvEditable||isSvViolationSec3}/></td>
                <td className={tdR}>{isSvViolationSec3?<LockedScore/>:<><ScoreSelect options={row.opts} value={row.svVal} onChange={v=>{if(isSvEditable)row.svSet(v);}} disabled={!isSvEditable||isSvViolationSec3}/><FieldError name={sec3FieldByKey[row.key]}/></>}</td>
                <td className={tdR}><NoteArea value={notes[`cl_${row.key}`]||''} onChange={v=>setNote(`cl_${row.key}`,v)} disabled={!isClassEditable||isSvViolationSec3}/></td>
                <td className={tdBase}>{isClassViolationSec3?<LockedScore/>:<ScoreSelect options={row.opts} value={row.clVal} onChange={v=>{if(isClassEditable){markClassEdited();row.clSet(v);}}} disabled={!isClassEditable||isClassViolationSec3}/>}</td>
              </tr>
            ))}

            {/* III.5 khen thưởng */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>5</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Thành tích khen thưởng cấp trường trở lên (bắt buộc đính kèm minh chứng)<div className="text-xs text-gray-400 mt-0.5">Điểm thưởng bổ sung, tối đa 2đ</div></td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>2.00</td>
              <td className={tdR}>
                <NoteArea value={notes['sv_iii5']||''} onChange={v=>setNote('sv_iii5',v)} disabled={!isSvEditable||isSvViolationSec3}/>
                
                {/* Upload button for reward points when active */}
                {svRewardPoints > 0 && (
                  <div className="mt-2 border-t pt-1.5 border-gray-100">
                    <span className="text-xs font-bold text-gray-600 block">Minh chứng Khen thưởng:</span>
                    <MiniUpload fileKey="sv_reward" disabled={!isSvEditable||isSvViolationSec3} required={svRewardPoints>0}/>
                  </div>
                )}
              </td>
              <td className={tdR}>{isSvViolationSec3?<LockedScore/>:<><input type="number" min={0} max={2} value={svRewardPoints ?? 0} onChange={e=>{if(isSvEditable)setSvRewardPoints(Math.min(2,Math.max(0,parseFloat(e.target.value)||0)));}} disabled={!isSvEditable} className="w-16 h-8 px-1.5 text-center text-sm border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100"/><FieldError name="svRewardPoints"/></>}</td>
              <td className={tdR}><NoteArea value={notes['cl_iii5']||''} onChange={v=>setNote('cl_iii5',v)} disabled={!isClassEditable||isClassViolationSec3}/></td>
              <td className={tdBase}>{isClassViolationSec3?<LockedScore/>:<input type="number" min={0} max={2} value={classRewardPoints ?? 0} onChange={e=>{if(isClassEditable){markClassEdited();setClassRewardPoints(Math.min(2,Math.max(0,parseFloat(e.target.value)||0)));} }} disabled={!isClassEditable} className="w-16 h-8 px-1.5 text-center text-sm border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100"/>}</td>
            </tr>

            {/* ═══ MỤC IV ═══ */}
            <SectionHeaderRow tt="IV" title="Ý thức công dân trong quan hệ cộng đồng" maxScore={25}/>
            <ViolationCheckRow label="[SV] Vi phạm nghiêm trọng quan hệ cộng đồng (Hủy điểm Mục IV)" checked={isSvViolationSec4} onChange={v=>{if(isSvEditable)setIsSvViolationSec4(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận vi phạm Mục IV" checked={isClassViolationSec4} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec4(v);}}} disabled={!isClassEditable}/>

            {sec4Rows.map(row=>(
              <tr key={row.tt} className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-semibold text-gray-500`}>{row.tt}</td>
                <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>{row.label}<div className="text-xs text-gray-400 mt-0.5">Tối đa {row.max}đ — {row.desc}</div></td>
                <td className={`${tdR} text-center font-bold text-gray-600`}>{row.max}.00</td>
                <td className={tdR}>
                  <NoteArea value={notes[`sv_${row.key}`]||''} onChange={v=>setNote(`sv_${row.key}`,v)} disabled={!isSvEditable||isSvViolationSec4}/>
                  {row.key==='iv1'&&svPolicy==='GOOD_WITH_REWARD'&& (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-xs font-bold text-gray-600 block">Minh chứng tuyên truyền xuất sắc:</span>
                      <MiniUpload fileKey="sv_policy" disabled={!isSvEditable} required/>
                    </div>
                  )}
                  {row.key==='iv2'&&svSolidarity==='ACTIVE_WITH_REWARD'&& (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-xs font-bold text-gray-600 block">Minh chứng thành tích đặc biệt:</span>
                      <MiniUpload fileKey="sv_solidarity" disabled={!isSvEditable} required/>
                    </div>
                  )}
                </td>
                <td className={tdR}>{isSvViolationSec4?<LockedScore/>:<><ScoreSelect options={row.opts} value={row.svVal} onChange={v=>{if(isSvEditable)row.svSet(v);}} disabled={!isSvEditable||isSvViolationSec4}/><FieldError name={sec4FieldByKey[row.key]}/></>}</td>
                <td className={tdR}><NoteArea value={notes[`cl_${row.key}`]||''} onChange={v=>setNote(`cl_${row.key}`,v)} disabled={!isClassEditable||isClassViolationSec4}/></td>
                <td className={tdBase}>{isClassViolationSec4?<LockedScore/>:<ScoreSelect options={row.opts} value={row.clVal} onChange={v=>{if(isClassEditable){markClassEdited();row.clSet(v);}}} disabled={!isClassEditable||isClassViolationSec4}/>}</td>
              </tr>
            ))}

            {/* ═══ MỤC V ═══ */}
            <SectionHeaderRow tt="V" title="Kết quả tham gia BCS lớp, BCH Đoàn, CLB... (tối đa 10đ)" maxScore={10}/>
            <ViolationCheckRow label="[SV] Không tham gia đoàn thể (Hủy điểm Mục V)" checked={isSvViolationSec5} onChange={v=>{if(isSvEditable)setIsSvViolationSec5(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận không tham gia Mục V" checked={isClassViolationSec5} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec5(v);}}} disabled={!isClassEditable}/>

            <>
              <tr className="bg-purple-50"><td colSpan={8} className="px-3 py-1.5 border-b border-purple-200 text-sm font-bold text-purple-700">Mục 1: BCS lớp / BCH Đoàn – Hội / CLB / tổ chức được thành lập theo quy định</td></tr>
              {/* V.A.1 vị trí */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-xs`}>1</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Nhóm vị trí<div className="text-xs text-gray-400">A1: Lớp trưởng/Bí thư &nbsp;|&nbsp; A2: Phó lớp, Chi hội trưởng...</div></td>
                <td className={tdR}></td>
                <td className={tdR} colSpan={2}>
                  <div className="flex gap-3">
                    {POSITION_GROUP_OPTIONS.map(o=>(
                      <label key={o.value} className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="sv_pos"
                          value={o.value}
                          checked={svCadrePosition===o.value}
                          onChange={()=>{
                            if(isSvEditable) {
                              setSvCadrePosition(o.value);
                              if (o.value === 'NONE') {
                                setSvCadrePerformance('POOR');
                                setSvManagementLevel('');
                              }
                            }
                          }}
                          disabled={!isSvEditable}
                          className="h-3.5 w-3.5 text-blue-600"
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                  <FieldError name="svCadrePosition"/>
                </td>
                <td className={tdBase} colSpan={2}>
                  <div className="flex gap-3">
                    {POSITION_GROUP_OPTIONS.map(o=>(
                      <label key={o.value} className="flex items-center gap-1 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="cl_pos"
                          value={o.value}
                          checked={classCadrePosition===o.value}
                          onChange={()=>{
                            if(isClassEditable) {
                              markClassEdited();
                              setClassCadrePosition(o.value);
                              if (o.value === 'NONE') {
                                setClassCadrePerformance('POOR');
                                setClassManagementLevel('');
                              }
                            }
                          }}
                          disabled={!isClassEditable}
                          className="h-3.5 w-3.5 text-indigo-600"
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </td>
              </tr>
              {/* V.A.2 mức độ hoàn thành */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-xs`}>2</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Mức độ hoàn thành nhiệm vụ được giao<div className="text-xs text-gray-400">A1: 7/6/4/0đ &nbsp;|&nbsp; A2: 6/5/3/0đ &nbsp;(minh chứng nếu Xuất sắc)</div></td>
                <td className={tdR}></td>
                <td className={tdR}>
                  <NoteArea value={notes['sv_va2']||''} onChange={v=>setNote('sv_va2',v)} disabled={!isSvEditable||isSvViolationSec5||svCadrePosition==='NONE'}/>
                  {svCadrePerformance==='EXCELLENT'&& svCadrePosition!=='NONE'&& (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-xs font-bold text-gray-600 block">Minh chứng hoàn thành xuất sắc:</span>
                      <MiniUpload fileKey="sv_cadre_perf" disabled={!isSvEditable} required/>
                    </div>
                  )}
                </td>
                <td className={tdR}>{isSvViolationSec5?<LockedScore/>:<><ScoreSelect options={svCadrePosition==='LEADER_GROUP'?a1PerfOpts:a2PerfOpts} value={svCadrePerformance} onChange={v=>{if(isSvEditable)setSvCadrePerformance(v);}} disabled={!isSvEditable||isSvViolationSec5||svCadrePosition==='NONE'}/><FieldError name="svCadrePerformance"/></>}</td>
                <td className={tdR}><NoteArea value={notes['cl_va2']||''} onChange={v=>setNote('cl_va2',v)} disabled={!isClassEditable||isClassViolationSec5||classCadrePosition==='NONE'}/></td>
                <td className={tdBase}>{isClassViolationSec5?<LockedScore/>:<ScoreSelect options={classCadrePosition==='LEADER_GROUP'?a1PerfOpts:a2PerfOpts} value={classCadrePerformance} onChange={v=>{if(isClassEditable){markClassEdited();setClassCadrePerformance(v);}}} disabled={!isClassEditable||isClassViolationSec5||classCadrePosition==='NONE'}/>}</td>
              </tr>
              {/* V.A.3 quản lý đoàn hội */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-xs`}>3</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Tham gia cán bộ Đoàn–Hội cấp Trường/Khoa<div className="text-xs text-gray-400">Trưởng ban 3đ / Phó ban 2đ / Thành viên 1đ / Không 0đ</div></td>
                <td className={tdR}></td>
                <td className={tdR}><NoteArea value={notes['sv_va3']||''} onChange={v=>setNote('sv_va3',v)} disabled={!isSvEditable||isSvViolationSec5||svCadrePosition==='NONE'}/></td>
                <td className={tdR}>{isSvViolationSec5?<LockedScore/>:<><ScoreSelect options={mgmtOpts} value={svManagementLevel} onChange={v=>{if(isSvEditable)setSvManagementLevel(v);}} disabled={!isSvEditable||isSvViolationSec5||svCadrePosition==='NONE'}/><FieldError name="svManagementLevel"/></>}</td>
                <td className={tdR}><NoteArea value={notes['cl_va3']||''} onChange={v=>setNote('cl_va3',v)} disabled={!isClassEditable||isClassViolationSec5||classCadrePosition==='NONE'}/></td>
                <td className={tdBase}>{isClassViolationSec5?<LockedScore/>:<ScoreSelect options={mgmtOpts} value={classManagementLevel} onChange={v=>{if(isClassEditable){markClassEdited();setClassManagementLevel(v);}}} disabled={!isClassEditable||isClassViolationSec5||classCadrePosition==='NONE'}/>}</td>
              </tr>
            </>

            <>
              <tr className="bg-green-50"><td colSpan={8} className="px-3 py-1.5 border-b border-green-200 text-sm font-bold text-green-700">Mục 2: Tất cả sinh viên trong lớp</td></tr>
              {/* V.B.1 điểm tham gia */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-xs`}>1</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Điểm tham gia hoạt động lớp / Đoàn / Hội (BCS bình xét)<div className="text-xs text-gray-400">Nhập điểm 0–3đ</div></td>
                <td className={tdR}></td>
                <td className={tdR}><NoteArea value={notes['sv_vb1']||''} onChange={v=>setNote('sv_vb1',v)} disabled={!isSvEditable||isSvViolationSec5}/></td>
                <td className={tdR}>{isSvViolationSec5?<LockedScore/>:<><input type="number" min={0} max={3} value={svClassParticipation ?? 0} onChange={e=>{if(isSvEditable)setSvClassParticipation(Math.min(3,Math.max(0,parseInt(e.target.value)||0)));}} disabled={!isSvEditable} className="w-16 h-8 px-1.5 text-center text-sm border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100"/><FieldError name="svClassParticipation"/></>}</td>
                <td className={tdR}><NoteArea value={notes['cl_vb1']||''} onChange={v=>setNote('cl_vb1',v)} disabled={!isClassEditable||isClassViolationSec5}/></td>
                <td className={tdBase}>{isClassViolationSec5?<LockedScore/>:<input type="number" min={0} max={3} value={classClassParticipation ?? 0} onChange={e=>{if(isClassEditable){markClassEdited();setClassClassParticipation(Math.min(3,Math.max(0,parseInt(e.target.value)||0)));} }} disabled={!isClassEditable} className="w-16 h-8 px-1.5 text-center text-sm border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100"/>}</td>
              </tr>
              {/* V.B.2 thành tích đặc biệt */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-xs`}>2</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Thành tích cá nhân đặc biệt được khen thưởng theo cấp quy định<div className="text-xs text-gray-400">Học viện trở lên: 7đ / Khoa trở lên: 5đ / Không: 0đ &nbsp;(bắt buộc minh chứng)</div></td>
                <td className={tdR}></td>
                <td className={tdR}>
                  <NoteArea value={notes['sv_vb2']||''} onChange={v=>setNote('sv_vb2',v)} disabled={!isSvEditable||isSvViolationSec5}/>
                  {(svSpecialAchievement==='NATIONAL_OR_INTL'||svSpecialAchievement==='PROVINCIAL_LEVEL')&& (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-xs font-bold text-gray-600 block">Minh chứng khen thưởng cấp Khoa/Học viện:</span>
                      <MiniUpload fileKey="sv_special_ach" disabled={!isSvEditable} required/>
                    </div>
                  )}
                </td>
                <td className={tdR}>{isSvViolationSec5?<LockedScore/>:<><ScoreSelect options={achieveOpts} value={svSpecialAchievement} onChange={v=>{if(isSvEditable)setSvSpecialAchievement(v);}} disabled={!isSvEditable||isSvViolationSec5}/><FieldError name="svSpecialAchievement"/></>}</td>
                <td className={tdR}><NoteArea value={notes['cl_vb2']||''} onChange={v=>setNote('cl_vb2',v)} disabled={!isClassEditable||isClassViolationSec5}/></td>
                <td className={tdBase}>{isClassViolationSec5?<LockedScore/>:<ScoreSelect options={achieveOpts} value={classSpecialAchievement} onChange={v=>{if(isClassEditable){markClassEdited();setClassSpecialAchievement(v);}}} disabled={!isClassEditable||isClassViolationSec5}/>}</td>
              </tr>
            </>

            {/* ═══ TỔNG CỘNG ═══ */}
            <tr className="bg-indigo-50/70 text-indigo-950 font-black border-t border-indigo-200">
              <td className="px-3 py-3 border-r border-indigo-100 text-sm" colSpan={3}>Tổng cộng (Điểm chấm)</td>
              <td className="px-2 py-3 text-center border-r border-indigo-100 font-black">100</td>
              <td className="px-2 py-3 text-center border-r border-indigo-100 text-blue-700 text-sm font-black" colSpan={2}>{f(svScores.total)} / 100</td>
              <td className="px-2 py-3 text-center text-[#D93A3C] text-sm font-black" colSpan={2}>{f(classScores.total)} / 100</td>
            </tr>
            <tr className="bg-gray-50 text-gray-600 border-t border-gray-200 font-bold">
              <td className="px-3 py-2.5 text-sm border-r border-gray-200" colSpan={3}>Tổng cộng (Điểm thực nhận tối đa)</td>
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

export default EvaluationTableGrid;
