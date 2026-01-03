'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, BookOpen, Users, Clock, Search, ArrowLeft } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/role-specific/chairperson/PageHeader';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/role-specific/chairperson/EmptyState';

interface TentativeSchedule {
  id: string;
  name: string;
  semester: string;
  version: string;
  department?: string;
  batch?: string;
  coursesCount: number;
  createdAt: string;
  updatedAt: string;
  curriculum?: {
    id: string;
    name: string;
    year: string;
  };
}

const TentativeSchedulePage: React.FC = () => {
  const router = useRouter();
  const { success, error: showError } = useToastHelpers();
  const [schedules, setSchedules] = useState<TentativeSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for now - replace with actual API call
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      // For now, using mock data. Replace with actual API call
      const mockSchedules: TentativeSchedule[] = [
        {
          id: '1',
          name: 'Fall 2024 Schedule',
          semester: 'Fall 2024',
          version: '1.0',
          department: 'Computer Science',
          batch: '2022-2026',
          coursesCount: 25,
          createdAt: '2024-01-15',
          updatedAt: '2024-01-20',
          curriculum: {
            id: 'curr-1',
            name: 'Computer Science 2022',
            year: '2022'
          }
        },
        {
          id: '2',
          name: 'Spring 2024 Schedule',
          semester: 'Spring 2024',
          version: '2.1',
          department: 'Computer Science',
          batch: '2021-2025',
          coursesCount: 30,
          createdAt: '2024-02-01',
          updatedAt: '2024-02-10',
          curriculum: {
            id: 'curr-2',
            name: 'Computer Science 2021',
            year: '2021'
          }
        }
      ];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      setSchedules(mockSchedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      showError('Failed to fetch tentative schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const filteredSchedules = schedules.filter(schedule =>
    schedule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.semester.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.batch?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateSchedule = () => {
    router.push('/chairperson/TentativeSchedule/create_schedule');
  };

  const handleViewSchedule = (scheduleId: string) => {
    // Navigate to schedule details page (to be implemented)
    router.push(`/chairperson/TentativeSchedule/${scheduleId}`);
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
              Tntative Schedules
            </h1>
            <p className="text-muted-foreground">
              Manage and create tentative course schedules for different batches and semesters
            </p>
          </div>
          <Button
            onClick={handleCreateSchedule}
            className="mt-4 sm:mt-0 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Schedule
          </Button>
        </div>

        {/* Search and Stats */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search schedules..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="text-sm text-muted-foreground">
                Total Schedules: {schedules.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Schedules List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
                <span className="ml-2 text-muted-foreground">Loading schedules...</span>
              </div>
            ) : filteredSchedules.length === 0 ? (
              <EmptyState
                icon={<Calendar size={32} />}
                title={searchTerm ? 'No schedules found' : 'No tentative schedules yet'}
                description={
                  searchTerm
                    ? 'Try adjusting your search terms'
                    : 'Create your first tentative schedule to get started'
                }
                action={!searchTerm ? { label: 'Create New Schedule', onClick: handleCreateSchedule } : undefined}

              />
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="hidden lg:grid lg:grid-cols-7 gap-4 p-4 border-b border-border font-medium text-sm text-muted-foreground">
                  <div className="col-span-2">Schedule Name</div>
                  <div>Semester</div>
                  <div>Curriculum/Batch</div>
                  <div>Courses</div>
                  <div>Last Updated</div>
                  <div>Actions</div>
                </div>

                {/* Schedule Items */}
                <div className="divide-y divide-border">
                  {filteredSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-4 lg:grid lg:grid-cols-7 gap-4 lg:items-center hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewSchedule(schedule.id)}
                    >
                      {/* Schedule Info */}
                      <div className="col-span-2 mb-3 lg:mb-0">
                        <h3 className="font-semibold text-foreground text-lg">
                          {schedule.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Version {schedule.version}
                        </p>
                      </div>

                      {/* Semester */}
                      <div className="mb-2 lg:mb-0">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {schedule.semester}
                          </span>
                        </div>
                      </div>

                      {/* Curriculum/Batch */}
                      <div className="mb-2 lg:mb-0">
                        <div className="text-sm">
                          <div className="font-medium text-foreground">
                            {schedule.curriculum?.name || 'N/A'}
                          </div>
                          <div className="text-muted-foreground">
                            Batch: {schedule.batch || 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Courses Count */}
                      <div className="mb-2 lg:mb-0">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {schedule.coursesCount} courses
                          </span>
                        </div>
                      </div>

                      {/* Last Updated */}
                      <div className="mb-3 lg:mb-0">
                        <span className="text-sm text-muted-foreground">
                          {formatDate(schedule.updatedAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSchedule(schedule.id);
                          }}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TentativeSchedulePage;