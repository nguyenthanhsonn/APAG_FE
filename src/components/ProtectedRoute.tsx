'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import type { UserRole } from '../types/common';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, isHydrated, hydrateAuth, user } = useAuthStore();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const roleHome: Record<string, string> = {
      admin: '/admin',
      student: '/student',
      class_council: '/class_council',
      class_leader: '/class_leader',
      faculty: '/faculty',
      training_department: '/training_department',
    };

    setIsAuthorized(false);

    if (!isAuthenticated) {
      router.replace('/login');
    } else if (requiredRole && user?.role !== requiredRole) {
      router.replace(user?.role ? roleHome[user.role] ?? '/login' : '/login');
    } else {
      setIsAuthorized(true);
    }
  }, [isHydrated, isAuthenticated, user, requiredRole, router]);

  if (!isHydrated || !isAuthorized || !isAuthenticated || !user || (requiredRole && user.role !== requiredRole)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
};
