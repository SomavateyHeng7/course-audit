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
  const [freeElectiveCredits, setFreeElectiveCredits] = useState('6'); // Credits for free electives
  
  // Sample courses data - NOTE FOR BACKEND: 
  // Auto-determine requirement based on category name containing "elective"
  // Main categories: General Education, Core, Major, Major Elective, Free Elective
  // IMPORTANT: The courses shown in "Available Courses List" are the courses 
  // that are in the current curriculum and not the whole database
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
          
          {/* NOTE: The courses shown here are courses that are in the current curriculum, not the whole database */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 italic">
            * Showing courses from the current curriculum only
          </p>
          
          {/* Search Bar */}
          <div className="mb-4 space-y-3">
            <input
              type="text"
              placeholder="Search Courses..."
              value={electiveSearch}
              onChange={(e) => setElectiveSearch(e.target.value)}
              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            />
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
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
                      ? 'border-primary bg-primary/10 dark:bg-primary/20' 
                      : 'border-gray-200 dark:border-border bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-semibold text-sm text-foreground">{course.code}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.requirement === 'Required' 
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                    }`}>
                      {course.requirement}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">{course.name}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-primary">{course.category}</span>
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
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  >
                    <option value="Required">Required Course</option>
                    <option value="Elective">Elective Course</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Minimum Total Credits Required</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    defaultValue="60"
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum total credits a student must have completed to enroll in this elective
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-border">
                <button 
                  suppressHydrationWarning
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition"
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
            <div className="bg-primary/10 dark:bg-primary/20 p-3 rounded-lg">
              <div className="text-sm text-gray-600 dark:text-gray-400">Required Courses</div>
              <div className="text-xl font-bold text-primary">
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
          {/* NOTE FOR BACKEND: Course types/categories will be queried from the database, 
              not using these predetermined types. The breakdown will be dynamic based on 
              actual course data from the curriculum. */}
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
                    {/* Don't show requirement counts for Free Elective since we only specify credits */}
                    {category !== 'Free Elective' ? (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {requiredCount} Required • {electiveCount} Elective
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Credit requirement only
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{totalCredits} credits</div>
                    {category !== 'Free Elective' ? (
                      <div className="text-xs text-gray-500">{coursesInCategory.length} courses</div>
                    ) : (
                      <div className="text-xs text-gray-500">Variable courses</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side - Free Electives Credits Configuration */}
        <div className="w-80 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">Free Electives Configuration</h3>
          
          <div className="space-y-6">
            {/* Free Electives Credits Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Required Free Electives Credits
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="3"
                  value={freeElectiveCredits}
                  onChange={(e) => setFreeElectiveCredits(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                  placeholder="6"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
                  credits
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Total credits students must take from courses not listed in the curriculum (free electives)
              </p>
            </div>

            {/* Information Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-1">
                    About Free Electives
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Free electives are courses that students can choose from outside the curriculum. 
                    Since we cannot predict all possible courses, we specify the required credit amount instead.
                  </p>
                </div>
              </div>
            </div>

            {/* Current Configuration Summary */}
            <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">Current Configuration</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Free Electives:</span>
                  <span className="font-medium text-foreground">{freeElectiveCredits} credits</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Curriculum Courses:</span>
                  <span className="font-medium text-foreground">
                    {electiveCourses.filter(c => c.category !== 'Free Elective').reduce((sum, c) => sum + c.credits, 0)} credits
                  </span>
                </div>
                <div className="border-t border-gray-200 dark:border-border pt-2 mt-2">
                  <div className="flex justify-between items-center text-sm font-semibold">
                    <span className="text-foreground">Total Program:</span>
                    <span className="text-primary">
                      {electiveCourses.filter(c => c.category !== 'Free Elective').reduce((sum, c) => sum + c.credits, 0) + parseInt(freeElectiveCredits || '0')} credits
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border">
            <button 
              suppressHydrationWarning
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
