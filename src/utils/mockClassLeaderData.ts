// Mock data for Class Leader (Lớp trưởng) role
// src/utils/mockClassLeaderData.ts

export interface MockStudent {
  id: string;
  code: string;
  fullName: string;
  status: 'submitted' | 'confirmed' | 'not_submitted';
  selfScore: number | null;
  submittedAt: string | null;
}

export interface MockClassInfo {
  id: string;
  code: string;
  name: string;
  facultyName: string;
  academicYear: string;
  leaderName: string;
  semester: string;
}

export const MOCK_CLASS_INFO: MockClassInfo = {
  id: 'cls-cntt-k45a',
  code: 'CNTT-K45A',
  name: 'Công nghệ thông tin K45A',
  facultyName: 'Khoa Công nghệ thông tin',
  academicYear: 'Khóa 2023',
  leaderName: 'Trần Văn Cường',
  semester: 'Học kỳ 1 - 2025-2026',
};

export const MOCK_STUDENTS: MockStudent[] = [
  { id: 'sv-001', code: 'SV20230001', fullName: 'Nguyễn Văn An', status: 'submitted', selfScore: 88, submittedAt: '2026-07-20T10:00:00Z' },
  { id: 'sv-002', code: 'SV20230002', fullName: 'Lê Thị Bình', status: 'submitted', selfScore: 76, submittedAt: '2026-07-21T09:30:00Z' },
  { id: 'sv-003', code: 'SV20230003', fullName: 'Phạm Minh Cường', status: 'confirmed', selfScore: 90, submittedAt: '2026-07-19T14:00:00Z' },
  { id: 'sv-004', code: 'SV20230004', fullName: 'Hoàng Thị Duyên', status: 'not_submitted', selfScore: null, submittedAt: null },
  { id: 'sv-005', code: 'SV20230005', fullName: 'Đỗ Quốc Hùng', status: 'submitted', selfScore: 82, submittedAt: '2026-07-22T08:00:00Z' },
  { id: 'sv-006', code: 'SV20230006', fullName: 'Vũ Thị Lan', status: 'confirmed', selfScore: 95, submittedAt: '2026-07-18T16:30:00Z' },
  { id: 'sv-007', code: 'SV20230007', fullName: 'Bùi Văn Mạnh', status: 'not_submitted', selfScore: null, submittedAt: null },
  { id: 'sv-008', code: 'SV20230008', fullName: 'Trần Thị Ngọc', status: 'submitted', selfScore: 79, submittedAt: '2026-07-23T11:00:00Z' },
  { id: 'sv-009', code: 'SV20230009', fullName: 'Ngô Đức Phong', status: 'submitted', selfScore: 85, submittedAt: '2026-07-20T15:00:00Z' },
  { id: 'sv-010', code: 'SV20230010', fullName: 'Đinh Thị Quỳnh', status: 'confirmed', selfScore: 91, submittedAt: '2026-07-17T09:00:00Z' },
];
