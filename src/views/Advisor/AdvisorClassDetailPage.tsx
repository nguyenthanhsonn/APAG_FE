'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { API_Admin } from '@/api/API_Admin';
import { API_Shared } from '@/api/API_Shared';
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

function unwrapData<T>(res: any): T {
  if (res && typeof res === 'object' && 'data' in res && res.data !== null && res.data !== undefined) {
    return res.data as T;
  }
  return res as T;
}

function toReviewStatus(status?: string): StudentReviewStatus {
  const normalized = String(status || '').toLowerCase();
  if (['submitted', 'class_leader_approved', 'class_approved', 'advisor_approved', 'faculty_approved', 'finalized'].includes(normalized)) return 'submitted';
  return 'not_submitted';
}

function normalizeKey(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function getStudentIdentityKeys(student: any) {
  return [
    student.studentId, student.id, student.userId, student.user?.id, student.student?.id,
    student.email, student.user?.email, student.studentCode, student.code, student.user?.studentCode, student.username, student.user?.username,
    student.fullName, student.name, student.user?.fullName,
  ].map(normalizeKey).filter(Boolean);
}

function getEvaluationIdentityKeys(evaluation: any) {
  return [
    evaluation.studentId, evaluation.student?.id, evaluation.student?.userId, evaluation.student?.user?.id,
    evaluation.userId, evaluation.user?.id, evaluation.id,
    evaluation.student?.email, evaluation.email, evaluation.user?.email,
    evaluation.studentCode, evaluation.student?.studentCode, evaluation.student?.code, evaluation.student?.user?.studentCode, evaluation.student?.username, evaluation.username, evaluation.code,
    evaluation.studentName, evaluation.student?.fullName, evaluation.student?.name, evaluation.fullName, evaluation.user?.fullName,
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
  const assignedClass = useMemo(
    () =>
      user?.managedClasses?.find((item) => {
        const assignedId = item.classId || item.id;
        return assignedId === classId;
      }) || userFirstClass,
    [classId, user?.managedClasses, userFirstClass],
  );
  const assignedClassCode = assignedClass?.classCode || assignedClass?.code || '';
  const assignedClassName = assignedClass?.className || assignedClass?.name || assignedClassCode || 'Chi tiết lớp';
  const assignedClassMajorName = assignedClass?.major?.name;
  const assignedClassFacultyName = assignedClass?.faculty?.name || assignedClass?.facultyName;
  const assignedClassEnrollmentYear = assignedClass?.enrollmentYear;

  const [loading, setLoading] = useState(true);
  const [className, setClassName] = useState(assignedClassName);
  const [classDetail, setClassDetail] = useState<ClassMetadata | null>(
    assignedClass
      ? {
          code: assignedClassCode,
          name: assignedClassName,
          majorName: assignedClassMajorName,
          facultyName: assignedClassFacultyName,
          enrollmentYear: assignedClassEnrollmentYear,
        }
      : null,
  );
  const [students, setStudents] = useState<CouncilStudentReview[]>([]);
  const [semester, setSemester] = useState('all');
  const [status, setStatus] = useState<ReviewStatusFilter>('all');
  const [keyword, setKeyword] = useState('');
  const [submittingClass, setSubmittingClass] = useState(false);

  /* ── Data Fetch ── */
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!classId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const fallbackCode = assignedClassCode || `LỚP-${classId.slice(0, 8).toUpperCase()}`;
        setClassName(assignedClassName);
        setClassDetail({
          code: fallbackCode,
          name: assignedClassName,
          majorName: assignedClassMajorName,
          facultyName: assignedClassFacultyName,
          enrollmentYear: assignedClassEnrollmentYear,
        });

        let detailResult: any = null;
        let studentsResult: any = null;
        let evaluationsResult: any = [];

        try {
          detailResult = await API_Shared.getClassDetails(classId);
        } catch {
          detailResult = null;
        }

        const classInfo = unwrapData<any>(detailResult);
        if (classInfo && mounted) {
          const code = classInfo.code || classInfo.classCode || fallbackCode;
          const name = classInfo.name || classInfo.className || code;
          const majorName = classInfo.major?.name || classInfo.majorName;
          const facultyName = classInfo.faculty?.name || classInfo.major?.faculty?.name || classInfo.facultyName;

          setClassName(name);
          setClassDetail({
            code,
            name,
            majorName,
            facultyName,
            enrollmentYear: classInfo.enrollmentYear || classInfo.academicYear,
          });
        }

        try {
          studentsResult = await API_Shared.getClassStudents(classId, { page: 1, limit: 100 });
        } catch {
          studentsResult = [];
        }

        const classStudents = toArray<any>(unwrapData<any>(studentsResult));

        try {
          evaluationsResult = await API_Shared.getTrainingEvaluations({
            classId,
            page: 1,
            limit: 100,
          });
        } catch {
          evaluationsResult = [];
        }

        if (!mounted) return;

        const evaluations = toArray<any>(unwrapData<any>(evaluationsResult));
        const evaluationsByKey = new Map<string, any>();
        evaluations.forEach((evaluation) => {
          getEvaluationIdentityKeys(evaluation).forEach((key) => {
            evaluationsByKey.set(key, evaluation);
          });
        });

        const sourceList =
          classStudents.length > 0
            ? classStudents
            : evaluations.map((e) => ({
                id: e.studentId || e.student?.id || e.user?.id || e.id,
                studentCode:
                  e.studentCode ||
                  e.student?.studentCode ||
                  e.student?.code ||
                  e.user?.studentCode ||
                  e.user?.code ||
                  '-',
                fullName: e.studentName || e.student?.fullName || e.user?.fullName || 'Sinh viên',
                ...e.student,
              }));

        const mappedStudents = sourceList.map((student, idx) => {
          const studentId = student.studentId || student.id || student.userId || '';
          let evaluation = getStudentIdentityKeys(student)
            .map((key) => evaluationsByKey.get(key))
            .find(Boolean);

          if (!evaluation && evaluations[idx]) {
            const ev = evaluations[idx];
            if (evaluations.length === sourceList.length || ev.studentId === studentId || ev.student?.id === studentId) {
              evaluation = ev;
            }
          }

          const totalScore = evaluation?.totalScore ?? evaluation?.studentScore ?? evaluation?.selfScore ?? null;
          const review = evaluation?.review || {};
          const classScore =
            typeof evaluation?.classScore === 'number'
              ? evaluation.classScore
              : typeof review.classScore === 'number'
                ? review.classScore
                : null;
          const roleKey = user?.role === 'advisor' ? 'advisor' : 'class_leader';
          const storedConfirmedAt =
            typeof window !== 'undefined' && evaluation?.id
              ? window.sessionStorage.getItem(`evaluation_review_confirmed:${roleKey}:${evaluation.id}`)
              : null;

          const isCLConfirmed = Boolean(
            review.classLeaderReviewedAt ||
            evaluation?.classLeaderReviewedAt ||
            evaluation?.classLeaderConfirmedAt ||
            evaluation?.reviewedAt ||
            (roleKey === 'class_leader' && storedConfirmedAt) ||
            evaluation?.isConfirmed ||
            (evaluation && (evaluation.status === 'class_leader_approved' || evaluation.status === 'class_approved' || evaluation.status === 'faculty_approved' || evaluation.status === 'finalized'))
          );

          const isAdvConfirmed = Boolean(
            review.classReviewedAt ||
            evaluation?.classReviewedAt ||
            evaluation?.advisorReviewedAt ||
            evaluation?.advisorConfirmedAt ||
            (roleKey === 'advisor' && storedConfirmedAt) ||
            evaluation?.isConfirmed ||
            (evaluation && (evaluation.status === 'class_approved' || evaluation.status === 'faculty_approved' || evaluation.status === 'finalized'))
          );

          const rawCLDate = review.classLeaderReviewedAt || evaluation?.classLeaderReviewedAt || evaluation?.classLeaderConfirmedAt || evaluation?.reviewedAt || storedConfirmedAt;
          const rawAdvDate = review.classReviewedAt || evaluation?.classReviewedAt || evaluation?.advisorReviewedAt || storedConfirmedAt;

          return {
            id: evaluation?.id || studentId,
            evaluationId: evaluation?.id,
            code: student.studentCode || student.code || evaluation?.studentCode || evaluation?.student?.studentCode || '-',
            fullName: student.fullName || student.name || student.user?.fullName || evaluation?.studentName || evaluation?.student?.fullName || 'Sinh viên',
            selfScore: typeof totalScore === 'number' ? totalScore : null,
            classScore,
            status: evaluation ? toReviewStatus(evaluation.status) : 'not_submitted',
            workflowStatus: evaluation?.status || 'not_submitted',
            statusLabel: evaluation?.statusLabel,
            classLeaderReviewedAt: isCLConfirmed ? (rawCLDate || new Date().toISOString()) : null,
            classReviewedAt: isAdvConfirmed ? (rawAdvDate || new Date().toISOString()) : null,
          } satisfies CouncilStudentReview;
        });

        setStudents(mappedStudents);
      } catch (error: any) {
        if (!mounted) return;
        setStudents([]);
        const status = error?.response?.status || error?.statusCode || error?.status;
        if (status !== 403 && status !== 404) {
          toast.error(getUserFriendlyError(error, 'Không tải được danh sách sinh viên của lớp.'));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    const handleRefresh = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleRefresh);
      window.addEventListener('evaluation_confirmed', handleRefresh);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleRefresh);
        window.removeEventListener('evaluation_confirmed', handleRefresh);
      }
    };
  }, [assignedClassCode, assignedClassEnrollmentYear, assignedClassFacultyName, assignedClassMajorName, assignedClassName, classId, toast, user?.role]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const isClassLeader = user?.role === 'class_leader';
  const selectableStudents = useMemo(
    () =>
      students.filter((s) => {
        const normWf = String(s.workflowStatus || s.status || '').toLowerCase();
        if (isClassLeader) {
          return normWf === 'submitted' && Boolean(s.classLeaderReviewedAt);
        }
        return normWf === 'class_leader_approved' && Boolean(s.classReviewedAt);
      }),
    [students, isClassLeader],
  );

  const handleToggleSelect = useCallback((studentId: string) => {
    setSelectedIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId],
    );
  }, []);

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const selectableIds = selectableStudents.map((s) => s.id);
      const allSelected = selectableIds.length > 0 && selectableIds.every((id) => prev.includes(id));
      return allSelected ? [] : selectableIds;
    });
  }, [selectableStudents]);

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
    [classId, router, user],
  );

  const handleSubmitClass = useCallback(async () => {
    if (!classId || submittingClass || selectedIds.length === 0) {
      return;
    }

    try {
      setSubmittingClass(true);
      const payload = { evaluationIds: selectedIds };
      const result =
        user?.role === 'class_leader'
          ? await API_Admin.submitClassToAdvisor(classId, payload)
          : await API_Admin.submitClassToFaculty(classId, payload);
      const data = (result as any)?.data || result;
      toast.success(data?.message || `Đã gửi ${selectedIds.length} phiếu đánh giá thành công.`);
      setSelectedIds([]);
      setConfirmModalOpen(false);

      // Refresh list
      setStudents((prev) =>
        prev.map((s) => {
          if (!selectedIds.includes(s.id)) return s;
          const nextWf = user?.role === 'class_leader' ? 'class_leader_approved' : 'class_approved';
          return { ...s, workflowStatus: nextWf, status: toReviewStatus(nextWf) };
        }),
      );
    } catch (error: any) {
      toast.error(getUserFriendlyError(error, 'Không gửi được danh sách phiếu đánh giá.'));
    } finally {
      setSubmittingClass(false);
    }
  }, [classId, selectedIds, submittingClass, toast, user]);

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
        hasNotSubmitted={selectedIds.length === 0}
        submitting={submittingClass}
        sendLabel={
          user?.role === 'class_leader'
            ? selectedIds.length > 0
              ? `Gửi Cố vấn học tập (${selectedIds.length})`
              : 'Gửi Cố vấn học tập'
            : selectedIds.length > 0
              ? `Gửi Khoa (${selectedIds.length})`
              : 'Gửi Khoa'
        }
        onSendToAdmin={() => {
          if (selectedIds.length > 0) {
            setConfirmModalOpen(true);
          }
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
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
      />

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Xác nhận gửi phiếu đánh giá</h3>
            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn gửi <strong className="text-indigo-600 font-bold">{selectedIds.length}</strong> phiếu đánh giá đã chọn lên {user?.role === 'class_leader' ? 'Cố vấn học tập' : 'Khoa'} không?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={submittingClass}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleSubmitClass()}
                disabled={submittingClass}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer transition-colors inline-flex items-center gap-1.5"
              >
                {submittingClass && <Loader2 size={14} className="animate-spin" />}
                Xác nhận gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
