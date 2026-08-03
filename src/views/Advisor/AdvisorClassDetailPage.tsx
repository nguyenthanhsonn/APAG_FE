'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { API_Admin } from '@/api/API_Admin';
import CustomSelect from '@/components/common/CustomSelect';
import { useToast } from '@/components/common/ToastProvider';
import { useAuthStore } from '@/store/authStore';
import { getUserFriendlyError } from '@/utils/errorHelper';
import ClassDetailHeader from './ClassDetailHeader';
import StudentProgressTable from './StudentProgressTable';
import type { CouncilStudentReview, StudentReviewStatus } from './StudentProgressTable';

/* ── Helpers ── */
const getParam = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value ?? '');

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)) {
    return (value as { items: T[] }).items;
  }
  return [];
}

function toReviewStatus(status?: string): StudentReviewStatus {
  const normalized = String(status || '').toLowerCase();
  if (['submitted', 'class_approved', 'finalized'].includes(normalized)) return 'submitted';
  return 'not_submitted';
}

function normalizeKey(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function getStudentIdentityKeys(student: any) {
  return [
    student.studentId, student.id, student.userId, student.user?.id,
    student.email, student.user?.email, student.studentCode, student.code,
    student.fullName, student.name, student.user?.fullName,
  ].map(normalizeKey).filter(Boolean);
}

function getEvaluationIdentityKeys(evaluation: any) {
  return [
    evaluation.studentId, evaluation.student?.id, evaluation.student?.userId,
    evaluation.userId, evaluation.student?.email, evaluation.email,
    evaluation.studentCode, evaluation.student?.studentCode,
    evaluation.studentName, evaluation.student?.fullName,
  ].map(normalizeKey).filter(Boolean);
}

/* ── Filter status options ── */
type ReviewStatusFilter = 'all' | StudentReviewStatus;
const statusOptions = [
  { id: 'all', name: 'Tất cả trạng thái' },
  { id: 'submitted', name: 'Đã nộp' },
  { id: 'not_submitted', name: 'Chưa nộp' },
];

interface ClassMetadata {
  code?: string;
  name?: string;
  majorName?: string;
  facultyName?: string;
  enrollmentYear?: string | number;
}

/* ── Main Component ── */
export default function AdvisorClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const paramClassId = getParam(params?.classId);
  const userFirstClass = user?.managedClasses?.[0];
  const classId = paramClassId || userFirstClass?.classId || userFirstClass?.id || (user as any)?.classId || (user as any)?.class?.id || '';

  const [loading, setLoading] = useState(true);
  const [classDetail, setClassDetail] = useState<ClassMetadata | null>(null);
  const [className, setClassName] = useState('Lớp phụ trách');
  const [students, setStudents] = useState<CouncilStudentReview[]>([]);
  const [semester, setSemester] = useState('all');
  const [status, setStatus] = useState<ReviewStatusFilter>('all');
  const [keyword, setKeyword] = useState('');

  /* ── Data Fetch ── */
  useEffect(() => {
    let mounted = true;
    const fallbackClass =
      user?.managedClasses?.find((item) => (item.classId || item.id) === classId) ||
      userFirstClass;
    const fallbackName = fallbackClass?.className || fallbackClass?.name || fallbackClass?.classCode || fallbackClass?.code || 'Lớp phụ trách';
    const fallbackCode = fallbackClass?.classCode || fallbackClass?.code || classId;

    setClassName(fallbackName);
    setClassDetail({
      code: fallbackCode,
      name: fallbackName,
    });

    const loadStudents = async () => {
      if (!classId) {
        setStudents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const [classDetailResult, studentsResult] = await Promise.all([
          API_Admin.getAdvisorClassById(classId),
          API_Admin.getClassStudents(classId, { page: 1, limit: 100 }),
        ]);

        if (!mounted) return;

        const rawClass = (classDetailResult as any)?.data || classDetailResult;
        if (rawClass) {
          const code = rawClass.code || rawClass.classCode || fallbackCode;
          const name = rawClass.name || rawClass.className || code;
          const majorName = rawClass.major?.name || rawClass.majorName;
          const facultyName = rawClass.faculty?.name || rawClass.major?.faculty?.name || rawClass.facultyName;
          const enrollmentYear = rawClass.enrollmentYear || rawClass.academicYear;

          setClassName(name);
          setClassDetail({
            code,
            name,
            majorName,
            facultyName,
            enrollmentYear,
          });
        }

        const classStudents = toArray<any>(studentsResult);
        const evaluationsResult = await API_Admin.getAdminEvaluationList({
          classId,
          page: 1,
          limit: Math.max(classStudents.length, 20),
        });

        if (!mounted) return;

        const evaluations = toArray<any>(evaluationsResult);
        const firstEvalClass = evaluations[0]?.class;
        if (firstEvalClass) {
          const code = firstEvalClass.code || firstEvalClass.classCode || fallbackCode;
          const name = firstEvalClass.name || firstEvalClass.className || code;
          const majorName = firstEvalClass.major?.name || firstEvalClass.majorName;
          const facultyName = firstEvalClass.faculty?.name || firstEvalClass.major?.faculty?.name || firstEvalClass.facultyName;

          setClassName(name);
          setClassDetail((prev) => ({
            code: prev?.code || code,
            name: name || prev?.name,
            majorName: prev?.majorName || majorName,
            facultyName: prev?.facultyName || facultyName,
            enrollmentYear: prev?.enrollmentYear,
          }));
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
        if (!mounted) return;
        setStudents([]);
        toast.error(getUserFriendlyError(error, 'Không tải được danh sách sinh viên của lớp.'));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadStudents();
    return () => { mounted = false; };
  }, [classId, toast, user?.managedClasses, userFirstClass]);

  /* ── Dynamic Document Title ── */
  useEffect(() => {
    const code = classDetail?.code || classId;
    const name = classDetail?.name || className;
    if (code && name && code !== name) {
      document.title = `Lớp ${code} - ${name} | Đánh giá Rèn luyện`;
    } else {
      document.title = `Lớp ${code} | Đánh giá Rèn luyện`;
    }
  }, [classDetail, className, classId]);

  /* ── Filter Logic ── */
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

  const hasNotSubmitted = students.some((s) => s.status === 'not_submitted');
  const hasActiveFilter = semester !== 'all' || status !== 'all' || keyword.trim() !== '';

  const clearFilters = useCallback(() => {
    setSemester('all');
    setStatus('all');
    setKeyword('');
  }, []);

  const handleReview = useCallback(
    (studentId: string) => {
      const basePath = user?.role === 'class_leader' ? '/class_leader' : '/advisor';
      router.push(`${basePath}/${classId}/${studentId}`);
    },
    [classId, router, user?.role],
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 p-4 sm:p-6">
      {/* Semantic Page Header Component */}
      <ClassDetailHeader
        classCode={classDetail?.code || classId}
        className={classDetail?.name || className}
        majorName={classDetail?.majorName}
        facultyName={classDetail?.facultyName}
        enrollmentYear={classDetail?.enrollmentYear}
        totalStudents={students.length}
        hasNotSubmitted={hasNotSubmitted}
        onSendToAdmin={() => {
          toast.success('Đã gửi phiếu đánh giá của toàn bộ lớp lên Admin phê duyệt.');
        }}
        hideBreadcrumb={user?.role === 'class_leader'}
      />

      {/* Sticky Filter Bar on Scroll */}
      <div className="sticky top-0 z-20 rounded-xl border border-gray-200 bg-white/95 backdrop-blur-xs p-4 shadow-xs transition-shadow">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[220px_220px_1fr]">
          <CustomSelect
            label="Học kỳ"
            value={semester}
            onChange={setSemester}
            options={[{ id: 'all', name: 'Tất cả học kỳ' }]}
          />
          <CustomSelect
            label="Trạng thái"
            value={status}
            onChange={(value) => setStatus(value as ReviewStatusFilter)}
            options={statusOptions}
          />
          <div>
            <label htmlFor="search-student-input" className="mb-1 block text-xs font-bold uppercase text-gray-600">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="search-student-input"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                placeholder="Tìm theo tên hoặc Mã sinh viên"
              />
            </div>
          </div>
        </div>

        {/* Clear Filters Link (visible only when active) */}
        {hasActiveFilter && (
          <div className="mt-3 border-t border-gray-100 pt-2.5">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-indigo-600 transition hover:text-indigo-700"
            >
              <X size={14} />
              Xóa bộ lọc
            </button>
          </div>
        )}
      </div>

      {/* Semantic Student Progress Table Component */}
      <StudentProgressTable
        students={filteredStudents}
        loading={loading}
        onReview={handleReview}
        hasActiveFilter={hasActiveFilter}
        onClearFilters={clearFilters}
      />
    </div>
  );
}
