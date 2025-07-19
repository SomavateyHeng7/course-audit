"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { FaEdit, FaTrash, FaBook, FaGavel, FaGraduationCap, FaStar, FaBan } from 'react-icons/fa';
import CoursesTab from '@/components/curriculum/CoursesTab';
import ConstraintsTab from '@/components/curriculum/ConstraintsTab';
import ElectiveRulesTab from '@/components/curriculum/ElectiveRulesTab';
import ConcentrationsTab from '@/components/curriculum/ConcentrationsTab';
import BlacklistTab from '@/components/curriculum/BlacklistTab';

const tabs = [
  { name: "Courses", icon: FaBook },
  { name: "Constraints", icon: FaGavel },
  { name: "Elective Rules", icon: FaGraduationCap },
  { name: "Concentrations", icon: FaStar },
  { name: "Blacklist", icon: FaBan }
];

export default function EditCurriculum() {
  const params = useParams();
  const curriculumId = params.id as string;
  
  // State for curriculum data
  const [curriculum, setCurriculum] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState("Courses");
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
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch curriculum data
  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/curricula/${curriculumId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch curriculum');
        }
        
        const data = await response.json();
        setCurriculum(data.curriculum);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    if (curriculumId) {
      fetchCurriculum();
    }
  }, [curriculumId]);

  // Process curriculum data for display
  const summary = curriculum ? {
    totalCredits: curriculum.curriculumCourses?.reduce((total: number, cc: any) => total + cc.course.credits, 0) || 0,
    requiredCore: curriculum.curriculumCourses?.filter((cc: any) => cc.isRequired).reduce((total: number, cc: any) => total + cc.course.credits, 0) || 0,
    electiveCredits: curriculum.curriculumCourses?.filter((cc: any) => !cc.isRequired).reduce((total: number, cc: any) => total + cc.course.credits, 0) || 0,
  } : { totalCredits: 0, requiredCore: 0, electiveCredits: 0 };

  const coursesData = curriculum?.curriculumCourses?.map((cc: any) => ({
    id: cc.course.id,
    code: cc.course.code,
    title: cc.course.name,
    credits: cc.course.credits,
    creditHours: cc.course.creditHours || '3-0-6',
    type: cc.course.category || '',
    description: cc.course.description || '',
    year: cc.year,
    semester: cc.semester,
    isRequired: cc.isRequired,
  })) || [];

  const allCourses = coursesData.map((course: any) => ({
    id: course.id,
    code: course.code,
    name: course.title,
    credits: course.credits
  }));

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
      // Only handle keyboard nav when not in form inputs
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement || 
          event.target instanceof HTMLSelectElement) {
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
    setEditingCourse({...course});
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

    try {
      const response = await fetch(`/api/courses/${editingCourse.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCourse.title,
          credits: editingCourse.credits,
          creditHours: editingCourse.creditHours,
          category: editingCourse.type,
          description: editingCourse.description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update course');
      }

      // Update the curriculum state with the new course data
      setCurriculum((prev: any) => {
        if (!prev) return prev;
        
        return {
          ...prev,
          curriculumCourses: prev.curriculumCourses.map((cc: any) => 
            cc.course.id === editingCourse.id 
              ? {
                  ...cc,
                  course: {
                    ...cc.course,
                    name: editingCourse.title,
                    credits: editingCourse.credits,
                    creditHours: editingCourse.creditHours,
                    category: editingCourse.type,
                    description: editingCourse.description,
                  }
                }
              : cc
          )
        };
      });

      handleCloseEditModal();
    } catch (error) {
      console.error('Error updating course:', error);
      alert('Failed to update course. Please try again.');
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    try {
      const response = await fetch(`/api/curricula/${curriculumId}/courses?courseId=${courseId}`, {
        method: 'DELETE',
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
    } catch (error) {
      console.error('Error removing course from curriculum:', error);
      alert('Failed to remove course from curriculum. Please try again.');
    }
  };

  // Course search and management functions
  const fetchAvailableCourses = async (search = '') => {
    try {
      setIsLoadingCourses(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('limit', '50');
      
      const response = await fetch(`/api/courses?${params.toString()}`);
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
    try {
      let courseId;
      let courseToAdd;

      if (selectedCourse) {
        // Use selected existing course
        courseId = selectedCourse.id;
        courseToAdd = selectedCourse;
      } else if (showAddCourseForm && newCourse.code && newCourse.title) {
        // Create new course first
        const createResponse = await fetch('/api/courses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
      const addToCurriculumResponse = await fetch(`/api/curricula/${curriculumId}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      handleCloseAddModal();
    } catch (error) {
      console.error('Error adding course:', error);
      alert('Failed to add course. Please try again.');
    }
  };
  return (
    <div className="flex min-h-screen bg-white dark:bg-background">
      {/* Sidebar is assumed to be rendered by layout */}
      <div className="flex-1 flex flex-col items-center py-10">
        <div className="w-full max-w-6xl bg-white dark:bg-card rounded-2xl border border-gray-200 dark:border-border p-10">
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
              <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-foreground">
                  Course Management <span className="text-primary dark:text-primary/40">&gt;</span> {curriculum.name}
                </h1>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Manage all aspects of your curriculum from courses to constraints
                  </p>
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
            {/* Tabs */}
            <div className="w-full mt-4 mb-8">
              {/* Tab Progress Indicator */}
              <div className="hidden lg:block mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Section {tabs.findIndex(t => t.name === activeTab) + 1} of {tabs.length}
                  </span>
                  <span className="text-sm font-medium text-primary dark:text-primary/40">
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
              <div className="hidden lg:flex gap-3 flex-wrap">
                {tabs.map((tab, index) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.name;
                  const isPrevious = tabs.findIndex(t => t.name === activeTab) > index;
                  
                  return (
                    <button
                      key={tab.name}
                      suppressHydrationWarning
                      className={`px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-200 border-2 shadow-sm hover:shadow-md flex items-center gap-2 relative overflow-hidden ${
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
                      <IconComponent className={`w-4 h-4 relative z-10 ${isActive ? 'animate-pulse' : ''}`} />
                      <span className="relative z-10">{tab.name}</span>
                      {isPrevious && (
                        <svg className="w-3 h-3 ml-1 text-ring" fill="currentColor" viewBox="0 0 20 20">
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
                    className="w-full px-4 py-3 bg-white dark:bg-card border-2 border-primary/20 dark:border-primary rounded-xl text-primary dark:text-primary/40 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {tabs.map((tab, index) => (
                      <option key={tab.name} value={tab.name} className="bg-white dark:bg-card py-2">
                        {`${index + 1}. ${tab.name}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
                    <svg className="w-5 h-5 text-primary dark:text-primary/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="flex gap-8 mb-8">
            <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col items-center">
              <span className="text-gray-500 dark:text-gray-400 text-md mb-2">Total Curriculum Credits</span>
              <span className="text-3xl font-bold text-primary dark:text-primary/40">{summary.totalCredits} Credits</span>
            </div>
            <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col items-center">
              <span className="text-gray-500 dark:text-gray-400 text-md mb-2">Required Core Courses</span>
              <span className="text-3xl font-bold text-primary dark:text-primary/40">{summary.requiredCore} Credits</span>
            </div>
            <div className="flex-1 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6 flex flex-col items-center">
              <span className="text-gray-500 dark:text-gray-400 text-md mb-2">Elective Credits</span>
              <span className="text-3xl font-bold text-primary dark:text-primary/40">{summary.electiveCredits} Credits</span>
            </div>
          </div>          {/* Tab Content */}
          {activeTab === "Courses" && (
            <CoursesTab 
              courses={coursesData} 
              onEditCourse={handleEditCourse}
              onDeleteCourse={handleDeleteCourse}
              onAddCourse={handleAddCourse}
            />
          )}          {activeTab === "Constraints" && (
            <ConstraintsTab courses={allCourses} curriculumId={curriculumId} />
          )}

          {activeTab === "Elective Rules" && (
            <ElectiveRulesTab curriculumId={curriculumId} />
          )}

          {activeTab === "Concentrations" && (
            <ConcentrationsTab />
          )}

          {activeTab === "Blacklist" && (
            <BlacklistTab curriculumId={curriculumId} />
          )}
          
          {/* Tab Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-border">
            <button
              onClick={goToPreviousTab}
              disabled={isFirstTab}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isFirstTab
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-primary dark:text-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20/20 hover:text-primary dark:hover:text-primary/30"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>
            
            <div className="flex items-center gap-2">
              {tabs.map((tab, index) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    activeTab === tab.name
                      ? "bg-primary w-6"
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
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isLastTab
                  ? "text-gray-400 dark:text-gray-600 cursor-not-allowed"
                  : "text-primary dark:text-primary/40 hover:bg-primary/10 dark:hover:bg-primary/20/20 hover:text-primary dark:hover:text-primary/30"
              }`}
            >
              Next
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
            </>
          )}
        </div>
      </div>      {/* Edit Course Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 sm:p-8 w-full max-w-[90vw] sm:max-w-[600px] lg:max-w-[700px] border border-gray-200 dark:border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Edit Course Details</h3><button
                suppressHydrationWarning
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
              {editingCourse && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Code</label>
                  <input
                    type="text"
                    value={editingCourse.code}
                    readOnly
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Course code cannot be modified</p>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Title</label>
                  <input
                    type="text"
                    value={editingCourse.title}
                    onChange={(e) => setEditingCourse({...editingCourse, title: e.target.value})}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors"
                    placeholder="Enter course title"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">Credits</label>
                    <input
                      type="number"
                      value={editingCourse.credits}
                      onChange={(e) => setEditingCourse({...editingCourse, credits: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors"
                      min="0"
                      max="6"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-foreground">Credit Hours</label>
                    <input
                      type="text"
                      value={editingCourse.creditHours}
                      onChange={(e) => setEditingCourse({...editingCourse, creditHours: e.target.value})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors"
                      placeholder="e.g., 3-0-6"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Format: Lecture-Lab-Total (e.g., 3-0-6)</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-foreground">Course Type</label>
                  <select
                    value={editingCourse.type}
                    onChange={(e) => setEditingCourse({...editingCourse, type: e.target.value})}
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring bg-background text-foreground transition-colors"
                  >
                    <option value="">Select Course Type</option>
                    <option value="Core">Core Course</option>
                    <option value="Major">Major Course</option>
                    <option value="Major Elective">Major Elective</option>
                    <option value="General Education">General Education</option>
                    <option value="Free Elective">Free Elective</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Choose the appropriate course type for curriculum requirements</p>
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
              <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-border">
              <button
                suppressHydrationWarning
                onClick={handleCloseEditModal}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                onClick={handleSaveEditCourse}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors border border-primary font-semibold shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}      {/* Add Course Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-card rounded-xl p-6 sm:p-8 w-full max-w-[90vw] sm:max-w-[600px] lg:max-w-[700px] border border-gray-200 dark:border-border shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-foreground">Add Course to Curriculum</h3>
              <button
                suppressHydrationWarning
                onClick={handleCloseAddModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Course Assignment Settings */}
              <div className="border border-gray-200 dark:border-border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                <h5 className="font-medium text-foreground mb-3">Course Assignment Settings</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Year</label>
                    <select
                      value={courseAssignment.year}
                      onChange={(e) => setCourseAssignment({...courseAssignment, year: parseInt(e.target.value)})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
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
                    <label className="block text-sm font-medium mb-1 text-foreground">Semester</label>
                    <select
                      value={courseAssignment.semester}
                      onChange={(e) => setCourseAssignment({...courseAssignment, semester: e.target.value})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
                    >
                      <option value="1">Semester 1</option>
                      <option value="2">Semester 2</option>
                      <option value="3">Summer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-foreground">Type</label>
                    <select
                      value={courseAssignment.isRequired ? 'required' : 'elective'}
                      onChange={(e) => setCourseAssignment({...courseAssignment, isRequired: e.target.value === 'required'})}
                      className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground text-sm"
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

            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-border">
              <button
                suppressHydrationWarning
                onClick={handleCloseAddModal}
                className="flex-1 px-6 py-3 border border-gray-300 dark:border-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                suppressHydrationWarning
                onClick={handleSaveAddCourse}
                disabled={!selectedCourse && (!showAddCourseForm || !newCourse.code || !newCourse.title)}
                className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors border border-primary font-semibold shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}