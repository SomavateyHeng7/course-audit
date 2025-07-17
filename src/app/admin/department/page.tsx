'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DepartmentManagement from '@/components/admin/DepartmentManagement';

export default function DepartmentPage() {
  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Department Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all departments across the institution
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Department Administration
            </CardTitle>
            <CardDescription>
              Create, edit, and manage departments in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
