import type { InternalUserRole } from './api.interface';

export interface FacultyFormValues {
  code: string;
  name: string;
}

export interface MajorFormValues {
  code: string;
  name: string;
  facultyId: string;
}

export interface ClassFormValues {
  code: string;
  name: string;
  facultyId: string;
  majorId: string;
}

export interface StudentFormValues {
  username: string;
  fullName: string;
  password: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  studentCode: string;
  facultyId: string;
  majorId: string;
  classId: string;
  admissionYear: string;
  role: InternalUserRole;
}

export type SemesterFormState = {
  year: string;
  semester: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
};
