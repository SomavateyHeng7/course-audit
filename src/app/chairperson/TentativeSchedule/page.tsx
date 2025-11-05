'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { FaSearch, FaPlus, FaTrash, FaSave } from 'react-icons/fa';
import { useToastHelpers } from '@/hooks/useToast';
import CourseDetailForm from '@/components/schedule/CourseDetailForm';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description?: string;
  category?: string;
}

interface ScheduleData {
  name: string;
  semester: string;
  version: string;
  courses: Course[];
}

const TentativeSchedulePage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError, warning } = useToastHelpers();

  const [schedule, setSchedule] = useState<ScheduleData>({
    name: '',
    semester: '',
    version: '',
    courses: []
  });

  const [courseSearch, setCourseSearch] = useState('');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCourseDetailModal, setShowCourseDetailModal] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth');
    else if (session.user.role !== 'CHAIRPERSON') router.push('/dashboard');
  }, [session, status, router]);

  useEffect(() => {
    if (session && session.user.role === 'CHAIRPERSON') loadAvailableCourses();
  }, [session]);

  useEffect(() => {
    if (!courseSearch.trim()) setFilteredCourses(availableCourses);
    else {
      const filtered = availableCourses.filter(course =>
        course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.name.toLowerCase().includes(courseSearch.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [courseSearch, availableCourses]);

  const loadAvailableCourses = async () => {
    setLoading(true);
    try {
      const mockCourses: Course[] = [
        { id: '1', code: 'CSX3003', name: 'Data Structure', credits: 3, category: 'Core' },
        { id: '2', code: 'CSX3001', name: 'Database Systems', credits: 3, category: 'Core' },
        { id: '3', code: 'CSX3002', name: 'Software Engineering', credits: 3, category: 'Core' },
        { id: '4', code: 'CSX3004', name: 'Computer Networks', credits: 3, category: 'Core' },
        { id: '5', code: 'CSX4001', name: 'Machine Learning', credits: 3, category: 'Elective' },
        { id: '6', code: 'CSX4002', name: 'Web Development', credits: 3, category: 'Elective' }
      ];
      setAvailableCourses(mockCourses);
      setFilteredCourses(mockCourses);
    } catch {
      showError('Error loading courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = (course: Course) => {
    if (schedule.courses.some(selected => selected.id === course.id)) {
      warning('Course already added');
      return;
    }
    setSelectedCourseForDetail(course);
    setShowCourseDetailModal(true);
  };

  const handleCourseDetailSave = () => {
    if (!selectedCourseForDetail) return;
    setSchedule(prev => ({
      ...prev,
      courses: [...prev.courses, selectedCourseForDetail]
    }));
    success(`${selectedCourseForDetail.code} added`);
    setShowCourseDetailModal(false);
    setSelectedCourseForDetail(null);
  };

  const handleRemoveCourse = (id: string) => {
    setSchedule(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== id)
    }));
    success('Course removed');
  };

  const handleSaveSchedule = async () => {
    if (!schedule.name || !schedule.semester || !schedule.version || schedule.courses.length === 0) {
      showError('Please complete all fields and select at least one course.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    success('Schedule saved successfully!');
    setSchedule({ name: '', semester: '', version: '', courses: [] });
    setLoading(false);
  };

  if (status === 'loading')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );

  if (!session || session.user.role !== 'CHAIRPERSON') return null;

  return (
    <div className="flex min-h-screen px-2 sm:px-4 py-2 sm:py-4">
      <div className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900 dark:text-white">
            🎓 Create Tentative Schedule
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm sm:text-base">Plan, review, and finalize course schedules.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-10 p-3 sm:p-4 lg:p-8">
          {/* Left: Form + Course List */}
          <div className="space-y-4 sm:space-y-6 lg:space-y-10">
            {/* Basic Info */}
            <div className="bg-gray-100/50 dark:bg-gray-700/30 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl space-y-3 sm:space-y-4">
              {['name', 'semester', 'version'].map(field => (
                <div key={field}>
                  <label className="block text-xs sm:text-sm font-medium capitalize text-gray-700 dark:text-gray-300 mb-1 sm:mb-2">
                    {field}
                  </label>
                  <input
                    type="text"
                    value={(schedule as any)[field]}
                    onChange={e => setSchedule(prev => ({ ...prev, [field]: e.target.value }))}
                    placeholder={`Enter ${field}`}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none text-sm sm:text-base"
                  />
                </div>
              ))}
            </div>

            {/* Search Courses */}
            <div>
              <div className="relative mb-3 sm:mb-4">
                <FaSearch className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                <input
                  type="text"
                  value={courseSearch}
                  onChange={e => setCourseSearch(e.target.value)}
                  placeholder="Search courses..."
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-teal-500 outline-none text-sm sm:text-base"
                />
              </div>

              <div className="h-64 sm:h-72 lg:h-80 overflow-y-auto bg-gray-50 dark:bg-gray-700/20 rounded-lg border border-gray-200 dark:border-gray-700 p-1 sm:p-2">
                {loading ? (
                  <p className="text-center py-4 sm:py-6 text-gray-500 dark:text-gray-400 text-sm sm:text-base">Loading courses...</p>
                ) : filteredCourses.length > 0 ? (
                  filteredCourses.map(course => (
                    <div
                      key={course.id}
                      className="flex flex-col xs:flex-row xs:justify-between xs:items-center bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 mb-2 shadow-sm hover:shadow-md transition gap-2 xs:gap-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{course.code}</p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{course.name}</p>
                      </div>
                      <button
                        onClick={() => handleAddCourse(course)}
                        disabled={schedule.courses.some(c => c.id === course.id)}
                        className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-teal-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition touch-manipulation shrink-0"
                      >
                        <FaPlus className="w-3 h-3" /> 
                        <span className="hidden xs:inline">Add</span>
                        <span className="xs:hidden">+</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-4 sm:py-6 text-gray-500 dark:text-gray-400 text-sm sm:text-base">No courses found</p>
                )}
              </div>
            </div>
          </div>

          {/* Right: Selected Courses */}
          <div className="lg:sticky lg:top-8 space-y-4 sm:space-y-6">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">Selected Courses</h3>

            <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 min-h-[300px] sm:min-h-[400px]">
              {schedule.courses.length > 0 ? (
                schedule.courses.map(course => (
                  <div
                    key={course.id}
                    className="flex flex-col xs:flex-row xs:justify-between xs:items-center p-2 sm:p-3 mb-2 rounded-lg bg-white dark:bg-gray-800 hover:shadow transition gap-2 xs:gap-0"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">{course.code}</p>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{course.name}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCourse(course.id)}
                      className="p-1.5 sm:p-2 text-red-500 hover:text-red-700 transition touch-manipulation self-end xs:self-auto shrink-0"
                    >
                      <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 text-center px-4">
                  <p className="text-sm sm:text-base">No courses selected yet</p>
                  <p className="text-xs sm:text-sm mt-1">Search and add courses on the left</p>
                </div>
              )}
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveSchedule}
              disabled={loading || !schedule.name || !schedule.semester || !schedule.version || schedule.courses.length === 0}
              className="w-full py-2.5 sm:py-3 flex items-center justify-center gap-2 bg-teal-600 text-white text-base sm:text-lg font-medium rounded-lg hover:bg-teal-700 disabled:opacity-50 transition touch-manipulation"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                  <span className="text-sm sm:text-base">Saving...</span>
                </>
              ) : (
                <>
                  <FaSave className="w-4 h-4 sm:w-5 sm:h-5" /> 
                  <span className="text-sm sm:text-base">Save Schedule</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CourseDetailForm
        isOpen={showCourseDetailModal}
        courseName={selectedCourseForDetail?.name}
        courseCode={selectedCourseForDetail?.code}
        onSave={handleCourseDetailSave}
        onCancel={() => setShowCourseDetailModal(false)}
      />
    </div>
  );
};

export default TentativeSchedulePage;
