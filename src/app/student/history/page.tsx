import type { Metadata } from 'next';
import { StudentHistory } from '../../../views/Student/History';

export const metadata: Metadata = {
  title: 'Lịch sử đánh giá',
  description: 'Lịch sử các phiếu đánh giá rèn luyện của sinh viên.',
};

export default function Page() {
  return <StudentHistory />;
}
