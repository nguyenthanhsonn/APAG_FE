import type { Metadata } from 'next';
import { AdminSemesters } from '../../../views/Admin/Semesters';

export const metadata: Metadata = {
  title: 'Quản lý học kỳ',
  description: 'Quản lý học kỳ, năm học và thời gian mở phiếu đánh giá rèn luyện.',
};

export default function Page() {
  return <AdminSemesters />;
}
