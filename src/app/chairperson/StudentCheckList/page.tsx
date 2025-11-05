'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, BarChart3, Calendar, Save, Search, Users, BookOpen, Award, GraduationCap } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';

// Import chairperson components
import { PageHeader } from '@/components/chairperson/PageHeader';
import { SearchBar } from '@/components/chairperson/SearchBar';
import { DataTable } from '@/components/chairperson/DataTable';
import { LoadingSpinner } from '@/components/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/chairperson/EmptyState';
import { StatCard } from '@/components/chairperson/StatCard';
import { ActionButton } from '@/components/chairperson/ActionButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FaCalendarAlt, FaChartBar, FaSave, FaSearch, FaUser } from "react-icons/fa";

interface Student {
  id: string;
  name: string;
  email: string;
  studentId: string;
  department: string;
  year: number;
  gpa?: number;
  credits?: number;
  totalCreditsRequired?: number;
}

interface PlannedCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: string;
  isCompleted: boolean;
}

interface AcademicProgress {
  totalCredits: number;
  totalCreditsRequired: number;
  completedCourses: number;
  totalCourses: number;
  gpa: number;
  currentSemester: number;
  graduationProgress: number; // percentage
}

const StudentManagementPage: React.FC = () => {
  // Authentication
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError, warning, info } = useToastHelpers();

  // State management
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [academicProgress, setAcademicProgress] = useState<AcademicProgress | null>(null);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

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

  // Load students
  useEffect(() => {
    if (session && session.user.role === 'CHAIRPERSON') {
      loadStudents();
    }
  }, [session]);

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

  const loadStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/students');
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      } else {
        console.error('Failed to load students');
        showError('Failed to load students');
      }
    } catch (error) {
      console.error('Error loading students:', error);
      showError('Error loading students. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAcademicProgress = async (studentId: string) => {
    try {
      setLoadingProgress(true);
      const response = await fetch(`/api/students/${studentId}/progress`);
      
      if (response.ok) {
        const data = await response.json();
        setAcademicProgress(data);
      } else {
        console.error('Failed to load academic progress');
        showError('Failed to load student academic progress');
      }
    } catch (error) {
      console.error('Error loading academic progress:', error);
      showError('Error loading academic progress. Please try again.');
    } finally {
      setLoadingProgress(false);
    }
  };

  const loadPlannedCourses = async (studentId: string) => {
    try {
      setLoadingCourses(true);
      const response = await fetch(`/api/students/${studentId}/planned-courses`);
      
      if (response.ok) {
        const data = await response.json();
        setPlannedCourses(data.courses || []);
      } else {
        console.error('Failed to load planned courses');
        showError('Failed to load student planned courses');
      }
    } catch (error) {
      console.error('Error loading planned courses:', error);
      showError('Error loading planned courses. Please try again.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleStudentSelect = async (student: Student) => {
    setSelectedStudent(student);
    setAcademicProgress(null);
    setPlannedCourses([]);

    // Load student's academic progress and planned courses
    await Promise.all([
      loadAcademicProgress(student.id),
      loadPlannedCourses(student.id)
    ]);
  };

  const handleSave = async () => {
    if (!selectedStudent) {
      showError('Please select a student first');
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch(`/api/students/${selectedStudent.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plannedCourses: plannedCourses.map(course => ({
            courseId: course.id,
            semester: course.semester
          }))
        }),
      });

      if (response.ok) {
        success('Student information updated successfully!');
      } else {
        const errorData = await response.json();
        showError(errorData.error?.message || 'Failed to update student information');
      }
    } catch (error) {
      console.error('Error saving student information:', error);
      showError('Error saving student information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter students based on search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Student Management"
          description="Monitor student progress and academic planning for next semester"
          backButton={{
            label: "Back to Dashboard",
            onClick: () => router.back()
          }}
          actions={[
            {
              label: "Save Changes",
              onClick: handleSave,
              disabled: !selectedStudent || loading,
              icon: <Save size={16} />
            }
          ]}
        />

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Total Students"
            value={students.length}
            subtitle="Enrolled students"
            icon={<Users size={20} />}
          />
          <StatCard
            title="Selected"
            value={selectedStudent ? "1" : "0"}
            subtitle="Student selected"
            icon={<User size={20} />}
          />
          <StatCard
            title="Avg Progress"
            value={selectedStudent && academicProgress ? `${academicProgress.graduationProgress}%` : "N/A"}
            subtitle="Graduation progress"
            icon={<GraduationCap size={20} />}
          />
          <StatCard
            title="Current GPA"
            value={selectedStudent && academicProgress ? academicProgress.gpa.toFixed(2) : "N/A"}
            subtitle="Academic performance"
            icon={<Award size={20} />}
          />
        </div>

          <div className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              
              {/* Left Column - Student Selection */}
              <div className="lg:col-span-1">
                <div className="space-y-3 sm:space-y-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-foreground flex items-center gap-2">
                    <FaUser className="w-4 h-4 sm:w-5 sm:h-5" />
                    Students Name
                  </h2>
                  
                  {/* Search */}
                  <div className="relative">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search students..."
                      className="w-full pl-8 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-gray-300 dark:border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-white dark:bg-background text-gray-900 dark:text-foreground text-sm sm:text-base"
                    />
                  </div>

                  {/* Students List */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-border max-h-64 sm:max-h-80 lg:max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-3 sm:p-4 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                        Loading students...
                      </div>
                    ) : filteredStudents.length > 0 ? (
                      <div className="divide-y divide-gray-200 dark:divide-border">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            onClick={() => handleStudentSelect(student)}
                            className={`p-3 sm:p-4 cursor-pointer transition-colors hover:bg-white dark:hover:bg-gray-700 touch-manipulation ${
                              selectedStudent?.id === student.id 
                                ? 'bg-primary/10 border-l-4 border-primary' 
                                : ''
                            }`}
                          >
                            <div className="font-medium text-gray-900 dark:text-foreground text-sm sm:text-base">
                              {student.name}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              ID: {student.studentId}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {student.department} • Year {student.year}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 text-center text-gray-500 dark:text-gray-400 text-sm sm:text-base">
                        {searchTerm ? 'No students found matching your search' : 'No students available'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Student Details */}
              <div className="lg:col-span-2">
                {selectedStudent ? (
                  <div className="space-y-4 sm:space-y-6">
                    
                    {/* Academic Progress Section */}
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-foreground flex items-center gap-2 mb-3 sm:mb-4">
                        <FaChartBar className="w-4 h-4 sm:w-5 sm:h-5" />
                        Academic Progress
                      </h2>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-border p-3 sm:p-4 lg:p-6">
                        {loadingProgress ? (
                          <div className="flex items-center justify-center h-24 sm:h-32">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : academicProgress ? (
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* GPA */}
                            <div className="text-center bg-white dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
                              <div className="text-xl sm:text-2xl font-bold text-primary">
                                {academicProgress.gpa?.toFixed(2) || 'N/A'}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">GPA</div>
                            </div>
                            
                            {/* Credits Progress */}
                            <div className="text-center bg-white dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
                              <div className="text-xl sm:text-2xl font-bold text-green-600">
                                {academicProgress.totalCredits} / {academicProgress.totalCreditsRequired}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Credits</div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-green-600 h-2 rounded-full transition-all"
                                  style={{ 
                                    width: `${Math.min((academicProgress.totalCredits / academicProgress.totalCreditsRequired) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Courses Progress */}
                            <div className="text-center bg-white dark:bg-gray-700/50 rounded-lg p-3 sm:p-4">
                              <div className="text-xl sm:text-2xl font-bold text-blue-600">
                                {academicProgress.completedCourses} / {academicProgress.totalCourses}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Courses</div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ 
                                    width: `${Math.min((academicProgress.completedCourses / academicProgress.totalCourses) * 100, 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8">
                            <FaChartBar className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                            <p className="text-sm sm:text-base">No academic progress data available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Planned Courses Section */}
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-foreground flex items-center gap-2 mb-3 sm:mb-4">
                        <FaCalendarAlt className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Student's Planned Courses for next semester</span>
                        <span className="sm:hidden">Planned Courses</span>
                      </h2>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-border">
                        {loadingCourses ? (
                          <div className="flex items-center justify-center h-24 sm:h-32">
                            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary"></div>
                          </div>
                        ) : plannedCourses.length > 0 ? (
                          <div className="divide-y divide-gray-200 dark:divide-border">
                            {plannedCourses.map((course) => (
                              <div key={course.id} className="p-3 sm:p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-foreground text-sm sm:text-base truncate">
                                      {course.code} - {course.name}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {course.credits} credits • {course.semester}
                                    </div>
                                  </div>
                                  <div className="flex items-center shrink-0">
                                    {course.isCompleted ? (
                                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                        Completed
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                        Planned
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 dark:text-gray-400 py-6 sm:py-8">
                            <FaCalendarAlt className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                            <p className="text-sm sm:text-base">No planned courses for next semester</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 min-h-[200px] sm:min-h-[300px]">
                    <div className="text-center px-4">
                      <FaUser className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 opacity-50" />
                      <p className="text-base sm:text-lg font-medium mb-2">Select a student to view their information</p>
                      <p className="text-xs sm:text-sm">Choose a student from the list on the left</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            {selectedStudent && (
              <div className="mt-6 sm:mt-8 flex justify-center sm:justify-end">
                <button
                  onClick={handleSave}
                  disabled={loading || !selectedStudent}
                  className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors touch-manipulation text-sm sm:text-base w-full sm:w-auto max-w-xs sm:max-w-none"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span className="hidden xs:inline">Saving...</span>
                      <span className="xs:hidden">...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-3 h-3 sm:w-4 sm:h-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default StudentManagementPage;
