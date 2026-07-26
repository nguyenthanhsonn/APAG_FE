import type { ElementType, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { Class, ClassFormValues, ClassListStudentItem, CreateStudentPayload, Faculty, FacultyFormValues, Major, MajorFormValues, StudentFormValues } from './index';

export interface AdminStatItem {
  icon: LucideIcon;
  label: string;
  value: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  sub: string;
}

export interface AdminStatsGridProps {
  stats: AdminStatItem[];
}

export interface FacultyStatItem {
  name: string;
  students: number;
}

export interface AdminFacultyStatsCardProps {
  facultyStats: FacultyStatItem[];
  totalFacultyStudents: number;
  maxStudents: number;
}

export interface ActivityItem {
  color: string;
  ring: string;
  label: string;
  content: string;
  time: string;
}

export interface AdminActivityFeedCardProps {
  activities: ActivityItem[];
  activityLabelColor: Record<string, string>;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface Column<T> {
  key: keyof T | string;
  label: string;
  width?: string;
  cardTitle?: boolean;
  cardHideLabel?: boolean;
  render?: (value: any, row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  emptyText?: string;
  minHeight?: number;
  showSummary?: boolean;
  paginationAlign?: 'left' | 'center' | 'right';
  currentPage?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onRowClick?: (row: T) => void;
}

export interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  searchPlaceholder: string;
  filterOptions?: { label: string; value: string }[];
  filterLabel?: string;
  children?: ReactNode;
  variant?: 'card' | 'inline';
}

export interface AddActionsDropdownProps {
  onAddStudent: () => void;
  onImportExcel: () => void;
  onAddUser: () => void;
}

export interface ModalAddStudentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (student: Omit<ClassListStudentItem, 'id'> & { classId: string }) => void;
  defaultClassId?: string;
  classes?: Class[];
  onImportSuccess?: () => void;
}

export interface AddStudentFormValues {
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  classId: string;
}

export interface ModalCreateClassProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: ClassFormValues) => void;
  editData?: Class | null;
  faculties?: Faculty[];
  majors?: Major[];
}

export interface ModalCreateFacultyProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: FacultyFormValues) => void;
  editData?: Faculty | null;
  onImported?: () => void;
}

export interface ModalCreateManualStudentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: CreateStudentPayload) => Promise<void> | void;
  classes: Class[];
}

export interface CreateManualStudentFieldProps {
  label: string;
  icon: ElementType;
  required?: boolean;
  error?: ReactNode;
  children: ReactNode;
}

export interface ModalCreateStudentProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: StudentFormValues) => Promise<void> | void;
  editData?: StudentFormValues | null;
}

export interface CreateStudentFieldProps {
  label: string;
  icon: ElementType;
  required?: boolean;
  error?: ReactNode;
  children: ReactNode;
}

export interface ModalImportExcelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  classId?: string;
}

export interface ModalImportFacultyProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ModalImportMajorProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export interface ModalCreateMajorProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: MajorFormValues) => void;
  editData?: Major | null;
  faculties?: Faculty[];
  onImported?: () => void;
}

export interface AdminClassListProps {
  preSelectedClassId?: string;
  classData?: Class;
  onBack?: () => void;
}

export interface CouncilClass {
  id: string;
  name: string;
  studentCount: number;
  facultyName?: string;
  academicYear?: string;
  semester?: string;
  schoolYear?: string;
}

export interface ClassCardProps {
  classItem: CouncilClass;
  onOpen: (classId: string) => void;
}

export type ReviewStatusFilter = 'all' | 'not_submitted' | 'submitted';

export interface ClassReviewFilterBarProps {
  semester: string;
  semesterOptions?: Array<{ id: string; name: string }>;
  status: ReviewStatusFilter;
  keyword: string;
  onSemesterChange: (value: string) => void;
  onStatusChange: (value: ReviewStatusFilter) => void;
  onKeywordChange: (value: string) => void;
}

export interface ReviewEvidence {
  id: string;
  fileName: string;
  fileType: 'image' | 'pdf';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
}

export interface ScoreReviewSection {
  id: string;
  title: string;
  maxScore: number;
  selfScore: number;
  classScore: string;
  evidences: ReviewEvidence[];
}

export interface ClassScoreReviewSectionProps {
  section: ScoreReviewSection;
  hasError: boolean;
  onScoreChange: (sectionId: string, value: string) => void;
  onOpenEvidence: (section: ScoreReviewSection) => void;
}

export interface ClassStatsWidgetProps {
  total: number;
  submitted: number;
  approved: number;
  notSubmitted: number;
}

export interface CouncilDeductionStepperProps {
  isSv: boolean;
  index: number;
  value: number;
  onChange: (val: number) => void;
  disabled: boolean;
  weight: number;
  noViolationScore: number;
  allDeductions: number[];
  currentUserRole: 'student' | 'class';
  isReadOnly: boolean;
}

