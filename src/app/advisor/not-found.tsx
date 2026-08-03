'use client';

import { NotFoundContent } from '@/components/common/NotFoundContent';

export default function AdvisorNotFound() {
  return (
    <NotFoundContent
      homeLink="/advisor"
      menuItems={[
        { label: 'Lớp phụ trách', href: '/advisor', icon: '👥' },
      ]}
    />
  );
}
