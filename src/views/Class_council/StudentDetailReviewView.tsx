'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { CheckCircle2, FileText, Loader2, Paperclip, RefreshCw, RotateCcw, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { API_Admin } from '@/api/API_Admin';
import { API_Shared } from '@/api/API_Shared';
import { CouncilCriteriaReviewTable } from '@/components/class_council/CouncilCriteriaReviewTable';
import EvidenceReviewModal, { type ReviewEvidence } from '@/components/class_council/EvidenceReviewModal';
import StudentReviewHeader from '@/components/class_council/StudentReviewHeader';
import { useToast } from '@/components/common/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import { getUserFriendlyError } from '@/utils/errorHelper';
import { canConfirmReview, canEditReviewScores } from '@/utils/permissionHelpers';
import type { ReviewStudent } from '@/types/admin';
import {
  createCouncilReviewStore,
  CouncilReviewStoreContext,
} from '@/store/councilReviewStore';
import type { CouncilReviewStore } from '@/store/councilReviewStore';

const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value ?? '');

function getEvidenceViewUrl(evidence: any) {
  return (
    evidence.imageUrl ||
    evidence.secureUrl ||
    evidence.fileUrl ||
    evidence.downloadUrl ||
    evidence.url ||
    evidence.storageKey ||
    '#'
  );
}

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
  if (!value) return 'FROM_1_TO_UNDER_4';
  const val = String(value).toUpperCase();
  const valid = ['GTE_9', 'FROM_7_TO_UNDER_9', 'FROM_5_TO_UNDER_7', 'FROM_4_TO_UNDER_5', 'FROM_1_TO_UNDER_4'];
  if (valid.includes(val)) return val;
  const legacyMap: Record<string, string> = {
    VERY_GOOD: 'GTE_9',
    GOOD: 'FROM_7_TO_UNDER_9',
    FAIR: 'FROM_5_TO_UNDER_7',
    AVERAGE: 'FROM_4_TO_UNDER_5',
    POOR: 'FROM_1_TO_UNDER_4',
  };
  return legacyMap[val] || val;
};

const reverseMapAcademicRank = (value?: string | null) => {
  if (!value) return 'WEAK_WARNING_FIRST';
  const val = String(value).toUpperCase();
  const valid = ['EXCELLENT', 'GOOD', 'FAIR', 'AVERAGE', 'WEAK_NO_WARNING', 'WEAK_WARNING_FIRST'];
  if (valid.includes(val)) return val;
  const legacyMap: Record<string, string> = {
    WEAK_WARN: 'WEAK_WARNING_FIRST',
    WEAK_NO_WARN: 'WEAK_NO_WARNING',
  };
  return legacyMap[val] || val;
};

const reverseMapActivity1 = (value?: string | null) => {
  if (!value) return 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED';
  const val = String(value).toUpperCase();
  if (['GOOD_PARTICIPATION', 'FULL', 'ACTIVE', 'VERY_GOOD'].includes(val)) return 'GOOD_PARTICIPATION';
  if (['ABSENT_ONCE', 'ABSENT1', 'EXCUSED'].includes(val)) return 'ABSENT_ONCE';
  if (['ABSENT_TWICE', 'ABSENT2'].includes(val)) return 'ABSENT_TWICE';
  return 'ABSENT_MORE_THAN_TWICE_OR_NOT_PARTICIPATED';
};

const reverseMapActivity2 = (value?: string | null) => {
  if (!value) return 'none';
  const val = String(value).toLowerCase();
  if (['full_effective_participation', 'many', 'over50', 'excellent'].includes(val)) return 'many';
  if (['effective_participation_from_half', 'some', '50'].includes(val)) return 'some';
  if (['encouraged_others', 'active', 'encourage'].includes(val)) return 'active';
  if (['absent_over_half', 'full', 'under50'].includes(val)) return 'full';
  return 'none';
};

const reverseMapActivity3 = (value?: string | null) => {
  if (!value) return 'none';
  const val = String(value).toLowerCase();
  if (['full_effective_participation', 'prize_or_org', 'leader'].includes(val)) return 'prize_or_org';
  if (['active_one_or_more', 'active', 'member'].includes(val)) return 'active';
  if (['active_supporter', 'some'].includes(val)) return 'some';
  if (['absent_over_half', 'full', 'under50'].includes(val)) return 'full';
  return 'none';
};

