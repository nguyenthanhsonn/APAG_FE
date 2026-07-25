'use client';

import React from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { NewEvaluationChecker } from '@/components/student/NewEvaluationChecker';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="student">
      <MainLayout>
        {children}
        <NewEvaluationChecker />
      </MainLayout>
    </ProtectedRoute>
  );
}
