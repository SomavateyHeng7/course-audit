"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { FaEdit, FaTrash, FaBook, FaGavel, FaGraduationCap, FaStar, FaBan, FaLayerGroup } from 'react-icons/fa';
import CoursesTab from '@/components/features/curriculum/CoursesTab';
import ConstraintsTab from '@/components/features/curriculum/ConstraintsTab';
import ElectiveRulesTab from '@/components/features/curriculum/ElectiveRulesTab';
import ConcentrationsTab from '@/components/features/curriculum/ConcentrationsTab';
import BlacklistTab from '@/components/features/curriculum/BlacklistTab';
import { facultyLabelApi } from '@/services/facultyLabelApi';
import { useToastHelpers } from '@/hooks/useToast';
import { API_BASE } from '@/lib/api/laravel';

interface CurriculumCourseMeta {
  curriculumCourseId: string;
  courseId: string;
  courseCode: string;
  curriculumPrerequisites: Array<{ id?: string; code: string; name?: string | null }>;
  curriculumCorequisites: Array<{ id?: string; code: string; name?: string | null }>;
  overrideRequiresPermission?: boolean | null;
  overrideSummerOnly?: boolean | null;
  overrideRequiresSeniorStanding?: boolean | null;
  overrideMinCreditThreshold?: number | null;
}

