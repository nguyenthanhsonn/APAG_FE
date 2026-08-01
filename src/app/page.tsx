'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

export default function RootPage() {
  const { isAuthenticated, isHydrated, hydrateAuth, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (!isAuthenticated) {
      router.replace('/login');
    } else {
      if (user?.role === 'admin') {
        router.replace('/admin');
      } else if (user?.role === 'class_council') {
        router.replace('/class_council');
      } else if (user?.role === 'class_leader') {
        router.replace('/class_leader');
      } else if (user?.role === 'faculty') {
        router.replace('/faculty');
      } else if (user?.role === 'training_department') {
        router.replace('/training_department');
      } else {
        router.replace('/student');
      }
    }
  }, [isHydrated, isAuthenticated, user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
}
