import type { ChangeEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { EvidenceFile } from './evidence-file.type';

export interface WelcomeBannerProps {
  displayName: string;
}

export interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  bg: string;
  iconColor: string;
  trend: string;
  trendColor: string;
}

export interface StatsGridProps {
  stats: StatItem[];
}

export interface NotificationItem {
  type: string;
  title: string;
  description: string;
  borderColor: string;
  bg: string;
  textColor: string;
  descColor: string;
  dot: string;
}

export interface NotificationCardProps {
  notifications: NotificationItem[];
}

export interface ResultBannerProps {
  semester: string;
  academicYear: string;
  rating: string;
  totalScore: number;
  rankBadgeClass: (rank: string) => string;
}

export interface ScoreItem {
  label: string;
  icon: LucideIcon;
  score: number;
  max: number;
  color: string;
  textColor: string;
}

export interface DetailScoresCardProps {
  scoreBreakdown: ScoreItem[];
}

export interface ReviewerCommentsCardProps {
  reviewerComments: string;
}

export interface RankBenefitsCardProps {
  rating: string;
}

export interface EvidenceGroupCardProps {
  disabled?: boolean;
  group: { id: string; name: string };
  groupEvidences: EvidenceFile[];
  handleFileUpload: (e: ChangeEvent<HTMLInputElement>, criteriaId: string) => void;
  handleDelete: (id: string) => void;
  formatFileSize: (bytes: number) => string;
}

export interface GridDeductionStepperProps {
  isSv: boolean; index: number; value: number;
  onChange: (val: number) => void; disabled: boolean;
  weight: number; noViolationScore: number; allDeductions: number[];
  currentUserRole: 'student' | 'class'; isReadOnly: boolean;
}

export interface EvaluationTableGridProps {
  currentUserRole: 'student' | 'class'; setIsClassEdited: (v: boolean) => void; isReadOnly: boolean;
  fieldErrors?: Record<string, string>;
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
  uploadedFiles: Record<string, any[]>;
  handleFileUpload: (key: string, e: ChangeEvent<HTMLInputElement>) => void;
  removeFile: (key: string, index: number) => void;
  uploadingEvidence?: string | null;
  /** Per-file upload progress: { [criteriaKey]: { [fileName]: 0-100 | 'done' | 'error' } } */
  fileUploadProgress?: Record<string, Record<string, number | 'done' | 'error'>>;
}

export interface EvaluationPageProps {
  expandedSections: { [key: string]: boolean };
  toggleSection: (section: string) => void;
  politicalActivity: string;
  setPoliticalActivity: (value: string) => void;
  culturalActivity: string;
  setCulturalActivity: (value: string) => void;
  clubActivity: string;
  setClubActivity: (value: string) => void;
  antiSocial: string;
  setAntiSocial: (value: string) => void;
  awardPoints: number;
  setAwardPoints: (value: number) => void;
  policyCompliance: string;
  setPolicyCompliance: (value: string) => void;
  charityWork: string;
  setCharityWork: (value: string) => void;
  collectiveBuilding: string;
  setCollectiveBuilding: (value: string) => void;
  schoolRelationship?: string;
  setSchoolRelationship?: (value: string) => void;
  roleType: 'cadre' | 'regular';
  setRoleType: (value: 'cadre' | 'regular') => void;
  cadrePosition: string;
  setCadrePosition: (value: string) => void;
  cadrePerformance: string;
  setCadrePerformance: (value: string) => void;
  managementLevel: string;
  setManagementLevel: (value: string) => void;
  classParticipation: number;
  setClassParticipation: (value: number) => void;
  specialAchievement: string;
  setSpecialAchievement: (value: string) => void;
  selectedRole?: string;
  setSelectedRole?: (value: string) => void;
  uploadedFiles?: { [key: string]: { name: string; url: string }[] };
  handleFileUpload?: (sectionKey: string, e: ChangeEvent<HTMLInputElement>) => void;
  removeFile?: (sectionKey: string, index: number) => void;
  showScores?: boolean;
  scores?: any;
}
