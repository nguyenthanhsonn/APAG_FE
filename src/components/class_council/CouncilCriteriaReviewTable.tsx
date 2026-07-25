'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Lock, AlertCircle, Upload, X, ChevronDown } from 'lucide-react';
import type { CouncilDeductionStepperProps as DeductionStepperProps } from '@/types/admin';
import { useCouncilReviewStore, computeCouncilScores } from '@/store/councilReviewStore';

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
    <div className="relative group inline-flex items-center gap-1 bg-gray-100 border border-gray-200 rounded-md px-2 py-1">
      <Lock size={10} className="text-gray-400" /><span className="text-xs font-semibold text-gray-500">{value}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2 py-1.5 rounded-md shadow-lg w-44 text-center z-30 leading-snug">
        {currentUserRole === 'student' ? 'Cột Lớp/BCS đánh giá.' : 'Cột SV tự đánh giá.'}
      </div>
    </div>
  );
  return (
    <div className="flex items-center">
      <button type="button" onClick={() => onChange(value-1)} disabled={disabledMinus} className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-l text-gray-500 hover:bg-gray-100 disabled:opacity-40"><Minus size={10}/></button>
      <input type="text" inputMode="numeric" value={localVal} onChange={e => /^\d*$/.test(e.target.value) && setLocalVal(e.target.value)} onBlur={commit} onKeyDown={e => e.key==='Enter' && commit()} disabled={disabled} className="w-10 h-7 text-center text-xs border-y border-gray-300 bg-white font-bold disabled:bg-gray-100 outline-none"/>
      <div className="relative group">
        <button type="button" onClick={() => onChange(value+1)} disabled={disabledPlus} className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded-r text-gray-500 hover:bg-gray-100 disabled:opacity-40"><Plus size={10}/></button>
        {disabledPlus && !disabled && <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex bg-red-600 text-white text-[10px] px-2 py-1 rounded-md shadow-lg whitespace-nowrap z-30 items-center gap-1"><AlertCircle size={9}/>Đã đạt số lần tối đa</div>}
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
      className="w-full h-8 pl-2 pr-6 text-xs border border-gray-300 rounded bg-white text-gray-800 font-semibold outline-none appearance-none cursor-pointer disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
    >
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    <div className="absolute right-1.5 pointer-events-none text-gray-400">
      <ChevronDown size={14} />
    </div>
  </div>
);

const NoteArea = ({ value, onChange, disabled }: { value:string; onChange:(v:string)=>void; disabled:boolean }) => (
  <textarea value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} rows={2} placeholder={disabled ? '' : 'Nhận xét / minh chứng...'} className="w-full text-[11px] border border-gray-300 rounded px-1.5 py-1 resize-none outline-none focus:ring-1 focus:ring-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed leading-snug"/>
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
  const svScores = useCouncilReviewStore(s => computeCouncilScores(s, true));
  const classScores = useCouncilReviewStore(s => computeCouncilScores(s, false));

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
  const setSvCadrePosition = (v: 'a1' | 'a2') => setField('svCadrePosition', v);
  const setSvCadrePerformance = (v: string) => setField('svCadrePerformance', v);
  const setSvManagementLevel = (v: string) => setField('svManagementLevel', v);
  const setSvClassParticipation = (v: number) => setField('svClassParticipation', v);
  const setSvSpecialAchievement = (v: string) => setField('svSpecialAchievement', v);
  const setClassRoleType = (v: 'cadre' | 'student') => setField('classRoleType', v);
  const setClassCadrePosition = (v: 'a1' | 'a2') => setField('classCadrePosition', v);
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
  const tdBase = 'px-2 py-3 align-top border-b border-gray-200 text-xs';
  const tdR = `${tdBase} border-r border-gray-200`;

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
  const studyAttitudeOpts = [
    {value:'very_good',label:'6.00 đ - Điểm TB học kỳ >= 9'},
    {value:'good',label:'5.00 đ - Điểm TB học kỳ từ 7 đến cận 9'},
    {value:'fair',label:'4.00 đ - Điểm TB học kỳ từ 5 đến cận 7'},
    {value:'average',label:'2.00 đ - Điểm TB học kỳ từ 4 đến cận 5'},
    {value:'poor',label:'1.00 đ - Điểm TB học kỳ từ 01 đến cận 04'},
    {value:'none',label:'0.00 đ - Khác / Không đạt'},
  ];

  // Updated to match the approved table design.
  const academicRankOpts = [
    {value:'excellent',label:'8.00 đ - Loại xuất sắc'},
    {value:'good',label:'7.00 đ - Loại Giỏi'},
    {value:'fair',label:'6.00 đ - Loại Khá'},
    {value:'average',label:'4.00 đ - Loại Trung bình'},
    {value:'weak_no_warn',label:'2.00 đ - Loại Yếu nhưng chưa bị cảnh báo'},
    {value:'weak_warn',label:'1.00 đ - Loại Yếu nhưng bị cảnh báo lần 1'},
    {value:'none',label:'0.00 đ - Khác / Không đạt'},
  ];

  const act1Opts = [{value:'GOOD_PARTICIPATION',label:'5đ - Tham gia tốt, đầy đủ'},{value:'ABSENT_ONCE',label:'3đ - Vắng 1 lần'},{value:'ABSENT_TWICE',label:'2đ - Vắng 2 lần'},{value:'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',label:'0đ - Vắng trên 2 lần hoặc không tham gia'}];
  const act2Opts = [{value:'many',label:'5đ - Nhiều, hiệu quả'},{value:'some',label:'3đ - Một phần'},{value:'active',label:'2đ - Tích cực tuyên truyền'},{value:'full',label:'1đ - Ít'},{value:'none',label:'0đ - Không'}];
  const act3Opts = [{value:'prize_or_org',label:'5đ - Đạt giải/Tổ chức'},{value:'active',label:'3đ - Tích cực'},{value:'some',label:'2đ - Một phần'},{value:'full',label:'1đ - Ít'},{value:'none',label:'0đ - Không'}];
  const act4Opts = [{value:'active',label:'3đ - Tốt, báo cáo đúng'},{value:'full',label:'2đ - 1 hoạt động'},{value:'some',label:'1đ - Có ý thức'},{value:'none',label:'0đ - Vi phạm/CB'}];
  const policyOpts = [{value:'GOOD_WITH_REWARD',label:'10đ - Chấp hành tốt, có khen thưởng'},{value:'GOOD',label:'8đ - Chấp hành tốt'},{value:'AVERAGE',label:'5đ - Chấp hành trung bình'},{value:'VIOLATED',label:'0đ - Vi phạm'}];
  const solidarityOpts = [{value:'excellent_achievements',label:'10đ - Thành tích đặc biệt'},{value:'regular',label:'8đ - Tốt'},{value:'some',label:'5đ - Có hỗ trợ'},{value:'none',label:'0đ - Không tham gia'}];
  const localityOpts = [{value:'GOOD',label:'5đ - Khai báo/cư trú đúng quy định'},{value:'ONE_WARNING',label:'1đ - Bị nhắc nhở/kiểm điểm 1 lần'},{value:'TWO_WARNINGS',label:'0đ - Bị nhắc nhở/kiểm điểm từ 2 lần'}];
  const a1PerfOpts = [{value:'excellent',label:'7đ - Xuất sắc'},{value:'good',label:'6đ - Tốt'},{value:'average',label:'4đ - Đạt'},{value:'unsatisfactory',label:'0đ - Không đạt'}];
  const a2PerfOpts = [{value:'excellent',label:'6đ - Xuất sắc'},{value:'good',label:'5đ - Tốt'},{value:'average',label:'3đ - Đạt'},{value:'unsatisfactory',label:'0đ - Không đạt'}];
  const mgmtOpts = [{value:'head',label:'3đ - Trưởng ban'},{value:'deputy',label:'2đ - Phó ban'},{value:'member',label:'1đ - Thành viên'},{value:'none',label:'0đ - Không'}];
  const achieveOpts = [{value:'national_intl',label:'7đ - QG/Quốc tế'},{value:'provincial',label:'5đ - Tỉnh/TP'},{value:'none',label:'0đ - Không có'}];

  const sec3Rows = [
    {tt:'1',max:5,key:'iii1',label:'Ý thức tham gia công tác chính trị, xã hội, tình nguyện',desc:'5đ/3đ/2đ/0đ',opts:act1Opts,svVal:svActivity1,svSet:setSvActivity1,clVal:classActivity1,clSet:setClassActivity1},
    {tt:'2',max:5,key:'iii2',label:'Ý thức tham gia văn hóa, văn nghệ, thể dục thể thao',desc:'5đ/3đ/2đ/1đ/0đ',opts:act2Opts,svVal:svActivity2,svSet:setSvActivity2,clVal:classActivity2,clSet:setClassActivity2},
    {tt:'3',max:5,key:'iii3',label:'Ý thức tham gia CLB học thuật, Đoàn – Hội',desc:'5đ/3đ/2đ/1đ/0đ',opts:act3Opts,svVal:svActivity3,svSet:setSvActivity3,clVal:classActivity3,clSet:setClassActivity3},
    {tt:'4',max:3,key:'iii4',label:'Ý thức phòng chống tệ nạn xã hội',desc:'3đ/2đ/1đ/0đ',opts:act4Opts,svVal:svActivity4,svSet:setSvActivity4,clVal:classActivity4,clSet:setClassActivity4},
  ];
  const sec4Rows = [
    {tt:'1',max:10,key:'iv1',label:'Ý thức chấp hành chính sách, pháp luật Nhà nước và quy định địa phương, KTX nơi cư trú',desc:'10đ/8đ/5đ/0đ',opts:policyOpts,svVal:svPolicy,svSet:setSvPolicy,clVal:classPolicy,clSet:setClassPolicy},
    {tt:'2',max:10,key:'iv2',label:'Đoàn kết, giúp đỡ bạn bè và những người xung quanh',desc:'10đ/8đ/5đ/0đ',opts:solidarityOpts,svVal:svSolidarity,svSet:setSvSolidarity,clVal:classSolidarity,clSet:setClassSolidarity},
    {tt:'3',max:5,key:'iv3',label:'Khai báo đúng hạn và cư trú đúng quy định',desc:'5đ/1đ/0đ',opts:localityOpts,svVal:svLocality,svSet:setSvLocality,clVal:classLocality,clSet:setClassLocality},
  ];



  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {isReadOnly ? (
        <div className="text-center py-2.5 text-red-600 font-semibold border-b border-gray-200 bg-white text-xs">
          Giảng viên đã đánh giá, Sinh viên không được phép Đánh giá lại.
        </div>
      ) : (
        <div className="text-center py-2.5 text-amber-700 font-semibold border-b border-gray-200 bg-amber-50/50 text-xs">
          Cố vấn lớp đang chấm chi tiết từng tiêu chí. Cột Cá nhân chỉ xem, cột Lớp/GVCN có thể chỉnh.
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300 text-gray-700 text-center font-bold">
              <th rowSpan={2} className="px-2 py-3 border-r border-gray-300 w-10 align-middle">TT</th>
              <th rowSpan={2} className="px-3 py-3 border-r border-gray-300 text-left align-middle" colSpan={2}>TIÊU CHÍ</th>
              <th rowSpan={2} className="px-2 py-3 border-r border-gray-300 w-24 align-middle">ĐIỂM TỐI ĐA</th>
              <th colSpan={2} className="px-2 py-2 border-r border-gray-300">CÁ NHÂN ĐÁNH GIÁ</th>
              <th colSpan={2} className="px-2 py-2 border-gray-300">GVCV/GVCN ĐÁNH GIÁ</th>
            </tr>
            <tr className="bg-gray-50 border-b border-gray-300 text-[10px] font-bold text-gray-600 text-center uppercase">
              <th className="px-2 py-1.5 border-r border-gray-300 w-36">NHẬN XÉT</th>
              <th className="px-2 py-1.5 border-r border-gray-300 w-28">ĐIỂM</th>
              <th className="px-2 py-1.5 border-r border-gray-300 w-36">NHẬN XÉT</th>
              <th className="px-2 py-1.5 w-28">ĐIỂM</th>
            </tr>
          </thead>
          <tbody>
            {/* ═══ MỤC I ═══ */}
            <SectionHeaderRow tt="I" title="Đánh giá ý thức tham gia học tập và thi cử" maxScore={20}/>
            <ViolationCheckRow label="[SV] Vi phạm thi cử nghiêm trọng (Hủy điểm Mục I)" checked={isSvViolationSec1} onChange={v=>{if(isSvEditable)setIsSvViolationSec1(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận vi phạm nghiêm trọng Mục I" checked={isClassViolationSec1} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec1(v);}}} disabled={!isClassEditable}/>

            {/* I.1 */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>1</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Ý thức và thái độ học tập, thực hành, thực tập, thực tế (ý thức chuyên cần)<div className="text-[10px] text-gray-400 mt-0.5">Tối đa 6đ — 6đ/5đ/4đ/2đ/1đ/0đ</div></td>
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
                    <input type="checkbox" checked={item.val} onChange={e=>{if(isSvEditable)item.set(e.target.checked);}} disabled={!isSvEditable} className="h-3.5 w-3.5 mt-0.5 rounded text-blue-600"/>
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
                    <input type="checkbox" checked={item.val} onChange={e=>{if(isClassEditable){markClassEdited();item.set(e.target.checked);}}} disabled={!isClassEditable} className="h-3.5 w-3.5 mt-0.5 rounded text-indigo-600"/>
                    <span>{item.lbl}</span>
                  </label>
                ))}
              </div>}</td>
            </tr>

            {/* I.3 */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>3</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Xếp loại học tập học kỳ (căn cứ vào điểm TBCHT)<div className="text-[10px] text-gray-400 mt-0.5">Tối đa 8đ — 8đ/7đ/6đ/4đ/2đ/1đ/0đ</div></td>
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

            {/* II.1 điểm cộng */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>1</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Chấp hành tốt nội quy, không vi phạm (Điểm cộng tự nhập, tối đa 25đ)</td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>25.00</td>
              <td className={tdR}><NoteArea value={notes['sv_ii1']||''} onChange={v=>setNote('sv_ii1',v)} disabled={!isSvEditable||isSvViolationSec2}/></td>
              <td className={tdR}>{isSvViolationSec2?<LockedScore/>:<input type="number" min={0} max={25} value={svNoViolationScore ?? 0} onChange={e=>{if(isSvEditable)setSvNoViolationScore(Math.min(25,Math.max(0,parseInt(e.target.value)||0)));}} disabled={!isSvEditable} className="w-16 h-7 px-1.5 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100"/>}</td>
              <td className={tdR}><NoteArea value={notes['cl_ii1']||''} onChange={v=>setNote('cl_ii1',v)} disabled={!isClassEditable||isClassViolationSec2}/></td>
              <td className={tdBase}>{isClassViolationSec2?<LockedScore/>:<input type="number" min={0} max={25} value={classNoViolationScore ?? 0} onChange={e=>{if(isClassEditable){markClassEdited();setClassNoViolationScore(Math.min(25,Math.max(0,parseInt(e.target.value)||0)));} }} disabled={!isClassEditable} className="w-16 h-7 px-1.5 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100"/>}</td>
            </tr>

            {/* II.2 header */}
            <tr className="bg-red-50"><td colSpan={8} className="px-3 py-1.5 border-b border-red-100 text-[11px] font-bold text-red-700">II.2 Các lỗi vi phạm — Điểm trừ tương ứng (nhập số lần vi phạm):</td></tr>

            {/* Deduction rows */}
            {deductionLabels.map((label,idx)=>(
              <tr key={idx} className="hover:bg-red-50/40">
                <td className={`${tdR} text-center text-gray-400 text-[10px]`}>{idx+1}</td>
                <td className={`${tdR} text-gray-600 text-[11px] leading-snug`} colSpan={2}>{label}</td>
                <td className={`${tdR} text-center text-red-600 text-[11px] font-bold`}>−{DEDUCTION_WEIGHTS[idx]}đ/lần</td>
                <td className={tdR}><NoteArea value={notes[`sv_ii2_${idx}`]||''} onChange={v=>setNote(`sv_ii2_${idx}`,v)} disabled={!isSvEditable||isSvViolationSec2}/></td>
                <td className={tdR}>{isSvViolationSec2?<LockedScore/>:<DeductionStepper isSv={true} index={idx} value={svDeductions[idx]} onChange={val=>handleDeductionChange(true,idx,val)} disabled={!isSvEditable||isSvViolationSec2} weight={DEDUCTION_WEIGHTS[idx]} noViolationScore={svNoViolationScore} allDeductions={svDeductions} currentUserRole={currentUserRole} isReadOnly={isReadOnly}/>}</td>
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
                <td className={tdR}>{isSvViolationSec3?<LockedScore/>:<ScoreSelect options={row.opts} value={row.svVal} onChange={v=>{if(isSvEditable)row.svSet(v);}} disabled={!isSvEditable||isSvViolationSec3}/>}</td>
                <td className={tdR}><NoteArea value={notes[`cl_${row.key}`]||''} onChange={v=>setNote(`cl_${row.key}`,v)} disabled={!isClassEditable||isClassViolationSec3}/></td>
                <td className={tdBase}>{isClassViolationSec3?<LockedScore/>:<ScoreSelect options={row.opts} value={row.clVal} onChange={v=>{if(isClassEditable){markClassEdited();row.clSet(v);}}} disabled={!isClassEditable||isClassViolationSec3}/>}</td>
              </tr>
            ))}

            {/* III.5 khen thưởng */}
            <tr className="hover:bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>5</td>
              <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>Thành tích khen thưởng cấp trường trở lên (bắt buộc đính kèm minh chứng)<div className="text-[10px] text-gray-400 mt-0.5">Điểm thưởng bổ sung, tối đa 2đ</div></td>
              <td className={`${tdR} text-center font-bold text-gray-600`}>2.00</td>
              <td className={tdR}>
                <NoteArea value={notes['sv_iii5']||''} onChange={v=>setNote('sv_iii5',v)} disabled={!isSvEditable||isSvViolationSec3}/>
                
                {/* Upload button for reward points when active */}
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
            <SectionHeaderRow tt="IV" title="Ý thức công dân trong quan hệ cộng đồng" maxScore={25}/>
            <ViolationCheckRow label="[SV] Vi phạm nghiêm trọng quan hệ cộng đồng (Hủy điểm Mục IV)" checked={isSvViolationSec4} onChange={v=>{if(isSvEditable)setIsSvViolationSec4(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận vi phạm Mục IV" checked={isClassViolationSec4} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec4(v);}}} disabled={!isClassEditable}/>

            {sec4Rows.map(row=>(
              <tr key={row.tt} className="hover:bg-gray-50">
                <td className={`${tdR} text-center font-semibold text-gray-500`}>{row.tt}</td>
                <td className={`${tdR} text-gray-700 font-medium leading-snug`} colSpan={2}>{row.label}<div className="text-[10px] text-gray-400 mt-0.5">Tối đa {row.max}đ — {row.desc}</div></td>
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
            <SectionHeaderRow tt="V" title="Kết quả tham gia BCS lớp, BCH Đoàn, CLB... (tối đa 10đ)" maxScore={10}/>
            <ViolationCheckRow label="[SV] Không tham gia đoàn thể (Hủy điểm Mục V)" checked={isSvViolationSec5} onChange={v=>{if(isSvEditable)setIsSvViolationSec5(v);}} disabled={!isSvEditable}/>
            <ViolationCheckRow label="[Lớp] Xác nhận không tham gia Mục V" checked={isClassViolationSec5} onChange={v=>{if(isClassEditable){markClassEdited();setIsClassViolationSec5(v);}}} disabled={!isClassEditable}/>

            {/* V.0 Branch selector */}
            <tr className="bg-gray-50">
              <td className={`${tdR} text-center font-semibold text-gray-500`}>1</td>
              <td className={`${tdR} text-gray-700 font-semibold`} colSpan={2}>Loại sinh viên — chọn 1 trong 2 nhánh (loại trừ nhau)</td>
              <td className={tdR}></td>
              <td className={tdR} colSpan={2}>
                <div className="flex gap-4">
                  {[{v:'cadre',lbl:'Có chức vụ (BCS/Đoàn)'},{v:'student',lbl:'SV thường'}].map(opt=>(
                    <label key={opt.v} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 cursor-pointer">
                      <input type="radio" name="sv_role" value={opt.v} checked={svRoleType===opt.v} onChange={()=>{if(isSvEditable)setSvRoleType(opt.v as 'cadre'|'student');}} disabled={!isSvEditable} className="h-3 w-3 text-blue-600"/>{opt.lbl}
                    </label>
                  ))}
                </div>
              </td>
              <td className={tdBase} colSpan={2}>
                <div className="flex gap-4">
                  {[{v:'cadre',lbl:'Có chức vụ'},{v:'student',lbl:'SV thường'}].map(opt=>(
                    <label key={opt.v} className="flex items-center gap-1 text-[11px] font-semibold text-gray-700 cursor-pointer">
                      <input type="radio" name="cl_role" value={opt.v} checked={classRoleType===opt.v} onChange={()=>{if(isClassEditable){markClassEdited();setClassRoleType(opt.v as 'cadre'|'student');}}} disabled={!isClassEditable} className="h-3 w-3 text-indigo-600"/>{opt.lbl}
                    </label>
                  ))}
                </div>
              </td>
            </tr>

            {/* NHÁNH A: Cán bộ */}
            {classRoleType==='cadre'&&<>
              <tr className="bg-purple-50"><td colSpan={8} className="px-3 py-1 border-b border-purple-200 text-[11px] font-bold text-purple-700">🏅 Nhánh A: Cán bộ lớp / Cán bộ Đoàn – Hội</td></tr>
              {/* V.A.1 vị trí */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-[10px]`}>1</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Nhóm vị trí<div className="text-[10px] text-gray-400">A1: Lớp trưởng/Bí thư &nbsp;|&nbsp; A2: Phó lớp, Chi hội trưởng...</div></td>
                <td className={tdR}></td>
                <td className={tdR} colSpan={2}>
                  <div className="flex gap-3">{[{v:'a1',lbl:'A1 (LT/BT)'},{v:'a2',lbl:'A2 (Phó lớp...)'}].map(o=><label key={o.v} className="flex items-center gap-1 text-[11px] text-gray-700 cursor-pointer"><input type="radio" name="sv_pos" value={o.v} checked={svCadrePosition===o.v} onChange={()=>{if(isSvEditable&&svRoleType==='cadre')setSvCadrePosition(o.v as 'a1'|'a2');}} disabled={!isSvEditable||svRoleType!=='cadre'} className="h-3 w-3 text-blue-600"/>{o.lbl}</label>)}</div>
                </td>
                <td className={tdBase} colSpan={2}>
                  <div className="flex gap-3">{[{v:'a1',lbl:'A1'},{v:'a2',lbl:'A2'}].map(o=><label key={o.v} className="flex items-center gap-1 text-[11px] text-gray-700 cursor-pointer"><input type="radio" name="cl_pos" value={o.v} checked={classCadrePosition===o.v} onChange={()=>{if(isClassEditable&&classRoleType==='cadre'){markClassEdited();setClassCadrePosition(o.v as 'a1'|'a2');}}} disabled={!isClassEditable||classRoleType!=='cadre'} className="h-3 w-3 text-indigo-600"/>{o.lbl}</label>)}</div>
                </td>
              </tr>
              {/* V.A.2 mức độ hoàn thành */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-[10px]`}>2</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Mức độ hoàn thành nhiệm vụ được giao<div className="text-[10px] text-gray-400">A1: 7/6/4/0đ &nbsp;|&nbsp; A2: 6/5/3/0đ &nbsp;(minh chứng nếu Xuất sắc)</div></td>
                <td className={tdR}></td>
                <td className={tdR}>
                  <NoteArea value={notes['sv_va2']||''} onChange={v=>setNote('sv_va2',v)} disabled={!isSvEditable||svRoleType!=='cadre'||isSvViolationSec5}/>
                  {svCadrePerformance==='excellent'&&svRoleType==='cadre'&& (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-[10px] font-bold text-gray-600 block">Minh chứng hoàn thành xuất sắc:</span>
                      <MiniUpload fileKey="sv_cadre_perf" disabled={!isSvEditable} required/>
                    </div>
                  )}
                </td>
                <td className={tdR}>{isSvViolationSec5?<LockedScore/>:<ScoreSelect options={svCadrePosition==='a1'?a1PerfOpts:a2PerfOpts} value={svCadrePerformance} onChange={v=>{if(isSvEditable&&svRoleType==='cadre')setSvCadrePerformance(v);}} disabled={!isSvEditable||svRoleType!=='cadre'||isSvViolationSec5}/>}</td>
                <td className={tdR}><NoteArea value={notes['cl_va2']||''} onChange={v=>setNote('cl_va2',v)} disabled={!isClassEditable||classRoleType!=='cadre'||isClassViolationSec5}/></td>
                <td className={tdBase}>{isClassViolationSec5?<LockedScore/>:<ScoreSelect options={classCadrePosition==='a1'?a1PerfOpts:a2PerfOpts} value={classCadrePerformance} onChange={v=>{if(isClassEditable&&classRoleType==='cadre'){markClassEdited();setClassCadrePerformance(v);}}} disabled={!isClassEditable||classRoleType!=='cadre'||isClassViolationSec5}/>}</td>
              </tr>
              {/* V.A.3 quản lý đoàn hội */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-[10px]`}>3</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Tham gia cán bộ Đoàn–Hội cấp Trường/Khoa<div className="text-[10px] text-gray-400">Trưởng ban 3đ / Phó ban 2đ / Thành viên 1đ / Không 0đ</div></td>
                <td className={tdR}></td>
                <td className={tdR}><NoteArea value={notes['sv_va3']||''} onChange={v=>setNote('sv_va3',v)} disabled={!isSvEditable||svRoleType!=='cadre'||isSvViolationSec5}/></td>
                <td className={tdR}>{isSvViolationSec5?<LockedScore/>:<ScoreSelect options={mgmtOpts} value={svManagementLevel} onChange={v=>{if(isSvEditable&&svRoleType==='cadre')setSvManagementLevel(v);}} disabled={!isSvEditable||svRoleType!=='cadre'||isSvViolationSec5}/>}</td>
                <td className={tdR}><NoteArea value={notes['cl_va3']||''} onChange={v=>setNote('cl_va3',v)} disabled={!isClassEditable||classRoleType!=='cadre'||isClassViolationSec5}/></td>
                <td className={tdBase}>{isClassViolationSec5?<LockedScore/>:<ScoreSelect options={mgmtOpts} value={classManagementLevel} onChange={v=>{if(isClassEditable&&classRoleType==='cadre'){markClassEdited();setClassManagementLevel(v);}}} disabled={!isClassEditable||classRoleType!=='cadre'||isClassViolationSec5}/>}</td>
              </tr>
            </>}

            {/* NHÁNH B: SV thường */}
            {classRoleType==='student'&&<>
              <tr className="bg-green-50"><td colSpan={8} className="px-3 py-1 border-b border-green-200 text-[11px] font-bold text-green-700">📚 Nhánh B: Sinh viên thường</td></tr>
              {/* V.B.1 điểm tham gia */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-[10px]`}>1</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Điểm tham gia hoạt động lớp / Đoàn / Hội (BCS bình xét)<div className="text-[10px] text-gray-400">Nhập điểm 0–3đ</div></td>
                <td className={tdR}></td>
                <td className={tdR}><NoteArea value={notes['sv_vb1']||''} onChange={v=>setNote('sv_vb1',v)} disabled={!isSvEditable||svRoleType!=='student'||isSvViolationSec5}/></td>
                <td className={tdR}>{isSvViolationSec5?<LockedScore/>:<input type="number" min={0} max={3} value={svClassParticipation ?? 0} onChange={e=>{if(isSvEditable&&svRoleType==='student')setSvClassParticipation(Math.min(3,Math.max(0,parseInt(e.target.value)||0)));}} disabled={!isSvEditable||svRoleType!=='student'} className="w-16 h-7 px-1.5 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-blue-400 disabled:bg-gray-100"/>}</td>
                <td className={tdR}><NoteArea value={notes['cl_vb1']||''} onChange={v=>setNote('cl_vb1',v)} disabled={!isClassEditable||classRoleType!=='student'||isClassViolationSec5}/></td>
                <td className={tdBase}>{isClassViolationSec5?<LockedScore/>:<input type="number" min={0} max={3} value={classClassParticipation ?? 0} onChange={e=>{if(isClassEditable&&classRoleType==='student'){markClassEdited();setClassClassParticipation(Math.min(3,Math.max(0,parseInt(e.target.value)||0)));} }} disabled={!isClassEditable||classRoleType!=='student'} className="w-16 h-7 px-1.5 text-center text-xs border border-gray-300 rounded bg-white font-bold outline-none focus:ring-1 focus:ring-indigo-400 disabled:bg-gray-100"/>}</td>
              </tr>
              {/* V.B.2 thành tích đặc biệt */}
              <tr className="hover:bg-gray-50">
                <td className={`${tdR} text-center text-gray-400 text-[10px]`}>2</td>
                <td className={`${tdR} text-gray-700 font-medium`} colSpan={2}>Thành tích cá nhân đặc biệt (giải thưởng cấp tỉnh trở lên)<div className="text-[10px] text-gray-400">QG/QT: 7đ / Tỉnh/TP: 5đ / Không: 0đ &nbsp;(bắt buộc minh chứng)</div></td>
                <td className={tdR}></td>
                <td className={tdR}>
                  <NoteArea value={notes['sv_vb2']||''} onChange={v=>setNote('sv_vb2',v)} disabled={!isSvEditable||svRoleType!=='student'||isSvViolationSec5}/>
                  {(svSpecialAchievement==='national_intl'||svSpecialAchievement==='provincial')&&svRoleType==='student'&& (
                    <div className="mt-2 border-t pt-1.5 border-gray-100">
                      <span className="text-[10px] font-bold text-gray-600 block">Minh chứng thành tích cấp Tỉnh/QG:</span>
                      <MiniUpload fileKey="sv_special_ach" disabled={!isSvEditable} required/>
                    </div>
                  )}
                </td>
                <td className={tdR}>{isSvViolationSec5?<LockedScore/>:<ScoreSelect options={achieveOpts} value={svSpecialAchievement} onChange={v=>{if(isSvEditable&&svRoleType==='student')setSvSpecialAchievement(v);}} disabled={!isSvEditable||svRoleType!=='student'||isSvViolationSec5}/>}</td>
                <td className={tdR}><NoteArea value={notes['cl_vb2']||''} onChange={v=>setNote('cl_vb2',v)} disabled={!isClassEditable||classRoleType!=='student'||isClassViolationSec5}/></td>
                <td className={tdBase}>{isClassViolationSec5?<LockedScore/>:<ScoreSelect options={achieveOpts} value={classSpecialAchievement} onChange={v=>{if(isClassEditable&&classRoleType==='student'){markClassEdited();setClassSpecialAchievement(v);}}} disabled={!isClassEditable||classRoleType!=='student'||isClassViolationSec5}/>}</td>
              </tr>
            </>}

            {/* ═══ TỔNG CỘNG ═══ */}
            <tr className="bg-indigo-50/70 text-indigo-950 font-black border-t border-indigo-200">
              <td className="px-3 py-3 border-r border-indigo-100 text-sm" colSpan={3}>Tổng cộng (Điểm chấm)</td>
              <td className="px-2 py-3 text-center border-r border-indigo-100 font-black">100</td>
              <td className="px-2 py-3 text-center border-r border-indigo-100 text-blue-700 text-sm font-black" colSpan={2}>{f(svScores.total)} / 100</td>
              <td className="px-2 py-3 text-center text-[#D93A3C] text-sm font-black" colSpan={2}>{f(classScores.total)} / 100</td>
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
