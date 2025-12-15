'use client';

import { useState, useEffect } from 'react';
import { electiveRulesApi, type ElectiveRule, type CurriculumCourse } from '@/services/electiveRulesApi';

interface ElectiveCourse {
  id: string;
  code: string;
  name: string;
  category: string;
  credits: number;
  requirement: 'Required' | 'Elective';
  semester: string;
  year: number;
}

interface ElectiveRulesTabProps {
  curriculumId: string;
}

export default function ElectiveRulesTab({ curriculumId }: ElectiveRulesTabProps) {
  const [electiveSearch, setElectiveSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [majorElectiveCredits, setMajorElectiveCredits] = useState('24');
  const [freeElectiveCredits, setFreeElectiveCredits] = useState('6');
  const [freeElectiveName, setFreeElectiveName] = useState('Free Electives');
  
  // Backend data states
  const [electiveCourses, setElectiveCourses] = useState<ElectiveCourse[]>([]);
  const [electiveRules, setElectiveRules] = useState<ElectiveRule[]>([]);
  const [categories, setCategories] = useState<string[]>(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Load data from backend
  useEffect(() => {
    if (curriculumId) {
      loadElectiveRulesData();
    }
  }, [curriculumId]);

  const loadElectiveRulesData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await electiveRulesApi.getElectiveRules(curriculumId);
      
      // Convert curriculum courses to our format
      const courses: ElectiveCourse[] = (data.curriculumCourses || []).map(course => ({
        id: course.id,
        code: course.code,
        name: course.name,
        category: course.category || 'Uncategorized',
        credits: course.credits,
        requirement: course.isRequired ? 'Required' : 'Elective',
        semester: course.semester,
        year: course.year
      }));
      
      setElectiveCourses(courses);
      setElectiveRules(data.electiveRules);
      
      // Set categories
      const allCategories = ['All', ...data.courseCategories];
      setCategories(allCategories);
      
      // Set free elective credits from rules
      const freeElectiveRule = data.electiveRules.find(rule => rule.category.toLowerCase().includes('free'));
      if (freeElectiveRule) {
        setFreeElectiveCredits(freeElectiveRule.requiredCredits.toString());
        setFreeElectiveName(freeElectiveRule.category);
      }
      
      // Set major elective credits from rules
      const majorElectiveRule = data.electiveRules.find(rule => rule.category === 'Major Elective');
      if (majorElectiveRule) {
        setMajorElectiveCredits(majorElectiveRule.requiredCredits.toString());
      }
      
    } catch (err) {
      console.error('Error loading elective rules data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load elective rules data');
    } finally {
      setLoading(false);
    }
  };  const updateCourseRequirement = async (courseIndex: number, requirement: 'Required' | 'Elective') => {
    try {
      setSaving(true);
      setError(null);
      
      const course = electiveCourses[courseIndex];
      const isRequired = requirement === 'Required';
      
      // Update locally first for immediate UI feedback
      setElectiveCourses(prev => 
        prev.map((c, idx) => 
          idx === courseIndex ? { ...c, requirement } : c
        )
      );
      
      // Update on backend
      await electiveRulesApi.updateElectiveSettings(curriculumId, {
        courseRequirements: [{
          courseId: course.id,
          isRequired
        }]
      });
      
    } catch (err) {
      console.error('Error updating course requirement:', err);
      setError(err instanceof Error ? err.message : 'Failed to update course requirement');
      // Revert local change on error
      await loadElectiveRulesData();
    } finally {
      setSaving(false);
    }
  };

  const updateFreeElectiveCredits = async (credits: string) => {
    try {
      setSaving(true);
      setError(null);
      
      const creditsNum = parseInt(credits) || 0;
      
      // Update locally first
      setFreeElectiveCredits(credits);
      
      // Update on backend - create or update the free elective rule
      await electiveRulesApi.updateElectiveSettings(curriculumId, {
        freeElectiveCredits: creditsNum
      });
      
    } catch (err) {
      console.error('Error updating free elective credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to update free elective credits');
      // Reload data on error
      await loadElectiveRulesData();
    } finally {
      setSaving(false);
    }
  };

  const updateFreeElectiveName = async (name: string) => {
    try {
      setSaving(true);
      setError(null);
      
      // Update locally first
      setFreeElectiveName(name);
      
      // Update on backend
      await electiveRulesApi.updateElectiveSettings(curriculumId, {
        freeElectiveName: name
      });
      
    } catch (err) {
      console.error('Error updating free elective name:', err);
      setError(err instanceof Error ? err.message : 'Failed to update free elective name');
      // Reload data on error
      await loadElectiveRulesData();
    } finally {
      setSaving(false);
    }
  };

  const saveConfiguration = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Save both free elective settings and all course requirements
      const courseRequirements = electiveCourses.map(course => ({
        courseId: course.id,
        isRequired: course.requirement === 'Required'
      }));
      
      await electiveRulesApi.updateElectiveSettings(curriculumId, {
        freeElectiveCredits: parseInt(freeElectiveCredits) || 0,
        freeElectiveName: freeElectiveName,
        courseRequirements
      });
      
      // Show success message (you could add a toast notification here)
      console.log('Configuration saved successfully');
      
    } catch (err) {
      console.error('Error saving configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const saveCourseSettings = async () => {
    if (!selectedCourse) return;
    
    try {
      setSaving(true);
      setError(null);
      
      const course = electiveCourses.find(c => c.code === selectedCourse);
      if (!course) return;
      
      // Save the current course's requirement status
      await electiveRulesApi.updateElectiveSettings(curriculumId, {
        courseRequirements: [{
          courseId: course.id,
          isRequired: course.requirement === 'Required'
        }]
      });
      
      console.log('Course settings saved successfully');
      
    } catch (err) {
      console.error('Error saving course settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save course settings');
    } finally {
      setSaving(false);
    }
  };
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

  // Loading state
  if (loading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading elective rules...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-xl p-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 dark:text-red-400">{error}</span>
          </div>
        </div>
        <button
          onClick={loadElectiveRulesData}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }
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
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-foreground">Minimum Total Credits Required</label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    defaultValue="0"
                    className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Minimum total credits a student must have completed to enroll in this elective
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-border">
                <button 
                  onClick={saveCourseSettings}
                  disabled={saving}
                  suppressHydrationWarning
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Course Settings'}
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
          {/* NOTE FOR BACKEND: Course types/categories will be queried from the database, 
              not using these predetermined types. The breakdown will be dynamic based on 
              actual course data from the curriculum. */}
          <h4 className="text-md font-bold mb-3 text-foreground">Category Breakdown</h4>
          <div className="space-y-3">
            {/* Always show free electives first */}
            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-border rounded-lg">
              <div>
                <h5 className="font-semibold text-sm text-foreground">{freeElectiveName}</h5>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Credit requirement only
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-600 dark:text-gray-400">{freeElectiveCredits} credits</div>
                <div className="text-xs text-gray-500">Variable courses</div>
              </div>
            </div>
            
            {/* Then show other categories from curriculum */}
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

        {/* Right Side - Free Electives Credits Configuration */}
        <div className="w-80 bg-white dark:bg-card border border-gray-200 dark:border-border rounded-xl p-6">
          <h3 className="text-lg font-bold mb-4 text-foreground">Free Electives Configuration</h3>
          
          <div className="space-y-6">
            {/* Free Electives Name Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Free Electives Category Name
              </label>
              <input
                type="text"
                value={freeElectiveName}
                onChange={(e) => setFreeElectiveName(e.target.value)}
                onBlur={(e) => updateFreeElectiveName(e.target.value)}
                disabled={saving}
                className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm disabled:opacity-50"
                placeholder="Free Electives"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Customize the name for free electives (e.g., "General Electives", "Open Electives")
              </p>
            </div>

            {/* Free Electives Credits Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-foreground">
                Required Credits
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="3"
                  value={freeElectiveCredits}
                  onChange={(e) => setFreeElectiveCredits(e.target.value)}
                  onBlur={(e) => updateFreeElectiveCredits(e.target.value)}
                  disabled={saving}
                  className="w-full border border-gray-300 dark:border-border rounded-lg px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm disabled:opacity-50"
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
              <h4 className="text-sm font-semibold text-foreground mb-3">Current Configuration</h4>                <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-400">{freeElectiveName}:</span>
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
              onClick={saveConfiguration}
              disabled={saving}
              className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-semibold hover:bg-primary/90 transition text-sm disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
