'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Clock, 
  Users, 
  MapPin,
  ArrowLeft,
  Calendar,
  Edit,
  Download,
  Printer,
  Grid3x3,
  List,
  User
} from 'lucide-react';

import { PageHeader } from '@/components/role-specific/chairperson/PageHeader';
import { DataTable } from '@/components/role-specific/chairperson/DataTable';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { StatCard } from '@/components/role-specific/chairperson/StatCard';
import { getTentativeSchedule } from '@/lib/api/laravel';

interface ScheduleCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  section?: string;
  days?: string[];
  time?: string;
  instructor?: string;
  seatLimit?: number;
  category?: string;
}

interface ScheduleData {
  id: string;
  name: string;
  semester: string;
  version: string;
  department?: string;
  batch?: string;
  curriculumId?: string;
  curriculumName?: string;
  courses: ScheduleCourse[];
  createdAt?: string;
  updatedAt?: string;
}

const ViewSchedulePage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const scheduleId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState<ScheduleData | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  useEffect(() => {
    fetchSchedule();
  }, [scheduleId]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      // Fetch from API
      const response = await getTentativeSchedule(scheduleId);
      const apiSchedule = response.schedule;
      
      // Transform the data to match component format
      const transformedSchedule: ScheduleData = {
        id: apiSchedule.id,
        name: apiSchedule.name,
        semester: apiSchedule.semester,
        version: apiSchedule.version.toString(),
        department: apiSchedule.department || '',
        batch: apiSchedule.batch || '',
        curriculumId: apiSchedule.curriculum?.id || '',
        curriculumName: apiSchedule.curriculum?.name || '',
        courses: apiSchedule.courses.map((sc: any) => ({
          id: sc.courseId || sc.id || sc.course?.id || '',
          code: sc.code || sc.course?.code || '',
          name: sc.name || sc.course?.name || '',
          credits: sc.credits || sc.course?.credits || 0,
          section: sc.section,
          days: sc.days,
          time: sc.time,
          instructor: sc.instructor,
          seatLimit: sc.seatLimit || sc.seat_limit,
        })),
        createdAt: apiSchedule.createdAt,
        updatedAt: apiSchedule.updatedAt,
      };
      
      setSchedule(transformedSchedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Calendar view helpers ──
  const courseColors = [
    'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100',
    'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-900 dark:text-green-100',
    'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100',
    'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100',
    'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100',
    'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-900 dark:text-pink-100',
    'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700 text-cyan-900 dark:text-cyan-100',
    'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100',
  ];

  const getDayName = (abbr: string): string => {
    const map: Record<string, string> = {
      M: 'Monday', T: 'Tuesday', W: 'Wednesday', Th: 'Thursday',
      F: 'Friday', S: 'Saturday', Su: 'Sunday',
      Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
      Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
    };
    return map[abbr] || abbr;
  };

  const buildCalendarSchedule = () => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const calendarMap: Record<string, { course: ScheduleCourse; color: string; start: string; end: string }[]> = {};
    days.forEach(d => (calendarMap[d] = []));

    schedule?.courses.forEach((course, idx) => {
      if (course.days && course.days.length > 0) {
        course.days.forEach(d => {
          const full = getDayName(d);
          if (calendarMap[full]) {
            const [start, end] = course.time
              ? course.time.split('-').map(t => t.trim().replace(/\s*(AM|PM)\s*/i, ''))
              : ['', ''];
            calendarMap[full].push({ course, color: courseColors[idx % courseColors.length], start, end });
          }
        });
      }
    });

    // Sort each day by start time
    Object.keys(calendarMap).forEach(day => {
      calendarMap[day].sort((a, b) => {
        const at = parseInt(a.start.replace(':', '') || '0');
        const bt = parseInt(b.start.replace(':', '') || '0');
        return at - bt;
      });
    });

    // Remove Saturday if empty
    if (calendarMap['Saturday']?.length === 0) delete calendarMap['Saturday'];

    return calendarMap;
  };

  const courseColumns = [
    {
      key: 'code',
      label: 'Course Code',
      className: 'w-28',
      render: (course: ScheduleCourse) => (
        <div>
          <div className="font-semibold">{course.code}</div>
          <div className="lg:hidden text-sm text-muted-foreground">
            {course.credits} credits
          </div>
        </div>
      )
    },
    {
      key: 'name',
      label: 'Course Name',
      className: 'flex-1',
      render: (course: ScheduleCourse) => (
        <div>
          <div className="font-medium">{course.name}</div>
        </div>
      )
    },
    {
      key: 'section',
      label: 'Section',
      className: 'w-24',
      hideOnMobile: true,
      render: (course: ScheduleCourse) => (
        <span className="text-sm">{course.section || '-'}</span>
      )
    },
    {
      key: 'credits',
      label: 'Credits',
      className: 'w-20',
      hideOnMobile: true,
      render: (course: ScheduleCourse) => (
        <Badge variant="outline">{course.credits}</Badge>
      )
    },
    {
      key: 'schedule',
      label: 'Schedule',
      className: 'w-40',
      render: (course: ScheduleCourse) => (
        <div className="text-sm">
          {course.days && course.days.length > 0 ? (
            <>
              <div className="font-medium">{course.days.join(', ')}</div>
              <div className="text-muted-foreground">{course.time || 'TBA'}</div>
            </>
          ) : (
            <span className="text-muted-foreground">TBA</span>
          )}
        </div>
      )
    },
    {
      key: 'instructor',
      label: 'Instructor',
      className: 'w-32',
      hideOnMobile: true,
      render: (course: ScheduleCourse) => (
        <span className="text-sm">{course.instructor || 'TBA'}</span>
      )
    },
    {
      key: 'seats',
      label: 'Seats',
      className: 'w-20',
      hideOnMobile: true,
      render: (course: ScheduleCourse) => (
        <span className="text-sm">{course.seatLimit || '-'}</span>
      )
    }
  ];

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalCredits = schedule?.courses.reduce((sum, c) => sum + c.credits, 0) || 0;
  const coreCount = schedule?.courses.filter(c => c.category === 'Core').length || 0;
  const electiveCount = schedule?.courses.filter(c => c.category === 'Elective' || c.category !== 'Core').length || 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!schedule) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto max-w-7xl text-center">
          <h1 className="text-2xl font-bold mb-4">Schedule Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested schedule could not be found.</p>
          <Button onClick={() => router.push('/chairperson/TentativeSchedule')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedules
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title={schedule.name}
          description={`${schedule.semester} • Version ${schedule.version}`}
          backButton={{
            label: "Back to Schedules",
            onClick: () => router.push('/chairperson/TentativeSchedule')
          }}
          actions={[
            {
              label: "Edit Schedule",
              onClick: () => router.push(`/chairperson/TentativeSchedule/create_schedule?id=${params.id}`),
              icon: <Edit size={16} />
            }
          ]}
        />

        {/* View Mode Toggle */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            onClick={() => setViewMode('table')}
            size="sm"
          >
            <List className="w-4 h-4 mr-2" />
            Table View
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            size="sm"
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Schedule View
          </Button>
        </div>

        {/* Schedule Info Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Curriculum</div>
                <div className="font-medium">{schedule.curriculumName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Department</div>
                <div className="font-medium">{schedule.department || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Batch</div>
                <div className="font-medium">{schedule.batch || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Last Updated</div>
                <div className="font-medium">{formatDate(schedule.updatedAt)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
          <StatCard
            title="Total Courses"
            value={schedule.courses.length}
            subtitle="In this schedule"
            icon={<BookOpen size={20} />}
          />
          <StatCard
            title="Total Credits"
            value={totalCredits}
            subtitle="Credit hours"
            icon={<Calendar size={20} />}
          />
        </div>

        {/* Courses Table / Calendar View */}
        {viewMode === 'table' ? (
          <DataTable
            data={schedule.courses}
            columns={courseColumns}
            loading={false}
            emptyState={{
              icon: <BookOpen size={48} />,
              title: "No courses in this schedule",
              description: "This schedule doesn't have any courses yet",
              action: {
                label: "Edit Schedule",
                onClick: () => router.push('/chairperson/TentativeSchedule/create_schedule')
              }
            }}
            cardMode={true}
          />
        ) : (
          /* Calendar / Schedule View */
          (() => {
            const calendarData = buildCalendarSchedule();
            const dayKeys = Object.keys(calendarData);
            const hasScheduledCourses = dayKeys.some(d => calendarData[d].length > 0);

            if (!hasScheduledCourses) {
              return (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center space-y-3">
                      <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">No Scheduled Courses</h3>
                      <p className="text-muted-foreground text-sm">
                        Courses in this schedule don&apos;t have day/time assignments yet.<br />
                        Switch to Table View to see all courses, or edit the schedule to add time slots.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            return (
              <div className="space-y-4">
                {/* Legend - color for each course */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap gap-3">
                      {schedule.courses.map((course, idx) => (
                        <div key={course.id} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-sm border-2 ${courseColors[idx % courseColors.length]}`} />
                          <span className="text-xs text-muted-foreground font-medium">{course.code}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Day Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                  {dayKeys.map(day => (
                    <Card key={day} className="min-h-[200px]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-semibold">{day}</CardTitle>
                        <CardDescription className="text-xs">
                          {calendarData[day].length} {calendarData[day].length === 1 ? 'class' : 'classes'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {calendarData[day].length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No classes</p>
                        ) : (
                          calendarData[day].map((slot, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border-2 ${slot.color}`}
                            >
                              <div className="text-sm font-bold">{slot.course.code}</div>
                              <div className="text-xs mt-0.5 opacity-80">{slot.course.name}</div>
                              {(slot.start || slot.end) && (
                                <div className="flex items-center gap-1 text-xs mt-1.5 opacity-70">
                                  <Clock className="w-3 h-3" />
                                  {slot.start} - {slot.end}
                                </div>
                              )}
                              {slot.course.section && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  Sec {slot.course.section}
                                </Badge>
                              )}
                              {slot.course.instructor && (
                                <div className="flex items-center gap-1 text-xs mt-1.5 opacity-70">
                                  <User className="w-3 h-3" />
                                  {slot.course.instructor}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Unscheduled courses notice */}
                {schedule.courses.some(c => !c.days || c.days.length === 0) && (
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        Unscheduled Courses (no day/time assigned):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {schedule.courses
                          .filter(c => !c.days || c.days.length === 0)
                          .map(c => (
                            <Badge key={c.id} variant="outline">
                              {c.code} — {c.name} ({c.credits} cr)
                            </Badge>
                          ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
};

export default ViewSchedulePage;
