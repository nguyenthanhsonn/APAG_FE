'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FileText, Loader2, Paperclip, Send } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { API_Admin } from '@/api/API_Admin';
import { CouncilCriteriaReviewTable } from '@/components/class_council/CouncilCriteriaReviewTable';
import EvidenceReviewModal, { type ReviewEvidence } from '@/components/class_council/EvidenceReviewModal';
import EvaluationStatusStepper from '@/components/common/EvaluationStatusStepper';
import { useToast } from '@/components/common/ToastProvider';
import { getUserFriendlyError } from '@/utils/errorHelper';
import type { ReviewStudent } from '@/types/admin';
import {
  createCouncilReviewStore,
  CouncilReviewStoreContext,
} from '@/store/councilReviewStore';
import type { CouncilReviewStore } from '@/store/councilReviewStore';

const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value ?? '');

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

function unwrapData<T = any>(value: any): T {
  return (value?.data || value) as T;
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }
  return [];
}

const reverseMapStudyAttitude = (value?: string | null) => {
  const map: Record<string, string> = {
    GTE_9: 'very_good',
    FROM_7_TO_UNDER_9: 'good',
    FROM_5_TO_UNDER_7: 'fair',
    FROM_4_TO_UNDER_5: 'average',
    FROM_1_TO_UNDER_4: 'poor',
  };
  return value ? map[value] || 'none' : 'none';
};

const reverseMapAcademicRank = (value?: string | null) => String(value || 'none').toLowerCase();

const reverseMapActivity2 = (value?: string | null) => {
  const map: Record<string, string> = {
    FULL_EFFECTIVE_PARTICIPATION: 'many',
    EFFECTIVE_PARTICIPATION_FROM_HALF: 'some',
    ENCOURAGED_OTHERS: 'active',
    ABSENT_OVER_HALF: 'full',
    NOT_PARTICIPATED: 'none',
  };
  return value ? map[value] || 'none' : 'none';
};

const reverseMapActivity3 = (value?: string | null) => {
  const map: Record<string, string> = {
    FULL_EFFECTIVE_PARTICIPATION: 'prize_or_org',
    ACTIVE_ONE_OR_MORE: 'active',
    ACTIVE_SUPPORTER: 'some',
    ABSENT_OVER_HALF: 'full',
    NOT_PARTICIPATED: 'none',
  };
  return value ? map[value] || 'none' : 'none';
};

const reverseMapActivity4 = (value?: string | null) => {
  const map: Record<string, string> = {
    MULTIPLE_ACTIVITIES_OR_REPORTING: 'active',
    ONE_EFFECTIVE_ACTIVITY: 'full',
    AWARENESS_OR_SUPPORT: 'some',
    REMINDED_VIOLATION: 'none',
  };
  return value ? map[value] || 'none' : 'none';
};

const reverseMapSolidarity = (value?: string | null) => {
  const map: Record<string, string> = {
    ACTIVE_WITH_REWARD: 'excellent_achievements',
    ACTIVE: 'regular',
    PARTICIPATED: 'some',
    NOT_PARTICIPATED: 'none',
  };
  return value ? map[value] || 'none' : 'none';
};

const reverseMapCadrePerformance = (value?: string | null) => {
  const map: Record<string, string> = {
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'average',
    POOR: 'unsatisfactory',
  };
  return value ? map[value] || 'unsatisfactory' : 'unsatisfactory';
};

const reverseMapManagementLevel = (value?: string | null) => {
  const map: Record<string, string> = {
    HEAD_POSITION: 'head',
    DEPUTY_POSITION: 'deputy',
    MEMBER_POSITION: 'member',
  };
  return value ? map[value] || 'none' : 'none';
};

const reverseMapSpecialAchievement = (value?: string | null) => {
  const map: Record<string, string> = {
    NATIONAL_OR_INTL: 'national_intl',
    PROVINCIAL_LEVEL: 'provincial',
    NONE: 'none',
  };
  return value ? map[value] || 'none' : 'none';
};

