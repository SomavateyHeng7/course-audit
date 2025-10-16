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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Faculty Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage faculties and their organizational structure across the entire system
          </p>
        </div>
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
