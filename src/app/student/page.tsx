'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/SanctumAuthContext';

export default function StudentPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // If no user, redirect to auth
    if (!user) {
      window.location.href = '/auth';
      return;
    }

    // If user has wrong role, redirect to appropriate page
    if (user.role !== 'STUDENT') {
      switch (user.role) {
        case 'SUPER_ADMIN':
          window.location.href = '/admin';
          break;
        case 'CHAIRPERSON':
          window.location.href = '/chairperson';
          break;
        case 'ADVISOR':
          window.location.href = '/advisor/curricula';
          break;
        default:
          window.location.href = '/auth';
      }
      return;
    }

    // Student user - redirect to management
    router.replace('/student/management');
  }, [user, isLoading, router]);

  // Show loading state
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
