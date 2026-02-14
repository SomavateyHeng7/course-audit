'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TimeSlot {
  day: string;
  timeStart: string;
  timeEnd: string;
}

interface CourseSchedule {
  id: string;
  code: string;
  title: string;
  section?: string;
  instructor?: string;
  credits: number;
  color?: string;
  timeSlots: TimeSlot[];
}

interface ScheduleCalendarViewProps {
  courses: CourseSchedule[];
  onCourseClick?: (course: CourseSchedule) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
];

const COLORS = [
  'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-600',
  'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-600',
  'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600',
  'bg-orange-100 dark:bg-orange-900/30 border-orange-400 dark:border-orange-600',
  'bg-pink-100 dark:bg-pink-900/30 border-pink-400 dark:border-pink-600',
  'bg-teal-100 dark:bg-teal-900/30 border-teal-400 dark:border-teal-600',
  'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-400 dark:border-indigo-600',
  'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-600',
];

export function ScheduleCalendarView({ courses, onCourseClick }: ScheduleCalendarViewProps) {
  // Assign colors to courses
  const coursesWithColors = courses.map((course, index) => ({
    ...course,
    color: course.color || COLORS[index % COLORS.length]
  }));

  // Parse time to minutes for calculation
  const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Calculate position and height for a course block
  const getCoursePosition = (timeStart: string, timeEnd: string) => {
    const startMinutes = parseTime(timeStart);
    const endMinutes = parseTime(timeEnd);
    const duration = endMinutes - startMinutes;
    
    const firstSlotMinutes = parseTime(TIME_SLOTS[0]);
    const topOffset = ((startMinutes - firstSlotMinutes) / 30) * 60; // 60px per 30 min
    const height = (duration / 30) * 60;
    
    return { top: topOffset, height };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule View</CardTitle>
      </CardHeader>
      <CardContent className="p-0 sm:p-4">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Calendar Grid */}
            <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-1">
              {/* Header */}
              <div className="sticky top-0 bg-background z-10"></div>
              {DAYS.map(day => (
                <div 
                  key={day} 
                  className="sticky top-0 bg-background z-10 text-center font-semibold p-2 border-b"
                >
                  {day.slice(0, 3)}
                </div>
              ))}

              {/* Time slots and schedule */}
              {TIME_SLOTS.map((time, timeIndex) => (
                <React.Fragment key={time}>
                  {/* Time label */}
                  <div className="text-xs text-muted-foreground p-2 text-right border-r">
                    {time}
                  </div>
                  
                  {/* Day columns */}
                  {DAYS.map(day => {
                    const dayLower = day.toLowerCase();
                    return (
                      <div 
                        key={`${day}-${time}`}
                        className="relative border-b border-l min-h-[60px] bg-muted/20"
                      >
                        {/* Render courses in this time slot */}
                        {timeIndex === 0 && coursesWithColors.map(course => {
                          const slotsForDay = course.timeSlots.filter(
                            slot => slot.day.toLowerCase() === dayLower
                          );
                          
                          return slotsForDay.map((slot, slotIndex) => {
                            const { top, height } = getCoursePosition(slot.timeStart, slot.timeEnd);
                            
                            return (
                              <div
                                key={`${course.id}-${slotIndex}`}
                                className={`absolute left-0 right-0 mx-0.5 border-l-4 rounded p-1 cursor-pointer hover:shadow-md transition-shadow ${course.color} z-20`}
                                style={{ 
                                  top: `${top}px`, 
                                  height: `${height}px`,
                                  fontSize: '0.7rem'
                                }}
                                onClick={() => onCourseClick?.(course)}
                              >
                                <div className="font-semibold truncate">{course.code}</div>
                                {course.section && (
                                  <div className="text-[0.65rem] opacity-80">Sec {course.section}</div>
                                )}
                                <div className="text-[0.65rem] opacity-80 truncate">
                                  {slot.timeStart}-{slot.timeEnd}
                                </div>
                                {course.instructor && (
                                  <div className="text-[0.6rem] opacity-70 truncate">{course.instructor}</div>
                                )}
                              </div>
                            );
                          });
                        })}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 p-4 border-t">
          <h4 className="text-sm font-semibold mb-2">Courses</h4>
          <div className="flex flex-wrap gap-2">
            {coursesWithColors.map(course => (
              <Badge 
                key={course.id}
                variant="outline"
                className={`${course.color} cursor-pointer`}
                onClick={() => onCourseClick?.(course)}
              >
                {course.code} - {course.title} ({course.credits} cr)
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
