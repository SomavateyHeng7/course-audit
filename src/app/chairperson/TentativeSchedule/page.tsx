'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, BookOpen, Users, Clock, Search, ArrowLeft, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { getTentativeSchedules, togglePublishTentativeSchedule, deleteTentativeSchedule } from '@/lib/api/laravel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  isPublished?: boolean;
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState<TentativeSchedule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [scheduleToPublish, setScheduleToPublish] = useState<TentativeSchedule | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  // Fetch schedules from database via API
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      
      // Fetch from database via API
      const response = await getTentativeSchedules({ limit: 100 });
      setSchedules(response.schedules || []);
      
    } catch (error) {
      console.error('Error fetching schedules:', error);
      showError('Failed to fetch tentative schedules');
      // Fallback to localStorage if API fails
      try {
        const savedVersions = localStorage.getItem('tentativeScheduleVersions');
        if (savedVersions) {
          const versions = JSON.parse(savedVersions);
          const loadedSchedules: TentativeSchedule[] = versions.map((schedule: any) => ({
            id: schedule.id || '',
            name: schedule.name || '',
            semester: schedule.semester || '',
            version: schedule.version || '1.0',
            department: schedule.department || '',
            batch: schedule.batch || '',
            coursesCount: schedule.courses?.length || 0,
            createdAt: schedule.createdAt || new Date().toISOString(),
            updatedAt: schedule.updatedAt || new Date().toISOString(),
            curriculum: schedule.curriculumName ? {
              id: schedule.curriculumId || '',
              name: schedule.curriculumName,
              year: schedule.curriculumName.match(/\d{4}/)?.[0] || ''
            } : undefined
          }));
          setSchedules(loadedSchedules);
        }
      } catch (localStorageError) {
        console.error('Error reading localStorage:', localStorageError);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
    
    // Refetch schedules when page becomes visible (e.g., after creating a schedule)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSchedules();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also refetch when window gains focus
    const handleFocus = () => {
      fetchSchedules();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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

  const handleTogglePublishClick = (schedule: TentativeSchedule, e: React.MouseEvent) => {
    e.stopPropagation();
    setScheduleToPublish(schedule);
    setPublishDialogOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!scheduleToPublish) return;

    setIsPublishing(true);
    try {
      const response = await togglePublishTentativeSchedule(scheduleToPublish.id);
      
      // Update local state
      setSchedules(prevSchedules => 
        prevSchedules.map(schedule => 
          schedule.id === scheduleToPublish.id 
            ? { ...schedule, isPublished: response.schedule.isPublished }
            : schedule
        )
      );
      
      success(response.message);
      
      // Close dialog
      setPublishDialogOpen(false);
      setScheduleToPublish(null);
    } catch (error) {
      console.error('Error toggling publish status:', error);
      showError('Failed to update publish status');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDeleteClick = (schedule: TentativeSchedule, e: React.MouseEvent) => {
    e.stopPropagation();
    setScheduleToDelete(schedule);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!scheduleToDelete) return;

    setIsDeleting(true);
    try {
      await deleteTentativeSchedule(scheduleToDelete.id);
      success(`Schedule "${scheduleToDelete.name}" deleted successfully`);
      
      // Remove from local state
      setSchedules(schedules.filter(s => s.id !== scheduleToDelete.id));
      
      // Close dialog
      setDeleteDialogOpen(false);
      setScheduleToDelete(null);
    } catch (error) {
      console.error('Error deleting schedule:', error);
      showError('Failed to delete schedule. Please try again.');
    } finally {
      setIsDeleting(false);
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
              Tentative Schedules
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
                <LoadingSpinner text="Loading schedules..." />
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
                <div className="hidden lg:grid lg:grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_1fr_1.5fr] gap-4 p-4 border-b border-border font-medium text-sm text-muted-foreground">
                  <div>Schedule Name</div>
                  <div>Semester</div>
                  <div>Curriculum/Batch</div>
                  <div>Courses</div>
                  <div>Status</div>
                  <div>Last Updated</div>
                  <div>Actions</div>
                </div>

                {/* Schedule Items */}
                <div className="divide-y divide-border">
                  {filteredSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className="p-4 lg:grid lg:grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_1fr_1.5fr] gap-4 lg:items-center hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => handleViewSchedule(schedule.id)}
                    >
                      {/* Schedule Info */}
                      <div className="mb-3 lg:mb-0">
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
                            {schedule.coursesCount}
                          </span>
                        </div>
                      </div>

                      {/* Publish Status */}
                      <div className="mb-2 lg:mb-0">
                        <Badge 
                          variant={schedule.isPublished ? "default" : "secondary"}
                          className="gap-1 whitespace-nowrap"
                        >
                          {schedule.isPublished ? (
                            <>
                              <Eye className="w-3 h-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Draft
                            </>
                          )}
                        </Badge>
                      </div>

                      {/* Last Updated */}
                      <div className="mb-3 lg:mb-0">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatDate(schedule.updatedAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant={schedule.isPublished ? "outline" : "default"}
                          onClick={(e) => handleTogglePublishClick(schedule, e)}
                          className="gap-1 whitespace-nowrap flex-shrink-0"
                        >
                          {schedule.isPublished ? (
                            <>
                              <EyeOff className="w-3 h-3" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3" />
                              Publish
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewSchedule(schedule.id);
                          }}
                          className="whitespace-nowrap flex-shrink-0"
                        >
                          View
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => handleDeleteClick(schedule, e)}
                          className="gap-1 whitespace-nowrap flex-shrink-0"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
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

      {/* Publish/Unpublish Confirmation Dialog */}
      <Dialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scheduleToPublish?.isPublished ? 'Unpublish' : 'Publish'} Schedule
            </DialogTitle>
            <DialogDescription>
              {scheduleToPublish?.isPublished ? (
                <>
                  Are you sure you want to unpublish "{scheduleToPublish?.name}"?
                  <br /><br />
                  This will remove the schedule from the student and advisor view pages.
                </>
              ) : (
                <>
                  Are you sure you want to publish "{scheduleToPublish?.name}"?
                  <br /><br />
                  Once published, this schedule will be visible to students and advisors.
                  They will be able to view it at:
                  <br />• Student view: /student/SemesterCourse
                  <br />• Advisor view: /advisor/schedules
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPublishDialogOpen(false)}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              variant={scheduleToPublish?.isPublished ? "outline" : "default"}
              onClick={handleConfirmPublish}
              disabled={isPublishing}
            >
              {isPublishing ? 'Processing...' : scheduleToPublish?.isPublished ? 'Unpublish' : 'Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the schedule "{scheduleToDelete?.name}"?
              This action cannot be undone and will permanently remove the schedule and all its courses.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Schedule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TentativeSchedulePage;