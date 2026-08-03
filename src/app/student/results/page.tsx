import type { Metadata } from 'next';
import { StudentResults } from '../../../views/Student/Results';

export const metadata: Metadata = {
  title: 'Kết quả rèn luyện',
  description: 'Kết quả điểm rèn luyện, xếp loại và trạng thái duyệt cuối của sinh viên.',
};

export default function Page() {
  return <StudentResults />;
}
