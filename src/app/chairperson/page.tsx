'use client';

import React, { useState, useEffect } from "react";
import { useAuth } from '@/contexts/SanctumAuthContext';
import { useRouter } from "next/navigation";
import { Trash2, Info, Plus, BookOpen, Users, Calendar, Settings, Copy, Pencil } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { API_BASE } from '@/lib/api/laravel';
import { getCsrfCookie, getCsrfTokenFromCookie } from '@/lib/auth/sanctum';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Import chairperson components
import { PageHeader } from '@/components/role-specific/chairperson/PageHeader';
import { SearchBar } from '@/components/role-specific/chairperson/SearchBar';
import { DataTable } from '@/components/role-specific/chairperson/DataTable';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/role-specific/chairperson/EmptyState';
import { StatCard } from '@/components/role-specific/chairperson/StatCard';
import { Pagination } from '@/components/role-specific/chairperson/Pagination';
import { ActionButton } from '@/components/role-specific/chairperson/ActionButton';

interface Curriculum {
  id: string;
  name: string;
  year: string;
  version: string;
  description?: string;
  startId?: string;
  endId?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;  // Backend snake_case
  updated_at?: string;  // Backend snake_case
  department: {
    id: string;
    name: string;
    code: string;
  };
  faculty?: {
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

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ChairpersonPage: React.FC = () => {
  const { success, error: showError, warning, info } = useToastHelpers();
  const { user } = useAuth();
  const router = useRouter();
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    curriculumId: string | null;
    curriculumName: string | null;
  }>({ open: false, curriculumId: null, curriculumName: null });

  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    curriculumId: string | null;
    currentName: string;
  }>({ open: false, curriculumId: null, currentName: '' });
  const [newCurriculumName, setNewCurriculumName] = useState<string>('');

