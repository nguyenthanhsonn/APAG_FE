import type { Metadata } from 'next';
import { AdminEvaluations } from '../../../views/Admin/Evaluations';

export const metadata: Metadata = {
  title: 'Duyệt đánh giá rèn luyện',
  description: 'Phòng Đào tạo duyệt cuối, theo dõi trạng thái và tổng hợp phiếu đánh giá rèn luyện.',
};

export default function AdminEvaluationsPage() {
  return <AdminEvaluations />;
}
