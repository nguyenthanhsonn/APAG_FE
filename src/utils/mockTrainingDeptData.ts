// Mock data for Training Department (Phòng Đào tạo) role
// src/utils/mockTrainingDeptData.ts

export interface FacultyStats {
  facultyId: string;
  facultyName: string;
  totalClasses: number;
  totalStudents: number;
  submittedStudents: number;
  approvedStudents: number;
  avgScore: number;
}

export interface SemesterOption {
  value: string;
  label: string;
}

export const MOCK_SEMESTERS: SemesterOption[] = [
  { value: 'HK1-2025-2026', label: 'Học kỳ 1 - 2025-2026' },
  { value: 'HK2-2024-2025', label: 'Học kỳ 2 - 2024-2025' },
  { value: 'HK1-2024-2025', label: 'Học kỳ 1 - 2024-2025' },
];

export const MOCK_SCHOOL_STATS = {
  semester: 'Học kỳ 1 - 2025-2026',
  totalFaculties: 5,
  totalClasses: 42,
  totalStudents: 1680,
  submittedStudents: 1540,
  approvedStudents: 1230,
  completionRate: 91.7,
};

export const MOCK_FACULTY_STATS: FacultyStats[] = [
  { facultyId: 'fac-cntt', facultyName: 'Khoa Công nghệ thông tin', totalClasses: 10, totalStudents: 420, submittedStudents: 398, approvedStudents: 350, avgScore: 84.2 },
  { facultyId: 'fac-kt', facultyName: 'Khoa Kinh tế', totalClasses: 9, totalStudents: 380, submittedStudents: 342, approvedStudents: 290, avgScore: 81.5 },
  { facultyId: 'fac-co-dien', facultyName: 'Khoa Cơ điện tử', totalClasses: 8, totalStudents: 310, submittedStudents: 295, approvedStudents: 260, avgScore: 80.1 },
  { facultyId: 'fac-xd', facultyName: 'Khoa Xây dựng', totalClasses: 8, totalStudents: 320, submittedStudents: 280, approvedStudents: 200, avgScore: 79.8 },
  { facultyId: 'fac-ngonngu', facultyName: 'Khoa Ngôn ngữ', totalClasses: 7, totalStudents: 250, submittedStudents: 225, approvedStudents: 130, avgScore: 83.4 },
];

// Score distribution mock for bar chart
export interface ScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export const MOCK_SCORE_DISTRIBUTION: ScoreDistribution[] = [
  { range: 'Xuất sắc (90-100)', count: 310, percentage: 18.5 },
  { range: 'Tốt (80-89)', count: 520, percentage: 31.0 },
  { range: 'Khá (70-79)', count: 490, percentage: 29.2 },
  { range: 'TB-Khá (60-69)', count: 220, percentage: 13.1 },
  { range: 'Trung bình (50-59)', count: 130, percentage: 7.7 },
  { range: 'Yếu (<50)', count: 10, percentage: 0.6 },
];
