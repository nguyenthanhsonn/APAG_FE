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
}
