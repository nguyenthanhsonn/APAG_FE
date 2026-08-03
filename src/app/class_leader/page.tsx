import type { Metadata } from 'next';
import { ClassLeaderDashboard } from '@/views/ClassLeader/Dashboard';

export const metadata: Metadata = {
  title: 'Lớp trưởng - Duyệt điểm rèn luyện',
  description: 'Màn hình lớp trưởng chấm, xác nhận và gửi phiếu đánh giá rèn luyện lên CVHT.',
};

export default function ClassLeaderPage() {
  return <ClassLeaderDashboard />;
}
