'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { API_URL } from '../../api/api';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { uploadEvidenceFile } from '../../services/cloudinaryUpload';
import { useToast } from '../../components/common/ToastProvider';
import { getUserFriendlyError } from '../../utils/errorHelper';
import { CRITERIA_CODES } from '../../constants/evaluationEnums';

// Sub-components
import { EvaluationTableGrid } from '../../components/student/EvaluationTableGrid';
import type { UploadedEvidenceFile } from '@/types/student';
import {
  createEvaluationFormStore,
  EVAL_DEDUCTION_WEIGHTS,
  EvaluationFormStoreContext,
} from '../../store/evaluationFormStore';
import type { EvaluationFormStore } from '../../store/evaluationFormStore';

const EDITABLE_EVALUATION_STATUSES = ['draft', 'rejected'];
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

const getDisplayName = (value: unknown) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'name' in value) {
    return String((value as { name?: unknown }).name || '');
  }
  return '';
};
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
  const [store] = useState<EvaluationFormStore>(() => createEvaluationFormStore());


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
  const userProfile = user as any;
  const majorDisplayName = getDisplayName(userProfile?.major) || userProfile?.majorName || 'Chưa cập nhật';
  const admissionYearDisplay =
    userProfile?.admissionYear || userProfile?.class?.enrollmentYear || userProfile?.enrollmentYear || 'Chưa cập nhật';
  const facultyDisplayName = getDisplayName(userProfile?.faculty) || userProfile?.facultyName || 'Chưa cập nhật';

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
    const map: Record<string, string> = {
      sv_nckh: CRITERIA_CODES.SECTION_1.NCKH_PARTICIPATION,
      sv_olympic: CRITERIA_CODES.SECTION_1.NCKH_PAPER_OLYMPIC,
      sv_creative: CRITERIA_CODES.SECTION_1.NCKH_AWARD,
      sv_reward: CRITERIA_CODES.SECTION_3.REWARD,
      sv_policy: CRITERIA_CODES.SECTION_4.LAW_COMPLIANCE,
      sv_solidarity: CRITERIA_CODES.SECTION_4.CHARITY_SOLIDARITY,
      sv_cadre_perf: CRITERIA_CODES.SECTION_5.CADRE_PERFORMANCE,
      sv_special_ach: CRITERIA_CODES.SECTION_5.SPECIAL_ACHIEVEMENT,
    };

    return map[criteriaKey] || criteriaKey;
  };

  const normalizeEvidenceUrl = (value?: string | null) => {
    if (!value) return '';
    if (/\/evidences\/link-url$/i.test(value)) return '';
    if (/^(https?:|blob:|data:)/i.test(value)) return value;
    const normalizedPath = value.startsWith('/') ? value : `/${value}`;
    if (/^https?:/i.test(API_URL)) {
      try {
        return `${new URL(API_URL).origin}${normalizedPath}`;
      } catch {
        return normalizedPath;
      }
    }
    return normalizedPath;
  };

  const getEvidenceFileKeys = (evidence: any) => {
    const code = String(
      evidence?.criterion?.code ||
      evidence?.criteria?.code ||
      evidence?.criteriaCode ||
      evidence?.criterionCode ||
      ''
    ).toUpperCase();

    if (code === 'I.2.A') return ['sv_nckh'];
    if (code === 'I.2.B') return ['sv_olympic'];
    if (code === 'I.2.C') return ['sv_creative'];
    if (code === 'TC1' || code === 'I.2') return ['sv_nckh', 'sv_olympic', 'sv_creative'];
    if (code === 'TC3' || code === 'III.5') return ['sv_reward'];
    if (code === 'TC4') return ['sv_policy', 'sv_solidarity'];
    if (code === 'IV.1') return ['sv_policy'];
    if (code === 'IV.2') return ['sv_solidarity'];
    if (code === 'TC5') return ['sv_cadre_perf', 'sv_special_ach'];
    if (code === 'V.A.2') return ['sv_cadre_perf'];
    if (code === 'V.B.2') return ['sv_special_ach'];
    return [];
  };

  const appendEvidenceFile = (
    grouped: Record<string, UploadedEvidenceFile[]>,
    key: string,
    file: UploadedEvidenceFile
  ) => {
    const exists = grouped[key]?.some((item) => item.url === file.url || item.name === file.name);
    if (!exists) {
      grouped[key] = [...(grouped[key] || []), file];
    }
  };

  const mapEvaluationEvidenceFiles = (detail: any): Record<string, UploadedEvidenceFile[]> => {
    const grouped: Record<string, UploadedEvidenceFile[]> = {};
    const evidenceItems = [
      ...(Array.isArray(detail?.evidences) ? detail.evidences : []),
      ...(Array.isArray(detail?.evidenceFiles) ? detail.evidenceFiles : []),
      ...(Array.isArray(detail?.files) ? detail.files : []),
    ];
    const attachmentItems = [
      ...(Array.isArray(detail?.attachments) ? detail.attachments : []),
      ...(Array.isArray(detail?.attachmentFiles) ? detail.attachmentFiles : []),
    ];
    const sourceItems = [
      ...evidenceItems.map((item: any) => ({ ...item, sourceType: 'evidence' })),
      ...attachmentItems.map((item: any) => ({ ...item, sourceType: 'attachment' })),
    ];

    sourceItems.forEach((item: any) => {
      const url = normalizeEvidenceUrl(
        item.imageUrl ||
        item.secureUrl ||
        item.fileUrl ||
        item.downloadUrl ||
        item.url ||
        item.storageKey
      );
      if (!url) return;

      const keys = getEvidenceFileKeys(item);

      const file: UploadedEvidenceFile = {
        name: item.originalName || item.fileName || item.publicId || item.criterion?.title || item.criteria?.title || 'Minh chứng',
        url,
        type: item.mimeType || item.fileType || (item.imageUrl ? 'image' : undefined),
      };

      (keys.length > 0 ? keys : ['sv_general']).forEach((key) => {
        appendEvidenceFile(grouped, key, file);
      });
    });

    return grouped;
  };

  const hasMappedEvidenceFiles = (files: Record<string, UploadedEvidenceFile[]>) =>
    Object.values(files).some((items) => items.length > 0);

  const evidenceFilesForDisplay = Object.values(uploadedFiles)
    .flat()
    .filter((file, index, arr) => arr.findIndex((item) => item.url === file.url || item.name === file.name) === index);

	  const normalizeEvaluationStatus = (status?: string) => String(status || '').trim().toLowerCase();

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
        await ensureEvaluationDraftForEvidence();

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

            const evidenceCriteriaCode = mapEvidenceCriteriaCode(criteriaKey);
            try {
              await API_Student.linkEvidenceUrl({
                criteriaCode: evidenceCriteriaCode,
                imageUrl: secureUrl,
                publicId,
              });
            } catch (linkErr) {
              console.warn('Backend linkEvidenceUrl failed, fallback to local draft state:', linkErr);
            }

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
  const [svStudyAttitude, setSvStudyAttitude] = useState<string>('');
  const [svNckh, setSvNckh] = useState(false);
  const [svOlympic, setSvOlympic] = useState(false);
  const [svCreative, setSvCreative] = useState(false);
  const [svAcademicRank, setSvAcademicRank] = useState<string>('');

  const [svNoViolationScore, setSvNoViolationScore] = useState<number>(0);
  const [svDeductions, setSvDeductions] = useState<number[]>([0, 0, 0, 0, 0, 0, 0, 0, 0]);

  const [svActivity1, setSvActivity1] = useState<string>('ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED');
  const [svActivity2, setSvActivity2] = useState<string>('NOT_PARTICIPATED');
  const [svActivity3, setSvActivity3] = useState<string>('NOT_PARTICIPATED');
  const [svActivity4, setSvActivity4] = useState<string>('REMINDED_VIOLATION');
  const [svRewardPoints, setSvRewardPoints] = useState<number>(0);

  const [svPolicy, setSvPolicy] = useState<string>('VIOLATED');
  const [svSolidarity, setSvSolidarity] = useState<string>('NOT_PARTICIPATED');
  const [svLocality, setSvLocality] = useState<string>('TWO_WARNINGS');

  const [svRoleType, setSvRoleType] = useState<string>('NORMAL_STUDENT');
  const [svCadrePosition, setSvCadrePosition] = useState<string>('MEMBER_GROUP');
  const [svCadrePerformance, setSvCadrePerformance] = useState<string>('POOR');
  const [svManagementLevel, setSvManagementLevel] = useState<string>('');
  const [svClassParticipation, setSvClassParticipation] = useState<number>(0);
  const [svSpecialAchievement, setSvSpecialAchievement] = useState<string>('NONE');

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
  const VALID_REGULAR_SCORE_LEVELS = [
    'GTE_9',
    'FROM_7_TO_UNDER_9',
    'FROM_5_TO_UNDER_7',
    'FROM_4_TO_UNDER_5',
    'FROM_1_TO_UNDER_4',
  ];

  const mapStudyAttitude = (val: string) => {
    const dict: Record<string, string> = {
      very_good: 'GTE_9',
      good: 'FROM_7_TO_UNDER_9',
      fair: 'FROM_5_TO_UNDER_7',
      average: 'FROM_4_TO_UNDER_5',
      poor: 'FROM_1_TO_UNDER_4',
      none: 'FROM_1_TO_UNDER_4',
    };
    const mapped = dict[val] || val;
    return VALID_REGULAR_SCORE_LEVELS.includes(mapped) ? mapped : 'FROM_1_TO_UNDER_4';
  };

  const reverseMapStudyAttitude = (val: string) => {
    return val || 'FROM_1_TO_UNDER_4';
  };

  const VALID_ACADEMIC_RANKS = [
    'EXCELLENT',
    'GOOD',
    'FAIR',
    'AVERAGE',
    'WEAK_NO_WARNING',
    'WEAK_WARNING_FIRST',
  ];

  const mapAcademicRank = (val: string) => {
    const dict: Record<string, string> = {
      excellent: 'EXCELLENT',
      good: 'GOOD',
      fair: 'FAIR',
      average: 'AVERAGE',
      weak_no_warn: 'WEAK_NO_WARNING',
      weak_warn: 'WEAK_WARNING_FIRST',
      none: 'WEAK_WARNING_FIRST',
    };
    const mapped = dict[val] || val;
    return VALID_ACADEMIC_RANKS.includes(mapped) ? mapped : 'WEAK_WARNING_FIRST';
  };

  const reverseMapAcademicRank = (val: string) => {
    return val || 'WEAK_WARNING_FIRST';
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
    return dict[val as keyof typeof dict] || val || 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED';
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
    return dict[val as keyof typeof dict] || val || 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED';
  };

  const mapActivity2 = (val: string) => {
    const dict = {
      many: 'FULL_EFFECTIVE_PARTICIPATION',
      some: 'EFFECTIVE_PARTICIPATION_FROM_HALF',
      active: 'ENCOURAGED_OTHERS',
      full: 'ABSENT_OVER_HALF',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || val || 'NOT_PARTICIPATED';
  };

  const reverseMapActivity2 = (val: string) => {
    const dict = {
      many: 'FULL_EFFECTIVE_PARTICIPATION',
      some: 'EFFECTIVE_PARTICIPATION_FROM_HALF',
      active: 'ENCOURAGED_OTHERS',
      full: 'ABSENT_OVER_HALF',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || val || 'NOT_PARTICIPATED';
  };

  const mapActivity3 = (val: string) => {
    const dict = {
      prize_or_org: 'FULL_EFFECTIVE_PARTICIPATION',
      active: 'ACTIVE_ONE_OR_MORE',
      some: 'ACTIVE_SUPPORTER',
      full: 'ABSENT_OVER_HALF',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || val || 'NOT_PARTICIPATED';
  };

  const reverseMapActivity3 = (val: string) => {
    const dict = {
      prize_or_org: 'FULL_EFFECTIVE_PARTICIPATION',
      active: 'ACTIVE_ONE_OR_MORE',
      some: 'ACTIVE_SUPPORTER',
      full: 'ABSENT_OVER_HALF',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || val || 'NOT_PARTICIPATED';
  };

  const mapActivity4 = (val: string) => {
    const dict = {
      active: 'MULTIPLE_ACTIVITIES_OR_REPORTING',
      full: 'ONE_EFFECTIVE_ACTIVITY',
      some: 'AWARENESS_OR_SUPPORT',
      none: 'REMINDED_VIOLATION',
    };
    return dict[val as keyof typeof dict] || val || 'REMINDED_VIOLATION';
  };

  const reverseMapActivity4 = (val: string) => {
    const dict = {
      active: 'MULTIPLE_ACTIVITIES_OR_REPORTING',
      full: 'ONE_EFFECTIVE_ACTIVITY',
      some: 'AWARENESS_OR_SUPPORT',
      none: 'REMINDED_VIOLATION',
    };
    return dict[val as keyof typeof dict] || val || 'REMINDED_VIOLATION';
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
    return dict[val as keyof typeof dict] || val || 'VIOLATED';
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
    return dict[val as keyof typeof dict] || val || 'VIOLATED';
  };

  const mapSolidarity = (val: string) => {
    const dict = {
      excellent_achievements: 'ACTIVE_WITH_REWARD',
      regular: 'ACTIVE',
      some: 'PARTICIPATED',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || val || 'NOT_PARTICIPATED';
  };

  const reverseMapSolidarity = (val: string) => {
    const dict = {
      excellent_achievements: 'ACTIVE_WITH_REWARD',
      regular: 'ACTIVE',
      some: 'PARTICIPATED',
      none: 'NOT_PARTICIPATED',
    };
    return dict[val as keyof typeof dict] || val || 'NOT_PARTICIPATED';
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
    return dict[val as keyof typeof dict] || val || 'TWO_WARNINGS';
  };

  const reverseMapLocality = (val: string) => {
    const dict = {
      GOOD: 'GOOD',
      ONE_WARNING: 'ONE_WARNING',
      TWO_WARNINGS: 'TWO_WARNINGS',
      FAIR: 'ONE_WARNING',
      POOR: 'TWO_WARNINGS',
    };
    return dict[val as keyof typeof dict] || val || 'TWO_WARNINGS';
  };

  const mapCadrePerformance = (val: string) => {
    const dict = {
      excellent: 'EXCELLENT',
      good: 'GOOD',
      average: 'FAIR',
      unsatisfactory: 'POOR',
    };
    return dict[val as keyof typeof dict] || val || 'POOR';
  };

  const reverseMapCadrePerformance = (val: string) => {
    const dict = {
      excellent: 'EXCELLENT',
      good: 'GOOD',
      average: 'FAIR',
      unsatisfactory: 'POOR',
    };
    return dict[val as keyof typeof dict] || val || 'POOR';
  };

  const mapManagementLevel = (val: string) => {
    const dict = {
      head: 'HEAD_POSITION',
      deputy: 'DEPUTY_POSITION',
      member: 'MEMBER_POSITION',
    };
    return dict[val as keyof typeof dict] || val || undefined;
  };

  const reverseMapManagementLevel = (val: string) => {
    const dict = {
      head: 'HEAD_POSITION',
      deputy: 'DEPUTY_POSITION',
      member: 'MEMBER_POSITION',
    };
    return dict[val as keyof typeof dict] || val || '';
  };

  const mapSpecialAchievement = (val: string) => {
    const dict = {
      national_intl: 'NATIONAL_OR_INTL',
      provincial: 'PROVINCIAL_LEVEL',
      none: 'NONE',
    };
    return dict[val as keyof typeof dict] || val || 'NONE';
  };

  const reverseMapSpecialAchievement = (val: string) => {
    const dict = {
      national_intl: 'NATIONAL_OR_INTL',
      provincial: 'PROVINCIAL_LEVEL',
      none: 'NONE',
    };
    return dict[val as keyof typeof dict] || val || 'NONE';
  };

  // Reset fields function for fresh evaluations
  const resetFormFields = () => {
    setSvStudyAttitude('');
    setSvNckh(false);
    setSvOlympic(false);
    setSvCreative(false);
    setSvAcademicRank('');
    setSvNoViolationScore(0);
    setSvDeductions([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setSvActivity1('ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED');
    setSvActivity2('NOT_PARTICIPATED');
    setSvActivity3('NOT_PARTICIPATED');
    setSvActivity4('REMINDED_VIOLATION');
    setSvRewardPoints(0);
    setSvPolicy('VIOLATED');
    setSvSolidarity('NOT_PARTICIPATED');
    setSvLocality('TWO_WARNINGS');
    setSvRoleType('NORMAL_STUDENT');
    setSvCadrePosition('MEMBER_GROUP');
    setSvCadrePerformance('POOR');
    setSvManagementLevel('');
    setSvClassParticipation(0);
    setSvSpecialAchievement('NONE');

    // Reset class columns directly in store (no local class state)
    store.getState().batchSet({
      classStudyAttitude: '',
      classNckh: false,
      classOlympic: false,
      classCreative: false,
      classAcademicRank: '',
      classNoViolationScore: 0,
      classDeductions: [0, 0, 0, 0, 0, 0, 0, 0, 0],
      classActivity1: 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
      classActivity2: 'NOT_PARTICIPATED',
      classActivity3: 'NOT_PARTICIPATED',
      classActivity4: 'REMINDED_VIOLATION',
      classRewardPoints: 0,
      classPolicy: 'VIOLATED',
      classSolidarity: 'NOT_PARTICIPATED',
      classLocality: 'TWO_WARNINGS',
      classRoleType: 'NORMAL_STUDENT',
      classCadrePosition: 'MEMBER_GROUP',
      classCadrePerformance: 'POOR',
      classManagementLevel: '',
      classClassParticipation: 0,
      classSpecialAchievement: 'NONE',
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
    setUploadedFiles({});
    setFileProgress({});
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
      let mappedFiles = mapEvaluationEvidenceFiles(detail);
      if (!hasMappedEvidenceFiles(mappedFiles)) {
        try {
          const fallbackRes = await API_Student.getMyEvidences();
          const fallbackItems = Array.isArray(fallbackRes) ? fallbackRes : (Array.isArray((fallbackRes as any)?.data) ? (fallbackRes as any).data : []);
          const relatedItems = fallbackItems.filter((item: any) => !item.evaluationFormId || item.evaluationFormId === targetId);
          mappedFiles = mapEvaluationEvidenceFiles({ evidences: relatedItems });
        } catch (evidenceErr) {
          console.warn('Failed to load fallback evidences:', evidenceErr);
        }
      }
      setUploadedFiles(mappedFiles);
      setFileProgress({});
      store.getState().batchSet({ uploadedFiles: mappedFiles, fileProgress: {} });

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

      if (roleData.studentRoleType) setSvRoleType(roleData.studentRoleType);
      if (roleData.positionGroup) setSvCadrePosition(roleData.positionGroup);
      if (roleData.taskCompletionLevel) setSvCadrePerformance(reverseMapCadrePerformance(roleData.taskCompletionLevel));
      if (roleData.managementSkillLevel) setSvManagementLevel(reverseMapManagementLevel(roleData.managementSkillLevel));
      if (roleData.normalStudentActivityScore !== undefined) setSvClassParticipation(roleData.normalStudentActivityScore);
      if (roleData.specialAchievementLevel) setSvSpecialAchievement(reverseMapSpecialAchievement(roleData.specialAchievementLevel));

      // Push all loaded values into the Zustand store at once
      // (state setters above are async; we read latest values directly from the API response)
      store.getState().batchSet({
        svStudyAttitude: studyData.regularScoreLevel ? reverseMapStudyAttitude(studyData.regularScoreLevel) : '',
        svNckh: studyData.activities?.some((a: any) => a.code === 'ACADEMIC_EVENT_PARTICIPATION') ?? false,
        svOlympic: studyData.activities?.some((a: any) => a.code === 'SCIENTIFIC_PUBLICATION_OR_CONTEST') ?? false,
        svCreative: studyData.activities?.some((a: any) => a.code === 'SCIENTIFIC_AWARD') ?? false,
        svAcademicRank: studyData.academicRank ? reverseMapAcademicRank(studyData.academicRank) : '',
        svActivity1: actData.politicalActivityLevel ? reverseMapActivity1(actData.politicalActivityLevel) : 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
        svActivity2: actData.cultureSportLevel ? reverseMapActivity2(actData.cultureSportLevel) : 'NOT_PARTICIPATED',
        svActivity3: actData.clubActivityLevel ? reverseMapActivity3(actData.clubActivityLevel) : 'NOT_PARTICIPATED',
        svActivity4: actData.socialPreventionLevel ? reverseMapActivity4(actData.socialPreventionLevel) : 'REMINDED_VIOLATION',
        svRewardPoints: actData.rewardScore ?? 0,
        svPolicy: commData.lawComplianceLevel ? reverseMapPolicy(commData.lawComplianceLevel) : 'VIOLATED',
        svSolidarity: commData.volunteerActivityLevel ? reverseMapSolidarity(commData.volunteerActivityLevel) : 'NOT_PARTICIPATED',
        svLocality: commData.communityRelationshipLevel ? reverseMapLocality(commData.communityRelationshipLevel) : 'TWO_WARNINGS',
        svRoleType: roleData.studentRoleType || 'NORMAL_STUDENT',
        svCadrePosition: roleData.positionGroup || 'MEMBER_GROUP',
        svCadrePerformance: roleData.taskCompletionLevel ? reverseMapCadrePerformance(roleData.taskCompletionLevel) : 'POOR',
        svManagementLevel: roleData.managementSkillLevel ? reverseMapManagementLevel(roleData.managementSkillLevel) : '',
        svClassParticipation: roleData.normalStudentActivityScore ?? 0,
        svSpecialAchievement: roleData.specialAchievementLevel ? reverseMapSpecialAchievement(roleData.specialAchievementLevel) : 'NONE',
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
    if (svSolidarity === 'ACTIVE_WITH_REWARD' && (!uploadedFiles['sv_solidarity'] || uploadedFiles['sv_solidarity'].length === 0)) {
      return { field: 'svSolidarity', message: 'Vui lòng tải minh chứng cho các thành tích đoàn kết giúp đỡ bạn bè đặc biệt.' };
    }

    if (svCadrePerformance === 'EXCELLENT') {
      const key = 'sv_cadre_perf';
      if (!uploadedFiles[key] || uploadedFiles[key].length === 0) {
        return { field: 'svCadrePerformance', message: 'Vui lòng tải minh chứng Hoàn thành xuất sắc nhiệm vụ của Lớp trưởng/Bí thư.' };
      }
    }
    if (svSpecialAchievement === 'NATIONAL_OR_INTL' || svSpecialAchievement === 'PROVINCIAL_LEVEL') {
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
        Object.fromEntries(
          Object.entries(payload).filter(
            ([, value]) => value !== undefined && value !== null && value !== ''
          )
        );
      const studyPayload = compactPayload({
        regularScoreLevel: mapStudyAttitude(s.svStudyAttitude),
        academicRank: mapAcademicRank(s.svAcademicRank),
        activities: [
          { code: 'ACADEMIC_EVENT_PARTICIPATION', checked: s.svNckh },
          { code: 'SCIENTIFIC_PUBLICATION_OR_CONTEST', checked: s.svOlympic },
          { code: 'SCIENTIFIC_AWARD', checked: s.svCreative },
        ].filter((activity) => activity.checked),
      });
      const hasRolePart1 =
        s.svRoleType === 'CLASS_OFFICER' ||
        !['', 'POOR', 'unsatisfactory'].includes(s.svCadrePerformance) ||
        !['', 'none'].includes(s.svManagementLevel);
      const rolePayload = compactPayload({
        studentRoleType: hasRolePart1 ? 'CLASS_OFFICER' : 'NORMAL_STUDENT',
        positionGroup: hasRolePart1 ? s.svCadrePosition || null : null,
        taskCompletionLevel: hasRolePart1 ? mapCadrePerformance(s.svCadrePerformance) : null,
        managementSkillLevel: hasRolePart1 ? mapManagementLevel(s.svManagementLevel) || null : null,
        normalStudentActivityScore: Number(s.svClassParticipation) || 0,
        specialAchievementLevel: mapSpecialAchievement(s.svSpecialAchievement) || null,
      });
      const disciplineViolations = s.svDeductions.map((count, idx) => {
        const c = Math.round(Number(count) || 0);
        const weight = EVAL_DEDUCTION_WEIGHTS[idx] || 0;
        return {
          code: DISCIPLINE_VIOLATION_CODES[idx],
          count: c,
          deductScore: Math.round(c * weight),
        };
      });

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

  const buildScorePayloads = () => {
    const s = store.getState();
    const compactPayload = (payload: Record<string, unknown>) =>
      Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''));
    const disciplineViolations = s.svDeductions.map((count, idx) => {
      const c = Math.round(Number(count) || 0);
      const weight = EVAL_DEDUCTION_WEIGHTS[idx] || 0;
      return {
        code: DISCIPLINE_VIOLATION_CODES[idx],
        count: c,
        deductScore: Math.round(c * weight),
      };
    });
    const hasRolePart1 =
      s.svRoleType === 'CLASS_OFFICER' ||
      !['', 'POOR', 'unsatisfactory'].includes(s.svCadrePerformance) ||
      !['', 'none'].includes(s.svManagementLevel);
    const rolePayload = compactPayload({
      studentRoleType: hasRolePart1 ? 'CLASS_OFFICER' : 'NORMAL_STUDENT',
      positionGroup: hasRolePart1 ? s.svCadrePosition || null : null,
      taskCompletionLevel: hasRolePart1 ? mapCadrePerformance(s.svCadrePerformance) : null,
      managementSkillLevel: hasRolePart1 ? mapManagementLevel(s.svManagementLevel) || null : null,
      normalStudentActivityScore: Number(s.svClassParticipation) || 0,
      specialAchievementLevel: mapSpecialAchievement(s.svSpecialAchievement) || null,
    });

    return {
      study: compactPayload({
        regularScoreLevel: mapStudyAttitude(s.svStudyAttitude),
        academicRank: mapAcademicRank(s.svAcademicRank),
        activities: [
          { code: 'ACADEMIC_EVENT_PARTICIPATION', checked: s.svNckh },
          { code: 'SCIENTIFIC_PUBLICATION_OR_CONTEST', checked: s.svOlympic },
          { code: 'SCIENTIFIC_AWARD', checked: s.svCreative },
        ].filter((activity) => activity.checked),
      }),
      discipline: {
        baseScore: Math.min(25, Math.max(0, Number(s.svNoViolationScore) || 0)),
        violations: disciplineViolations,
      },
      activity: {
        politicalActivityLevel: mapActivity1(s.svActivity1),
        cultureSportLevel: mapActivity2(s.svActivity2),
        clubActivityLevel: mapActivity3(s.svActivity3),
        socialPreventionLevel: mapActivity4(s.svActivity4),
        rewardScore: Number(s.svRewardPoints) || 0,
      },
      community: {
        lawComplianceLevel: mapPolicy(s.svPolicy),
        volunteerActivityLevel: mapSolidarity(s.svSolidarity),
        communityRelationshipLevel: mapLocality(s.svLocality),
      },
      role: rolePayload,
    };
  };

  const ensureEvaluationDraftForEvidence = async () => {
    let currentId = evaluationId;

    if (!currentId) {
      const createRes = await API_Student.createEvaluation({ semester, academicYear });
      const created = createRes.data || createRes;
      currentId = created.id;
      setEvaluationId(created.id);
    }

    await API_Student.updateEvaluationDraft(currentId!, {
      phone: phoneNumber,
      note,
    });

    return currentId!;
  };

  const persistScoreSection = async (section: 'study' | 'discipline' | 'activity' | 'community' | 'role') => {
    if (!evaluationId || isReadOnly || isLocked || alreadyEvaluated) return;

    try {
      const payloads = buildScorePayloads();
      if (section === 'study') {
        const studyPayload = payloads.study as Record<string, unknown>;
        if (!studyPayload.regularScoreLevel || !studyPayload.academicRank) return;
        await API_Student.updateStudyScore(evaluationId, studyPayload);
      } else if (section === 'discipline') {
        await API_Student.updateDisciplineScore(evaluationId, payloads.discipline);
      } else if (section === 'activity') {
        await API_Student.updateActivityScore(evaluationId, payloads.activity);
      } else if (section === 'community') {
        await API_Student.updateCommunityScore(evaluationId, payloads.community);
      } else {
        await API_Student.updateRoleScore(evaluationId, payloads.role);
      }
    } catch (err: any) {
      const message = getUserFriendlyError(err, 'Không thể lưu thay đổi. Vui lòng kiểm tra lại dữ liệu.');
      const apiFieldErrors = mapApiErrorsToFields(err.errors);
      setFieldErrors(apiFieldErrors);
      if (err.statusCode === 409 || message.includes('khóa') || message.includes('locked')) {
        setIsReadOnly(true);
        setIsLocked(true);
        setAlreadyEvaluated(true);
      }
      toast.error(message);
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
      persistSectionAction: persistScoreSection,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, evaluationId, isReadOnly, isLocked, alreadyEvaluated]); // store ref is stable; handlers close over latest edit gates

  // ── Sync fieldErrors into store when validation runs ─────────────────────
  useEffect(() => {
    store.getState().batchSet({ fieldErrors });
  }, [fieldErrors, store]);

  return (
    <div className="p-4 sm:p-6 sm:px-8 max-w-full mx-auto w-full pb-28">
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
        <div className="space-y-6 transition-all duration-300 transform ease-in animate-fade-in print:space-y-4">
         

          {/* ── HEADER PHIẾU CHÍNH THỨC (hiển thị khi in) ── */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 print:rounded-none print:border-0 print:shadow-none print:p-0">
            {/* Dòng trên cùng: tên trường (trái) + ĐCSVN (phải) */}
            <div className="flex justify-between items-start mb-3 text-center">
              <div className="text-xs sm:text-sm leading-snug text-gray-800 font-semibold max-w-[45%]">
                <p className="uppercase font-black text-xs sm:text-sm text-gray-900">HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG</p>
                <p className="text-xs font-semibold text-gray-700">PHÂN HIỆU HỌC VIỆN HÀNH CHÍNH VÀ QUẢN TRỊ CÔNG</p>
                <p className="text-xs font-semibold text-gray-700">TẠI TỈNH QUẢNG NAM</p>
                <p className="text-xs mt-1">──────</p>
              </div>
              <div className="text-xs sm:text-sm leading-snug text-gray-800 font-semibold max-w-[45%] text-center">
                <p className="uppercase font-black text-xs sm:text-sm text-gray-900">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                <p className="font-bold text-xs sm:text-sm text-gray-800">Độc lập – Tự do – Hạnh phúc</p>
                <p className="text-xs mt-1">──────</p>
              </div>
            </div>

            {/* Tiêu đề chính giữa */}
            <div className="text-center my-5">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-gray-950 print:text-lg">
                PHIẾU ĐÁNH GIÁ KẾT QUẢ RÈN LUYỆN CỦA SINH VIÊN
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1.5 italic font-medium">
                (Kèm theo Quyết định số 4185/QĐ-HCQG ngày 08 tháng 9 năm 2023 của Giám đốc Học viện Hành chính Quốc gia)
              </p>
            </div>

            {/* Đánh giá kết quả rèn luyện học kỳ */}
            <div className="text-center mb-5">
              <p className="text-base sm:text-lg font-bold text-gray-900">
                Đánh giá kết quả rèn luyện học kỳ&nbsp;
                <span className="text-[#000000] font-extrabold">{semester === 'HK1' ? 'I' : semester === 'HK2' ? 'II' : 'Hè'}</span>
                &nbsp;— năm học&nbsp;
                <span className="text-[#000000] font-extrabold">{academicYear}</span>
              </p>
            </div>

            {/* Thông tin sinh viên — 2 cột */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-base text-gray-900 border border-gray-200 rounded-lg p-5 bg-gray-50/50 print:border print:rounded-none print:bg-white">
              <p className="flex items-center gap-2">
                <span className="shrink-0 font-bold text-gray-950">Họ và tên:</span>
                <span className="font-bold text-gray-900">
                  {(user as any)?.fullName || 'Chưa cập nhật'}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="shrink-0 font-bold text-gray-950">Mã sinh viên:</span>
                <span className="font-bold text-gray-900">
                  {(user as any)?.studentCode || 'Chưa cập nhật'}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="shrink-0 font-bold text-gray-950">Ngày sinh:</span>
                <span className="font-bold text-gray-900">
                  {(user as any)?.dateOfBirth || 'Chưa cập nhật'}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="shrink-0 font-bold text-gray-950">Lớp:</span>
                <span className="font-bold text-gray-900">
                  {(user as any)?.className || 'Chưa cập nhật'}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="shrink-0 font-bold text-gray-950">Ngành / Chuyên ngành:</span>
                <span className="font-bold text-gray-900">
                  {majorDisplayName}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="shrink-0 font-bold text-gray-950">Năm trúng tuyển:</span>
                <span className="font-bold text-gray-900">
                  {admissionYearDisplay}
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-bold shrink-0 text-gray-950">Số điện thoại:</span>{' '}
                {isReadOnly ? (
                  <span className="font-bold text-gray-900">{phoneNumber || 'Chưa cập nhật'}</span>
                ) : (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="ml-2 flex-1 bg-transparent text-sm font-semibold outline-none focus:ring-0 border-0 p-0"
                    placeholder="Nhập số điện thoại"
                  />
                )}
              </p>
              <p className="flex items-center gap-2">
                <span className="shrink-0 font-bold">Khoa (đơn vị quản lý):</span>
                <span className="font-semibold text-gray-700">
                  {facultyDisplayName.toUpperCase()}
                </span>
              </p>
            </div>
          </div>

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

          {evidenceFilesForDisplay.length > 0 && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="mb-3 flex items-center gap-2 text-emerald-800">
                <CheckCircle size={17} className="shrink-0 text-emerald-600" />
                <h4 className="text-sm font-bold">Minh chứng đã nộp</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {evidenceFilesForDisplay.map((file, index) => (
                  <button
                    key={`${file.url || file.name}-${index}`}
                    type="button"
                    onClick={() => file.url && window.open(file.url, '_blank', 'noopener,noreferrer')}
                    disabled={!file.url}
                    className="max-w-full truncate rounded-lg border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-70"
                    title={file.url ? 'Click để xem minh chứng' : 'Minh chứng chưa có đường dẫn xem trực tiếp'}
                  >
                    {file.name}
                  </button>
                ))}
              </div>
            </div>
          )}

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
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 mt-6 bg-white p-5 rounded-xl shadow-sm print:hidden">
            <button
              type="button"
              onClick={handleGoBackToStep1}
              className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition cursor-pointer text-xs font-bold min-h-[44px]"
            >
              Quay lại
            </button>
            {!isReadOnly && (
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationFormQD4185;
