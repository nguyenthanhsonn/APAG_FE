/**
 * evaluationFormStore.ts
 *
 * Factory Zustand store for the Student Evaluation Form (QD4185).
 * Uses a factory function + React Context pattern to avoid singleton state
 * collisions between multiple evaluation sessions (SSR-safe).
 */

import { createContext, useContext } from 'react';
import { create } from 'zustand';
import type { ChangeEvent } from 'react';
import type { UploadedEvidenceFile } from '@/types/student';

export type EvaluationScoreSection = 'study' | 'discipline' | 'activity' | 'community' | 'role';

// ---------------------------------------------------------------------------
// Score result type
// ---------------------------------------------------------------------------
export interface ScoreResult {
  sec1: number;
  sec2: number;
  sec3: number;
  sec4: number;
  sec5: number;
  total: number;
}

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
export interface EvaluationFormState {
  // UI context
  currentUserRole: 'student' | 'class';
  isReadOnly: boolean;
  fieldErrors: Record<string, string>;

  // --- Section 1: Study & Research (max 20) ---
  svStudyAttitude: string;
  svNckh: boolean;
  svOlympic: boolean;
  svCreative: boolean;
  svAcademicRank: string;
  classStudyAttitude: string;
  classNckh: boolean;
  classOlympic: boolean;
  classCreative: boolean;
  classAcademicRank: string;
  isSvViolationSec1: boolean;
  isClassViolationSec1: boolean;

  // --- Section 2: Discipline (max 25) ---
  svNoViolationScore: number;
  svDeductions: number[];
  classNoViolationScore: number;
  classDeductions: number[];
  deductionLabels: string[];
  isSvViolationSec2: boolean;
  isClassViolationSec2: boolean;

  // --- Section 3: Activities (max 20) ---
  svActivity1: string;
  svActivity2: string;
  svActivity3: string;
  svActivity4: string;
  svRewardPoints: number;
  classActivity1: string;
  classActivity2: string;
  classActivity3: string;
  classActivity4: string;
  classRewardPoints: number;
  isSvViolationSec3: boolean;
  isClassViolationSec3: boolean;

  // --- Section 4: Community (max 25) ---
  svPolicy: string;
  svSolidarity: string;
  svLocality: string;
  classPolicy: string;
  classSolidarity: string;
  classLocality: string;
  isSvViolationSec4: boolean;
  isClassViolationSec4: boolean;

  // --- Section 5: Role (max 10) ---
  svRoleType: string;
  svCadrePosition: string;
  svCadrePerformance: string;
  svManagementLevel: string;
  svClassParticipation: number;
  svSpecialAchievement: string;
  classRoleType: string;
  classCadrePosition: string;
  classCadrePerformance: string;
  classManagementLevel: string;
  classClassParticipation: number;
  classSpecialAchievement: string;
  isSvViolationSec5: boolean;
  isClassViolationSec5: boolean;

  // --- File uploads ---
  uploadedFiles: Record<string, UploadedEvidenceFile[]>;
  fileProgress: Record<string, Record<string, number | 'done' | 'error'>>;

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  /** Generic single-field updater */
  setField: <K extends keyof EvaluationFormState>(key: K, value: EvaluationFormState[K]) => void;

  /** Batch-set many fields at once (used when loading API data) */
  batchSet: (partial: Partial<EvaluationFormState>) => void;

  /** Handle deduction stepper change with clamping logic */
  handleDeductionChange: (isSv: boolean, index: number, value: number) => void;

  /** Marks that the class-side has been manually edited by the user */
  setIsClassEdited: (v: boolean) => void;

  /**
   * File upload handler — injected by the page controller after store creation.
   * Default is a no-op; the page controller overrides it via batchSet.
   */
  handleFileUploadAction: (key: string, e: ChangeEvent<HTMLInputElement>) => void;

  /**
   * Remove uploaded file — injected by the page controller after store creation.
   */
  removeFileAction: (key: string, index: number) => void;

  persistSectionAction: (section: EvaluationScoreSection) => void;
}

