import type { Class, Faculty, Major } from './academic.type';
import type { StudentManagementItem } from './student-management.type';

export type {
  AddStudentToClassPayload,
  AdminSemester,
  AdminStudentListQuery,
  AdminTreeListQuery,
  AdminEvaluationListQuery,
  InternalUserRole,
  AssignCouncilPayload,
  BulkFinalizeEvaluationsPayload,
  ConfirmImportPayload,
  CreateStudentPayload,
  CreateUserPayload,
  CreatedAccount,
  FinalizeEvaluationPayload,
  FinalizeEvaluationsByFilterPayload,
  FacultyPayload,
  ImportFacultiesResult,
  ImportFacultyItem,
  ImportErrorItem,
  ImportMajorPreviewItem,
  ImportMajorsResult,
  ImportStudentPreviewItem,
  ImportStudentsPayload,
  ImportStudentsResult,
  MajorPayload,
  PaginatedResponse,
  PaginationQuery,
  PostPayload,
  ReopenEvaluationPayload,
  ReportQuery,
  ReportsOverview,
  ReviewEvaluationPayload,
  ReviewScoresPayload,
  SemesterPayload,
  SemesterQuery,
  StatusPayload,
  TrainingResultsReport,
  UpdateUserPayload,
  UserListQuery,
} from './api.interface';

/** Người dùng trong hệ thống quản trị. */
export type AdminUser = StudentManagementItem & {
  role?: string;
  isActive?: boolean;
};

/** Lớp quản trị mở rộng từ Class. */
export type AdminClass = Class & {
  studentCount?: number;
};

/** Ngành quản trị mở rộng từ Major. */
export type AdminMajor = Major & {
  facultyName?: string;
};

/** Khoa quản trị mở rộng từ Faculty. */
export type AdminFaculty = Faculty & {
  majorCount?: number;
};

/** Phiếu đánh giá trong danh sách quản trị. */
export type AdminEvaluationItem = {
  id: string;
  status: string;
  statusLabel?: string;
  submittedAt?: string;
  updatedAt?: string;
  studentId?: string;
  studentName?: string;
  student?: {
    id: string;
    studentCode: string;
    fullName: string;
    email: string;
  };
  class?: {
    id: string;
    code: string;
    name: string;
  };
  faculty?: {
    id: string;
    code: string;
    name: string;
  };
  semester?: {
    id?: string;
    semester?: string;
    year?: string;
    name?: string;
  } | string;
  academicYear?: string;
  studentScore?: number;
  classScore?: number;
  advisorScore?: number;
  finalScore?: number;
  totalScore?: number;
  classification?: string;
  classLeaderReviewedAt?: string | null;
  classReviewedAt?: string | null;
  advisorReviewedAt?: string | null;
};

/** Bài viết quản trị tạo hoặc đọc. */
export type Post = {
  id: string;
  title: string;
  content: string;
  authorId?: string;
  createdAt: string;
};

/** Kế quả phân trang dạng danh sách. */
export type PagedResult<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};
