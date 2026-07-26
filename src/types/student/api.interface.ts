import type { NotificationApiItem } from './api.type';

/** Học kỳ để chọn trong biểu mẫu. */
export interface Semester {
  id: string;
  name: string;
  code?: string;
  year?: number;
  academicYear?: string;
  semester?: 'HK1' | 'HK2' | 'SUMMER' | string;
  semesterName?: string;
  startDate?: string;
  endDate?: string;
  studentDeadline?: string;
  classDeadline?: string;
  facultyDeadline?: string;
  isActive?: boolean;
  hasEvaluationForms?: boolean;
}

/** Quyết định hiển thị popup nhắc nhở đánh giá rèn luyện. */
export interface EvaluationPopupResponse {
  visible: boolean;
  title: string | null;
  content: string | null;
  semesterId: string | null;
  startDate: string | null;
  endDate: string | null;
}

/** Năm học để chọn trong biểu mẫu. */
export interface AcademicYear {
  id: string;
  name: string;
  startYear?: number;
  endYear?: number;
  isActive?: boolean;
}

/** Thông tin cập nhật hồ sơ sinh viên. */
export interface StudentProfileUpdatePayload {
  fullName?: string;
  phone?: string | null;
  phoneNumber?: string | null;
  dateOfBirth?: string | null;
}

/** Thông tin tạo phiếu đánh giá. */
export interface CreateEvaluationPayload {
  semester?: string;
  academicYear?: string;
}

/** Thông tin cập nhật ghi chú phiếu. */
export interface UpdateEvaluationNotePayload {
  note?: string;
  studentNotes?: string;
  phone?: string;
}

/** Tổng hợp điểm của phiếu. */
export interface EvaluationSummary {
  id: string;
  totalScore: number;
  rating?: string;
  status: string;
  updatedAt?: string;
}

/** Trạng thái hiện tại của phiếu. */
export interface EvaluationStatusResponse {
  id: string;
  status: string;
  submittedAt?: string;
  reviewedAt?: string;
}

/** Thông tin cập nhật một mục điểm. */
export interface ScoreSectionPayload {
  score?: number;
  selfScore?: number;
  note?: string;
  evidences?: string[];
  [criteriaCode: string]: unknown;
}

/** Thông tin một mục điểm. */
export interface ScoreSectionResponse {
  id: string;
  evaluationId: string;
  score?: number;
  selfScore?: number;
  note?: string;
  regularScoreLevel?: string;
  academicRank?: string;
  activities: Array<{ code: string; [key: string]: unknown }>;
  baseScore?: number;
  violations: Array<{ code: string; deductScore: number; [key: string]: unknown }>;
  politicalActivityLevel?: string;
  cultureSportLevel?: string;
  clubActivityLevel?: string;
  socialPreventionLevel?: string;
  rewardScore?: number;
  lawComplianceLevel?: string;
  volunteerActivityLevel?: string;
  communityRelationshipLevel?: string;
  studentRoleType?: string;
  positionGroup?: string;
  taskCompletionLevel?: string;
  managementSkillLevel?: string;
  normalStudentActivityScore?: number;
  specialAchievementLevel?: string;
  [criteriaCode: string]: unknown;
}

/** Thông tin thêm minh chứng bằng đường dẫn. */
export interface LinkEvidenceUrlPayload {
  criteriaId?: string;
  criteriaCode?: string;
  url?: string;
  imageUrl?: string;
  publicId?: string;
  description?: string;
}

/** Điều kiện xem danh sách thông báo. */
export interface NotificationListQuery {
  page?: number;
  limit?: number;
}

/** Danh sách thông báo có phân trang. */
export interface NotificationListResponse {
  items: NotificationApiItem[];
  total: number;
  page?: number;
  limit?: number;
}
