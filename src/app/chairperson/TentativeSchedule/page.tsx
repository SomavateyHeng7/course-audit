'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Save, BookOpen, Calendar, Users, ArrowLeft } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import CourseDetailForm from '@/components/schedule/CourseDetailForm';

// Import chairperson components
import { PageHeader } from '@/components/chairperson/PageHeader';
import { SearchBar } from '@/components/chairperson/SearchBar';
import { LoadingSpinner } from '@/components/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/chairperson/EmptyState';
import { ActionButton } from '@/components/chairperson/ActionButton';
import { StatCard } from '@/components/chairperson/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  description?: string;
  category?: string;
}

interface ScheduleData {
  name: string;
  semester: string;
  version: string;
  courses: Course[];
}

const TentativeSchedulePage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { success, error: showError, warning } = useToastHelpers();

  const [schedule, setSchedule] = useState<ScheduleData>({
    name: '',
    semester: '',
    version: '',
    courses: []
  });

  const [courseSearch, setCourseSearch] = useState('');
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const [showCourseDetailModal, setShowCourseDetailModal] = useState(false);
  const [selectedCourseForDetail, setSelectedCourseForDetail] = useState<Course | null>(null);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth');
    else if (session.user.role !== 'CHAIRPERSON') router.push('/dashboard');
  }, [session, status, router]);

  useEffect(() => {
    if (session && session.user.role === 'CHAIRPERSON') loadAvailableCourses();
  }, [session]);

  useEffect(() => {
    if (!courseSearch.trim()) setFilteredCourses(availableCourses);
    else {
      const filtered = availableCourses.filter(course =>
        course.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
        course.name.toLowerCase().includes(courseSearch.toLowerCase())
      );
      setFilteredCourses(filtered);
    }
  }, [courseSearch, availableCourses]);

  const loadAvailableCourses = async () => {
    setLoading(true);
    try {
      const mockCourses: Course[] = [
        { id: '1', code: 'CSX3003', name: 'Data Structure', credits: 3, category: 'Core' },
        { id: '2', code: 'CSX3001', name: 'Database Systems', credits: 3, category: 'Core' },
        { id: '3', code: 'CSX3002', name: 'Software Engineering', credits: 3, category: 'Core' },
        { id: '4', code: 'CSX3004', name: 'Computer Networks', credits: 3, category: 'Core' },
        { id: '5', code: 'CSX4001', name: 'Machine Learning', credits: 3, category: 'Elective' },
        { id: '6', code: 'CSX4002', name: 'Web Development', credits: 3, category: 'Elective' }
      ];
      setAvailableCourses(mockCourses);
      setFilteredCourses(mockCourses);
    } catch {
      showError('Error loading courses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourse = (course: Course) => {
    if (schedule.courses.some(selected => selected.id === course.id)) {
      warning('Course already added');
      return;
    }
    setSelectedCourseForDetail(course);
    setShowCourseDetailModal(true);
  };

  const handleCourseDetailSave = () => {
    if (!selectedCourseForDetail) return;
    setSchedule(prev => ({
      ...prev,
      courses: [...prev.courses, selectedCourseForDetail]
    }));
    success(`${selectedCourseForDetail.code} added`);
    setShowCourseDetailModal(false);
    setSelectedCourseForDetail(null);
  };

  const handleRemoveCourse = (id: string) => {
    setSchedule(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c.id !== id)
    }));
    success('Course removed');
  };

  const handleSaveSchedule = async () => {
    if (!schedule.name || !schedule.semester || !schedule.version || schedule.courses.length === 0) {
      showError('Please complete all fields and select at least one course.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    success('Schedule saved successfully!');
    setSchedule({ name: '', semester: '', version: '', courses: [] });
    setLoading(false);
  };

  if (status === 'loading')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
      </div>
    );

  if (!session || session.user.role !== 'CHAIRPERSON') return null;

  const totalCredits = schedule.courses.reduce((sum, course) => sum + course.credits, 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="Create Tentative Schedule"
          description="Plan, review, and finalize course schedules for upcoming semesters"
          backButton={{
            label: "Back to Dashboard",
            onClick: () => router.back()
          }}
          actions={[
            {
              label: "Save Schedule",
              onClick: handleSaveSchedule,
              disabled: loading || !schedule.name || !schedule.semester || !schedule.version || schedule.courses.length === 0,
              icon: <Save size={16} />
            }
          ]}
        />

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Available Courses"
            value={availableCourses.length}
            subtitle="Total courses"
            icon={<BookOpen size={20} />}
          />
          <StatCard
            title="Selected Courses"
            value={schedule.courses.length}
            subtitle="In current schedule"
            icon={<Calendar size={20} />}
          />
          <StatCard
            title="Total Credits"
            value={totalCredits}
            subtitle="Credit hours"
            icon={<Users size={20} />}
          />
          <StatCard
            title="Progress"
            value={`${Math.round((schedule.courses.length / Math.max(availableCourses.length, 1)) * 100)}%`}
            subtitle="Selection completed"
            icon={<Search size={20} />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left: Form + Course List */}
          <div className="space-y-6">
            {/* Basic Info Form */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Schedule Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={schedule.name}
                    onChange={e => setSchedule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter schedule name"
                  />
                </div>
                <div>
                  <Label htmlFor="semester">Semester</Label>
                  <Input
                    id="semester"
                    type="text"
                    value={schedule.semester}
                    onChange={e => setSchedule(prev => ({ ...prev, semester: e.target.value }))}
                    placeholder="e.g., Fall 2024"
                  />
                </div>
                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input
                    id="version"
                    type="text"
                    value={schedule.version}
                    onChange={e => setSchedule(prev => ({ ...prev, version: e.target.value }))}
                    placeholder="e.g., 1.0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Course Search and Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Available Courses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <SearchBar
                    value={courseSearch}
                    onChange={setCourseSearch}
                    placeholder="Search courses by code or name..."
                    className="w-full"
                  />
                </div>

                <div className="h-80 overflow-y-auto border rounded-lg p-2">
                  {loading ? (
                    <LoadingSpinner text="Loading courses..." />
                  ) : filteredCourses.length > 0 ? (
                    <div className="space-y-2">
                      {filteredCourses.map(course => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {course.code}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {course.name} • {course.credits} credits
                            </div>
                            {course.category && (
                              <div className="text-xs text-muted-foreground">
                                {course.category}
                              </div>
                            )}
                          </div>
                          <ActionButton
                            variant="default"
                            size="sm"
                            onClick={() => handleAddCourse(course)}
                            disabled={schedule.courses.some(c => c.id === course.id)}
                            icon={<Plus size={14} />}
                            tooltip="Add to schedule"
                          >
                            Add
                          </ActionButton>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Search size={32} />}
                      title="No courses found"
                      description="Try adjusting your search terms to find courses"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Selected Courses */}
          <div className="lg:sticky lg:top-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Selected Courses</CardTitle>
                <div className="text-sm text-muted-foreground">
                  {schedule.courses.length} courses • {totalCredits} credits
                </div>
              </CardHeader>
              <CardContent>
                <div className="min-h-[400px]">
                  {schedule.courses.length > 0 ? (
                    <div className="space-y-3">
                      {schedule.courses.map(course => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-foreground truncate">
                              {course.code}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {course.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {course.credits} credits
                              {course.category && ` • ${course.category}`}
                            </div>
                          </div>
                          <ActionButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCourse(course.id)}
                            icon={<Trash2 size={14} />}
                            tooltip="Remove from schedule"
                            className="text-destructive hover:text-destructive"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      icon={<Calendar size={32} />}
                      title="No courses selected"
                      description="Search and add courses from the left panel to build your schedule"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modal */}
      <CourseDetailForm
        isOpen={showCourseDetailModal}
        courseName={selectedCourseForDetail?.name}
        courseCode={selectedCourseForDetail?.code}
        onSave={handleCourseDetailSave}
        onCancel={() => setShowCourseDetailModal(false)}
      />
    </div>
  );
};

export default TentativeSchedulePage;
