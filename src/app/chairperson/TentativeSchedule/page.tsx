'use client';

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Save, BookOpen, Calendar, Users, ArrowLeft, Upload, FileSpreadsheet, X } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import CourseDetailForm from '@/components/features/schedule/CourseDetailForm';
import * as XLSX from 'xlsx';

// Import chairperson components
import { PageHeader } from '@/components/role-specific/chairperson/PageHeader';
import { SearchBar } from '@/components/role-specific/chairperson/SearchBar';
import { LoadingSpinner } from '@/components/role-specific/chairperson/LoadingSpinner';
import { EmptyState } from '@/components/role-specific/chairperson/EmptyState';
import { ActionButton } from '@/components/role-specific/chairperson/ActionButton';
import { StatCard } from '@/components/role-specific/chairperson/StatCard';
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
  section?: string;
  day?: string;
  time?: string;
  instructor?: string;
  seatLimit?: number;
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
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const [uploadedCourses, setUploadedCourses] = useState<Course[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      showError('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    setUploadedFile(file);
    setLoading(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      // Map Excel columns to Course interface
      const courses: Course[] = jsonData.map((row, index) => {
        const course = row['Course'] || row['course'];
        const courseName = row['Course Name'] || row['course name'] || row['CourseName'] || row['name'];
        const section = row['Section'] || row['section'];
        const day = row['Day'] || row['day'];
        const time = row['Time'] || row['time'];
        const instructor = row['Instructor Name'] || row['instructor'] || row['Instructor'];
        const seatLimit = row['Seat Limit'] || row['seat limit'] || row['SeatLimit'];

        if (!course || !courseName) {
          warning(`Row ${index + 1}: Missing required fields (Course or Course Name)`);
        }

        return {
          id: `upload-${index}-${Date.now()}`,
          code: course || '',
          name: courseName || '',
          credits: 3, // Default value
          section: section || '',
          day: day || '',
          time: time || '',
          instructor: instructor || '',
          seatLimit: seatLimit ? parseInt(seatLimit) : undefined,
          category: 'Uploaded'
        };
      }).filter(course => course.code && course.name);

      if (courses.length === 0) {
        showError('No valid courses found in the Excel file. Please check the format.');
        setUploadedFile(null);
        return;
      }

      setUploadedCourses(courses);
      setShowUploadPreview(true);
      success(`Successfully parsed ${courses.length} courses from Excel file`);
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      showError('Failed to parse Excel file. Please check the file format.');
      setUploadedFile(null);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyUploadedCourses = () => {
    setSchedule(prev => ({
      ...prev,
      courses: [...prev.courses, ...uploadedCourses]
    }));
    success(`Added ${uploadedCourses.length} courses from Excel file`);
    setShowUploadPreview(false);
    setUploadedCourses([]);
    setUploadedFile(null);
  };

  const handleCancelUpload = () => {
    setShowUploadPreview(false);
    setUploadedCourses([]);
    setUploadedFile(null);
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
                
                {/* Excel Upload Section */}
                <div className="pt-4 border-t">
                  <Label className="mb-2 block">Upload Excel File</Label>
                  <div className="text-xs text-muted-foreground mb-3">
                    Required: Course, Course Name, Section, Day, Time<br />
                    Optional: Instructor Name, Seat Limit
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="excel-upload"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload size={16} />
                    {loading ? 'Processing...' : 'Choose Excel File'}
                  </button>
                  {uploadedFile && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <FileSpreadsheet size={12} />
                      {uploadedFile.name}
                    </div>
                  )}
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

      {/* Course Detail Modal */}
      <CourseDetailForm
        isOpen={showCourseDetailModal}
        courseName={selectedCourseForDetail?.name}
        courseCode={selectedCourseForDetail?.code}
        onSave={handleCourseDetailSave}
        onCancel={() => setShowCourseDetailModal(false)}
      />

      {/* Upload Preview Modal */}
      {showUploadPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h3 className="text-lg font-semibold">Excel Upload Preview</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Review {uploadedCourses.length} courses before adding to schedule
                </p>
              </div>
              <button
                onClick={handleCancelUpload}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">#</th>
                      <th className="text-left p-3 font-medium">Course</th>
                      <th className="text-left p-3 font-medium">Course Name</th>
                      <th className="text-left p-3 font-medium">Section</th>
                      <th className="text-left p-3 font-medium">Day</th>
                      <th className="text-left p-3 font-medium">Time</th>
                      <th className="text-left p-3 font-medium">Instructor</th>
                      <th className="text-left p-3 font-medium">Seats</th>
                    </tr>
                  </thead>
                  <tbody>
                    {uploadedCourses.map((course, index) => (
                      <tr key={course.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-sm">{index + 1}</td>
                        <td className="p-3 text-sm font-medium">{course.code}</td>
                        <td className="p-3 text-sm">{course.name}</td>
                        <td className="p-3 text-sm">{course.section || '-'}</td>
                        <td className="p-3 text-sm">{course.day || '-'}</td>
                        <td className="p-3 text-sm">{course.time || '-'}</td>
                        <td className="p-3 text-sm">{course.instructor || '-'}</td>
                        <td className="p-3 text-sm">{course.seatLimit || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 p-6 border-t bg-muted/30">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyUploadedCourses}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
              >
                <Plus size={16} />
                Add {uploadedCourses.length} Courses to Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TentativeSchedulePage;
