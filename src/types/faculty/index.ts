// Types for Faculty role
// src/types/faculty/index.ts

export type ClassApprovalStatus = 'pending_council' | 'pending_faculty' | 'approved';

export interface FacultyClass {
  id: string;
  code: string;
  name: string;
  totalStudents: number;
  submittedCount: number;
  councilApproved: boolean;
  facultyApproved: boolean;
  advisorName: string;
  academicYear: string;
}

export interface FacultyInfo {
  id: string;
  name: string;
  staffName: string;
  semester: string;
}

export type ClassFilterStatus = 'all' | 'pending_council' | 'pending_faculty' | 'approved';
