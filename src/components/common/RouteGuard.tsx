"use client";

import React, { ReactNode } from "react";
import { useAuth } from "@/contexts/SanctumAuthContext";
import UnauthorizedPage from "@/components/common/UnauthorizedPage";

type AllowedRole = "STUDENT" | "ADVISOR" | "CHAIRPERSON" | "SUPER_ADMIN";

interface RouteGuardProps {
  allowedRoles: AllowedRole[];
  children: ReactNode;
}

/**
 * Route guard component that wraps pages requiring role-based access.
 * Shows a loading spinner while auth is checking, redirects to /auth if
 * not logged in, and displays a 401 Unauthorized page if the user's role
 * is not in the allowedRoles list.
 */
export default function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
  const { user, isLoading } = useAuth();

  // While auth is being determined, render nothing (no visible loading state)
  if (isLoading) {
    return null;
  }

  // Not authenticated → redirect to login
  if (!user) {
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  // Authenticated but wrong role → show 401
  if (!allowedRoles.includes(user.role as AllowedRole)) {
    return <UnauthorizedPage />;
  }

  // Authorized → render children
  return <>{children}</>;
}