// ---------------------------------------------------------------------------
// Deduction weights (constant — same as page controller)
// ---------------------------------------------------------------------------
export const EVAL_DEDUCTION_WEIGHTS = [10, 3, 5, 5, 5, 5, 5, 10, 20];

const DEDUCTION_LABELS = [
  'Không tham gia học tập đầy đủ, nghiêm túc nghị quyết, nội quy, quy chế, tuần sinh hoạt công dân -sinh viên (các chuyên đề sinh hoạt sinh viên đầu khóa, đầu năm, cuối khóa) hoặc bài thu hoạch không đạt (Điểm trung bình chung <5)',
  'Nghỉ không lý do các chuyên đề “tuần sinh hoạt công dân-sinh viên” đầu khóa, đầu năm, cuối khóa',
  'Không tham gia các buổi sinh hoạt lớp, họp, hội nghị, giao ban, tập huấn và các hoạt động khác do Học viện yêu cầu.',
  'Không đeo thẻ sinh viên đến Học viện, không mặc đồng phục thể thao trong giờ học GDTC, hút thuốc, xả rác bừa bãi nơi công cộng, vi phạm một trong những điều sinh viên không được làm',
  'Vi phạm các quy định khu giảng đường, thư viện; không chấp hành các quy định nơi cư trú và làm các thủ tục khi thay đổi chỗ ở theo quy định.',
  'Chậm đóng học phí, lệ phí, bảo hiểm y tế bắt buộc, tiền nội trú, các khoản thu theo qui định của Học viện hoặc chậm nộp các loại giấy tờ, hồ sơ, văn bằng, chứng chỉ cho Học viện (chưa có quyết định đình chỉ học có thời hạn).',
  'Bị khiển trách, nhắc nhở trong phòng thi.',
  'Vi phạm quy chế thi ở mức cảnh cáo hoặc trừ điểm thi nhưng chưa đến mức bị đình chỉ thi',
  'Vi phạm quy chế thi bị lập biên bản đình chỉ thi',
];

// ---------------------------------------------------------------------------
// Score lookup tables (mirrors the useMemo tables in EvaluationFormQD4185)
// ---------------------------------------------------------------------------
const STUDY_ATTITUDE_SCORES: Record<string, number> = { GTE_9: 6, FROM_7_TO_UNDER_9: 5, FROM_5_TO_UNDER_7: 4, FROM_4_TO_UNDER_5: 2, FROM_1_TO_UNDER_4: 1, very_good: 6, good: 5, fair: 4, average: 2, poor: 1, none: 0, '': 0 };
const ACADEMIC_RANK_SCORES: Record<string, number> = { EXCELLENT: 8, GOOD: 7, FAIR: 6, AVERAGE: 4, WEAK_NO_WARNING: 2, WEAK_WARNING_FIRST: 1, excellent: 8, good: 7, fair: 6, average: 4, weak_no_warn: 2, weak_warn: 1, none: 0, '': 0 };
const ACTIVITY1_SCORES: Record<string, number> = { GOOD_PARTICIPATION: 5, ABSENT_ONCE: 3, ABSENT_TWICE: 2, ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED: 0, active: 5, full: 3, excused: 2, unexcused: 0 };
const ACTIVITY2_SCORES: Record<string, number> = { FULL_EFFECTIVE_PARTICIPATION: 5, EFFECTIVE_PARTICIPATION_FROM_HALF: 3, ENCOURAGED_OTHERS: 2, ABSENT_OVER_HALF: 1, NOT_PARTICIPATED: 0, many: 5, some: 3, active: 2, full: 1, none: 0 };
const ACTIVITY3_SCORES: Record<string, number> = { FULL_EFFECTIVE_PARTICIPATION: 5, ACTIVE_ONE_OR_MORE: 3, ACTIVE_SUPPORTER: 2, ABSENT_OVER_HALF: 1, NOT_PARTICIPATED: 0, prize_or_org: 5, active: 3, some: 2, full: 1, none: 0 };
const ACTIVITY4_SCORES: Record<string, number> = { MULTIPLE_ACTIVITIES_OR_REPORTING: 3, ONE_EFFECTIVE_ACTIVITY: 2, AWARENESS_OR_SUPPORT: 1, REMINDED_VIOLATION: 0, active: 3, full: 2, some: 1, none: 0 };
const POLICY_SCORES: Record<string, number> = { GOOD_WITH_REWARD: 10, GOOD: 8, AVERAGE: 5, VIOLATED: 0, excellent_propaganda: 10, good: 8, minor_violation: 5, none: 0 };
const SOLIDARITY_SCORES: Record<string, number> = { ACTIVE_WITH_REWARD: 10, ACTIVE: 8, PARTICIPATED: 5, NOT_PARTICIPATED: 0, excellent_achievements: 10, regular: 8, some: 5, none: 0 };
const LOCALITY_SCORES: Record<string, number> = { GOOD: 5, ONE_WARNING: 1, TWO_WARNINGS: 0, good: 5, rewarded: 1, warned: 0 };

