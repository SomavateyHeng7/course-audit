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
      const response = await fetch('/api/courses/available');
      
      if (response.ok) {
        const data = await response.json();
        setAvailableCourses(data.courses || []);
      } else {
        console.error('Failed to load available courses');
        showError('Failed to load available courses');
      }
    } catch (error) {
      console.error('Error loading available courses:', error);
      showError('Error loading courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCoursePlans = async () => {
    try {
      const response = await fetch('/api/course-plans');
      
      if (response.ok) {
        const data = await response.json();
        const plans = data.plans || [];
        setCoursePlans(plans);
        
        // Auto-select first plan if available
        if (plans.length > 0) {
          setSelectedPlan(plans[0]);
        }
      } else {
        console.error('Failed to load course plans');
        showError('Failed to load course plans');
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
      const response = await fetch('/api/course-plans/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedPlan),
      });

      if (response.ok) {
        success('Course plan saved successfully!');
        setSelectedPlan(prev => prev ? { ...prev, lastModified: new Date().toISOString() } : null);
      } else {
        showError('Failed to save course plan');
      }
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
        <div className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground mb-2">
                Plan Future Courses
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Plan your academic journey by organizing courses across semesters
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="mb-6 flex space-x-4">
              <button
                onClick={() => setViewMode('plan')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'plan'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FaCalendarAlt className="w-4 h-4 inline mr-2" />
                My Plans
              </button>
              <button
                onClick={() => setViewMode('browse')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'browse'
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <FaEye className="w-4 h-4 inline mr-2" />
                Browse Courses
              </button>
            </div>

            {viewMode === 'plan' ? (
              /* Course Planning View */
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Left Panel - Course Plans */}
                <div className="lg:col-span-1">
                  <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground">
                        Course Plans
                      </h2>
                      <button
                        onClick={createNewPlan}
                        className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <FaPlus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {coursePlans.map((plan) => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlan(plan)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedPlan?.id === plan.id
                              ? 'bg-primary/10 border-2 border-primary'
                              : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                          }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-foreground">
                            {plan.name}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
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
                        className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {loading ? 'Saving...' : 'Save Plan'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Right Panel - Plan Details */}
                <div className="lg:col-span-3">
                  {selectedPlan ? (
                    <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-6">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-foreground">
                            {selectedPlan.name}
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Created: {new Date(selectedPlan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Semester Planning Area */}
                      <div className="space-y-6">
                        {selectedPlan.semesters.length > 0 ? (
                          selectedPlan.semesters.map((semester) => (
                            <div
                              key={semester.id}
                              className="border border-gray-200 dark:border-border rounded-lg p-4"
                            >
                              <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                                  {semester.name} - {semester.totalCredits} Credits
                                </h3>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {semester.courses.map((course) => (
                                  <div
                                    key={course.id}
                                    className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3"
                                  >
                                    <div className="font-medium text-gray-900 dark:text-foreground">
                                      {course.code}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
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
                          <div className="text-center py-16">
                            <FaCalendarAlt className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                              Start Planning Your Semesters
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              Add semesters and courses to create your academic plan.
                            </p>
                            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                              Add First Semester
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-6">
                      <div className="text-center py-16">
                        <FaBook className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                          Select a Course Plan
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Choose a plan from the sidebar or create a new one to start planning your courses.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Course Browse View */
              <div className="space-y-6">
                
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search courses by code or name..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-background text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  <div className="sm:w-64">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-border rounded-lg bg-white dark:bg-background text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
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
                <div className="bg-white dark:bg-card rounded-lg shadow-sm border border-gray-200 dark:border-border p-6">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
                    </div>
                  ) : filteredCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCourses.map((course) => (
                        <div
                          key={course.id}
                          className="border border-gray-200 dark:border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold text-gray-900 dark:text-foreground">
                                  {course.code}
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {course.name}
                                </p>
                              </div>
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                {course.credits} credits
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              {course.description}
                            </p>
                            
                            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                              <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded">
                                {course.category}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
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
                    <div className="text-center py-16">
                      <FaSearch className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-foreground mb-2">
                        No courses found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
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
