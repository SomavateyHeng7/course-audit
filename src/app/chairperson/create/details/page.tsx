"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface ParsedCourse {
  code: string;
  title: string;
  credits: number;
  description: string;
  creditHours: string;
  category?: string;
  requirement?: 'Required' | 'Elective';
}

interface CurriculumInfo {
  name: string;
  totalCredits: string;
  idStart: string;
  idEnd: string;
  fileName: string;
  courseCount?: number;
}

export default function CurriculumDetails() {
  const router = useRouter();
  const { data: session } = useSession();
  const [courses, setCourses] = useState<ParsedCourse[]>([]);
  const [curriculumInfo, setCurriculumInfo] = useState<CurriculumInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // Course categories based on your requirements
  const categories = ['Core', 'Major', 'Major Elective', 'General Education', 'Free Elective'];
  const allCategories = ['All', ...categories];

  useEffect(() => {
    // Load data from sessionStorage
    const storedCourses = sessionStorage.getItem('uploadedCourses');
    const storedInfo = sessionStorage.getItem('curriculumInfo');

    if (storedCourses && storedInfo) {
      const parsedCourses = JSON.parse(storedCourses);
      const parsedInfo = JSON.parse(storedInfo);
      
      // Auto-assign categories and requirements based on naming patterns
      const coursesWithDefaults = parsedCourses.map((course: ParsedCourse) => ({
        ...course,
        category: autoAssignCategory(course),
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

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      const result = await response.json();
      
      if (response.ok && result.departments) {
        setDepartments(result.departments);
        // Auto-select first department if only one exists
        if (result.departments.length === 1) {
          setSelectedDepartmentId(result.departments[0].id);
        }
      } else {
        console.error('Failed to fetch departments:', result.error);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  // Auto-assignment logic based on course patterns
  const autoAssignCategory = (course: ParsedCourse): string => {
    const code = course.code.toUpperCase();
    const title = course.title.toLowerCase();
    
    if (code.startsWith('ELE') || title.includes('english') || title.includes('communication')) {
      return 'General Education';
    }
    if (code.startsWith('CSX 1') || code.startsWith('CSX 2') || title.includes('fundamental') || title.includes('introduction')) {
      return 'Core';
    }
    if (code.startsWith('CSX 3') || code.startsWith('ITX')) {
      return 'Major';
    }
    if (code.startsWith('CSX 4') || title.includes('elective')) {
      return 'Major Elective';
    }
    if (code.startsWith('FREE') || title.includes('free')) {
      return 'Free Elective';
    }
    
    return 'Major'; // Default
  };

  const autoAssignRequirement = (course: ParsedCourse): 'Required' | 'Elective' => {
    const title = course.title.toLowerCase();
    const category = autoAssignCategory(course);
    
    // Auto-determine based on category and title
    if (category.includes('Elective') || title.includes('elective')) {
      return 'Elective';
    }
    return 'Required';
  };

  const updateCourse = (index: number, field: keyof ParsedCourse, value: string) => {
    setCourses(prev => prev.map((course, i) => 
      i === index ? { ...course, [field]: value } : course
    ));
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveCurriculum = async () => {
    if (!curriculumInfo || courses.length === 0) {
      alert('Missing curriculum information or courses');
      return;
    }

    if (!selectedDepartmentId) {
      alert('Please select a department');
      return;
    }

    if (!session?.user?.faculty?.id) {
      alert('User faculty information not available');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: curriculumInfo.name,
        year: new Date().getFullYear().toString(), // Use current year
        version: '1.0',
        description: `Curriculum containing ${courses.length} courses`,
        departmentId: selectedDepartmentId,
        facultyId: session.user.faculty.id,
        courses: courses.map((course, index) => ({
          code: course.code,
          name: course.title, // Map title to name
          credits: course.credits,
          creditHours: course.creditHours || `${course.credits}-0-${course.credits * 2}`,
          description: course.description || '',
          category: course.category || 'Major',
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
        throw new Error(result.error?.message || `HTTP ${response.status}: ${result.error || 'Failed to create curriculum'}`);
      }

      console.log('Curriculum created successfully:', result);
      
      // Clear session storage
      sessionStorage.removeItem('uploadedCourses');
      sessionStorage.removeItem('curriculumInfo');
      
      alert('Curriculum created successfully!');
      router.push('/chairperson');

    } catch (error) {
      console.error('Error creating curriculum:', error);
      alert(`Error creating curriculum: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedCourseData = () => {
    if (!selectedCourse) return null;
    return courses.find(course => course.code === selectedCourse);
  };

  const getCategoryStats = () => {
    return categories.map(category => {
      const categoryC0urses = courses.filter(c => c.category === category);
      const totalCredits = categoryC0urses.reduce((sum, c) => sum + c.credits, 0);
      const requiredCount = categoryC0urses.filter(c => c.requirement === 'Required').length;
      const electiveCount = categoryC0urses.filter(c => c.requirement === 'Elective').length;
      
      return {
        category,
        courses: categoryC0urses.length,
        credits: totalCredits,
        required: requiredCount,
        elective: electiveCount
      };
    });
  };

  const quickAssignByCategory = (category: string, requirement: 'Required' | 'Elective') => {
    setCourses(prev => prev.map(course => 
      course.category === category ? { ...course, requirement } : course
    ));
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
      <div className="container mx-auto p-6">
        <div className="max-w-7xl mx-auto">          {/* Header */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {curriculumInfo.name} ({curriculumInfo.idStart} - {curriculumInfo.idEnd})
              </h1>
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span>Total Credits: {curriculumInfo.totalCredits}</span>
                <span>Courses: {courses.length}</span>
                <span>File: {curriculumInfo.fileName}</span>
              </div>
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Auto-Assignment:</strong> Course categories and requirements have been automatically assigned based on course codes and titles. 
                  You can modify them below or use quick actions for bulk updates.
                </p>
              </div>
            </div>
          </div>

          {/* Department Selection */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Department Selection</h2>
            <div className="max-w-md">
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Department
              </label>
              <select
                value={selectedDepartmentId}
                onChange={(e) => setSelectedDepartmentId(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                required
              >
                <option value="">Choose a department...</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              {departments.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Loading departments...
                </p>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex gap-6">
            {/* Left Panel - Course List */}
            <div className="w-2/3 bg-card rounded-xl border border-border p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-foreground">Course Assignment</h2>
                <span className="text-sm text-muted-foreground">
                  {filteredCourses.length} of {courses.length} courses
                </span>
              </div>

              {/* Filters */}
              <div className="flex gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>              {/* Course List */}
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-2 border-b border-border">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground">
                    <div className="col-span-3">Course Code</div>
                    <div className="col-span-4">Course Title</div>
                    <div className="col-span-1">Credits</div>
                    <div className="col-span-2">Category</div>
                    <div className="col-span-2">Requirement</div>
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
                        className={`grid grid-cols-12 gap-4 p-3 border-b border-border cursor-pointer transition-all items-center ${
                          isSelected 
                            ? 'bg-primary/5 border-l-4 border-l-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        {/* Course Code */}
                        <div className="col-span-3">
                          <div className="font-semibold text-sm text-foreground">{course.code}</div>
                          <div className="text-xs text-muted-foreground">{course.creditHours}</div>
                        </div>
                        
                        {/* Course Title */}
                        <div className="col-span-4">
                          <div className="text-sm text-foreground line-clamp-2">{course.title}</div>
                          {course.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {course.description}
                            </div>
                          )}
                        </div>
                        
                        {/* Credits */}
                        <div className="col-span-1">
                          <div className="text-sm font-medium text-center">{course.credits}</div>
                        </div>
                        
                        {/* Category */}
                        <div className="col-span-2">
                          <select
                            value={course.category || 'Major'}
                            onChange={(e) => updateCourse(originalIndex, 'category', e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs border border-input rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Requirement */}
                        <div className="col-span-2">
                          <select
                            value={course.requirement || 'Required'}
                            onChange={(e) => updateCourse(originalIndex, 'requirement', e.target.value as 'Required' | 'Elective')}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-xs border border-input rounded px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
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
            </div>            {/* Right Panel - Course Details and Statistics */}
            <div className="w-1/3 space-y-6">              {/* Course Details */}
              {selectedCourse && getSelectedCourseData() && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">Course Details</h3>
                  <div className="space-y-4">
                    {/* Course Header */}
                    <div className="pb-3 border-b border-border">
                      <div className="font-bold text-lg text-foreground">{getSelectedCourseData()?.code}</div>
                      <div className="text-muted-foreground text-sm leading-relaxed">{getSelectedCourseData()?.title}</div>
                    </div>
                    
                    {/* Course Metrics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Credits</div>
                        <div className="text-lg font-bold text-foreground">{getSelectedCourseData()?.credits}</div>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Credit Hours</div>
                        <div className="text-sm font-medium text-foreground">{getSelectedCourseData()?.creditHours}</div>
                      </div>
                    </div>
                    
                    {/* Course Classification */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Category:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          getSelectedCourseData()?.category === 'Core' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                            : getSelectedCourseData()?.category === 'Major'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                            : getSelectedCourseData()?.category === 'Major Elective'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            : getSelectedCourseData()?.category === 'General Education'
                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {getSelectedCourseData()?.category}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Requirement:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
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
                        <div className="text-sm font-medium text-foreground mb-2">Course Description</div>
                        <div className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">
                          {getSelectedCourseData()?.description}
                        </div>
                      </div>
                    )}
                    
                    {/* Auto-Assignment Info */}
                    <div className="pt-3 border-t border-border">
                      <div className="text-xs text-muted-foreground">
                        <div className="font-medium mb-1">Auto-Assignment Logic:</div>
                        <div className="space-y-1 text-xs">
                          <div>• Categories determined by course code patterns</div>
                          <div>• Requirements based on category and title keywords</div>
                          <div>• Manual adjustments can be made using dropdowns</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}{/* Additional Course Information */}
              {!selectedCourse && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4">Course Information</h3>
                  <div className="text-center text-muted-foreground py-8">
                    <div className="text-4xl mb-2">📋</div>
                    <div className="text-sm">
                      Select a course from the list to view detailed information
                    </div>
                  </div>
                </div>
              )}

              {/* Category Statistics */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="text-lg font-bold text-foreground mb-4">Category Statistics</h3>
                <div className="space-y-3">
                  {getCategoryStats().map(stat => (
                    <div key={stat.category} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{stat.category}</div>
                        <div className="text-xs text-muted-foreground">
                          {stat.required}R • {stat.elective}E
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-sm">{stat.credits} cr</div>
                        <div className="text-xs text-muted-foreground">{stat.courses} courses</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Save Button */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveCurriculum}
              disabled={isLoading || !selectedDepartmentId}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating Curriculum...' : 'Save Curriculum'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
