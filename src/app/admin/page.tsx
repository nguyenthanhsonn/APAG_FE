import type { Metadata } from 'next';
import { AdminDashboard } from '../../views/Admin/Dashboard';

export const metadata: Metadata = {
  title: 'Dashboard quản trị',
  description: 'Tổng quan dữ liệu quản trị hệ thống đánh giá rèn luyện sinh viên APAG.',
};

export default function Page() {
  return <AdminDashboard />;
}