export default function EditCurriculum() {
  const params = useParams();
  const router = useRouter();
  const curriculumId = params.id as string;
  const { success, error: showError } = useToastHelpers();

  // State for curriculum data
  const [curriculum, setCurriculum] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [concentrationTitle, setConcentrationTitle] = useState('Concentrations');

  // Delete Curriculum State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCurriculum, setIsDeletingCurriculum] = useState(false);

  // Dynamic tabs based on concentration title
  const tabs = [
    { name: "Courses", icon: FaBook },
    { name: "Constraints", icon: FaGavel },
    { name: "Elective Rules", icon: FaGraduationCap },
    { name: concentrationTitle, icon: FaStar },
    { name: "Blacklist", icon: FaBan }
  ];

  // UI State
  const [activeTab, setActiveTab] = useState("Courses");
  const [showTypeBreakdown, setShowTypeBreakdown] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    code: '',
    title: '',
    credits: '',
    creditHours: '',
    type: '',
    description: ''
  });

  // Course search and selection state
  const [courseSearch, setCourseSearch] = useState('');
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [showAddCourseForm, setShowAddCourseForm] = useState(false);
  const [courseAssignment, setCourseAssignment] = useState({
    year: 1,
    semester: '1',
    isRequired: true
  });

  // Course Types State
  const [courseTypes, setCourseTypes] = useState<any[]>([]);
  const [isLoadingCourseTypes, setIsLoadingCourseTypes] = useState(false);

  // Add Course Loading State
  const [isAddingCourse, setIsAddingCourse] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const typeBreakdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch curriculum data
  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${API_BASE}/curricula/${curriculumId}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || 'Failed to fetch curriculum');
        }

        const data = await response.json();

        // Normalize keys for frontend (snake_case to camelCase)
        const normalizedCurriculum = {
          ...data.curriculum,
          curriculumCourses: data.curriculum.curriculum_courses || [],
          curriculumConstraints: data.curriculum.curriculum_constraints || [],
          curriculumBlacklists: data.curriculum.curriculum_blacklists || [],
          curriculumConcentrations: data.curriculum.curriculum_concentrations || [],
          // add more mappings if needed
        };

        setCurriculum(normalizedCurriculum);

        if (!data.curriculum) {
          throw new Error('No curriculum data returned from server');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        showError(err instanceof Error ? err.message : 'Failed to load curriculum');
      } finally {
        setIsLoading(false);
      }
    };

    if (curriculumId) {
      fetchCurriculum();
    }
  }, [curriculumId]);

  // Load concentration title
  useEffect(() => {
    const loadConcentrationTitle = async () => {
      try {
        const response = await facultyLabelApi.getConcentrationLabel();
        setConcentrationTitle(response.concentrationLabel);
      } catch (err) {
        // Keep default title if loading fails
      }
    };

    loadConcentrationTitle();
  }, []);

  // Load course types when curriculum is available
  useEffect(() => {
    const fetchCourseTypes = async () => {
      if (!curriculum?.departmentId) return;

      setIsLoadingCourseTypes(true);
      try {
        const response = await fetch(`${API_BASE}/course-types?departmentId=${curriculum.departmentId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setCourseTypes(data.courseTypes || []);
        }
      } catch (error) {
        // ignore
      } finally {
        setIsLoadingCourseTypes(false);
      }
    };

    fetchCourseTypes();
  }, [curriculum?.departmentId]);

  useEffect(() => {
    if (!showTypeBreakdown) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (typeBreakdownRef.current && !typeBreakdownRef.current.contains(event.target as Node)) {
        setShowTypeBreakdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showTypeBreakdown]);


  // Process curriculum data for display
  const summary = curriculum ? {
    totalCredits: curriculum.curriculumCourses?.reduce((total: number, cc: any) => total + cc.course.credits, 0) || 0,
    requiredCore: curriculum.curriculumCourses?.filter((cc: any) => cc.isRequired).reduce((total: number, cc: any) => total + cc.course.credits, 0) || 0,
    electiveCredits: curriculum.curriculumCourses?.filter((cc: any) => !cc.isRequired).reduce((total: number, cc: any) => total + cc.course.credits, 0) || 0,
  } : { totalCredits: 0, requiredCore: 0, electiveCredits: 0 };

  const curriculumCourseMeta: CurriculumCourseMeta[] = [];

  const coursesData = (curriculum?.curriculumCourses ?? []).map((cc: any) => {
    const normalizedPrereqs = (cc.curriculumPrerequisites ?? []).map((pr: any) => ({
      id: pr?.id ?? pr?.courseId ?? pr?.course?.id,
      code: pr?.code ?? pr?.course?.code ?? '',
      name: pr?.name ?? pr?.course?.name ?? null
    })).filter((pr: any) => pr.code);

    const normalizedCoreqs = (cc.curriculumCorequisites ?? []).map((coreq: any) => ({
      id: coreq?.id ?? coreq?.courseId ?? coreq?.course?.id,
      code: coreq?.code ?? coreq?.course?.code ?? '',
      name: coreq?.name ?? coreq?.course?.name ?? null
    })).filter((coreq: any) => coreq.code);

    const overrideRequiresPermission = cc.overrideRequiresPermission;
    const overrideSummerOnly = cc.overrideSummerOnly;
    const overrideRequiresSeniorStanding = cc.overrideRequiresSeniorStanding;
    const overrideMinCreditThreshold = cc.overrideMinCreditThreshold;

    const hasPermissionOverride = overrideRequiresPermission !== null && overrideRequiresPermission !== undefined;
    const hasSummerOnlyOverride = overrideSummerOnly !== null && overrideSummerOnly !== undefined;
    const hasSeniorStandingOverride = overrideRequiresSeniorStanding !== null && overrideRequiresSeniorStanding !== undefined;
    const hasMinCreditOverride = overrideMinCreditThreshold !== null && overrideMinCreditThreshold !== undefined;

    const baseRequiresPermission = Boolean(cc.course.requiresPermission);
    const baseSummerOnly = Boolean(cc.course.summerOnly);
    const baseRequiresSeniorStanding = Boolean(cc.course.requiresSeniorStanding);
    const baseMinCreditThreshold = cc.course.minCreditThreshold ?? null;

    const requiresPermission = hasPermissionOverride ? Boolean(overrideRequiresPermission) : baseRequiresPermission;
    const summerOnly = hasSummerOnlyOverride ? Boolean(overrideSummerOnly) : baseSummerOnly;
    const requiresSeniorStanding = hasSeniorStandingOverride ? Boolean(overrideRequiresSeniorStanding) : baseRequiresSeniorStanding;
    const minCreditThreshold = hasMinCreditOverride ? overrideMinCreditThreshold : baseMinCreditThreshold;

    curriculumCourseMeta.push({
      curriculumCourseId: cc.id,
      courseId: cc.course.id,
      courseCode: cc.course.code,
      curriculumPrerequisites: normalizedPrereqs,
      curriculumCorequisites: normalizedCoreqs,
      overrideRequiresPermission,
      overrideSummerOnly,
      overrideRequiresSeniorStanding,
      overrideMinCreditThreshold
    });

    return {
      id: cc.course.id,
      curriculumCourseId: cc.id,
      code: cc.course.code,
      title: cc.course.name,
      credits: cc.course.credits,
      creditHours: cc.course.creditHours || '3-0-6',
      type: cc.course.category || '',
      description: cc.course.description || '',
      courseType: cc.course.courseType || null,
      year: cc.year,
      semester: cc.semester,
      isRequired: cc.isRequired,
      curriculumPrerequisites: normalizedPrereqs,
      curriculumCorequisites: normalizedCoreqs,
      requiresPermission,
      summerOnly,
      requiresSeniorStanding,
      minCreditThreshold,
      baseRequiresPermission,
      baseSummerOnly,
      baseRequiresSeniorStanding,
      baseMinCreditThreshold,
      hasPermissionOverride,
      hasSummerOnlyOverride,
      hasSeniorStandingOverride,
      hasMinCreditOverride,
      overrideRequiresPermission,
      overrideSummerOnly,
      overrideRequiresSeniorStanding,
      overrideMinCreditThreshold
    };
  });

  const allCourses = coursesData.map((course: any) => ({
    id: course.id,
    code: course.code,
    name: course.title,
    credits: course.credits,
    curriculumPrerequisites: course.curriculumPrerequisites,
    curriculumCorequisites: course.curriculumCorequisites,
    requiresPermission: course.requiresPermission,
    summerOnly: course.summerOnly,
    requiresSeniorStanding: course.requiresSeniorStanding,
    minCreditThreshold: course.minCreditThreshold,
    baseRequiresPermission: course.baseRequiresPermission,
    baseSummerOnly: course.baseSummerOnly,
    baseRequiresSeniorStanding: course.baseRequiresSeniorStanding,
    baseMinCreditThreshold: course.baseMinCreditThreshold,
    hasPermissionOverride: course.hasPermissionOverride,
    hasSummerOnlyOverride: course.hasSummerOnlyOverride,
    hasSeniorStandingOverride: course.hasSeniorStandingOverride,
    hasMinCreditOverride: course.hasMinCreditOverride,
    curriculumCourseId: course.curriculumCourseId
  }));

  const resolvedCourseTypes = (courseTypes && courseTypes.length > 0)
    ? courseTypes
    : Array.from(
        coursesData.reduce((acc: Map<string, any>, course: any) => {
          if (course.courseType?.id && !acc.has(course.courseType.id)) {
            acc.set(course.courseType.id, {
              id: course.courseType.id,
              name: course.courseType.name,
              color: course.courseType.color,
            });
          }
          return acc;
        }, new Map<string, any>()).values()
      );

  const courseTypeCreditBreakdown = resolvedCourseTypes.map((type: any) => {
    const totalCredits = coursesData.reduce((sum: number, course: any) => {
      const courseCredits = typeof course.credits === 'number' ? course.credits : parseFloat(course.credits) || 0;
      if (course.courseType?.id === type.id) {
        return sum + courseCredits;
      }
      return sum;
    }, 0);

    return {
      id: type.id,
      name: type.name,
      color: type.color,
      totalCredits,
    };
  });

  const uncategorizedCredits = coursesData.reduce((sum: number, course: any) => {
    if (!course.courseType) {
      const courseCredits = typeof course.credits === 'number' ? course.credits : parseFloat(course.credits) || 0;
      return sum + courseCredits;
    }
    return sum;
  }, 0);

  const creditBreakdownCards = [...courseTypeCreditBreakdown];

  if (uncategorizedCredits > 0) {
    creditBreakdownCards.push({
      id: 'uncategorized',
      name: 'Uncategorized',
      color: '#4B5563',
      totalCredits: uncategorizedCredits,
    });
  }

  creditBreakdownCards.sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (showTypeBreakdown && creditBreakdownCards.length === 0) {
      setShowTypeBreakdown(false);
    }
  }, [showTypeBreakdown, creditBreakdownCards.length]);

  // Navigation functions
  const goToNextTab = () => {
    const currentIndex = tabs.findIndex(t => t.name === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].name);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = tabs.findIndex(t => t.name === activeTab);
    if (currentIndex > 0) {
      setActiveTab(tabs[currentIndex - 1].name);
    }
  };

  const currentTabIndex = tabs.findIndex(t => t.name === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabs.length - 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (!isFirstTab) goToPreviousTab();
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (!isLastTab) goToNextTab();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTabIndex, isFirstTab, isLastTab]);

  const handleEditCourse = (course: any) => {
    // Create a copy of the course to avoid mutating the original
    setEditingCourse({
      ...course,
      // Set the course type ID if available
      selectedCourseTypeId: course.courseType?.id || ''
    });
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingCourse(null);
  };

  const handleAddCourse = () => {
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setIsAddingCourse(false); // Reset loading state
    setNewCourse({
      code: '',
      title: '',
      credits: '',
      creditHours: '',
      type: '',
      description: ''
    });
    // Reset course search and selection state
    setCourseSearch('');
    setAvailableCourses([]);
    setSelectedCourse(null);
    setShowAddCourseForm(false);
    setCourseAssignment({
      year: 1,
      semester: '1',
      isRequired: true
    });
  };

  const handleSaveEditCourse = async () => {
    if (!editingCourse) return;
    setIsUpdatingCourse(true);

    try {
      // First, update the course basic information
      const courseResponse = await fetch(`${API_BASE}/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: editingCourse.title,
          credits: editingCourse.credits,
          creditHours: editingCourse.creditHours,
          description: editingCourse.description,
        }),
      });

      if (!courseResponse.ok) {
        const errorData = await courseResponse.json();
        throw new Error(errorData.error?.message || 'Failed to update course');
      }

      // Then, handle course type assignment if a course type is selected
      if (editingCourse.selectedCourseTypeId && curriculum?.departmentId) {
        const assignResponse = await fetch(`${API_BASE}/course-types/assign`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            courseIds: [editingCourse.id],
            courseTypeId: editingCourse.selectedCourseTypeId,
            departmentId: curriculum.departmentId,
            curriculumId: curriculum.id
          }),
        });

        if (!assignResponse.ok) {
          console.error('Failed to assign course type, but course was updated');
        }
      }

      // Update the curriculum state with the new course data
      setCurriculum((prev: any) => {
        if (!prev) return prev;
        
        // Find the selected course type for display
        const selectedCourseType = courseTypes.find(ct => ct.id === editingCourse.selectedCourseTypeId);
        
        return {
          ...prev,
          curriculumCourses: prev.curriculumCourses.map((cc: any) => 
            cc.course.id === editingCourse.id 
              ? {
                  ...cc,
                  course: {
                    ...cc.course,
                    name: editingCourse.title,
                    title: editingCourse.title,
                    credits: editingCourse.credits,
                    creditHours: editingCourse.creditHours,
                    description: editingCourse.description,
                    courseType: selectedCourseType || null
                  }
                }
              : cc
          )
        };
      });

      success('Course updated successfully!');
      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating course:', error);
      showError('Failed to update course. Please try again.');
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`${API_BASE}/curricula/${curriculumId}/courses?courseId=${courseId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to remove course from curriculum');
      }

      // Remove the course from the curriculum state
      setCurriculum((prev: any) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          curriculumCourses: prev.curriculumCourses.filter((cc: any) => cc.course.id !== courseId)
        };
      });

      success('Course removed from curriculum successfully!');
    } catch (error) {
      console.error('Error removing course from curriculum:', error);
      showError('Failed to remove course from curriculum. Please try again.');
    }
  };

  // Course search and management functions
  const fetchAvailableCourses = async (search = '') => {
    try {
      setIsLoadingCourses(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');
      
      const response = await fetch(`${API_BASE}/courses?${params.toString()}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      setAvailableCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  // Effect to fetch courses when search changes
  useEffect(() => {
    if (courseSearch) {
      const timeoutId = setTimeout(() => {
        fetchAvailableCourses(courseSearch);
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setAvailableCourses([]);
    }
  }, [courseSearch]);

  // Filter out courses that are already in curriculum
  const filteredAvailableCourses = availableCourses.filter((course: any) => 
    !coursesData.some((existingCourse: any) => existingCourse.id === course.id)
  );

  const handleSelectCourse = (course: any) => {
    setSelectedCourse(course);
    setCourseSearch('');
    setAvailableCourses([]);
  };

  const handleClearSelection = () => {
    setSelectedCourse(null);
    setCourseSearch('');
    setAvailableCourses([]);
  };

  const handleSaveAddCourse = async () => {
    // Prevent multiple submissions
    if (isAddingCourse) return;
    
    try {
      setIsAddingCourse(true);
      let courseId;
      let courseToAdd;

      if (selectedCourse) {
        // Use selected existing course
        courseId = selectedCourse.id;
        courseToAdd = selectedCourse;
      } else if (showAddCourseForm && newCourse.code && newCourse.title) {
        // Create new course first
        const createResponse = await fetch(`${API_BASE}/courses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            code: newCourse.code,
            name: newCourse.title,
            credits: parseInt(newCourse.credits) || 0,
            creditHours: newCourse.creditHours,
            category: newCourse.type,
            description: newCourse.description,
          }),
        });

        const courseData = await createResponse.json();

        if (!createResponse.ok) {
          throw new Error(courseData.error?.message || 'Failed to create course');
        }

        courseId = courseData.course.id;
        courseToAdd = courseData.course;
      } else {
        throw new Error('Please select a course or fill in the new course form');
      }

      // Add the course to the curriculum
      const addToCurriculumResponse = await fetch(`${API_BASE}/curricula/${curriculumId}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          courseId,
          isRequired: courseAssignment.isRequired,
          year: courseAssignment.year,
          semester: courseAssignment.semester,
        }),
      });

      const curriculumData = await addToCurriculumResponse.json();

      if (!addToCurriculumResponse.ok) {
        throw new Error(curriculumData.error?.message || 'Failed to add course to curriculum');
      }

      // Update the curriculum state with the new course
      setCurriculum((prev: any) => {
        if (!prev) return prev;
        
        const newCurriculumCourse = {
          id: curriculumData.curriculumCourse.id,
          course: courseToAdd,
          isRequired: courseAssignment.isRequired,
          year: courseAssignment.year,
          semester: courseAssignment.semester,
        };
        
        return {
          ...prev,
          curriculumCourses: [...prev.curriculumCourses, newCurriculumCourse]
        };
      });

      success('Course added to curriculum successfully!');
      handleCloseAddModal();
    } catch (error) {
      console.error('Error adding course:', error);
      showError('Failed to add course. Please try again.');
    } finally {
      setIsAddingCourse(false);
    }
  };

  const handleDeleteCurriculum = async () => {
    setIsDeletingCurriculum(true);
    try {
      const response = await fetch(`${API_BASE}/curricula/${curriculumId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to delete curriculum');
      }

      success('Curriculum deleted successfully!');
      // Redirect to curriculum list page
      router.push('/chairperson/curriculum');
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      showError(error instanceof Error ? error.message : 'Failed to delete curriculum. Please try again.');
    } finally {
      setIsDeletingCurriculum(false);
      setIsDeleteModalOpen(false);
    }
  };
  
  return (
    <div className="flex min-h-screen bg-white dark:bg-background">
      {/* Sidebar is assumed to be rendered by layout */}
      <div className="flex-1 flex flex-col items-center py-3 sm:py-6 lg:py-10 px-2 sm:px-4">
        <div className="w-full max-w-6xl bg-white dark:bg-card rounded-lg sm:rounded-xl lg:rounded-2xl border border-gray-200 dark:border-border p-3 sm:p-6 lg:p-10">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Loading curriculum...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 dark:text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-red-700 dark:text-red-400 font-medium">Error loading curriculum: {error}</span>
              </div>
            </div>
          )}

          {/* Curriculum Content */}
          {!isLoading && !error && curriculum && (
            <>
              <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 text-gray-900 dark:text-foreground">
                  <span className="block sm:inline">Course Management</span>
                  <span className="text-primary dark:text-primary/40 hidden sm:inline"> &gt; </span>
                  <span className="block sm:inline text-lg sm:text-2xl lg:text-3xl">{curriculum.name}</span>
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                    Manage all aspects of your curriculum from courses to constraints
                  </p>
                  <div className="flex items-center gap-2">
                    <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                        Ctrl
                      </kbd>
                      <span>+</span>
                      <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                        ← →
                      </kbd>
                      <span>to navigate</span>
                    </div>
                  </div>
                </div>
            {/* Tabs */}
            <div className="w-full mt-4 mb-8">
              {/* Tab Progress Indicator */}
              <div className="hidden lg:block mb-3 sm:mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Section {tabs.findIndex(t => t.name === activeTab) + 1} of {tabs.length}
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-primary dark:text-primary/40">
                    {activeTab}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${((tabs.findIndex(t => t.name === activeTab) + 1) / tabs.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Desktop Tab Bar */}
              <div className="hidden lg:flex gap-2 sm:gap-3 flex-wrap">
                {tabs.map((tab, index) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.name;
                  const isPrevious = tabs.findIndex(t => t.name === activeTab) > index;
                  
                  return (
                    <button
                      key={tab.name}
                      suppressHydrationWarning
                      className={`px-3 sm:px-4 lg:px-5 py-2 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-all duration-200 border-2 shadow-sm hover:shadow-md flex items-center gap-1 sm:gap-2 relative overflow-hidden touch-manipulation ${
                        isActive
                          ? "bg-primary text-white border-primary shadow-primary/20 dark:shadow-primary/50 transform scale-105"
                          : isPrevious
                          ? "bg-primary/10 dark:bg-primary/20/30 text-primary dark:text-primary/30 border-primary/30 dark:border-primary"
                          : "bg-white dark:bg-card text-primary dark:text-primary/40 border-primary/20 dark:border-primary hover:bg-primary/10 dark:hover:bg-primary/20/20 hover:border-primary/40 dark:hover:border-ring"
                      }`}
                      onClick={() => setActiveTab(tab.name)}
                    >
                      {/* Ripple effect on active */}
                      {isActive && (
                        <div className="absolute inset-0 bg-white/20 rounded-full animate-ping"></div>
                      )}
                      <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 relative z-10 ${isActive ? 'animate-pulse' : ''}`} />
                      <span className="relative z-10 hidden sm:inline">{tab.name}</span>
                      <span className="relative z-10 sm:hidden text-xs truncate max-w-16">{tab.name.split(' ')[0]}</span>
                      {isPrevious && (
                        <svg className="w-2 h-2 sm:w-3 sm:h-3 ml-1 text-ring" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
              
              {/* Mobile/Tablet Enhanced Dropdown */}
              <div className="lg:hidden">
                <div className="relative">
                  <div className="mb-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                      Current Section
                    </span>
                  </div>
                  <select
                    value={activeTab}
                    onChange={(e) => setActiveTab(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-card border-2 border-primary/20 dark:border-primary rounded-lg sm:rounded-xl text-primary dark:text-primary/40 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all shadow-sm appearance-none cursor-pointer touch-manipulation"
                  >
                    {tabs.map((tab, index) => (
                      <option key={tab.name} value={tab.name} className="bg-white dark:bg-card py-2">
                        {`${index + 1}. ${tab.name}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary dark:text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Mobile Progress Bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{tabs.findIndex(t => t.name === activeTab) + 1} of {tabs.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((tabs.findIndex(t => t.name === activeTab) + 1) / tabs.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>          {/* Summary Cards */}
          <div className="mb-6 sm:mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-8">
              <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col items-center">
                <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm lg:text-md mb-1 sm:mb-2 text-center">Total Curriculum Credits</span>
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary dark:text-primary/40">{summary.totalCredits} Credits</span>
              </div>
              <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col items-center">
                <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm lg:text-md mb-1 sm:mb-2 text-center">Required Core Courses</span>
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary dark:text-primary/40">{summary.requiredCore} Credits</span>
              </div>
              <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg sm:rounded-xl p-4 sm:p-6 flex flex-col items-center sm:col-span-2 lg:col-span-1">
                <span className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm lg:text-md mb-1 sm:mb-2 text-center">Elective Credits</span>
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary dark:text-primary/40">{summary.electiveCredits} Credits</span>
              </div>
            </div>

            {creditBreakdownCards.length > 0 && (
              <div className="mt-4 flex justify-end">
                <div className="relative" ref={typeBreakdownRef}>
                  <button
                    onClick={() => setShowTypeBreakdown((prev) => !prev)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg shadow-sm text-sm font-semibold text-gray-700 dark:text-gray-200 hover:border-primary hover:text-primary dark:hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <FaLayerGroup className="h-4 w-4" />
                    Course Type Credits
                    <svg className={`h-4 w-4 transition-transform ${showTypeBreakdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showTypeBreakdown && (
                    <div className="absolute right-0 z-50 mt-2 w-72 sm:w-[30rem] bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl shadow-xl p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {creditBreakdownCards.map((card) => (
                          <div
                            key={card.id}
                            className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">{card.name}</span>
                              <span
                                className="inline-flex h-2 w-2 rounded-full"
                                style={{ backgroundColor: card.color || '#6366F1' }}
                              />
                            </div>
                            <span className="text-lg font-bold text-primary dark:text-primary/40 block">{card.totalCredits} Credits</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>          {/* Tab Content */}
          {activeTab === "Courses" && (
            <CoursesTab 
              courses={coursesData} 
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onAddCourse={handleAddCourse}
              curriculumId={curriculumId}
              departmentId={curriculum?.departmentId}
              onRefreshCurriculum={async () => {
                // Refetch curriculum data
                try {
                  const response = await fetch(`${API_BASE}/curricula/${curriculumId}`, {
                    credentials: 'include'
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setCurriculum(data.curriculum);
                  }
                } catch (error) {
                  console.error('Error refreshing curriculum:', error);
                }
              }}
            />
          )}          {activeTab === "Constraints" && (
            <ConstraintsTab
              courses={allCourses}
              curriculumId={curriculumId}
              curriculumCourses={curriculumCourseMeta}
            />
          )}

          {activeTab === "Elective Rules" && (
            <ElectiveRulesTab curriculumId={curriculumId} />
          )}

          {activeTab === concentrationTitle && (
            <ConcentrationsTab curriculumId={curriculumId} concentrationTitle={concentrationTitle} />
          )}

          {activeTab === "Blacklist" && (
            <BlacklistTab curriculumId={curriculumId} />
          )}
          
          {/* Tab Navigation Buttons */}
          <div className="flex justify-between items-center mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-border">
            <button
              onClick={goToPreviousTab}
              disabled={isFirstTab}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all touch-manipulation ${
                isFirstTab
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-primary dark:text-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20/20 hover:text-primary dark:hover:text-primary/30"
              }`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden xs:inline">Previous</span>
              <span className="xs:hidden">Prev</span>
            </button>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 touch-manipulation ${
                    activeTab === tab.name
                      ? "bg-primary w-4 sm:w-6"
                      : index < currentTabIndex
                      ? "bg-primary/30 dark:bg-primary"
                      : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
                  }`}
                  title={tab.name}
                />
              ))}
            </div>
            
            <button
              onClick={goToNextTab}
              disabled={isLastTab}
              className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all touch-manipulation ${
                isLastTab
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-primary dark:text-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20/20 hover:text-primary dark:hover:text-primary/30"
              }`}
            >
              <span className="hidden xs:inline">Next</span>
              <span className="xs:hidden">Next</span>
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
            </>
          )}
        </div>
      </div>      {/* Edit Course Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white dark:bg-card rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-lg lg:max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Edit Course Details</h3>
              <button
                suppressHydrationWarning
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              {editingCourse && (
              <div className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2 text-foreground">Course Code</label>
                  <input
                    type="text"
                    value={editingCourse.code}
                    readOnly
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed text-sm sm:text-base"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Course code cannot be modified</p>
                </div>
                
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2 text-foreground">Course Title</label>
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors text-sm sm:text-base"
                    placeholder="Enter course title"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-foreground">Credits</label>
                    <input
                      type="number"
                      value={editingCourse.credits}
                      onChange={(e) => setEditingCourse({...editingCourse, credits: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors text-sm sm:text-base"
                      min="0"
                      max="6"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold mb-2 text-foreground">Credit Hours</label>
                    <input
                      type="text"
                      value={editingCourse.creditHours}
                      onChange={(e) => setEditingCourse({...editingCourse, creditHours: e.target.value})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 sm:px-4 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors text-sm sm:text-base"
                      placeholder="e.g., 3-0-6"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: Lecture-Lab-Total (e.g., 3-0-6)</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Type</label>
                  <select
                    value={editingCourse.selectedCourseTypeId || ''}
                    onChange={(e) => setEditingCourse({...editingCourse, selectedCourseTypeId: e.target.value})}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors"
                    disabled={isLoadingCourseTypes}
                  >
                    <option value="">Select Course Type</option>
                    {courseTypes.map((courseType) => (
                      <option key={courseType.id} value={courseType.id}>
                        {courseType.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isLoadingCourseTypes ? 'Loading course types...' : 'Choose the appropriate course type for curriculum requirements'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Description</label>
                  <textarea
                    value={editingCourse.description || ''}
                    onChange={(e) => setEditingCourse({...editingCourse, description: e.target.value})}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors resize-none"
                    placeholder="Enter a detailed description of the course content and objectives"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Provide a comprehensive description of the course</p>
                </div>
              </div>            )}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-border">
              <button
                suppressHydrationWarning
                onClick={handleCloseEditModal}
                disabled={isUpdatingCourse}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                onClick={handleSaveEditCourse}
                disabled={isUpdatingCourse}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors border border-primary font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base touch-manipulation"
              >
                {isUpdatingCourse ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden xs:inline">Updating...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden xs:inline">Save Changes</span>
                    <span className="xs:hidden">Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}      {/* Add Course Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white dark:bg-card rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-lg lg:max-w-2xl border border-gray-200 dark:border-border shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Add Course to Curriculum</h3>
              <button
                suppressHydrationWarning
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 touch-manipulation"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Course Assignment Settings */}
              <div className="border border-gray-200 dark:border-border rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50">
                <h5 className="font-medium text-foreground mb-3 text-sm sm:text-base">Course Assignment Settings</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Year</label>
                    <select
                      value={courseAssignment.year}
                      onChange={(e) => setCourseAssignment({...courseAssignment, year: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-xs sm:text-sm touch-manipulation"
                    >
                      <option value={1}>Year 1</option>
                      <option value={2}>Year 2</option>
                      <option value={3}>Year 3</option>
                      <option value={4}>Year 4</option>
                      <option value={5}>Year 5</option>
                      <option value={6}>Year 6</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Semester</label>
                    <select
                      value={courseAssignment.semester}
                      onChange={(e) => setCourseAssignment({...courseAssignment, semester: e.target.value})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-xs sm:text-sm touch-manipulation"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Summer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1 text-foreground">Type</label>
                    <select
                      value={courseAssignment.isRequired ? 'required' : 'elective'}
                      onChange={(e) => setCourseAssignment({...courseAssignment, isRequired: e.target.value === 'required'})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-xs sm:text-sm touch-manipulation"
                    >
                      <option value="required">Required</option>
                      <option value="elective">Elective</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Search and Add Existing Courses */}
              {!selectedCourse && (
                <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                  <h5 className="font-medium text-foreground mb-3">Search Database Courses</h5>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Search by course code or title..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                    />
                    
                    {isLoadingCourses && (
                      <div className="text-center py-2">
                        <div className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                          Searching...
                        </div>
                      </div>
                    )}
                    
                    {courseSearch && !isLoadingCourses && (
                      <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-border rounded-lg">
                        {filteredAvailableCourses.length > 0 ? (
                          filteredAvailableCourses.map((course: any, index: number) => (
                            <div
                              key={index}
                              className="p-3 border-b border-gray-200 dark:border-border last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer flex justify-between items-center"
                              onClick={() => handleSelectCourse(course)}
                            >
                              <div>
                                <div className="font-semibold text-sm text-foreground">{course.code}</div>
                                <div className="text-xs text-gray-600 dark:text-gray-400">{course.name}</div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">{course.credits} credits</div>
                            </div>
                          ))
                        ) : (
                          <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
                            No courses found matching "{courseSearch}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Selected Course Display */}
              {selectedCourse && (
                <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-green-800 dark:text-green-300 mb-1">Selected Course</h5>
                      <div className="font-semibold text-green-900 dark:text-green-200">{selectedCourse.code}</div>
                      <div className="text-sm text-green-700 dark:text-green-400">{selectedCourse.name}</div>
                      <div className="text-xs text-green-600 dark:text-green-500">{selectedCourse.credits} credits • {selectedCourse.category}</div>
                    </div>
                    <button
                      onClick={handleClearSelection}
                      className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Add New Course Form */}
              {!selectedCourse && (
                <div className="border border-gray-200 dark:border-border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-medium text-foreground">Create New Course</h5>
                    <button
                      onClick={() => setShowAddCourseForm(!showAddCourseForm)}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      {showAddCourseForm ? 'Cancel' : '+ Create New'}
                    </button>
                  </div>
                  
                  {showAddCourseForm && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">Course Code</label>
                          <input
                            type="text"
                            value={newCourse.code}
                            onChange={(e) => setNewCourse({...newCourse, code: e.target.value})}
                            placeholder="e.g., CSX 1001"
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">Course Title</label>
                          <input
                            type="text"
                            value={newCourse.title}
                            onChange={(e) => setNewCourse({...newCourse, title: e.target.value})}
                            placeholder="e.g., Introduction to Computer Science"
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">Credits</label>
                          <input
                            type="number"
                            value={newCourse.credits}
                            onChange={(e) => setNewCourse({...newCourse, credits: e.target.value})}
                            placeholder="3"
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                            min="0"
                            max="6"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">Credit Hours</label>
                          <input
                            type="text"
                            value={newCourse.creditHours}
                            onChange={(e) => setNewCourse({...newCourse, creditHours: e.target.value})}
                            placeholder="e.g., 3-0-6"
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1 text-foreground">Course Type</label>
                          <select
                            value={newCourse.type}
                            onChange={(e) => setNewCourse({...newCourse, type: e.target.value})}
                            className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                          >
                            <option value="">Select Type</option>
                            <option value="Core">Core</option>
                            <option value="Major">Major</option>
                            <option value="Major Elective">Major Elective</option>
                            <option value="General Education">General Education</option>
                            <option value="Free Elective">Free Elective</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium mb-1 text-foreground">Course Description</label>
                        <textarea
                          value={newCourse.description}
                          onChange={(e) => setNewCourse({...newCourse, description: e.target.value})}
                          placeholder="Course description (optional)"
                          className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm resize-none"
                          rows={3}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-border">
              <button
                suppressHydrationWarning
                onClick={handleCloseAddModal}
                disabled={isAddingCourse}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                onClick={handleSaveAddCourse}
                disabled={isAddingCourse || (!selectedCourse && (!showAddCourseForm || !newCourse.code || !newCourse.title))}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors border border-primary font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base touch-manipulation"
              >
                {isAddingCourse ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden xs:inline">Adding...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <span className="hidden xs:inline">Add Course</span>
                    <span className="xs:hidden">Add</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Curriculum Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-2 sm:p-4">
          <div className="bg-white dark:bg-card rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-md border border-gray-200 dark:border-border shadow-2xl">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">Delete Curriculum</h3>
              <button
                suppressHydrationWarning
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingCurriculum}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 touch-manipulation disabled:opacity-50"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <FaTrash className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <p className="text-center text-gray-700 dark:text-gray-300 mb-2 font-medium">
                Are you sure you want to delete this curriculum?
              </p>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                <strong className="text-red-600 dark:text-red-400">{curriculum?.name}</strong>
              </p>
              <p className="text-center text-xs text-gray-500 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                ⚠️ This action cannot be undone. All associated courses, constraints, elective rules, concentrations, and blacklists will be permanently deleted.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                suppressHydrationWarning
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeletingCurriculum}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base touch-manipulation"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                onClick={handleDeleteCurriculum}
                disabled={isDeletingCurriculum}
                className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base touch-manipulation"
              >
                {isDeletingCurriculum ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden xs:inline">Deleting...</span>
                    <span className="xs:hidden">...</span>
                  </>
                ) : (
                  <>
                    <FaTrash className="mr-2 w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden xs:inline">Delete Permanently</span>
                    <span className="xs:hidden">Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}