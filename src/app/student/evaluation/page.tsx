import type { Metadata } from 'next';
import { EvaluationFormQD4185 } from '../../../views/Faculty/Student/EvaluationFormQD4185';

export const metadata: Metadata = {
  title: 'Phiếu đánh giá rèn luyện',
  description: 'Sinh viên nhập, lưu nháp và nộp phiếu tự đánh giá rèn luyện.',
};

export default function Page() {
  return <EvaluationFormQD4185 />;
}
