import type { Metadata } from 'next';
import { ClassListView } from '@/views/Class_council/ClassListView';

export const metadata: Metadata = {
  title: 'CVHT - Lớp phụ trách',
  description: 'Danh sách lớp CVHT phụ trách và tiến độ đánh giá rèn luyện sinh viên.',
};

export default function Page() {
  return <ClassListView />;
}
