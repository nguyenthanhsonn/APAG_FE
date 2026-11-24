import type { Metadata } from 'next';
import { EvaluationFormQD4185 } from '@/views/Faculty/Student/EvaluationFormQD4185';

export const metadata: Metadata = {
  title: 'Lớp trưởng - Đánh giá rèn luyện cá nhân',
  description: 'Màn hình lớp trưởng tự đánh giá điểm rèn luyện của bản thân và gửi vào danh sách lớp để gửi CVHT.',
};

export default function ClassLeaderEvaluationPage() {
  return <EvaluationFormQD4185 />;
}
