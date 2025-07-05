'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaTrash, FaInfoCircle, FaSearch } from 'react-icons/fa';

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

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const ChairpersonPage: React.FC = () => {
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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
        alert(`Curriculum "${curriculumName}" has been deleted successfully.`);
      } else {
        const data = await response.json();
        alert(`Failed to delete curriculum: ${data.error?.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      alert('An error occurred while deleting the curriculum. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Curriculum Management
            </h1>
            <p className="text-muted-foreground">
              Manage and organize your academic curricula
            </p>
          </div>
          <button
            onClick={() => router.push('/chairperson/create')}
            className="mt-4 sm:mt-0 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            + Create New Curriculum
          </button>
        </div>

        {/* Search and Stats */}
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search curricula by name, year, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground"
                >
                  <FaSearch size={16} />
                </button>
              </div>
            </form>

            {/* Quick Stats */}
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg text-foreground">
                  {pagination.total}
                </div>
                <div className="text-muted-foreground">Total Curricula</div>
              </div>
            </div>
          </div>
        </div>

        {/* Curricula List */}
        <div className="bg-card rounded-xl border border-border">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading curricula...</p>
            </div>
          ) : curricula.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {searchTerm ? 'No curricula found' : 'No curricula yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? 'Try adjusting your search terms'
                  : 'Create your first curriculum to get started'}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/chairperson/create')}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Create First Curriculum
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="hidden lg:grid lg:grid-cols-8 gap-4 p-4 border-b border-border font-medium text-sm text-muted-foreground">
                <div className="col-span-3">Curriculum</div>
                <div className="col-span-2">Courses</div>
                <div className="col-span-2">Last Updated</div>
                <div className="col-span-1">Actions</div>
              </div>

              {/* Curricula Items */}
              <div className="divide-y divide-border">
                {curricula.map((curriculum) => (
                  <div
                    key={curriculum.id}
                    className="p-4 lg:grid lg:grid-cols-8 gap-4 lg:items-center hover:bg-muted/50 transition-colors"
                  >
                    {/* Curriculum Info */}
                    <div className="col-span-3 mb-3 lg:mb-0">
                      <h3 className="font-semibold text-foreground text-lg">
                        {curriculum.name}
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {curriculum.year} • v{curriculum.version}
                      </div>
                      {curriculum.description && (
                        <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {curriculum.description}
                        </div>
                      )}
                    </div>

                    {/* Course Count */}
                    <div className="col-span-2 mb-3 lg:mb-0">
                      <div className="font-medium text-foreground">
                        {curriculum._count.curriculumCourses} courses
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {curriculum._count.curriculumConstraints} constraints,{' '}
                        {curriculum._count.electiveRules} rules
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="col-span-2 mb-3 lg:mb-0">
                      <div className="text-sm text-muted-foreground">
                        {formatDate(curriculum.updatedAt)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex gap-2">
                      <button
                        onClick={() =>
                          router.push(`/chairperson/info_edit/${curriculum.id}`)
                        }
                        className="p-2 text-primary hover:text-primary/80 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                        title="View Curriculum Info"
                      >
                        <FaInfoCircle size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCurriculum(curriculum.id, curriculum.name)}
                        className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 dark:hover:bg-destructive/20 rounded-lg transition-colors"
                        title="Delete Curriculum"
                      >
                        <FaTrash size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{' '}
                      of {pagination.total} curricula
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from(
                        { length: pagination.totalPages },
                        (_, i) => i + 1
                      ).map((page) => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted/50 ${
                            page === pagination.page
                              ? 'bg-primary text-primary-foreground'
                              : ''
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChairpersonPage;
