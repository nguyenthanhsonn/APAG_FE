// Types for Training Department role
// src/types/training_department/index.ts

export interface TrainingDeptFacultyStats {
  facultyId: string;
  facultyName: string;
  totalClasses: number;
  totalStudents: number;
  submittedStudents: number;
  approvedStudents: number;
  avgScore: number;
}

export interface TrainingDeptSchoolStats {
  semester: string;
  totalFaculties: number;
  totalClasses: number;
  totalStudents: number;
  submittedStudents: number;
  approvedStudents: number;
  completionRate: number;
}

export interface TrainingDeptScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface TrainingDeptSemesterOption {
  value: string;
  label: string;
}
