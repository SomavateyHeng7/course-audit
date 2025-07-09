'use client';

import { useState, useEffect } from 'react';
import { courseConstraintsApi } from '@/services/courseConstraintsApi';

interface Course {
  id: string;
  code: string;
  name: string;
  credits?: number;
}

interface ConstraintsTabProps {
  courses: Course[];
}

interface CourseConstraints {
  prerequisites: Course[];
  corequisites: Course[];
  bannedCombinations: Course[];
}

interface CourseConstraintFlags {
  requiresPermission: boolean;
  summerOnly: boolean;
  requiresSeniorStanding: boolean;
  minCreditThreshold?: number;
}

export default function ConstraintsTab({ courses }: ConstraintsTabProps) {
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [constraintType, setConstraintType] = useState('prerequisites');
  const [selectedConstraintCourse, setSelectedConstraintCourse] = useState('');
  
  // Real constraint data from backend
  const [constraints, setConstraints] = useState<CourseConstraints>({
    prerequisites: [],
    bannedCombinations: [],
    corequisites: [],
  });
  
  // Course flags from backend
  const [courseFlags, setCourseFlags] = useState<CourseConstraintFlags>({
    requiresPermission: false,
    summerOnly: false,
    requiresSeniorStanding: false,
    minCreditThreshold: 90,
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default selected course when courses are available
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses, selectedCourse]);

  // Load constraints when selected course changes
  useEffect(() => {
    if (selectedCourse) {
      loadConstraints();
    }
  }, [selectedCourse]);

  const loadConstraints = async () => {
    if (!selectedCourse) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Load all constraints for the selected course
      const constraintsData = await courseConstraintsApi.getConstraints(selectedCourse);
      
      setConstraints({
        prerequisites: constraintsData.prerequisites || [],
        corequisites: constraintsData.corequisites || [],
        bannedCombinations: constraintsData.bannedCombinations || [],
      });
      
      setCourseFlags(constraintsData.flags || {
        requiresPermission: false,
        summerOnly: false,
        requiresSeniorStanding: false,
        minCreditThreshold: 90,
      });
    } catch (err) {
      console.error('Error loading constraints:', err);
      setError(err instanceof Error ? err.message : 'Failed to load constraints');
      
      // Reset to empty state on error
      setConstraints({
        prerequisites: [],
        corequisites: [],
        bannedCombinations: [],
      });
      setCourseFlags({
        requiresPermission: false,
        summerOnly: false,
        requiresSeniorStanding: false,
        minCreditThreshold: 90,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
    course.name.toLowerCase().includes(courseSearch.toLowerCase())
  );

  const getSelectedCourseData = () => {
    const found = courses.find(course => course.id === selectedCourse);
    return found || { id: '', code: 'No course selected', name: 'Please select a course' };
  };

  const handleAddConstraint = async () => {
    if (!selectedConstraintCourse || !selectedCourse) return;
    
    setSaving(true);
    setError(null);
    
    try {
      if (constraintType === 'prerequisites') {
        await courseConstraintsApi.addPrerequisite(selectedCourse, selectedConstraintCourse);
      } else if (constraintType === 'corequisites') {
        await courseConstraintsApi.addCorequisite(selectedCourse, selectedConstraintCourse);
      }
      // Note: Banned combinations would be handled at curriculum level
      
      setSelectedConstraintCourse('');
      // Reload constraints to get updated data
      await loadConstraints();
    } catch (err) {
      console.error('Error adding constraint:', err);
      setError(err instanceof Error ? err.message : 'Failed to add constraint');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveConstraint = async (type: string, course: Course) => {
    if (!selectedCourse) return;
    
    setSaving(true);
    setError(null);
    
    try {
      if (type === 'prerequisites') {
        // Find the prerequisite relation by course ID
        const prerequisites = await courseConstraintsApi.getPrerequisites(selectedCourse);
        const relation = prerequisites.find(p => p.prerequisite.id === course.id);
        if (relation) {
          await courseConstraintsApi.removePrerequisite(selectedCourse, relation.id);
        }
      } else if (type === 'corequisites') {
        // Find the corequisite relation by course ID
        const corequisites = await courseConstraintsApi.getCorequisites(selectedCourse);
        const relation = corequisites.find(c => c.corequisite.id === course.id);
        if (relation) {
          await courseConstraintsApi.removeCorequisite(selectedCourse, relation.id);
        }
      }
      // Note: Banned combinations would be handled at curriculum level
      
      // Reload constraints to get updated data
      await loadConstraints();
    } catch (err) {
      console.error('Error removing constraint:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove constraint');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveConstraints = async () => {
    if (!selectedCourse) return;
    
    setSaving(true);
    setError(null);
    
    try {
      // Save course flags
      await courseConstraintsApi.updateConstraintFlags(selectedCourse, courseFlags);
      
      // Show success (you might want to add a toast notification here)
      console.log('Constraints saved successfully');
    } catch (err) {
      console.error('Error saving constraints:', err);
      setError(err instanceof Error ? err.message : 'Failed to save constraints');
    } finally {
      setSaving(false);
    }
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
      case 'corequisites': return 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="text-red-800 dark:text-red-200 font-semibold">Error</div>
          <div className="text-red-700 dark:text-red-300 text-sm">{error}</div>
        </div>
      )}
      
      <div className="flex gap-8 min-h-[700px]">
        {/* Left Side - Course Selection */}
        <div className="w-1/3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-foreground">Select Course</h3>
          
          {/* Search Bar */}
          <div className="mb-4 flex-shrink-0">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses by code or name..."
                value={courseSearch}
                onChange={(e) => setCourseSearch(e.target.value)}
                className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                autoFocus
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                🔍
              </div>
              {courseSearch && (
                <button
                  onClick={() => setCourseSearch('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            {/* Search hint */}
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              💡 Tip: Use Tab/Enter to navigate and select courses
            </div>
          </div>
          
          {/* Course List */}
          <div className="flex-1 overflow-hidden">
            {/* Course count indicator */}
            <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              {filteredCourses.length > 0 ? (
                <>
                  {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} 
                  {filteredCourses.length > 15 && ' (scrollable)'}
                </>
              ) : (
                'No courses found'
              )}
            </div>
            
            {/* Scrollable course list with max height for optimal display */}
            <div 
              className={`space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500 ${
                filteredCourses.length > 15 ? 'max-h-[500px]' : 'h-full'
              }`}
              style={{ 
                // Calculate height for optimal display (each course item ~56px including gap)
                maxHeight: filteredCourses.length > 15 ? '500px' : 'auto' 
              }}
            >
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course, idx) => (
                  <div
                    key={course.id || idx}
                    className={`p-3 border border-gray-200 dark:border-border rounded-lg cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                      course.id === selectedCourse 
                        ? 'bg-primary/10 dark:bg-primary/20 border-primary/40 dark:border-primary/50 shadow-md ring-2 ring-primary/30' 
                        : 'bg-white dark:bg-card hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedCourse(course.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedCourse(course.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Select ${course.code} for constraint management`}
                    title={`Select ${course.code} - ${course.name} for constraint management`}
                  >
                    <div className="font-semibold text-sm text-foreground flex items-center justify-between">
                      <span>{course.code}</span>
                      {course.id === selectedCourse && (
                        <span className="text-primary text-xs">✓ Selected</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mt-1">
                      {course.name}
                      {course.credits && (
                        <span className="ml-2 px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {course.credits} cr
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <div className="text-center py-8">
                    <div className="text-4xl mb-2">🔍</div>
                    <div className="text-sm">
                      {courseSearch ? 'No courses found matching your search' : 'No courses available'}
                    </div>
                    {courseSearch && (
                      <button
                        onClick={() => setCourseSearch('')}
                        className="mt-2 text-xs text-primary hover:underline"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Selection helper text */}
            {filteredCourses.length > 0 && !selectedCourse && (
              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-xs text-blue-700 dark:text-blue-300 text-center">
                  👆 Select a course to manage its constraints
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Constraints Management */}
        <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          {selectedCourse ? (
            <>
              <h3 className="text-lg font-bold mb-6 text-foreground flex items-center gap-2">
                <span>Course Constraints for</span>
                <span className="px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary rounded-lg font-mono text-base border border-primary/20">
                  {getSelectedCourseData().code}
                </span>
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-primary rounded-full"></div>
                    Loading...
                  </div>
                )}
              </h3>
              
              {/* Simplified Visualization */}
              <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-32 h-32 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm border-4 border-primary/80 shadow-lg">
                    <div className="text-center">
                      <div className="text-lg">{getSelectedCourseData().code}</div>
                      <div className="text-xs mt-1">{getSelectedCourseData().name.split(' ').slice(0, 3).join(' ')}</div>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div className="group hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg p-2 transition-colors">
                    <div className="font-semibold text-blue-700 dark:text-blue-300 mb-1 flex items-center justify-center gap-1">
                      📚 Prerequisites
                    </div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{constraints.prerequisites.length}</div>
                    <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Required first</div>
                  </div>
                  <div className="group hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg p-2 transition-colors">
                    <div className="font-semibold text-red-700 dark:text-red-300 mb-1 flex items-center justify-center gap-1">
                      🚫 Banned
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">{constraints.bannedCombinations.length}</div>
                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">Cannot combine</div>
                  </div>
                  <div className="group hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg p-2 transition-colors">
                    <div className="font-semibold text-primary mb-1 flex items-center justify-center gap-1">
                      🔗 Co-requisites
                    </div>
                    <div className="text-2xl font-bold text-primary">{constraints.corequisites.length}</div>
                    <div className="text-xs text-primary mt-1">Taken together</div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Course Selected State */
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold mb-2 text-foreground">Select a Course</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                Choose a course from the list on the left to view and manage its constraints, prerequisites, and corequisites.
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md">
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>💡 Tip:</strong> Use the search bar to quickly find specific courses, especially when dealing with large course catalogs.
                </div>
              </div>
            </div>
          )}
          
          {selectedCourse && (
            <>
              {/* Course Relationship Constraints */}
              <div className="mb-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-border rounded-xl p-6">
                <h4 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
                  <span>🔗</span>
                  Course Relationship Constraints
                </h4>
            
            {/* Current Constraints Display */}
            <div className="space-y-4 mb-6">
              {Object.entries(constraints).map(([type, courseList]) => (
                <div key={type}>
                  <h5 className="font-semibold mb-2 text-foreground">{getConstraintTypeLabel(type)}</h5>
                  <div className="flex flex-wrap gap-2">
                    {courseList.length > 0 ? (
                      courseList.map((course: Course, idx: number) => (
                        <div key={course.id || idx} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getConstraintColor(type)} group hover:shadow-sm transition-all`}>
                          <span className="font-medium">{course.code}</span>
                          <span className="text-xs opacity-75">({course.name.split(' ').slice(0, 2).join(' ')})</span>
                          <button 
                            suppressHydrationWarning
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(`Remove ${course.code} from ${getConstraintTypeLabel(type).toLowerCase()}?`)) {
                                handleRemoveConstraint(type, course);
                              }
                            }}
                            disabled={saving}
                            className="text-current hover:text-red-500 dark:hover:text-red-400 text-base font-bold disabled:opacity-50 ml-1 hover:scale-110 transition-all"
                            title={`Remove ${course.code} from ${getConstraintTypeLabel(type).toLowerCase()}`}
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
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                  >
                    <option value="prerequisites">Prerequisites</option>
                    <option value="corequisites">Co-requisites</option>
                    {/* Banned combinations will be handled at curriculum level */}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Select Course</label>
                  <select 
                    value={selectedConstraintCourse}
                    onChange={(e) => setSelectedConstraintCourse(e.target.value)}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                  >
                    <option value="">Choose a course...</option>
                    {courses.filter(c => c.id !== selectedCourse).map(course => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <button 
                    suppressHydrationWarning
                    onClick={handleAddConstraint}
                    disabled={!selectedConstraintCourse || saving}
                    className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Adding...' : 'Add Constraint'}
                  </button>
                </div>
              </div>

              {/* Constraint Type Descriptions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 text-sm">
                <div className="font-semibold text-blue-800 dark:text-blue-200 mb-1">
                  {constraintType === 'prerequisites' && 'Prerequisites'}
                  {constraintType === 'corequisites' && 'Co-requisites'}
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  {constraintType === 'prerequisites' && 'Courses that must be completed before taking this course.'}
                  {constraintType === 'corequisites' && 'Courses that must be taken simultaneously with this course.'}
                </div>
              </div>
            </div>
          </div>

          {/* Other Constraints */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200 dark:border-border rounded-xl p-6">
            <h4 className="text-lg font-bold mb-4 text-foreground flex items-center gap-2">
              <span>⚙️</span>
              Course Flags & Special Requirements
            </h4>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg">
                <div>
                  <div className="font-semibold text-foreground">Chairperson Permission Required</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Students need special approval to enroll</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={courseFlags.requiresPermission}
                    onChange={(e) => setCourseFlags(prev => ({ ...prev, requiresPermission: e.target.checked }))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
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
                    checked={courseFlags.summerOnly}
                    onChange={(e) => setCourseFlags(prev => ({ ...prev, summerOnly: e.target.checked }))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
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
                    checked={courseFlags.requiresSeniorStanding}
                    onChange={(e) => setCourseFlags(prev => ({ ...prev, requiresSeniorStanding: e.target.checked }))}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 dark:peer-focus:ring-primary/50 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                </label>
              </div>
              
              {/* Credit Threshold Input - only shown when Senior Standing is enabled */}
              {courseFlags.requiresSeniorStanding && (
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
                      value={courseFlags.minCreditThreshold || 90}
                      onChange={(e) => setCourseFlags(prev => ({ ...prev, minCreditThreshold: parseInt(e.target.value) || 90 }))}
                      className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
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
            
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border">
              <button 
                suppressHydrationWarning
                onClick={handleSaveConstraints}
                disabled={saving || !selectedCourse}
                className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition border border-primary disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save All Constraints'}
              </button>
            </div>
          </div>
          </>
          )}
        </div>
      </div>
    </div>
  );
}
