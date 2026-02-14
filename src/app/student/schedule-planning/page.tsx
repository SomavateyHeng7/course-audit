'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  Clock, 
  Book, 
  User, 
  ChevronRight, 
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { getPublishedSchedules, getTentativeSchedule } from '@/lib/api/laravel';
import { ScheduleCalendarView } from '@/components/features/schedule/ScheduleCalendarView';
import { ScheduleNotification } from '@/components/features/schedule/ScheduleNotification';

interface CourseSection {
  id: string;
  section?: string;
  instructor?: string;
  days?: string[];
  timeStart?: string;
  timeEnd?: string;
  room?: string;
  capacity?: number;
  enrolled?: number;
}

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  sections?: CourseSection[];
  selectedSection?: CourseSection;
}

interface ScheduleCombination {
  id: string;
  courses: Course[];
  hasConflicts: boolean;
  conflicts: string[];
}

export default function StudentSchedulePlanningPage() {
  const router = useRouter();
  const { success, error: showError, info } = useToastHelpers();
  
  const [loading, setLoading] = useState(true);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [selectedCourses, setSelectedCourses] = useState<Course[]>([]);
  const [scheduleCombinations, setScheduleCombinations] = useState<ScheduleCombination[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [departmentId, setDepartmentId] = useState<string>('');

  useEffect(() => {
    fetchActiveSchedule();
  }, []);

  useEffect(() => {
    if (selectedCourses.length > 0) {
      generateScheduleCombinations();
    } else {
      setScheduleCombinations([]);
      setSelectedCombination(null);
    }
  }, [selectedCourses]);

  const fetchActiveSchedule = async () => {
    try {
      setLoading(true);
      // Fetch published schedules and find the active one for student's department
      const response = await getPublishedSchedules({ limit: 100 });
      
      // Find active schedule (you may need to add department filtering)
      const active = response.schedules.find(s => s.isActive);
      
      if (active) {
        // Fetch full schedule details
        const scheduleDetail = await getTentativeSchedule(active.id);
        setActiveSchedule(scheduleDetail.schedule);
        setDepartmentId(scheduleDetail.schedule.department || '');
      } else {
        info('No active schedule available for your department');
      }
    } catch (error) {
      console.error('Error fetching active schedule:', error);
      showError('Failed to load active schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCourse = (course: any) => {
    // Convert schedule course to our format with sections
    const sections: CourseSection[] = [];
    
    if (course.days && course.timeStart && course.timeEnd) {
      sections.push({
        id: course.id,
        section: course.section,
        instructor: course.instructor,
        days: course.days,
        timeStart: course.timeStart,
        timeEnd: course.timeEnd,
        room: course.room,
        capacity: course.capacity,
        enrolled: course.enrolled,
      });
    }

    const newCourse: Course = {
      id: course.course.id,
      code: course.course.code,
      title: course.course.title,
      credits: course.course.credits,
      sections,
    };

    // Check if already selected
    if (selectedCourses.find(c => c.id === newCourse.id)) {
      showError('Course already selected');
      return;
    }

    setSelectedCourses([...selectedCourses, newCourse]);
    success(`Added ${newCourse.code} to your selection`);
  };

  const handleRemoveCourse = (courseId: string) => {
    setSelectedCourses(selectedCourses.filter(c => c.id !== courseId));
  };

  const generateScheduleCombinations = () => {
    const coursesWithSections = selectedCourses.filter(c => c.sections && c.sections.length > 0);
    
    if (coursesWithSections.length === 0) {
      setScheduleCombinations([]);
      return;
    }

    const combinations: ScheduleCombination[] = [];
    
    // Generate all possible combinations
    const generateCombos = (
      currentCombination: Course[],
      remainingCourses: Course[]
    ) => {
      if (remainingCourses.length === 0) {
        // Check for conflicts
        const { hasConflicts, conflicts } = checkTimeConflicts(currentCombination);
        
        combinations.push({
          id: `combo-${combinations.length}`,
          courses: currentCombination,
          hasConflicts,
          conflicts,
        });
        return;
      }

      const [currentCourse, ...rest] = remainingCourses;
      
      if (!currentCourse.sections || currentCourse.sections.length === 0) {
        generateCombos(currentCombination, rest);
        return;
      }

      for (const section of currentCourse.sections) {
        const courseWithSection = {
          ...currentCourse,
          selectedSection: section,
        };
        generateCombos([...currentCombination, courseWithSection], rest);
      }
    };

    generateCombos([], coursesWithSections);
    
    // Sort: conflict-free first
    combinations.sort((a, b) => {
      if (a.hasConflicts === b.hasConflicts) return 0;
      return a.hasConflicts ? 1 : -1;
    });

    setScheduleCombinations(combinations.slice(0, 20)); // Limit to 20 combinations
    if (combinations.length > 0) {
      setSelectedCombination(combinations[0].id);
    }
  };

  const checkTimeConflicts = (courses: Course[]): { hasConflicts: boolean; conflicts: string[] } => {
    const conflicts: string[] = [];
    
    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const course1 = courses[i];
        const course2 = courses[j];
        
        if (!course1.selectedSection || !course2.selectedSection) continue;
        
        const section1 = course1.selectedSection;
        const section2 = course2.selectedSection;
        
        if (!section1.days || !section2.days || !section1.timeStart || !section2.timeStart) continue;
        
        // Check if they share any days
        const sharedDays = section1.days.filter(day => section2.days?.includes(day));
        
        if (sharedDays.length > 0) {
          // Check time overlap
          const start1 = parseTime(section1.timeStart);
          const end1 = parseTime(section1.timeEnd || section1.timeStart);
          const start2 = parseTime(section2.timeStart);
          const end2 = parseTime(section2.timeEnd || section2.timeStart);
          
          if ((start1 < end2 && end1 > start2)) {
            conflicts.push(
              `${course1.code} and ${course2.code} overlap on ${sharedDays.join(', ')}`
            );
          }
        }
      }
    }
    
    return {
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  };

  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const prepareCalendarData = (combination: ScheduleCombination) => {
    return combination.courses.map((course, index) => {
      const section = course.selectedSection;
      if (!section || !section.days || !section.timeStart) return null;
      
      return {
        id: course.id,
        code: course.code,
        title: course.title,
        section: section.section,
        instructor: section.instructor,
        credits: course.credits,
        timeSlots: section.days.map(day => ({
          day,
          timeStart: section.timeStart!,
          timeEnd: section.timeEnd || section.timeStart!,
        })),
      };
    }).filter(Boolean) as any[];
  };

  const handleProceedToRegistration = () => {
    if (!selectedCombination) {
      showError('Please select a schedule combination');
      return;
    }
    
    const combination = scheduleCombinations.find(c => c.id === selectedCombination);
    if (!combination) return;
    
    // Store selected schedule in localStorage or state management
    localStorage.setItem('selectedSchedule', JSON.stringify(combination));
    
    success('Schedule selected! Proceeding to course management...');
    router.push('/student/management/course-planning');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading active schedule...</p>
        </div>
      </div>
    );
  }

  if (!activeSchedule) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-8">
        <div className="container mx-auto max-w-4xl">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No active tentative schedule is available for your department. Please check back later or contact your chairperson.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6">
            <ScheduleNotification departmentId={departmentId} />
          </div>
        </div>
      </div>
    );
  }

  const selectedCombo = scheduleCombinations.find(c => c.id === selectedCombination);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Course Schedule Planning</h1>
          <p className="text-muted-foreground">
            Select courses from the active schedule and view all possible schedule combinations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Available Courses */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {activeSchedule.name}
                  <Badge variant="outline" className="ml-2">Active</Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {activeSchedule.semester} • {activeSchedule.courses?.length || 0} courses
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {activeSchedule.courses?.map((course: any) => (
                    <div
                      key={course.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleSelectCourse(course)}
                    >
                      <div className="font-medium">{course.course.code}</div>
                      <div className="text-sm text-muted-foreground truncate">{course.course.title}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {course.course.credits} cr
                        </Badge>
                        {course.section && (
                          <span className="text-xs text-muted-foreground">Sec {course.section}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notification Card */}
            <ScheduleNotification departmentId={departmentId} />
          </div>

          {/* Right: Selected Courses & Combinations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Selected Courses */}
            <Card>
              <CardHeader>
                <CardTitle>Your Selected Courses ({selectedCourses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCourses.length > 0 ? (
                  <div className="space-y-2">
                    {selectedCourses.map(course => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <div className="font-medium">{course.code}</div>
                          <div className="text-sm text-muted-foreground">{course.title}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCourse(course.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Select courses from the left to start planning
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Schedule Combinations */}
            {scheduleCombinations.length > 0 && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Possible Schedules ({scheduleCombinations.length})</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCalendar(!showCalendar)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {showCalendar ? 'Hide' : 'Show'} Calendar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {scheduleCombinations.map((combo, index) => (
                        <div
                          key={combo.id}
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selectedCombination === combo.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedCombination(combo.id)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Option {index + 1}</span>
                            {!combo.hasConflicts ? (
                              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                No Conflicts
                              </Badge>
                            ) : (
                              <Badge variant="destructive">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {combo.conflicts.length} Conflicts
                              </Badge>
                            )}
                          </div>
                          
                          {combo.hasConflicts && (
                            <div className="text-xs text-destructive space-y-1 mt-2">
                              {combo.conflicts.map((conflict, idx) => (
                                <div key={idx}>⚠️ {conflict}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <Button 
                      className="w-full mt-4"
                      onClick={handleProceedToRegistration}
                      disabled={!selectedCombination}
                    >
                      Proceed to Course Registration
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Calendar View */}
                {showCalendar && selectedCombo && (
                  <ScheduleCalendarView 
                    courses={prepareCalendarData(selectedCombo)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
