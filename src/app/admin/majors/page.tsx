import type { Metadata } from 'next';
import { AdminMajors } from '../../../views/Admin/Majors';

export const metadata: Metadata = {
  title: 'Quản lý ngành học',
  description: 'Quản lý ngành học theo khoa để phân lớp và sinh viên.',
};

export default function Page() {
  return <AdminMajors />;
}