  const fetchCurricula = async (search: string = '', page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`${API_BASE}/curricula?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        setCurricula(data.curricula);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch curricula:', data.error);
      }
    } catch (error) {
      console.error('Error fetching curricula:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCurricula();
    }
  }, [user]);

  const handleSearch = () => {
    fetchCurricula(searchTerm, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchCurricula(searchTerm, newPage);
  };

  const handleDeleteClick = (curriculumId: string, curriculumName: string) => {
    setConfirmDialog({ open: true, curriculumId, curriculumName });
  };

  const handleDeleteConfirm = async () => {
    const { curriculumId, curriculumName } = confirmDialog;
    if (!curriculumId || !curriculumName) return;

    try {
      // Get CSRF cookie first
      await getCsrfCookie();

      // Get CSRF token
      const csrfToken = getCsrfTokenFromCookie();

      const response = await fetch(`${API_BASE}/curricula/${curriculumId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        }
      });

      if (response.ok) {
        // Refresh the curricula list
        fetchCurricula(searchTerm, pagination.page);
        success(`Curriculum "${curriculumName}" has been deleted successfully.`);
      } else {
        let errorMessage = 'Unknown error';
        
        // Try to parse JSON error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.error?.message || data.message || 'Unknown error';
        } else {
          // Handle non-JSON responses (like 419 CSRF errors)
          if (response.status === 419) {
            errorMessage = 'Session expired. Please refresh the page and try again.';
          } else {
            errorMessage = `Server error (${response.status})`;
          }
        }
        
        showError(`Failed to delete curriculum: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      showError('An error occurred while deleting the curriculum. Please try again.');
    }
  };

  const handleDuplicate = async (curriculumId: string, curriculumName: string) => {
    try {
      info('Duplicating curriculum...');
      
      // Get CSRF cookie first
      await getCsrfCookie();

      // Get CSRF token
      const csrfToken = getCsrfTokenFromCookie();

      const response = await fetch(`${API_BASE}/curricula/${curriculumId}/duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Refresh the curricula list
        fetchCurricula(searchTerm, pagination.page);
        success(`Curriculum "${curriculumName}" has been duplicated successfully as "${data.curriculum?.name || 'Copy'}".`);
      } else {
        let errorMessage = 'Unknown error';
        
        // Try to parse JSON error response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.error?.message || data.message || 'Unknown error';
        } else {
          // Handle non-JSON responses (like 419 CSRF errors)
          if (response.status === 419) {
            errorMessage = 'Session expired. Please refresh the page and try again.';
          } else {
            errorMessage = `Server error (${response.status})`;
          }
        }
        
        showError(`Failed to duplicate curriculum: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error duplicating curriculum:', error);
      showError('An error occurred while duplicating the curriculum. Please try again.');
    }
  };
  const handleRenameClick = (curriculum: Curriculum) => {
    setRenameDialog({
      open: true,
      curriculumId: curriculum.id,
      currentName: curriculum.name,
    });
    setNewCurriculumName(curriculum.name);
  };

  const handleRenameConfirm = async () => {
    const { curriculumId } = renameDialog;
    if (!curriculumId) return;

    if (!newCurriculumName.trim()) {
      warning('Curriculum name cannot be empty');
      return;
    }

    try {
      // Get CSRF cookie first
      await getCsrfCookie();

      // Get CSRF token
      const csrfToken = getCsrfTokenFromCookie();

      const response = await fetch(`${API_BASE}/curricula/${curriculumId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
        },
        body: JSON.stringify({ name: newCurriculumName })
      });

      if (response.ok) {
        // Refresh the curricula list
        fetchCurricula(searchTerm, pagination.page);
        success(`Curriculum renamed successfully.`);
        setRenameDialog({ open: false, curriculumId: null, currentName: '' });
        setNewCurriculumName('');
      } else {
        let errorMessage = 'Unknown error';
        
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          errorMessage = data.error?.message || data.message || 'Unknown error';
        } else {
          if (response.status === 419) {
            errorMessage = 'Session expired. Please refresh the page and try again.';
          } else {
            errorMessage = `Server error (${response.status})`;
          }
        }
        
        showError(`Failed to update curriculum name: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error updating curriculum name:', error);
      showError('An error occurred while updating the curriculum name. Please try again.');
    }
  };
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeCurricula = curricula.filter(c => c.isActive).length;
  const totalCourses = curricula.reduce((sum, c) => sum + c._count.curriculumCourses, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Curriculum Management"
          description="Manage and organize your academic curricula and degree programs"
          actions={[
            {
              label: "Create New Curriculum",
              onClick: () => router.push('/chairperson/create'),
              icon: <Plus size={16} />
            }
          ]}
        />

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Curricula"
            value={pagination?.total || 0}
            subtitle="Academic programs"
            icon={<BookOpen size={20} />}
          />
          <StatCard
            title="Active Programs"
            value={activeCurricula}
            subtitle="Currently offered"
            icon={<Settings size={20} />}
          />
          <StatCard
            title="Total Courses"
            value={totalCourses}
            subtitle="Across all programs"
            icon={<BookOpen size={20} />}
          />
        </div>

        {/* Search */}
        <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onSubmit={handleSearch}
              placeholder="Search curricula by name, year, or description..."
              className="flex-1 max-w-md"
            />
            
            <div className="text-sm text-muted-foreground">
              {curricula.length} of {pagination?.total || 0} curricula
            </div>
          </div>
        </div>

        {/* Curricula Table */}
        <DataTable
          data={curricula}
          columns={[
            {
              key: 'name',
              label: 'Curriculum Name',
              className: 'flex-1',
              render: (curriculum: Curriculum) => (
                <div>
                  <div className="font-semibold text-foreground">
                    {curriculum.name} ({curriculum.year})
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Version {curriculum.version} • ID: {curriculum.startId} - {curriculum.endId}
                  </div>
                  {curriculum.description && (
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-2 lg:hidden">
                      {curriculum.description}
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'description',
              label: 'Description',
              className: 'flex-1',
              hideOnMobile: true,
              render: (curriculum: Curriculum) => (
                <span className="text-sm text-muted-foreground line-clamp-2">
                  {curriculum.description || 'No description available'}
                </span>
              )
            },
            {
              key: 'stats',
              label: 'Statistics',
              className: 'w-32',
              render: (curriculum: Curriculum) => (
                <div className="text-sm">
                  <div className="flex items-center gap-1 text-blue-600">
                    <BookOpen size={14} />
                    <span>{curriculum._count.curriculumCourses} courses</span>
                  </div>
                  <div className="text-muted-foreground mt-1 text-xs">
                    {curriculum._count.curriculumConstraints} constraints
                  </div>
                </div>
              )
            },
            {
              key: 'updated',
              label: 'Last Updated',
              className: 'w-32',
              hideOnMobile: true,
              render: (curriculum: Curriculum) => (
                <span className="text-sm text-muted-foreground">
                  {formatDate(curriculum.updated_at || curriculum.updatedAt)}
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              className: 'w-40 text-center',
              render: (curriculum: Curriculum) => (
                <div className="flex gap-2 justify-center">
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/chairperson/info_edit/${curriculum.id}`)}
                    stopPropagation
                    icon={<Info size={14} />}
                    tooltip="View Details"
                  />
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRenameClick(curriculum)}
                    stopPropagation
                    icon={<Pencil size={14} />}
                    tooltip="Rename Curriculum"
                    className="text-orange-600 hover:text-orange-700"
                  />
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(curriculum.id, curriculum.name)}
                    stopPropagation
                    icon={<Copy size={14} />}
                    tooltip="Duplicate Curriculum"
                    className="text-blue-600 hover:text-blue-700"
                  />
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(curriculum.id, curriculum.name)}
                    stopPropagation
                    icon={<Trash2 size={14} />}
                    tooltip="Delete Curriculum"
                    className="text-destructive hover:text-destructive"
                  />
                </div>
              )
            }
          ]}
          loading={loading}
          pagination={{
            currentPage: pagination?.page || 1,
            totalPages: pagination?.totalPages || 1,
            totalItems: pagination?.total || 0,
            itemsPerPage: pagination?.limit || 10,
            onPageChange: handlePageChange,
            onItemsPerPageChange: (newLimit) => {
              setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
              fetchCurricula(searchTerm, 1);
            }
          }}
          emptyState={{
            icon: <BookOpen size={48} />,
            title: searchTerm ? 'No curricula found' : 'No curricula yet',
            description: searchTerm 
              ? 'Try adjusting your search terms to find relevant curricula'
              : 'Create your first curriculum to get started with program management',
            action: !searchTerm ? {
              label: 'Create First Curriculum',
              onClick: () => router.push('/chairperson/create')
            } : undefined
          }}
          onRowClick={(curriculum) => router.push(`/chairperson/info_edit/${curriculum.id}`)}
        />
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ open, curriculumId: null, curriculumName: null })}
        title="Delete Curriculum"
        description={`Are you sure you want to delete the curriculum "${confirmDialog.curriculumName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />

      <Dialog 
        open={renameDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setRenameDialog({ open: false, curriculumId: null, currentName: '' });
            setNewCurriculumName('');
          }
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rename Curriculum</DialogTitle>
            <DialogDescription>
              Enter a new name for the curriculum. This will update the curriculum name across the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="curriculum-name">Curriculum Name</Label>
              <Input
                id="curriculum-name"
                value={newCurriculumName}
                onChange={(e) => setNewCurriculumName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleRenameConfirm();
                  }
                }}
                placeholder="Enter curriculum name"
                className="col-span-3"
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Current name: <span className="font-semibold">{renameDialog.currentName}</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialog({ open: false, curriculumId: null, currentName: '' });
                setNewCurriculumName('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameConfirm}
              disabled={!newCurriculumName.trim() || newCurriculumName === renameDialog.currentName}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChairpersonPage;
