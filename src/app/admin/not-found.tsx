'use client';

import { NotFoundContent } from '@/components/common/NotFoundContent';

export default function AdminNotFound() {
  return (
    <NotFoundContent
      homeLink="/admin"
      menuItems={[
        { label: 'Dashboard', href: '/admin', icon: '🏠' },
        { label: 'Quản lý người dùng', href: '/admin/users', icon: '👥' },
        { label: 'Quản lý sinh viên', href: '/admin/students', icon: '🎓' },
        { label: 'Quản lý Khoa', href: '/admin/faculties', icon: '🏢' },
        { label: 'Quản lý Ngành', href: '/admin/majors', icon: '🧭' },
        { label: 'Quản lý Lớp', href: '/admin/classes', icon: '🏫' },
        { label: 'Quản lý Học kỳ', href: '/admin/semesters', icon: '📅' },
        { label: 'Duyệt đánh giá', href: '/admin/evaluations', icon: '📋' },
      ]}
    />
  );
}
