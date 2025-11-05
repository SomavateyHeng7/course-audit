'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  GraduationCap, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Building2,
  BookOpen
} from 'lucide-react';

interface Faculty {
  id: string;
  name: string;
  code: string;
  _count?: {
    users: number;
    departments: number;
    curricula: number;
  };
  createdAt: string;
}

export default function FacultyManagement() {
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFacultyId, setDeleteFacultyId] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
  });

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      const response = await fetch('/api/faculties');
      console.log('Faculties API response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Faculties data received:', data);
        setFaculties(data.faculties);
      } else {
        const errorData = await response.json();
        console.error('Faculties API error:', response.status, errorData);
        setToast({ 
          message: `Failed to fetch faculties: ${errorData.error || 'Unknown error'}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setToast({ 
        message: 'Network error while fetching faculties', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    try {
      const response = await fetch('/api/faculties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({ name: '', code: '' });
        fetchFaculties();
        setToast({ message: 'Faculty created successfully!', type: 'success' });
      } else {
        setToast({ message: 'Failed to create faculty.', type: 'error' });
      }
    } catch (error) {
      console.error('Error creating faculty:', error);
      setToast({ message: 'Error creating faculty.', type: 'error' });
    } finally {
      setCreateLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleUpdateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFaculty) return;
    setUpdateLoading(true);
    try {
      const response = await fetch(`/api/faculties/${editingFaculty.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setToast({ message: 'Faculty updated successfully!', type: 'success' });
        setEditingFaculty(null);
        setFormData({ name: '', code: '' });
        fetchFaculties();
      } else {
        setToast({ message: 'Failed to update faculty.', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error updating faculty.', type: 'error' });
      console.error('Error updating faculty:', error);
    } finally {
      setUpdateLoading(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDeleteFaculty = (facultyId: string) => {
    setShowDeleteModal(true);
    setDeleteFacultyId(facultyId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F39C12]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-4 lg:p-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[100] transition-all ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white px-4 py-2 rounded shadow-lg`}
        >
          {toast.message}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteFacultyId(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">Delete Faculty</h3>
            <p className="mb-6">Are you sure you want to delete this faculty? This will also delete all associated departments and users.</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteFacultyId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                disabled={deleteLoading}
                onClick={async () => {
                  if (!deleteFacultyId) return;
                  setDeleteLoading(true);
                  try {
                    const response = await fetch(`/api/faculties/${deleteFacultyId}`, { method: 'DELETE' });
                    if (response.ok) {
                      setToast({ message: 'Faculty deleted successfully!', type: 'success' });
                      fetchFaculties();
                    } else {
                      const data = await response.json();
                      if (data?.error && data?.details) {
                        setToast({
                          message: `Cannot delete faculty: ${data.error}. Users: ${data.details.users}, Departments: ${data.details.departments}, Curricula: ${data.details.curricula}`,
                          type: 'error',
                        });
                      } else {
                        setToast({ message: 'Failed to delete faculty.', type: 'error' });
                      }
                    }
                  } catch (error) {
                    setToast({ message: 'Error deleting faculty.', type: 'error' });
                  } finally {
                    setShowDeleteModal(false);
                    setDeleteFacultyId(null);
                    setDeleteLoading(false);
                    setTimeout(() => setToast(null), 4000);
                  }
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Faculty Management</h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Manage faculties and their organizational structure across the entire system
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#F39C12] hover:bg-[#F39C12]/90 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden xs:inline">Add Faculty</span>
          <span className="xs:hidden">Add</span>
        </Button>
      </div>

      {/* Faculties List */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <GraduationCap className="h-4 w-4 sm:h-5 sm:w-5" />
            Faculties ({faculties.length})
          </CardTitle>
          <CardDescription className="text-sm">
            All faculties in the system with their departments and users
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {faculties.map((faculty) => (
              <div
                key={faculty.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors gap-3 sm:gap-4"
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                      {faculty.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Code: {faculty.code}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Created: {new Date(faculty.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                  <div className="flex gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{faculty._count?.users || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{faculty._count?.departments || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span>{faculty._count?.curricula || 0}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFaculty(faculty);
                        setFormData({
                          name: faculty.name,
                          code: faculty.code,
                        });
                      }}
                      className="p-2"
                    >
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFaculty(faculty.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2"
                    >
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingFaculty) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setShowCreateModal(false);
                setEditingFaculty(null);
                setFormData({ name: '', code: '' });
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {editingFaculty ? 'Edit Faculty' : 'Create New Faculty'}
            </h3>
            <form onSubmit={editingFaculty ? handleUpdateFaculty : handleCreateFaculty} className="space-y-4">
              <div>
                <Label htmlFor="name">Faculty Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="code">Faculty Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingFaculty(null);
                    setFormData({ name: '', code: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-[#F39C12] hover:bg-[#F39C12]/90"
                  disabled={editingFaculty ? updateLoading : createLoading}
                >
                  {editingFaculty 
                    ? (updateLoading ? 'Updating...' : 'Update')
                    : (createLoading ? 'Creating...' : 'Create')
                  }
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
