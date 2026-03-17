"use client";

import { useAuth } from "@/contexts/SanctumAuthContext";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  const { user } = useAuth();

  const handleGoBack = () => {
    if (!user) {
      window.location.href = "/auth";
      return;
    }
    switch (user.role) {
      case "SUPER_ADMIN":
        window.location.href = "/admin";
        break;
      case "CHAIRPERSON":
        window.location.href = "/chairperson";
        break;
      case "ADVISOR":
        window.location.href = "/advisor/curricula";
        break;
      case "STUDENT":
        window.location.href = "/student/management";
        break;
      default:
        window.location.href = "/auth";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-4">
            <ShieldAlert className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>
        <h1 className="text-6xl font-bold text-red-600 dark:text-red-400 mb-2">
          401
        </h1>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Whoops!
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          You are not authorized to access this page. Please go back to your
          dashboard or contact an administrator if you believe this is an error.
        </p>
        <button
          onClick={handleGoBack}
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Go to My Dashboard
        </button>
      </div>
    </div>
  );
}