const reverseMapActivity4 = (value?: string | null) => {
  if (!value) return 'none';
  const val = String(value).toLowerCase();
  if (['multiple_activities_or_reporting', 'active', 'very_active'].includes(val)) return 'active';
  if (['one_effective_activity', 'full'].includes(val)) return 'full';
  if (['awareness_or_support', 'some', 'aware'].includes(val)) return 'some';
  return 'none';
};

const reverseMapPolicy = (value?: string | null) => {
  if (!value) return 'VIOLATED';
  const val = String(value).toUpperCase();
  if (['GOOD_WITH_REWARD', 'EXCELLENT_PROPAGANDA', 'AWARDED'].includes(val)) return 'GOOD_WITH_REWARD';
  if (['GOOD', 'GOOD_PROPAGANDA', 'COMPLY'].includes(val)) return 'GOOD';
  if (['AVERAGE', 'MINOR_VIOLATION'].includes(val)) return 'AVERAGE';
  return 'VIOLATED';
};

const reverseMapSolidarity = (value?: string | null) => {
  if (!value) return 'none';
  const val = String(value).toLowerCase();
  if (['active_with_reward', 'excellent_achievements', 'awarded'].includes(val)) return 'excellent_achievements';
  if (['active', 'regular', 'good'].includes(val)) return 'regular';
  if (['participated', 'some', 'aware'].includes(val)) return 'some';
  return 'none';
};

const reverseMapLocality = (value?: string | null) => {
  if (!value) return 'TWO_WARNINGS';
  const val = String(value).toUpperCase();
  if (['GOOD', 'REWARDED'].includes(val)) return 'GOOD';
  if (['ONE_WARNING', 'WARNED1', 'WARNED'].includes(val)) return 'ONE_WARNING';
  return 'TWO_WARNINGS';
};

const reverseMapCadrePerformance = (value?: string | null) => {
  const map: Record<string, string> = {
    EXCELLENT: 'excellent',
    GOOD: 'good',
    FAIR: 'average',
    POOR: 'unsatisfactory',
  };
  return value ? map[value] || value : 'unsatisfactory';
};

const reverseMapManagementLevel = (value?: string | null) => {
  const map: Record<string, string> = {
    HEAD_POSITION: 'head',
    DEPUTY_POSITION: 'deputy',
    MEMBER_POSITION: 'member',
  };
  return value ? map[value] || value : 'none';
};

const reverseMapSpecialAchievement = (value?: string | null) => {
  if (!value) return 'NONE';
  const val = String(value).toUpperCase();
  if (['SCHOOL_LEVEL_OR_HIGHER', 'NATIONAL_OR_INTL', 'UNIVERSITY_LEVEL', 'NATIONAL_INTL'].includes(val)) {
    return 'SCHOOL_LEVEL_OR_HIGHER';
  }
  if (['FACULTY_LEVEL', 'PROVINCIAL_LEVEL', 'PROVINCIAL'].includes(val)) {
    return 'FACULTY_LEVEL';
  }
  return val;
};

