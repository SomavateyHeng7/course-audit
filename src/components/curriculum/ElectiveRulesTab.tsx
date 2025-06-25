'use client';

import { useState } from 'react';

interface ElectiveCourse {
  code: string;
  name: string;
  category: string;
  credits: number;
  requirement: 'Required' | 'Elective';
}

interface ElectiveRulesTabProps {}

export default function ElectiveRulesTab({}: ElectiveRulesTabProps) {
  const [electiveSearch, setElectiveSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [majorElectiveCredits, setMajorElectiveCredits] = useState('24');
  const [minGPA, setMinGPA] = useState('2.0');
  // Sample courses data - NOTE FOR BACKEND: 
  // Auto-determine requirement based on category name containing "elective"
  // Main categories: General Education, Core, Major, Major Elective, Free Elective
  const [electiveCourses, setElectiveCourses] = useState<ElectiveCourse[]>([
    { code: 'CSX 1001', name: 'Introduction to Computer Science', category: 'Core', credits: 3, requirement: 'Required' },
    { code: 'CSX 1002', name: 'Programming Fundamentals', category: 'Core', credits: 3, requirement: 'Required' },
    { code: 'CSX 2001', name: 'Data Structures', category: 'Major', credits: 3, requirement: 'Required' },
    { code: 'CSX 2002', name: 'Algorithms', category: 'Major', credits: 3, requirement: 'Required' },
    { code: 'CSX 3101', name: 'Mobile App Development', category: 'Major Elective', credits: 3, requirement: 'Elective' },
    { code: 'CSX 3102', name: 'Machine Learning', category: 'Major Elective', credits: 3, requirement: 'Elective' },
    { code: 'CSX 3103', name: 'Cybersecurity', category: 'Major Elective', credits: 3, requirement: 'Elective' },
    { code: 'GEN 1001', name: 'Philosophy', category: 'General Education', credits: 3, requirement: 'Required' },
    { code: 'GEN 1002', name: 'Psychology', category: 'General Education', credits: 3, requirement: 'Required' },
    { code: 'FREE 1001', name: 'Art Appreciation', category: 'Free Elective', credits: 3, requirement: 'Elective' },
    { code: 'FREE 1002', name: 'Music Theory', category: 'Free Elective', credits: 3, requirement: 'Elective' },
  ]);  const updateCourseRequirement = (courseIndex: number, requirement: 'Required' | 'Elective') => {
    setElectiveCourses(prev => 
      prev.map((course, idx) => 
        idx === courseIndex ? { ...course, requirement } : course
      )
    );
  };

  const categories = ['All', 'Core', 'Major', 'Major Elective', 'General Education', 'Free Elective'];
  const filteredElectiveCourses = electiveCourses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(electiveSearch.toLowerCase()) ||
                         course.name.toLowerCase().includes(electiveSearch.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || course.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const getSelectedCourseData = () => {
    if (!selectedCourse) return null;
    return electiveCourses.find(course => course.code === selectedCourse);
  };
  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
      {/* Top Section: Course List and Requirements */}
      <div className="flex gap-8 mb-8">
        {/* Left Side - Course List */}
        <div className="w-1/2 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">Available Courses</h3>
          
          {/* Search Bar */}
          <div className="mb-4 space-y-3">
            <input
              type="text"
              placeholder="Search Courses..."
              value={electiveSearch}
              onChange={(e) => setElectiveSearch(e.target.value)}
              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
            />
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Course List */}
          <div className="space-y-2 overflow-y-auto max-h-[400px]">
            {filteredElectiveCourses.map((course) => {
              const originalIndex = electiveCourses.findIndex(c => c.code === course.code);
              const isSelected = selectedCourse === course.code;
              return (
                <div
                  key={course.code}
                  onClick={() => setSelectedCourse(course.code)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'border-gray-200 dark:border-border bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-sm text-foreground">{course.code}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.requirement === 'Required' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {course.requirement}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{course.name}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">{course.category}</span>
                    <span className="text-xs text-gray-500">{course.credits} credits</span>
                  </div>
                </div>
              );
            })}
            {filteredElectiveCourses.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                No courses found matching your criteria
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Course-Specific Elective Requirements */}
        <div className="w-1/2 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">Elective Requirements</h3>
          
          {selectedCourse ? (
            <div>
              {/* Selected Course Info */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-foreground mb-2">
                  {getSelectedCourseData()?.code} - {getSelectedCourseData()?.name}
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Category: {getSelectedCourseData()?.category} • Credits: {getSelectedCourseData()?.credits}
                </div>
              </div>

              {/* Course Requirements */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Requirement Status</label>
                  <select
                    value={getSelectedCourseData()?.requirement || 'Elective'}
                    onChange={(e) => {
                      const originalIndex = electiveCourses.findIndex(c => c.code === selectedCourse);
                      updateCourseRequirement(originalIndex, e.target.value as 'Required' | 'Elective');
                    }}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                  >
                    <option value="Required">Required Course</option>
                    <option value="Elective">Elective Course</option>
                  </select>
                </div>                {getSelectedCourseData()?.requirement === 'Elective' && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-foreground">Minimum GPA Requirement</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="4.0"
                      defaultValue="2.0"
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Minimum GPA required to enroll in this elective course
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Minimum Total Credits Required</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    defaultValue="60"
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum total credits a student must have completed to enroll in this elective
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-border">
                <button 
                  suppressHydrationWarning
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition border border-emerald-700"
                >
                  Save Course Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-12">
              <div className="mb-4">
                <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm">Select a course from the list to configure its elective requirements</p>
            </div>
          )}        </div>
      </div>

      {/* Bottom Section: Statistics and Quick Actions */}
      <div className="flex gap-8">
        {/* Left Side - Curriculum Statistics */}
        <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">Curriculum Statistics</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Required Courses</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">
                {electiveCourses.filter(c => c.requirement === 'Required').length}
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Elective Courses</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {electiveCourses.filter(c => c.requirement === 'Elective').length}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <h4 className="text-md font-bold mb-3 text-foreground">Category Breakdown</h4>
          <div className="space-y-3">
            {categories.slice(1).map(category => {
              const coursesInCategory = electiveCourses.filter(c => c.category === category);
              const totalCredits = coursesInCategory.reduce((sum, c) => sum + c.credits, 0);
              const requiredCount = coursesInCategory.filter(c => c.requirement === 'Required').length;
              const electiveCount = coursesInCategory.filter(c => c.requirement === 'Elective').length;
              
              return (
                <div key={category} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg">
                  <div>
                    <h5 className="font-semibold text-sm text-foreground">{category}</h5>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {requiredCount} Required • {electiveCount} Elective
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{totalCredits} credits</div>
                    <div className="text-xs text-gray-500">{coursesInCategory.length} courses</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Quick Actions */}
        <div className="w-80 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">Quick Actions</h3>
          
          <div className="space-y-3">
            <button 
              suppressHydrationWarning
              onClick={() => {
                // Set all Major Elective courses to Elective
                const updated = electiveCourses.map(course => 
                  course.category === 'Major Elective' 
                    ? { ...course, requirement: 'Elective' as const }
                    : course
                );
                setElectiveCourses(updated);
              }}
              className="w-full text-left px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition border border-blue-200 dark:border-blue-800"
            >
              <div className="font-semibold text-sm">Set Major Electives as Elective</div>
              <div className="text-xs text-blue-600 dark:text-blue-400">Apply elective status to all Major Elective courses</div>
            </button>
            
            <button 
              suppressHydrationWarning
              onClick={() => {
                // Set all Core courses to Required
                const updated = electiveCourses.map(course => 
                  course.category === 'Core' 
                    ? { ...course, requirement: 'Required' as const }
                    : course
                );
                setElectiveCourses(updated);
              }}
              className="w-full text-left px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition border border-green-200 dark:border-green-800"
            >
              <div className="font-semibold text-sm">Set Core Courses as Required</div>
              <div className="text-xs text-green-600 dark:text-green-400">Apply required status to all Core courses</div>
            </button>

            <button 
              suppressHydrationWarning
              onClick={() => {
                // Set all Free Elective courses to Elective
                const updated = electiveCourses.map(course => 
                  course.category === 'Free Elective' 
                    ? { ...course, requirement: 'Elective' as const }
                    : course
                );
                setElectiveCourses(updated);
              }}
              className="w-full text-left px-4 py-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition border border-purple-200 dark:border-purple-800"
            >
              <div className="font-semibold text-sm">Set Free Electives as Elective</div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Apply elective status to all Free Elective courses</div>
            </button>
          </div>

          {/* Global Actions */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border">
            <div className="flex gap-2">
              <button 
                suppressHydrationWarning
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-semibold hover:bg-emerald-700 transition border border-emerald-700 text-sm"
              >
                Save All Changes
              </button>
              <button 
                suppressHydrationWarning
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition border border-gray-400 dark:border-gray-500 text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
