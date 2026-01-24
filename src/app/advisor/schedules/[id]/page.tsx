'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Calendar, BookOpen, Users, Clock } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { getPublishedSchedule } from '@/lib/api/laravel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  year: number;
  section?: string;
  days?: string[];
  time?: string;
  instructor?: string;
  seatLimit?: number;
}

interface ScheduleDetails {
  id: string;
  name: string;
  semester: string;
  version: string;
  department?: string;
  batch?: string;
  createdAt: string;
  updatedAt: string;
  curriculum?: {
    id: string;
    name: string;
    year: string;
  };
  courses: Course[];
}

export default function AdvisorScheduleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { error: showError } = useToastHelpers();
  const [schedule, setSchedule] = useState<ScheduleDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [scheduleId, setScheduleId] = useState<string>('');

  useEffect(() => {
    const initializeParams = async () => {
      const resolvedParams = await params;
      setScheduleId(resolvedParams.id);
    };
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (!scheduleId) return;
    
    const fetchScheduleDetails = async () => {
      try {
        setLoading(true);
        const response = await getPublishedSchedule(scheduleId);
        
        // Transform API response to match component format
        const apiSchedule = response.schedule;
        const transformedSchedule: ScheduleDetails = {
          id: apiSchedule.id,
          name: apiSchedule.name,
          semester: apiSchedule.semester,
          version: apiSchedule.version?.toString() || '1.0',
          department: apiSchedule.department || '',
          batch: apiSchedule.batch || '',
          createdAt: apiSchedule.createdAt,
          updatedAt: apiSchedule.updatedAt,
          curriculum: apiSchedule.curriculumName ? {
            id: '',
            name: apiSchedule.curriculumName,
            year: apiSchedule.curriculumYear || ''
          } : undefined,
          courses: apiSchedule.courses.map((c: any) => ({
            id: c.course.id,
            code: c.course.code,
            name: c.course.title,
            credits: c.course.credits,
            semester: 1,
            year: 1,
            section: c.section,
            days: c.days,
            time: c.time,
            instructor: c.instructor,
            seatLimit: c.capacity
          }))
        };
        
        setSchedule(transformedSchedule);
      } catch (error) {
        console.error('Error fetching schedule details:', error);
        showError('Failed to fetch schedule details');
      } finally {
        setLoading(false);
      }
    };

    fetchScheduleDetails();
  }, [scheduleId, showError]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8 flex items-center justify-center">
        <LoadingSpinner text="Loading schedule details..." />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="container mx-auto max-w-7xl">
          <Button
            variant="ghost"
            onClick={() => router.push('/advisor/schedules')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedules
          </Button>
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Schedule not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/advisor/schedules')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Schedules
        </Button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">{schedule.name}</h1>
          <p className="text-muted-foreground">View Only - Schedule Details</p>
        </div>

        {/* Schedule Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Semester</p>
                  <p className="font-semibold">{schedule.semester}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Curriculum</p>
                  <p className="font-semibold">{schedule.curriculum?.name || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Batch</p>
                  <p className="font-semibold">{schedule.batch || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Version</p>
                  <p className="font-semibold">{schedule.version}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Courses ({schedule.courses.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Course Code</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Course Name</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Section</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Credits</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Schedule</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Instructor</th>
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">Seats</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.courses.map((course) => (
                    <tr key={course.id} className="border-b border-border hover:bg-muted/50">
                      <td className="p-3 font-mono text-sm">{course.code}</td>
                      <td className="p-3">{course.name}</td>
                      <td className="p-3 text-sm">{course.section || '-'}</td>
                      <td className="p-3">{course.credits}</td>
                      <td className="p-3 text-sm">
                        {course.days && course.days.length > 0 ? (
                          <>
                            <div className="font-medium">{course.days.join(', ')}</div>
                            <div className="text-muted-foreground">{course.time || 'TBA'}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">TBA</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">{course.instructor || 'TBA'}</td>
                      <td className="p-3 text-sm">{course.seatLimit || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card className="mt-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-2 text-sm text-muted-foreground">
              <p>Created: {formatDate(schedule.createdAt)}</p>
              <p>Last Updated: {formatDate(schedule.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