export function StudentDetailReviewView() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const classId = getParam(params.classId);
  const evaluationId = getParam(params.studentId);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  // ── Zustand store (factory pattern — isolated per student mount) ──────────
  const [store] = useState<CouncilReviewStore>(() => createCouncilReviewStore());

  const [hasEvaluation, setHasEvaluation] = useState(false);
  const [student, setStudent] = useState<ReviewStudent | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [evidences, setEvidences] = useState<ReviewEvidence[]>([]);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isSubmittedLate, setIsSubmittedLate] = useState(false);

  // Violation section states — values only needed for submit payload;
  // setters not called directly (violations come from council form via store)
  const [isSvViolationSec1] = useState(false);
  const [isClassViolationSec1] = useState(false);
  const [isSvViolationSec2] = useState(false);
  const [isClassViolationSec2] = useState(false);
  const [isSvViolationSec3] = useState(false);
  const [isClassViolationSec3] = useState(false);
  const [isSvViolationSec4] = useState(false);
  const [isClassViolationSec4] = useState(false);
  const [isSvViolationSec5] = useState(false);
  const [isClassViolationSec5] = useState(false);

  const [svStudyAttitude, setSvStudyAttitude] = useState('none');
  const [svNckh, setSvNckh] = useState(false);
  const [svOlympic, setSvOlympic] = useState(false);
  const [svCreative, setSvCreative] = useState(false);
  const [svAcademicRank, setSvAcademicRank] = useState('none');
  const [classStudyAttitude, setClassStudyAttitude] = useState('none');
  const [classNckh, setClassNckh] = useState(false);
  const [classOlympic, setClassOlympic] = useState(false);
  const [classCreative, setClassCreative] = useState(false);
  const [classAcademicRank, setClassAcademicRank] = useState('none');

  const [svNoViolationScore, setSvNoViolationScore] = useState(0);
  const [svDeductions, setSvDeductions] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [classNoViolationScore, setClassNoViolationScore] = useState(0);
  const [classDeductions, setClassDeductions] = useState([0, 0, 0, 0, 0, 0, 0, 0, 0]);

  const [svActivity1, setSvActivity1] = useState('GOOD_PARTICIPATION');
  const [svActivity2, setSvActivity2] = useState('none');
  const [svActivity3, setSvActivity3] = useState('none');
  const [svActivity4, setSvActivity4] = useState('none');
  const [svRewardPoints, setSvRewardPoints] = useState(0);
  const [classActivity1, setClassActivity1] = useState('GOOD_PARTICIPATION');
  const [classActivity2, setClassActivity2] = useState('none');
  const [classActivity3, setClassActivity3] = useState('none');
  const [classActivity4, setClassActivity4] = useState('none');
  const [classRewardPoints, setClassRewardPoints] = useState(0);

  const [svPolicy, setSvPolicy] = useState('GOOD');
  const [svSolidarity, setSvSolidarity] = useState('none');
  const [svLocality, setSvLocality] = useState('GOOD');
  const [classPolicy, setClassPolicy] = useState('GOOD');
  const [classSolidarity, setClassSolidarity] = useState('none');
  const [classLocality, setClassLocality] = useState('GOOD');

  const [svRoleType, setSvRoleType] = useState<'cadre' | 'student'>('student');
  const [svCadrePosition, setSvCadrePosition] = useState<'a1' | 'a2'>('a2');
  const [svCadrePerformance, setSvCadrePerformance] = useState('unsatisfactory');
  const [svManagementLevel, setSvManagementLevel] = useState('none');
  const [svClassParticipation, setSvClassParticipation] = useState(0);
  const [svSpecialAchievement, setSvSpecialAchievement] = useState('none');
  const [classRoleType, setClassRoleType] = useState<'cadre' | 'student'>('student');
  const [classCadrePosition, setClassCadrePosition] = useState<'a1' | 'a2'>('a2');
  const [classCadrePerformance, setClassCadrePerformance] = useState('unsatisfactory');
  const [classManagementLevel, setClassManagementLevel] = useState('none');
  const [classClassParticipation, setClassClassParticipation] = useState(0);
  const [classSpecialAchievement, setClassSpecialAchievement] = useState('none');

  const deductionWeights = useMemo(() => [10, 3, 5, 5, 5, 5, 5, 10, 20], []);
  // deductionLabels moved to councilReviewStore (DEDUCTION_LABELS constant)

  const scoreMaps = useMemo(() => ({
    studyAttitude: { very_good: 6, good: 5, fair: 4, average: 2, poor: 1, none: 0 } as Record<string, number>,
    academicRank: { excellent: 8, good: 7, fair: 6, average: 4, weak_no_warn: 2, weak_warn: 1, none: 0 } as Record<string, number>,
    activity1: { GOOD_PARTICIPATION: 5, ABSENT_ONCE: 3, ABSENT_TWICE: 2, ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED: 0, active: 5, full: 3, excused: 2, unexcused: 0 } as Record<string, number>,
    activity2: { many: 5, some: 3, active: 2, full: 1, none: 0 } as Record<string, number>,
    activity3: { prize_or_org: 5, active: 3, some: 2, full: 1, none: 0 } as Record<string, number>,
    activity4: { active: 3, full: 2, some: 1, none: 0 } as Record<string, number>,
    policy: { GOOD_WITH_REWARD: 10, GOOD: 8, AVERAGE: 5, VIOLATED: 0, excellent_propaganda: 10, good: 8, minor_violation: 5, none: 0 } as Record<string, number>,
    solidarity: { excellent_achievements: 10, regular: 8, some: 5, none: 0 } as Record<string, number>,
    locality: { GOOD: 5, ONE_WARNING: 1, TWO_WARNINGS: 0, good: 5, rewarded: 1, warned: 0 } as Record<string, number>,
  }), []);

  useEffect(() => {
    let mounted = true;

    const loadEvaluationDetail = async () => {
      if (!evaluationId || !classId) {
        setStudent(null);
        setHasEvaluation(false);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [detailResult, listResult] = await Promise.all([
          API_Admin.getEvaluationDetail(evaluationId),
          API_Admin.getAdminEvaluationList({ classId, page: 1, limit: 100 }),
        ]);

        if (!mounted) return;

        const detail = unwrapData<any>(detailResult);
        const list = toArray<any>(unwrapData<any>(listResult));
        const listItem = list.find((item) => item.id === evaluationId);
        const studentInfo = detail.student || listItem?.student || {};

	        setStudent({
	          id: detail.studentId || studentInfo.id || evaluationId,
	          code: detail.studentCode || studentInfo.studentCode || studentInfo.code || detail.studentId || '-',
	          fullName: studentInfo.fullName || detail.studentName || detail.fullName || 'Sinh viên',
	        });
	        setWorkflow({
	          status: detail.status,
	          statusLabel: detail.statusLabel,
	          steps: detail.review?.steps,
	        });

        const study = detail.sections?.study || {};
        const discipline = detail.sections?.discipline || {};
        const activity = detail.sections?.activity || {};
        const community = detail.sections?.community || {};
        const role = detail.sections?.role || {};

        setSvStudyAttitude(reverseMapStudyAttitude(study.regularScoreLevel));
        setClassStudyAttitude(reverseMapStudyAttitude(study.regularScoreLevel));
        setSvAcademicRank(reverseMapAcademicRank(study.academicRank));
        setClassAcademicRank(reverseMapAcademicRank(study.academicRank));

        const activities = Array.isArray(study.activities) ? study.activities : [];
        const hasAcademicEvent = activities.some((item: any) => item.code === 'ACADEMIC_EVENT_PARTICIPATION' && item.checked !== false);
        const hasPublication = activities.some((item: any) => item.code === 'SCIENTIFIC_PUBLICATION_OR_CONTEST' && item.checked !== false);
        const hasAward = activities.some((item: any) => item.code === 'SCIENTIFIC_AWARD' && item.checked !== false);
        setSvNckh(hasAcademicEvent);
        setClassNckh(hasAcademicEvent);
        setSvOlympic(hasPublication);
        setClassOlympic(hasPublication);
        setSvCreative(hasAward);
        setClassCreative(hasAward);

        const violations = Array.isArray(discipline.violations) ? discipline.violations : [];
        const deductionCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0];
        violations.forEach((violation: any) => {
          const codeIndex = (DISCIPLINE_VIOLATION_CODES as readonly string[]).indexOf(violation.code);
          const legacyIndex = String(violation.code || '').startsWith('DEDUCT_')
            ? parseInt(String(violation.code).replace('DEDUCT_', ''), 10) - 1
            : -1;
          const weightIndex = deductionWeights.findIndex((weight) => weight === Number(violation.deductScore));
          const index = codeIndex >= 0 ? codeIndex : legacyIndex >= 0 ? legacyIndex : weightIndex;

          if (index >= 0 && index < deductionCounts.length) {
            deductionCounts[index] = Number(violation.count) || 0;
          }
        });
        const hasDisciplineInput = Number(discipline.score) > 0 || violations.length > 0;
        const baseScore = hasDisciplineInput ? Math.min(25, Math.max(0, Number(discipline.baseScore) || 0)) : 0;
        setSvNoViolationScore(baseScore);
        setClassNoViolationScore(baseScore);
        setSvDeductions(deductionCounts);
        setClassDeductions(deductionCounts);

        setSvActivity1(activity.politicalActivityLevel || 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED');
        setClassActivity1(activity.politicalActivityLevel || 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED');
        setSvActivity2(reverseMapActivity2(activity.cultureSportLevel));
        setClassActivity2(reverseMapActivity2(activity.cultureSportLevel));
        setSvActivity3(reverseMapActivity3(activity.clubActivityLevel));
        setClassActivity3(reverseMapActivity3(activity.clubActivityLevel));
        setSvActivity4(reverseMapActivity4(activity.socialPreventionLevel));
        setClassActivity4(reverseMapActivity4(activity.socialPreventionLevel));
        setSvRewardPoints(Number(activity.rewardScore) || 0);
        setClassRewardPoints(Number(activity.rewardScore) || 0);

        setSvPolicy(community.lawComplianceLevel || 'VIOLATED');
        setClassPolicy(community.lawComplianceLevel || 'VIOLATED');
        setSvSolidarity(reverseMapSolidarity(community.volunteerActivityLevel));
        setClassSolidarity(reverseMapSolidarity(community.volunteerActivityLevel));
        setSvLocality(community.communityRelationshipLevel || 'TWO_WARNINGS');
        setClassLocality(community.communityRelationshipLevel || 'TWO_WARNINGS');

        const isClassOfficer = role.studentRoleType === 'CLASS_OFFICER';
        setSvRoleType(isClassOfficer ? 'cadre' : 'student');
        setClassRoleType(isClassOfficer ? 'cadre' : 'student');
        const position = role.positionGroup === 'LEADER_GROUP' ? 'a1' : 'a2';
        setSvCadrePosition(position);
        setClassCadrePosition(position);
        setSvCadrePerformance(reverseMapCadrePerformance(role.taskCompletionLevel));
        setClassCadrePerformance(reverseMapCadrePerformance(role.taskCompletionLevel));
        setSvManagementLevel(reverseMapManagementLevel(role.managementSkillLevel));
        setClassManagementLevel(reverseMapManagementLevel(role.managementSkillLevel));
        setSvClassParticipation(Number(role.normalStudentActivityScore) || 0);
        setClassClassParticipation(Number(role.normalStudentActivityScore) || 0);
        setSvSpecialAchievement(reverseMapSpecialAchievement(role.specialAchievementLevel));
        setClassSpecialAchievement(reverseMapSpecialAchievement(role.specialAchievementLevel));

        const evidenceItems = Array.isArray(detail.evidences) ? detail.evidences : [];
        setEvidences(
          evidenceItems.map((evidence: any) => ({
            id: evidence.id,
            fileName: evidence.fileName || evidence.originalName || evidence.publicId || 'Minh chứng',
            fileType: String(evidence.mimeType || evidence.fileType || evidence.imageUrl || '').includes('pdf') ? 'pdf' : 'image',
            url: evidence.url || evidence.imageUrl || evidence.storageKey || '#',
            status: evidence.status || 'pending',
          }))
        );

        setHasEvaluation(true);

        // Push all loaded values into the Zustand store at once so
        // CouncilCriteriaReviewTable can read from store without props
        const svStudyAtStr = reverseMapStudyAttitude(study.regularScoreLevel);
        const svAcademicRankStr = reverseMapAcademicRank(study.academicRank);
        const roleType: 'cadre' | 'student' = isClassOfficer ? 'cadre' : 'student';
        store.getState().batchSet({
          currentUserRole: 'class',
          svStudyAttitude: svStudyAtStr,
          classStudyAttitude: svStudyAtStr,
          svAcademicRank: svAcademicRankStr,
          classAcademicRank: svAcademicRankStr,
          svNckh: hasAcademicEvent, classNckh: hasAcademicEvent,
          svOlympic: hasPublication, classOlympic: hasPublication,
          svCreative: hasAward, classCreative: hasAward,
          svNoViolationScore: baseScore, classNoViolationScore: baseScore,
          svDeductions: [...deductionCounts], classDeductions: [...deductionCounts],
          svActivity1: activity.politicalActivityLevel || 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
          classActivity1: activity.politicalActivityLevel || 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED',
          svActivity2: reverseMapActivity2(activity.cultureSportLevel), classActivity2: reverseMapActivity2(activity.cultureSportLevel),
          svActivity3: reverseMapActivity3(activity.clubActivityLevel), classActivity3: reverseMapActivity3(activity.clubActivityLevel),
          svActivity4: reverseMapActivity4(activity.socialPreventionLevel), classActivity4: reverseMapActivity4(activity.socialPreventionLevel),
          svRewardPoints: Number(activity.rewardScore) || 0, classRewardPoints: Number(activity.rewardScore) || 0,
          svPolicy: community.lawComplianceLevel || 'VIOLATED', classPolicy: community.lawComplianceLevel || 'VIOLATED',
          svSolidarity: reverseMapSolidarity(community.volunteerActivityLevel), classSolidarity: reverseMapSolidarity(community.volunteerActivityLevel),
          svLocality: community.communityRelationshipLevel || 'TWO_WARNINGS', classLocality: community.communityRelationshipLevel || 'TWO_WARNINGS',
          svRoleType: roleType, classRoleType: roleType,
          svCadrePosition: position, classCadrePosition: position,
          svCadrePerformance: reverseMapCadrePerformance(role.taskCompletionLevel), classCadrePerformance: reverseMapCadrePerformance(role.taskCompletionLevel),
          svManagementLevel: reverseMapManagementLevel(role.managementSkillLevel), classManagementLevel: reverseMapManagementLevel(role.managementSkillLevel),
          svClassParticipation: Number(role.normalStudentActivityScore) || 0, classClassParticipation: Number(role.normalStudentActivityScore) || 0,
          svSpecialAchievement: reverseMapSpecialAchievement(role.specialAchievementLevel), classSpecialAchievement: reverseMapSpecialAchievement(role.specialAchievementLevel),
        });

      } catch (error: any) {
        if (!mounted) return;
        setStudent(null);
        setHasEvaluation(false);
        toast.error(getUserFriendlyError(error, 'Không tải được phiếu đánh giá.'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadEvaluationDetail();

    return () => {
      mounted = false;
    };
  }, [classId, deductionWeights, evaluationId, store, toast]);

  const clampScore = (value: number, max: number) => Math.min(max, Math.max(0, Number.isFinite(value) ? value : 0));

  const calculateTotalPoints = (isSv: boolean) => {
    const sec1Violation = isSv ? isSvViolationSec1 : isClassViolationSec1;
    const sec2Violation = isSv ? isSvViolationSec2 : isClassViolationSec2;
    const sec3Violation = isSv ? isSvViolationSec3 : isClassViolationSec3;
    const sec4Violation = isSv ? isSvViolationSec4 : isClassViolationSec4;
    const sec5Violation = isSv ? isSvViolationSec5 : isClassViolationSec5;

    const sec1 = sec1Violation
      ? 0
      : clampScore(
          (scoreMaps.studyAttitude[isSv ? svStudyAttitude : classStudyAttitude] || 0) +
            (isSv ? (svNckh ? 2 : 0) + (svOlympic ? 2 : 0) + (svCreative ? 2 : 0) : (classNckh ? 2 : 0) + (classOlympic ? 2 : 0) + (classCreative ? 2 : 0)) +
            (scoreMaps.academicRank[isSv ? svAcademicRank : classAcademicRank] || 0),
          20
        );

    const noViolationBase = isSv ? svNoViolationScore : classNoViolationScore;
    const deductions = isSv ? svDeductions : classDeductions;
    const totalDeduction = deductions.reduce((sum, count, index) => sum + count * deductionWeights[index], 0);
    const sec2 = sec2Violation ? 0 : clampScore(noViolationBase - totalDeduction, 25);

    const sec3 = sec3Violation
      ? 0
      : clampScore(
          (scoreMaps.activity1[isSv ? svActivity1 : classActivity1] || 0) +
            (scoreMaps.activity2[isSv ? svActivity2 : classActivity2] || 0) +
            (scoreMaps.activity3[isSv ? svActivity3 : classActivity3] || 0) +
            (scoreMaps.activity4[isSv ? svActivity4 : classActivity4] || 0) +
            (isSv ? svRewardPoints : classRewardPoints),
          20
        );

    const sec4 = sec4Violation
      ? 0
      : clampScore(
          (scoreMaps.policy[isSv ? svPolicy : classPolicy] || 0) +
            (scoreMaps.solidarity[isSv ? svSolidarity : classSolidarity] || 0) +
            (scoreMaps.locality[isSv ? svLocality : classLocality] || 0),
          25
        );

    let sec5 = 0;
    if (!sec5Violation) {
      const roleType = isSv ? svRoleType : classRoleType;
      if (roleType === 'cadre') {
        const position = isSv ? svCadrePosition : classCadrePosition;
        const performance = isSv ? svCadrePerformance : classCadrePerformance;
        const management = isSv ? svManagementLevel : classManagementLevel;
        const perfMap = position === 'a1'
          ? { excellent: 7, good: 6, average: 4, unsatisfactory: 0 }
          : { excellent: 6, good: 5, average: 3, unsatisfactory: 0 };
        const mgmtMap: Record<string, number> = { head: 3, deputy: 2, member: 1, none: 0 };
        sec5 = clampScore((perfMap[performance as keyof typeof perfMap] || 0) + (mgmtMap[management] || 0), 10);
      } else {
        const achievementMap: Record<string, number> = { national_intl: 7, provincial: 5, none: 0 };
        sec5 = clampScore((isSv ? svClassParticipation : classClassParticipation) + (achievementMap[isSv ? svSpecialAchievement : classSpecialAchievement] || 0), 10);
      }
    }

    return { sec1, sec2, sec3, sec4, sec5, total: clampScore(sec1 + sec2 + sec3 + sec4 + sec5, 100) };
  };

  const svScores = calculateTotalPoints(true);
  const classScores = calculateTotalPoints(false);

  // uploadedFiles, handleDeductionChange, handleFileUpload, removeFile are
  // now handled inside CouncilCriteriaReviewTable via councilReviewStore.
  // No props needed — the store acts as the communication layer.

  const updateEvidence = (evidenceId: string, patch: Partial<ReviewEvidence>) => {
    setEvidences((current) =>
      current.map((evidence) => (evidence.id === evidenceId ? { ...evidence, ...patch } : evidence))
    );
  };

  const handleApprove = async () => {
    if (!evaluationId) {
      toast.error('Không tìm thấy phiếu đánh giá.');
      return;
    }

    try {
      setApproving(true);
      // Read final score from store — CouncilCriteriaReviewTable writes changes there
      const { computeCouncilScores } = await import('@/store/councilReviewStore');
      const storeState = store.getState();
      const classTotal = computeCouncilScores(storeState, false).total;
      await API_Admin.reviewEvaluation(evaluationId, {
        action: 'approve',
        classScore: Math.round(classTotal),
      });

      toast.success('Đã gửi phiếu lên Admin.');
      router.push(`/class_council/${classId}`);
    } catch (error: any) {
      toast.error(getUserFriendlyError(error, 'Không gửi được phiếu lên Admin.'));
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push(`/class_council/${classId}`)}
            className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-primary"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách sinh viên
          </button>
          <h1 className="ui-page-title">{student?.fullName ?? 'Sinh viên'}</h1>
          <p className="mt-1 text-sm text-[#868E96]">Mã SV: {student?.code ?? evaluationId}</p>
        </div>
        {!loading && hasEvaluation && (
          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4">
              <p className="text-xs font-semibold text-[#868E96]">SV tự chấm</p>
              <p className="mt-1 text-2xl font-bold text-[#1A1B1E]">{svScores.total.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-[#E9ECEF] bg-white p-4">
              <p className="text-xs font-semibold text-[#868E96]">Lớp/GVCN</p>
              <p className="mt-1 text-2xl font-bold text-brand-secondary">{classScores.total.toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-2.5 rounded-xl border border-[#E9ECEF] bg-white p-6 shadow-sm">
          <Loader2 className="animate-spin text-brand-primary" size={34} />
          <p className="text-sm font-semibold text-[#868E96]">Đang tải phiếu đánh giá...</p>
        </div>
      ) : !student || !hasEvaluation ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-[#DEE2E6] bg-white p-6 text-center">
          <FileText size={38} className="text-[#ADB5BD]" />
          <h2 className="mt-3 text-base font-bold text-[#1A1B1E]">Không có phiếu đánh giá</h2>
          <p className="mt-1 max-w-md text-sm text-[#868E96]">
            Sinh viên này chưa có phiếu đã nộp hoặc dữ liệu không còn khả dụng trong lớp phụ trách.
          </p>
        </div>
	      ) : (
	        <>
	          <EvaluationStatusStepper
	            status={workflow?.status}
	            statusLabel={workflow?.statusLabel}
	            steps={workflow?.steps}
	            className="rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm"
	          />

	          <div className="flex flex-col gap-3 rounded-xl border border-[#E9ECEF] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#1A1B1E]">Bảng chấm chi tiết từng tiêu chí</h2>
              <p className="mt-1 text-xs text-[#868E96]">Cột Cá nhân đánh giá là điểm sinh viên đã tự chấm; Cố vấn lớp chỉ chỉnh cột Lớp/GVCN đánh giá.</p>
            </div>
            <button
              type="button"
              onClick={() => setEvidenceModalOpen(true)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-brand-secondary/20 bg-white px-4 py-2.5 text-sm font-semibold text-brand-secondary transition hover:bg-brand-secondary/10"
            >
              <Paperclip size={16} />
              Xem minh chứng đính kèm
            </button>
          </div>

          {/* Special Compliance Flags */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-red-50/40 border border-red-100 rounded-xl">
            <label className="flex items-center gap-2 text-xs font-bold text-red-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSuspended}
                onChange={(e) => setIsSuspended(e.target.checked)}
                className="h-4 w-4 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
              Bị đình chỉ học tập từ 30 ngày trở xuống (Xếp loại không quá Khá)
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-amber-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isSubmittedLate}
                onChange={(e) => setIsSubmittedLate(e.target.checked)}
                className="h-4 w-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              Nộp phiếu trễ hạn / Không đúng hạn (Xếp loại Yếu/Kém)
            </label>
          </div>

          {/* ── CouncilCriteriaReviewTable: all state sourced from Zustand store ── */}
          <CouncilReviewStoreContext.Provider value={store}>
            <CouncilCriteriaReviewTable />
          </CouncilReviewStoreContext.Provider>


          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={handleApprove}
              disabled={approving}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {approving ? <Loader2 className="animate-spin" size={15} /> : <Send size={15} />}
              {approving ? 'Đang gửi...' : 'Gửi phê duyệt'}
            </button>
          </div>
        </>
      )}

      <EvidenceReviewModal
        isOpen={evidenceModalOpen}
        evidences={evidences}
        onClose={() => setEvidenceModalOpen(false)}
        onApprove={(evidenceId) => updateEvidence(evidenceId, { status: 'approved', rejectReason: undefined })}
        onReject={(evidenceId, reason) => updateEvidence(evidenceId, { status: 'rejected', rejectReason: reason })}
      />
    </div>
  );
}
