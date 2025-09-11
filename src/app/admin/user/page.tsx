'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Edit, Trash2, Shield, UserCheck, GraduationCap } from 'lucide-react';

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
  const [createLoading, setCreateLoading] = useState(false);
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
    setCreateLoading(true);
    setCreateSuccess('');
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setCreateSuccess('User created successfully!');
        setTimeout(() => {
          setShowCreateModal(false);
          setFormData({ name: '', email: '', role: 'ADVISOR', facultyId: '', departmentId: '' });
          setCreateSuccess('');
        }, 1200);
        fetchUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        setEditingUser(null);
        setFormData({ name: '', email: '', role: 'ADVISOR', facultyId: '', departmentId: '' });
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' });
      if (response.ok) fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1F3A93]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
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
                <Button type="submit" className="flex-1 bg-[#1F3A93] hover:bg-[#1F3A93]/90" disabled={createLoading}>
                  {createLoading ? 'Creating...' : (editingUser ? 'Update' : 'Create')}
                </Button>
                {createSuccess && (
                  <div className="w-full text-green-600 text-center text-sm mt-2">{createSuccess}</div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', role: 'ADVISOR', facultyId: '', departmentId: '' });
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
