'use client';

import React, { useState, useEffect } from "react";
import { useAuth } from '@/contexts/SanctumAuthContext';
import { useRouter } from "next/navigation";
import { Plus } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { API_BASE } from '@/lib/api/laravel';
import { getCsrfCookie, getCsrfTokenFromCookie } from '@/lib/auth/sanctum';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PageHeader } from '@/components/role-specific/chairperson/PageHeader';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { CurriculumStats } from '@/components/role-specific/chairperson/management/CurriculumStats';
import { CurriculumSearchPanel } from '@/components/role-specific/chairperson/management/CurriculumSearchPanel';
import { CurriculumTable } from '@/components/role-specific/chairperson/management/CurriculumTable';
import { RenameDialog } from '@/components/role-specific/chairperson/management/RenameDialog';
import { Curriculum, PaginationInfo } from '@/components/role-specific/chairperson/management/types';

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

  const [editingCurriculumId, setEditingCurriculumId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState<string>('');
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<Curriculum | null>(null);

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
  // Backend integration point: the PUT below wires the rename UI to the existing
  // curriculum endpoint. Adjust the payload or URL here if the rename contract changes.
  const handleUpdateName = async (curriculumId: string, newName: string) => {
    if (!newName.trim()) {
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
        body: JSON.stringify({ name: newName })
      });

      if (response.ok) {
        // Refresh the curricula list
        fetchCurricula(searchTerm, pagination.page);
        success(`Curriculum name updated successfully.`);
        setEditingCurriculumId(null);
        setEditedName('');
        setRenameModalOpen(false);
        setRenameTarget(null);
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

  const handleStartEdit = (curriculum: Curriculum) => {
    setEditingCurriculumId(curriculum.id);
    setEditedName(curriculum.name);
    setRenameTarget(curriculum);
    setRenameModalOpen(true);
  };

  const handleCancelEdit = () => {
    setEditingCurriculumId(null);
    setEditedName('');
    setRenameModalOpen(false);
    setRenameTarget(null);
  };
  const activeCurricula = curricula.filter(c => c.isActive).length;
  const totalCourses = curricula.reduce((sum, c) => sum + c._count.curriculumCourses, 0);
  const trimmedEditedName = editedName.trim();
  const isRenameDisabled = !trimmedEditedName || trimmedEditedName === renameTarget?.name?.trim();

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

        <CurriculumStats
          totalCurricula={pagination?.total || 0}
          activeCurricula={activeCurricula}
          totalCourses={totalCourses}
        />

        <CurriculumSearchPanel
          value={searchTerm}
          onChange={setSearchTerm}
          onSearch={handleSearch}
          totalCurricula={pagination?.total || 0}
          visibleCount={curricula.length}
        />

        <CurriculumTable
          data={curricula}
          pagination={pagination}
          loading={loading}
          searchTerm={searchTerm}
          editingCurriculumId={editingCurriculumId}
          renameModalOpen={renameModalOpen}
          onRename={handleStartEdit}
          onViewDetails={(curriculum) => router.push(`/chairperson/info_edit/${curriculum.id}`)}
          onDuplicate={(curriculum) => handleDuplicate(curriculum.id, curriculum.name)}
          onDelete={(curriculum) => handleDeleteClick(curriculum.id, curriculum.name)}
          onPageChange={handlePageChange}
          onItemsPerPageChange={(newLimit) => {
            setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
            fetchCurricula(searchTerm, 1);
          }}
          onRowClick={(curriculum) => router.push(`/chairperson/info_edit/${curriculum.id}`)}
          onCreateFirstCurriculum={() => router.push('/chairperson/create')}
        />
      </div>

      <RenameDialog
        open={renameModalOpen}
        curriculum={renameTarget}
        editedName={editedName}
        isSaveDisabled={isRenameDisabled || !editingCurriculumId}
        onChange={setEditedName}
        onSave={() => editingCurriculumId && handleUpdateName(editingCurriculumId, editedName)}
        onCancel={handleCancelEdit}
      />

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
    </div>
  );
};

export default ChairpersonPage;