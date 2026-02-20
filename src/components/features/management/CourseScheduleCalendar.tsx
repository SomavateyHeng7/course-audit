'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  Info,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List
} from 'lucide-react';

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

interface Course {
  id: string;
  code: string;
  title: string;
  credits: number;
  sections?: CourseSection[];
  selectedSection?: CourseSection;
}

interface CourseScheduleCalendarProps {
  courses: Course[];
  onSelectSection?: (courseId: string, section: CourseSection) => void;
  onRemoveCourse?: (courseId: string) => void;
  showSectionSelector?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00'
];

const COLORS = [
  'bg-blue-100 border-blue-500 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100',
  'bg-green-100 border-green-500 text-green-900 dark:bg-green-900/30 dark:text-green-100',
  'bg-purple-100 border-purple-500 text-purple-900 dark:bg-purple-900/30 dark:text-purple-100',
  'bg-orange-100 border-orange-500 text-orange-900 dark:bg-orange-900/30 dark:text-orange-100',
  'bg-pink-100 border-pink-500 text-pink-900 dark:bg-pink-900/30 dark:text-pink-100',
  'bg-cyan-100 border-cyan-500 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-100',
  'bg-yellow-100 border-yellow-500 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-100',
  'bg-indigo-100 border-indigo-500 text-indigo-900 dark:bg-indigo-900/30 dark:text-indigo-100',
];

const dayNameToShort: Record<string, string> = {
  'Monday': 'M',
  'Tuesday': 'T',
  'Wednesday': 'W',
  'Thursday': 'Th',
  'Friday': 'F',
  'Saturday': 'S',
  'Sunday': 'Su'
};

