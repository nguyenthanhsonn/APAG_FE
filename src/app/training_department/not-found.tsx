'use client';

import { NotFoundContent } from '@/components/common/NotFoundContent';

export default function TrainingDeptNotFound() {
  return (
    <NotFoundContent
      homeLink="/training_department"
      menuItems={[
        { label: 'Báo cáo & Thống kê', href: '/training_department', icon: '📊' },
      ]}
    />
  );
}
