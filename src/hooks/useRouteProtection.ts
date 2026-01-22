'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SanctumAuthContext';

export type AllowedRole = 'STUDENT' | 'ADVISOR' | 'CHAIRPERSON' | 'SUPER_ADMIN';

interface UseRouteProtectionOptions {
  allowedRoles: AllowedRole[];
  redirectOnUnauthorized?: boolean;
}

interface UseRouteProtectionReturn {
  isAuthorized: boolean;
  isChecking: boolean;
  user: ReturnType<typeof useAuth>['user'];
}

/**
 * Hook to protect routes based on user roles.
 * Redirects users to appropriate pages if they don't have the required role.
 */
export function useRouteProtection({
  allowedRoles,
  redirectOnUnauthorized = true,
}: UseRouteProtectionOptions): UseRouteProtectionReturn {
  const { user, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Still loading auth state
    if (isLoading) {
      setIsChecking(true);
      return;
    }

    // No user - redirect to auth
    if (!user) {
      setIsAuthorized(false);
      setIsChecking(false);
      if (redirectOnUnauthorized) {
        window.location.href = '/auth';
      }
      return;
    }

    // Check if user has an allowed role
    const userRole = user.role as AllowedRole;
    if (allowedRoles.includes(userRole)) {
      setIsAuthorized(true);
      setIsChecking(false);
      return;
    }

    // User doesn't have the required role - redirect to their appropriate page
    setIsAuthorized(false);
    setIsChecking(false);

    if (redirectOnUnauthorized) {
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
        case 'STUDENT':
          window.location.href = '/student/management';
          break;
        default:
          window.location.href = '/auth';
      }
    }
  }, [user, isLoading, allowedRoles, redirectOnUnauthorized]);

  return {
    isAuthorized,
    isChecking: isLoading || isChecking,
    user,
  };
}

/**
 * Utility function to redirect based on user role
 */
export function redirectByRole(role: string | undefined) {
  switch (role) {
    case 'SUPER_ADMIN':
      window.location.href = '/admin';
      break;
    case 'CHAIRPERSON':
      window.location.href = '/chairperson';
      break;
    case 'ADVISOR':
      window.location.href = '/advisor/curricula';
      break;
    case 'STUDENT':
      window.location.href = '/student/management';
      break;
    default:
      window.location.href = '/auth';
  }
}
