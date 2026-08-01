export type StudentStatus = 'APPROVED' | 'WAITING_APPROVAL' | 'REJECTED' | 'NOT_SUBMITTED';

export interface StudentRecord {
  id: string;
  code: string;
  name: string;
  score: number;
  rank: string;
  status: StudentStatus;
  date: string;
}

export interface ClassRecord {
  id: string;
  className: string;
  leader: string;
  totalStudents: number;
  submittedCount: number;
  approvedCount: number;
  status: 'PENDING_FACULTY' | 'FACULTY_APPROVED' | 'IN_PROGRESS';
  date: string;
}

// ─── Danh sách lớp trực thuộc Khoa ───────────────────────────────────────────
export const FACULTY_CLASSES: ClassRecord[] = [
  {
    id: 'cntt-k65a',
    className: 'CNTT-K65A',
    leader: 'Nguyễn Văn Lớp Trưởng',
    totalStudents: 45,
    submittedCount: 43,
    approvedCount: 38,
    status: 'PENDING_FACULTY',
    date: '01/08/2026',
  },
  {
    id: 'cntt-k65b',
    className: 'CNTT-K65B',
    leader: 'Lê Văn Nam',
    totalStudents: 42,
    submittedCount: 42,
    approvedCount: 42,
    status: 'FACULTY_APPROVED',
    date: '31/07/2026',
  },
  {
    id: 'khmt-k65',
    className: 'KHMT-K65',
    leader: 'Phạm Thị Lan',
    totalStudents: 40,
    submittedCount: 39,
    approvedCount: 35,
    status: 'PENDING_FACULTY',
    date: '01/08/2026',
  },
  {
    id: 'httt-k65',
    className: 'HTTT-K65',
    leader: 'Hoàng Văn Vinh',
    totalStudents: 38,
    submittedCount: 30,
    approvedCount: 20,
    status: 'IN_PROGRESS',
    date: '29/07/2026',
  },
];

