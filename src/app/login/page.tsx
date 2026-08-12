import type { Metadata } from 'next';
import Login from '../../components/auth/login';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập hệ thống APAG để quản lý và đánh giá điểm rèn luyện sinh viên.',
};

export default function LoginPage() {
  return <Login />;
}
