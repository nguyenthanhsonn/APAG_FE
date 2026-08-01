'use client';

import { NotFoundContent } from '@/components/common/NotFoundContent';

export default function ClassLeaderNotFound() {
  return (
    <NotFoundContent
      homeLink="/class_leader"
      menuItems={[
        { label: 'Danh sách lớp', href: '/class_leader', icon: '👥' },
        { label: 'In danh sách', href: '/class_leader/print', icon: '🖨️' },
      ]}
    />
  );
}
