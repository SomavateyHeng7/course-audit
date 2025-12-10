'use client';

import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaInfoCircle, FaTags, FaLayerGroup } from 'react-icons/fa';
import { API_BASE } from '@/lib/api/laravel';

interface Course {
  id: string;
  curriculumCourseId?: string;
  code: string;
  title: string;
  credits: number;
  creditHours: string; // Changed to string to support formats like "3-0-6"
  type: string;
  description?: string; // Added description field
  courseType?: {
    id: string;
    name: string;
    color: string;
  } | null;
  curriculumPrerequisites?: Array<{ id?: string; code: string; name?: string | null }>;
  curriculumCorequisites?: Array<{ id?: string; code: string; name?: string | null }>;
  requiresPermission?: boolean;
  summerOnly?: boolean;
  requiresSeniorStanding?: boolean;
  minCreditThreshold?: number | null;
  baseRequiresPermission?: boolean;
  baseSummerOnly?: boolean;
  baseRequiresSeniorStanding?: boolean;
  baseMinCreditThreshold?: number | null;
  hasPermissionOverride?: boolean;
  hasSummerOnlyOverride?: boolean;
  hasSeniorStandingOverride?: boolean;
  hasMinCreditOverride?: boolean;
  overrideRequiresPermission?: boolean | null;
  overrideSummerOnly?: boolean | null;
  overrideRequiresSeniorStanding?: boolean | null;
  overrideMinCreditThreshold?: number | null;
}

interface CoursesTabProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddCourse: () => void;
  curriculumId?: string;
  departmentId?: string;
  onRefreshCurriculum?: () => void;
}

