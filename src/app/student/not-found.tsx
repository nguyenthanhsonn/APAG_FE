'use client';

import { NotFoundContent } from '@/components/common/NotFoundContent';

export default function StudentNotFound() {
  return (
    <NotFoundContent
      homeLink="/student"
      menuItems={[
        { label: 'Phiếu đánh giá', href: '/student/evaluation', icon: '📋' },
        { label: 'Lịch sử đánh giá', href: '/student/history', icon: '🕒' },
        { label: 'Kết quả', href: '/student/results', icon: '🏆' },
      ]}
    />
  );
}