export function CourseScheduleCalendar({
  courses,
  onSelectSection,
  onRemoveCourse,
  showSectionSelector = true
}: CourseScheduleCalendarProps) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [viewMode, setViewMode] = useState<'week' | 'compact'>('week');

  // Map day abbreviations to full names
  const mapDayToFull = (day: string): string => {
    const dayMap: Record<string, string> = {
      'M': 'Monday', 'T': 'Tuesday', 'W': 'Wednesday', 
      'Th': 'Thursday', 'F': 'Friday', 'S': 'Saturday', 'Su': 'Sunday',
      'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
      'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
    };
    return dayMap[day] || day;
  };

  // Calculate position for a time slot
  const getTimePosition = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 8 * 60; // 8:00 AM
    return ((totalMinutes - startMinutes) / 30) * 40; // 40px per 30-minute slot
  };

  // Calculate height for a time duration
  const getTimeHeight = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    return (durationMinutes / 30) * 40; // 40px per 30-minute slot
  };

  // Check for time conflicts
  const hasConflict = (section1: CourseSection, section2: CourseSection): boolean => {
    if (!section1.days || !section2.days || !section1.timeStart || !section2.timeStart) return false;
    
    const commonDays = section1.days.some(d1 => 
      section2.days?.some(d2 => mapDayToFull(d1) === mapDayToFull(d2))
    );
    
    if (!commonDays) return false;
    
    const start1 = section1.timeStart;
    const end1 = section1.timeEnd || '00:00';
    const start2 = section2.timeStart;
    const end2 = section2.timeEnd || '00:00';
    
    return (start1 < end2 && start2 < end1);
  };

  // Find conflicts for a course
  const findConflicts = (course: Course): string[] => {
    if (!course.selectedSection) return [];

    const conflicts: string[] = [];
    courses.forEach(otherCourse => {
      if (
        otherCourse.id !== course.id &&
        otherCourse.selectedSection &&
        course.selectedSection // ensure not undefined
      ) {
        if (hasConflict(course.selectedSection, otherCourse.selectedSection)) {
          conflicts.push(otherCourse.code);
        }
      }
    });

    return conflicts;
  };

  const handleSectionSelect = (course: Course, section: CourseSection) => {
    onSelectSection?.(course.id, section);
    setShowSectionModal(false);
    setSelectedCourse(null);
  };

  const openSectionModal = (course: Course) => {
    setSelectedCourse(course);
    setShowSectionModal(true);
  };

  // Group courses by day for calendar view
  const coursesByDay = useMemo(() => {
    const grouped: Record<string, Array<{ course: Course; section: CourseSection; color: string }>> = {};
    
    DAYS.forEach(day => {
      grouped[day] = [];
    });
    
    courses.forEach((course, index) => {
      if (course.selectedSection?.days && course.selectedSection.timeStart) {
        const color = COLORS[index % COLORS.length];
        course.selectedSection.days.forEach(day => {
          const fullDay = mapDayToFull(day);
          if (grouped[fullDay]) {
            grouped[fullDay].push({ course, section: course.selectedSection!, color });
          }
        });
      }
    });
    
    return grouped;
  }, [courses]);

  // Render week view
  const renderWeekView = () => (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-8 gap-2 mb-2">
          <div className="text-xs font-medium text-muted-foreground p-2">Time</div>
          {DAYS.slice(0, 7).map(day => (
            <div key={day} className="text-sm font-semibold text-center p-2 bg-muted rounded-t">
              {day}
            </div>
          ))}
        </div>
        
        {/* Time grid */}
        <div className="grid grid-cols-8 gap-2 relative">
          {/* Time column */}
          <div className="space-y-[40px]">
            {TIME_SLOTS.filter((_, i) => i % 2 === 0).map(time => (
              <div key={time} className="text-xs text-muted-foreground h-[40px]">
                {time}
              </div>
            ))}
          </div>
          
          {/* Day columns */}
          {DAYS.slice(0, 7).map(day => (
            <div key={day} className="relative border rounded bg-muted/20 min-h-[600px]">
              {/* Background grid lines */}
              {TIME_SLOTS.filter((_, i) => i % 2 === 0).map((time, i) => (
                <div
                  key={time}
                  className="absolute left-0 right-0 border-t border-dashed border-gray-200 dark:border-gray-800"
                  style={{ top: `${i * 80}px` }}
                />
              ))}
              
              {/* Course blocks */}
              {coursesByDay[day].map(({ course, section, color }, index) => {
                const conflicts = findConflicts(course);
                const top = getTimePosition(section.timeStart!);
                const height = section.timeEnd 
                  ? getTimeHeight(section.timeStart!, section.timeEnd) 
                  : 80;
                
                return (
                  <div
                    key={`${course.id}-${index}`}
                    className={`absolute left-1 right-1 ${color} border-l-4 rounded p-2 cursor-pointer hover:shadow-lg transition-shadow overflow-hidden ${
                      conflicts.length > 0 ? 'ring-2 ring-red-500' : ''
                    }`}
                    style={{ top: `${top}px`, height: `${height}px` }}
                    onClick={() => openSectionModal(course)}
                  >
                    <div className="text-xs font-bold truncate">{course.code}</div>
                    <div className="text-xs truncate">{section.section}</div>
                    <div className="text-xs truncate">{section.timeStart} - {section.timeEnd}</div>
                    {section.instructor && (
                      <div className="text-xs truncate font-medium opacity-90">{section.instructor}</div>
                    )}
                    {section.room && (
                      <div className="text-xs truncate opacity-75">{section.room}</div>
                    )}
                    {conflicts.length > 0 && (
                      <div className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">
                        Conflict!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render compact list view
  const renderCompactView = () => (
    <div className="space-y-3">
      {courses.map((course, index) => {
        const color = COLORS[index % COLORS.length];
        const conflicts = findConflicts(course);
        
        return (
          <Card key={course.id} className={`${conflicts.length > 0 ? 'ring-2 ring-red-500' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-3 h-3 rounded border-2 ${color}`} />
                    <h4 className="font-bold">{course.code}</h4>
                    <Badge variant="outline">{course.credits} credits</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{course.title}</p>
                </div>
                {showSectionSelector && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openSectionModal(course)}
                  >
                    {course.selectedSection ? 'Change' : 'Select'} Section
                  </Button>
                )}
              </div>
              
              {course.selectedSection ? (
                <div className="space-y-2 mt-3 p-3 bg-muted/50 rounded">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge>{course.selectedSection.section}</Badge>
                    {course.selectedSection.days && course.selectedSection.days.length > 0 && (
                      <span className="text-muted-foreground">
                        {course.selectedSection.days.map(mapDayToFull).join(', ')}
                      </span>
                    )}
                  </div>
                  
                  {course.selectedSection.timeStart && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock size={14} className="text-muted-foreground" />
                      <span>{course.selectedSection.timeStart} - {course.selectedSection.timeEnd}</span>
                    </div>
                  )}
                  
                  {course.selectedSection.instructor && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Instructor:</span>{' '}
                      {course.selectedSection.instructor}
                    </div>
                  )}
                  
                  {course.selectedSection.room && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={14} className="text-muted-foreground" />
                      <span>{course.selectedSection.room}</span>
                    </div>
                  )}
                  
                  {course.selectedSection.capacity && (
                    <div className="flex items-center gap-2 text-sm">
                      <Users size={14} className="text-muted-foreground" />
                      <span>
                        {course.selectedSection.enrolled || 0} / {course.selectedSection.capacity}
                      </span>
                    </div>
                  )}
                  
                  {conflicts.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold">
                      <Info size={14} />
                      <span>Conflicts with: {conflicts.join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic mt-2">
                  No section selected
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
      
      {courses.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No courses added to your schedule yet
        </div>
      )}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} />
              Course Schedule
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('compact')}
              >
                <List size={16} />
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('week')}
              >
                <Grid3x3 size={16} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === 'week' ? renderWeekView() : renderCompactView()}
        </CardContent>
      </Card>

      {/* Section Selection Modal */}
      {showSectionModal && selectedCourse && (
        <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Select Section for {selectedCourse.code}
              </DialogTitle>
              <DialogDescription>
                {selectedCourse.title} ({selectedCourse.credits} credits)
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-3 mt-4">
              {selectedCourse.sections && selectedCourse.sections.length > 0 ? (
                selectedCourse.sections.map(section => {
                  const wouldConflict = courses.some(course => {
                    if (course.id === selectedCourse.id || !course.selectedSection) return false;
                    return hasConflict(section, course.selectedSection);
                  });
                  
                  const isFull = section.capacity && section.enrolled 
                    ? section.enrolled >= section.capacity 
                    : false;
                  
                  return (
                    <Card 
                      key={section.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedCourse.selectedSection?.id === section.id 
                          ? 'ring-2 ring-primary' 
                          : ''
                      } ${wouldConflict ? 'opacity-50 border-red-500' : ''}`}
                      onClick={() => !wouldConflict && handleSectionSelect(selectedCourse, section)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={wouldConflict ? 'destructive' : 'default'}>
                                {section.section}
                              </Badge>
                              {isFull && <Badge variant="secondary">Full</Badge>}
                              {selectedCourse.selectedSection?.id === section.id && (
                                <Badge variant="outline">Currently Selected</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {section.days && section.days.length > 0 && (
                            <div>
                              <span className="text-muted-foreground">Days:</span>{' '}
                              <span className="font-medium">
                                {section.days.map(mapDayToFull).join(', ')}
                              </span>
                            </div>
                          )}
                          
                          {section.timeStart && (
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-muted-foreground" />
                              <span>{section.timeStart} - {section.timeEnd}</span>
                            </div>
                          )}
                          
                          {section.instructor && (
                            <div>
                              <span className="text-muted-foreground">Instructor:</span>{' '}
                              <span className="font-medium">{section.instructor}</span>
                            </div>
                          )}
                          
                          {section.room && (
                            <div className="flex items-center gap-2">
                              <MapPin size={14} className="text-muted-foreground" />
                              <span>{section.room}</span>
                            </div>
                          )}
                          
                          {section.capacity && (
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-muted-foreground" />
                              <span>
                                {section.enrolled || 0} / {section.capacity} enrolled
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {wouldConflict && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 font-semibold">
                            <Info size={14} />
                            <span>This section conflicts with your current schedule</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No sections available for this course
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
