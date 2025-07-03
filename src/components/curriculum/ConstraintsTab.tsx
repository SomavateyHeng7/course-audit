'use client';

import { useState } from 'react';

interface Course {
  code: string;
  name: string;
}

interface ConstraintsTabProps {
  courses: Course[];
}

export default function ConstraintsTab({ courses }: ConstraintsTabProps) {
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('CSX 4001');
  const [constraintType, setConstraintType] = useState('prerequisites');
  const [selectedConstraintCourse, setSelectedConstraintCourse] = useState('');
  const [requiresPermission, setRequiresPermission] = useState(false);
  const [summerOnly, setSummerOnly] = useState(false);
  const [requiresSeniorStanding, setRequiresSeniorStanding] = useState(false);
  const [minCreditThreshold, setMinCreditThreshold] = useState('90');

  // Sample constraint data - this would come from API
  const [constraints, setConstraints] = useState({
    prerequisites: ['CSX 2001', 'CSX 3003'],
    bannedCombinations: ['CSX 3002'],
    corequisites: ['CSX 1002'],
  });

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.name.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const getSelectedCourseData = () => {
    const found = courses.find(course => course.code === selectedCourse);
    return found || { code: selectedCourse, name: 'Advanced Software Engineering' };
  };

  const handleAddConstraint = () => {
    if (!selectedConstraintCourse) return;
    
    setConstraints(prev => ({
      ...prev,
      [constraintType]: [...prev[constraintType as keyof typeof prev], selectedConstraintCourse]
    }));
    setSelectedConstraintCourse('');
  };

  const handleRemoveConstraint = (type: string, courseCode: string) => {
    setConstraints(prev => ({
      ...prev,
      [type]: prev[type as keyof typeof prev].filter(code => code !== courseCode)
    }));
  };

  const getConstraintTypeLabel = (type: string) => {
    switch(type) {
      case 'prerequisites': return 'Prerequisites';
      case 'bannedCombinations': return 'Banned Combinations';
      case 'corequisites': return 'Co-requisites';
      default: return type;
    }
  };

  const getConstraintColor = (type: string) => {
    switch(type) {
      case 'prerequisites': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'bannedCombinations': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'corequisites': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
      <div className="flex gap-8 min-h-[700px]">
        {/* Left Side - Course Selection */}
        <div className="w-1/3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-foreground">Select Course</h3>
          
          {/* Search Bar */}
          <div className="mb-4 flex-shrink-0">
            <input
              type="text"
              placeholder="Search courses..."
              value={courseSearch}
              onChange={(e) => setCourseSearch(e.target.value)}
              className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
            />
          </div>          {/* Course List */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, idx) => (
                  <div
                    key={idx}
                    className={`p-3 border border-gray-200 dark:border-border rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      course.code === selectedCourse ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' : 'bg-white dark:bg-card'
                    }`}
                    onClick={() => setSelectedCourse(course.code)}
                  >
                    <div className="font-semibold text-sm text-foreground">{course.code}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{course.name}</div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🔍</div>
                    <div className="text-sm">
                      {courseSearch ? 'No courses found matching your search' : 'No courses available'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Constraints Management */}
        <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-6 text-foreground">Course Constraints for {selectedCourse}</h3>
          
          {/* Simplified Visualization */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-6">
            <div className="flex items-center justify-center mb-4">
              <div className="w-32 h-32 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-sm border-4 border-emerald-600 shadow-lg">
                <div className="text-center">
                  <div className="text-lg">{selectedCourse}</div>
                  <div className="text-xs mt-1">{getSelectedCourseData().name.split(' ').slice(0, 3).join(' ')}</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center text-sm">
              <div>
                <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Prerequisites</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{constraints.prerequisites.length}</div>
              </div>
              <div>
                <div className="font-semibold text-red-700 dark:text-red-300 mb-1">Banned</div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">{constraints.bannedCombinations.length}</div>
              </div>
              <div>
                <div className="font-semibold text-green-700 dark:text-green-300 mb-1">Co-requisites</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">{constraints.corequisites.length}</div>
              </div>
            </div>
          </div>

          {/* Course Relationship Constraints */}
          <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-6">
            <h4 className="text-lg font-bold mb-4 text-foreground">Course Relationship Constraints</h4>
            
            {/* Current Constraints Display */}
            <div className="space-y-4 mb-6">
              {Object.entries(constraints).map(([type, courseList]) => (
                <div key={type}>
                  <h5 className="font-semibold mb-2 text-foreground">{getConstraintTypeLabel(type)}</h5>
                  <div className="flex flex-wrap gap-2">
                    {courseList.length > 0 ? (
                      courseList.map((courseCode, idx) => (
                        <div key={idx} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getConstraintColor(type)}`}>
                          <span>{courseCode}</span>                          <button 
                            suppressHydrationWarning
                            onClick={() => handleRemoveConstraint(type, courseCode)}
                            className="text-current hover:text-red-500 text-xs font-bold"
                          >
                            ×
                          </button>
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400 text-sm italic">No {type} set</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Constraint */}
            <div className="border-t border-gray-200 dark:border-border pt-4">
              <h5 className="font-semibold mb-3 text-foreground">Add Course Constraint</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Constraint Type</label>
                  <select 
                    value={constraintType}
                    onChange={(e) => setConstraintType(e.target.value)}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
                  >
                    <option value="prerequisites">Prerequisites</option>
                    <option value="bannedCombinations">Banned Combinations</option>
                    <option value="corequisites">Co-requisites</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Select Course</label>
                  <select 
                    value={selectedConstraintCourse}
                    onChange={(e) => setSelectedConstraintCourse(e.target.value)}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
                  >
                    <option value="">Choose a course...</option>
                    {courses.filter(c => c.code !== selectedCourse).map(course => (
                      <option key={course.code} value={course.code}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">                  <button 
                    suppressHydrationWarning
                    onClick={handleAddConstraint}
                    disabled={!selectedConstraintCourse}
                    className="w-full bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 transition border border-emerald-700 text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Add Constraint
                  </button>
                </div>
              </div>

              {/* Constraint Type Descriptions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  {constraintType === 'prerequisites' && 'Prerequisites'}
                  {constraintType === 'bannedCombinations' && 'Banned Combinations'}
                  {constraintType === 'corequisites' && 'Co-requisites'}
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  {constraintType === 'prerequisites' && 'Courses that must be completed before taking this course.'}
                  {constraintType === 'bannedCombinations' && 'Courses that cannot be taken together with this course.'}
                  {constraintType === 'corequisites' && 'Courses that must be taken simultaneously with this course.'}
                </div>
              </div>
            </div>
          </div>

          {/* Other Constraints */}
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-6">
            <h4 className="text-lg font-bold mb-4 text-foreground">Other Constraints</h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                <div>
                  <div className="font-semibold text-foreground">Chairperson Permission Required</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Students need special approval to enroll</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={requiresPermission}
                    onChange={(e) => setRequiresPermission(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                <div>
                  <div className="font-semibold text-foreground">Summer Session Only</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Course can only be taken during summer sessions</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={summerOnly}
                    onChange={(e) => setSummerOnly(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                <div>
                  <div className="font-semibold text-foreground">Senior Standing Required</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Student must be a senior with specified credit threshold</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={requiresSeniorStanding}
                    onChange={(e) => setRequiresSeniorStanding(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              
              {/* Credit Threshold Input - only shown when Senior Standing is enabled */}
              {requiresSeniorStanding && (
                <div className="p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                  <div className="mb-3">
                    <div className="font-semibold text-foreground">Minimum Credit Threshold</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Minimum credits required for senior standing to take this course</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="1"
                      value={minCreditThreshold}
                      onChange={(e) => setMinCreditThreshold(e.target.value)}
                      className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-background text-foreground text-sm"
                      placeholder="90"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">credits</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    NOTE: Backend will verify student ID to determine senior standing status
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border">              <button 
                suppressHydrationWarning
                className="w-full bg-emerald-600 text-white py-3 rounded-lg font-semibold hover:bg-emerald-700 transition border border-emerald-700"
              >
                Save All Constraints
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