export interface CouncilCriteriaReviewTableProps {
  currentUserRole: 'student' | 'class';
  setIsClassEdited: (v: boolean) => void;
  isReadOnly: boolean;
  svScores: { sec1: number; sec2: number; sec3: number; sec4: number; sec5: number; total: number };
  classScores: { sec1: number; sec2: number; sec3: number; sec4: number; sec5: number; total: number };
  svStudyAttitude: string; setSvStudyAttitude: (v: string) => void;
  svNckh: boolean; setSvNckh: (v: boolean) => void; svOlympic: boolean; setSvOlympic: (v: boolean) => void;
  svCreative: boolean; setSvCreative: (v: boolean) => void; svAcademicRank: string; setSvAcademicRank: (v: string) => void;
  classStudyAttitude: string; setClassStudyAttitude: (v: string) => void;
  classNckh: boolean; setClassNckh: (v: boolean) => void; classOlympic: boolean; setClassOlympic: (v: boolean) => void;
  classCreative: boolean; setClassCreative: (v: boolean) => void; classAcademicRank: string; setClassAcademicRank: (v: string) => void;
  isSvViolationSec1: boolean; setIsSvViolationSec1: (v: boolean) => void; isClassViolationSec1: boolean; setIsClassViolationSec1: (v: boolean) => void;
  svNoViolationScore: number; setSvNoViolationScore: (v: number) => void; svDeductions: number[];
  handleDeductionChange: (isSv: boolean, idx: number, val: number) => void;
  classNoViolationScore: number; setClassNoViolationScore: (v: number) => void; classDeductions: number[];
  deductionLabels: string[];
  isSvViolationSec2: boolean; setIsSvViolationSec2: (v: boolean) => void; isClassViolationSec2: boolean; setIsClassViolationSec2: (v: boolean) => void;
  svActivity1: string; setSvActivity1: (v: string) => void; svActivity2: string; setSvActivity2: (v: string) => void;
  svActivity3: string; setSvActivity3: (v: string) => void; svActivity4: string; setSvActivity4: (v: string) => void;
  svRewardPoints: number; setSvRewardPoints: (v: number) => void;
  classActivity1: string; setClassActivity1: (v: string) => void; classActivity2: string; setClassActivity2: (v: string) => void;
  classActivity3: string; setClassActivity3: (v: string) => void; classActivity4: string; setClassActivity4: (v: string) => void;
  classRewardPoints: number; setClassRewardPoints: (v: number) => void;
  isSvViolationSec3: boolean; setIsSvViolationSec3: (v: boolean) => void; isClassViolationSec3: boolean; setIsClassViolationSec3: (v: boolean) => void;
  svPolicy: string; setSvPolicy: (v: string) => void; svSolidarity: string; setSvSolidarity: (v: string) => void;
  svLocality: string; setSvLocality: (v: string) => void;
  classPolicy: string; setClassPolicy: (v: string) => void; classSolidarity: string; setClassSolidarity: (v: string) => void;
  classLocality: string; setClassLocality: (v: string) => void;
  isSvViolationSec4: boolean; setIsSvViolationSec4: (v: boolean) => void; isClassViolationSec4: boolean; setIsClassViolationSec4: (v: boolean) => void;
  svRoleType: 'cadre' | 'student'; setSvRoleType: (v: 'cadre' | 'student') => void;
  svCadrePosition: string; setSvCadrePosition: (v: any) => void; svCadrePerformance: string; setSvCadrePerformance: (v: string) => void;
  svManagementLevel: string; setSvManagementLevel: (v: string) => void;
  svClassParticipation: number; setSvClassParticipation: (v: number) => void;
  svSpecialAchievement: string; setSvSpecialAchievement: (v: string) => void;
  classRoleType: 'cadre' | 'student'; setClassRoleType: (v: 'cadre' | 'student') => void;
  classCadrePosition: string; setClassCadrePosition: (v: any) => void; classCadrePerformance: string; setClassCadrePerformance: (v: string) => void;
  classManagementLevel: string; setClassManagementLevel: (v: string) => void;
  classClassParticipation: number; setClassClassParticipation: (v: number) => void;
  classSpecialAchievement: string; setClassSpecialAchievement: (v: string) => void;
  isSvViolationSec5: boolean; setIsSvViolationSec5: (v: boolean) => void; isClassViolationSec5: boolean; setIsClassViolationSec5: (v: boolean) => void;
  uploadedFiles: Record<string, string[]>;
  handleFileUpload: () => void;
  removeFile: () => void;
  onOpenEvidenceModal?: () => void;
}

export interface EvidenceReviewModalProps {
  isOpen: boolean;
  evidences: ReviewEvidence[];
  onClose: () => void;
  onApprove: (evidenceId: string) => void;
  onReject: (evidenceId: string, reason: string) => void;
}

export type StudentReviewStatus = 'not_submitted' | 'submitted';

export interface CouncilStudentReview {
  id: string;
  code: string;
  fullName: string;
  selfScore: number | null;
  status: StudentReviewStatus;
  workflowStatus?: string;
  statusLabel?: string;
}

export interface StudentReviewTableProps {
  students: CouncilStudentReview[];
  onReview: (studentId: string) => void;
}
