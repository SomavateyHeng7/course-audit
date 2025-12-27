'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Clock, User, Book, ChevronDown, Search } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';

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
  status: 'draft' | 'published';
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

  // Load schedule drafts
  useEffect(() => {
    loadScheduleDrafts();
  }, []);

  const loadScheduleDrafts = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockDrafts: ScheduleDraft[] = [
        {
          id: '1',
          name: '(2/2025) CS&IT Course Schedule',
          semester: 'Spring 2025',
          lastUpdated: new Date().toISOString(),
          status: 'draft'
        },
        {
          id: '2',
          name: '(1/2025) CS&IT Course Schedule',
          semester: 'Fall 2024',
          lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'published'
        }
      ];
      
      setScheduleDrafts(mockDrafts);
      
      // Auto-select the most recent draft
      if (mockDrafts.length > 0) {
        const latestDraft = mockDrafts[0];
        setSelectedDraft(latestDraft);
        loadCourseSchedules(latestDraft.id);
      }
    } catch (error) {
      console.error('Error loading schedule drafts:', error);
      showError('Error loading schedule drafts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCourseSchedules = async (draftId: string) => {
    try {
      setLoadingSchedules(true);
      
      // Mock course schedule data
      const mockCourses: CourseSchedule[] = [
        {
          id: '1',
          code: 'CS301',
          name: 'Database Systems',
          instructor: 'Dr. Smith',
          credits: 3,
          day: 'Monday',
          time: '09:00 - 11:00',
          room: 'Room A101',
          capacity: 35,
          enrolled: 28,
          section: 'A',
          category: 'Core',
          color: '#3b82f6'
        },
        {
          id: '2',
          code: 'CS302',
          name: 'Software Engineering',
          instructor: 'Dr. Johnson',
          credits: 3,
          day: 'Monday',
          time: '13:00 - 15:00',
          room: 'Room B201',
          capacity: 30,
          enrolled: 25,
          section: 'A',
          category: 'Core',
          color: '#10b981'
        },
        {
          id: '3',
          code: 'CS303',
          name: 'Computer Networks',
          instructor: 'Dr. Williams',
          credits: 3,
          day: 'Tuesday',
          time: '10:00 - 12:00',
          room: 'Room C301',
          capacity: 32,
          enrolled: 30,
          section: 'A',
          category: 'Core',
          color: '#f59e0b'
        },
        {
          id: '4',
          code: 'CS401',
          name: 'Machine Learning',
          instructor: 'Dr. Brown',
          credits: 3,
          day: 'Wednesday',
          time: '09:00 - 11:00',
          room: 'Room D101',
          capacity: 25,
          enrolled: 24,
          section: 'B',
          category: 'Elective',
          color: '#8b5cf6'
        },
        {
          id: '5',
          code: 'CS402',
          name: 'Web Development',
          instructor: 'Dr. Davis',
          credits: 3,
          day: 'Wednesday',
          time: '14:00 - 16:00',
          room: 'Room E202',
          capacity: 28,
          enrolled: 22,
          section: 'A',
          category: 'Elective',
          color: '#ef4444'
        },
        {
          id: '6',
          code: 'CS303',
          name: 'Computer Networks',
          instructor: 'Dr. Miller',
          credits: 3,
          day: 'Thursday',
          time: '11:00 - 13:00',
          room: 'Room F301',
          capacity: 32,
          enrolled: 27,
          section: 'B',
          category: 'Core',
          color: '#f59e0b'
        },
        {
          id: '7',
          code: 'CS501',
          name: 'Artificial Intelligence',
          instructor: 'Dr. Wilson',
          credits: 3,
          day: 'Friday',
          time: '10:00 - 12:00',
          room: 'Room G401',
          capacity: 20,
          enrolled: 18,
          section: 'A',
          category: 'Advanced',
          color: '#06b6d4'
        }
      ];
      
      setCourseSchedules(mockCourses);
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

  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const sortedDays = dayOrder.filter(day => groupedCourses[day]);

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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard
                  title="Total Courses"
                  value={courseSchedules.length.toString()}
                  subtitle="Available courses"
                  icon={<Book className="h-5 w-5" />}
                />
                <StatCard
                  title="Core Courses"
                  value={courseSchedules.filter(c => c.category === 'Core').length.toString()}
                  subtitle="Required courses"
                  icon={<Calendar className="h-5 w-5" />}
                />
                <StatCard
                  title="Electives"
                  value={courseSchedules.filter(c => c.category === 'Elective').length.toString()}
                  subtitle="Optional courses"
                  icon={<User className="h-5 w-5" />}
                />
              </div>
            )}

            {/* Schedule Selection and Search */}
            <div className="mb-6 sm:mb-8 space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                
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
                          {draft.name} - {draft.status}
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
                  {selectedDraft ? `${selectedDraft.name} (${selectedDraft.status.charAt(0).toUpperCase() + selectedDraft.status.slice(1)} - ${selectedDraft.semester})` : 'Course Schedule'}
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

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 gap-2">
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                    {course.category}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {course.enrolled}/{course.capacity} enrolled
                                  </span>
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