import type { Metadata } from 'next';
import { AdminUsers } from '../../../views/Admin/Student';

export const metadata: Metadata = {
  title: 'Quản lý người dùng',
  description: 'Tạo, cập nhật và phân công tài khoản staff theo vai trò trong CSMTS.',
};

export default function Page() {
  return <AdminUsers />;
}
