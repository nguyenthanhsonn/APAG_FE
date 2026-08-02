'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { API_Admin } from '@/api/API_Admin';
import ClassReviewFilterBar, { type ReviewStatusFilter } from '@/components/class_council/ClassReviewFilterBar';
import ClassStatsWidget from '@/components/class_council/ClassStatsWidget';
import StudentReviewTable, { type CouncilStudentReview, type StudentReviewStatus } from '@/components/class_council/StudentReviewTable';
import { useToast } from '@/components/common/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import { getUserFriendlyError } from '@/utils/errorHelper';

const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value ?? '');

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }

  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }

  return [];
}

function toReviewStatus(status?: string): StudentReviewStatus {
  const normalized = String(status || '').toLowerCase();

  if (['submitted', 'class_approved', 'finalized'].includes(normalized)) {
    return 'submitted';
  }

  return 'not_submitted';
}

function normalizeKey(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function getStudentIdentityKeys(student: any) {
  return [
    student.studentId,
    student.id,
    student.userId,
    student.user?.id,
    student.email,
    student.user?.email,
    student.studentCode,
    student.code,
    student.fullName,
    student.name,
    student.user?.fullName,
  ]
    .map(normalizeKey)
    .filter(Boolean);
}

function getEvaluationIdentityKeys(evaluation: any) {
  return [
    evaluation.studentId,
    evaluation.student?.id,
    evaluation.student?.userId,
    evaluation.userId,
    evaluation.student?.email,
    evaluation.email,
    evaluation.studentCode,
    evaluation.student?.studentCode,
    evaluation.studentName,
    evaluation.student?.fullName,
  ]
    .map(normalizeKey)
    .filter(Boolean);
}

export function StudentListView() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const classId = getParam(params.classId);
  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState('Lớp phụ trách');
  const [students, setStudents] = useState<CouncilStudentReview[]>([]);
  const [semester, setSemester] = useState('all');
  const [status, setStatus] = useState<ReviewStatusFilter>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    let mounted = true;
    const fallbackClass = user?.managedClasses?.find((item) => (item.classId || item.id) === classId);
    setClassName(fallbackClass?.className || fallbackClass?.name || fallbackClass?.classCode || fallbackClass?.code || 'Lớp phụ trách');

    const loadStudents = async () => {
      if (!classId) {
        setStudents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [classDetailResult, studentsResult] = await Promise.all([
          API_Admin.getClassCouncilClassById(classId),
          API_Admin.getClassStudents(classId),
        ]);

        if (!mounted) {
          return;
        }

        const classDetail = (classDetailResult as any)?.data || classDetailResult;
        if (classDetail?.name || classDetail?.code) {
          setClassName(classDetail.name || classDetail.code);
        }

        const classStudents = toArray<any>(studentsResult);
        const evaluationsResult = await API_Admin.getAdminEvaluationList({
          classId,
          page: 1,
          limit: Math.max(classStudents.length, 20),
        });

        if (!mounted) {
          return;
        }

        const evaluations = toArray<any>(evaluationsResult);
        const firstEvaluation = evaluations[0];
        if (firstEvaluation?.class?.name || firstEvaluation?.class?.code) {
          setClassName(firstEvaluation.class.name || firstEvaluation.class.code);
        }
        const evaluationsByKey = new Map<string, any>();

        evaluations.forEach((evaluation) => {
          getEvaluationIdentityKeys(evaluation).forEach((key) => {
            evaluationsByKey.set(key, evaluation);
          });
        });

        const mappedStudents = classStudents.map((student) => {
          const studentId = student.studentId || student.id || student.userId || '';
          const evaluation = getStudentIdentityKeys(student)
            .map((key) => evaluationsByKey.get(key))
            .find(Boolean);
          const totalScore = evaluation?.totalScore ?? evaluation?.studentScore ?? evaluation?.selfScore ?? null;

          return {
            id: evaluation?.id || studentId,
            code: student.studentCode || student.code || '-',
            fullName: student.fullName || student.name || student.user?.fullName || 'Sinh viên',
            selfScore: typeof totalScore === 'number' ? totalScore : null,
            status: evaluation ? toReviewStatus(evaluation.status) : 'not_submitted',
            workflowStatus: evaluation?.status || 'not_submitted',
            statusLabel: evaluation?.statusLabel,
          } satisfies CouncilStudentReview;
        });

        setStudents(mappedStudents);
      } catch (error: any) {
        if (!mounted) {
          return;
        }
        setStudents([]);
        toast.error(getUserFriendlyError(error, 'Không tải được danh sách sinh viên của lớp.'));
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadStudents();

    return () => {
      mounted = false;
    };
  }, [classId, semester, toast, user?.managedClasses]);

  const filteredStudents = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    return students.filter((student) => {
      const matchStatus = status === 'all' || student.status === status;
      const matchKeyword =
        !normalizedKeyword ||
        student.fullName.toLowerCase().includes(normalizedKeyword) ||
        student.code.toLowerCase().includes(normalizedKeyword);
      return matchStatus && matchKeyword;
    });
  }, [students, status, keyword]);

  const submitted = students.filter((student) => student.status === 'submitted').length;
  const approved = 0;
  const notSubmitted = students.filter((student) => student.status === 'not_submitted').length;
  const hasNotSubmitted = students.some((student) => student.status === 'not_submitted');

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => router.push('/advisor')}
            className="mb-2 inline-flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-brand-secondary hover:text-brand-primary"
          >
            <ArrowLeft size={16} />
            Quay lại danh sách lớp
          </button>
          <h1 className="ui-page-title">{className}</h1>
          <p className="mt-1 text-sm text-[#868E96]">Danh sách sinh viên và trạng thái nộp phiếu.</p>
        </div>
        <button
          type="button"
          disabled={hasNotSubmitted || students.length === 0}
          title={hasNotSubmitted ? 'Còn sinh viên chưa nộp phiếu đánh giá.' : undefined}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} />
          Gửi cả lớp lên Admin
        </button>
      </div>

      {loading ? (
        <div className="flex min-h-[360px] flex-col items-center justify-center gap-2.5 rounded-xl border border-[#E9ECEF] bg-white p-6 shadow-sm">
          <Loader2 className="animate-spin text-brand-primary" size={34} />
          <p className="text-sm font-semibold text-[#868E96]">Đang tải danh sách sinh viên...</p>
        </div>
      ) : (
        <>
          <ClassStatsWidget
            total={students.length}
            submitted={submitted}
            approved={approved}
            notSubmitted={notSubmitted}
          />
          <ClassReviewFilterBar
            semester={semester}
            semesterOptions={[]}
            status={status}
            keyword={keyword}
            onSemesterChange={setSemester}
            onStatusChange={setStatus}
            onKeywordChange={setKeyword}
          />
          <StudentReviewTable
            students={filteredStudents}
            onReview={(studentId) => router.push(`/advisor/${classId}/${studentId}`)}
          />
        </>
      )}
    </div>
  );
}
