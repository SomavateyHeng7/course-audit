'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, Trash2, Save, BookOpen, Calendar, Users, ArrowLeft, Upload, FileSpreadsheet, X, Download } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import CourseDetailForm from '@/components/features/schedule/CourseDetailForm';
import * as XLSX from 'xlsx';
import { getPublicCurricula } from '@/lib/api/laravel';
import { exportScheduleToPDF } from '@/lib/pdfExport';

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
  dayTimeSlots?: Array<{ day: string; startTime: string; endTime: string }>; // Support for multiple day-time combinations
  days?: string[]; // Legacy: for backwards compatibility with simple day list
  time?: string; // Legacy: for backwards compatibility with single time
  instructor?: string;
  seatLimit?: number;
}

interface ScheduleData {
  id?: string;
  name: string;
  semester: string;
  version: string;
  versionTimestamp?: string;
  department?: string;
  batch?: string;
  curriculumId?: string;
  curriculumName?: string;
  courses: Course[];
  createdAt?: string;
  updatedAt?: string;
}

interface Curriculum {
  id: string;
  name: string;
  year: string;
  startId: string;
  endId: string;
  totalCredits: number;
  curriculumCourses?: CurriculumCourse[];
}

interface CurriculumCourse {
  id: string;
  course: {
    id: string;
    code: string;
    title: string;
    credits: number;
    description?: string;
  };
  departmentCourseType?: {
    name: string;
  };
  isRequired: boolean;
}

