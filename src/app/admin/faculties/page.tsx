import type { Metadata } from 'next';
import { AdminFaculties } from '../../../views/Admin/Faculties';

export const metadata: Metadata = {
  title: 'Quản lý khoa',
  description: 'Quản lý danh mục khoa và trạng thái sử dụng trong APAG.',
};

export default function Page() {
  return <AdminFaculties />;
}
