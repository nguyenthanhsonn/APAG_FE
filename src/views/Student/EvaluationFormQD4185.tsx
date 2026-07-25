'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Info,
  Loader2
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { API_Student } from '../../api/API_Student';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { uploadEvidenceFile } from '../../services/cloudinaryUpload';
import { useToast } from '../../components/common/ToastProvider';
import { getUserFriendlyError } from '../../utils/errorHelper';

// Sub-components
import { EvaluationTableGrid } from '../../components/student/EvaluationTableGrid';
import type { UploadedEvidenceFile } from '@/types/student';
import {
  createEvaluationFormStore,
  EvaluationFormStoreContext,
} from '../../store/evaluationFormStore';
import type { EvaluationFormStore } from '../../store/evaluationFormStore';

const EDITABLE_EVALUATION_STATUSES = ['DRAFT', 'REJECTED'];
const DISCIPLINE_VIOLATION_CODES = [
  'MISSED_CITIZEN_WEEK_FULL',
  'ABSENT_CITIZEN_WEEK_SESSION',
  'ABSENT_CLASS_MEETING',
  'VIOLATED_DRESS_CODE',
  'VIOLATED_CAMPUS_RULES',
  'LATE_FEE_PAYMENT',
  'EXAM_REPRIMAND',
  'EXAM_VIOLATION_WARNING',
  'EXAM_VIOLATION_SUSPENSION',
] as const;
const DISCIPLINE_DEDUCTION_WEIGHTS = [10, 3, 5, 5, 5, 5, 5, 10, 20];