const TentativeSchedulePage: React.FC = () => {
  const router = useRouter();
  const { success, error: showError, warning } = useToastHelpers();

  const [schedule, setSchedule] = useState<ScheduleData>({
    name: '',
    semester: '',
    version: '1.0',
    versionTimestamp: new Date().toISOString(),
    department: '',
    batch: '',
    curriculumId: '',
    curriculumName: '',
    courses: []
  });

  // Curriculum data
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [loadingCurricula, setLoadingCurricula] = useState(false);

  const [scheduleVersions, setScheduleVersions] = useState<ScheduleData[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [instructorsList, setInstructorsList] = useState<string[]>(['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Prof. Brown', 'Prof. Davis']);

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

  // Fetch curricula on component mount
  useEffect(() => {
    const fetchCurricula = async () => {
      try {
        setLoadingCurricula(true);
        const response = await getPublicCurricula();
        if (response.curricula) {
          setCurricula(response.curricula);
        }
      } catch (error) {
        console.error('Error fetching curricula:', error);
        showError('Failed to fetch curricula');
      } finally {
        setLoadingCurricula(false);
      }
    };

    fetchCurricula();
  }, []);

  // Handle curriculum selection
  const handleCurriculumChange = (curriculumId: string) => {
    const curriculum = curricula.find(c => c.id === curriculumId);
    if (curriculum) {
      setSelectedCurriculum(curriculum);
      
      // Convert curriculum courses to available courses
      const curriculumCourses: Course[] = curriculum.curriculumCourses?.map(cc => ({
        id: cc.course.id,
        code: cc.course.code,
        name: cc.course.title,
        credits: cc.course.credits,
        description: cc.course.description,
        category: cc.departmentCourseType?.name || (cc.isRequired ? 'Required' : 'Elective')
      })) || [];

      setAvailableCourses(curriculumCourses);
      setFilteredCourses(curriculumCourses);

      // Update schedule with curriculum info
      setSchedule(prev => ({
        ...prev,
        curriculumId: curriculum.id,
        curriculumName: curriculum.name,
        batch: `${curriculum.year} (${curriculum.startId}-${curriculum.endId})`,
        // Clear existing courses when changing curriculum
        courses: []
      }));
      
      success(`Loaded ${curriculumCourses.length} courses from ${curriculum.name}`);
    } else {
      setSelectedCurriculum(null);
      setAvailableCourses([]);
      setFilteredCourses([]);
      setSchedule(prev => ({
        ...prev,
        curriculumId: '',
        curriculumName: '',
        batch: '',
        courses: []
      }));
    }
  };



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

  // Load saved versions from localStorage on mount
  useEffect(() => {
    try {
      const savedVersions = localStorage.getItem('tentativeScheduleVersions');
      if (savedVersions) {
        const versions = JSON.parse(savedVersions) as ScheduleData[];
        setScheduleVersions(versions);
      }
    } catch (error) {
      console.error('Error loading saved versions:', error);
    }
    loadAvailableCourses();
  }, []);

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

  const handleCourseDetailSave = (courseData?: any) => {
    if (!selectedCourseForDetail) return;
    
    // Merge the selected course with the form data from CourseDetailForm
    const courseWithDetails: Course = {
      ...selectedCourseForDetail,
      section: courseData?.section,
      dayTimeSlots: courseData?.dayTimeSlots || [],
      instructor: courseData?.instructor,
      seatLimit: courseData?.seat ? parseInt(courseData.seat) : undefined
    };
    
    setSchedule(prev => ({
      ...prev,
      courses: [...prev.courses, courseWithDetails]
    }));
    success(`${selectedCourseForDetail.code} added with ${courseData?.dayTimeSlots?.length || 0} time slot(s)`);
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
        const dayInput = row['Day'] || row['day'] || '';
        const time = row['Time'] || row['time'];
        const instructor = row['Instructor Name'] || row['instructor'] || row['Instructor'];
        const seatLimit = row['Seat Limit'] || row['seat limit'] || row['SeatLimit'];

        // Parse days - support comma or semicolon separated values
        const days: string[] = dayInput 
          ? dayInput.toString().split(/[,;]/).map((d: string) => d.trim()).filter((d: string) => d.length > 0)
          : [];

        // Create dayTimeSlots if we have days and time
        let dayTimeSlots: Array<{ day: string; startTime: string; endTime: string }> | undefined;
        if (days.length > 0 && time) {
          // Parse time (format: "HH:MM - HH:MM" or "HH:MM-HH:MM")
          const timeMatch = time.toString().match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
          if (timeMatch) {
            const [, startTime, endTime] = timeMatch;
            // Apply the same time to all days (Excel format limitation)
            dayTimeSlots = days.map(day => ({
              day,
              startTime,
              endTime
            }));
          }
        }

        if (!course || !courseName) {
          warning(`Row ${index + 1}: Missing required fields (Course or Course Name)`);
        }

        return {
          id: `upload-${index}-${Date.now()}`,
          code: course || '',
          name: courseName || '',
          credits: 3, // Default value
          section: section || '',
          dayTimeSlots: dayTimeSlots,
          days: days.length > 0 ? days : undefined, // Keep for backwards compatibility
          time: time || '', // Keep for backwards compatibility
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
    if (!schedule.name || !schedule.semester || schedule.courses.length === 0) {
      showError('Please complete all fields and select at least one course.');
      return;
    }
    setLoading(true);
    
    // Generate automatic version with timestamp
    const timestamp = new Date();
    const versionNumber = scheduleVersions.length + 1;
    const formattedTime = timestamp.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    const versionName = `v${versionNumber}.0 - ${formattedTime}`;
    
    // Create new version entry
    const newVersion: ScheduleData = {
      ...schedule,
      id: `schedule-${Date.now()}`,
      version: versionName,
      versionTimestamp: timestamp.toISOString(),
      createdAt: timestamp.toISOString(),
      updatedAt: timestamp.toISOString()
    };
    
    // Add to version history
    const updatedVersions = [...scheduleVersions, newVersion];
    setScheduleVersions(updatedVersions);
    setSelectedVersion(newVersion.id || null);
    
    // Store in localStorage for persistence
    try {
      localStorage.setItem('tentativeScheduleVersions', JSON.stringify(updatedVersions));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
    
    await new Promise(r => setTimeout(r, 1000));
    success(`Schedule saved as ${versionName}!`);
    setLoading(false);
    
    // Navigate back to the list page to view the saved schedule
    setTimeout(() => {
      router.push('/chairperson/TentativeSchedule');
    }, 1500);
  };

  // Export schedule to PDF
  const handleExportPDF = () => {
    if (schedule.courses.length === 0) {
      warning('Please add courses to the schedule before exporting');
      return;
    }

    // Check if courses have time slots
    const coursesWithTimeSlots = schedule.courses.filter(
      course => course.dayTimeSlots && course.dayTimeSlots.length > 0
    );

    if (coursesWithTimeSlots.length === 0) {
      warning('Please add day and time information to courses before exporting the timetable');
      return;
    }

    try {
      exportScheduleToPDF(schedule);
      success('Schedule exported to PDF successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError('Failed to export PDF. Please try again.');
    }
  };

  // Loading state handled by loading state variable below


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
              label: "Export PDF",
              onClick: handleExportPDF,
              disabled: loading || schedule.courses.length === 0,
              icon: <Download size={16} />,
              variant: "outline" as const
            },
            {
              label: "Save Schedule",
              onClick: handleSaveSchedule,
              disabled: loading || !schedule.name || !schedule.semester || schedule.courses.length === 0,
              icon: <Save size={16} />
            }
          ]}
        />

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
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
                
                {/* Curriculum Selection */}
                <div>
                  <Label htmlFor="curriculum">Select Curriculum</Label>
                  <select
                    id="curriculum"
                    value={schedule.curriculumId}
                    onChange={e => handleCurriculumChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={loadingCurricula}
                  >
                    <option value="">Select Curriculum</option>
                    {curricula.map((curriculum) => (
                      <option key={curriculum.id} value={curriculum.id}>
                        {curriculum.name} ({curriculum.year}) - {curriculum.startId}-{curriculum.endId}
                      </option>
                    ))}
                  </select>
                  {loadingCurricula && (
                    <p className="text-sm text-muted-foreground mt-1">Loading curricula...</p>
                  )}
                  {selectedCurriculum && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedCurriculum.curriculumCourses?.length || 0} courses available
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <select
                      id="department"
                      value={schedule.department}
                      onChange={e => setSchedule(prev => ({ ...prev, department: e.target.value }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">Select Department</option>
                      <option value="CS">Computer Science</option>
                      <option value="IT">Information Technology</option>
                      <option value="Both">Both (CS & IT)</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="batch">Batch/Year</Label>
                    <Input
                      id="batch"
                      type="text"
                      value={schedule.batch}
                      onChange={e => setSchedule(prev => ({ ...prev, batch: e.target.value }))}
                      placeholder="e.g., 651, 652, 653"
                      readOnly={!!selectedCurriculum}
                    />
                  </div>
                </div>
                
                {/* Version History Selector */}
                {scheduleVersions.length > 0 && (
                  <div>
                    <Label htmlFor="loadVersion">Load Previous Version</Label>
                    <select
                      id="loadVersion"
                      value={selectedVersion || ''}
                      onChange={e => {
                        const versionId = e.target.value;
                        if (versionId) {
                          const version = scheduleVersions.find(v => v.id === versionId);
                          if (version) {
                            setSchedule({
                              ...version,
                              version: '', // Clear version to allow new save
                            });
                            setSelectedVersion(versionId);
                            success(`Loaded ${version.version}`);
                          }
                        } else {
                          setSelectedVersion(null);
                        }
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="">-- New Schedule --</option>
                      {scheduleVersions.map(version => (
                        <option key={version.id} value={version.id}>
                          {version.version} - {version.name} ({version.department || 'N/A'}, {version.batch || 'N/A'})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {/* Note about version info */}
                <div className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 p-3 rounded">
                  <strong>Note:</strong> Version will be generated automatically when you save (e.g., v1.0 - 12/25/2025 10:30 AM). 
                  You can edit previous versions by loading them above.
                </div>
                
                {/* Excel Upload Section */}
                <div className="pt-4 border-t">
                  <Label className="mb-2 block">Upload Excel File</Label>
                  <div className="text-xs text-muted-foreground mb-3">
                    Required: Course, Course Name, Section, Day, Time<br />
                    Optional: Instructor Name, Seat Limit
                  </div>
                  
                  {/* Download Template Button */}
                  <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/download/tentative-schedule-template`}
                    download
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <FileSpreadsheet size={16} />
                    Download Excel Template
                  </a>
                  
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

            {/* Course Search and Selection - Only show when curriculum is selected */}
            {selectedCurriculum ? (
              <Card>
                <CardHeader>
                  <CardTitle>Available Courses from {selectedCurriculum.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {filteredCourses.length} courses available from the selected curriculum
                  </p>
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
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Select Curriculum First</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    icon={<BookOpen size={32} />}
                    title="Choose a curriculum to get started"
                    description="Select a curriculum from the form above to load available courses for your tentative schedule"
                  />
                </CardContent>
              </Card>
            )}
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
                            {course.dayTimeSlots && course.dayTimeSlots.length > 0 && (
                              <div className="text-xs text-teal-600 dark:text-teal-400 mt-1 space-y-0.5">
                                {course.dayTimeSlots.map((slot, idx) => (
                                  <div key={idx}>
                                    📅 {slot.day}: {slot.startTime} - {slot.endTime}
                                  </div>
                                ))}
                              </div>
                            )}
                            {/* Fallback for legacy format (days array without specific times) */}
                            {(!course.dayTimeSlots || course.dayTimeSlots.length === 0) && course.days && course.days.length > 0 && (
                              <div className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                                📅 {course.days.join(', ')}
                                {course.time && ` at ${course.time}`}
                              </div>
                            )}
                            {course.instructor && (
                              <div className="text-xs text-muted-foreground">
                                👤 {course.instructor}
                              </div>
                            )}
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
        onSave={(courseData) => handleCourseDetailSave(courseData)}
        onCancel={() => setShowCourseDetailModal(false)}
        instructorsList={instructorsList}
        onAddInstructor={(name) => {
          if (!instructorsList.includes(name)) {
            setInstructorsList(prev => [...prev, name]);
            success(`Instructor "${name}" added to the list`);
          }
        }}
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
                      <th className="text-left p-3 font-medium">Schedule</th>
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
                        <td className="p-3 text-sm">
                          {course.dayTimeSlots && course.dayTimeSlots.length > 0 ? (
                            <div className="space-y-1">
                              {course.dayTimeSlots.map((slot, idx) => (
                                <div key={idx} className="text-xs">
                                  {slot.day}: {slot.startTime}-{slot.endTime}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span>
                              {course.days && course.days.length > 0 ? course.days.join(', ') : '-'}
                              {course.time && ` • ${course.time}`}
                            </span>
                          )}
                        </td>
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
