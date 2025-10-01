'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, Shield, UserCheck, GraduationCap } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'STUDENT' | 'ADVISOR' | 'CHAIRPERSON' | 'SUPER_ADMIN';
  faculty: {
    name: string;
  };
  createdAt: string;
}

const roleColors = {
  STUDENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  ADVISOR: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  CHAIRPERSON: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  SUPER_ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const roleIcons = {
  STUDENT: GraduationCap,
  ADVISOR: UserCheck,
  CHAIRPERSON: Shield,
  SUPER_ADMIN: Shield,
};

export default function RoleManagement() {
  const { success, error: showError } = useToastHelpers();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ faculties state
  const [faculties, setFaculties] = useState<{ id: string; name: string }[]>([]);
  const [facultiesLoading, setFacultiesLoading] = useState(true);

  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'ADVISOR' as 'ADVISOR' | 'CHAIRPERSON',
    facultyId: '',
    departmentId: '',
  });

  // ✅ fetch faculties once
  useEffect(() => {
    setFacultiesLoading(true);
    fetch('/api/faculties')
      .then((res) => res.json())
      .then((data) => setFaculties(data.faculties || []))
      .catch(() => setFaculties([]))
      .finally(() => setFacultiesLoading(false));
  }, []);

  // fetch departments when faculty changes
  useEffect(() => {
    if (formData.facultyId) {
      setFacultyLoading(true);
      fetch(`/api/departments?facultyId=${formData.facultyId}`)
        .then((res) => res.json())
        .then((data) => setDepartments(data.departments || []))
        .catch(() => setDepartments([]))
        .finally(() => setFacultyLoading(false));
    } else {
      setDepartments([]);
    }
  }, [formData.facultyId]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match.');
      return;
    }
    setCreateLoading(true);
    setCreateSuccess('');
    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      if (response.ok) {
        success('User created successfully!');
        setShowCreateModal(false);
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'ADVISOR', facultyId: '', departmentId: '' });
        fetchUsers();
      } else {
        const data = await response.json();
        if (data?.error && data?.details) {
          showError(`Cannot create user: ${data.error}. Details: ${JSON.stringify(data.details)}`);
        } else if (data?.error) {
          showError(`Failed to create user: ${data.error}`);
        } else {
          showError('Failed to create user.');
        }
      }
    } catch (error) {
      showError('Error creating user.');
      console.error('Error creating user:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match.');
      return;
    }
    setUpdateLoading(true);
    try {
      const { confirmPassword, ...submitData } = formData;
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
      });
      if (response.ok) {
        success('User updated successfully!');
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'ADVISOR', facultyId: '', departmentId: '' });
        fetchUsers();
      } else {
        const data = await response.json();
        if (data?.error && data?.details) {
          showError(`Cannot update user: ${data.error}. Details: ${JSON.stringify(data.details)}`);
        } else if (data?.error) {
          showError(`Failed to update user: ${data.error}`);
        } else {
          showError('Failed to update user.');
        }
      }
    } catch (error) {
      showError('Error updating user.');
      console.error('Error updating user:', error);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setShowDeleteModal(true);
    setDeleteUserId(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A93]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteUserId(null);
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">Delete User</h3>
            <p className="mb-6">Are you sure you want to delete this user?</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteUserId(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  if (!deleteUserId) return;
                  setCreateLoading(true);
                  try {
                    const response = await fetch(`/api/admin/users/${deleteUserId}`, { method: 'DELETE' });
                    if (response.ok) {
                      success('User deleted successfully!');
                      fetchUsers();
                    } else {
                      const data = await response.json();
                      if (data?.error && data?.details) {
                        showError(`Cannot delete user: ${data.error}. Details: ${JSON.stringify(data.details)}`);
                      } else if (data?.error) {
                        showError(`Failed to delete user: ${data.error}`);
                      } else {
                        showError('Failed to delete user.');
                      }
                    }
                  } catch (error) {
                    showError('Error deleting user.');
                  } finally {
                    setCreateLoading(false);
                    setShowDeleteModal(false);
                    setDeleteUserId(null);

                  }
                }}
              >
                {createLoading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage user roles and permissions across the entire system
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-[#1F3A93] hover:bg-[#1F3A93]/90"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users.length})
          </CardTitle>
          <CardDescription>All registered users in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => {
              const RoleIcon = roleIcons[user.role];
              return (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <RoleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{user.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">{user.faculty.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={roleColors[user.role]}>{user.role}</Badge>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUser(user);
                          setFormData({
                            name: user.name,
                            email: user.email,
                            password: '',
                            confirmPassword: '',
                            role: (user.role === 'ADVISOR' || user.role === 'CHAIRPERSON') ? user.role : 'ADVISOR',
                            facultyId: '',
                            departmentId: '',
                          });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setShowCreateModal(false);
                setEditingUser(null);
                setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'ADVISOR', facultyId: '', departmentId: '' });
              }}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-lg font-semibold mb-4">
              {editingUser ? 'Edit User' : 'Create New User'}
            </h3>
            <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div className="relative">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-8 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.816-.63 1.582-1.07 2.276M15.362 17.362A9.042 9.042 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.042 9.042 0 012.638-3.362" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.042 9.042 0 012.638-3.362m3.362-3.362A9.042 9.042 0 0112 5c4.477 0 8.268 2.943 9.542 7a8.978 8.978 0 01-4.304 5.255M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              <div className="relative">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-8 text-gray-400 hover:text-gray-700"
                  tabIndex={-1}
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-.274.816-.63 1.582-1.07 2.276M15.362 17.362A9.042 9.042 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.042 9.042 0 012.638-3.362" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.042 9.042 0 012.638-3.362m3.362-3.362A9.042 9.042 0 0112 5c4.477 0 8.268-2.943 9.542 7a8.978 8.978 0 01-4.304 5.255M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="ADVISOR">Advisor</option>
                  <option value="CHAIRPERSON">Chairperson</option>
                </select>
              </div>
              <div>
                <Label htmlFor="faculty">Faculty</Label>
                <select
                  id="faculty"
                  value={formData.facultyId}
                  onChange={(e) => setFormData({ ...formData, facultyId: e.target.value, departmentId: '' })}
                  className="w-full p-2 border rounded-md"
                  required
                  disabled={facultiesLoading}
                >
                  <option value="">{facultiesLoading ? 'Loading...' : 'Select Faculty'}</option>
                  {faculties.map((fac) => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <select
                  id="department"
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                  disabled={!formData.facultyId || facultyLoading}
                >
                  <option value="">{facultyLoading ? 'Loading...' : 'Select Department'}</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', password: '', confirmPassword: '', role: 'ADVISOR', facultyId: '', departmentId: '' });
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-[#1F3A93] hover:bg-[#1F3A93]/90" disabled={createLoading}>
                  {editingUser ? (updateLoading ? 'Updating...' : 'Update') : (createLoading ? 'Creating...' : 'Create')}
                </Button>
                {createSuccess && (
                  <div className="w-full text-green-600 text-center text-sm mt-2">{createSuccess}</div>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
