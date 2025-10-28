'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaClock, FaUser, FaBook, FaChevronDown, FaSearch } from 'react-icons/fa';
import { useToastHelpers } from '@/hooks/useToast';

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
      const response = await fetch('/api/schedule-drafts');
      
      if (response.ok) {
        const data = await response.json();
        const drafts = data.drafts || [];
        setScheduleDrafts(drafts);
        
        // Auto-select the most recent draft
        if (drafts.length > 0) {
          const latestDraft = drafts[0];
          setSelectedDraft(latestDraft);
          loadCourseSchedules(latestDraft.id);
        }
      } else {
        console.error('Failed to load schedule drafts');
        showError('Failed to load schedule drafts');
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
      const response = await fetch(`/api/schedule-drafts/${draftId}/courses`);
      
      if (response.ok) {
        const data = await response.json();
        setCourseSchedules(data.courses || []);
      } else {
        console.error('Failed to load course schedules');
        showError('Failed to load course schedules');
      }
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
        <div className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-2">
                Course Offering For Next Semester
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Check available subjects in the coming semester
              </p>
            </div>

            {/* Schedule Selection and Search */}
            <div className="mb-8 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                
                {/* Available Class Schedule Dropdown */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Available Class Schedule
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDraft?.id || ''}
                      onChange={(e) => {
                        const draft = scheduleDrafts.find(d => d.id === e.target.value);
                        if (draft) handleDraftChange(draft);
                      }}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-background text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none"
                    >
                      {scheduleDrafts.map((draft) => (
                        <option key={draft.id} value={draft.id}>
                          {draft.name} - {draft.status}
                        </option>
                      ))}
                    </select>
                    <FaChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                  </div>
                  {selectedDraft && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Last Updated: {new Date(selectedDraft.lastUpdated).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Search */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Search Courses
                  </label>
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by course code, name, or instructor..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-background text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Course Schedule Display */}
            <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
              
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200 dark:border-border">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                  {selectedDraft ? `${selectedDraft.name} (${selectedDraft.status.charAt(0).toUpperCase() + selectedDraft.status.slice(1)} - ${selectedDraft.semester})` : 'Course Schedule'}
                </h2>
              </div>

              {/* Content */}
              <div className="p-6">
                {loadingSchedules ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading course schedules...</p>
                    </div>
                  </div>
                ) : filteredCourses.length > 0 ? (
                  <div className="space-y-8">
                    {sortedDays.map((day) => (
                      <div key={day}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4 flex items-center gap-2">
                          <FaCalendarAlt className="w-5 h-5 text-primary" />
                          {day}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {groupedCourses[day].map((course) => (
                            <div
                              key={course.id}
                              className="border border-gray-200 dark:border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                              style={{ borderLeftColor: course.color, borderLeftWidth: '4px' }}
                            >
                              <div className="space-y-2">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-foreground">
                                      {course.code}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                      {course.name}
                                    </p>
                                  </div>
                                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                    {course.section}
                                  </span>
                                </div>
                                
                                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                  <div className="flex items-center gap-2">
                                    <FaClock className="w-3 h-3" />
                                    {course.time}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FaUser className="w-3 h-3" />
                                    {course.instructor}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <FaBook className="w-3 h-3" />
                                    {course.credits} credits • {course.room}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                                  <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                    {course.category}
                                  </span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
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
                  <div className="text-center py-16">
                    <FaBook className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                      {searchTerm ? 'No courses found' : 'No courses scheduled'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm 
                        ? 'Try adjusting your search terms or clear the search to see all courses.'
                        : 'No courses have been scheduled for this semester yet.'}
                    </p>
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <FaCalendarAlt className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                      Select a schedule to view courses
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Choose an available class schedule from the dropdown above.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Info */}
            {selectedDraft && filteredCourses.length > 0 && (
              <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
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
