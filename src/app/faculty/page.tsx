import type { Metadata } from 'next';
import { FacultyDashboard } from '@/views/Faculty/Dashboard';

export const metadata: Metadata = {
  title: 'Khoa - Gửi điểm rèn luyện',
  description: 'Khoa theo dõi phiếu đã được CVHT xác nhận và gửi danh sách lên Phòng Đào tạo.',
};

export default function FacultyPage() {
  return <FacultyDashboard />;
}
