// Types for Class Leader role
// src/types/class_leader/index.ts

export type StudentStatus = 'submitted' | 'confirmed' | 'not_submitted';

export interface ClassLeaderStudent {
  id: string;
  code: string;
  fullName: string;
  status: StudentStatus;
  selfScore: number | null;
  submittedAt: string | null;
}

export interface ClassLeaderClassInfo {
  id: string;
  code: string;
  name: string;
  facultyName: string;
  academicYear: string;
  leaderName: string;
  semester: string;
}

export type StudentStatusFilter = 'all' | StudentStatus;