export function StudentDetailReviewView() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const classId = getParam(params.classId);
  const evaluationId = getParam(params.studentId);
  const [loading, setLoading] = useState(true);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);

  // ── Zustand store (factory pattern — isolated per student mount) ──────────
  const [store] = useState<CouncilReviewStore>(() => createCouncilReviewStore());

  const [hasEvaluation, setHasEvaluation] = useState(false);
  const [student, setStudent] = useState<ReviewStudent | null>(null);
  const [evidences, setEvidences] = useState<ReviewEvidence[]>([]);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState<string>('submitted');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);


  const deductionWeights = useMemo(() => [10, 3, 5, 5, 5, 5, 5, 10, 20], []);
  // deductionLabels moved to councilReviewStore (DEDUCTION_LABELS constant)

  const loadEvaluationDetail = useCallback(async () => {
    if (!evaluationId || !classId) {
      setStudent(null);
      setHasEvaluation(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      store.getState().resetToDefault();
      setEvidences([]);
      const [detailResult, listResult] = await Promise.all([
        API_Admin.getEvaluationDetail(evaluationId),
        API_Admin.getAdminEvaluationList({ classId, page: 1, limit: 100 }),
      ]);

      const detail = unwrapData<any>(detailResult);
      const list = toArray<any>(unwrapData<any>(listResult));
      const listItem = list.find((item) => item.id === evaluationId);
      const studentInfo = detail.student || listItem?.student || {};
      const extractedCode =
        detail.studentCode ||
        studentInfo.studentCode ||
        studentInfo.code ||
        studentInfo.username ||
        studentInfo.user?.username ||
        studentInfo.user?.studentCode ||
        '';

      setStudent({
        id: detail.studentId || studentInfo.id || evaluationId,
        code: extractedCode && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(extractedCode) ? extractedCode : '-',
        fullName: studentInfo.fullName || detail.studentName || detail.fullName || 'Sinh viên',
      });
      const study = detail.sections?.study || detail.study || detail.studyScoreSection || {};
      const discipline = detail.sections?.discipline || detail.discipline || detail.disciplineScoreSection || {};
      const activity = detail.sections?.activity || detail.activity || detail.activityScoreSection || {};
      const community = detail.sections?.community || detail.community || detail.communityScoreSection || {};
      const role = detail.sections?.role || detail.role || detail.roleScoreSection || {};

      const activities = Array.isArray(study.activities) ? study.activities : [];
      const hasAcademicEvent = Boolean(
        activities.some((item: any) => item.code === 'ACADEMIC_EVENT_PARTICIPATION' && item.checked !== false) ||
        study.nckh || study.hasAcademicEvent || Number(study.scientificResearchScore) > 0
      );
      const hasPublication = Boolean(
        activities.some((item: any) => item.code === 'SCIENTIFIC_PUBLICATION_OR_CONTEST' && item.checked !== false) ||
        study.olympic || study.hasPublication || Number(study.olympicScore) > 0
      );
      const hasAward = Boolean(
        activities.some((item: any) => item.code === 'SCIENTIFIC_AWARD' && item.checked !== false) ||
        study.creative || study.hasAward || Number(study.creativeScore) > 0
      );

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
      const baseScore = discipline.baseScore !== undefined
        ? Math.min(25, Math.max(0, Number(discipline.baseScore) || 0))
        : 25;

      const roleTypeVal = String(role.studentRoleType || role.roleType || '').toUpperCase();
      const isClassOfficer = ['CLASS_OFFICER', 'CLASS_LEADER', 'CLASS_MONITOR', 'CADRE', 'OFFICER'].includes(roleTypeVal);
      const posStr = String(role.positionGroup || role.position || '').toUpperCase();
      const position = ['LEADER_GROUP', 'A1', 'LEADER', 'PRESIDENT', 'MONITOR'].includes(posStr) ? 'a1' : 'a2';

      const evidenceItems = Array.isArray(detail.evidences) ? detail.evidences : [];
      setEvidences(
        evidenceItems.map((evidence: any) => ({
          id: evidence.id,
          fileName: evidence.fileName || evidence.originalName || evidence.publicId || 'Minh chứng',
          fileType: String(evidence.mimeType || evidence.fileType || evidence.imageUrl || '').includes('pdf') ? 'pdf' : 'image',
          url: getEvidenceViewUrl(evidence),
          status: evidence.status || 'pending',
        }))
      );

      setHasEvaluation(true);

      const wfStatus = String(detail.status || listItem?.status || 'submitted').toLowerCase();
      setWorkflowStatus(wfStatus);

      const userRole = String(user?.role || '').toLowerCase();
      const isCL = userRole === 'class_leader';
      const isAdv = userRole === 'advisor';
      const isStudentUser = userRole === 'student';

      const review = detail.review || {};
      const confirmed = isCL
        ? Boolean(review.classLeaderReviewedAt || detail.classLeaderReviewedAt || detail.classLeaderConfirmedAt)
        : isAdv
          ? Boolean(review.classReviewedAt || detail.classReviewedAt || detail.advisorReviewedAt || detail.advisorConfirmedAt)
          : false;
      setIsConfirmed(confirmed);

      // Determine store role so council review columns follow the current workflow step.
      const storeRole = isAdv
        ? 'advisor'
        : isStudentUser
          ? 'student'
          : 'class_leader';

      // Push all loaded values into the Zustand store at once so
      // CouncilCriteriaReviewTable can read from store without props
      const svStudyAtStr = reverseMapStudyAttitude(study.regularScoreLevel);
      const svAcademicRankStr = reverseMapAcademicRank(study.academicRank);
      const roleType: 'cadre' | 'student' = isClassOfficer ? 'cadre' : 'student';
      store.getState().batchSet({
        currentUserRole: storeRole as any,
        workflowStatus: wfStatus,
        svStudyAttitude: svStudyAtStr,
        classStudyAttitude: svStudyAtStr,
        svAcademicRank: svAcademicRankStr,
        classAcademicRank: svAcademicRankStr,
        svNckh: hasAcademicEvent, classNckh: hasAcademicEvent,
        svOlympic: hasPublication, classOlympic: hasPublication,
        svCreative: hasAward, classCreative: hasAward,
        svNoViolationScore: baseScore, classNoViolationScore: baseScore,
        svDeductions: [...deductionCounts], classDeductions: [...deductionCounts],
        svActivity1: reverseMapActivity1(activity.politicalActivityLevel),
        classActivity1: reverseMapActivity1(activity.politicalActivityLevel),
        svActivity2: reverseMapActivity2(activity.cultureSportLevel), classActivity2: reverseMapActivity2(activity.cultureSportLevel),
        svActivity3: reverseMapActivity3(activity.clubActivityLevel), classActivity3: reverseMapActivity3(activity.clubActivityLevel),
        svActivity4: reverseMapActivity4(activity.socialPreventionLevel), classActivity4: reverseMapActivity4(activity.socialPreventionLevel),
        svRewardPoints: Number(activity.rewardScore) || 0, classRewardPoints: Number(activity.rewardScore) || 0,
        svPolicy: reverseMapPolicy(community.lawComplianceLevel), classPolicy: reverseMapPolicy(community.lawComplianceLevel),
        svSolidarity: reverseMapSolidarity(community.volunteerActivityLevel), classSolidarity: reverseMapSolidarity(community.volunteerActivityLevel),
        svLocality: reverseMapLocality(community.communityRelationshipLevel), classLocality: reverseMapLocality(community.communityRelationshipLevel),
        svRoleType: roleType, classRoleType: roleType,
        svCadrePosition: position, classCadrePosition: position,
        svCadrePerformance: reverseMapCadrePerformance(role.taskCompletionLevel), classCadrePerformance: reverseMapCadrePerformance(role.taskCompletionLevel),
        svManagementLevel: reverseMapManagementLevel(role.managementSkillLevel), classManagementLevel: reverseMapManagementLevel(role.managementSkillLevel),
        svClassParticipation: Number(role.normalStudentActivityScore) || 0, classClassParticipation: Number(role.normalStudentActivityScore) || 0,
        svSpecialAchievement: reverseMapSpecialAchievement(role.specialAchievementLevel), classSpecialAchievement: reverseMapSpecialAchievement(role.specialAchievementLevel),
      } as any);

    } catch (error: any) {
      setStudent(null);
      setHasEvaluation(false);
      toast.error(getUserFriendlyError(error, 'Không tải được phiếu đánh giá.'));
    } finally {
      setLoading(false);
    }
  }, [classId, deductionWeights, evaluationId, store, toast, user]);

  useEffect(() => {
    loadEvaluationDetail();
  }, [loadEvaluationDetail]);

  // uploadedFiles, handleDeductionChange, handleFileUpload, removeFile are
  // now handled inside CouncilCriteriaReviewTable via councilReviewStore.
  // No props needed — the store acts as the communication layer.

  const updateEvidence = (evidenceId: string, patch: Partial<ReviewEvidence>) => {
    setEvidences((current) =>
      current.map((evidence) => (evidence.id === evidenceId ? { ...evidence, ...patch } : evidence))
    );
  };

  const canConfirm = canConfirmReview(user?.role, { status: workflowStatus, classScore: 1 });

  const handleConfirmReview = async () => {
    if (!evaluationId) {
      toast.error('Không tìm thấy phiếu đánh giá.');
      return;
    }

    try {
      setConfirming(true);
      const { computeCouncilScores } = await import('@/store/councilReviewStore');
      const storeState = store.getState();
      const scoresResult = computeCouncilScores(storeState, false);

      const scoresPayload = [
        { criteriaCode: 'TC1', classScore: Math.min(20, Math.max(0, Math.round(scoresResult.sec1))) },
        { criteriaCode: 'TC2', classScore: Math.min(25, Math.max(0, Math.round(scoresResult.sec2))) },
        { criteriaCode: 'TC3', classScore: Math.min(20, Math.max(0, Math.round(scoresResult.sec3))) },
        { criteriaCode: 'TC4', classScore: Math.min(25, Math.max(0, Math.round(scoresResult.sec4))) },
        { criteriaCode: 'TC5', classScore: Math.min(10, Math.max(0, Math.round(scoresResult.sec5))) },
      ];

      // Send scores directly inside confirm-review request (Atomic confirm & save)
      const result = await API_Shared.confirmReview(evaluationId, { scores: scoresPayload });
      const responseData = unwrapData<any>(result);
      const confirmedEvaluation = responseData?.evaluation || responseData?.form || responseData;
      const review = responseData?.review || confirmedEvaluation?.review || {};
      const nextStatus = confirmedEvaluation?.status ? String(confirmedEvaluation.status).toLowerCase() : workflowStatus;
      const userRole = String(user?.role || '').toLowerCase();
      const hasReviewConfirmation = userRole === 'class_leader'
        ? Boolean(review.classLeaderReviewedAt || confirmedEvaluation?.classLeaderReviewedAt || confirmedEvaluation?.classLeaderConfirmedAt)
        : userRole === 'advisor'
          ? Boolean(review.classReviewedAt || confirmedEvaluation?.classReviewedAt || confirmedEvaluation?.advisorReviewedAt || confirmedEvaluation?.advisorConfirmedAt)
          : Boolean(review.classLeaderReviewedAt || review.classReviewedAt || confirmedEvaluation?.isConfirmed);

      setWorkflowStatus(nextStatus);
      store.getState().batchSet({ workflowStatus: nextStatus } as any);
      setIsConfirmed(hasReviewConfirmation || Boolean(responseData));
      if (typeof window !== 'undefined') {
        const roleKey = userRole === 'advisor' ? 'advisor' : 'class_leader';
        window.sessionStorage.setItem(`evaluation_review_confirmed:${roleKey}:${evaluationId}`, new Date().toISOString());
        window.dispatchEvent(new CustomEvent('evaluation_confirmed', {
          detail: {
            evaluationId,
            status: nextStatus,
            review,
          },
        }));
      }
      toast.success('Xác nhận đánh giá thành công.');
    } catch (error: any) {
      toast.error(getUserFriendlyError(error, 'Không xác nhận được đánh giá.'));
    } finally {
      setConfirming(false);
    }
  };

  const renderHeaderBadge = () => {
    if (workflowStatus === 'not_submitted' || workflowStatus === 'draft') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700">Chưa nộp phiếu</span>;
    }
    if (workflowStatus === 'rejected') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Bị trả về</span>;
    }
    if (workflowStatus === 'class_approved') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">Đã gửi khoa</span>;
    }
    if (workflowStatus === 'faculty_approved') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">Đã gửi PĐT</span>;
    }
    if (workflowStatus === 'finalized') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">Đã hoàn tất</span>;
    }
    if (user?.role === 'class_leader' && workflowStatus === 'class_leader_approved') {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-indigo-100 text-indigo-700">Đã gửi CVHT</span>;
    }
    if (isConfirmed) {
      return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700">Đã đánh giá</span>;
    }
    return <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700">Chưa đánh giá</span>;
  };

  const handleReturnToStudent = async () => {
    const reason = returnReason.trim();

    if (!evaluationId) {
      toast.error('Không tìm thấy phiếu đánh giá.');
      return;
    }

    if (!reason) {
      toast.error('Vui lòng nhập lý do gửi lại phiếu cho sinh viên.');
      return;
    }

    try {
      setReturning(true);
      await API_Admin.returnEvaluationToStudent(evaluationId, { reason });
      toast.success('Đã gửi lại phiếu cho sinh viên.');
      setReturnModalOpen(false);
      setReturnReason('');
      router.push(`/advisor/${classId}`);
    } catch (error: any) {
      toast.error(getUserFriendlyError(error, 'Không gửi lại được phiếu cho sinh viên.'));
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 p-4 sm:p-6">
      <StudentReviewHeader
        classId={classId}
        studentName={student?.fullName ?? 'Sinh viên'}
        studentCode={student?.code ?? '-'}
        rawStudentId={evaluationId}
      />

      {loading ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center gap-2.5 rounded-xl border border-gray-200 bg-white p-6 shadow-2xs">
          <Loader2 className="animate-spin text-indigo-600" size={34} />
          <p className="text-sm font-semibold text-gray-500">Đang tải phiếu đánh giá...</p>
        </div>
      ) : !student || !hasEvaluation ? (
        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-6 text-center shadow-2xs">
          <FileText size={38} className="text-gray-400" />
          <h2 className="mt-3 text-base font-bold text-gray-900">Không có phiếu đánh giá</h2>
          <p className="mt-1 max-w-md text-sm text-gray-500">
            Sinh viên này chưa có phiếu đã nộp hoặc dữ liệu không còn khả dụng trong lớp phụ trách.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h2 className="text-base font-bold text-gray-900">Bảng chấm chi tiết từng tiêu chí</h2>
                {renderHeaderBadge()}
              </div>
              <p className="text-xs text-gray-500">
                Cột Điểm SV tự đánh giá hiển thị điểm của sinh viên; Cán bộ chấm điểm chỉnh sửa cột Điểm Lớp đánh giá.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={loadEvaluationDetail}
                disabled={loading}
                aria-label="Tải lại dữ liệu ban đầu từ máy chủ"
                title="Tải lại dữ liệu gốc ban đầu"
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-2xs transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Tải lại dữ liệu ban đầu
              </button>
              <button
                type="button"
                onClick={() => setEvidenceModalOpen(true)}
                aria-label="Xem các minh chứng đính kèm của sinh viên"
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100"
              >
                <Paperclip size={15} />
                Xem minh chứng đính kèm
              </button>
            </div>
          </div>

          {/* ── CouncilCriteriaReviewTable: all state sourced from Zustand store ── */}
          <CouncilReviewStoreContext.Provider value={store}>
            <CouncilCriteriaReviewTable />
          </CouncilReviewStoreContext.Provider>

          <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
            {user?.role === 'advisor' && (
              <button
                type="button"
                onClick={() => setReturnModalOpen(true)}
                disabled={returning || confirming}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-6 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {returning ? <Loader2 className="animate-spin" size={15} /> : <RotateCcw size={15} />}
                Gửi lại cho sinh viên
              </button>
            )}
            {(canConfirm || canEditReviewScores(user?.role, workflowStatus)) && (
              <button
                type="button"
                onClick={handleConfirmReview}
                disabled={confirming || returning}
                className={`inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
                  isConfirmed ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                {confirming ? (
                  <Loader2 className="animate-spin" size={15} />
                ) : (
                  <CheckCircle2 size={15} />
                )}
                {confirming
                  ? 'Đang lưu...'
                  : isConfirmed
                    ? 'Đã đánh giá'
                    : 'Xác nhận đánh giá'}
              </button>
            )}
          </div>
        </>
      )}

      {returnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-base font-bold text-gray-900">Gửi lại phiếu cho sinh viên</h2>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                disabled={returning}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2 px-5 py-4">
              <label htmlFor="return-reason" className="text-sm font-semibold text-gray-700">
                Lý do gửi lại <span className="text-red-600">*</span>
              </label>
              <textarea
                id="return-reason"
                value={returnReason}
                onChange={(event) => setReturnReason(event.target.value)}
                maxLength={1000}
                rows={5}
                className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                placeholder="Nhập lý do để sinh viên biết cần chỉnh sửa nội dung nào..."
              />
              <p className="text-right text-xs text-gray-400">{returnReason.length}/1000</p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                disabled={returning}
                className="inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-lg border border-gray-200 px-4 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleReturnToStudent}
                disabled={returning || !returnReason.trim()}
                className="inline-flex min-h-[40px] cursor-pointer items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {returning && <Loader2 className="animate-spin" size={15} />}
                Gửi lại
              </button>
            </div>
          </div>
        </div>
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
