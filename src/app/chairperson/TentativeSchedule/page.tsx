'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, BookOpen, Users, Clock, Search, ArrowLeft, Eye, EyeOff, Trash2, CheckCircle2, MoreVertical } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { getTentativeSchedules, togglePublishTentativeSchedule, toggleActiveTentativeSchedule, deleteTentativeSchedule } from '@/lib/api/laravel';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  isActive?: boolean;
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
  const [activeDialogOpen, setActiveDialogOpen] = useState(false);
  const [scheduleToActivate, setScheduleToActivate] = useState<TentativeSchedule | null>(null);
  const [isActivating, setIsActivating] = useState(false);

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

  const handleToggleActiveClick = (schedule: TentativeSchedule, e: React.MouseEvent) => {
    e.stopPropagation();
    setScheduleToActivate(schedule);
    setActiveDialogOpen(true);
  };

  const handleConfirmActive = async () => {
    if (!scheduleToActivate) return;

    setIsActivating(true);
    try {
      const response = await toggleActiveTentativeSchedule(scheduleToActivate.id);
      
      // Update local state - deactivate all others, activate this one
      setSchedules(prevSchedules => 
        prevSchedules.map(schedule => ({
          ...schedule,
          isActive: schedule.id === scheduleToActivate.id ? response.schedule.isActive : false
        }))
      );
      
      success(response.message);
      
      // Close dialog
      setActiveDialogOpen(false);
      setScheduleToActivate(null);
    } catch (error) {
      console.error('Error toggling active status:', error);
      showError('Failed to update active status');
    } finally {
      setIsActivating(false);
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
    <div className="container mx-auto max-w-7xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tentative Schedules
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage and create tentative course schedules for different batches and semesters
          </p>
        </div>
        <Button
          onClick={handleCreateSchedule}
          className="shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New Schedule
        </Button>
      </div>

      {/* Info Tip */}
      <div className="text-sm text-muted-foreground flex items-start gap-2 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
        <div className="mt-0.5">💡</div>
        <span><strong>Tip:</strong> Publish makes schedules visible to students. Use "Set Active" to make one the default for student planning.</span>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-9"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              Total Schedules: <span className="font-semibold text-foreground">{schedules.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedules List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5" />
            All Schedules
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner text="Loading schedules..." />
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="p-6">
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
            </div>
          ) : (
            <div>
              {/* Table Header */}
              <div className="hidden lg:grid lg:grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_1fr_1.5fr] gap-4 px-4 py-3 border-b border-border font-medium text-xs text-muted-foreground bg-muted/30">
                <div>Schedule Name</div>
                <div>Semester</div>
                <div>Curriculum/Batch</div>
                <div className="text-center">Courses</div>
                <div>Status</div>
                <div>Last Updated</div>
                <div className="text-right">Actions</div>
              </div>

              {/* Schedule Items */}
              <div className="divide-y divide-border">
                {filteredSchedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="p-4 lg:grid lg:grid-cols-[2fr_1fr_1.5fr_0.8fr_1fr_1fr_1.5fr] gap-4 lg:items-center hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleViewSchedule(schedule.id)}
                  >
                    {/* Schedule Info */}
                    <div className="mb-3 lg:mb-0">
                      <h3 className="font-semibold text-foreground">
                        {schedule.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Version {schedule.version} • {formatDate(schedule.createdAt)}
                      </p>
                    </div>

                    {/* Semester */}
                    <div className="mb-2 lg:mb-0">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground lg:hidden" />
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
                        <div className="text-xs text-muted-foreground">
                          Batch: {schedule.batch || 'N/A'}
                        </div>
                      </div>
                    </div>

                    {/* Courses Count */}
                    <div className="mb-2 lg:mb-0">
                      <div className="flex items-center gap-2 lg:justify-center">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground font-medium">
                          {schedule.coursesCount}
                        </span>
                      </div>
                    </div>

                    {/* Publish Status */}
                    <div className="mb-2 lg:mb-0">
                      <div className="flex flex-wrap gap-1.5">
                        <Badge 
                          variant={schedule.isPublished ? "default" : "secondary"}
                          className="gap-1 whitespace-nowrap text-xs"
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
                        {schedule.isActive && (
                          <Badge 
                            variant="outline"
                            className="gap-1 whitespace-nowrap text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Active
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="mb-3 lg:mb-0">
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(schedule.updatedAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 items-center lg:justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSchedule(schedule.id);
                        }}
                        className="gap-1.5 h-8 px-3 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            className="h-8 w-8 p-0"
                          >
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePublishClick(schedule, e as any);
                              }}
                              className="gap-2"
                            >
                              {schedule.isPublished ? (
                                <>
                                  <EyeOff className="w-4 h-4" />
                                  <span>Unpublish</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-4 h-4" />
                                  <span>Publish</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            {schedule.isPublished && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActiveClick(schedule, e as any);
                                }}
                                className="gap-2"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>{schedule.isActive ? 'Deactivate' : 'Set Active'}</span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(schedule, e as any);
                              }}
                              className="gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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

      {/* Active Status Confirmation Dialog */}
      <Dialog open={activeDialogOpen} onOpenChange={setActiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {scheduleToActivate?.isActive ? 'Deactivate' : 'Set as Active'} Schedule
            </DialogTitle>
            <DialogDescription>
              {scheduleToActivate?.isActive ? (
                <>
                  Are you sure you want to deactivate "{scheduleToActivate?.name}"?
                  <br /><br />
                  Students will no longer see this as the active schedule for planning.
                </>
              ) : (
                <>
                  Are you sure you want to set "{scheduleToActivate?.name}" as the active schedule?
                  <br /><br />
                  <strong>Note:</strong> Only one schedule can be active per department. 
                  All other active schedules in this department will be automatically deactivated.
                  <br /><br />
                  Students will use this schedule for course planning.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setActiveDialogOpen(false)}
              disabled={isActivating}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleConfirmActive}
              disabled={isActivating}
            >
              {isActivating ? 'Processing...' : scheduleToActivate?.isActive ? 'Deactivate' : 'Set Active'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TentativeSchedulePage;