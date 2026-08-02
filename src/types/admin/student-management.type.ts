import type { InternalUserRole } from './api.interface';

export interface StudentManagementItem {
  id: string;
  username: string;
  fullName: string;
  role: 'student' | InternalUserRole;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  studentCode?: string;
  facultyId?: string;
  majorId?: string;
  classId?: string;
  classIds?: string[];
  admissionYear?: string;
  isActive: boolean;
  accountEmailSent?: boolean;
  accountEmailError?: string;
  managedFaculties?: Array<{
    id?: string;
    assignmentId?: string;
    facultyId?: string;
    code?: string;
    facultyCode?: string;
    name?: string;
    facultyName?: string;
    assignedAt?: string;
  }>;
  managedClasses?: Array<{
    id?: string;
    assignmentId?: string;
    classId?: string;
    code?: string;
    classCode?: string;
    name?: string;
    className?: string;
    assignedAt?: string;
  }>;
}

export interface ClassListStudentItem {
  id: string;
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  phoneNumber: string;
  email?: string;
  role?: 'student' | InternalUserRole;
  isActive?: boolean;
  isClassLeader?: boolean;
  classLeaderAssignment?: {
    id?: string;
    assignedAt?: string;
  } | null;
  enrolledAt?: string;
}
