'use client';

import { use } from 'react';
import ClassDetailPage from '../../../../views/Admin/ClassDetailPage';

export default function Page({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  return <ClassDetailPage classId={classId} />;
}
