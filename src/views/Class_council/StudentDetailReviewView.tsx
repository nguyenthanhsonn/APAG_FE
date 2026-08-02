'use client';

import { useEffect, useMemo, useState } from 'react';
import { FileText, Loader2, Paperclip, Send } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { API_Admin } from '@/api/API_Admin';
import { CouncilCriteriaReviewTable } from '@/components/class_council/CouncilCriteriaReviewTable';
import EvidenceReviewModal, { type ReviewEvidence } from '@/components/class_council/EvidenceReviewModal';
import StudentReviewHeader from '@/components/class_council/StudentReviewHeader';
import { useToast } from '@/components/common/ToastProvider';
import { useAuthStore } from '@/store/authStore';
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
  const user = useAuthStore((state) => state.user);
  const classId = getParam(params.classId);
  const evaluationId = getParam(params.studentId);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  // ── Zustand store (factory pattern — isolated per student mount) ──────────
  const [store] = useState<CouncilReviewStore>(() => createCouncilReviewStore());

  const [hasEvaluation, setHasEvaluation] = useState(false);
  const [student, setStudent] = useState<ReviewStudent | null>(null);
  const [evidences, setEvidences] = useState<ReviewEvidence[]>([]);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [isSubmittedLate, setIsSubmittedLate] = useState(false);

  const deductionWeights = useMemo(() => [10, 3, 5, 5, 5, 5, 5, 10, 20], []);
  // deductionLabels moved to councilReviewStore (DEDUCTION_LABELS constant)

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
        const study = detail.sections?.study || {};
        const discipline = detail.sections?.discipline || {};
        const activity = detail.sections?.activity || {};
        const community = detail.sections?.community || {};
        const role = detail.sections?.role || {};

        const activities = Array.isArray(study.activities) ? study.activities : [];
        const hasAcademicEvent = activities.some((item: any) => item.code === 'ACADEMIC_EVENT_PARTICIPATION' && item.checked !== false);
        const hasPublication = activities.some((item: any) => item.code === 'SCIENTIFIC_PUBLICATION_OR_CONTEST' && item.checked !== false);
        const hasAward = activities.some((item: any) => item.code === 'SCIENTIFIC_AWARD' && item.checked !== false);

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

        const isClassOfficer = role.studentRoleType === 'CLASS_OFFICER';
        const position = role.positionGroup === 'LEADER_GROUP' ? 'a1' : 'a2';

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
      router.push(user?.role === 'class_leader' ? '/class_leader' : `/advisor/${classId}`);
    } catch (error: any) {
      toast.error(getUserFriendlyError(error, 'Không gửi được phiếu lên Admin.'));
    } finally {
      setApproving(false);
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
              <h2 className="text-base font-bold text-gray-900">Bảng chấm chi tiết từng tiêu chí</h2>
              <p className="mt-0.5 text-xs text-gray-500">
                Cột Cá nhân đánh giá là điểm sinh viên đã tự chấm; Cố vấn lớp chỉ chỉnh cột Lớp/GVCN đánh giá.
              </p>
            </div>
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
