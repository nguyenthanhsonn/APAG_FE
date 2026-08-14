import type { Metadata } from 'next';
import { StudentEvidence } from '../../../views/Faculty/Student/Evidence';

export const metadata: Metadata = {
  title: 'Minh chứng rèn luyện',
  description: 'Quản lý ảnh minh chứng Cloudinary cho các tiêu chí đánh giá rèn luyện.',
};

export default function Page() {
  return <StudentEvidence />;
}
