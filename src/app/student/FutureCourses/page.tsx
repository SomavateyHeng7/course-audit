'use client';

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaCalendarAlt, FaBook, FaUser, FaPlus, FaTrash, FaSearch, FaSave, FaEye } from 'react-icons/fa';
import { useToastHelpers } from '@/hooks/useToast';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  prerequisites: string[];
  category: string;
  department: string;
  description: string;
}

interface PlannedSemester {
  id: string;
  name: string;
  year: number;
  semester: 'Fall' | 'Spring' | 'Summer';
  courses: Course[];
  totalCredits: number;
}

interface CoursePlan {
  id: string;
  name: string;
  semesters: PlannedSemester[];
  createdAt: string;
  lastModified: string;
}

const FutureCoursesPage: React.FC = () => {
  const router = useRouter();
  const { success, error: showError, warning, info } = useToastHelpers();

  // State management
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CoursePlan | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'plan' | 'browse'>('plan');

  // Load available courses and plans
  useEffect(() => {
    loadAvailableCourses();
    loadCoursePlans();
  }, []);

  const loadAvailableCourses = async () => {
    try {
      setLoading(true);
      
      // Mock available courses data
      const mockCourses: Course[] = [
        {
          id: '1',
          code: 'CS301',
          name: 'Database Systems',
          credits: 3,
          prerequisites: ['CS201', 'CS202'],
          category: 'Core',
          department: 'Computer Science',
          description: 'Introduction to database design, implementation, and management systems.'
        },
        {
          id: '2',
          code: 'CS302',
          name: 'Software Engineering',
          credits: 3,
          prerequisites: ['CS201'],
          category: 'Core',
          department: 'Computer Science',
          description: 'Software development methodologies, project management, and quality assurance.'
        },
        {
          id: '3',
          code: 'CS303',
          name: 'Computer Networks',
          credits: 3,
          prerequisites: ['CS201'],
          category: 'Core',
          department: 'Computer Science',
          description: 'Network protocols, architecture, and distributed systems fundamentals.'
        },
        {
          id: '4',
          code: 'CS401',
          name: 'Machine Learning',
          credits: 3,
          prerequisites: ['CS301', 'MATH301'],
          category: 'Elective',
          department: 'Computer Science',
          description: 'Introduction to machine learning algorithms and artificial intelligence.'
        },
        {
          id: '5',
          code: 'CS402',
          name: 'Web Development',
          credits: 3,
          prerequisites: ['CS201'],
          category: 'Elective',
          department: 'Computer Science',
          description: 'Modern web development technologies and frameworks.'
        },
        {
          id: '6',
          code: 'CS501',
          name: 'Artificial Intelligence',
          credits: 3,
          prerequisites: ['CS401'],
          category: 'Advanced',
          department: 'Computer Science',
          description: 'Advanced AI concepts, neural networks, and deep learning.'
        },
        {
          id: '7',
          code: 'MATH301',
          name: 'Statistics',
          credits: 3,
          prerequisites: ['MATH201'],
          category: 'Mathematics',
          department: 'Mathematics',
          description: 'Statistical analysis, probability theory, and data interpretation.'
        }
      ];
      
      setAvailableCourses(mockCourses);
    } catch (error) {
      console.error('Error loading available courses:', error);
      showError('Error loading courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCoursePlans = async () => {
    try {
      // Mock course plans data
      const mockPlans: CoursePlan[] = [
        {
          id: '1',
          name: 'Computer Science Degree Plan',
          semesters: [
            {
              id: '1',
              name: 'Fall 2024',
              year: 2024,
              semester: 'Fall',
              courses: [
                {
                  id: '1',
                  code: 'CS301',
                  name: 'Database Systems',
                  credits: 3,
                  prerequisites: ['CS201', 'CS202'],
                  category: 'Core',
                  department: 'Computer Science',
                  description: 'Introduction to database design, implementation, and management systems.'
                }
              ],
              totalCredits: 3
            }
          ],
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastModified: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'My Academic Plan',
          semesters: [],
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      
      setCoursePlans(mockPlans);
      
      // Auto-select first plan if available
      if (mockPlans.length > 0) {
        setSelectedPlan(mockPlans[0]);
      }
    } catch (error) {
      console.error('Error loading course plans:', error);
      showError('Error loading course plans. Please try again.');
    }
  };

  const createNewPlan = () => {
    const newPlan: CoursePlan = {
      id: Date.now().toString(),
      name: `My Plan ${coursePlans.length + 1}`,
      semesters: [],
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    
    setCoursePlans(prev => [...prev, newPlan]);
    setSelectedPlan(newPlan);
    success('New course plan created!');
  };

  const savePlan = async () => {
    if (!selectedPlan) return;

    try {
      setLoading(true);
      
      // Mock save operation - simulate successful save
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      success('Course plan saved successfully!');
      setSelectedPlan(prev => prev ? { ...prev, lastModified: new Date().toISOString() } : null);
      
      // Update the plan in the list
      setCoursePlans(prev => prev.map(plan => 
        plan.id === selectedPlan.id 
          ? { ...selectedPlan, lastModified: new Date().toISOString() }
          : plan
      ));
    } catch (error) {
      console.error('Error saving course plan:', error);
      showError('Error saving course plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter courses based on search and category
  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories
  const categories = ['all', ...new Set(availableCourses.map(course => course.category))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-foreground mb-2">
                Plan Future Courses
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                Plan your academic journey by organizing courses across semesters
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => setViewMode('plan')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  viewMode === 'plan'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                My Plans
              </button>
              <button
                onClick={() => setViewMode('browse')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  viewMode === 'browse'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FaEye className="w-3 h-3 sm:w-4 sm:h-4 inline mr-2" />
                Browse Courses
              </button>
            </div>

            {viewMode === 'plan' ? (
              /* Course Planning View */
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                
                {/* Left Panel - Course Plans */}
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-4 sm:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-foreground">
                        Course Plans
                      </h2>
                      <button
                        onClick={createNewPlan}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors touch-manipulation"
                      >
                        <FaPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {coursePlans.map((plan) => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors touch-manipulation ${
                            selectedPlan?.id === plan.id
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                          }`}
                        >
                          <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-foreground">
                            {plan.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {plan.semesters.length} semesters
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            Modified: {new Date(plan.lastModified).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedPlan && (
                      <button
                        onClick={savePlan}
                        disabled={loading}
                        className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm sm:text-base touch-manipulation"
                      >
                        {loading ? 'Saving...' : 'Save Plan'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Panel - Plan Details */}
                <div className="lg:col-span-3">
                  {selectedPlan ? (
                    <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-foreground">
                            {selectedPlan.name}
                          </h2>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            Created: {new Date(selectedPlan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Semester Planning Area */}
                      <div className="space-y-4 sm:space-y-6">
                        {selectedPlan.semesters.length > 0 ? (
                          selectedPlan.semesters.map((semester) => (
                            <div
                              key={semester.id}
                              className="border border-gray-200 dark:border-border rounded-lg p-3 sm:p-4"
                            >
                              <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-foreground">
                                  {semester.name} - {semester.totalCredits} Credits
                                </h3>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                                {semester.courses.map((course) => (
                                  <div
                                    key={course.id}
                                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 touch-manipulation"
                                  >
                                    <div className="font-medium text-sm sm:text-base text-gray-900 dark:text-foreground">
                                      {course.code}
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                      {course.name}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-500">
                                      {course.credits} credits
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 sm:py-16">
                            <FaCalendarAlt className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                              Start Planning Your Semesters
                            </h3>
                            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4">
                              Add semesters and courses to create your academic plan.
                            </p>
                            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm sm:text-base touch-manipulation">
                              Add First Semester
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-4 sm:p-6">
                      <div className="text-center py-12 sm:py-16">
                        <FaBook className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                          Select a Course Plan
                        </h3>
                        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                          Choose a plan from the sidebar or create a new one to start planning your courses.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Course Browse View */
              <div className="space-y-4 sm:space-y-6">
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search courses by code or name..."
                        className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-background text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm sm:text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:w-64">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-background text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm sm:text-base"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Course Grid */}
                <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-4 sm:p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Loading courses...</p>
                    </div>
                  ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {filteredCourses.map((course) => (
                        <div
                          key={course.id}
                          className="border border-gray-200 dark:border-border rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow touch-manipulation"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base text-gray-900 dark:text-foreground">
                                  {course.code}
                                </h4>
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {course.name}
                                </p>
                              </div>
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded ml-2 flex-shrink-0">
                                {course.credits} credits
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                              {course.description}
                            </p>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                {course.category}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate ml-2">
                                {course.department}
                              </span>
                            </div>

                            {course.prerequisites.length > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-500">
                                <strong>Prerequisites:</strong> {course.prerequisites.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 sm:py-16">
                      <FaSearch className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                        No courses found
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                        Try adjusting your search terms or category filter.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FutureCoursesPage;
