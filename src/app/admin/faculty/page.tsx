'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FacultyManagement from '@/components/admin/FacultyManagement';

export default function FacultyPage() {
  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Faculty Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all faculties across the institution
          </p>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Faculty Administration
            </CardTitle>
            <CardDescription>
              Create, edit, and manage faculties in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FacultyManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
