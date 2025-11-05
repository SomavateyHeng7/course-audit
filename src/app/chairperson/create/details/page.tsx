"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useToastHelpers } from '@/hooks/useToast';

interface ParsedCourse {
  code: string;
  title: string;
  credits: number;
  description: string;
  creditHours: string;
  requirement?: 'Required' | 'Elective';
}

interface CurriculumInfo {
  name: string;
  year: string;
  totalCredits: string;
  idStart: string;
  idEnd: string;
  fileName: string;
  courseCount?: number;
}

export default function CurriculumDetails() {
  const router = useRouter();
  const { data: session } = useSession();
  const { success, error: showError, warning, info } = useToastHelpers();
  const [courses, setCourses] = useState<ParsedCourse[]>([]);
  const [curriculumInfo, setCurriculumInfo] = useState<CurriculumInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());
  const [showBatchAssignment, setShowBatchAssignment] = useState(false);

  useEffect(() => {
    // Load data from sessionStorage
    const storedCourses = sessionStorage.getItem('uploadedCourses');
    const storedInfo = sessionStorage.getItem('curriculumInfo');

    if (storedCourses && storedInfo) {
      const parsedCourses = JSON.parse(storedCourses);
      const parsedInfo = JSON.parse(storedInfo);
      
      // Auto-assign requirements based on naming patterns
      const coursesWithDefaults = parsedCourses.map((course: ParsedCourse) => ({
        ...course,
        requirement: autoAssignRequirement(course)
      }));
      
      setCourses(coursesWithDefaults);
      setCurriculumInfo(parsedInfo);
    } else {
      // Redirect back if no data
      router.push('/chairperson/create');
    }

    // Fetch departments for user's faculty
    if (session?.user?.faculty?.id) {
      fetchDepartments();
    }
  }, [router, session]);

  // Fetch course types when department changes
  useEffect(() => {
    if (selectedDepartmentId) {
      fetchCourseTypes(selectedDepartmentId);
    }
  }, [selectedDepartmentId]);

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      const response = await fetch('/api/departments');
      const result = await response.json();
      
      console.log('Departments response:', { status: response.status, result });
      
      if (response.ok && result.departments) {
        console.log('Setting departments:', result.departments);
        setDepartments(result.departments);
        
        // 🆕 Smart default: Auto-select user's department if available
        if (session?.user?.departmentId) {
          const userDepartment = result.departments.find((dept: any) => dept.id === session.user.departmentId);
          if (userDepartment) {
            console.log('Auto-selecting user department:', userDepartment.name);
            setSelectedDepartmentId(session.user.departmentId);
            fetchCourseTypes(session.user.departmentId);
            return;
          }
        }
        
        // Fallback: Auto-select first department if only one exists
        if (result.departments.length === 1) {
          console.log('Auto-selecting single department:', result.departments[0].id);
          setSelectedDepartmentId(result.departments[0].id);
          fetchCourseTypes(result.departments[0].id);
        } else if (result.departments.length > 1) {
          console.log('Multiple departments found, user needs to select one');
        }
      } else {
        console.error('Failed to fetch departments:', result.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchCourseTypes = async (departmentId: string) => {
    console.log('fetchCourseTypes called with departmentId:', departmentId);
    
    if (!departmentId) {
      console.log('No department ID provided, clearing course types');
      setCourseTypes([]);
      return;
    }

    try {
      const url = `/api/course-types?departmentId=${departmentId}`;
      console.log('Fetching course types from:', url);
      
      const response = await fetch(url);
      const result = await response.json();
      
      console.log('Course types response:', { status: response.status, result });
      
      if (response.ok && result.courseTypes) {
        console.log('Setting course types:', result.courseTypes);
        setCourseTypes(result.courseTypes);
      } else {
        console.error('Failed to fetch course types:', result.error);
        setCourseTypes([]);
      }
    } catch (error) {
      console.error('Error fetching course types:', error);
      setCourseTypes([]);
    }
  };

  const autoAssignRequirement = (course: ParsedCourse): 'Required' | 'Elective' => {
    const title = course.title.toLowerCase();
    const code = course.code.toUpperCase();
    
    // Auto-determine based on title and code patterns
    if (title.includes('elective') || code.startsWith('FREE') || title.includes('free')) {
      return 'Elective';
    }
    return 'Required';
  };

  const updateCourse = (index: number, field: keyof ParsedCourse, value: string) => {
    setCourses(prev => prev.map((course, i) => 
      i === index ? { ...course, [field]: value } : course
    ));
  };

  const toggleCourseSelection = (courseCode: string) => {
    setSelectedCourses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(courseCode)) {
        newSet.delete(courseCode);
      } else {
        newSet.add(courseCode);
      }
      return newSet;
    });
  };

  const selectAllFilteredCourses = () => {
    const filteredCodes = filteredCourses.map(course => course.code);
    setSelectedCourses(new Set(filteredCodes));
  };

  const clearSelection = () => {
    setSelectedCourses(new Set());
  };

  const batchAssignRequirement = (requirement: 'Required' | 'Elective') => {
    setCourses(prev => prev.map(course => {
      if (selectedCourses.has(course.code)) {
        return { ...course, requirement };
      }
      return course;
    }));
    setSelectedCourses(new Set());
    setShowBatchAssignment(false);
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const handleSaveCurriculum = async () => {
    if (!curriculumInfo || courses.length === 0) {
      showError('Missing curriculum information or courses');
      return;
    }

    if (!selectedDepartmentId) {
      showError('Please select a department');
      return;
    }

    if (!session?.user?.faculty?.id) {
      showError('User faculty information not available');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: curriculumInfo.name,
        year: curriculumInfo.year, // Use year from form input
        version: '1.0',
        description: `Curriculum containing ${courses.length} courses`,
        startId: curriculumInfo.idStart,
        endId: curriculumInfo.idEnd,
        departmentId: selectedDepartmentId,
        facultyId: session.user.faculty.id,
        courses: courses.map((course, index) => ({
          code: course.code,
          name: course.title, // Map title to name
          credits: course.credits,
          creditHours: course.creditHours || `${course.credits}-0-${course.credits * 2}`,
          description: course.description || '',
          requiresPermission: false,
          summerOnly: false,
          requiresSeniorStanding: false,
          isRequired: course.requirement === 'Required',
          position: index,
        })),
        constraints: [], // TODO: Add constraint support
        electiveRules: [], // TODO: Add elective rules support
      };

      console.log('🚀 Creating curriculum with payload:');
      console.log('- Name:', payload.name);
      console.log('- Year:', payload.year);
      console.log('- Department ID:', payload.departmentId);
      console.log('- Faculty ID:', payload.facultyId);
      console.log('- Number of courses:', payload.courses.length);
      console.log('- First course:', payload.courses[0]);
      console.log('- Full payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('/api/curricula', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      // Check if response has content before parsing JSON
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response was:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }

      if (!response.ok) {
        const errorData = result.error || result;
        if (errorData.code === 'DUPLICATE_CURRICULUM') {
          showError(
            `${errorData.message}\n\nExisting curriculum: ${errorData.existingCurriculum?.name || 'Unknown'}\nPlease use a different year or ID range.`
          );
          return; // Don't throw error, just show message and return
        } else {
          throw new Error(errorData.message || `HTTP ${response.status}: ${errorData || 'Failed to create curriculum'}`);
        }
      }

      console.log('Curriculum created successfully:', result);
      
      // Clear session storage
      sessionStorage.removeItem('uploadedCourses');
      sessionStorage.removeItem('curriculumInfo');
      
      success('Curriculum created successfully!');
      router.push('/chairperson');

    } catch (error) {
      console.error('Error creating curriculum:', error);
      
      if (error instanceof Error) {
        showError(`Error creating curriculum: ${error.message}`);
      } else {
        showError('Error creating curriculum: Unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCourseData = () => {
    if (!selectedCourse) return null;
    return courses.find(course => course.code === selectedCourse);
  };

  const getRequirementStats = () => {
    const requirements = ['Required', 'Elective'];
    return requirements.map(requirement => {
      const reqCourses = courses.filter(c => c.requirement === requirement);
      const totalCredits = reqCourses.reduce((sum, c) => sum + c.credits, 0);
      
      return {
        requirement,
        courses: reqCourses.length,
        credits: totalCredits,
      };
    });
  };

  if (!curriculumInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading curriculum data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">          {/* Header */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 sm:mb-6">
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-foreground mb-2">
                {curriculumInfo.name} - {curriculumInfo.year} ({curriculumInfo.idStart} - {curriculumInfo.idEnd})
              </h1>
              <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 text-xs sm:text-sm text-muted-foreground">
                <span>Academic Year: {curriculumInfo.year}</span>
                <span>Total Credits: {curriculumInfo.totalCredits}</span>
                <span>Courses: {courses.length}</span>
                <span className="truncate">File: {curriculumInfo.fileName}</span>
              </div>
              {/* <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Auto-Assignment:</strong> Course categories and requirements have been automatically assigned based on course codes and titles. 
                  You can modify them below or use quick actions for bulk updates.
                </p>
              </div> */}
            </div>
          </div>

          {/* Department Selection */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4">Department Selection</h2>
            
            {/* Smart Default Info */}
            {session?.user?.departmentId && (
              <div className="mb-4 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 text-blue-600 dark:text-blue-400">ℹ️</div>
                  <span className="text-xs sm:text-sm font-medium text-blue-800 dark:text-blue-200">Default Department</span>
                </div>
                <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                  Creating curriculum for <strong>
                    {departments.find(d => d.id === session.user.departmentId)?.name || 'Your Department'}
                  </strong>. 
                  You can select a different department if needed.
                </p>
              </div>
            )}
            
            <div className="max-w-md">
              <label className="block text-xs sm:text-sm font-medium text-foreground mb-2">
                Select Department
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm sm:text-base"
                required
              >
                <option value="">Choose a department...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                    {session?.user?.departmentId === dept.id ? ' ⭐ Your Department' : ''}
                  </option>
                ))}
              </select>
              {selectedDepartmentId === "" && departments.length > 0 && (
                <p className="text-sm text-amber-600 mt-2">
                  ⚠️ Please select a department to load course types and enable course assignment.
                </p>
              )}
              {departments.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Loading departments...
                </p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
            {/* Left Panel - Course List */}
            <div className="w-full lg:w-2/3 bg-card rounded-xl border border-border p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-foreground">Course Assignment</h2>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {filteredCourses.length} of {courses.length} courses
                </span>
              </div>

              {!selectedDepartmentId ? (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">Please select a department first to view course assignment options.</p>
                </div>
              ) : (
                <>
                  {/* Debug Info */}
                  {/* <div className="bg-muted/50 rounded p-2 mb-4 text-xs">
                    <strong>Debug:</strong> Department ID: {selectedDepartmentId} | 
                    Course Types: {courseTypes.length}
                  </div> */}
              {/* Filters */}
              <div className="flex gap-3 sm:gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm sm:text-base"
                />
              </div>

              {/* Requirement Assignment Controls */}
              <div className="flex flex-wrap gap-2 mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                <button
                  onClick={selectAllFilteredCourses}
                  disabled={filteredCourses.length === 0}
                  className="px-2 sm:px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  Select All ({filteredCourses.length})
                </button>
                <button
                  onClick={clearSelection}
                  disabled={selectedCourses.size === 0}
                  className="px-2 sm:px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  Clear ({selectedCourses.size})
                </button>
                <button
                  onClick={() => setShowBatchAssignment(!showBatchAssignment)}
                  disabled={selectedCourses.size === 0}
                  className="px-2 sm:px-3 py-1 text-xs bg-accent text-accent-foreground rounded hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                >
                  Assign Requirements
                </button>
              </div>

              {/* Requirement Assignment Panel */}
              {showBatchAssignment && selectedCourses.size > 0 && (
                <div className="mb-4 p-3 sm:p-4 bg-card border border-border rounded-lg">
                  <h3 className="font-semibold mb-3 text-xs sm:text-sm">
                    Assign requirements to {selectedCourses.size} selected course{selectedCourses.size !== 1 ? 's' : ''}
                  </h3>
                  <div>
                    <label className="block text-xs font-medium mb-2">Requirement:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => batchAssignRequirement('Required')}
                        className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors touch-manipulation"
                      >
                        Required
                      </button>
                      <button
                        onClick={() => batchAssignRequirement('Elective')}
                        className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors touch-manipulation"
                      >
                        Elective
                      </button>
                    </div>
                  </div>
                </div>
              )}              {/* Course List */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-2 sm:px-4 py-2 border-b border-border">
                  <div className="flex gap-2 sm:gap-4 text-xs font-medium text-muted-foreground">
                    <div className="w-8 sm:w-10">Select</div>
                    <div className="flex-1">Course Code</div>
                    <div className="flex-[2] hidden sm:block">Course Title</div>
                    <div className="w-12 sm:w-16">Credits</div>
                    <div className="flex-1">Requirement</div>
                  </div>
                </div>
                <div className="max-h-[480px] overflow-y-auto">
                  {filteredCourses.map((course, index) => {
                    const originalIndex = courses.findIndex(c => c.code === course.code);
                    const isSelected = selectedCourse === course.code;
                    
                    return (
                      <div
                        key={course.code}
                        onClick={() => setSelectedCourse(course.code)}
                        className={`flex gap-2 sm:gap-4 p-2 sm:p-3 border-b border-border cursor-pointer transition-all items-center touch-manipulation ${
                          isSelected 
                            ? 'bg-primary/5 border-l-4 border-l-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="w-8 sm:w-10 flex justify-center">
                          <input
                            type="checkbox"
                            checked={selectedCourses.has(course.code)}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleCourseSelection(course.code);
                            }}
                            className="rounded border-border text-primary focus:ring-primary focus:ring-offset-0 h-3 w-3 sm:h-4 sm:w-4"
                          />
                        </div>
                        
                        {/* Course Code */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-xs sm:text-sm text-foreground truncate">{course.code}</div>
                          <div className="text-xs text-muted-foreground truncate sm:block hidden">{course.creditHours}</div>
                          {/* Mobile: Show title under code */}
                          <div className="text-xs text-foreground mt-1 line-clamp-2 sm:hidden">{course.title}</div>
                        </div>
                        
                        {/* Course Title - Desktop only */}
                        <div className="flex-[2] hidden sm:block min-w-0">
                          <div className="text-sm text-foreground line-clamp-2">{course.title}</div>
                          {course.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {course.description}
                            </div>
                          )}
                        </div>
                        
                        {/* Credits */}
                        <div className="w-12 sm:w-16">
                          <div className="text-xs sm:text-sm font-medium text-center">{course.credits}</div>
                        </div>
                        
                        {/* Requirement */}
                        <div className="flex-1 min-w-0">
                          <select
                            value={course.requirement || 'Required'}
                            onChange={(e) => updateCourse(originalIndex, 'requirement', e.target.value as 'Required' | 'Elective')}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs border border-input rounded px-1 sm:px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="Required">Required</option>
                            <option value="Elective">Elective</option>
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {filteredCourses.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <div className="text-4xl mb-2">📚</div>
                    <div>No courses found matching your search criteria</div>
                  </div>
                )}
              </div>
                </>
              )}
            </div>

            {/* Right Panel - Course Details and Statistics */}
            <div className="w-full lg:w-1/3 space-y-4 sm:space-y-6">              {/* Course Details */}
              {selectedCourse && getSelectedCourseData() && (
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-4">Course Details</h3>
                  <div className="space-y-3 sm:space-y-4">
                    {/* Course Header */}
                    <div className="pb-3 border-b border-border">
                      <div className="font-bold text-base sm:text-lg text-foreground">{getSelectedCourseData()?.code}</div>
                      <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{getSelectedCourseData()?.title}</div>
                    </div>
                    
                    {/* Course Metrics */}
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="bg-muted/30 rounded-lg p-2 sm:p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Credits</div>
                        <div className="text-base sm:text-lg font-bold text-foreground">{getSelectedCourseData()?.credits}</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-2 sm:p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Credit Hours</div>
                        <div className="text-xs sm:text-sm font-medium text-foreground">{getSelectedCourseData()?.creditHours}</div>
                      </div>
                    </div>
                    
                    {/* Course Classification */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs sm:text-sm text-muted-foreground">Requirement:</span>
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                          getSelectedCourseData()?.requirement === 'Required' 
                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {getSelectedCourseData()?.requirement}
                        </span>
                      </div>
                    </div>
                    
                    {/* Course Description */}
                    {getSelectedCourseData()?.description && (
                      <div className="pt-3 border-t border-border">
                        <div className="text-xs sm:text-sm font-medium text-foreground mb-2">Course Description</div>
                        <div className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-2 sm:p-3">
                          {getSelectedCourseData()?.description}
                        </div>
                      </div>
                    )}
                    
                    {/* Auto-Assignment Info */}
                    {/* <div className="pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium mb-1">Auto-Assignment Logic:</div>
                        <div className="space-y-1 text-xs">
                          <div>• Categories determined by course code patterns</div>
                          <div>• Requirements based on category and title keywords</div>
                          <div>• Manual adjustments can be made using dropdowns</div>
                        </div>
                      </div>
                    </div> */}
                  </div>
                </div>
              )}              {/* Additional Course Information */}
              {!selectedCourse && (
                <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-foreground mb-4">Course Information</h3>
                  <div className="text-center text-muted-foreground py-6 sm:py-8">
                    <div className="text-3xl sm:text-4xl mb-2">📋</div>
                    <div className="text-xs sm:text-sm">
                      Select a course from the list to view detailed information
                    </div>
                  </div>
                </div>
              )}

              {/* Requirement Statistics */}
              <div className="bg-card rounded-xl border border-border p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-foreground mb-4">Requirement Statistics</h3>
                <div className="space-y-2 sm:space-y-3">
                  {getRequirementStats().map(stat => (
                    <div key={stat.requirement} className="flex justify-between items-center p-2 sm:p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium text-xs sm:text-sm">{stat.requirement}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-xs sm:text-sm">{stat.credits} cr</div>
                        <div className="text-xs text-muted-foreground">{stat.courses} courses</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Save Button */}
          <div className="mt-4 sm:mt-6 flex justify-end">
            <button
              onClick={handleSaveCurriculum}
              disabled={isLoading || !selectedDepartmentId}
              className="bg-primary text-primary-foreground px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-primary/90 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation w-full sm:w-auto"
            >
              {isLoading ? 'Creating Curriculum...' : 'Save Curriculum'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
