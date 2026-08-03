'use client';

import React from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdvisorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="advisor">
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  );
}
