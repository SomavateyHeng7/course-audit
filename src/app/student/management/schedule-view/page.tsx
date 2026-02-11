'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToastHelpers } from '@/hooks/useToast';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User,
  BookOpen,
  ChevronRight,
  Grid3x3,
  List
} from 'lucide-react';

interface ScheduleCourse {
  code: string;
  title: string;
  section?: string;
  days?: string[];
  time?: string;
  instructor?: string;
  room?: string;
  credits: number;
  color?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  course: ScheduleCourse;
}

const dayColors = {
  M: 'bg-blue-500',
  T: 'bg-green-500',
  W: 'bg-purple-500',
  Th: 'bg-orange-500',
  F: 'bg-red-500',
  S: 'bg-pink-500',
  Su: 'bg-indigo-500'
};

const courseColors = [
  'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
  'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
  'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700',
  'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700',
  'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
  'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
  'bg-cyan-100 dark:bg-cyan-900/30 border-cyan-300 dark:border-cyan-700',
  'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700'
];

export default function ScheduleVisualizationPage() {
  const router = useRouter();
  const { error: showError, info } = useToastHelpers();
  
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [plannedCourses, setPlannedCourses] = useState<ScheduleCourse[]>([]);
  const [schedule, setSchedule] = useState<{ [day: string]: TimeSlot[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = () => {
    try {
      setLoading(true);
      
      // Load from course planning data
      const planningData = localStorage.getItem('coursePlan');
      if (planningData) {
        const data = JSON.parse(planningData);
        const courses = data.plannedCourses || [];
        
        // Assign colors to courses
        const coursesWithColors = courses.map((course: any, index: number) => ({
          ...course,
          color: courseColors[index % courseColors.length]
        }));
        
        setPlannedCourses(coursesWithColors);
        buildSchedule(coursesWithColors);
      } else {
        info('No course plan found. Please plan your courses first.');
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
      showError('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const buildSchedule = (courses: ScheduleCourse[]) => {
    const scheduleMap: { [day: string]: TimeSlot[] } = {
      'Monday': [],
      'Tuesday': [],
      'Wednesday': [],
      'Thursday': [],
      'Friday': [],
      'Saturday': [],
      'Sunday': []
    };

    courses.forEach(course => {
      if (course.days && course.time) {
        course.days.forEach(day => {
          const fullDay = getDayName(day);
          if (scheduleMap[fullDay]) {
            const [start, end] = parseTime(course.time || '');
            scheduleMap[fullDay].push({
              start,
              end,
              course
            });
          }
        });
      }
    });

    // Sort by start time
    Object.keys(scheduleMap).forEach(day => {
      scheduleMap[day].sort((a, b) => {
        const aTime = parseInt(a.start.replace(':', ''));
        const bTime = parseInt(b.start.replace(':', ''));
        return aTime - bTime;
      });
    });

    setSchedule(scheduleMap);
  };

  const getDayName = (day: string): string => {
    const dayMap: { [key: string]: string } = {
      'M': 'Monday',
      'T': 'Tuesday',
      'W': 'Wednesday',
      'Th': 'Thursday',
      'F': 'Friday',
      'S': 'Saturday',
      'Su': 'Sunday'
    };
    return dayMap[day] || day;
  };

  const parseTime = (timeString: string): [string, string] => {
    // Parse time strings like "09:00-10:30" or "9:00 AM - 10:30 AM"
    const parts = timeString.split('-').map(t => t.trim());
    if (parts.length === 2) {
      return [parts[0].replace(/\s*(AM|PM)\s*/i, ''), parts[1].replace(/\s*(AM|PM)\s*/i, '')];
    }
    return ['', ''];
  };

  const getTotalCredits = () => {
    return plannedCourses.reduce((sum, course) => sum + (course.credits || 0), 0);
  };

  const getCoursesPerDay = (day: string) => {
    return schedule[day]?.length || 0;
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button 
            variant="outline" 
            onClick={() => router.push('/student/management/course-planning')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Planning
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Schedule Visualization</h1>
          <p className="text-muted-foreground mt-1">
            View your planned courses in a visual format
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            onClick={() => setViewMode('calendar')}
            size="sm"
          >
            <Grid3x3 className="w-4 h-4 mr-2" />
            Calendar
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            size="sm"
          >
            <List className="w-4 h-4 mr-2" />
            List
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold text-foreground">{plannedCourses.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-3xl font-bold text-foreground">{getTotalCredits()}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Busiest Day</p>
                <p className="text-3xl font-bold text-foreground">
                  {Object.keys(schedule).reduce((max, day) => 
                    getCoursesPerDay(day) > getCoursesPerDay(max) ? day : max
                  , 'Monday').slice(0, 3)}
                </p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      {loading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Loading schedule...</p>
            </div>
          </CardContent>
        </Card>
      ) : plannedCourses.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center space-y-4">
              <Calendar className="w-16 h-16 mx-auto text-muted-foreground" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">No Courses Planned</h3>
                <p className="text-muted-foreground">
                  Go to course planning to add courses to your schedule
                </p>
              </div>
              <Button onClick={() => router.push('/student/management/course-planning')}>
                Plan Courses
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === 'calendar' ? (
        /* Calendar View */
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {Object.keys(schedule).map(day => (
            <Card key={day} className="min-h-[200px]">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">
                  {day}
                </CardTitle>
                <CardDescription className="text-xs">
                  {getCoursesPerDay(day)} {getCoursesPerDay(day) === 1 ? 'class' : 'classes'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {schedule[day]?.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-2 ${slot.course.color || courseColors[0]}`}
                  >
                    <div className="text-sm font-semibold text-foreground">
                      {slot.course.code}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {slot.start} - {slot.end}
                    </div>
                    {slot.course.section && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {slot.course.section}
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="space-y-4">
          {plannedCourses.map((course, index) => (
            <Card key={index} className={`border-l-4 ${course.color || courseColors[0]}`}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Course</p>
                    <p className="font-semibold text-foreground">{course.code}</p>
                    <p className="text-sm text-muted-foreground">{course.title}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Schedule</p>
                    {course.days && course.days.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {course.days.map(day => (
                          <Badge key={day} variant="secondary">
                            {day}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not scheduled</p>
                    )}
                    {course.time && (
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {course.time}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Details</p>
                    {course.section && (
                      <p className="text-sm text-foreground">Section: {course.section}</p>
                    )}
                    {course.instructor && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {course.instructor}
                      </p>
                    )}
                    {course.room && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {course.room}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Credits</p>
                    <p className="text-2xl font-bold text-foreground">{course.credits}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {plannedCourses.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Review your schedule and proceed to track your progress
              </div>
              <Button 
                onClick={() => router.push('/student/management/progress')}
                size="lg"
              >
                View Progress
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
