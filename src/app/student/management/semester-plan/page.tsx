'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus, Trash2, ArrowLeft, Save, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  category: string;
  prerequisites?: string[];
  description?: string;
}

interface PlannedCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  category: string;
}

interface SemesterPlan {
  semester: string;
  year: number;
  courses: PlannedCourse[];
  totalCredits: number;
}

export default function SemesterPlanPage() {
  const router = useRouter();
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [semesterYear, setSemesterYear] = useState('2026');
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadStudentData();
    loadSavedPlan();
  }, []);

  const loadStudentData = () => {
    if (typeof window !== 'undefined') {
      // Try unified studentAuditData first (primary data source)
      let stored = localStorage.getItem('studentAuditData');
      
      // Fallback to legacy studentDataEntryContext if primary not found
      if (!stored) {
        stored = localStorage.getItem('studentDataEntryContext');
      }
      
      if (stored) {
        const data = JSON.parse(stored);
        setStudentInfo(data);
        
        // Load courses from curriculum data or courses array
        if (data.courses) {
          const courses: Course[] = data.courses.map((course: any) => ({
            id: course.id || course.courseId || Math.random().toString(),
            code: course.code || course.courseCode,
            name: course.name || course.courseName,
            credits: course.credits || 3,
            category: course.category || 'Core',
            prerequisites: course.prerequisites || [],
            description: course.description || ''
          }));
          setAvailableCourses(courses);
        }
      }
      setLoading(false);
    }
  };

  const loadSavedPlan = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('semesterPlan');
      if (saved) {
        const plan: SemesterPlan = JSON.parse(saved);
        setPlannedCourses(plan.courses || []);
        setSelectedSemester(plan.semester || '');
        setSemesterYear(plan.year?.toString() || '2026');
      }
    }
  };

  const savePlan = () => {
    if (!selectedSemester) {
      alert('Please select a semester');
      return;
    }

    const plan: SemesterPlan = {
      semester: selectedSemester,
      year: parseInt(semesterYear),
      courses: plannedCourses,
      totalCredits: totalCredits
    };

    localStorage.setItem('semesterPlan', JSON.stringify(plan));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const addCourse = (course: Course) => {
    if (plannedCourses.find(c => c.code === course.code)) {
      alert('Course already added to plan');
      return;
    }

    const newCourse: PlannedCourse = {
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
      category: course.category
    };

    setPlannedCourses([...plannedCourses, newCourse]);
  };

  const removeCourse = (courseId: string) => {
    setPlannedCourses(plannedCourses.filter(c => c.id !== courseId));
  };

  const totalCredits = plannedCourses.reduce((sum, course) => sum + course.credits, 0);

  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const notPlanned = !plannedCourses.find(c => c.code === course.code);
    return matchesSearch && matchesCategory && notPlanned;
  });

  const categories = ['all', ...new Set(availableCourses.map(c => c.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Calendar className="w-8 h-8" />
              Semester Course Planning
            </h1>
            <p className="text-muted-foreground mt-2">
              Plan your courses for the upcoming semester
            </p>
            {studentInfo && (
              <p className="text-sm text-muted-foreground mt-1">
                {studentInfo.departmentName} - {studentInfo.curriculumName}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Semester Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Semester Information</CardTitle>
          <CardDescription>Select the semester you're planning for</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Semester</label>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Semester 1</SelectItem>
                  <SelectItem value="2">Semester 2</SelectItem>
                  <SelectItem value="summer">Summer Session</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Year</label>
              <Input
                type="text"
                value={semesterYear}
                onChange={(e) => setSemesterYear(e.target.value)}
                placeholder="e.g., 2026"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Courses */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Courses</CardTitle>
              <CardDescription>Search and select courses to add to your plan</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter */}
              <div className="space-y-4 mb-6">
                <Input
                  placeholder="Search courses by code or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Course List */}
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No courses available</p>
                  </div>
                ) : (
                  filteredCourses.map(course => (
                    <Card key={course.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-foreground">{course.code}</h3>
                              <Badge variant="secondary">{course.category}</Badge>
                              <Badge variant="outline">{course.credits} credits</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{course.name}</p>
                            {course.prerequisites && course.prerequisites.length > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Prerequisites: {course.prerequisites.join(', ')}
                              </p>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => addCourse(course)}
                            className="ml-4"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Planned Courses */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Your Plan</CardTitle>
              <CardDescription>
                {selectedSemester && semesterYear ? 
                  `Semester ${selectedSemester}/${semesterYear}` : 
                  'Select semester above'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Summary */}
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Total Credits:</span>
                  <span className="text-2xl font-bold text-primary">{totalCredits}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Courses:</span>
                  <span className="text-lg font-semibold">{plannedCourses.length}</span>
                </div>
              </div>

              {/* Credit Warning */}
              {totalCredits > 21 && (
                <Alert className="mb-4 border-yellow-500">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    You're planning {totalCredits} credits. Maximum is typically 21 credits per semester.
                  </AlertDescription>
                </Alert>
              )}

              {/* Planned Course List */}
              <div className="space-y-2 mb-4 max-h-[400px] overflow-y-auto">
                {plannedCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No courses planned yet</p>
                  </div>
                ) : (
                  plannedCourses.map(course => (
                    <Card key={course.id} className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {course.code}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {course.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {course.credits} credits
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeCourse(course.id)}
                          className="ml-2 h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={savePlan}
                  disabled={!selectedSemester || plannedCourses.length === 0}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Plan
                </Button>
                
                {saveSuccess && (
                  <Alert className="border-green-500">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-sm">
                      Plan saved successfully!
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="outline"
                  onClick={() => router.push('/student/management/course-planning')}
                  className="w-full"
                >
                  View Schedule Options
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
