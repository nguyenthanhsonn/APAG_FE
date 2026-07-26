import type { EvaluationForm } from './evaluation-form.type';
import type { Evidence } from './evidence.type';
import type { Student } from './student-user.type';

export type {
  AcademicYear,
  CreateEvaluationPayload,
  EvaluationPopupResponse,
  EvaluationStatusResponse,
  EvaluationSummary,
  LinkEvidenceUrlPayload,
  NotificationListQuery,
  NotificationListResponse,
  ScoreSectionPayload,
  ScoreSectionResponse,
  Semester,
  StudentProfileUpdatePayload,
  UpdateEvaluationNotePayload,
} from './api.interface';

/** Thông báo của người dùng. */
export type NotificationApiItem = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
};

/** Hồ sơ sinh viên. */
export type StudentProfile = Student;

/** Phiếu đánh giá sinh viên. */
export type StudentEvaluation = EvaluationForm;

/** Minh chứng của sinh viên. */
export type StudentEvidence = Evidence;
