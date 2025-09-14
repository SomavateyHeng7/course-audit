'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  const [updateLoading, setUpdateLoading] = useState(false);
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
      if (response.ok) {
        const data = await response.json();
        setFaculties(data.faculties);
      }
    } catch (error) {
      console.error('Error fetching faculties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFaculty = async (e: React.FormEvent) => {
    e.preventDefault();
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
      }
    } catch (error) {
      console.error('Error creating faculty:', error);
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
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleDeleteFaculty = async (facultyId: string) => {
    if (!confirm('Are you sure you want to delete this faculty? This will also delete all associated departments and users.')) return;

    try {
      const response = await fetch(`/api/faculties/${facultyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchFaculties();
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F39C12]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] transition-all ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-4 py-2 rounded shadow-lg`}>
          {toast.message}
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Faculty Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage faculties and their organizational structure across the entire system
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#F39C12] hover:bg-[#F39C12]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Faculty
        </Button>
      </div>

      {/* Faculties List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Faculties ({faculties.length})
          </CardTitle>
          <CardDescription>
            All faculties in the system with their departments and users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {faculties.map((faculty) => (
              <div
                key={faculty.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {faculty.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Code: {faculty.code}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Created: {new Date(faculty.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {faculty._count?.users || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {faculty._count?.departments || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {faculty._count?.curricula || 0}
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
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFaculty(faculty.id)}
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
      {(showCreateModal || editingFaculty) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
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
                <Button type="submit" className="flex-1 bg-[#F39C12] hover:bg-[#F39C12]/90" disabled={updateLoading}>
                  {updateLoading ? 'Updating...' : (editingFaculty ? 'Update' : 'Create')}
                </Button>
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 