// ─── Danh sách sinh viên theo từng lớp ───────────────────────────────────────
export const STUDENTS_BY_CLASS: Record<string, StudentRecord[]> = {
  'cntt-k65a': [
    { id: 's1',  code: 'SV2101001', name: 'Nguyễn Thị An',      score: 90, rank: 'Xuất sắc', status: 'APPROVED',          date: '30/07/2026' },
    { id: 's2',  code: 'SV2101002', name: 'Trần Hoàng Bảo',     score: 85, rank: 'Tốt',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's3',  code: 'SV2101003', name: 'Lê Văn Cường',       score: 72, rank: 'Khá',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's4',  code: 'SV2101004', name: 'Phạm Thị Dung',      score: 88, rank: 'Tốt',      status: 'WAITING_APPROVAL',  date: '01/08/2026' },
    { id: 's5',  code: 'SV2101005', name: 'Hoàng Minh Đức',     score: 65, rank: 'Trung bình', status: 'WAITING_APPROVAL', date: '01/08/2026' },
    { id: 's6',  code: 'SV2101006', name: 'Đỗ Thị Hà',          score: 55, rank: 'Yếu',      status: 'REJECTED',          date: '29/07/2026' },
    { id: 's7',  code: 'SV2101007', name: 'Vũ Quốc Hùng',       score: 93, rank: 'Xuất sắc', status: 'APPROVED',          date: '30/07/2026' },
    { id: 's8',  code: 'SV2101008', name: 'Ngô Thị Lan',        score: 78, rank: 'Khá',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's9',  code: 'SV2101009', name: 'Bùi Văn Mạnh',       score: 0,  rank: '-',        status: 'NOT_SUBMITTED',     date: '-' },
    { id: 's10', code: 'SV2101010', name: 'Đinh Thị Ngân',      score: 82, rank: 'Tốt',      status: 'WAITING_APPROVAL',  date: '01/08/2026' },
    { id: 's11', code: 'SV2101011', name: 'Lý Minh Phúc',       score: 91, rank: 'Xuất sắc', status: 'APPROVED',          date: '30/07/2026' },
    { id: 's12', code: 'SV2101012', name: 'Trương Thị Quỳnh',   score: 69, rank: 'Khá',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's13', code: 'SV2101013', name: 'Phan Văn Sơn',       score: 0,  rank: '-',        status: 'NOT_SUBMITTED',     date: '-' },
    { id: 's14', code: 'SV2101014', name: 'Mai Thanh Tú',       score: 77, rank: 'Khá',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's15', code: 'SV2101015', name: 'Cao Thị Uyên',       score: 95, rank: 'Xuất sắc', status: 'APPROVED',          date: '30/07/2026' },
  ],
  'cntt-k65b': [
    { id: 's1',  code: 'SV2102001', name: 'Nguyễn Văn Anh',     score: 88, rank: 'Tốt',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's2',  code: 'SV2102002', name: 'Trần Thị Bích',      score: 92, rank: 'Xuất sắc', status: 'APPROVED',          date: '29/07/2026' },
    { id: 's3',  code: 'SV2102003', name: 'Lê Hoàng Cảnh',      score: 75, rank: 'Khá',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's4',  code: 'SV2102004', name: 'Phạm Thị Duyên',     score: 83, rank: 'Tốt',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's5',  code: 'SV2102005', name: 'Hoàng Văn Giang',    score: 70, rank: 'Khá',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's6',  code: 'SV2102006', name: 'Đặng Thị Hoa',       score: 96, rank: 'Xuất sắc', status: 'APPROVED',          date: '29/07/2026' },
    { id: 's7',  code: 'SV2102007', name: 'Vũ Minh Hải',        score: 81, rank: 'Tốt',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's8',  code: 'SV2102008', name: 'Đỗ Thị Kiều',        score: 68, rank: 'Khá',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's9',  code: 'SV2102009', name: 'Ngô Văn Long',       score: 89, rank: 'Tốt',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's10', code: 'SV2102010', name: 'Bùi Thị Mai',        score: 74, rank: 'Khá',      status: 'APPROVED',          date: '31/07/2026' },
  ],
  'khmt-k65': [
    { id: 's1',  code: 'SV2103001', name: 'Nguyễn Thị Ánh',     score: 87, rank: 'Tốt',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's2',  code: 'SV2103002', name: 'Trần Văn Bình',      score: 60, rank: 'Trung bình', status: 'APPROVED',         date: '31/07/2026' },
    { id: 's3',  code: 'SV2103003', name: 'Lê Minh Châu',       score: 94, rank: 'Xuất sắc', status: 'APPROVED',          date: '30/07/2026' },
    { id: 's4',  code: 'SV2103004', name: 'Phạm Thị Diệu',      score: 78, rank: 'Khá',      status: 'WAITING_APPROVAL',  date: '01/08/2026' },
    { id: 's5',  code: 'SV2103005', name: 'Hoàng Đức Giang',    score: 83, rank: 'Tốt',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's6',  code: 'SV2103006', name: 'Đỗ Văn Hào',         score: 0,  rank: '-',        status: 'NOT_SUBMITTED',     date: '-' },
    { id: 's7',  code: 'SV2103007', name: 'Vũ Thị Hồng',        score: 72, rank: 'Khá',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's8',  code: 'SV2103008', name: 'Ngô Văn Khoa',       score: 88, rank: 'Tốt',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's9',  code: 'SV2103009', name: 'Bùi Thị Linh',       score: 55, rank: 'Yếu',      status: 'REJECTED',          date: '29/07/2026' },
    { id: 's10', code: 'SV2103010', name: 'Đinh Văn Minh',      score: 91, rank: 'Xuất sắc', status: 'APPROVED',          date: '30/07/2026' },
    { id: 's11', code: 'SV2103011', name: 'Lý Thị Ngọc',        score: 66, rank: 'Khá',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's12', code: 'SV2103012', name: 'Trương Văn Phong',   score: 79, rank: 'Khá',      status: 'WAITING_APPROVAL',  date: '01/08/2026' },
  ],
  'httt-k65': [
    { id: 's1',  code: 'SV2104001', name: 'Nguyễn Văn An',      score: 85, rank: 'Tốt',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's2',  code: 'SV2104002', name: 'Trần Thị Bảo',       score: 0,  rank: '-',        status: 'NOT_SUBMITTED',     date: '-' },
    { id: 's3',  code: 'SV2104003', name: 'Lê Văn Cảnh',        score: 71, rank: 'Khá',      status: 'APPROVED',          date: '29/07/2026' },
    { id: 's4',  code: 'SV2104004', name: 'Phạm Minh Đạt',      score: 0,  rank: '-',        status: 'NOT_SUBMITTED',     date: '-' },
    { id: 's5',  code: 'SV2104005', name: 'Hoàng Thị Giang',    score: 88, rank: 'Tốt',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's6',  code: 'SV2104006', name: 'Đặng Văn Hiếu',      score: 63, rank: 'Trung bình', status: 'WAITING_APPROVAL', date: '01/08/2026' },
    { id: 's7',  code: 'SV2104007', name: 'Vũ Thị Hương',       score: 76, rank: 'Khá',      status: 'APPROVED',          date: '31/07/2026' },
    { id: 's8',  code: 'SV2104008', name: 'Đỗ Văn Khang',       score: 0,  rank: '-',        status: 'NOT_SUBMITTED',     date: '-' },
    { id: 's9',  code: 'SV2104009', name: 'Ngô Thị Lan',        score: 80, rank: 'Tốt',      status: 'APPROVED',          date: '30/07/2026' },
    { id: 's10', code: 'SV2104010', name: 'Bùi Văn Mạnh',       score: 57, rank: 'Yếu',      status: 'WAITING_APPROVAL',  date: '01/08/2026' },
  ],
};