// ---------------------------------------------------------------------------
// Pure score computation — exported so page controller and selectors can use it
// ---------------------------------------------------------------------------
const clamp = (v: number, max: number) => Math.min(max, Math.max(0, Number.isFinite(v) ? v : 0));

export function computeEvaluationScores(s: EvaluationFormState, isSv: boolean): ScoreResult {
  // Section I
  const isVio1 = isSv ? s.isSvViolationSec1 : s.isClassViolationSec1;
  let sec1 = 0;
  if (!isVio1) {
    const att = isSv ? s.svStudyAttitude : s.classStudyAttitude;
    const rank = isSv ? s.svAcademicRank : s.classAcademicRank;
    const nckh = isSv ? s.svNckh : s.classNckh;
    const olympic = isSv ? s.svOlympic : s.classOlympic;
    const creative = isSv ? s.svCreative : s.classCreative;
    sec1 = clamp((STUDY_ATTITUDE_SCORES[att] || 0) + (nckh ? 2 : 0) + (olympic ? 2 : 0) + (creative ? 2 : 0) + (ACADEMIC_RANK_SCORES[rank] || 0), 20);
  }

  // Section II
  const isVio2 = isSv ? s.isSvViolationSec2 : s.isClassViolationSec2;
  let sec2 = 0;
  if (!isVio2) {
    const base = isSv ? s.svNoViolationScore : s.classNoViolationScore;
    const deductions = isSv ? s.svDeductions : s.classDeductions;
    const totalDed = deductions.reduce((sum, count, idx) => sum + count * EVAL_DEDUCTION_WEIGHTS[idx], 0);
    sec2 = clamp(base - totalDed, 25);
  }

  // Section III
  const isVio3 = isSv ? s.isSvViolationSec3 : s.isClassViolationSec3;
  let sec3 = 0;
  if (!isVio3) {
    const a1 = isSv ? s.svActivity1 : s.classActivity1;
    const a2 = isSv ? s.svActivity2 : s.classActivity2;
    const a3 = isSv ? s.svActivity3 : s.classActivity3;
    const a4 = isSv ? s.svActivity4 : s.classActivity4;
    const reward = isSv ? s.svRewardPoints : s.classRewardPoints;
    sec3 = clamp((ACTIVITY1_SCORES[a1] || 0) + (ACTIVITY2_SCORES[a2] || 0) + (ACTIVITY3_SCORES[a3] || 0) + (ACTIVITY4_SCORES[a4] || 0) + reward, 20);
  }

  // Section IV
  const isVio4 = isSv ? s.isSvViolationSec4 : s.isClassViolationSec4;
  let sec4 = 0;
  if (!isVio4) {
    const pol = isSv ? s.svPolicy : s.classPolicy;
    const sol = isSv ? s.svSolidarity : s.classSolidarity;
    const loc = isSv ? s.svLocality : s.classLocality;
    sec4 = clamp((POLICY_SCORES[pol] || 0) + (SOLIDARITY_SCORES[sol] || 0) + (LOCALITY_SCORES[loc] || 0), 25);
  }

  // Section V
  const isVio5 = isSv ? s.isSvViolationSec5 : s.isClassViolationSec5;
  let sec5 = 0;
  if (!isVio5) {
    const pos = isSv ? s.svCadrePosition : s.classCadrePosition;
    const perf = isSv ? s.svCadrePerformance : s.classCadrePerformance;
    const mgmt = isSv ? s.svManagementLevel : s.classManagementLevel;
    const part = isSv ? s.svClassParticipation : s.classClassParticipation;
    const ach = isSv ? s.svSpecialAchievement : s.classSpecialAchievement;

    let section5Part1 = 0;
    if (pos && pos !== 'NONE' && pos !== 'none') {
      const perfMap = pos === 'LEADER_GROUP' || pos === 'a1'
        ? { EXCELLENT: 7, GOOD: 6, FAIR: 4, POOR: 0, excellent: 7, good: 6, average: 4, unsatisfactory: 0 }
        : { EXCELLENT: 6, GOOD: 5, FAIR: 3, POOR: 0, excellent: 6, good: 5, average: 3, unsatisfactory: 0 };
      const mgmtMap: Record<string, number> = { HEAD_POSITION: 3, DEPUTY_POSITION: 2, MEMBER_POSITION: 1, head: 3, deputy: 2, member: 1, none: 0, '': 0 };
      section5Part1 = (perfMap[perf as keyof typeof perfMap] || 0) + (mgmtMap[mgmt] || 0);
    }

    const achMap: Record<string, number> = { NATIONAL_OR_INTL: 7, PROVINCIAL_LEVEL: 5, NONE: 0, national_intl: 7, provincial: 5, none: 0 };
    const section5Part2 = clamp(Number(part) || 0, 3) + (achMap[ach] || 0);
    sec5 = clamp(section5Part1 + section5Part2, 10);
  }

  return { sec1, sec2, sec3, sec4, sec5, total: clamp(sec1 + sec2 + sec3 + sec4 + sec5, 100) };
}

