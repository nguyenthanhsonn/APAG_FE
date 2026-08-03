'use client';

import { NotFoundContent } from '@/components/common/NotFoundContent';

export default function ClassCouncilNotFound() {
  return (
    <NotFoundContent
      homeLink="/advisor"
      menuItems={[
        { label: 'Lớp phụ trách', href: '/advisor', icon: '👥' },
      ]}
    />
  );
}
