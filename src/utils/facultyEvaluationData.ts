import type { AdminEvaluationItem } from '@/types';

export type FacultyStudentStatus =
  | 'APPROVED'
  | 'WAITING_APPROVAL'
  | 'REJECTED'
  | 'NOT_SUBMITTED';

export interface FacultyStudentRecord {
  id: string;
  evaluationId: string;
  code: string;
  name: string;
  score: number;
  rank: string;
  status: FacultyStudentStatus;
  rawStatus: string;
  date: string;
}

export interface FacultyClassRecord {
  id: string;
  className: string;
  leader: string;
  totalStudents: number;
  submittedCount: number;
  approvedCount: number;
  status: 'PENDING_FACULTY' | 'FACULTY_APPROVED' | 'IN_PROGRESS';
  date: string;
  evaluations: FacultyStudentRecord[];
}

export function toArray<T>(result: any): T[] {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.items)) return result.items;
  if (Array.isArray(result?.data?.items)) return result.data.items;
  if (Array.isArray(result?.data)) return result.data;
  return [];
}

export function resolveFacultyId(user: any): string {
  const firstManagedFaculty = user?.managedFaculty || user?.managedFaculties?.[0];
  return (
    firstManagedFaculty?.facultyId ||
    firstManagedFaculty?.id ||
    user?.facultyId ||
    user?.faculty?.id ||
    ''
  );
}

export function getEvaluationClassId(item: any): string {
  return item.classId || item.class?.id || item.student?.classId || item.student?.class?.id || '';
}

function getEvaluationClassName(item: any): string {
  return (
    item.className ||
    item.class?.name ||
    item.class?.code ||
    item.student?.className ||
    item.student?.class?.name ||
    'Lớp chưa xác định'
  );
}

function getStudentCode(item: any): string {
  return item.studentCode || item.student?.studentCode || item.student?.code || '—';
}

function getStudentName(item: any): string {
  return item.studentName || item.student?.fullName || item.student?.name || 'Sinh viên chưa xác định';
}

function getScore(item: any): number {
  return Number(item.finalScore ?? item.classScore ?? item.totalScore ?? item.studentScore ?? 0);
}

function getRank(item: any): string {
  return item.classification || item.rankLabel || item.rank || '-';
}

function getDate(item: any): string {
  const value = item.submittedAt || item.updatedAt || item.createdAt;
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleDateString('vi-VN');
}

function mapStatus(status?: string): FacultyStudentStatus {
  if (status === 'faculty_approved' || status === 'finalized') return 'APPROVED';
  if (status === 'rejected') return 'REJECTED';
  if (!status || status === 'draft') return 'NOT_SUBMITTED';
  return 'WAITING_APPROVAL';
}

export function mapEvaluationToFacultyStudent(item: AdminEvaluationItem): FacultyStudentRecord {
  const rawStatus = String((item as any).status || '');
  return {
    id: String((item as any).studentId || item.id),
    evaluationId: item.id,
    code: getStudentCode(item),
    name: getStudentName(item),
    score: getScore(item),
    rank: getRank(item),
    status: mapStatus(rawStatus),
    rawStatus,
    date: getDate(item),
  };
}

export function groupFacultyEvaluationsByClass(items: AdminEvaluationItem[]): FacultyClassRecord[] {
  const grouped = new Map<string, FacultyClassRecord>();

  items.forEach((item) => {
    const classId = getEvaluationClassId(item) || 'unknown';
    const student = mapEvaluationToFacultyStudent(item);
    const existing = grouped.get(classId);

    if (existing) {
      existing.evaluations.push(student);
      return;
    }

    grouped.set(classId, {
      id: classId,
      className: getEvaluationClassName(item),
      leader: (item as any).classLeaderName || (item as any).class?.leader?.fullName || '—',
      totalStudents: 0,
      submittedCount: 0,
      approvedCount: 0,
      status: 'IN_PROGRESS',
      date: getDate(item),
      evaluations: [student],
    });
  });

  return Array.from(grouped.values()).map((record) => {
    const totalStudents = record.evaluations.length;
    const approvedCount = record.evaluations.filter((item) => item.status === 'APPROVED').length;
    const submittedCount = record.evaluations.filter((item) => item.status !== 'NOT_SUBMITTED').length;
    const pendingCount = record.evaluations.filter((item) =>
      ['advisor_approved', 'faculty_rejected'].includes(item.rawStatus),
    ).length;

    return {
      ...record,
      totalStudents,
      submittedCount,
      approvedCount,
      status:
        pendingCount > 0
          ? 'PENDING_FACULTY'
          : totalStudents > 0 && approvedCount === totalStudents
            ? 'FACULTY_APPROVED'
            : 'IN_PROGRESS',
    };
  });
}

export function getEvaluationIdentityKeys(item: any): string[] {
  const keys: string[] = [];
  if (item.id) keys.push(String(item.id));
  if (item.studentId) keys.push(String(item.studentId));
  if (item.studentCode || item.student?.studentCode || item.student?.code) {
    keys.push(String(item.studentCode || item.student?.studentCode || item.student?.code));
  }
  return keys.filter(Boolean);
}

export function getStudentIdentityKeys(student: any): string[] {
  const keys: string[] = [];
  if (student.studentId) keys.push(String(student.studentId));
  if (student.userId) keys.push(String(student.userId));
  if (student.id) keys.push(String(student.id));
  if (student.studentCode || student.code) keys.push(String(student.studentCode || student.code));
  return keys.filter(Boolean);
}