export default function CoursesTab({ courses, onEditCourse, onDeleteCourse, onAddCourse, curriculumId, departmentId, onRefreshCurriculum }: CoursesTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  
  // Course Type Management State
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [isBulkAssignOpen, setIsBulkAssignOpen] = useState(false);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedCourseType, setSelectedCourseType] = useState<string>('');
  const [isLoadingCourseTypes, setIsLoadingCourseTypes] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Load course types when department changes
  useEffect(() => {
    if (departmentId) {
      fetchCourseTypes();
    }
  }, [departmentId]);

  // API Functions
  const fetchCourseTypes = async () => {
    if (!departmentId) return;
    
    setIsLoadingCourseTypes(true);
    try {
      const response = await fetch(`${API_BASE}/course-types?departmentId=${departmentId}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCourseTypes(data.courseTypes || []);
      }
    } catch (error) {
      console.error('Error fetching course types:', error);
    } finally {
      setIsLoadingCourseTypes(false);
    }
  };

  const assignCourseTypes = async (courseIds: string[], courseTypeId: string) => {
    if (!departmentId || !curriculumId) {
      console.error('Cannot assign course types without department and curriculum context');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch(`${API_BASE}/api/course-types/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseIds,
          courseTypeId,
          departmentId,
          curriculumId
        }),
      });

      if (response.ok) {
        // Call the refresh callback if provided
        if (onRefreshCurriculum) {
          onRefreshCurriculum();
        } else {
          // Fallback to reload if no callback provided
          window.location.reload();
        }
      } else {
        console.error('Failed to assign course types');
      }
    } catch (error) {
      console.error('Error assigning course types:', error);
    } finally {
      setIsAssigning(false);
      setIsBulkAssignOpen(false);
      setSelectedCourses([]);
      setSelectedCourseType('');
    }
  };

  // Bulk Assignment Functions
  const handleBulkAssign = () => {
    if (selectedCourses.length > 0 && selectedCourseType) {
      assignCourseTypes(selectedCourses, selectedCourseType);
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const selectAllCourses = () => {
    setSelectedCourses(filteredCourses.map(course => course.id));
  };

  const clearSelection = () => {
    setSelectedCourses([]);
  };

  const renderCurriculumRules = (course: Course) => {
    const prerequisiteCodes = (course.curriculumPrerequisites ?? [])
      .map(prereq => prereq?.code?.trim())
      .filter((code): code is string => Boolean(code));

    const corequisiteCodes = (course.curriculumCorequisites ?? [])
      .map(coreq => coreq?.code?.trim())
      .filter((code): code is string => Boolean(code));

    const baseRequiresPermission = course.baseRequiresPermission ?? false;
    const finalRequiresPermission = course.requiresPermission ?? false;
    const showPermission = course.hasPermissionOverride || baseRequiresPermission || finalRequiresPermission;
    const permissionOrigin = course.hasPermissionOverride ? 'Curriculum override' : 'Course default';

    const baseSummerOnly = course.baseSummerOnly ?? false;
    const finalSummerOnly = course.summerOnly ?? false;
    const showSummer = course.hasSummerOnlyOverride || baseSummerOnly || finalSummerOnly;
    const summerOrigin = course.hasSummerOnlyOverride ? 'Curriculum override' : 'Course default';

    const baseSeniorStanding = course.baseRequiresSeniorStanding ?? false;
    const finalSeniorStanding = course.requiresSeniorStanding ?? false;
    const showSenior = course.hasSeniorStandingOverride || baseSeniorStanding || finalSeniorStanding || course.hasMinCreditOverride;
    const seniorOrigin = (course.hasSeniorStandingOverride || course.hasMinCreditOverride) ? 'Curriculum override' : 'Course default';
    const creditThreshold = course.minCreditThreshold ?? course.baseMinCreditThreshold ?? null;

    const flagBadges: Array<{ text: string; highlight: boolean }> = [];

    if (showPermission) {
      flagBadges.push({
        text: `Permission ${finalRequiresPermission ? 'required' : 'not required'} • ${permissionOrigin === 'Curriculum override' ? 'Curriculum' : 'Course'}`,
        highlight: Boolean(course.hasPermissionOverride)
      });
    }

    if (showSummer) {
      flagBadges.push({
        text: `${finalSummerOnly ? 'Summer only' : 'All terms'} • ${summerOrigin === 'Curriculum override' ? 'Curriculum' : 'Course'}`,
        highlight: Boolean(course.hasSummerOnlyOverride)
      });
    }

    if (showSenior) {
      const standingText = finalSeniorStanding
        ? `Senior standing${creditThreshold ? ` (${creditThreshold}+ credits)` : ''}`
        : 'Senior standing not required';
      flagBadges.push({
        text: `${standingText} • ${seniorOrigin === 'Curriculum override' ? 'Curriculum' : 'Course'}`,
        highlight: Boolean(course.hasSeniorStandingOverride || course.hasMinCreditOverride)
      });
    }

    if (!prerequisiteCodes.length && !corequisiteCodes.length && !flagBadges.length) {
      return <span className="text-xs text-gray-400 dark:text-gray-500">No curriculum-specific rules</span>;
    }

    return (
      <div className="flex flex-col gap-1">
        {prerequisiteCodes.length > 0 && (
          <div className="text-xs text-foreground">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Prereq:</span>{' '}
            <span className="text-gray-600 dark:text-gray-300">{prerequisiteCodes.join(', ')}</span>
          </div>
        )}
        {corequisiteCodes.length > 0 && (
          <div className="text-xs text-foreground">
            <span className="font-semibold text-gray-600 dark:text-gray-300">Coreq:</span>{' '}
            <span className="text-gray-600 dark:text-gray-300">{corequisiteCodes.join(', ')}</span>
          </div>
        )}
        {flagBadges.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {flagBadges.map((badge, idx) => (
              <span
                key={`${badge.text}-${idx}`}
                className={`text-[10px] leading-tight px-2 py-1 rounded-full border ${badge.highlight ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-300 dark:bg-amber-900/30 dark:text-amber-200' : 'border-gray-200 bg-gray-100 text-gray-600 dark:border-border dark:bg-gray-800/60 dark:text-gray-300'}`}
              >
                {badge.text}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  };

  const filteredCourses = courses.filter(course =>
    course.code.toLowerCase().includes(search.toLowerCase()) ||
    course.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDescriptionClick = (course: Course) => {
    setSelectedCourse(course);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCourse(null);
  };

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (courseToDelete) {
      onDeleteCourse(courseToDelete.id);
      setIsDeleteModalOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setCourseToDelete(null);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search courses by code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-80 border border-gray-300 dark:border-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors"
              suppressHydrationWarning
            />
            <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Bulk Assignment Button */}
          <button
            onClick={() => setIsBulkAssignOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <FaTags />
            Bulk Assign Categories
          </button>
        </div>
        
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
          {selectedCourses.length > 0 && (
            <span className="ml-2 text-primary font-medium">
              ({selectedCourses.length} selected)
            </span>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg overflow-hidden shadow-sm">
          <thead className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-primary">
                <input
                  type="checkbox"
                  checked={selectedCourses.length === filteredCourses.length && filteredCourses.length > 0}
                  onChange={(e) => e.target.checked ? selectAllCourses() : clearSelection()}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Course Code</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Title</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Credits</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Credit Hours</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Category</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-primary">Curriculum Rules</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Description</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-primary">Actions</th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-200 dark:divide-border">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedCourses.includes(course.id)}
                      onChange={() => toggleCourseSelection(course.id)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{course.code}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{course.title}</td>
                  <td className="px-6 py-4 text-center text-sm text-foreground">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {course.credits}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-foreground">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 whitespace-nowrap">
                      {course.creditHours?.replace(/[\r\n]+/g, '').trim() || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-foreground">
                    {course.courseType ? (
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: course.courseType.color }}
                      >
                        {course.courseType.name}
                      </span>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">No Category Assigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-left text-foreground">
                    {renderCurriculumRules(course)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {course.description ? (
                      <button
                        onClick={() => handleDescriptionClick(course)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                        title="View Description"
                      >
                        <FaInfoCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => onEditCourse(course)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-all" 
                        title="Edit Course"
                        suppressHydrationWarning
                      >
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(course)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                        title="Delete Course"
                        suppressHydrationWarning
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-lg font-medium mb-2">No courses found</p>
                    <p className="text-sm">
                      {search ? `No courses match "${search}"` : "No courses in curriculum yet"}
                    </p>
                    {search && (
                      <button 
                        onClick={() => setSearch('')}
                        className="mt-3 text-primary hover:underline text-sm"
                      >
                        Clear search
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-border">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} in curriculum
        </div>        <div className="flex gap-3">
          <button 
            onClick={onAddCourse}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors border border-primary shadow-sm"
            suppressHydrationWarning
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Course
          </button>
          {/* <button 
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors border border-primary shadow-sm"
            suppressHydrationWarning
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Save Changes
          </button> */}
        </div>
      </div>

      {/* Description Modal */}
      {isModalOpen && selectedCourse && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">
                  {selectedCourse.code} - {selectedCourse.title}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span>Credits: {selectedCourse.credits}</span>
                  <span>Credit Hours: {selectedCourse.creditHours?.replace(/[\r\n]+/g, '').trim() || 'N/A'}</span>
                  {selectedCourse.type && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      selectedCourse.type === 'Core' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                      selectedCourse.type === 'Major' ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary' :
                      selectedCourse.type === 'Major Elective' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      selectedCourse.type === 'General Education' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                    }`}>
                      {selectedCourse.type}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Course Description</h4>
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-border">
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedCourse.description || 'No description available for this course.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && courseToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 w-full max-w-md border border-gray-200 dark:border-border shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Remove Course</h3>
              <button
                onClick={handleCancelDelete}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mr-4">
                  <FaTrash className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-foreground">Are you sure?</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">This will remove the course from this curriculum.</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-border">
                <p className="text-sm text-foreground mb-2">
                  <span className="font-semibold">Course:</span> {courseToDelete.code} - {courseToDelete.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This will remove the course from the current curriculum. The course will still exist globally and can be added back later.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Remove Course
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Assignment Modal */}
      {isBulkAssignOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-card rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-border">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FaTags className="text-primary" />
                Bulk Assign Course Categories
              </h3>
              <button
                onClick={() => setIsBulkAssignOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Selected courses: <span className="font-medium text-foreground">{selectedCourses.length}</span>
                </p>
                <div className="max-h-32 overflow-y-auto bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-border">
                  {selectedCourses.map(courseId => {
                    const course = courses.find(c => c.id === courseId);
                    return course ? (
                      <div key={courseId} className="text-xs text-foreground mb-1">
                        {course.code} - {course.title}
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Course Category
                </label>
                <select
                  value={selectedCourseType}
                  onChange={(e) => setSelectedCourseType(e.target.value)}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
                  disabled={isLoadingCourseTypes}
                >
                  <option value="">Select a course category...</option>
                  {courseTypes.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
                {isLoadingCourseTypes && (
                  <p className="text-xs text-gray-500 mt-1">Loading course categories...</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsBulkAssignOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={!selectedCourseType || selectedCourses.length === 0 || isAssigning}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning ? 'Assigning...' : 'Assign Categories'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}