import type { AdminEvaluationItem } from './api.type';

export type InternalUserRole = 'admin' | 'class_leader' | 'advisor' | 'faculty' | 'training_department';

/** Thông tin chia trang danh sách. */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Danh sách có chia trang. */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
}

/** Thông tin tạo tài khoản. */
export interface CreateUserPayload {
  username: string;
  email: string;
  fullName: string;
  role: InternalUserRole;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  facultyId?: string;
  classId?: string;
}

/** Thông tin cập nhật tài khoản admin/cố vấn. */
export interface UpdateUserPayload {
  username?: string;
  email?: string;
  fullName?: string;
  role?: InternalUserRole;
  isActive?: boolean;
  phone?: string;
  dateOfBirth?: string;
  facultyId?: string;
  classId?: string;
}

/** Thông tin tạo sinh viên thủ công. */
export interface CreateStudentPayload {
  username: string;
  email: string;
  fullName: string;
  password: string;
  phone?: string;
  dateOfBirth?: string;
  studentCode?: string;
  classId?: string;
}

/** Điều kiện xem danh sách người dùng. */
export interface UserListQuery extends PaginationQuery {
  role?: InternalUserRole;
  keyword?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
}

/** Điều kiện xem danh sách sinh viên. */
export interface AdminTreeListQuery extends PaginationQuery {
  search?: string;
  isActive?: boolean;
  includeDeleted?: boolean;
}

export interface AdminStudentListQuery extends PaginationQuery {
  keyword?: string;
  classId?: string;
  facultyId?: string;
  majorId?: string;
  includeDeleted?: boolean;
}

/** Điều kiện xem danh sách phiếu đánh giá. */
export interface AdminEvaluationListQuery extends PaginationQuery {
  status?: string;
  semester?: string;
  academicYear?: string;
  classId?: string;
  facultyId?: string;
  keyword?: string;
}

/** Thông tin mở lại phiếu đánh giá. */
export interface ReopenEvaluationPayload {
  reason?: string;
}

/** Thông tin hội đồng lớp ghi điểm. */
export interface ReviewScoresPayload {
  scores: Array<{
    criteriaCode: string;
    classScore: number;
    reviewerNote?: string;
  }>;
}

/** Thông tin duyệt hoặc từ chối phiếu. */
export interface ReviewEvaluationPayload {
  action: 'approve' | 'reject';
  classScore?: number;
  comment?: string;
  note?: string;
}

/** Thông tin admin phê duyệt cuối. */
export interface FinalizeEvaluationPayload {
  finalScore?: number;
}

export interface BulkFinalizeEvaluationsPayload {
  evaluationIds: string[];
}

export interface FinalizeEvaluationsByFilterPayload {
  semesterId?: string;
  facultyId?: string;
  classId?: string;
  confirmLargeAction?: boolean;
}

/** Thông tin khoa. */
export interface FacultyPayload {
  code: string;
  name: string;
}

/** Thông tin ngành. */
export interface MajorPayload {
  code: string;
  name: string;
  facultyId: string;
}

/** Thông tin cập nhật trạng thái. */
export interface StatusPayload {
  isActive: boolean;
}

export interface SemesterQuery extends PaginationQuery {
  year?: number;
  isActive?: boolean;
}

export interface AdminSemester {
  id: string;
  year: number;
  academicYear: string;
  semester: 'HK1' | 'HK2' | 'SUMMER' | string;
  semesterName?: string;
  name?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  hasEvaluationForms?: boolean;
}

export interface SemesterPayload {
  year?: number;
  semester?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

/** Thông tin thêm sinh viên vào lớp. */
export interface AddStudentToClassPayload {
  studentId: string;
}

/** Thông tin nhập danh sách sinh viên. */
export interface ImportStudentsPayload {
  file: File;
  classId?: string;
}

/** Kết quả nhập danh sách sinh viên. */
export interface CreatedAccount {
  username: string;
  email: string;
  password: string;
  studentCode: string;
  fullName: string;
}

export interface ImportStudentPreviewItem {
  row?: number;
  action?: 'create' | 'enroll' | 'skip';
  studentId?: string | null;
  studentCode?: string;
  code?: string;
  fullName?: string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  dateOfBirth?: string;
  birthday?: string;
  classCode?: string;
  className?: string;
  class?: {
    code?: string;
    name?: string;
  };
  classId?: string;
  username?: string;
  password?: string;
  note?: string;
}

export interface ImportErrorItem {
  field?: string;
  error?: string;
}

export interface ImportStudentsResult {
  importToken?: string;
  expiresAt?: string;
  totalRows: number;
  successCount: number;
  skippedCount: number;
  createdAccountCount: number;
  createdAccounts: CreatedAccount[];
  previewStudents?: ImportStudentPreviewItem[];
  students?: ImportStudentPreviewItem[];
  items?: ImportStudentPreviewItem[];
  validRows?: ImportStudentPreviewItem[];
  createdStudents?: ImportStudentPreviewItem[];
  emailSentCount?: number;
  emailFailedCount?: number;
  emailErrors?: ImportErrorItem[];
  failedCount: number;
  errors: ImportErrorItem[];
}

export interface ConfirmImportPayload {
  importToken: string;
}

export interface ImportFacultyItem {
  id?: string;
  row?: number;
  action?: 'create' | 'skip';
  code: string;
  name: string;
  note?: string;
  isActive?: boolean;
  createdAt?: string;
  deletedAt?: string | null;
  majorCount?: number;
  assignmentCount?: number;
}

export interface ImportFacultiesResult {
  importToken?: string;
  expiresAt?: string;
  totalRows: number;
  successCount: number;
  previewCount?: number;
  createdCount?: number;
  previewFaculties?: ImportFacultyItem[];
  createdFaculties?: ImportFacultyItem[];
  failedCount: number;
  errors: ImportErrorItem[];
}

export interface ImportMajorPreviewItem {
  id?: string;
  row?: number;
  action?: 'create' | 'skip';
  code: string;
  name: string;
  facultyId?: string;
  facultyCode?: string;
  facultyName?: string;
  note?: string;
  faculty?: {
    id?: string;
    code?: string;
    name?: string;
  };
}

export interface ImportMajorsResult {
  importToken?: string;
  expiresAt?: string;
  totalRows: number;
  successCount: number;
  previewCount?: number;
  createdCount?: number;
  previewMajors?: ImportMajorPreviewItem[];
  createdMajors?: ImportMajorPreviewItem[];
  failedCount: number;
  errors: ImportErrorItem[];
}

/** Thông tin phân công hội đồng. */
export interface AssignCouncilPayload {
  userId: string;
  classId?: string;
  facultyId?: string;
  semester?: string;
  academicYear?: string;
}

/** Điều kiện xem báo cáo. */
export interface ReportQuery {
  semester?: string;
  academicYear?: string;
  classId?: string;
  facultyId?: string;
}

/** Số liệu tổng quan báo cáo. */
export interface ReportsOverview {
  totalStudents: number;
  totalEvaluations: number;
  submittedCount: number;
  approvedCount: number;
}

/** Báo cáo kết quả rèn luyện. */
export interface TrainingResultsReport {
  items: AdminEvaluationItem[];
  total: number;
}

/** Thông tin tạo bài viết. */
export interface PostPayload {
  title: string;
  content: string;
  authorId?: string;
}