// ---------------------------------------------------------------------------
// Default state values
// ---------------------------------------------------------------------------
const noop = () => {};

const DEFAULT_STATE: Omit<
  EvaluationFormState,
  'setField' | 'batchSet' | 'handleDeductionChange' | 'setIsClassEdited'
> = {
  currentUserRole: 'student',
  isReadOnly: false,
  fieldErrors: {},

  svStudyAttitude: 'FROM_1_TO_UNDER_4',
  svNckh: false,
  svOlympic: false,
  svCreative: false,
  svAcademicRank: 'WEAK_WARNING_FIRST',
  classStudyAttitude: 'FROM_1_TO_UNDER_4',
  classNckh: false,
  classOlympic: false,
  classCreative: false,
  classAcademicRank: 'WEAK_WARNING_FIRST',
  isSvViolationSec1: false,
  isClassViolationSec1: false,

  svNoViolationScore: 0,
  svDeductions: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  classNoViolationScore: 0,
  classDeductions: [0, 0, 0, 0, 0, 0, 0, 0, 0],
  deductionLabels: DEDUCTION_LABELS,
  isSvViolationSec2: false,
  isClassViolationSec2: false,

  svActivity1: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
  svActivity2: 'NOT_PARTICIPATED',
  svActivity3: 'NOT_PARTICIPATED',
  svActivity4: 'REMINDED_VIOLATION',
  svRewardPoints: 0,
  classActivity1: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
  classActivity2: 'NOT_PARTICIPATED',
  classActivity3: 'NOT_PARTICIPATED',
  classActivity4: 'REMINDED_VIOLATION',
  classRewardPoints: 0,
  isSvViolationSec3: false,
  isClassViolationSec3: false,

  svPolicy: 'VIOLATED',
  svSolidarity: 'NOT_PARTICIPATED',
  svLocality: 'TWO_WARNINGS',
  classPolicy: 'VIOLATED',
  classSolidarity: 'NOT_PARTICIPATED',
  classLocality: 'TWO_WARNINGS',
  isSvViolationSec4: false,
  isClassViolationSec4: false,

  svRoleType: 'NORMAL_STUDENT',
  svCadrePosition: 'NONE',
  svCadrePerformance: 'POOR',
  svManagementLevel: '',
  svClassParticipation: 0,
  svSpecialAchievement: 'NONE',
  classRoleType: 'NORMAL_STUDENT',
  classCadrePosition: 'NONE',
  classCadrePerformance: 'POOR',
  classManagementLevel: '',
  classClassParticipation: 0,
  classSpecialAchievement: 'NONE',
  isSvViolationSec5: false,
  isClassViolationSec5: false,

  uploadedFiles: {},
  fileProgress: {},

  handleFileUploadAction: noop,
  removeFileAction: noop,
  persistSectionAction: noop,
};

