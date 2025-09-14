'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  GraduationCap
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  faculty: {
    id: string;
    name: string;
    code: string;
  };
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    facultyId: '',
  });

  // New states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    fetchDepartments();
    fetchFaculties();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments);
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
      if (response.ok) {
        const data = await response.json();
        setFaculties(data.faculties);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    }
  };

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ name: '', code: '', facultyId: '' });
        fetchDepartments();
        setSuccessMessage("Department created successfully ✅");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error('Error creating department:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDepartment) return;

    setIsSubmitting(true);
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/departments/${editingDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setEditingDepartment(null);
        setFormData({ name: '', code: '', facultyId: '' });
        fetchDepartments();
        setSuccessMessage("Department updated successfully ✅");
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    } catch (error) {
      console.error('Error updating department:', error);
    } finally {
      setIsSubmitting(false);
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
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#2ECC71] hover:bg-[#2ECC71]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
          {successMessage}
        </div>
      )}

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
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Faculty: {department.faculty.name} ({department.faculty.code})
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
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingDepartment(department);
                        setFormData({
                          name: department.name,
                          code: department.code,
                          facultyId: department.faculty.id,
                        });
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteDepartment(department.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingDepartment) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setShowCreateModal(false);
                setEditingDepartment(null);
                setFormData({ name: '', code: '', facultyId: '' });
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {editingDepartment ? 'Edit Department' : 'Create New Department'}
            </h3>
            <form onSubmit={editingDepartment ? handleUpdateDepartment : handleCreateDepartment} className="space-y-4">
              <div>
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Department Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="facultyId">Faculty</Label>
                <select
                  id="facultyId"
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a faculty</option>
                  {faculties.map((faculty) => (
                    <option key={faculty.id} value={faculty.id}>
                      {faculty.name} ({faculty.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1 bg-[#2ECC71] hover:bg-[#2ECC71]/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting 
                    ? (editingDepartment ? "Updating..." : "Creating...") 
                    : (editingDepartment ? "Update" : "Create")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingDepartment(null);
                    setFormData({ name: '', code: '', facultyId: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
