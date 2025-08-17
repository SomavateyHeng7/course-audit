'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Building2, 
  GraduationCap, 
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import RoleManagement from '@/components/admin/RoleManagement';
import DepartmentManagement from '@/components/admin/DepartmentManagement';
import FacultyManagement from '@/components/admin/FacultyManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('roles');

  return (
    <div className="w-full">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage system roles, departments, and faculties across the entire system
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-l-[#1F3A93]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-[#1F3A93]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">1,234</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#2ECC71]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Departments
              </CardTitle>
              <Building2 className="h-4 w-4 text-[#2ECC71]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">45</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Across all faculties
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[#F39C12]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Faculties
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-[#F39C12]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">8</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Active faculties
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              System Management
            </CardTitle>
            <CardDescription>
              Manage roles, departments, and faculties across the entire system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="roles" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Roles
                </TabsTrigger>
                <TabsTrigger value="departments" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Departments
                </TabsTrigger>
                <TabsTrigger value="faculties" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Faculties
                </TabsTrigger>
              </TabsList>

              <TabsContent value="roles" className="mt-6">
                <RoleManagement />
              </TabsContent>

              <TabsContent value="departments" className="mt-6">
                <DepartmentManagement />
              </TabsContent>

              <TabsContent value="faculties" className="mt-6">
                <FacultyManagement />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