export const EvaluationFormQD4185 = () => {
  const { user } = useAuthStore();
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isReadOnly, setIsReadOnly] = useState(false);
	  const [isLocked, setIsLocked] = useState(false);
	  const [alreadyEvaluated, setAlreadyEvaluated] = useState(false);
  const [evaluationId, setEvaluationId] = useState<string | null>(null);
  const [, setEvaluationWorkflow] = useState<any>(null);
  const [note, setNote] = useState<string>('');

  // Simulating user role switcher for testing purposes
  const [currentUserRole] = useState<'student' | 'class'>('student');

  // ── Zustand store (factory pattern — isolated per mount) ──────────────────
  const storeRef = useRef<EvaluationFormStore | null>(null);
  if (!storeRef.current) storeRef.current = createEvaluationFormStore();
  const store = storeRef.current;


  // (Accordion sections removed — replaced by EvaluationTableGrid)

  // Section violation states — sv values; class mirrors are written to store directly
  const [isSvViolationSec1, setIsSvViolationSec1] = useState(false);
  const [isSvViolationSec2, setIsSvViolationSec2] = useState(false);
  const [isSvViolationSec3, setIsSvViolationSec3] = useState(false);
  const [isSvViolationSec4, setIsSvViolationSec4] = useState(false);
  const [isSvViolationSec5, setIsSvViolationSec5] = useState(false);

  // Header State Values
  const [phoneNumber, setPhoneNumber] = useState((user as any)?.phoneNumber || '0987654321');
  const [semester, setSemester] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<string>('');
  const [selectedSemesterId, setSelectedSemesterId] = useState('');
  const [availableSemesters, setAvailableSemesters] = useState<any[]>([]);

  // File Upload State
	  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedEvidenceFile[]>>({});
	  const [uploadingEvidence, setUploadingEvidence] = useState<string | null>(null);
	  // fileProgress: { [criteriaKey]: { [fileName]: percent 0-100 | 'done' | 'error' } }
	  const [fileProgress, setFileProgress] = useState<Record<string, Record<string, number | 'done' | 'error'>>>({});

  // ── Sync UI meta into store whenever they change ──────────────────────────
  useEffect(() => {
    store.getState().batchSet({ currentUserRole, isReadOnly });
  }, [currentUserRole, isReadOnly, store]);

  // ── Sync uploadedFiles & fileProgress into store ──────────────────────────
  useEffect(() => {
    store.getState().batchSet({ uploadedFiles, fileProgress });
  }, [uploadedFiles, fileProgress, store]);

		  const mapEvidenceCriteriaCode = (criteriaKey: string) => {
	    if (criteriaKey.startsWith('sv_nckh') || criteriaKey.startsWith('sv_olympic') || criteriaKey.startsWith('sv_creative')) {
	      return 'TC1';
	    }
	    if (criteriaKey.startsWith('sv_reward')) {
	      return 'TC3';
	    }
	    if (criteriaKey.startsWith('sv_policy') || criteriaKey.startsWith('sv_solidarity')) {
	      return 'TC4';
	    }
	    if (criteriaKey.startsWith('sv_cadre') || criteriaKey.startsWith('sv_special')) {
	      return 'TC5';
	    }
		    return criteriaKey;
		  };

	  const normalizeEvaluationStatus = (status?: string) => String(status || '').toUpperCase();

	  const canEditEvaluation = (form: any) => {
	    const status = normalizeEvaluationStatus(form?.status);
	    return form?.semesterIsActive === true && form?.isLocked === false && EDITABLE_EVALUATION_STATUSES.includes(status);
	  };

	  const applyEvaluationLockState = (form: any) => {
	    const editable = canEditEvaluation(form);
	    setIsLocked(Boolean(form?.isLocked));
	    setAlreadyEvaluated(!editable);
	    setIsReadOnly(!editable);
	    return editable;
	  };

		  const handleFileUpload = async (criteriaKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileList = Array.from(files);

    // Client-side validations (Size & Type)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    for (const file of fileList) {
      if (file.size > 10 * 1024 * 1024) {
        setValidationError(`Tệp "${file.name}" vượt quá giới hạn dung lượng 10MB.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        e.target.value = '';
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        setValidationError(`Tệp "${file.name}" không hợp lệ. Hệ thống chỉ chấp nhận định dạng PDF, JPG, PNG.`);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        e.target.value = '';
        return;
      }
    }

    // Validate trạng thái phiếu bằng state local (không gọi lại API)
    if (isReadOnly || isLocked) {
      toast.error('Phiếu đánh giá hiện không ở trạng thái được chỉnh sửa.');
      e.target.value = '';
      return;
    }

	    try {
	      setUploadingEvidence(criteriaKey);
	      setValidationError(null);

	      // Khởi tạo progress 0 cho tất cả file cùng lúc
	      setFileProgress(prev => ({
	        ...prev,
	        [criteriaKey]: Object.fromEntries(fileList.map(f => [f.name, 0])),
	      }));

	      // Upload song song toàn bộ file — Promise.allSettled không bị chặn khi 1 file lỗi
	      const results = await Promise.allSettled(
	        fileList.map(async (file) => {
	          const { secureUrl, publicId } = await uploadEvidenceFile(file, {
	            onProgress: (percent) => {
	              setFileProgress(prev => ({
	                ...prev,
	                [criteriaKey]: { ...(prev[criteriaKey] || {}), [file.name]: percent },
	              }));
	            },
	          });

	          await API_Student.linkEvidenceUrl({
	            criteriaCode: mapEvidenceCriteriaCode(criteriaKey),
	            imageUrl: secureUrl,
	            publicId,
	          });

	          // Đánh dấu file này đã xong
	          setFileProgress(prev => ({
	            ...prev,
	            [criteriaKey]: { ...(prev[criteriaKey] || {}), [file.name]: 'done' },
	          }));

	          return { name: file.name, url: secureUrl, type: file.type } as UploadedEvidenceFile;
	        })
	      );

	      // Cập nhật state chỉ với các file upload thành công
	      const successItems: UploadedEvidenceFile[] = [];
	      const failedNames: string[] = [];

	      results.forEach((result, idx) => {
	        if (result.status === 'fulfilled') {
	          successItems.push(result.value);
	        } else {
	          failedNames.push(fileList[idx].name);
	          setFileProgress(prev => ({
	            ...prev,
	            [criteriaKey]: { ...(prev[criteriaKey] || {}), [fileList[idx].name]: 'error' },
	          }));
	        }
	      });

	      if (successItems.length > 0) {
	        setUploadedFiles(prev => ({
	          ...prev,
	          [criteriaKey]: [...(prev[criteriaKey] || []), ...successItems],
	        }));
	      }

	      if (failedNames.length > 0) {
	        const msg = `Không thể tải lên: ${failedNames.join(', ')}. Vui lòng thử lại các file này.`;
	        setValidationError(msg);
	        window.scrollTo({ top: 0, behavior: 'smooth' });
	      }
	    } catch (err: any) {
	      const message = getUserFriendlyError(err, 'Không thể tải minh chứng. Vui lòng thử lại.');
	      if (err.statusCode === 409 || message.includes('khóa') || message.includes('locked')) {
	        setIsLocked(true);
	        setIsReadOnly(true);
	        setAlreadyEvaluated(true);
	        toast.error(message);
	      }
	      setValidationError(message);
	      window.scrollTo({ top: 0, behavior: 'smooth' });
	    } finally {
      setUploadingEvidence(null);
      e.target.value = '';
    }
  };

  const removeFile = (criteriaKey: string, index: number) => {
    setUploadedFiles(prev => {
      const copy = [...(prev[criteriaKey] || [])];
      copy.splice(index, 1);
      return { ...prev, [criteriaKey]: copy };
    });
  };

  // Score states for SV (Student) — all sv values also written to store via batchSet
  const [svStudyAttitude, setSvStudyAttitude] = useState<string>('none');
  const [svNckh, setSvNckh] = useState(false);
  const [svOlympic, setSvOlympic] = useState(false);
  const [svCreative, setSvCreative] = useState(false);
  const [svAcademicRank, setSvAcademicRank] = useState<string>('none');

  const [svNoViolationScore, setSvNoViolationScore] = useState<number>(0);
  const [svDeductions, setSvDeductions] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);

  const [svActivity1, setSvActivity1] = useState<string>('ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED');
  const [svActivity2, setSvActivity2] = useState<string>('none');
  const [svActivity3, setSvActivity3] = useState<string>('none');
  const [svActivity4, setSvActivity4] = useState<string>('none');
  const [svRewardPoints, setSvRewardPoints] = useState<number>(0);

  const [svPolicy, setSvPolicy] = useState<string>('VIOLATED');
  const [svSolidarity, setSvSolidarity] = useState<string>('none');
  const [svLocality, setSvLocality] = useState<string>('TWO_WARNINGS');

  const [svRoleType, setSvRoleType] = useState<'cadre' | 'student'>('student');
  const [svCadrePosition, setSvCadrePosition] = useState<'a1' | 'a2'>('a2');
  const [svCadrePerformance, setSvCadrePerformance] = useState<string>('unsatisfactory');
  const [svManagementLevel, setSvManagementLevel] = useState<string>('none');
  const [svClassParticipation, setSvClassParticipation] = useState<number>(0);
  const [svSpecialAchievement, setSvSpecialAchievement] = useState<string>('none');

  // Class (Monitor) score states are NOT kept locally — they are written directly to store
  // by the auto-propagate effect below and managed there by EvaluationTableGrid.

  // Auto-propagate student inputs to class columns in store if class hasn't been edited
  const [isClassEdited, setIsClassEdited] = useState(false);
  useEffect(() => {
    if (!isClassEdited && currentUserRole === 'student') {
      // Write class values directly into store (no local class state needed)
      store.getState().batchSet({
        classStudyAttitude: svStudyAttitude,
        classNckh: svNckh,
        classOlympic: svOlympic,
        classCreative: svCreative,
        classAcademicRank: svAcademicRank,
        classNoViolationScore: svNoViolationScore,
        classDeductions: [...svDeductions],
        classActivity1: svActivity1,
        classActivity2: svActivity2,
        classActivity3: svActivity3,
        classActivity4: svActivity4,
        classRewardPoints: svRewardPoints,
        classPolicy: svPolicy,
        classSolidarity: svSolidarity,
        classLocality: svLocality,
        classRoleType: svRoleType,
        classCadrePosition: svCadrePosition,
        classCadrePerformance: svCadrePerformance,
        classManagementLevel: svManagementLevel,
        classClassParticipation: svClassParticipation,
        classSpecialAchievement: svSpecialAchievement,
        isClassViolationSec1: isSvViolationSec1,
        isClassViolationSec2: isSvViolationSec2,
        isClassViolationSec3: isSvViolationSec3,
        isClassViolationSec4: isSvViolationSec4,
        isClassViolationSec5: isSvViolationSec5,
      });
    }
  }, [
    svStudyAttitude, svNckh, svOlympic, svCreative, svAcademicRank,
    svNoViolationScore, svDeductions, svActivity1, svActivity2, svActivity3, svActivity4, svRewardPoints,
    svPolicy, svSolidarity, svLocality, svRoleType, svCadrePosition, svCadrePerformance,
    svManagementLevel, svClassParticipation, svSpecialAchievement,
    isSvViolationSec1, isSvViolationSec2, isSvViolationSec3, isSvViolationSec4, isSvViolationSec5,
    isClassEdited, currentUserRole, store
  ]);


  // Validation / Save / Loading states
  const [saved, setSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const apiFieldToFormField: Record<string, string> = {
    regularScoreLevel: 'svStudyAttitude',
    academicRank: 'svAcademicRank',
    baseScore: 'svNoViolationScore',
    violations: 'svDeductions',
    politicalActivityLevel: 'svActivity1',
    cultureSportLevel: 'svActivity2',
    clubActivityLevel: 'svActivity3',
    socialPreventionLevel: 'svActivity4',
    rewardScore: 'svRewardPoints',
    lawComplianceLevel: 'svPolicy',
    volunteerActivityLevel: 'svSolidarity',
    communityRelationshipLevel: 'svLocality',
    studentRoleType: 'svRoleType',
    positionGroup: 'svCadrePosition',
    taskCompletionLevel: 'svCadrePerformance',
    managementSkillLevel: 'svManagementLevel',
    normalStudentActivityScore: 'svClassParticipation',
    specialAchievementLevel: 'svSpecialAchievement',
  };

  const mapApiErrorsToFields = (errors: unknown) => {
    const nextErrors: Record<string, string> = {};
    if (!Array.isArray(errors)) return nextErrors;

    errors.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const errorItem = item as { field?: unknown; property?: unknown; error?: unknown; message?: unknown };
      const rawField = String(errorItem.field ?? errorItem.property ?? '');
      const message = String(errorItem.error ?? errorItem.message ?? 'Dữ liệu không hợp lệ');
      const mappedEntry = Object.entries(apiFieldToFormField).find(([apiField]) =>
        rawField === apiField ||
        rawField.endsWith(`.${apiField}`) ||
        rawField.includes(apiField)
      );

      if (mappedEntry) {
        nextErrors[mappedEntry[1]] = message;
      }
    });

    return nextErrors;
  };

  // Mapping Helpers
  const mapStudyAttitude = (val: string) => {
    const dict = {
      very_good: 'GTE_9',
      good: 'FROM_7_TO_UNDER_9',
      fair: 'FROM_5_TO_UNDER_7',
      average: 'FROM_4_TO_UNDER_5',
      poor: 'FROM_1_TO_UNDER_4',
    };
    return dict[val as keyof typeof dict] || undefined;
  };

  const reverseMapStudyAttitude = (val: string) => {
    const dict = {
      GTE_9: 'very_good',
      FROM_7_TO_UNDER_9: 'good',
      FROM_5_TO_UNDER_7: 'fair',
      FROM_4_TO_UNDER_5: 'average',
      FROM_1_TO_UNDER_4: 'poor',
    };
    return dict[val as keyof typeof dict] || 'none';
  };

  const mapAcademicRank = (val: string) => {
    return val.toUpperCase();
  };

  const reverseMapAcademicRank = (val: string) => {
    return val.toLowerCase();
  };

  const mapActivity1 = (val: string) => {
    const dict = {
      GOOD_PARTICIPATION: 'GOOD_PARTICIPATION',
      ABSENT_ONCE: 'ABSENT_ONCE',
      ABSENT_TWICE: 'ABSENT_TWICE',
      ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
      active: 'GOOD_PARTICIPATION',
      full: 'ABSENT_ONCE',
      excused: 'ABSENT_TWICE',
      unexcused: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED';
  };

  const reverseMapActivity1 = (val: string) => {
    const dict = {
      GOOD_PARTICIPATION: 'GOOD_PARTICIPATION',
      ABSENT_ONCE: 'ABSENT_ONCE',
      ABSENT_TWICE: 'ABSENT_TWICE',
      ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
      MEDIUM_PARTICIPATION: 'ABSENT_ONCE',
      LOW_PARTICIPATION: 'ABSENT_TWICE',
      NO_PARTICIPATION: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED';
  };

  const mapActivity2 = (val: string) => {
    const dict = {
      many: 'FULL_EFFECTIVE_PARTICIPATION',
      some: 'EFFECTIVE_PARTICIPATION_FROM_HALF',
      active: 'ENCOURAGED_OTHERS',
      full: 'ABSENT_OVER_HALF',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || 'NOT_PARTICIPATED';
  };

  const reverseMapActivity2 = (val: string) => {
    const dict = {
      FULL_EFFECTIVE_PARTICIPATION: 'many',
      EFFECTIVE_PARTICIPATION_FROM_HALF: 'some',
      ENCOURAGED_OTHERS: 'active',
      ABSENT_OVER_HALF: 'full',
      NOT_PARTICIPATED: 'none',
    };
    return dict[val as keyof typeof dict] || 'none';
  };

  const mapActivity3 = (val: string) => {
    const dict = {
      prize_or_org: 'FULL_EFFECTIVE_PARTICIPATION',
      active: 'ACTIVE_ONE_OR_MORE',
      some: 'ACTIVE_SUPPORTER',
      full: 'ABSENT_OVER_HALF',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || 'NOT_PARTICIPATED';
  };

  const reverseMapActivity3 = (val: string) => {
    const dict = {
      FULL_EFFECTIVE_PARTICIPATION: 'prize_or_org',
      ACTIVE_ONE_OR_MORE: 'active',
      ACTIVE_SUPPORTER: 'some',
      ABSENT_OVER_HALF: 'full',
      NOT_PARTICIPATED: 'none',
    };
    return dict[val as keyof typeof dict] || 'none';
  };

  const mapActivity4 = (val: string) => {
    const dict = {
      active: 'MULTIPLE_ACTIVITIES_OR_REPORTING',
      full: 'ONE_EFFECTIVE_ACTIVITY',
      some: 'AWARENESS_OR_SUPPORT',
      none: 'REMINDED_VIOLATION',
    };
    return dict[val as keyof typeof dict] || 'REMINDED_VIOLATION';
  };

  const reverseMapActivity4 = (val: string) => {
    const dict = {
      MULTIPLE_ACTIVITIES_OR_REPORTING: 'active',
      ONE_EFFECTIVE_ACTIVITY: 'full',
      AWARENESS_OR_SUPPORT: 'some',
      REMINDED_VIOLATION: 'none',
    };
    return dict[val as keyof typeof dict] || 'none';
  };

  const mapPolicy = (val: string) => {
    const dict = {
      GOOD_WITH_REWARD: 'GOOD_WITH_REWARD',
      GOOD: 'GOOD',
      AVERAGE: 'AVERAGE',
      VIOLATED: 'VIOLATED',
      excellent_propaganda: 'GOOD_WITH_REWARD',
      good: 'GOOD',
      minor_violation: 'AVERAGE',
      none: 'VIOLATED',
    };
    return dict[val as keyof typeof dict] || 'VIOLATED';
  };

  const reverseMapPolicy = (val: string) => {
    const dict = {
      GOOD_WITH_REWARD: 'GOOD_WITH_REWARD',
      GOOD: 'GOOD',
      AVERAGE: 'AVERAGE',
      VIOLATED: 'VIOLATED',
      EXCELLENT: 'GOOD_WITH_REWARD',
      FAIR: 'AVERAGE',
      POOR: 'VIOLATED',
    };
    return dict[val as keyof typeof dict] || 'VIOLATED';
  };

  const mapSolidarity = (val: string) => {
    const dict = {
      excellent_achievements: 'ACTIVE_WITH_REWARD',
      regular: 'ACTIVE',
      some: 'PARTICIPATED',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || 'NOT_PARTICIPATED';
  };

  const reverseMapSolidarity = (val: string) => {
    const dict = {
      ACTIVE_WITH_REWARD: 'excellent_achievements',
      ACTIVE: 'regular',
      PARTICIPATED: 'some',
      NOT_PARTICIPATED: 'none',
    };
    return dict[val as keyof typeof dict] || 'none';
  };

  const mapLocality = (val: string) => {
    const dict = {
      GOOD: 'GOOD',
      ONE_WARNING: 'ONE_WARNING',
      TWO_WARNINGS: 'TWO_WARNINGS',
      good: 'GOOD',
      rewarded: 'ONE_WARNING',
      warned: 'TWO_WARNINGS',
    };
    return dict[val as keyof typeof dict] || 'TWO_WARNINGS';
  };

  const reverseMapLocality = (val: string) => {
    const dict = {
      GOOD: 'GOOD',
      ONE_WARNING: 'ONE_WARNING',
      TWO_WARNINGS: 'TWO_WARNINGS',
      FAIR: 'ONE_WARNING',
      POOR: 'TWO_WARNINGS',
    };
    return dict[val as keyof typeof dict] || 'TWO_WARNINGS';
  };

  const mapCadrePerformance = (val: string) => {
    const dict = {
      excellent: 'EXCELLENT',
      good: 'GOOD',
      average: 'FAIR',
      unsatisfactory: 'POOR',
    };
    return dict[val as keyof typeof dict] || 'POOR';
  };

  const reverseMapCadrePerformance = (val: string) => {
    const dict = {
      EXCELLENT: 'excellent',
      GOOD: 'good',
      FAIR: 'average',
      POOR: 'unsatisfactory',
    };
    return dict[val as keyof typeof dict] || 'unsatisfactory';
  };

  const mapManagementLevel = (val: string) => {
    const dict = {
      head: 'HEAD_POSITION',
      deputy: 'DEPUTY_POSITION',
      member: 'MEMBER_POSITION',
    };
    return dict[val as keyof typeof dict] || undefined;
  };

  const reverseMapManagementLevel = (val: string) => {
    const dict = {
      HEAD_POSITION: 'head',
      DEPUTY_POSITION: 'deputy',
      MEMBER_POSITION: 'member',
    };
    return dict[val as keyof typeof dict] || 'none';
  };

  const mapSpecialAchievement = (val: string) => {
    const dict = {
      national_intl: 'NATIONAL_OR_INTL',
      provincial: 'PROVINCIAL_LEVEL',
      none: 'NONE',
    };
    return dict[val as keyof typeof dict] || 'NONE';
  };

  const reverseMapSpecialAchievement = (val: string) => {
    const dict = {
      NATIONAL_OR_INTL: 'national_intl',
      PROVINCIAL_LEVEL: 'provincial',
      NONE: 'none',
    };
    return dict[val as keyof typeof dict] || 'none';
  };

  // Reset fields function for fresh evaluations
  const resetFormFields = () => {
    setSvStudyAttitude('none');
    setSvNckh(false);
    setSvOlympic(false);
    setSvCreative(false);
    setSvAcademicRank('none');
    setSvNoViolationScore(0);
    setSvDeductions([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setSvActivity1('ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED');
    setSvActivity2('none');
    setSvActivity3('none');
    setSvActivity4('none');
    setSvRewardPoints(0);
    setSvPolicy('VIOLATED');
    setSvSolidarity('none');
    setSvLocality('TWO_WARNINGS');
    setSvRoleType('student');
    setSvCadrePosition('a2');
    setSvCadrePerformance('unsatisfactory');
    setSvManagementLevel('none');
    setSvClassParticipation(0);
    setSvSpecialAchievement('none');

    // Reset class columns directly in store (no local class state)
    store.getState().batchSet({
      classStudyAttitude: 'none',
      classNckh: false,
      classOlympic: false,
      classCreative: false,
      classAcademicRank: 'none',
      classNoViolationScore: 0,
      classDeductions: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      classActivity1: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
      classActivity2: 'none',
      classActivity3: 'none',
      classActivity4: 'none',
      classRewardPoints: 0,
      classPolicy: 'VIOLATED',
      classSolidarity: 'none',
      classLocality: 'TWO_WARNINGS',
      classRoleType: 'student',
      classCadrePosition: 'a2',
      classCadrePerformance: 'unsatisfactory',
      classManagementLevel: 'none',
      classClassParticipation: 0,
      classSpecialAchievement: 'none',
      isClassViolationSec1: false,
      isClassViolationSec2: false,
      isClassViolationSec3: false,
      isClassViolationSec4: false,
      isClassViolationSec5: false,
    });

	    setNote('');
	    setEvaluationWorkflow(null);
	    setIsClassEdited(false);
    setIsSvViolationSec1(false);
    setIsSvViolationSec2(false);
    setIsSvViolationSec3(false);
    setIsSvViolationSec4(false);
    setIsSvViolationSec5(false);
  };


  // Helper method to load details of a specific evaluation
  const loadEvaluationDetails = async (targetId: string) => {
    try {
      setEvaluationId(targetId);
      resetFormFields();
      const detailRes = await API_Student.getEvaluationDetail(targetId);
      const detail = (detailRes.data || detailRes) as any;
      if (detail.phone) setPhoneNumber(detail.phone);
      if (detail.note) setNote(detail.note);
	      const detailSemester = typeof detail.semester === 'object' ? detail.semester.semester : detail.semester;
	      if (detailSemester) setSemester(normalizeSemesterCode(detailSemester));
      const detailAcademicYear = typeof detail.semester === 'object' ? detail.semester.academicYear || `${detail.semester.year}-${detail.semester.year + 1}` : detail.academicYear;
      if (detailAcademicYear) setAcademicYear(detailAcademicYear);
	      if (detail.semesterId || detail.semester?.id) setSelectedSemesterId(detail.semesterId || detail.semester.id);
	      setEvaluationWorkflow({
	        status: detail.status,
	        statusLabel: detail.statusLabel,
	        steps: detail.review?.steps,
	      });
	      applyEvaluationLockState(detail);

      const studyData = detail.sections?.study || {};
      const discData = detail.sections?.discipline || {};
      const actData = detail.sections?.activity || {};
      const commData = detail.sections?.community || {};
      const roleData = detail.sections?.role || {};

      if (studyData.regularScoreLevel) setSvStudyAttitude(reverseMapStudyAttitude(studyData.regularScoreLevel));
      if (studyData.academicRank) setSvAcademicRank(reverseMapAcademicRank(studyData.academicRank));
      if (studyData.activities) {
        setSvNckh(studyData.activities.some((a: any) => a.code === 'ACADEMIC_EVENT_PARTICIPATION'));
        setSvOlympic(studyData.activities.some((a: any) => a.code === 'SCIENTIFIC_PUBLICATION_OR_CONTEST'));
        setSvCreative(studyData.activities.some((a: any) => a.code === 'SCIENTIFIC_AWARD'));
      }

      const disciplineViolations = Array.isArray(discData.violations) ? discData.violations : [];

      if (discData.baseScore !== undefined) {
        const hasDisciplineInput = Number(discData.score) > 0 || disciplineViolations.length > 0;
        setSvNoViolationScore(hasDisciplineInput ? Math.min(25, Math.max(0, Number(discData.baseScore) || 0)) : 0);
      }
      if (discData.violations) {
        const dec = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        disciplineViolations.forEach((v: any) => {
          const codeIndex = DISCIPLINE_VIOLATION_CODES.indexOf(v.code);
          const legacyIndex = String(v.code || '').startsWith('DEDUCT_')
            ? parseInt(String(v.code).replace('DEDUCT_', ''), 10) - 1
            : -1;
          const num = codeIndex >= 0 ? codeIndex : legacyIndex;
          if (num >= 0 && num < 9) {
            dec[num] = Number(v.count) || 0;
          }
        });
        setSvDeductions(dec);
      }

      if (actData.politicalActivityLevel) setSvActivity1(reverseMapActivity1(actData.politicalActivityLevel));
      if (actData.cultureSportLevel) setSvActivity2(reverseMapActivity2(actData.cultureSportLevel));
      if (actData.clubActivityLevel) setSvActivity3(reverseMapActivity3(actData.clubActivityLevel));
      if (actData.socialPreventionLevel) setSvActivity4(reverseMapActivity4(actData.socialPreventionLevel));
      if (actData.rewardScore !== undefined) setSvRewardPoints(actData.rewardScore);

      if (commData.lawComplianceLevel) setSvPolicy(reverseMapPolicy(commData.lawComplianceLevel));
      if (commData.volunteerActivityLevel) setSvSolidarity(reverseMapSolidarity(commData.volunteerActivityLevel));
      if (commData.communityRelationshipLevel) setSvLocality(reverseMapLocality(commData.communityRelationshipLevel));

      if (roleData.studentRoleType) setSvRoleType(roleData.studentRoleType === 'CLASS_OFFICER' ? 'cadre' : 'student');
      if (roleData.positionGroup) setSvCadrePosition(roleData.positionGroup === 'LEADER_GROUP' ? 'a1' : 'a2');
      if (roleData.taskCompletionLevel) setSvCadrePerformance(reverseMapCadrePerformance(roleData.taskCompletionLevel));
      if (roleData.managementSkillLevel) setSvManagementLevel(reverseMapManagementLevel(roleData.managementSkillLevel));
      if (roleData.normalStudentActivityScore !== undefined) setSvClassParticipation(roleData.normalStudentActivityScore);
      if (roleData.specialAchievementLevel) setSvSpecialAchievement(reverseMapSpecialAchievement(roleData.specialAchievementLevel));

      // Push all loaded values into the Zustand store at once
      // (state setters above are async; we read latest values directly from the API response)
      store.getState().batchSet({
        svStudyAttitude: studyData.regularScoreLevel ? reverseMapStudyAttitude(studyData.regularScoreLevel) : 'none',
        svNckh: studyData.activities?.some((a: any) => a.code === 'ACADEMIC_EVENT_PARTICIPATION') ?? false,
        svOlympic: studyData.activities?.some((a: any) => a.code === 'SCIENTIFIC_PUBLICATION_OR_CONTEST') ?? false,
        svCreative: studyData.activities?.some((a: any) => a.code === 'SCIENTIFIC_AWARD') ?? false,
        svAcademicRank: studyData.academicRank ? reverseMapAcademicRank(studyData.academicRank) : 'none',
        svActivity1: actData.politicalActivityLevel ? reverseMapActivity1(actData.politicalActivityLevel) : 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
        svActivity2: actData.cultureSportLevel ? reverseMapActivity2(actData.cultureSportLevel) : 'none',
        svActivity3: actData.clubActivityLevel ? reverseMapActivity3(actData.clubActivityLevel) : 'none',
        svActivity4: actData.socialPreventionLevel ? reverseMapActivity4(actData.socialPreventionLevel) : 'none',
        svRewardPoints: actData.rewardScore ?? 0,
        svPolicy: commData.lawComplianceLevel ? reverseMapPolicy(commData.lawComplianceLevel) : 'VIOLATED',
        svSolidarity: commData.volunteerActivityLevel ? reverseMapSolidarity(commData.volunteerActivityLevel) : 'none',
        svLocality: commData.communityRelationshipLevel ? reverseMapLocality(commData.communityRelationshipLevel) : 'TWO_WARNINGS',
        svRoleType: roleData.studentRoleType === 'CLASS_OFFICER' ? 'cadre' : 'student',
        svCadrePosition: roleData.positionGroup === 'LEADER_GROUP' ? 'a1' : 'a2',
        svCadrePerformance: roleData.taskCompletionLevel ? reverseMapCadrePerformance(roleData.taskCompletionLevel) : 'unsatisfactory',
        svManagementLevel: roleData.managementSkillLevel ? reverseMapManagementLevel(roleData.managementSkillLevel) : 'none',
        svClassParticipation: roleData.normalStudentActivityScore ?? 0,
        svSpecialAchievement: roleData.specialAchievementLevel ? reverseMapSpecialAchievement(roleData.specialAchievementLevel) : 'none',
        isReadOnly: !canEditEvaluation(detail),
        currentUserRole,
      });

    } catch (secErr) {
      console.error('Failed to load score sections:', secErr);
    }
  };

  // Sync helper methods for URL parameters
	  const setEvaluationUrlParam = (id?: string | null) => {
	    if (!id) return;
	    const params = new URLSearchParams();
	    params.set('id', id);
	    router.replace(`${pathname}?${params.toString()}`);
	  };

  const clearUrlParams = () => {
    router.replace(pathname);
  };

  const [step, setStep] = useState<number>(1);
  const [evaluationsList, setEvaluationsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

	useEffect(() => {
	  const loadAvailableSemesters = async () => {
	    try {
	      const data = await API_Student.getSemesters();
	      const items = Array.isArray(data) ? data : [];
	      setAvailableSemesters(items);
	    } catch (err) {
	      console.error('Failed to load available semesters:', err);
	      toast.error(getUserFriendlyError(err, 'Không thể tải danh sách học kỳ. Vui lòng thử lại sau.'));
      }
    };

    loadAvailableSemesters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load evaluations list once on mount
  useEffect(() => {
    const loadMyEvals = async () => {
      try {
        const res = await API_Student.getMyEvaluations();
        const data = res.data || res;
        if (Array.isArray(data)) {
          setEvaluationsList(data);
        }
      } catch (err) {
        console.error('Failed to load evaluations list:', err);
      }
    };
    loadMyEvals();
  }, []);

	  const academicYearOptions = useMemo(() => {
	    const map = new Map<string, string>();
	    availableSemesters.forEach((item: any) => {
	      const year = getAcademicYearValue(item);
	      if (year) map.set(year, year);
	    });
	    return Array.from(map.values()).sort((a, b) => b.localeCompare(a));
	  }, [availableSemesters]);

	  const normalizeSemesterCode = (value?: string) => {
	    if (value === 'SEMESTER_1') return 'HK1';
	    if (value === 'SEMESTER_2') return 'HK2';
	    if (value === 'HKHE' || value === 'SEMESTER_SUMMER') return 'SUMMER';
	    return value || '';
	  };

	  function getAcademicYearValue(item: any) {
	    return item?.academicYear || (typeof item?.year === 'number' ? `${item.year}-${item.year + 1}` : '');
	  }

  const semesterOptions = useMemo(() => {
    const options = [
      { code: 'HK1', label: 'Học kỳ 1' },
      { code: 'HK2', label: 'Học kỳ 2' },
      { code: 'SUMMER', label: 'Học kỳ hè' },
    ];

	    return options.map((option) => {
	      const matched = availableSemesters.find((item: any) => {
	        const year = getAcademicYearValue(item);
	        const code = normalizeSemesterCode(item.semester || item.code);
	        return year === academicYear && code === option.code;
	      });

      return {
        ...matched,
        id: matched?.id || '',
        code: option.code,
        label: matched?.semesterName || matched?.name || option.label,
        isActive: matched?.isActive ?? false,
      };
    });
  }, [academicYear, availableSemesters]);

  const getSemesterOptionLabel = (item: any) => item.label || item.semesterName || item.name || item.semester || item.code || 'Học kỳ';

	  const findSemesterConfig = (targetSem: string, targetYear: string, targetSemesterId?: string) => {
	    return availableSemesters.find((item: any) => {
	      const itemYear = getAcademicYearValue(item);
	      const itemCode = normalizeSemesterCode(item.semester || item.code);

	      if (targetSemesterId && item.id === targetSemesterId) return true;
	      return itemYear === targetYear && itemCode === targetSem;
    });
  };

  const findEvaluationForPeriod = (list: any[], targetSem: string, targetYear: string, targetSemesterId?: string) => {
	    return list.find((ev) => {
	      const evSem = ev.semester && typeof ev.semester === 'object' ? ev.semester.semester : ev.semester;
	      const evYear = ev.semester && typeof ev.semester === 'object'
	        ? getAcademicYearValue(ev.semester)
	        : ev.academicYear;
	      const evSemesterId = ev.semesterId || ev.semester?.id;
	      return evSemesterId === targetSemesterId || (normalizeSemesterCode(evSem) === targetSem && evYear === targetYear);
	    });
	  };

		  const openExistingEvaluation = async (match: any) => {
	    setEvaluationWorkflow({
	      status: match.status,
	      statusLabel: match.statusLabel,
	      steps: match.review?.steps,
	    });
	    applyEvaluationLockState(match);

    setLoading(true);
    try {
      await loadEvaluationDetails(match.id);
    } catch (err) {
      console.error('Failed to load details:', err);
    } finally {
      setLoading(false);
    }

	    setEvaluationId(match.id);
	    setStep(2);
	    setEvaluationUrlParam(match.id);
  };

  const changeSemester = (semesterCode: string) => {
	    const selected = availableSemesters.find((item: any) => {
	      const year = getAcademicYearValue(item);
	      const code = normalizeSemesterCode(item.semester || item.code);
	      return year === academicYear && code === semesterCode;
	    });

    setSelectedSemesterId(selected?.id || '');
    setSemester(semesterCode);
  };

	  const changeAcademicYear = (year: string) => {
	    setAcademicYear(year);
	    setSelectedSemesterId('');
	    setSemester('');
	  };

  // Check status and date gates before proceeding
  const handleCheckAndProceed = async (targetSem: string, targetYear: string, targetSemesterId = selectedSemesterId) => {
    if (!targetSem || !targetYear) return;
    const selectedSemester = findSemesterConfig(targetSem, targetYear, targetSemesterId);
    const resolvedSemesterId = selectedSemester?.id || targetSemesterId;
    const match = findEvaluationForPeriod(evaluationsList, targetSem, targetYear, resolvedSemesterId);

	    if (match) {
	      await openExistingEvaluation(match);
	      return;
	    }

    if (!resolvedSemesterId || !selectedSemester?.isActive) {
      try {
        const refreshed = await API_Student.getMyEvaluations();
        const refreshedList = refreshed.data || refreshed;
        const list = Array.isArray(refreshedList) ? refreshedList : [];
        setEvaluationsList(list);
        const existing = findEvaluationForPeriod(list, targetSem, targetYear, resolvedSemesterId);

        if (existing) {
          await openExistingEvaluation(existing);
          return;
        }
      } catch (reloadErr) {
        console.error('Failed to reload existing evaluation:', reloadErr);
      }

      toast.error('Học kỳ này chưa mở đánh giá rèn luyện.');
      return;
    }

    // Create new evaluation when this period has no existing form.
		    setIsReadOnly(false);
		    setIsLocked(false);
		    setAlreadyEvaluated(false);
    try {
      setLoading(true);
      const newEvalRes = await API_Student.createEvaluation({ semester: targetSem, academicYear: targetYear });
      const newEval = (newEvalRes.data || newEvalRes) as any;
      setEvaluationId(newEval.id);
      setEvaluationWorkflow({
        status: newEval.status || 'DRAFT',
        statusLabel: newEval.statusLabel,
        steps: newEval.review?.steps,
      });
      applyEvaluationLockState({
        ...newEval,
        status: newEval.status || 'DRAFT',
        isLocked: newEval.isLocked ?? false,
        semesterIsActive: newEval.semesterIsActive ?? true,
      });
      resetFormFields();
      setStep(2);
      setEvaluationUrlParam(newEval.id);
    } catch (err: any) {
      const message = getUserFriendlyError(err, 'Không thể tạo phiếu đánh giá.');
      if (err.statusCode === 409 || message.includes('đã tồn tại')) {
        try {
          const refreshed = await API_Student.getMyEvaluations();
          const refreshedList = refreshed.data || refreshed;
          const list = Array.isArray(refreshedList) ? refreshedList : [];
          setEvaluationsList(list);
          const existing = findEvaluationForPeriod(list, targetSem, targetYear, resolvedSemesterId);

          if (existing) {
            await openExistingEvaluation(existing);
            return;
          }
        } catch (reloadErr) {
          console.error('Failed to reload existing evaluation:', reloadErr);
        }
      }

      toast.error(message);
      setStep(1);
      clearUrlParams();
    } finally {
      setLoading(false);
    }
  };

  // Sync state with URL query parameters
  useEffect(() => {
    const idParam = searchParams.get('id');
    const semParam = searchParams.get('semester');
    const yearParam = searchParams.get('year');

    if (idParam) {
      if (evaluationId === idParam && step === 2) return;

      setLoading(true);
      loadEvaluationDetails(idParam)
        .then(() => {
          setStep(2);
        })
        .catch((err) => {
          console.error('Failed to load evaluation detail from URL:', err);
          toast.error(getUserFriendlyError(err, 'Không thể tải chi tiết phiếu đánh giá.'));
          setStep(1);
        })
        .finally(() => setLoading(false));
      return;
    }

	    const semesterFromUrl = availableSemesters.find((item: any) => {
	      const itemYear = getAcademicYearValue(item);
	      return normalizeSemesterCode(item.semester || item.code) === semParam && itemYear === yearParam;
	    });

    if (semParam && yearParam && semesterFromUrl) {
      if (semester !== semParam || academicYear !== yearParam) {
	        setSelectedSemesterId(semesterFromUrl.id);
	        setSemester(normalizeSemesterCode(semesterFromUrl.semester || semesterFromUrl.code));
	        setAcademicYear(yearParam);
	      }
      if (step !== 1) {
        setStep(1);
      }
    } else if (!semParam || !yearParam) {
      if (step !== 1) {
        setStep(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, evaluationsList, step, semester, academicYear, availableSemesters]);

  const handleStartEvaluation = () => {
    const selected = findSemesterConfig(semester, academicYear, selectedSemesterId);
    if (selected?.id && selected.id !== selectedSemesterId) {
      setSelectedSemesterId(selected.id);
    }

    handleCheckAndProceed(semester, academicYear, selected?.id || selectedSemesterId);
  };

  const handleGoBackToStep1 = () => {
    clearUrlParams();
    setStep(1);
  };


  // Note: All score computation (calculateTotalPoints equivalent) is now done
  // in the Zustand evaluationFormStore via computeEvaluationScores(). 
  // EvaluationTableGrid reads scores directly from store — no local state needed.

  // Validation function for evidence attachments
  const validateForm = (): { message: string; field?: string } | null => {
    setValidationError(null);
    setFieldErrors({});
    setSaved(false);

    // Checks for SV
    if (svNckh && (!uploadedFiles['sv_nckh'] || uploadedFiles['sv_nckh'].length === 0)) {
      return { field: 'svNckh', message: 'Vui lòng tải minh chứng cho hoạt động Nghiên cứu khoa học.' };
    }
    if (svOlympic && (!uploadedFiles['sv_olympic'] || uploadedFiles['sv_olympic'].length === 0)) {
      return { field: 'svOlympic', message: 'Vui lòng tải minh chứng cho hoạt động thi Olympic học thuật.' };
    }
    if (svCreative && (!uploadedFiles['sv_creative'] || uploadedFiles['sv_creative'].length === 0)) {
      return { field: 'svCreative', message: 'Vui lòng tải minh chứng cho hoạt động Câu lạc bộ học thuật.' };
    }
    if (svRewardPoints > 0 && (!uploadedFiles['sv_reward'] || uploadedFiles['sv_reward'].length === 0)) {
      return { field: 'svRewardPoints', message: 'Vui lòng tải minh chứng cho Khen thưởng hoạt động của sinh viên.' };
    }
    if (svPolicy === 'GOOD_WITH_REWARD' && (!uploadedFiles['sv_policy'] || uploadedFiles['sv_policy'].length === 0)) {
      return { field: 'svPolicy', message: 'Vui lòng tải minh chứng cho việc Tuyên truyền chính sách pháp luật đạt xuất sắc.' };
    }
    if (svSolidarity === 'excellent_achievements' && (!uploadedFiles['sv_solidarity'] || uploadedFiles['sv_solidarity'].length === 0)) {
      return { field: 'svSolidarity', message: 'Vui lòng tải minh chứng cho các thành tích đoàn kết giúp đỡ bạn bè đặc biệt.' };
    }

    if (svRoleType === 'cadre' && svCadrePerformance === 'excellent') {
      const key = 'sv_cadre_perf';
      if (!uploadedFiles[key] || uploadedFiles[key].length === 0) {
        return { field: 'svCadrePerformance', message: 'Vui lòng tải minh chứng Hoàn thành xuất sắc nhiệm vụ của Lớp trưởng/Bí thư.' };
      }
    }
    if (svRoleType === 'student' && (svSpecialAchievement === 'national_intl' || svSpecialAchievement === 'provincial')) {
      if (!uploadedFiles['sv_special_ach'] || uploadedFiles['sv_special_ach'].length === 0) {
        return { field: 'svSpecialAchievement', message: 'Vui lòng tải minh chứng cho giải thưởng/thành tích đặc biệt.' };
      }
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationResult = validateForm();
    if (validationResult) {
      setValidationError(validationResult.message);
      setFieldErrors(validationResult.field ? { [validationResult.field]: validationResult.message } : {});
      toast.error(validationResult.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    try {
      let currentId = evaluationId;
      if (!currentId) {
        const createRes = await API_Student.createEvaluation({ semester, academicYear });
        const created = createRes.data || createRes;
        currentId = created.id;
        setEvaluationId(created.id);
      }
      // Save latest updates to the draft
      await API_Student.updateEvaluationDraft(currentId!, {
        phone: phoneNumber,
        note: note,
      });

      // Always read from store at submit time — EvaluationTableGrid writes
      // directly to the store, so store holds the latest user-edited values.
      const s = store.getState();

      const compactPayload = (payload: Record<string, unknown>) =>
        Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
      const studyPayload = compactPayload({
        regularScoreLevel: mapStudyAttitude(s.svStudyAttitude),
        academicRank: mapAcademicRank(s.svAcademicRank),
        activities: [
          { code: 'ACADEMIC_EVENT_PARTICIPATION', checked: s.svNckh, score: 2 },
          { code: 'SCIENTIFIC_PUBLICATION_OR_CONTEST', checked: s.svOlympic, score: 2 },
          { code: 'SCIENTIFIC_AWARD', checked: s.svCreative, score: 2 },
        ].filter((activity) => activity.checked),
      });
      const rolePayload =
        s.svRoleType === 'cadre'
          ? compactPayload({
              studentRoleType: 'CLASS_OFFICER',
              positionGroup: s.svCadrePosition === 'a1' ? 'LEADER_GROUP' : 'MEMBER_GROUP',
              taskCompletionLevel: mapCadrePerformance(s.svCadrePerformance),
              managementSkillLevel: mapManagementLevel(s.svManagementLevel),
              specialAchievementLevel: mapSpecialAchievement(s.svSpecialAchievement),
            })
          : compactPayload({
              studentRoleType: 'NORMAL_STUDENT',
              normalStudentActivityScore: s.svClassParticipation,
              specialAchievementLevel: mapSpecialAchievement(s.svSpecialAchievement),
            });
      const disciplineViolations = s.svDeductions.map((count, idx) => ({
        code: DISCIPLINE_VIOLATION_CODES[idx],
        count,
        deductScore: DISCIPLINE_DEDUCTION_WEIGHTS[idx],
      })).filter((violation) => violation.count > 0);

      // Save detailed score sections
      const saveRequests: Array<Promise<unknown>> = [
        API_Student.updateActivityScore(currentId!, {
          politicalActivityLevel: mapActivity1(s.svActivity1),
          cultureSportLevel: mapActivity2(s.svActivity2),
          clubActivityLevel: mapActivity3(s.svActivity3),
          socialPreventionLevel: mapActivity4(s.svActivity4),
          rewardScore: s.svRewardPoints
        }),
        API_Student.updateCommunityScore(currentId!, {
          lawComplianceLevel: mapPolicy(s.svPolicy),
          volunteerActivityLevel: mapSolidarity(s.svSolidarity),
          communityRelationshipLevel: mapLocality(s.svLocality)
        }),
        API_Student.updateRoleScore(currentId!, rolePayload)
      ];

      saveRequests.unshift(API_Student.updateDisciplineScore(currentId!, {
        baseScore: Math.min(25, Math.max(0, Number(s.svNoViolationScore) || 0)),
        violations: disciplineViolations,
      }));

      if (
        studyPayload.regularScoreLevel ||
        studyPayload.academicRank ||
        (Array.isArray(studyPayload.activities) && studyPayload.activities.length > 0)
      ) {
        saveRequests.unshift(API_Student.updateStudyScore(currentId!, studyPayload));
      }


      await Promise.all(saveRequests);
      await API_Student.submitEvaluation(currentId!);
      
      setIsSubmitting(false);
      setValidationError(null);
      setFieldErrors({});
      localStorage.removeItem('evaluation_draft_qd4185');
      toast.success('Gửi phiếu đánh giá thành công.');
      router.replace('/student/history');
    } catch (err: any) {
      setIsSubmitting(false);
      const message = getUserFriendlyError(err, 'Lỗi gửi duyệt phiếu đánh giá.');
      toast.error(message);
      const apiFieldErrors = mapApiErrorsToFields(err.errors);
      if (message.includes('đã đóng') || message.includes('đã bị khóa')) {
        setIsReadOnly(true);
        setIsLocked(true);
      }
      setFieldErrors(apiFieldErrors);
      setValidationError(message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  // ── Inject file callbacks into store ──────────────────────────────────────
  // The actual upload logic lives here in the page controller (Cloudinary, toast, etc.)
  // We push stable handler references into the store so EvaluationTableGrid can
  // call them without needing any prop. Updated whenever the handlers change.
  useEffect(() => {
    store.getState().batchSet({
      handleFileUploadAction: handleFileUpload,
      removeFileAction: removeFile,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]); // store ref is stable; handlers close over stable setters

  // ── Sync fieldErrors into store when validation runs ─────────────────────
  useEffect(() => {
    store.getState().batchSet({ fieldErrors });
  }, [fieldErrors, store]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full pb-28">
      {step === 1 ? (
        /* Step 1: Chọn kỳ đánh giá */
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6 my-12 transition-all duration-300 transform ease-out animate-fade-in">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Calendar size={24} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">Chọn kỳ đánh giá rèn luyện</h2>
	            <p className="text-xs text-gray-500 font-semibold leading-relaxed">
	              Vui lòng chọn năm học trước, sau đó chọn học kỳ muốn thực hiện tự đánh giá.
	            </p>
          </div>

            {/* Dropdown: Năm học */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Năm học *</label>
              <select
                value={academicYear}
                onChange={(e) => changeAcademicYear(e.target.value)}
                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white font-semibold ${
                  academicYear === '' ? 'text-gray-400 font-medium' : 'text-gray-700'
                }`}
              >
                <option value="" className="text-gray-400 font-medium">-- Chọn năm học --</option>
                {academicYearOptions.map((year) => (
                  <option key={year} value={year} className="text-gray-700">
                    {year}
                  </option>
                ))}
              </select>
            </div>

          <div className="space-y-4">
            {/* Dropdown: Học kỳ */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1.5">Học kỳ đánh giá *</label>
	              <select
	                value={semester}
	                onChange={(e) => changeSemester(e.target.value)}
	                disabled={!academicYear}
	                className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-10 bg-white font-semibold disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${
	                  semester === '' ? 'text-gray-400 font-medium' : 'text-gray-700'
	                }`}
	              >
	                <option value="" className="text-gray-400 font-medium">
	                  {academicYear ? '-- Chọn học kỳ --' : '-- Chọn năm học trước --'}
	                </option>
	                {semesterOptions.map((item: any) => (
	                  <option key={item.code} value={item.code} className="text-gray-700">
	                    {getSemesterOptionLabel(item)}
	                  </option>
	                ))}
	              </select>
	              {!academicYear && (
	                <p className="mt-1.5 text-xs font-semibold text-gray-400">
	                  Chọn năm học để tiếp tục chọn học kỳ.
	                </p>
	              )}
	            </div>
	          </div>

          <button
            onClick={handleStartEvaluation}
            disabled={loading || semester === '' || academicYear === ''}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl text-xs sm:text-sm font-bold transition duration-200 cursor-pointer shadow-sm min-h-[44px]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Đang đối soát dữ liệu...
              </>
            ) : (
              'Tiếp tục bắt đầu đánh giá'
            )}
          </button>
        </div>
      ) : (
        /* Step 2: Form chi tiết */
        <div className="space-y-6 transition-all duration-300 transform ease-in animate-fade-in">
          


          {/* Validation Message */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800 animate-shake">
              <AlertTriangle className="shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm">Không thể nộp phiếu</h4>
                <p className="text-xs mt-1">{validationError}</p>
              </div>
            </div>
          )}

          {uploadingEvidence && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-blue-800">
              <Loader2 className="shrink-0 mt-0.5 animate-spin" />
              <div>
                <h4 className="font-bold text-sm">Đang tải minh chứng</h4>
                <p className="text-xs mt-1">Vui lòng chờ trong giây lát.</p>
              </div>
            </div>
          )}

          {/* Save Success Message */}
          {saved && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 text-green-800">
              <CheckCircle className="shrink-0 mt-0.5 text-green-600" />
              <div>
                <h4 className="font-bold text-sm">Gửi thông tin thành công!</h4>
                <p className="text-xs mt-1">Đã cập nhật kết quả tự đánh giá rèn luyện học kỳ này.</p>
              </div>
            </div>
          )}

          {/* Read-only Mode Indicator */}
          {isReadOnly && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
              <Info className="shrink-0 mt-0.5 text-amber-600" />
              <div>
                <h4 className="font-bold text-sm">Chế độ Chỉ xem</h4>
                <p className="text-xs mt-1">
                  {alreadyEvaluated
                    ? 'Học kỳ này đã đánh giá.'
                    : isLocked
                      ? 'Học kỳ này đã kết thúc, phiếu chỉ ở chế độ xem.'
                      : 'Phiếu này đã được gửi hoặc phê duyệt, không thể chỉnh sửa.'}
                </p>
              </div>
            </div>
          )}

          {/* Styled details card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Top Red Tab & Breadcrumbs flow */}
            <div className="flex flex-col md:flex-row md:items-center justify-between bg-gray-50 border-b border-gray-200">
              {/* Left Red Tab */}
              <div className="bg-[#D93A3C] text-white px-5 py-2.5 flex items-center gap-2 font-bold text-xs sm:text-sm shrink-0 rounded-r-3xl shadow-sm">
                <span className="text-xs">👤</span>
                <span>{(user as any)?.fullName || 'Nguyễn Thanh Sơn'}</span>
              </div>
              {/* Right Steps Indicator */}
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-gray-500 px-4 py-2.5 md:py-0 select-none">
                <button
                  type="button"
                  onClick={handleGoBackToStep1}
                  className="text-gray-400 hover:text-[#D93A3C] transition cursor-pointer underline decoration-dotted decoration-gray-300 font-extrabold"
                >
                  📅 Chọn Học kỳ
                </button>
                <span className="text-gray-300">/</span>
                <span className="text-gray-400">📝 Đánh giá Kết quả Rèn luyện</span>
                <span className="text-gray-300">/</span>
                <div className="flex items-center gap-1.5 bg-[#D93A3C] text-white px-3 py-1 rounded-full relative">
                  <span>📄 Phiếu Đánh giá</span>
                  <span className="bg-red-600 border border-white text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">50</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Title with Spreadsheet icon */}
              <div className="flex items-start gap-3 border-b border-gray-100 pb-3">
                <div className="text-2xl mt-0.5 select-none">📊</div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-gray-800 leading-snug">
                    BẢNG ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA SINH VIÊN:{' '}
                    <span className="text-[#D93A3C]">
                      HỌC KỲ {semester === 'HK1' ? 'I' : semester === 'HK2' ? 'II' : 'HÈ'} - NĂM HỌC {academicYear}
                    </span>
                  </h2>
                </div>
              </div>

              {/* Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-12 text-xs sm:text-sm text-gray-700">
                <div className="space-y-1.5">
                  <p className="font-semibold">
                    <span className="font-bold text-gray-800">Họ tên:</span> {(user as any)?.fullName || 'Nguyễn Thanh Sơn'}
                  </p>
                  <p className="font-semibold">
                    <span className="font-bold text-gray-800">MSSV:</span> {(user as any)?.studentCode || '29211162749'}
                  </p>
                  <p className="font-semibold uppercase">
                    <span className="font-bold text-gray-800">Khoa:</span> {((user as any)?.facultyName || (user as any)?.majorName || 'Trường Đào tạo Quốc tế').toUpperCase()}
                  </p>
                </div>
                <div className="space-y-1.5 md:text-right">
                  <p className="font-semibold">
                    <span className="font-bold text-gray-800">Hạn Đánh giá:</span> Từ 09/06/2026 đến 30/06/2026
                  </p>
                </div>
              </div>
            </div>
          </div>

	          {alreadyEvaluated && (
	            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
	              <Info className="shrink-0 mt-0.5 text-amber-600" />
	              <p className="text-sm font-bold">Học kỳ này đã đánh giá</p>
	            </div>
	          )}

          {/* ── EvaluationTableGrid: all state sourced from Zustand store ── */}
	          <EvaluationFormStoreContext.Provider value={store}>
	            <EvaluationTableGrid />
	          </EvaluationFormStoreContext.Provider>


          {/* Action Buttons */}
          {!isReadOnly && (
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6 bg-white p-5 rounded-xl shadow-sm">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer text-xs font-bold min-h-[44px] disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-1.5">
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                    Đang gửi...
                  </span>
                ) : (
                  <>
                    <Send size={14} />
                    Gửi phê duyệt
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EvaluationFormQD4185;
