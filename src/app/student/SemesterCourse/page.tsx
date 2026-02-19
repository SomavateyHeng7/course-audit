'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, Book, ChevronDown, Search } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import { getPublishedSchedules, getPublishedSchedule, getPublicDepartments } from '@/lib/api/laravel';

// Import chairperson components
import { PageHeader } from '@/components/role-specific/chairperson/PageHeader';
import { SearchBar } from '@/components/role-specific/chairperson/SearchBar';
import { DataTable } from '@/components/role-specific/chairperson/DataTable';
import { EmptyState } from '@/components/role-specific/chairperson/EmptyState';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { StatCard } from '@/components/role-specific/chairperson/StatCard';

interface CourseSchedule {
  id: string;
  code: string;
  name: string;
  instructor: string;
  credits: number;
  day: string;
  time: string;
  room: string;
  capacity: number;
  enrolled: number;
  section: string;
  category: string;
  color: string;
}

interface ScheduleDraft {
  id: string;
  name: string;
  semester: string;
  lastUpdated: string;
  isPublished: boolean;
  curriculumName?: string;
  curriculumYear?: string;
}

const SemesterCoursePage: React.FC = () => {
  const router = useRouter();
  const { success, error: showError, warning, info } = useToastHelpers();

  // State management
  const [scheduleDrafts, setScheduleDrafts] = useState<ScheduleDraft[]>([]);
  const [selectedDraft, setSelectedDraft] = useState<ScheduleDraft | null>(null);
  const [courseSchedules, setCourseSchedules] = useState<CourseSchedule[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  
  // Department selection
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('all');
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  // Load departments on mount
  useEffect(() => {
    loadDepartments();
  }, []);
  
  // Load schedule drafts when department changes
  useEffect(() => {
    if (departments.length > 0) {
      loadScheduleDrafts();
    }
  }, [selectedDepartmentId]);
  
  const loadDepartments = async () => {
    try {
      setLoadingDepartments(true);
      const response = await getPublicDepartments();
      setDepartments(response.departments);
      
      // Get student's department from localStorage as default
      // Try unified studentAuditData first, then fallback to legacy key
      let savedContext = localStorage.getItem('studentAuditData');
      if (!savedContext) {
        savedContext = localStorage.getItem('studentDataEntryContext');
      }
      
      if (savedContext) {
        try {
          const parsedContext = JSON.parse(savedContext);
          const studentDeptId = parsedContext.actualDepartmentId || parsedContext.selectedDepartment;
          if (studentDeptId) {
            setSelectedDepartmentId(studentDeptId);
          }
        } catch (e) {
          console.error('Error parsing student context:', e);
        }
      }
    } catch (error) {
      console.error('Error loading departments:', error);
      showError('Failed to load departments');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const loadScheduleDrafts = async () => {
    try {
      setLoading(true);
      
      // Use selected department (or all if 'all' is selected)
      const departmentId = selectedDepartmentId !== 'all' ? selectedDepartmentId : undefined;
      
      // Fetch published schedules from API, filtered by department
      const response = await getPublishedSchedules({ 
        limit: 100,
        departmentId: departmentId 
      });
      
      // Filter to show only active schedules (published AND active)
      const activeSchedules = response.schedules.filter((schedule: any) => schedule.isActive === true);
      
      // Map schedules to local format
      const publishedSchedules = activeSchedules.map((schedule: any) => ({
        id: schedule.id,
        name: schedule.name,
        semester: `${schedule.semester} ${schedule.year}`,
        lastUpdated: schedule.updatedAt,
        isPublished: schedule.isPublished,
        curriculumName: schedule.curriculumName,
        curriculumYear: schedule.curriculumYear
      }));
      
      setScheduleDrafts(publishedSchedules);
      
      // Auto-select the most recent active schedule
      if (publishedSchedules.length > 0) {
        const latestDraft = publishedSchedules[0];
        setSelectedDraft(latestDraft);
        loadCourseSchedules(latestDraft.id);
      } else {
        // Clear selected draft and courses when no active schedules available for this department
        setSelectedDraft(null);
        setCourseSchedules([]);
        
        // Show info message
        if (departmentId) {
          info('No active schedule found for this department. Check with your department for updates.');
        }
      }
    } catch (error: any) {
      console.error('Error loading schedule drafts:', error);
      showError('Error loading schedule drafts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseSchedules = async (draftId: string) => {
    try {
      setLoadingSchedules(true);
      
      // Fetch schedule details with courses from published API
      const response = await getPublishedSchedule(draftId);
      const schedule = response.schedule;
      
      console.log('Published schedule response:', response);
      console.log('Schedule courses:', schedule.courses);
      console.log('Courses count:', schedule.courses?.length);
      
      if (!schedule.courses || !Array.isArray(schedule.courses)) {
        console.error('Schedule courses is not an array:', schedule.courses);
        setCourseSchedules([]);
        return;
      }
      
      // Transform API data to CourseSchedule format
      const courses: CourseSchedule[] = (schedule.courses || []).map((scheduleCourse: any, index: number) => {
        
        const course = scheduleCourse.course;
        const categoryColors: Record<string, string> = {
          'Core': '#3b82f6',
          'Elective': '#10b981',
          'Advanced': '#8b5cf6',
          'Foundation': '#f59e0b',
        };
        
        // Extract day from days array if available
        let day = 'TBA';
        if (scheduleCourse.day) {
          day = scheduleCourse.day;
        } else if (scheduleCourse.days && Array.isArray(scheduleCourse.days) && scheduleCourse.days.length > 0) {
          day = scheduleCourse.days[0];
        }
        
        // Extract time
        let time = 'TBA';
        if (scheduleCourse.timeStart && scheduleCourse.timeEnd) {
          time = `${scheduleCourse.timeStart} - ${scheduleCourse.timeEnd}`;
        } else if (scheduleCourse.time) {
          time = scheduleCourse.time;
        }
        
        return {
          id: scheduleCourse.id,
          code: course.code,
          name: course.title,
          instructor: scheduleCourse.instructor || 'TBA',
          credits: course.credits,
          day: day,
          time: time,
          room: scheduleCourse.room || 'TBA',
          capacity: scheduleCourse.capacity || 0,
          enrolled: scheduleCourse.enrolled || 0,
          section: scheduleCourse.section || 'A',
          category: scheduleCourse.courseType || 'Core',
          color: categoryColors[scheduleCourse.courseType || 'Core'] || '#6b7280'
        };
      });
      
      setCourseSchedules(courses);
    } catch (error) {
      console.error('Error loading course schedules:', error);
      showError('Error loading course schedules. Please try again.');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleDraftChange = (draft: ScheduleDraft) => {
    setSelectedDraft(draft);
    loadCourseSchedules(draft.id);
  };

  // Filter courses based on search term
  const filteredCourses = courseSchedules.filter(course =>
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group courses by day for better organization
  const groupedCourses = filteredCourses.reduce((acc, course) => {
    const day = course.day;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(course);
    return acc;
  }, {} as Record<string, CourseSchedule[]>);

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'TBA'];
  // Get all days that have courses (including TBA or any other day)
  const sortedDays = Object.keys(groupedCourses).sort((a, b) => {
    const aIndex = dayOrder.indexOf(a);
    const bIndex = dayOrder.indexOf(b);
    // If both are in dayOrder, sort by their position
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    // If only a is in dayOrder, it comes first
    if (aIndex !== -1) return -1;
    // If only b is in dayOrder, it comes first
    if (bIndex !== -1) return 1;
    // Otherwise, sort alphabetically
    return a.localeCompare(b);
  });

  return (
    <div className="flex min-h-screen">

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-6xl mx-auto">
            
            <PageHeader
              title="Course Offering For Next Semester"
              description="Check available subjects in the coming semester"
            />

            {/* Statistics */}
            {selectedDraft && courseSchedules.length > 0 && (
              <div className="grid grid-cols-1 gap-4 mb-6">
                <StatCard
                  title="Total Courses"
                  value={courseSchedules.length.toString()}
                  subtitle="Scheduled courses"
                  icon={<Book className="h-5 w-5" />}
                />
              </div>
            )}

            {/* No Published Schedules Message */}
            {!loading && scheduleDrafts.length === 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      No Published Schedules Available
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      There are currently no published tentative schedules. Please check back later or contact your department chairperson.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Selection and Search */}
            <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                
                {/* Department Selector */}
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDepartmentId}
                      onChange={(e) => setSelectedDepartmentId(e.target.value)}
                      disabled={loadingDepartments}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-background text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none text-sm sm:text-base disabled:opacity-50"
                    >
                      <option value="all">All Departments</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 pointer-events-none" />
                  </div>
                </div>
                
                {/* Available Class Schedule Dropdown */}
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Class Schedule
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDraft?.id || ''}
                      onChange={(e) => {
                        const draft = scheduleDrafts.find(d => d.id === e.target.value);
                        if (draft) handleDraftChange(draft);
                      }}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-background text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none text-sm sm:text-base"
                    >
                      {scheduleDrafts.map((draft) => (
                        <option key={draft.id} value={draft.id}>
                          {draft.name} - published
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4 pointer-events-none" />
                  </div>
                  {selectedDraft && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last Updated: {new Date(selectedDraft.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Search */}
                <div className="flex-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Courses
                  </label>
                  <SearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Search by course code, name, or instructor..."
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Course Schedule Display */}
            <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
              
              {/* Header */}
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-border">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-foreground break-words">
                  {selectedDraft ? `${selectedDraft.name} (Published - ${selectedDraft.semester})` : 'Course Schedule'}
                </h2>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {loadingSchedules ? (
                  <LoadingSpinner text="Loading course schedules..." size="lg" />
                ) : filteredCourses.length > 0 ? (
                  <div className="space-y-6 sm:space-y-8">
                    {sortedDays.map((day) => (
                      <div key={day}>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          {day}
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {groupedCourses[day].map((course) => (
                            <div
                              key={course.id}
                              className="border border-gray-200 dark:border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                              style={{ borderLeftColor: course.color, borderLeftWidth: '3px' }}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-foreground text-sm sm:text-base">
                                      {course.code}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-words">
                                      {course.name}
                                    </p>
                                  </div>
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded flex-shrink-0">
                                    {course.section}
                                  </span>
                                </div>
                                
                                <div className="space-y-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-2">
                                    <Clock className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{course.time}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <User className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{course.instructor}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Book className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate">{course.credits} credits • {course.room}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : selectedDraft ? (
                  <EmptyState
                    icon={<Book className="w-full h-full" />}
                    title={searchTerm ? 'No courses found' : 'No courses scheduled'}
                    description={searchTerm 
                      ? 'Try adjusting your search terms or clear the search to see all courses.'
                      : 'No courses have been scheduled for this semester yet.'}
                    action={searchTerm ? {
                      label: 'Clear Search',
                      onClick: () => setSearchTerm(''),
                      variant: 'default'
                    } : undefined}
                  />
                ) : (
                  <EmptyState
                    icon={<Calendar className="w-full h-full" />}
                    title="Select a schedule to view courses"
                    description="Choose an available class schedule from the dropdown above."
                  />
                )}
              </div>
            </div>

            {/* Footer Info */}
            {selectedDraft && filteredCourses.length > 0 && (
              <div className="mt-4 sm:mt-6 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-4">
                Students can see the tentative schedule of the next semester.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemesterCoursePage;