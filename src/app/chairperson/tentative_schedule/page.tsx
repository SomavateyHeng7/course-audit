'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaPlus, FaSearch, FaTrash, FaSave } from 'react-icons/fa';
import { useToastHelpers } from '@/hooks/useToast';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  creditHours: string;
  description?: string;
  category?: string;
}

interface CourseScheduleDetail {
  section: string;
  day: string;
  startTime: string;
  endTime: string;
  instructor: string;
  seat: string;
  category: string;
  color: string;
}

interface ScheduleCourse extends Course {
  scheduleDetails?: CourseScheduleDetail;
}

interface ScheduleData {
  name: string;
  semester: string;
  version: string;
  courses: ScheduleCourse[];
}

const TentativeSchedulePage: React.FC = () => {
  // Authentication
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError, warning, info } = useToastHelpers();

  // Form state
  const [schedule, setSchedule] = useState<ScheduleData>({
    name: '',
    semester: '',
    version: '',
    courses: []
  });

  // Course search state
  const [courseSearch, setCourseSearch] = useState('');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Course detail modal state
  const [showCourseDetailModal, setShowCourseDetailModal] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);
  const [courseDetail, setCourseDetail] = useState<CourseScheduleDetail>({
    section: '',
    day: '',
    startTime: '',
    endTime: '',
    instructor: '',
    seat: '',
    category: '',
    color: '#6366f1'
  });

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth');
      return;
    }

    if (session.user.role !== 'CHAIRPERSON') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Load available courses
  useEffect(() => {
    if (session && session.user.role === 'CHAIRPERSON') {
      loadAvailableCourses();
    }
  }, [session]);

  // Course search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (courseSearch && courseSearch.trim().length >= 2) {
        handleCourseSearch(courseSearch);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [courseSearch]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not chairperson
  if (!session || session.user.role !== 'CHAIRPERSON') {
    return null;
  }

  const loadAvailableCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      
      if (response.ok) {
        const data = await response.json();
        setAvailableCourses(data.courses || []);
      } else {
        console.error('Failed to load courses');
        showError('Failed to load available courses');
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      showError('Error loading courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}&limit=10`);
      
      if (response.ok) {
        const data = await response.json();
        const results = data.courses || [];
        
        // Filter out already selected courses
        const filteredResults = results.filter((course: Course) => 
          !schedule.courses.some(selected => selected.id === course.id)
        );
        
        setSearchResults(filteredResults);
        setShowSearchResults(filteredResults.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching courses:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInputChange = (field: keyof Omit<ScheduleData, 'courses'>, value: string) => {
    setSchedule(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCourse = (course: Course) => {
    // Check if course is already selected
    if (schedule.courses.some(selected => selected.id === course.id)) {
      warning('Course is already selected');
      return;
    }

    // Open course detail modal
    setSelectedCourseForDetail(course);
    setShowCourseDetailModal(true);
    
    // Clear search
    setCourseSearch('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleSaveCourseDetail = () => {
    if (!selectedCourseForDetail) return;

    // Validate required fields
    if (!courseDetail.section.trim()) {
      showError('Please enter a section');
      return;
    }

    if (!courseDetail.day) {
      showError('Please select a day');
      return;
    }

    if (!courseDetail.startTime || !courseDetail.endTime) {
      showError('Please select start and end times');
      return;
    }

    if (!courseDetail.instructor.trim()) {
      showError('Please enter an instructor');
      return;
    }

    if (!courseDetail.seat.trim()) {
      showError('Please enter seat numbers');
      return;
    }

    // Add course with schedule details
    const courseWithDetails: ScheduleCourse = {
      ...selectedCourseForDetail,
      scheduleDetails: { ...courseDetail }
    };

    setSchedule(prev => ({
      ...prev,
      courses: [...prev.courses, courseWithDetails]
    }));

    // Reset modal state
    setShowCourseDetailModal(false);
    setSelectedCourseForDetail(null);
    setCourseDetail({
      section: '',
      day: '',
      startTime: '',
      endTime: '',
      instructor: '',
      seat: '',
      category: '',
      color: '#6366f1'
    });

    success(`Added ${selectedCourseForDetail.code} - ${selectedCourseForDetail.name} to schedule`);
  };

  const handleCancelCourseDetail = () => {
    setShowCourseDetailModal(false);
    setSelectedCourseForDetail(null);
    setCourseDetail({
      section: '',
      day: '',
      startTime: '',
      endTime: '',
      instructor: '',
      seat: '',
      category: '',
      color: '#6366f1'
    });
  };

  const handleRemoveCourse = (courseId: string) => {
    const courseToRemove = schedule.courses.find(c => c.id === courseId);
    if (!courseToRemove) return;

    if (!confirm(`Are you sure you want to remove "${courseToRemove.code} - ${courseToRemove.name}" from the schedule?`)) {
      return;
    }

    setSchedule(prev => ({
      ...prev,
      courses: prev.courses.filter(course => course.id !== courseId)
    }));

    success('Course removed from schedule');
  };

  const handleSaveSchedule = async () => {
    // Validate required fields
    if (!schedule.name.trim()) {
      showError('Please enter a schedule name');
      return;
    }

    if (!schedule.semester.trim()) {
      showError('Please enter a semester');
      return;
    }

    if (!schedule.version.trim()) {
      showError('Please enter a version');
      return;
    }

    if (schedule.courses.length === 0) {
      showError('Please select at least one course');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/tentative-schedules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: schedule.name.trim(),
          semester: schedule.semester.trim(),
          version: schedule.version.trim(),
          courseIds: schedule.courses.map(course => course.id)
        }),
      });

      if (response.ok) {
        success('Tentative schedule created successfully!');
        
        // Reset form
        setSchedule({
          name: '',
          semester: '',
          version: '',
          courses: []
        });
        
        // Optionally redirect to schedules list
        // router.push('/chairperson/schedules');
      } else {
        const errorData = await response.json();
        showError(errorData.error?.message || 'Failed to create schedule');
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      showError('Error saving schedule. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen ">
      <div className="flex-1 flex flex-col items-center py-4 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-6xl bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border">
          
          {/* Header */}
          <div className="border-b border-gray-200 dark:border-border px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">
              Create Tentative Schedule
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Chairperson can specify the courses to be offered in the next semester.
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Left Column - Form */}
              <div className="space-y-6">
                
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={schedule.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter schedule name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Semester *
                    </label>
                    <input
                      type="text"
                      value={schedule.semester}
                      onChange={(e) => handleInputChange('semester', e.target.value)}
                      placeholder="Enter semester"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Version *
                    </label>
                    <input
                      type="text"
                      value={schedule.version}
                      onChange={(e) => handleInputChange('version', e.target.value)}
                      placeholder="Enter version number (e.g. Draft1, Final2)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground"
                    />
                  </div>
                </div>

                {/* Course Search */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">
                    Choose Courses
                  </h3>
                  
                  <div className="relative">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        placeholder="Search courses..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground"
                      />
                    </div>

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {searchLoading ? (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                            Searching...
                          </div>
                        ) : searchResults.length > 0 ? (
                          searchResults.map((course) => (
                            <div
                              key={course.id}
                              className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-200 dark:border-border last:border-b-0 cursor-pointer"
                              onClick={() => handleAddCourse(course)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-foreground">
                                    {course.code}
                                  </div>
                                  <div className="text-sm text-gray-600 dark:text-gray-400">
                                    {course.name}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-500">
                                    {course.credits} credits
                                  </div>
                                </div>
                                <button className="ml-2 px-2 py-1 text-xs bg-primary text-white rounded">
                                  Add
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                            No courses found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Selected Courses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">
                  Selected Courses ({schedule.courses.length})
                </h3>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-border min-h-[400px]">
                  {schedule.courses.length > 0 ? (
                    <div className="divide-y divide-gray-200 dark:divide-border">
                      {schedule.courses.map((course) => (
                        <div key={course.id} className="p-4 flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-gray-900 dark:text-foreground">
                                {course.code}
                              </div>
                              {course.scheduleDetails && (
                                <div 
                                  className="w-3 h-3 rounded-full border"
                                  style={{ backgroundColor: course.scheduleDetails.color }}
                                  title={`Section: ${course.scheduleDetails.section}`}
                                ></div>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {course.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {course.credits} credits • {course.creditHours}
                            </div>
                            {course.scheduleDetails && (
                              <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Section {course.scheduleDetails.section} • {course.scheduleDetails.day} {course.scheduleDetails.startTime}-{course.scheduleDetails.endTime}
                                {course.scheduleDetails.instructor && ` • ${course.scheduleDetails.instructor}`}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveCourse(course.id)}
                            className="ml-2 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Remove course"
                          >
                            <FaTrash className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                      <div className="text-center">
                        <FaSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No courses selected yet</p>
                        <p className="text-sm">Search and add courses from the left panel</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSaveSchedule}
                disabled={loading || !schedule.name || !schedule.semester || !schedule.version || schedule.courses.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Course Detail Modal */}
        {showCourseDetailModal && selectedCourseForDetail && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-card rounded-xl w-full max-w-md border border-gray-200 dark:border-border shadow-2xl">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-border">
                <h3 className="text-lg font-bold text-gray-900 dark:text-foreground">
                  {selectedCourseForDetail.code} {selectedCourseForDetail.name}
                </h3>
                <button
                  onClick={handleCancelCourseDetail}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                
                {/* Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Section
                  </label>
                  <input
                    type="text"
                    value={courseDetail.section}
                    onChange={(e) => setCourseDetail(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="Enter section for this course"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground text-sm"
                  />
                </div>

                {/* Day and Time */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Day
                    </label>
                    <select
                      value={courseDetail.day}
                      onChange={(e) => setCourseDetail(prev => ({ ...prev, day: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground text-sm"
                    >
                      <option value="">Select Day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={courseDetail.startTime}
                      onChange={(e) => setCourseDetail(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      value={courseDetail.endTime}
                      onChange={(e) => setCourseDetail(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground text-sm"
                    />
                  </div>
                </div>

                {/* Instructor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Instructor
                  </label>
                  <input
                    type="text"
                    value={courseDetail.instructor}
                    onChange={(e) => setCourseDetail(prev => ({ ...prev, instructor: e.target.value }))}
                    placeholder="Enter the instructor for this course"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground text-sm"
                  />
                </div>

                {/* Seat */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seat
                  </label>
                  <input
                    type="text"
                    value={courseDetail.seat}
                    onChange={(e) => setCourseDetail(prev => ({ ...prev, seat: e.target.value }))}
                    placeholder="Enter seat numbers for this course"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground text-sm"
                  />
                </div>

                {/* Category and Color */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={courseDetail.category}
                      onChange={(e) => setCourseDetail(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="Enter Category Name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={courseDetail.color}
                        onChange={(e) => setCourseDetail(prev => ({ ...prev, color: e.target.value }))}
                        className="w-8 h-8 border border-gray-300 dark:border-border rounded cursor-pointer"
                      />
                      <div 
                        className="w-6 h-6 rounded border border-gray-300 dark:border-border"
                        style={{ backgroundColor: courseDetail.color }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-border">
                <button
                  onClick={handleCancelCourseDetail}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-background border border-gray-300 dark:border-border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCourseDetail}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TentativeSchedulePage;
