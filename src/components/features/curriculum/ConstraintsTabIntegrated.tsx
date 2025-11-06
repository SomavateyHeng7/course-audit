// Example of how to integrate the ConstraintsTab with the new backend APIs
// This shows the modified parts of ConstraintsTab.tsx to connect to real backend

import { useState, useEffect } from 'react';
import { courseConstraintsApi, CourseConstraints, CourseConstraintFlags } from '@/services/courseConstraintsApi';

interface Course {
  id: string;
  code: string;
  name: string;
}

interface ConstraintsTabProps {
  courses: Course[];
  curriculumId?: string; // For curriculum-level constraints if needed
}

export default function ConstraintsTabIntegrated({ courses, curriculumId }: ConstraintsTabProps) {
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedCourseData, setSelectedCourseData] = useState<Course | null>(null);
  const [constraints, setConstraints] = useState<CourseConstraints | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Constraint management state
  const [constraintType, setConstraintType] = useState('prerequisites');
  const [selectedConstraintCourse, setSelectedConstraintCourse] = useState('');

  // Course flags state
  const [requiresPermission, setRequiresPermission] = useState(false);
  const [summerOnly, setSummerOnly] = useState(false);
  const [requiresSeniorStanding, setRequiresSeniorStanding] = useState(false);
  const [minCreditThreshold, setMinCreditThreshold] = useState('90');

  // Load constraints when course is selected
  useEffect(() => {
    if (selectedCourse) {
      loadConstraints(selectedCourse);
      const courseData = courses.find(c => c.id === selectedCourse || c.code === selectedCourse);
      setSelectedCourseData(courseData || null);
    }
  }, [selectedCourse, courses]);

  // Update form state when constraints are loaded
  useEffect(() => {
    if (constraints) {
      setRequiresPermission(constraints.flags.requiresPermission);
      setSummerOnly(constraints.flags.summerOnly);
      setRequiresSeniorStanding(constraints.flags.requiresSeniorStanding);
      setMinCreditThreshold(constraints.flags.minCreditThreshold?.toString() || '90');
    }
  }, [constraints]);

  const loadConstraints = async (courseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const constraintsData = await courseConstraintsApi.getConstraints(courseId);
      setConstraints(constraintsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load constraints');
      console.error('Error loading constraints:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddConstraint = async () => {
    if (!selectedConstraintCourse || !selectedCourse) return;
    
    setError(null);
    try {
      if (constraintType === 'prerequisites') {
        await courseConstraintsApi.addPrerequisite(selectedCourse, selectedConstraintCourse);
      } else if (constraintType === 'corequisites') {
        await courseConstraintsApi.addCorequisite(selectedCourse, selectedConstraintCourse);
      }
      
      // Reload constraints to show the update
      await loadConstraints(selectedCourse);
      setSelectedConstraintCourse('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add constraint');
      console.error('Error adding constraint:', err);
    }
  };

  const handleRemoveConstraint = async (type: string, relationId: string) => {
    if (!selectedCourse) return;
    
    setError(null);
    try {
      if (type === 'prerequisites') {
        await courseConstraintsApi.removePrerequisite(selectedCourse, relationId);
      } else if (type === 'corequisites') {
        await courseConstraintsApi.removeCorequisite(selectedCourse, relationId);
      }
      
      // Reload constraints to show the update
      await loadConstraints(selectedCourse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove constraint');
      console.error('Error removing constraint:', err);
    }
  };

  const handleSaveAllConstraints = async () => {
    if (!selectedCourse) return;
    
    setIsSaving(true);
    setError(null);
    try {
      // Prepare flags data
      const flags: CourseConstraintFlags = {
        requiresPermission,
        summerOnly,
        requiresSeniorStanding,
        minCreditThreshold: requiresSeniorStanding ? parseInt(minCreditThreshold) : undefined
      };

      // Update constraint flags
      await courseConstraintsApi.updateConstraintFlags(selectedCourse, flags);
      
      // Reload constraints to show the update
      await loadConstraints(selectedCourse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save constraints');
      console.error('Error saving constraints:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getConstraintsList = (type: string) => {
    if (!constraints) return [];
    
    switch (type) {
      case 'prerequisites':
        return constraints.prerequisites;
      case 'corequisites':
        return constraints.corequisites;
      case 'bannedCombinations':
        return constraints.bannedCombinations;
      default:
        return [];
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-8 min-h-[700px]">
        {/* Left Side - Course Selection */}
        <div className="w-1/3 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col">
          <h3 className="text-lg font-bold mb-4 text-foreground">Select Course</h3>
          
          {/* Course List */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full space-y-2 overflow-y-auto pr-2">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className={`p-3 border border-gray-200 dark:border-border rounded-lg cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    course.id === selectedCourse ? 'bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40' : 'bg-white dark:bg-card'
                  }`}
                  onClick={() => setSelectedCourse(course.id)}
                >
                  <div className="font-semibold text-sm text-foreground">{course.code}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">{course.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Constraints Management */}
        <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          {selectedCourse ? (
            <>
              <h3 className="text-lg font-bold mb-6 text-foreground">
                Course Constraints for {selectedCourseData?.code || selectedCourse}
              </h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">Loading constraints...</div>
                </div>
              ) : constraints ? (
                <>
                  {/* Constraints Overview */}
                  <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-6">
                    <div className="flex items-center justify-center mb-4">
                      <div className="w-32 h-32 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm border-4 border-primary/80 shadow-lg">
                        <div className="text-center">
                          <div className="text-lg">{constraints.course.code}</div>
                          <div className="text-xs mt-1">{constraints.course.name.split(' ').slice(0, 3).join(' ')}</div>
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
                        <div className="font-semibold text-primary mb-1">Co-requisites</div>
                        <div className="text-2xl font-bold text-primary">{constraints.corequisites.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Course Relationship Constraints */}
                  <div className="mb-6 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-6">
                    <h4 className="text-lg font-bold mb-4 text-foreground">Course Relationship Constraints</h4>
                    
                    {/* Current Constraints Display */}
                    <div className="space-y-4 mb-6">
                      {['prerequisites', 'corequisites', 'bannedCombinations'].map((type) => (
                        <div key={type}>
                          <h5 className="font-semibold mb-2 text-foreground">
                            {type === 'prerequisites' ? 'Prerequisites' : 
                             type === 'corequisites' ? 'Co-requisites' : 'Banned Combinations'}
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {getConstraintsList(type).length > 0 ? (
                              getConstraintsList(type).map((course: any, idx: number) => (
                                <div key={idx} className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                                  type === 'prerequisites' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                  type === 'corequisites' ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' :
                                  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                }`}>
                                  <span>{course.code}</span>
                                  <button 
                                    onClick={() => handleRemoveConstraint(type, course.id)}
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
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                          >
                            <option value="prerequisites">Prerequisites</option>
                            <option value="corequisites">Co-requisites</option>
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
                            onClick={handleAddConstraint}
                            disabled={!selectedConstraintCourse}
                            className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
                          >
                            Add Constraint
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Other Constraints (Flags) */}
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
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
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/30 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                        </label>
                      </div>
                      
                      {/* Credit Threshold Input */}
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
                              className="flex-1 border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
                              placeholder="90"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">credits</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-border">
                      <button 
                        onClick={handleSaveAllConstraints}
                        disabled={isSaving}
                        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition border border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save All Constraints'}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">No constraints data available</div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-center text-gray-500">
                <div className="text-4xl mb-2">🎯</div>
                <div>Select a course to manage its constraints</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
