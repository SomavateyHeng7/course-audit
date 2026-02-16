'use client';

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus, Trash2, Save, BookOpen, Calendar, Users, ArrowLeft, Upload, FileSpreadsheet, X, Download } from 'lucide-react';
import { useToastHelpers } from '@/hooks/useToast';
import CourseDetailForm from '@/components/features/schedule/CourseDetailForm';
import * as XLSX from 'xlsx';
import { getPublicCurricula, createTentativeSchedule, getTentativeSchedule, updateTentativeSchedule } from '@/lib/api/laravel';
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
  originalCourseId?: string; // Store the original course ID before adding unique suffix
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
  status?: 'draft' | 'published';
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
    name: string;
    credits: number;
    description?: string;
    category?: string;
  };
  departmentCourseType?: {
    name: string;
  };
  isRequired: boolean;
}

const TentativeSchedulePage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scheduleId = searchParams.get('id');
  const { success, error: showError, warning } = useToastHelpers();
  const [isEditMode, setIsEditMode] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [schedule, setSchedule] = useState<ScheduleData>({
    name: '',
    semester: '',
    version: '1.0',
    versionTimestamp: new Date().toISOString(),
    department: '',
    batch: '',
    curriculumId: '',
    curriculumName: '',
    courses: [],
    status: 'draft'
  });

  // Curriculum data
  const [curricula, setCurricula] = useState<Curriculum[]>([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState<Curriculum | null>(null);
  const [loadingCurricula, setLoadingCurricula] = useState(false);

  const [scheduleVersions, setScheduleVersions] = useState<ScheduleData[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [instructorsList, setInstructorsList] = useState<string[]>(['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Prof. Brown', 'Prof. Davis']);
  const [showCustomDepartment, setShowCustomDepartment] = useState(false);
  const [customDepartment, setCustomDepartment] = useState('');
  const [customDepartments, setCustomDepartments] = useState<string[]>([]);

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

  // Load existing schedule if in edit mode
  useEffect(() => {
    const loadSchedule = async () => {
      if (!scheduleId) {
        setIsEditMode(false);
        return;
      }

      setIsEditMode(true);
      setLoadingSchedule(true);

      try {
        const response = await getTentativeSchedule(scheduleId);
        const existingSchedule = response.schedule;

        // Transform the schedule data to match the component's format
        const transformedCourses: Course[] = existingSchedule.courses.map((sc: any) => {
          const courseId = sc.courseId || sc.course?.id || sc.id || '';
          return {
            id: courseId,
            originalCourseId: courseId, // Store original ID for later use
            code: sc.code || sc.course?.code || '',
            name: sc.name || sc.course?.name || '',
            credits: sc.credits || sc.course?.credits || 0,
            section: sc.section || '',
            days: sc.days || [],
            time: sc.time || '',
            instructor: sc.instructor || '',
            seatLimit: sc.seatLimit || sc.seat_limit || 0,
          };
        });

        setSchedule({
          id: existingSchedule.id,
          name: existingSchedule.name,
          semester: existingSchedule.semester,
          version: existingSchedule.version.toString(),
          department: existingSchedule.department || '',
          batch: existingSchedule.batch || '',
          curriculumId: existingSchedule.curriculum?.id || '',
          curriculumName: existingSchedule.curriculum?.name || '',
          courses: transformedCourses,
        });

        // If there's a curriculum ID, load the curriculum to populate available courses
        const curriculumId = existingSchedule.curriculum?.id;
        if (curriculumId) {
          const curriculum = curricula.find(c => c.id === curriculumId);
          if (curriculum) {
            setSelectedCurriculum(curriculum);
            
            const curriculumCourses: Course[] = curriculum.curriculumCourses?.map(cc => ({
              id: cc.course.id,
              originalCourseId: cc.course.id, // Store original ID
              code: cc.course.code,
              name: cc.course.name,
              credits: cc.course.credits,
              description: cc.course.description,
              category: cc.course.category || cc.departmentCourseType?.name || (cc.isRequired ? 'Required' : 'Elective')
            })) || [];

            setAvailableCourses(curriculumCourses);
            setFilteredCourses(curriculumCourses);
          }
        }

        // Remove duplicate success toast to reduce notifications during edit
      } catch (err: any) {
        console.error('Failed to load schedule:', err);
        showError(err.message || 'Failed to load schedule');
        router.push('/chairperson/TentativeSchedule');
      } finally {
        setLoadingSchedule(false);
      }
    };

    loadSchedule();
  }, [scheduleId, curricula]);

  // Handle curriculum selection
  const handleCurriculumChange = (curriculumId: string) => {
    const curriculum = curricula.find(c => c.id === curriculumId);
    if (curriculum) {
      setSelectedCurriculum(curriculum);
      
      // Convert curriculum courses to available courses
      const curriculumCourses: Course[] = curriculum.curriculumCourses?.map(cc => ({
        id: cc.course.id,
        originalCourseId: cc.course.id, // Store original ID
        code: cc.course.code,
        name: cc.course.name,
        credits: cc.course.credits,
        description: cc.course.description,
        category: cc.course.category || cc.departmentCourseType?.name || (cc.isRequired ? 'Required' : 'Elective')
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
  }, []);

  const handleAddCourse = (course: Course) => {
    // Allow adding the same course multiple times for different sections
    setSelectedCourseForDetail(course);
    setShowCourseDetailModal(true);
  };

  const handleCourseDetailSave = (courseData?: any) => {
    if (!selectedCourseForDetail) return;
    
    // Generate a unique ID for each course-section combination to allow duplicates
    const uniqueId = `${selectedCourseForDetail.id}___${courseData?.section || 'default'}___${Date.now()}`;
    
    // Merge the selected course with the form data from CourseDetailForm
    const courseWithDetails: Course = {
      ...selectedCourseForDetail,
      id: uniqueId, // Use unique ID for this specific section
      originalCourseId: selectedCourseForDetail.id, // Store the original course ID
      section: courseData?.section,
      dayTimeSlots: courseData?.dayTimeSlots || [],
      instructor: courseData?.instructor,
      seatLimit: courseData?.seat ? parseInt(courseData.seat) : undefined
    };
    
    setSchedule(prev => ({
      ...prev,
      courses: [...prev.courses, courseWithDetails]
    }));
    success(`${selectedCourseForDetail.code} Section ${courseData?.section || 'N/A'} added with ${courseData?.dayTimeSlots?.length || 0} time slot(s)`);
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

      // Extract unique course codes from Excel
      const courseCodes = [...new Set(
        jsonData
          .map(row => (row['Course'] || row['course'])?.toString().toUpperCase())
          .filter(code => code)
      )];

      // Day name mapping from abbreviations to full names
      const dayMapping: { [key: string]: string } = {
        'MON': 'Monday',
        'MONDAY': 'Monday',
        'TUE': 'Tuesday',
        'TUESDAY': 'Tuesday',
        'WED': 'Wednesday',
        'WEDNESDAY': 'Wednesday',
        'THU': 'Thursday',
        'THURSDAY': 'Thursday',
        'FRI': 'Friday',
        'FRIDAY': 'Friday',
        'SAT': 'Saturday',
        'SATURDAY': 'Saturday',
        'SUN': 'Sunday',
        'SUNDAY': 'Sunday'
      };

      // Fetch course details from database by codes
      const courseMap = new Map<string, { id: string; name: string; credits: number }>();
      
      try {
        // Fetch all curricula which contain courses we can use
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/public-curricula`);
        if (response.ok) {
          const data = await response.json();
          const curricula = data.curricula || [];
          
          console.log('Fetched curricula:', curricula.length);
          
          // Build map of course code to course details from all curricula
          curricula.forEach((curriculum: any) => {
            curriculum.curriculumCourses?.forEach((cc: any) => {
              if (cc.course) {
                const courseCode = cc.course.code.toUpperCase();
                // Only add if not already in map (first curriculum takes precedence)
                if (!courseMap.has(courseCode)) {
                  courseMap.set(courseCode, {
                    id: cc.course.id,
                    name: cc.course.name,
                    credits: cc.course.credits || 3
                  });
                }
              }
            });
          });
          
          console.log('Course map built:', courseMap.size, 'courses');
        } else {
          console.error('Failed to fetch curricula:', response.status);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
        showError('Could not fetch course details from database. Please check your connection.');
        setLoading(false);
        return;
      }

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
          ? dayInput.toString().split(/[,;]/).map((d: string) => {
              const dayName = d.trim().toUpperCase();
              return dayMapping[dayName] || d.trim();
            }).filter((d: string) => d.length > 0)
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

        // Try to match course code to actual course ID
        const courseCode = course ? course.toString().toUpperCase() : '';
        const matchedCourse = courseMap.get(courseCode);
        
        if (!matchedCourse) {
          console.warn(`Course code "${courseCode}" not found in database`);
          warning(`Row ${index + 1}: Course code "${courseCode}" not found in database`);
        } else {
          console.log(`Matched ${courseCode} to ID:`, matchedCourse.id);
        }

        return {
          id: matchedCourse?.id || '', // Use matched ID or empty string (will fail validation)
          code: course ? course.toString() : '',
          name: matchedCourse?.name || (courseName ? courseName.toString() : ''), // Use DB name or Excel name
          credits: matchedCourse?.credits || 3, // Use DB credits or default
          section: section ? section.toString() : '', // Convert to string to handle both numbers and letters
          dayTimeSlots: dayTimeSlots,
          days: days.length > 0 ? days : undefined, // Keep for backwards compatibility
          time: time ? time.toString() : '', // Keep for backwards compatibility
          instructor: instructor ? instructor.toString() : '',
          seatLimit: seatLimit ? parseInt(seatLimit.toString()) : undefined,
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
    
    try {
      // Prepare course data for API
      const coursesForApi = schedule.courses.map(course => {
        // Extract the original course ID (before the unique suffix we added)
        // Use stored originalCourseId if available, otherwise try to parse from id
        const originalCourseId = course.originalCourseId || 
          (course.id.includes('___') ? course.id.split('___')[0] : course.id);
        
        console.log('Course ID mapping:', {
          displayId: course.id,
          originalCourseId: course.originalCourseId,
          extractedId: originalCourseId,
          courseName: course.name
        });
        
        // Handle dayTimeSlots: convert to days array and time string for backend
        let days: string[] | undefined = undefined;
        let time: string | undefined = undefined;
        
        if (course.dayTimeSlots && course.dayTimeSlots.length > 0) {
          // Extract days from dayTimeSlots
          days = course.dayTimeSlots.map(slot => slot.day);
          
          // Format time from first slot (assuming all slots have same time range)
          const firstSlot = course.dayTimeSlots[0];
          if (firstSlot.startTime && firstSlot.endTime) {
            time = `${firstSlot.startTime} - ${firstSlot.endTime}`;
          }
        } else if (course.days && Array.isArray(course.days) && course.days.length > 0) {
          // Fallback to legacy days array
          days = course.days.filter(day => day && typeof day === 'string' && day.trim().length > 0);
          time = course.time || undefined;
        }

        return {
          courseId: originalCourseId,
          section: course.section || '',
          days: days,
          time: time,
          instructor: course.instructor || '',
          seatLimit: course.seatLimit || undefined,
        };
      });

      let response;
      
      if (isEditMode && schedule.id) {
        // Update existing schedule
        response = await updateTentativeSchedule(schedule.id, {
          name: schedule.name,
          semester: schedule.semester,
          version: schedule.version || 'v1.0',
          department: schedule.department,
          batch: schedule.batch,
          curriculumId: schedule.curriculumId,
          status: schedule.status || 'draft',
          courses: coursesForApi,
        });
        
        if (schedule.status === 'published') {
          success(`Schedule "${schedule.name}" updated and published! This is now the active schedule for ${schedule.department || 'the department'}.`);
        } else {
          success(`Schedule "${schedule.name}" updated as draft.`);
        }
      } else {
        // Create new schedule with automatic version
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
        
        response = await createTentativeSchedule({
          name: schedule.name,
          semester: schedule.semester,
          version: versionName,
          department: schedule.department,
          batch: schedule.batch,
          curriculumId: schedule.curriculumId,
          status: schedule.status || 'draft',
          courses: coursesForApi,
        });
        
        if (schedule.status === 'published') {
          success(`Schedule "${schedule.name}" created and published! This is now the active schedule for ${schedule.department || 'the department'}.`);
        } else {
          success(`Schedule "${schedule.name}" saved as draft.`);
        }
        
        // Save to localStorage for backup (new schedules only)
        const newVersion: ScheduleData = {
          ...schedule,
          id: response.schedule.id,
          version: versionName,
          versionTimestamp: timestamp.toISOString(),
          createdAt: timestamp.toISOString(),
          updatedAt: timestamp.toISOString()
        };
        
        const updatedVersions = [...scheduleVersions, newVersion];
        setScheduleVersions(updatedVersions);
        setSelectedVersion(newVersion.id || null);
        
        try {
          localStorage.setItem('tentativeScheduleVersions', JSON.stringify(updatedVersions));
        } catch (error) {
          console.error('Error saving to localStorage:', error);
        }
      }
      
      // Navigate back to the list page after a brief delay
      setTimeout(() => {
        router.push('/chairperson/TentativeSchedule');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      let errorMessage = 'Failed to save schedule. Please try again.';
      
      // Extract error message from different error formats
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error?.error?.message) {
        errorMessage = error.error.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
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

  if (loadingSchedule) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner text="Loading schedule..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title={isEditMode ? "Edit Tentative Schedule" : "Create Tentative Schedule"}
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
              label: isEditMode ? "Update Schedule" : "Save Schedule",
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
                <p className="text-sm text-muted-foreground mt-2">
                  <span className="text-red-500">*</span> Required fields
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">
                    Schedule Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={schedule.name}
                    onChange={e => setSchedule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter schedule name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="semester">
                    Semester <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="semester"
                    type="text"
                    value={schedule.semester}
                    onChange={e => setSchedule(prev => ({ ...prev, semester: e.target.value }))}
                    placeholder="e.g., Fall 2024"
                    required
                  />
                </div>
                
                {/* Curriculum Selection */}
                <div>
                  <Label htmlFor="curriculum">
                    Select Curriculum <span className="text-sm text-muted-foreground">(Optional)</span>
                  </Label>
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
                    <Label htmlFor="department">
                      Department <span className="text-sm text-muted-foreground">(Optional)</span>
                    </Label>
                    {!showCustomDepartment ? (
                      <select
                        id="department"
                        value={schedule.department}
                        onChange={e => {
                          if (e.target.value === '__custom__') {
                            setShowCustomDepartment(true);
                            setSchedule(prev => ({ ...prev, department: '' }));
                          } else {
                            setSchedule(prev => ({ ...prev, department: e.target.value }));
                          }
                        }}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <option value="">Select Department</option>
                        <option value="CS">Computer Science</option>
                        <option value="IT">Information Technology</option>
                        <option value="Both">Both (CS & IT)</option>
                        {customDepartments.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                        <option value="__custom__">+ Add Custom Department</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <Input
                          type="text"
                          value={customDepartment}
                          onChange={e => setCustomDepartment(e.target.value)}
                          placeholder="Enter department name"
                          className="flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customDepartment.trim()) {
                              setSchedule(prev => ({ ...prev, department: customDepartment.trim() }));
                              setCustomDepartments(prev => [...prev, customDepartment.trim()]);
                              setCustomDepartment('');
                              setShowCustomDepartment(false);
                              success(`Department "${customDepartment.trim()}" added successfully`);
                            }
                          }}
                          className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustomDepartment(false);
                            setCustomDepartment('');
                          }}
                          className="px-3 py-2 border rounded-md hover:bg-muted transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="batch">
                      Batch/Year <span className="text-sm text-muted-foreground">(Optional)</span>
                    </Label>
                    <Input
                      id="batch"
                      type="text"
                      value={schedule.batch}
                      onChange={e => setSchedule(prev => ({ ...prev, batch: e.target.value }))}
                      placeholder="e.g., 651, 652, 653"
                    />
                  </div>
                </div>
                
                {/* Status Selection */}
                <div>
                  <Label htmlFor="status">
                    Schedule Status <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="status"
                    value={schedule.status || 'draft'}
                    onChange={e => setSchedule(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="draft">Draft (Not visible to students)</option>
                    <option value="published">Published (Active - visible to students)</option>
                  </select>
                  {schedule.status === 'published' && schedule.department && (
                    <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ Publishing will make this the active schedule for <strong>{schedule.department}</strong> department. Only one schedule can be active per department.
                    </div>
                  )}
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
                              icon={<Plus size={14} />}
                              tooltip="Add to schedule (you can add multiple sections)"
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
                            <div className="font-medium text-foreground truncate flex items-center gap-2">
                              {course.code}
                              {course.section && (
                                <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                  Sec {course.section}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {course.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {course.credits} credits
                              {course.category && ` • ${course.category}`}
                              {course.seatLimit && ` • ${course.seatLimit} seats`}
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

export default function TentativeSchedulePageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <TentativeSchedulePage />
    </Suspense>
  );
}
