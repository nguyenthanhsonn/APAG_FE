import type { Metadata } from 'next';
import { TrainingDeptDashboard } from '@/views/TrainingDepartment/Dashboard';

export const metadata: Metadata = {
  title: 'Phòng Đào tạo - Duyệt cuối',
  description: 'Phòng Đào tạo theo dõi phiếu chờ duyệt cuối và tổng hợp kết quả rèn luyện toàn trường.',
};

export default function TrainingDepartmentPage() {
  return <TrainingDeptDashboard />;
}
