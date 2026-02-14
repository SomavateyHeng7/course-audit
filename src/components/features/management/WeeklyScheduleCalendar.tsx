'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';

interface CourseSection {
  id: string;
  section: string;
  instructor?: string;
  days?: string[];
  timeStart?: string;
  timeEnd?: string;
  room?: string;
  capacity?: number;
  enrolled?: number;
}

interface PlannedCourseForCalendar {
  id: string;
  code: string;
  title: string;
  credits: number;
  sections?: CourseSection[];
  selectedSection?: CourseSection;
}

interface WeeklyScheduleCalendarProps {
  courses: PlannedCourseForCalendar[];
  onSectionSelect?: (courseId: string, section: CourseSection) => void;
  showAllSections?: boolean;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const COURSE_COLORS = [
  'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
  'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
  'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200',
  'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-800 dark:text-orange-200',
  'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700 text-pink-800 dark:text-pink-200',
  'bg-teal-100 dark:bg-teal-900/30 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200',
  'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200',
  'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-200',
];

export const WeeklyScheduleCalendar: React.FC<WeeklyScheduleCalendarProps> = ({
  courses,
  onSectionSelect,
  showAllSections = false,
}) => {
  // Assign colors to courses
  const courseColors = new Map<string, string>();
  courses.forEach((course, index) => {
    courseColors.set(course.code, COURSE_COLORS[index % COURSE_COLORS.length]);
  });

  // Get time slot index
  const getTimeSlotIndex = (time: string): number => {
    return TIME_SLOTS.findIndex(slot => slot === time);
  };

  // Calculate duration in slots (each slot is 30 minutes)
  const calculateDuration = (startTime: string, endTime: string): number => {
    const startIndex = getTimeSlotIndex(startTime);
    const endIndex = getTimeSlotIndex(endTime);
    if (startIndex === -1 || endIndex === -1) return 2; // Default 1 hour
    return endIndex - startIndex;
  };

  // Get all course sections to display
  const getSectionsToDisplay = () => {
    const sectionsToDisplay: Array<{
      course: PlannedCourseForCalendar;
      section: CourseSection;
      isSelected: boolean;
    }> = [];

    courses.forEach(course => {
      if (showAllSections && course.sections && course.sections.length > 0) {
        // Show all sections
        course.sections.forEach(section => {
          sectionsToDisplay.push({
            course,
            section,
            isSelected: course.selectedSection?.id === section.id,
          });
        });
      } else if (course.selectedSection) {
        // Show only selected section
        sectionsToDisplay.push({
          course,
          section: course.selectedSection,
          isSelected: true,
        });
      }
    });

    return sectionsToDisplay;
  };

  // Get courses for a specific day and time slot
  const getCoursesForSlot = (day: string, timeSlot: string) => {
    const sectionsToDisplay = getSectionsToDisplay();
    
    return sectionsToDisplay.filter(({ section }) => {
      if (!section.days || !section.timeStart || !section.timeEnd) return false;
      
      // Check if this section is on this day
      if (!section.days.includes(day)) return false;
      
      // Check if this time slot falls within the section's time range
      const slotIndex = getTimeSlotIndex(timeSlot);
      const startIndex = getTimeSlotIndex(section.timeStart);
      const endIndex = getTimeSlotIndex(section.timeEnd);
      
      return slotIndex >= startIndex && slotIndex < endIndex;
    });
  };

  // Check if this is the start of a course block
  const isStartOfCourseBlock = (day: string, timeSlot: string, section: CourseSection): boolean => {
    return section.timeStart === timeSlot;
  };

  const sectionsToDisplay = getSectionsToDisplay();

  if (sectionsToDisplay.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar size={20} />
            Weekly Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p>No courses with schedules to display</p>
            <p className="text-sm mt-2">Add courses with time slots to see your schedule</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar size={20} />
          Weekly Schedule {showAllSections && <Badge variant="secondary">All Sections</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 gap-1 mb-2">
              <div className="text-xs font-medium text-muted-foreground p-2">Time</div>
              {DAYS_OF_WEEK.map(day => (
                <div key={day} className="text-xs font-medium text-center p-2 bg-muted rounded">
                  {day.substring(0, 3)}
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="space-y-1">
              {TIME_SLOTS.map((timeSlot, slotIndex) => (
                <div key={timeSlot} className="grid grid-cols-8 gap-1">
                  <div className="text-xs text-muted-foreground p-1 text-right">
                    {timeSlot}
                  </div>
                  {DAYS_OF_WEEK.map(day => {
                    const coursesInSlot = getCoursesForSlot(day, timeSlot);
                    
                    return (
                      <div key={`${day}-${timeSlot}`} className="relative min-h-[30px] border border-gray-200 dark:border-gray-700 rounded">
                        {coursesInSlot.map(({ course, section, isSelected }) => {
                          if (!isStartOfCourseBlock(day, timeSlot, section)) return null;
                          
                          const duration = calculateDuration(section.timeStart!, section.timeEnd!);
                          const height = duration * 31; // 30px + 1px gap
                          const colorClass = courseColors.get(course.code);
                          
                          return (
                            <div
                              key={`${course.id}-${section.id}`}
                              className={`absolute inset-x-0 top-0 p-1 border-l-2 rounded cursor-pointer hover:opacity-90 transition-opacity ${colorClass} ${
                                !isSelected ? 'opacity-60' : ''
                              }`}
                              style={{ height: `${height}px` }}
                              onClick={() => onSectionSelect?.(course.id, section)}
                            >
                              <div className="text-xs font-semibold truncate">
                                {course.code}
                              </div>
                              <div className="text-xs truncate">
                                Sec {section.section}
                              </div>
                              {section.room && (
                                <div className="text-xs truncate opacity-75">
                                  {section.room}
                                </div>
                              )}
                              {!isSelected && showAllSections && (
                                <Badge variant="outline" className="text-xs mt-0.5">
                                  Alt
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="text-sm font-medium mb-3">Course Legend:</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {courses.map(course => (
              <div key={course.code} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border ${courseColors.get(course.code)}`}></div>
                <span className="text-sm">
                  {course.code} - {course.title}
                </span>
              </div>
            ))}
          </div>
          {showAllSections && (
            <p className="text-xs text-muted-foreground mt-3">
              Click on a course section to select it. Alternative sections are shown with reduced opacity.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
