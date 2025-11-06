'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Trash2, Info, Plus, BookOpen, Users, Calendar, Settings } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';

// Import chairperson components
import { PageHeader } from '@/components/chairperson/PageHeader';
import { SearchBar } from '@/components/chairperson/SearchBar';
import { DataTable } from '@/components/chairperson/DataTable';
import { LoadingSpinner } from '@/components/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/chairperson/EmptyState';
import { StatCard } from '@/components/chairperson/StatCard';
import { Pagination } from '@/components/chairperson/Pagination';
import { ActionButton } from '@/components/chairperson/ActionButton';

interface Curriculum {
  id: string;
  name: string;
  year: string;
  version: string;
  description?: string;
  startId: string;
  endId: string;
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

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ChairpersonPage: React.FC = () => {
  const { success, error: showError, warning, info } = useToastHelpers();
  const { data: session } = useSession();
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

  const fetchCurricula = async (search: string = '', page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '10',
      });

      const response = await fetch(`/api/curricula?${params}`);
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
    if (session?.user) {
      fetchCurricula();
    }
  }, [session]);

  const handleSearch = () => {
    fetchCurricula(searchTerm, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchCurricula(searchTerm, newPage);
  };

  const handleDeleteCurriculum = async (curriculumId: string, curriculumName: string) => {
    if (!confirm(`Are you sure you want to delete the curriculum "${curriculumName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/curricula/${curriculumId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the curricula list
        fetchCurricula(searchTerm, pagination.page);
        success(`Curriculum "${curriculumName}" has been deleted successfully.`);
      } else {
        const data = await response.json();
        showError(`Failed to delete curriculum: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      showError('An error occurred while deleting the curriculum. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const activeCurricula = curricula.filter(c => c.isActive).length;
  const totalCourses = curricula.reduce((sum, c) => sum + c._count.curriculumCourses, 0);

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Curricula"
            value={pagination.total}
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
          <StatCard
            title={`Page ${pagination.page}`}
            value={`${pagination.totalPages} Pages`}
            subtitle="Pagination info"
            icon={<Info size={20} />}
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
              {curricula.length} of {pagination.total} curricula
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
                  {formatDate(curriculum.updatedAt)}
                </span>
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              className: 'w-40',
              render: (curriculum: Curriculum) => (
                <div className="flex gap-2">
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(`/chairperson/info_edit/${curriculum.id}`)}
                    icon={<Info size={14} />}
                    tooltip="View Details"
                  />
                  <ActionButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteCurriculum(curriculum.id, curriculum.name)}
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
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            totalItems: pagination.total,
            itemsPerPage: pagination.limit,
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
    </div>
  );
};

export default ChairpersonPage;