const fieldSectionMap: Partial<Record<keyof EvaluationFormState, EvaluationScoreSection>> = {
  svStudyAttitude: 'study',
  svNckh: 'study',
  svOlympic: 'study',
  svCreative: 'study',
  svAcademicRank: 'study',
  svNoViolationScore: 'discipline',
  svDeductions: 'discipline',
  svActivity1: 'activity',
  svActivity2: 'activity',
  svActivity3: 'activity',
  svActivity4: 'activity',
  svRewardPoints: 'activity',
  svPolicy: 'community',
  svSolidarity: 'community',
  svLocality: 'community',
  svRoleType: 'role',
  svCadrePosition: 'role',
  svCadrePerformance: 'role',
  svManagementLevel: 'role',
  svClassParticipation: 'role',
  svSpecialAchievement: 'role',
};

// ---------------------------------------------------------------------------
// Factory function — call this inside useRef to get an isolated instance
// ---------------------------------------------------------------------------
export const createEvaluationFormStore = () =>
  create<EvaluationFormState>()((set, get) => ({
    ...DEFAULT_STATE,

    setField: (key, value) => {
      set({ [key]: value } as Pick<EvaluationFormState, typeof key>);
      const section = fieldSectionMap[key];
      if (section) queueMicrotask(() => get().persistSectionAction(section));
    },

    batchSet: (partial) => set(partial as Partial<EvaluationFormState>),

    handleDeductionChange: (isSv, index, value) => {
      const state = get();
      const currentBase = isSv ? state.svNoViolationScore : state.classNoViolationScore;
      const prevDeductions = isSv ? state.svDeductions : state.classDeductions;

      const weight = EVAL_DEDUCTION_WEIGHTS[index] || 0;
      const sumOther = prevDeductions.reduce(
        (sum, count, idx) => (idx === index ? sum : sum + (Number(count) || 0) * EVAL_DEDUCTION_WEIGHTS[idx]),
        0,
      );
      const remainingScore = Math.max(0, currentBase - sumOther);
      const maxTimes = weight > 0 ? Math.floor(remainingScore / weight) : 0;
      const clamped = Math.min(maxTimes, Math.max(0, value));

      const newDeductions = [...prevDeductions];
      newDeductions[index] = clamped;

      if (isSv) {
        set({ svDeductions: newDeductions });
        queueMicrotask(() => get().persistSectionAction('discipline'));
      } else {
        set({ classDeductions: newDeductions });
      }
    },

    setIsClassEdited: () => {
      // Intentional no-op in store — isClassEdited is still tracked in page controller
      // via the useEffect propagation logic. The store action exists so that
      // EvaluationTableGrid can call it without needing a separate prop.
    },
  }));

// ---------------------------------------------------------------------------
// Store type
// ---------------------------------------------------------------------------
export type EvaluationFormStore = ReturnType<typeof createEvaluationFormStore>;

// ---------------------------------------------------------------------------
// React Context
// ---------------------------------------------------------------------------
export const EvaluationFormStoreContext = createContext<EvaluationFormStore | null>(null);

/**
 * Hook to consume the evaluation form store with a fine-grained selector.
 * Throws if used outside of <EvaluationFormStoreContext.Provider>.
 */
export function useEvaluationFormStore<T>(selector: (state: EvaluationFormState) => T): T {
  const store = useContext(EvaluationFormStoreContext);
  if (!store) {
    throw new Error('useEvaluationFormStore must be used within <EvaluationFormStoreContext.Provider>');
  }
  return store(selector);
}
