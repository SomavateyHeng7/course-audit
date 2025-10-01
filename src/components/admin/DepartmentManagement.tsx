'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users,
  GraduationCap
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  faculty?: {
    id: string;
    name: string;
    code: string;
  } | null;
  _count?: {
    users: number;
    curricula: number;
  };
  createdAt: string;
}

interface Faculty {
  id: string;
  name: string;
  code: string;
}

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
    fetchFaculties();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      console.log('Departments API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Departments data received:', data);
        setDepartments(data.departments);
      } else {
        const errorData = await response.json();
        console.error('Departments API error:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      const response = await fetch('/api/faculties');
      console.log('Faculties API response status in dept management:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Faculties data received in dept management:', data);
        setFaculties(data.faculties);
      } else {
        const errorData = await response.json();
        console.error('Faculties API error in dept management:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const handleDeleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchDepartments();
      }
    } catch (error) {
      console.error('Error deleting department:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2ECC71]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Department Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage departments and their faculty associations across the entire system
          </p>
        </div>
      </div>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Departments ({departments.length})
          </CardTitle>
          <CardDescription>
            All departments organized by faculty
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departments.map((department) => (
              <div
                key={department.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {department.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Code: {department.code}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Faculty: {department.faculty?.name ?? 'N/A'} ({department.faculty?.code ?? '-'})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {department._count?.users || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {department._count?.curricula || 0}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}