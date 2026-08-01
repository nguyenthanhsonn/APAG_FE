'use client';

import { NotFoundContent } from '@/components/common/NotFoundContent';

export default function FacultyNotFound() {
  return (
    <NotFoundContent
      homeLink="/faculty"
      menuItems={[
        { label: 'Duyệt điểm rèn luyện', href: '/faculty', icon: '🏢' },
      ]}
    />
  );
}
