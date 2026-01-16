'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Calendar, GraduationCap } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { API_BASE } from '@/lib/api/laravel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/role-specific/chairperson/EmptyState';

interface Curriculum {
  id: string;
  name: string;
  year: string;
  totalCredits: number;
  studentIdStart: string;
  studentIdEnd: string;
  departmentName?: string;
  facultyName?: string;
  courseCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const AdvisorCurriculaPage: React.FC = () => {
  const { error: showError } = useToastHelpers();
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

      const response = await fetch(`${API_BASE}/curricula?${params}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (response.ok) {
        setCurricula(data.curricula);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch curricula:', data.error);
        showError('Failed to load curricula');
      }
    } catch (error) {
      console.error('Error fetching curricula:', error);
      showError('Error loading curricula');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurricula();
  }, []);

  const handleSearch = () => {
    fetchCurricula(searchTerm, 1);
  };

  const handlePageChange = (newPage: number) => {
    fetchCurricula(searchTerm, newPage);
  };

  const handleViewCurriculum = (curriculumId: string) => {
    router.push(`/advisor/curricula/${curriculumId}`);
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
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            View Curricula
          </h1>
          <p className="text-muted-foreground">
            Browse and view curriculum information created by chairpersons
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search by name, year, or student ID range..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch}>
                Search
              </Button>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Total Curricula: {pagination.total}
            </div>
          </CardContent>
        </Card>

        {/* Curricula List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              All Curricula (View Only)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <LoadingSpinner text="Loading curricula..." />
            ) : curricula.length === 0 ? (
              <EmptyState
                icon={<BookOpen size={32} />}
                title={searchTerm ? 'No curricula found' : 'No curricula available'}
                description={
                  searchTerm
                    ? 'Try adjusting your search terms'
                    : 'No curricula have been created yet'
                }
              />
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="hidden lg:grid lg:grid-cols-7 gap-4 p-4 border-b border-border font-medium text-sm text-muted-foreground">
                  <div className="col-span-2">Curriculum Name</div>
                  <div>Year</div>
                  <div>Student ID Range</div>
                  <div>Total Credits</div>
                  <div>Courses</div>
                  <div>Actions</div>
                </div>

                {/* Curriculum Items */}
                <div className="divide-y divide-border">
                  {curricula.map((curriculum) => (
                    <div
                      key={curriculum.id}
                      className="p-4 lg:grid lg:grid-cols-7 gap-4 lg:items-center hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewCurriculum(curriculum.id)}
                    >
                      {/* Name */}
                      <div className="col-span-2 mb-3 lg:mb-0">
                        <h3 className="font-semibold text-foreground text-lg">
                          {curriculum.name}
                        </h3>
                        {curriculum.departmentName && (
                          <p className="text-sm text-muted-foreground">
                            {curriculum.departmentName}
                          </p>
                        )}
                      </div>

                      {/* Year */}
                      <div className="mb-2 lg:mb-0">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {curriculum.year}
                          </span>
                        </div>
                      </div>

                      {/* Student ID Range */}
                      <div className="mb-2 lg:mb-0">
                        <div className="text-sm">
                          <div className="font-mono text-foreground">
                            {curriculum.studentIdStart} - {curriculum.studentIdEnd}
                          </div>
                        </div>
                      </div>

                      {/* Total Credits */}
                      <div className="mb-2 lg:mb-0">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {curriculum.totalCredits} credits
                          </span>
                        </div>
                      </div>

                      {/* Course Count */}
                      <div className="mb-3 lg:mb-0">
                        <span className="text-sm text-muted-foreground">
                          {curriculum.courseCount} courses
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewCurriculum(curriculum.id);
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvisorCurriculaPage;
