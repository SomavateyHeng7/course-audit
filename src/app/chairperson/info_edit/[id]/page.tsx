'use client';

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FaArrowLeft, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

interface Curriculum {
  id: string;
  name: string;
  year: string;
  version: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  department: {
    id: string;
    name: string;
    code: string;
  };
  faculty: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    curriculumCourses: number;
    curriculumConstraints: number;
    electiveRules: number;
  };
}

const CurriculumInfoEditPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    version: '',
    description: '',
    isActive: true
  });

  const curriculumId = params.id as string;

  useEffect(() => {
    if (curriculumId) {
      fetchCurriculum();
    }
  }, [curriculumId]);

  const fetchCurriculum = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/curricula/${curriculumId}`);
      if (response.ok) {
        const data = await response.json();
        setCurriculum(data);
        setFormData({
          name: data.name,
          year: data.year,
          version: data.version,
          description: data.description || '',
          isActive: data.isActive
        });
      } else {
        console.error('Failed to fetch curriculum');
      }
    } catch (error) {
      console.error('Error fetching curriculum:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/curricula/${curriculumId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedCurriculum = await response.json();
        setCurriculum(updatedCurriculum);
        setEditing(false);
      } else {
        console.error('Failed to update curriculum');
      }
    } catch (error) {
      console.error('Error updating curriculum:', error);
    }
  };

  const handleCancel = () => {
    if (curriculum) {
      setFormData({
        name: curriculum.name,
        year: curriculum.year,
        version: curriculum.version,
        description: curriculum.description || '',
        isActive: curriculum.isActive
      });
    }
    setEditing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading curriculum...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-foreground font-semibold mb-2">Curriculum not found</div>
              <button
                onClick={() => router.push('/chairperson')}
                className="text-primary hover:underline"
              >
                Return to curricula list
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/chairperson')}
              className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
            >
              <FaArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Curriculum Information
              </h1>
              <p className="text-muted-foreground">
                View and edit curriculum details
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={handleSave}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <FaSave size={16} />
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:bg-secondary/90 transition-colors flex items-center gap-2"
                >
                  <FaTimes size={16} />
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <FaEdit size={16} />
                Edit Curriculum
              </button>
            )}
          </div>
        </div>

        {/* Curriculum Details */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Basic Information
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Curriculum Name
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  />
                ) : (
                  <div className="text-foreground font-medium">{curriculum.name}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Academic Year
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  />
                ) : (
                  <div className="text-foreground font-medium">{curriculum.year}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Version
                </label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  />
                ) : (
                  <div className="text-foreground font-medium">v{curriculum.version}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Description
                </label>
                {editing ? (
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                    placeholder="Enter curriculum description..."
                  />
                ) : (
                  <div className="text-foreground">
                    {curriculum.description || 'No description provided'}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Status
                </label>
                {editing ? (
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                ) : (
                  <div className={`inline-block px-2 py-1 rounded text-sm font-medium ${
                    curriculum.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {curriculum.isActive ? 'Active' : 'Inactive'}
                  </div>
                )}
              </div>
            </div>

            {/* Department & Statistics */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Department & Statistics
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Department
                </label>
                <div className="text-foreground font-medium">{curriculum.department.name}</div>
                <div className="text-sm text-muted-foreground">{curriculum.department.code}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Faculty
                </label>
                <div className="text-foreground font-medium">{curriculum.faculty.name}</div>
                <div className="text-sm text-muted-foreground">{curriculum.faculty.code}</div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Course Statistics
                </label>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Courses:</span>
                    <span className="font-medium text-foreground">{curriculum._count.curriculumCourses}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Constraints:</span>
                    <span className="font-medium text-foreground">{curriculum._count.curriculumConstraints}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Elective Rules:</span>
                    <span className="font-medium text-foreground">{curriculum._count.electiveRules}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Timestamps
                </label>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Created: {formatDate(curriculum.createdAt)}</div>
                  <div>Updated: {formatDate(curriculum.updatedAt)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CurriculumInfoEditPage;
