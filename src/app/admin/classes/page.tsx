import type { Metadata } from 'next';
import { AdminClasses } from '../../../views/Admin/Classes';

export const metadata: Metadata = {
  title: 'Quản lý lớp',
  description: 'Quản lý danh mục lớp học và dữ liệu phân cấp phục vụ đánh giá rèn luyện.',
};

export default function Page() {
  return <AdminClasses />;
}
