import type { Evidence } from './evidence.type';
import type { StudentInfo } from './student-user.type';
import type {
  AcademicAwareness,
  AcademicPerformance,
  CivicAwareness,
  CommunityActivity,
  DisciplineCompliance,
  DisciplineViolation,
  EvaluationRating,
  LeadershipRole,
  PoliticalSocialActivities,
  PoliticalSocialActivity,
} from './evaluation-criteria.type';

export type EvaluationStatus =
  | 'draft'
  | 'submitted'
  | 'class_approved'
  | 'finalized'
  | 'rejected'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'CLASS_APPROVED'
  | 'FINALIZED'
  | 'REJECTED';

export interface EvaluationPeriod {
  semester: string;
  academicYear: string;
  deadline?: string;
}

export interface EvaluationCriterionRef {
  id: string;
  code: string;
  title: string;
}

export interface EvaluationEvidenceItem {
  id: string;
  studentId?: string;
  evaluationFormId?: string;
  criterionId: string;
  criterion?: EvaluationCriterionRef;
  imageUrl?: string;
  publicId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface EvaluationAttachmentItem {
  id: string;
  criteriaId?: string;
  criterion?: EvaluationCriterionRef;
  originalName?: string;
  storageKey?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  isApproved?: boolean | null;
  rejectReason?: string | null;
  uploadedAt?: string;
}

export interface EvaluationForm {
  id: string;
  studentId: string;
  phone?: string;
  note?: string;
  semester?: string | { semester: string; year: number };
  academicYear?: string;
  studentScore?: number | null;
  classScore?: number | null;
  finalScore?: number | null;
  totalScore?: number | null;
  classification?: string | null;
  statusLabel?: string;
  studyScore?: number;
  disciplineScore?: number;
  activityScore?: number;
  communityScore?: number;
  roleScore?: number;
  sectionScores?: {
    studyScore?: number;
    disciplineScore?: number;
    activityScore?: number;
    communityScore?: number;
    roleScore?: number;
  };
  review?: {
    evaluationId?: string;
    status?: EvaluationStatus;
    statusLabel?: string;
    isLocked?: boolean;
    lockedAt?: string | null;
    semesterIsActive?: boolean;
    currentStep?: string;
    submittedAt?: string;
    steps?: Array<{
      key: string;
      label: string;
      status: string;
      completedAt?: string | null;
    }>;
  };
  sections?: {
    study?: Record<string, unknown>;
    discipline?: Record<string, unknown>;
    activity?: Record<string, unknown>;
    community?: Record<string, unknown>;
    role?: Record<string, unknown>;
  };
  rank?: string;
  period: EvaluationPeriod;
  status: EvaluationStatus;
  isLocked?: boolean;
  lockedAt?: string | null;
  semesterIsActive?: boolean;
  academicPerformance: AcademicPerformance;
  discipline: DisciplineViolation;
  politicalSocial: PoliticalSocialActivity;
  community: CommunityActivity;
  leadership: LeadershipRole;
  evidences: Array<Evidence | EvaluationEvidenceItem>;
  attachments?: EvaluationAttachmentItem[];
  scores: {
    academic: number;
    discipline: number;
    politicalSocial: number;
    community: number;
    leadership: number;
    total: number;
  };
  rating: EvaluationRating;
  comments?: string;
  reviewerComments?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompleteEvaluation {
  id: string;
  studentId: string;
  studentInfo: StudentInfo;
  period: EvaluationPeriod;
  academicAwareness: AcademicAwareness;
  discipline: DisciplineCompliance;
  politicalSocial: PoliticalSocialActivities;
  civicAwareness: CivicAwareness;
  leadership: LeadershipRole;
  scores: {
    studentSelfScore: number;
    classScore?: number;
  };
  rating: EvaluationRating;
  status: EvaluationStatus;
  studentNotes?: string;
  classNotes?: string;
  advisorNotes?: string;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string;
}
