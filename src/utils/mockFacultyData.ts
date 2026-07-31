// Mock data for Faculty (Khoa) role
// src/utils/mockFacultyData.ts

export interface MockClassApproval {
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

export interface MockFacultyInfo {
  id: string;
  name: string;
  staffName: string;
  semester: string;
}

export const MOCK_FACULTY_INFO: MockFacultyInfo = {
  id: 'fac-cntt',
  name: 'Khoa Công nghệ thông tin',
  staffName: 'Nguyễn Thị Hương',
  semester: 'Học kỳ 1 - 2025-2026',
};

export const MOCK_FACULTY_CLASSES: MockClassApproval[] = [
  { id: 'cls-cntt-k45a', code: 'CNTT-K45A', name: 'Công nghệ thông tin K45A', totalStudents: 45, submittedCount: 43, councilApproved: true, facultyApproved: false, advisorName: 'Lê Văn Tuấn', academicYear: 'Khóa 2023' },
  { id: 'cls-cntt-k45b', code: 'CNTT-K45B', name: 'Công nghệ thông tin K45B', totalStudents: 42, submittedCount: 42, councilApproved: true, facultyApproved: true, advisorName: 'Phạm Thị Mai', academicYear: 'Khóa 2023' },
  { id: 'cls-khmt-k45a', code: 'KHMT-K45A', name: 'Khoa học máy tính K45A', totalStudents: 38, submittedCount: 35, councilApproved: false, facultyApproved: false, advisorName: 'Trần Minh Đức', academicYear: 'Khóa 2023' },
  { id: 'cls-cntt-k46a', code: 'CNTT-K46A', name: 'Công nghệ thông tin K46A', totalStudents: 48, submittedCount: 46, councilApproved: true, facultyApproved: false, advisorName: 'Nguyễn Văn Hải', academicYear: 'Khóa 2024' },
  { id: 'cls-cntt-k46b', code: 'CNTT-K46B', name: 'Công nghệ thông tin K46B', totalStudents: 44, submittedCount: 44, councilApproved: true, facultyApproved: true, advisorName: 'Hoàng Thị Lan', academicYear: 'Khóa 2024' },
  { id: 'cls-khmt-k46a', code: 'KHMT-K46A', name: 'Khoa học máy tính K46A', totalStudents: 36, submittedCount: 30, councilApproved: false, facultyApproved: false, advisorName: 'Bùi Quang Minh', academicYear: 'Khóa 2024' },
  { id: 'cls-httt-k45a', code: 'HTTT-K45A', name: 'Hệ thống thông tin K45A', totalStudents: 40, submittedCount: 39, councilApproved: true, facultyApproved: false, advisorName: 'Vũ Thị Nga', academicYear: 'Khóa 2023' },
  { id: 'cls-httt-k46a', code: 'HTTT-K46A', name: 'Hệ thống thông tin K46A', totalStudents: 41, submittedCount: 38, councilApproved: false, facultyApproved: false, advisorName: 'Đỗ Văn Thắng', academicYear: 'Khóa 2024' },
];
