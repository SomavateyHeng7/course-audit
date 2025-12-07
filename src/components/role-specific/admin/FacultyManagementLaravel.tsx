'use client';

import { useState, useEffect } from 'react';
import { 
  getFaculties, 
  createFaculty, 
  updateFaculty, 
  deleteFaculty 
} from '@/lib/api/laravel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Faculty {
  id: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function FacultyManagementLaravel() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch faculties on mount
  useEffect(() => {
    loadFaculties();
  }, []);

  async function loadFaculties() {
    try {
      setLoading(true);
      const data = await getFaculties();
      setFaculties(data);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!formData.name.trim()) return;
    
    try {
      await createFaculty(formData);
      setFormData({ name: '', description: '' });
      setIsCreating(false);
      await loadFaculties();
    } catch (err: any) {
      alert('Error creating faculty: ' + err.message);
    }
  }

  async function handleUpdate(id: number) {
    try {
      await updateFaculty(id, formData);
      setEditingId(null);
      setFormData({ name: '', description: '' });
      await loadFaculties();
    } catch (err: any) {
      alert('Error updating faculty: ' + err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this faculty?')) return;
    
    try {
      await deleteFaculty(id);
      await loadFaculties();
    } catch (err: any) {
      alert('Error deleting faculty: ' + err.message);
    }
  }

  function startEdit(faculty: Faculty) {
    setEditingId(faculty.id);
    setFormData({ name: faculty.name, description: faculty.description || '' });
    setIsCreating(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setFormData({ name: '', description: '' });
    setIsCreating(false);
  }

  if (loading) {
    return <div className="p-4">Loading faculties from Laravel...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Faculty Management (Laravel Backend)</CardTitle>
        <Button onClick={() => setIsCreating(true)} disabled={isCreating || editingId !== null}>
          <Plus className="h-4 w-4 mr-2" /> Add Faculty
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Create Form */}
        {isCreating && (
          <div className="mb-4 p-4 border rounded-lg bg-blue-50">
            <h3 className="font-semibold mb-3">Create New Faculty</h3>
            <div className="space-y-3">
              <div>
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Faculty name"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Faculty description"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} disabled={!formData.name.trim()}>
                  <Save className="h-4 w-4 mr-2" /> Create
                </Button>
                <Button variant="outline" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Faculties List */}
        <div className="space-y-2">
          {faculties.map((faculty) => (
            <div key={faculty.id} className="p-4 border rounded-lg">
              {editingId === faculty.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(faculty.id)} size="sm">
                      <Save className="h-4 w-4 mr-2" /> Save
                    </Button>
                    <Button variant="outline" onClick={cancelEdit} size="sm">
                      <X className="h-4 w-4 mr-2" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{faculty.name}</h3>
                    {faculty.description && (
                      <p className="text-sm text-gray-600">{faculty.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(faculty)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(faculty.id)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {faculties.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No faculties found. Create one to get started.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
