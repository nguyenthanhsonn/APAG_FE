'use client';

import { NotFoundContent } from '@/components/common/NotFoundContent';

export default function ClassCouncilNotFound() {
  return (
    <NotFoundContent
      homeLink="/class_council"
      menuItems={[
        { label: 'Lớp phụ trách', href: '/class_council', icon: '👥' },
      ]}
    />
  );
}
