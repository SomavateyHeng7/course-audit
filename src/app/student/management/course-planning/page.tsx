'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToastHelpers } from '@/hooks/useToast';
import { API_BASE, getPublicDepartments, getPublishedSchedules, getPublishedSchedule } from '@/lib/api/laravel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CourseSearch } from '@/components/features/management/CourseSearch';
import { CourseCard } from '@/components/features/management/CourseCard';
import { CourseWithSections } from '@/components/features/management/CourseWithSections';
import { PlannedCourseCard } from '@/components/features/management/PlannedCourseCard';
import { WeeklyScheduleCalendar } from '@/components/features/management/WeeklyScheduleCalendar';
import { CourseScheduleCalendar } from '@/components/features/management/CourseScheduleCalendar';
import { ConcentrationAnalysis, type ConcentrationProgress as ConcentrationProgressProps } from '@/components/features/management/ConcentrationAnalysis';
import { NotificationSubscribeDialog } from '@/components/features/notifications/NotificationSubscribeDialog';
import { 
  Search,
  Plus,
  Calendar, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle,
  ArrowLeft,
  Trash2,
  Save,
  X,
  FileText,
  List,
  Clock,
  Target,
  LayoutGrid
} from 'lucide-react';

// Simplified interfaces for course planning
interface CourseSection {
  id: string;
  section: string;
  instructor?: string;
  days?: string[];
  timeStart?: string;
  timeEnd?: string;
  room?: string;
  capacity?: number;
  enrolled?: number;
}

interface PlannedCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  category?: string;
  semester?: string;
  semesterLabel?: string;
  prerequisites?: string[];
  corequisites?: string[];
  sections?: CourseSection[];
  selectedSection?: CourseSection;
  validationStatus?: 'valid' | 'warning' | 'error';
  validationMessage?: string;
  validationNotes?: string[];
  status: string;
}

interface AvailableCourse {
  id?: string;
  code: string;
  title: string;
  credits: string | number;
  description?: string;
  prerequisites?: string[];
  corequisites?: string[];
  category: string;
  sections?: CourseSection[];
  selectedSection?: CourseSection;
  requiresPermission?: boolean;
  bannedWith?: string[];
  level?: number;
  summerOnly?: boolean;
  requiresSeniorStanding?: boolean;
  minCreditThreshold?: number;
}

interface DataEntryContext {
  selectedCurriculum: string;
  selectedDepartment: string;
  actualDepartmentId?: string;
  selectedConcentration?: string;
  completedCourses: Record<string, any>;
  freeElectives?: any[];
}

interface Concentration {
  id: string;
  name: string;
  curriculumId?: string;
  description?: string;
  requiredCredits: number;
  totalCourses?: number;
  courses?: Array<{
    code: string;
    name: string;
    credits: number;
    description: string;
  }>;
}

interface ConcentrationProgress {
  concentration: Concentration;
  completed?: number;
  required?: number;
  remaining?: number;
  percentage?: number;
  completedCourses: string[];
  plannedCourses: string[];
  progress: number;
  isEligible: boolean;
  remainingCourses: number;
}

interface TentativeSchedule {
  id: string;
  name: string;
  semester: string;
  coursesCount: number;
  courses?: any[];
}

interface ScheduleCombination {
  id: string;
  courses: any[];
  hasConflicts: boolean;
  conflicts: string[];
}

const getSuggestedSemesterLabel = (value?: string) => {
  const currentYear = new Date().getFullYear();
  if (value === '2') return `2/${currentYear}`;
  if (value === 'summer' || value === '3') return `3/${currentYear}`;
  return `1/${currentYear}`;
};

const getSemesterValueFromLabel = (label?: string) => {
  if (!label) return '1';
  const prefix = label.split('/')[0]?.trim();
  if (prefix === '3') return 'summer';
  if (prefix === '2') return '2';
  return '1';
};

const ensureSemesterLabel = (label: string | undefined, fallbackValue?: string) => {
  if (label && label.includes('/')) {
    return label;
  }
  return getSuggestedSemesterLabel(fallbackValue);
};

export default function CoursePlanningPage() {
  const router = useRouter();
  const { success, error: showError, warning, info } = useToastHelpers();
  
  // Check for data entry context
  const [dataEntryContext, setDataEntryContext] = useState<DataEntryContext | null>(null);
  const [hasValidContext, setHasValidContext] = useState(false);
  
  // State management
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [inProgressCourses, setInProgressCourses] = useState<Set<string>>(new Set());
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [concentrationAnalysis, setConcentrationAnalysis] = useState<ConcentrationProgress[]>([]);
  const [showConcentrationModal, setShowConcentrationModal] = useState(false);
  const [showNotificationDialog, setShowNotificationDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedSemesterLabel, setSelectedSemesterLabel] = useState(getSuggestedSemesterLabel('1'));
  const [loading, setLoading] = useState(true);
  const [blacklistedCourses, setBlacklistedCourses] = useState<Set<string>>(new Set());
  
  // Tentative schedule state
  const [tentativeSchedules, setTentativeSchedules] = useState<TentativeSchedule[]>([]);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedScheduleDepartmentId, setSelectedScheduleDepartmentId] = useState<string>('my-department');
  
  // Schedule combination state
  const [scheduleCombinations, setScheduleCombinations] = useState<ScheduleCombination[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<string | null>(null);
  const [showScheduleViewer, setShowScheduleViewer] = useState(false);
  const [generatingSchedules, setGeneratingSchedules] = useState(false);
  
  // View mode state - default to calendar for better schedule visualization
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [selectedTentativeSchedule, setSelectedTentativeSchedule] = useState<string>('');
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showSectionsInList, setShowSectionsInList] = useState(false); // Don't show sections until tentative schedule is loaded
  
  const handleSemesterSelect = (value: string) => {
    setSelectedSemester(value);
    setSelectedSemesterLabel(getSuggestedSemesterLabel(value));
  };
  
  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    warnings?: string[];
    onConfirm: () => void;
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  // Helper function to parse credit hours from formats like "2-0-4" -> 2
  const parseCredits = (creditsStr: string | number): number => {
    if (typeof creditsStr === 'number') {
      return creditsStr;
    }
    if (typeof creditsStr === 'string') {
      // Extract first number from formats like "2-0-4" or "3"
      const firstNumber = creditsStr.split('-')[0];
      const parsed = parseInt(firstNumber, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Semester options
  const semesterOptions = [
    { value: '1', label: 'Semester 1' },
    { value: '2', label: 'Semester 2' },
    { value: 'summer', label: 'Summer Session' },
  ];

  // Dynamic category options from available courses
  const categoryOptions = React.useMemo(() => {
    const categories = new Set<string>();
    availableCourses.forEach(course => {
      if (course.category) {
        categories.add(course.category);
      }
    });
    
    const options = [{ value: 'all', label: 'All Categories' }];
    Array.from(categories)
      .sort()
      .forEach(cat => {
        options.push({ value: cat, label: cat });
      });
    
    return options;
  }, [availableCourses]);

  // Check for data entry context on mount
  useEffect(() => {
    const checkDataEntryContext = () => {
      try {
        // Check for data from data entry page using new unified structure
        const savedAuditData = localStorage.getItem('studentAuditData');
        
        if (!savedAuditData) {
          console.log('No student audit data found');
          setHasValidContext(false);
          setLoading(false);
          return;
        }

        const auditData = JSON.parse(savedAuditData);
        console.log('Course Planning - Loaded audit data:', auditData);

        if (!auditData.selectedCurriculum || !auditData.selectedDepartment) {
          console.log('Missing required curriculum or department data');
          setHasValidContext(false);
          setLoading(false);
          return;
        }

        // Parse and set context
        const context: DataEntryContext = {
          selectedCurriculum: auditData.selectedCurriculum,
          selectedDepartment: auditData.selectedDepartment,
          actualDepartmentId: auditData.actualDepartmentId,
          selectedConcentration: auditData.selectedConcentration || '',
          completedCourses: auditData.completedCourses || {},
          freeElectives: auditData.freeElectives || []
        };

        setDataEntryContext(context);
        setHasValidContext(true);
        
        // Auto-select the department for tentative schedule if actualDepartmentId is available
        if (auditData.actualDepartmentId) {
          console.log('Auto-selecting department for tentative schedule:', auditData.actualDepartmentId);
          setSelectedScheduleDepartmentId(auditData.actualDepartmentId);
        }

        // Auto-sync completed courses
        const completedCourseCodes = Object.keys(context.completedCourses).filter(
          code => context.completedCourses[code]?.status === 'completed'
        );
        setCompletedCourses(new Set(completedCourseCodes));

        const inProgressCourseCodes = Object.keys(context.completedCourses).filter(
          code => context.completedCourses[code]?.status === 'in_progress'
        );
        setInProgressCourses(new Set(inProgressCourseCodes));

        // Auto-sync planning courses to course plan
        const planningCourses = Object.keys(context.completedCourses).filter(
          code => context.completedCourses[code]?.status === 'planning'
        );
        
        if (planningCourses.length > 0) {
          console.log('Found planning courses from data entry:', planningCourses);
          // Convert planning courses to PlannedCourse format
          const plannedCoursesFromDataEntry: PlannedCourse[] = planningCourses.map((code, index) => {
            const courseData = context.completedCourses[code];
            // Extract title and credits from courseData if available, otherwise use defaults
            const title = (courseData as any)?.title || (courseData as any)?.name || code;
            const credits = (courseData as any)?.credits || 3;
            const derivedSemesterValue = getSemesterValueFromLabel((courseData as any)?.plannedSemester);
            const derivedSemesterLabel = ensureSemesterLabel((courseData as any)?.plannedSemester, derivedSemesterValue);
            
            return {
              id: `planned-${code}-${Date.now()}-${index}`,
              code: code,
              title: title,
              credits: credits,
              semester: derivedSemesterValue,
              semesterLabel: derivedSemesterLabel,
              status: 'planning' as const,
              validationStatus: 'valid' as const,
            };
          });
          
          // Set these as the initial planned courses (will be merged with saved plan later)
          setPlannedCourses(plannedCoursesFromDataEntry);
          console.log('Auto-added planning courses to course plan:', plannedCoursesFromDataEntry);
        }

        console.log('Loaded data entry context:', context);
        console.log('Completed courses:', completedCourseCodes);
        console.log('Planning courses:', planningCourses);

      } catch (error) {
        console.error('Error loading data entry context:', error);
        setHasValidContext(false);
      } finally {
        setLoading(false);
      }
    };

    checkDataEntryContext();
  }, []);

  // Fetch available courses when context is ready
  useEffect(() => {
    if (hasValidContext && dataEntryContext) {
      // Load departments if not already loaded
      if (departments.length === 0) {
        loadDepartmentsForSchedule();
      }
      fetchAvailableCourses();
      fetchConcentrations();
      fetchBlacklistedCourses();
      fetchTentativeSchedules();
      loadSavedCoursePlan();
    }
  }, [hasValidContext, dataEntryContext]);
  
  // Refetch schedules when selected department changes
  useEffect(() => {
    if (hasValidContext && dataEntryContext && selectedScheduleDepartmentId) {
      fetchTentativeSchedules();
    }
  }, [selectedScheduleDepartmentId]);

  // Remove currently taking courses from any persisted plan state
  useEffect(() => {
    if (inProgressCourses.size === 0) return;

    setPlannedCourses(prev => {
      const filtered = prev.filter(course => !inProgressCourses.has(course.code));
      return filtered.length === prev.length ? prev : filtered;
    });
  }, [inProgressCourses]);
  
  const loadDepartmentsForSchedule = async () => {
    try {
      const response = await getPublicDepartments();
      setDepartments(response.departments);
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  };

  const fetchAvailableCourses = async () => {
    if (!dataEntryContext) return;
    
    try {
      setLoading(true);
      // Use actualDepartmentId if available, fall back to selectedDepartment
      const departmentId = dataEntryContext.actualDepartmentId || dataEntryContext.selectedDepartment;
      const response = await fetch(`${API_BASE}/available-courses?curriculum_id=${dataEntryContext.selectedCurriculum}&department_id=${departmentId}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch available courses');
      }
      const data = await response.json();
      // Trim course codes to remove any spaces
      const coursesWithTrimmedCodes = (data.courses || []).map((course: AvailableCourse) => ({
        ...course,
        code: (course.code || '').trim()
      }));
      setAvailableCourses(coursesWithTrimmedCodes);
    } catch (error) {
      console.error('Error fetching available courses:', error);
      // Fall back to mock data if API fails
      const mockCourses: AvailableCourse[] = [
        {
          code: 'CSX4001',
          title: 'Advanced Algorithms',
          credits: 3,
          description: 'Advanced data structures and algorithmic techniques',
          prerequisites: ['CSX3003', 'CSX3009'],
          corequisites: [],
          bannedWith: ['CSX4010'], // Example banned combination
          category: 'Major',
          level: 4,
          requiresPermission: false,
          summerOnly: false,
          requiresSeniorStanding: true,
          minCreditThreshold: 90
        },
        {
          code: 'CSX4002',
          title: 'Machine Learning',
          credits: 3,
          description: 'Introduction to machine learning concepts and applications',
          prerequisites: ['CSX2003', 'CSX3003'],
          corequisites: ['CSX4003'], // Example corequisite
          bannedWith: [],
          category: 'Major Elective',
          level: 4,
          requiresPermission: true,
          summerOnly: false,
          requiresSeniorStanding: false,
          minCreditThreshold: undefined
        },
        {
          code: 'CSX4003',
          title: 'Advanced Statistics',
          credits: 3,
          description: 'Statistical methods for data analysis',
          prerequisites: ['CSX2003'],
          corequisites: [],
          bannedWith: [],
          category: 'Major Elective',
          level: 4,
          requiresPermission: false,
          summerOnly: true,
          requiresSeniorStanding: false,
          minCreditThreshold: undefined
        },
        {
          code: 'CSX4010',
          title: 'Alternative Algorithms',
          credits: 3,
          description: 'Alternative approach to algorithmic design',
          prerequisites: ['CSX3003'],
          corequisites: [],
          bannedWith: ['CSX4001'], // Banned with Advanced Algorithms
          category: 'Major Elective',
          level: 4,
          requiresPermission: false,
          summerOnly: false,
          requiresSeniorStanding: false,
          minCreditThreshold: undefined
        },
        {
          code: 'ITX4001',
          title: 'Cybersecurity',
          credits: 3,
          description: 'Information security and cybersecurity principles',
          prerequisites: ['ITX3002'],
          corequisites: [],
          bannedWith: [],
          category: 'Major Elective',
          level: 4,
          requiresPermission: false,
          summerOnly: false,
          requiresSeniorStanding: false,
          minCreditThreshold: undefined
        }
      ];
      setAvailableCourses(mockCourses);
    } finally {
      setLoading(false);
    }
  };

  const fetchConcentrations = async () => {
    if (!dataEntryContext) return;
    
    // Try to get the actual department ID from localStorage
    const storedData = localStorage.getItem('studentAuditData');
    let actualDepartmentId = dataEntryContext.selectedDepartment;
    
    console.log('🔍 DEBUG: Course Planning - localStorage raw data:', storedData);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('🔍 DEBUG: Course Planning - parsed localStorage data:', parsedData);
        actualDepartmentId = parsedData.actualDepartmentId || dataEntryContext.selectedDepartment;
        console.log('🔍 DEBUG: Course Planning - actualDepartmentId from localStorage:', parsedData.actualDepartmentId);
      } catch (error) {
        console.error('Error parsing localStorage data:', error);
      }
    }
    
    console.log('🔍 DEBUG: Course Planning - fetchConcentrations called with:', {
      selectedCurriculum: dataEntryContext.selectedCurriculum,
      selectedDepartment: dataEntryContext.selectedDepartment,
      actualDepartmentId: actualDepartmentId,
      hasValidIds: !!(dataEntryContext.selectedCurriculum && actualDepartmentId)
    });
    
    try {
      const response = await fetch(`${API_BASE}/public-concentrations?curriculum_id=${dataEntryContext.selectedCurriculum}&department_id=${actualDepartmentId}`, {
        credentials: 'include'
      });
      console.log('🔍 DEBUG: Course Planning - API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 DEBUG: Course Planning - API error:', errorText);
        throw new Error('Failed to fetch concentrations');
      }
      const data = await response.json();
      console.log('🔍 DEBUG: Course Planning - API data:', data);
      setConcentrations(data.concentrations || []);
    } catch (error) {
      console.error('Error fetching concentrations:', error);
      // Fall back to mock data if API fails
      const mockConcentrations: Concentration[] = [
        {
          id: 'cs-ai',
          name: 'Artificial Intelligence',
          description: 'Focus on AI, machine learning, and intelligent systems',
          requiredCredits: 15,
          totalCourses: 8,
          courses: [
            { code: 'CSX4002', name: 'Machine Learning', credits: 3, description: 'Introduction to machine learning' },
            { code: 'CSX4003', name: 'Advanced Statistics', credits: 3, description: 'Statistical methods for AI' },
            { code: 'CSX4011', name: 'Neural Networks', credits: 3, description: 'Deep learning and neural networks' },
            { code: 'CSX4012', name: 'Computer Vision', credits: 3, description: 'Image processing and computer vision' },
            { code: 'CSX4013', name: 'Natural Language Processing', credits: 3, description: 'NLP and text analytics' },
            { code: 'CSX4014', name: 'Robotics', credits: 3, description: 'Autonomous systems and robotics' },
            { code: 'CSX4015', name: 'Data Mining', credits: 3, description: 'Knowledge discovery in databases' },
            { code: 'CSX4016', name: 'AI Ethics', credits: 3, description: 'Ethical considerations in AI' }
          ]
        },
        {
          id: 'cs-security',
          name: 'Cybersecurity',
          description: 'Focus on information security and cybersecurity',
          requiredCredits: 12,
          totalCourses: 6,
          courses: [
            { code: 'ITX4001', name: 'Cybersecurity', credits: 3, description: 'Information security fundamentals' },
            { code: 'CSX4021', name: 'Network Security', credits: 3, description: 'Securing network infrastructure' },
            { code: 'CSX4022', name: 'Cryptography', credits: 3, description: 'Encryption and cryptographic protocols' },
            { code: 'CSX4023', name: 'Ethical Hacking', credits: 3, description: 'Penetration testing and vulnerability assessment' },
            { code: 'CSX4024', name: 'Digital Forensics', credits: 3, description: 'Computer forensics and incident response' },
            { code: 'CSX4025', name: 'Security Management', credits: 3, description: 'Security policies and governance' }
          ]
        }
      ];
      setConcentrations(mockConcentrations);
    }
  };

  // Fetch blacklisted courses for the curriculum
  const fetchBlacklistedCourses = async () => {
    if (!dataEntryContext) return;
    
    try {
      const response = await fetch(`${API_BASE}/public-curricula/${dataEntryContext.selectedCurriculum}/blacklists`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        // Silently handle error - no blacklists is okay
        console.log('No blacklists found for curriculum (this is okay)');
        setBlacklistedCourses(new Set());
        return;
      }
      
      const data = await response.json();
      
      // Extract all blacklisted course codes from blacklists
      const blacklistedCodesSet = new Set<string>();
      (data.blacklists || []).forEach((blacklist: any) => {
        (blacklist.courses || []).forEach((courseWrapper: any) => {
          if (courseWrapper.course?.code) {
            blacklistedCodesSet.add(courseWrapper.course.code.trim());
          }
        });
      });
      
      console.log('Blacklisted courses for curriculum:', Array.from(blacklistedCodesSet));
      setBlacklistedCourses(blacklistedCodesSet);
    } catch (error) {
      console.log('Error fetching blacklisted courses (continuing with empty set):', error);
      // Set empty set on error - this is not critical
      setBlacklistedCourses(new Set());
    }
  };

  // Load saved course plan from localStorage
  const loadSavedCoursePlan = () => {
    if (!dataEntryContext) return;
    
    try {
      const savedCoursePlan = localStorage.getItem('coursePlan');
      let savedCourses: PlannedCourse[] = [];
      
      if (savedCoursePlan) {
        const planData = JSON.parse(savedCoursePlan);
        if (planData.curriculumId === dataEntryContext.selectedCurriculum && 
            planData.departmentId === dataEntryContext.selectedDepartment) {
          // Migrate old status values to 'planning'
          savedCourses = (planData.plannedCourses || []).map((course: any) => {
            const legacyLabel = course.semesterLabel || (course.semester && course.year ? `${course.semester}/${course.year}` : undefined);
            const normalizedSemesterLabel = ensureSemesterLabel(legacyLabel, course.semester);
            const normalizedSemesterValue = course.semester || getSemesterValueFromLabel(normalizedSemesterLabel);
            return {
              ...course,
              status: 'planning', // Convert all statuses to 'planning'
              semester: normalizedSemesterValue,
              semesterLabel: normalizedSemesterLabel
            };
          });
          console.log('Loaded saved course plan:', savedCourses);
        }
      }
      
      // Merge with any auto-added planning courses from data entry
      setPlannedCourses(prevPlanned => {
        const existingCodes = new Set([...savedCourses.map(c => c.code), ...prevPlanned.map(c => c.code)]);
        const mergedCourses = [...savedCourses];
        
        // Add any planning courses from data entry that aren't already in the saved plan
        prevPlanned.forEach(course => {
          if (!savedCourses.some(saved => saved.code === course.code)) {
            mergedCourses.push(course);
          }
        });
        
        console.log('Final merged course plan:', mergedCourses);
        return mergedCourses;
      });
    } catch (error) {
      console.error('Error loading saved course plan:', error);
    }
  };

  // Fetch tentative schedules
  const fetchTentativeSchedules = async () => {
    if (!dataEntryContext) return;
    
    try {
      setLoadingSchedules(true);
      
      // Determine which department to fetch schedules for
      const studentDepartmentId = dataEntryContext.actualDepartmentId || dataEntryContext.selectedDepartment;
      const departmentId = selectedScheduleDepartmentId === 'my-department' 
        ? studentDepartmentId 
        : (selectedScheduleDepartmentId === 'all' ? undefined : selectedScheduleDepartmentId);
      
      // Fetch schedules filtered by department
      const response = await getPublishedSchedules({ 
        limit: 100,
        departmentId: departmentId 
      });
      
      // Optionally filter by curriculum as well
      const filteredSchedules = response.schedules.filter(schedule => {
        // If schedule has no curriculum, show it (available to all students in this department)
        if (!schedule.curriculum) {
          return true;
        }
        // If student has a curriculum selected, only show matching schedules
        if (dataEntryContext.selectedCurriculum) {
          return schedule.curriculum.id === dataEntryContext.selectedCurriculum;
        }
        // If no curriculum filter, show all schedules from this department
        return true;
      });
      
      setTentativeSchedules(filteredSchedules);
      console.log('Loaded published tentative schedules:', filteredSchedules);
    } catch (error) {
      console.error('Error fetching tentative schedules:', error);
      showError('Failed to load tentative schedules');
    } finally {
      setLoadingSchedules(false);
    }
  };

  // Load courses from tentative schedule
  const loadCoursesFromSchedule = async (scheduleId: string) => {
    if (!scheduleId || !dataEntryContext) return;
    
    try {
      info('Loading courses from tentative schedule...');
      const response = await getPublishedSchedule(scheduleId);
      const schedule = response.schedule;
      
      // Group schedule courses by course code to collect all sections
      const coursesByCode = new Map<string, Array<typeof schedule.courses[0]>>();
      
      for (const schedCourse of schedule.courses) {
        const courseCode = schedCourse.course.code;
        if (!coursesByCode.has(courseCode)) {
          coursesByCode.set(courseCode, []);
        }
        coursesByCode.get(courseCode)!.push(schedCourse);
      }
      
      // Convert tentative schedule courses to planned courses
      const newPlannedCourses: PlannedCourse[] = [];
      const coursesToAdd: string[] = [];
      const alreadyPlanned: string[] = [];
      const alreadyCompleted: string[] = [];
      const notAvailable: string[] = [];
      
      for (const [courseCode, sections] of coursesByCode.entries()) {
        // Skip if already completed
        if (completedCourses.has(courseCode)) {
          alreadyCompleted.push(courseCode);
          continue;
        }
        
        // Skip if already in progress
        if (inProgressCourses.has(courseCode)) {
          continue;
        }
        
        // Skip if already planned
        if (plannedCourses.some(p => p.code === courseCode)) {
          alreadyPlanned.push(courseCode);
          continue;
        }
        
        // Find the course in available courses
        const availableCourse = availableCourses.find(c => c.code === courseCode);
        
        if (!availableCourse) {
          notAvailable.push(courseCode);
          continue;
        }
        
        // Validate banned combinations
        const bannedValidation = validateBannedCombinations(availableCourse);
        if (!bannedValidation.valid) {
          continue;
        }
        
        // Create course sections array from all sections
        const courseSections: CourseSection[] = sections.map(schedCourse => ({
          id: schedCourse.id,
          section: schedCourse.section || 'A',
          instructor: schedCourse.instructor,
          days: schedCourse.days,
          timeStart: schedCourse.timeStart,
          timeEnd: schedCourse.timeEnd,
          room: schedCourse.room,
          capacity: schedCourse.capacity,
          enrolled: schedCourse.enrolled,
        }));
        
        // Use first section as default selected section
        const firstSection = courseSections[0];
        const firstSchedCourse = sections[0];
        
        const plannedCourse: PlannedCourse = {
          id: `${courseCode}-${schedule.semester}-${Date.now()}`,
          code: courseCode,
          title: firstSchedCourse.course.title,
          credits: firstSchedCourse.course.credits,
          semester: getSemesterValueFromLabel(schedule.semester),
          semesterLabel: schedule.semester,
          status: 'planning',
          validationStatus: 'valid',
          prerequisites: availableCourse.prerequisites,
          corequisites: availableCourse.corequisites,
          sections: courseSections,
          selectedSection: firstSection,
        };
        
        newPlannedCourses.push(plannedCourse);
        coursesToAdd.push(courseCode);
      }
      
      // Add new courses to the plan
      if (newPlannedCourses.length > 0) {
        setPlannedCourses(prev => [...prev, ...newPlannedCourses]);
        success(
          `Added ${newPlannedCourses.length} course${newPlannedCourses.length > 1 ? 's' : ''} from "${schedule.name}"`,
          'Courses Loaded'
        );
      } else {
        warning('No new courses to add from this schedule', 'Already Planned');
      }
      
      // Show summary if some courses were skipped
      const skippedMessages: string[] = [];
      if (alreadyCompleted.length > 0) {
        skippedMessages.push(`${alreadyCompleted.length} already completed`);
      }
      if (alreadyPlanned.length > 0) {
        skippedMessages.push(`${alreadyPlanned.length} already planned`);
      }
      if (notAvailable.length > 0) {
        skippedMessages.push(`${notAvailable.length} not available in curriculum`);
      }
      
      if (skippedMessages.length > 0) {
        console.log('Skipped courses:', { alreadyCompleted, alreadyPlanned, notAvailable });
      }
      
    } catch (error) {
      console.error('Error loading courses from schedule:', error);
      showError('Failed to load courses from tentative schedule');
    }
  };

  // Handle tentative schedule selection
  const handleTentativeScheduleSelect = (scheduleId: string) => {
    setSelectedTentativeSchedule(scheduleId);
    if (scheduleId && scheduleId !== 'none') {
      loadCoursesFromSchedule(scheduleId);
      setShowSectionsInList(true); // Show sections once tentative schedule is loaded
    } else {
      setShowSectionsInList(false); // Hide sections if no schedule selected
    }
  };
  
  // Generate all possible schedule combinations
  const generateScheduleCombinations = (): ScheduleCombination[] => {
    const coursesWithSections = plannedCourses.filter(course => 
      course.sections && course.sections.length > 0
    );
    
    if (coursesWithSections.length === 0) {
      return [];
    }
    
    // Generate all combinations using cartesian product
    const combinations: ScheduleCombination[] = [];
    
    function generateCombos(
      currentIndex: number, 
      currentCombo: Array<PlannedCourse & { selectedSection: CourseSection }>
    ) {
      if (currentIndex === coursesWithSections.length) {
        const { hasConflicts, conflicts } = detectTimeConflicts(currentCombo);
        combinations.push({
          id: `combo-${combinations.length}`,
          courses: [...currentCombo],
          hasConflicts,
          conflicts,
        });
        return;
      }
      
      const course = coursesWithSections[currentIndex];
      const sections = course.sections || [];
      
      for (const section of sections) {
        generateCombos(currentIndex + 1, [
          ...currentCombo,
          { ...course, selectedSection: section }
        ]);
      }
    }
    
    generateCombos(0, []);
    
    // Sort: conflict-free first, then by number of conflicts
    return combinations.sort((a, b) => {
      if (a.hasConflicts === b.hasConflicts) {
        return a.conflicts.length - b.conflicts.length;
      }
      return a.hasConflicts ? 1 : -1;
    });
  };
  
  // Detect time conflicts in a schedule
  const detectTimeConflicts = (
    courses: Array<PlannedCourse & { selectedSection: CourseSection }>
  ): { hasConflicts: boolean; conflicts: string[] } => {
    const conflicts: string[] = [];
    
    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const course1 = courses[i];
        const course2 = courses[j];
        const section1 = course1.selectedSection;
        const section2 = course2.selectedSection;
        
        if (!section1.days || !section2.days || !section1.timeStart || !section2.timeStart) {
          continue;
        }
        
        // Check if they have overlapping days
        const overlappingDays = section1.days.filter(day => 
          section2.days?.includes(day)
        );
        
        if (overlappingDays.length > 0) {
          // Check if times overlap
          const time1Start = section1.timeStart;
          const time1End = section1.timeEnd || section1.timeStart;
          const time2Start = section2.timeStart;
          const time2End = section2.timeEnd || section2.timeStart;
          
          if (timesOverlap(time1Start, time1End, time2Start, time2End)) {
            conflicts.push(
              `${course1.code} (${section1.section}) conflicts with ${course2.code} (${section2.section}) on ${overlappingDays.join(', ')}`
            );
          }
        }
      }
    }
    
    return { hasConflicts: conflicts.length > 0, conflicts };
  };
  
  // Check if two time ranges overlap
  const timesOverlap = (start1: string, end1: string, start2: string, end2: string): boolean => {
    return start1 < end2 && start2 < end1;
  };
  
  // Handle "View Schedule Options" button click
  const handleViewScheduleOptions = () => {
    setGeneratingSchedules(true);
    setTimeout(() => {
      const combinations = generateScheduleCombinations();
      setScheduleCombinations(combinations);
      setGeneratingSchedules(false);
      
      if (combinations.length > 0) {
        setShowScheduleViewer(true);
        // Auto-select first conflict-free combination
        const conflictFree = combinations.find(c => !c.hasConflicts);
        if (conflictFree) {
          setSelectedCombination(conflictFree.id);
          applyScheduleCombination(conflictFree);
        }
      } else {
        warning('No schedule combinations available. Please add sections to your courses.', 'No Schedules');
      }
    }, 100);
  };
  
  // Apply selected schedule combination
  const applyScheduleCombination = (combination: ScheduleCombination) => {
    const updatedCourses = plannedCourses.map(course => {
      const courseInCombo = combination.courses.find(c => c.code === course.code);
      if (courseInCombo) {
        return { ...course, selectedSection: courseInCombo.selectedSection };
      }
      return course;
    });
    setPlannedCourses(updatedCourses);
  };
  
  // Handle section selection from calendar
  const handleSectionSelect = (courseId: string, section: CourseSection) => {
    setPlannedCourses(prev => prev.map(course => {
      if (course.id === courseId) {
        return { ...course, selectedSection: section };
      }
      return course;
    }));
    success(`Selected Section ${section.section} for course`, 'Section Updated');
  };

  // Validate banned combinations for a course
  const validateBannedCombinations = (course: AvailableCourse): { valid: boolean; blockingCourse?: string; reason?: string } => {
    // First check if course is blacklisted for this curriculum
    if (blacklistedCourses.has(course.code.trim())) {
      return {
        valid: false,
        blockingCourse: course.code,
        reason: `${course.code} is blacklisted and cannot be added to this curriculum`
      };
    }

    if (!course.bannedWith || course.bannedWith.length === 0) {
      return { valid: true };
    }

    console.log(`🔍 Checking banned combinations for ${course.code}:`, {
      bannedWith: course.bannedWith,
      completedCourses: Array.from(completedCourses),
      plannedCourses: plannedCourses.map(p => p.code)
    });

    // Check against completed courses
    for (const bannedCourseCode of course.bannedWith) {
      const trimmedBannedCode = bannedCourseCode.trim();
      if (completedCourses.has(trimmedBannedCode)) {
        console.log(`❌ ${course.code} blocked: conflicts with completed course ${trimmedBannedCode}`);
        return { 
          valid: false, 
          blockingCourse: trimmedBannedCode, 
          reason: `Cannot add ${course.code} - conflicts with completed course ${trimmedBannedCode}` 
        };
      }
    }

    // Check against planned courses
    for (const bannedCourseCode of course.bannedWith) {
      const trimmedBannedCode = bannedCourseCode.trim();
      const plannedConflict = plannedCourses.find(planned => planned.code.trim() === trimmedBannedCode);
      if (plannedConflict) {
        console.log(`❌ ${course.code} blocked: conflicts with planned course ${trimmedBannedCode}`);
        return { 
          valid: false, 
          blockingCourse: trimmedBannedCode, 
          reason: `Cannot add ${course.code} - conflicts with planned course ${trimmedBannedCode}` 
        };
      }
    }

    console.log(`✅ ${course.code} allowed: no banned combination conflicts`);
    return { valid: true };
  };

  // Filter available courses based on search, category, and semester selection
  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const notAlreadyPlanned = !plannedCourses.some(planned => planned.code === course.code);
    const notAlreadyCompleted = !completedCourses.has(course.code);
    const notCurrentlyTaking = !inProgressCourses.has(course.code);
    
    // Check for banned combinations
    const bannedValidation = validateBannedCombinations(course);
    const notBanned = bannedValidation.valid;
    
    // Summer session filtering:
    // - If "Summer Session" selected: show ONLY summer-flagged courses
    // - If regular semester selected: show ALL courses
    const matchesSemester = selectedSemester === 'summer'
      ? course.summerOnly  // In summer session: show ONLY summer courses
      : true;              // In regular semester: show ALL courses
    
    return matchesSearch && matchesCategory && notAlreadyPlanned && notAlreadyCompleted && notCurrentlyTaking && notBanned && matchesSemester;
  });

  // Find courses that depend on a specific prerequisite
  const findDependentCourses = (prerequisiteCode: string): PlannedCourse[] => {
    return plannedCourses.filter(planned => 
      planned.prerequisites?.includes(prerequisiteCode) &&
      !completedCourses.has(prerequisiteCode) // Only if prerequisite is not completed
    );
  };

  // Add corequisites automatically
  const addCorequisites = (course: AvailableCourse, semester: string): AvailableCourse[] => {
    const corequisitesToAdd: AvailableCourse[] = [];
    
    if (!course.corequisites || course.corequisites.length === 0) {
      return corequisitesToAdd;
    }

    for (const coreqCode of course.corequisites) {
      // Skip if already completed or planned
      if (completedCourses.has(coreqCode) || 
          plannedCourses.some(planned => planned.code === coreqCode)) {
        continue;
      }

      // Find the corequisite course in available courses
      const coreqCourse = availableCourses.find(c => c.code === coreqCode);
      if (coreqCourse) {
        // Validate the corequisite can be added
        const bannedValidation = validateBannedCombinations(coreqCourse);
        if (bannedValidation.valid) {
          corequisitesToAdd.push(coreqCourse);
        }
      }
    }

    return corequisitesToAdd;
  };

  // Validate prerequisites for a course
  const validatePrerequisites = (course: AvailableCourse): { valid: boolean; missing: string[] } => {
    if (!course.prerequisites || course.prerequisites.length === 0) {
      return { valid: true, missing: [] };
    }

    const missing = course.prerequisites.filter(prereq => 
      !completedCourses.has(prereq) && 
      !plannedCourses.some(planned => planned.code === prereq)
    );

    return { valid: missing.length === 0, missing };
  };

  // Helper function to calculate total credits (completed + planned)
  const calculateTotalCredits = (): number => {
    if (!dataEntryContext) return 0;
    
    const completedCredits = Object.values(dataEntryContext.completedCourses)
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + (parseCredits(c.grade || '') || 0), 0);
    
    const plannedCredits = plannedCourses
      .reduce((sum, p) => sum + p.credits, 0);
    
    return completedCredits + plannedCredits;
  };

  // Add course to plan with advanced validation and corequisite handling
  const addCourseToPlan = (course: AvailableCourse, status: PlannedCourse['status'] = 'planning', selectedSection?: CourseSection) => {
    if (!selectedSemester) {
      warning('Please select a semester first', 'Semester Required');
      return;
    }

    const normalizedSemesterLabel = ensureSemesterLabel(selectedSemesterLabel?.trim() || undefined, selectedSemester);

    // ===== NEW: Course Flags Validation =====
    const flagErrors: string[] = [];
    const flagWarnings: string[] = [];
    
    // Check summer only constraint
    if (course.summerOnly && selectedSemester !== 'summer') {
      flagErrors.push(`${course.code} can only be taken during Summer Session`);
    }
    
    // Check permission required
    if (course.requiresPermission) {
      flagWarnings.push(`${course.code} requires chairperson permission to enroll`);
    }
    
    // Check senior standing requirement
    if (course.requiresSeniorStanding) {
      const totalCredits = calculateTotalCredits();
      const threshold = course.minCreditThreshold || 90;
      if (totalCredits < threshold) {
        flagWarnings.push(
          `${course.code} requires Senior Standing (${threshold}+ credits). ` +
          `You currently have ${totalCredits} credits completed/planned.`
        );
      }
    }
    
    // Show errors and stop if any critical issues
    if (flagErrors.length > 0) {
      showError(flagErrors.join(' • '), 'Cannot Add Course');
      return;
    }
    
    // Show warnings and confirm before proceeding
    if (flagWarnings.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: `Warnings for ${course.code}`,
        message: 'Do you want to add this course anyway?',
        warnings: flagWarnings,
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          // Continue with adding the course
          proceedWithAddingCourse(course, status, normalizedSemesterLabel, selectedSection);
        }
      });
      return;
    }
    // ===== END: Course Flags Validation =====
    
    // If no warnings, proceed directly
    proceedWithAddingCourse(course, status, normalizedSemesterLabel, selectedSection);
  };
  
  // Helper function to proceed with adding course after validation
  const proceedWithAddingCourse = (course: AvailableCourse, status: PlannedCourse['status'], semesterLabel: string, selectedSection?: CourseSection) => {

    // 1. Validate banned combinations
    const bannedValidation = validateBannedCombinations(course);
    if (!bannedValidation.valid) {
      showError(bannedValidation.reason || `Cannot add ${course.code} due to banned combination`, 'Banned Combination');
      return;
    }

    // 2. Validate prerequisites
    const prerequisiteValidation = validatePrerequisites(course);
    
    // 3. Check for corequisites that need to be added
    const corequisitesToAdd = addCorequisites(course, selectedSemester);
    
    // 4. Create the main planned course
    const plannedCourse: PlannedCourse = {
      id: `${course.code}-${selectedSemester}`,
      code: course.code,
      title: course.title,
      credits: parseCredits(course.credits),
      semester: selectedSemester,
      semesterLabel,
      status,
      prerequisites: course.prerequisites,
      corequisites: course.corequisites,
      sections: course.sections,
      selectedSection: selectedSection,
      validationStatus: prerequisiteValidation.valid ? 'valid' : 'warning',
      validationNotes: prerequisiteValidation.missing.length > 0 
        ? [`Missing prerequisites: ${prerequisiteValidation.missing.join(', ')}`]
        : []
    };

    // 5. Create corequisite planned courses
    const corequisitePlannedCourses: PlannedCourse[] = corequisitesToAdd.map(coreqCourse => ({
      id: `${coreqCourse.code}-${selectedSemester}`,
      code: coreqCourse.code,
      title: coreqCourse.title,
      credits: parseCredits(coreqCourse.credits),
      semester: selectedSemester,
      semesterLabel,
      status,
      prerequisites: coreqCourse.prerequisites,
      corequisites: coreqCourse.corequisites,
      validationStatus: 'valid', // Corequisites are automatically valid when added together
      validationNotes: [`Auto-added as corequisite for ${course.code}`]
    }));

    // 6. Add all courses (main + corequisites) to the plan
    setPlannedCourses(prev => [...prev, plannedCourse, ...corequisitePlannedCourses]);
    
    // 7. Show notification if corequisites were added
    if (corequisitesToAdd.length > 0) {
      const coreqNames = corequisitesToAdd.map(c => c.code).join(', ');
      success(`Added ${course.code} and corequisites: ${coreqNames} to ${selectedSemester}`, 'Courses Added', 5000);
    } else {
      success(`Added ${course.code} to ${selectedSemester}`, 'Course Added');
    }
  };

  // Remove course from plan with cascading removal
  const removeCourseFromPlan = (courseId: string) => {
    const courseToRemove = plannedCourses.find(c => c.id === courseId);
    if (!courseToRemove) return;

    // Find courses that depend on this one as a prerequisite
    const dependentCourses = findDependentCourses(courseToRemove.code);
    
    if (dependentCourses.length > 0) {
      const dependentNames = dependentCourses.map(c => c.code).join(', ');
      setConfirmDialog({
        isOpen: true,
        title: 'Remove Dependent Courses?',
        message: `Removing ${courseToRemove.code} will also remove dependent courses: ${dependentNames}. Continue?`,
        onConfirm: () => {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
          // Remove the course and all its dependents
          const coursesToRemove = new Set([courseId, ...dependentCourses.map(c => c.id)]);
          setPlannedCourses(prev => prev.filter(course => !coursesToRemove.has(course.id)));
        }
      });
    } else {
      // Simple removal - no dependents
      setPlannedCourses(prev => prev.filter(course => course.id !== courseId));
    }
  };

  // Update course status
  const updateCourseStatus = (courseId: string, newStatus: PlannedCourse['status']) => {
    setPlannedCourses(prev => prev.map(course => 
      course.id === courseId ? { ...course, status: newStatus } : course
    ));
  };

  // Analyze concentration progress
  const analyzeConcentrations = (): ConcentrationProgress[] => {
    if (concentrations.length === 0) {
      console.log('🔍 DEBUG: No concentrations available for analysis');
      return [];
    }

    // Get completed course codes from context (courses marked as 'completed')
    const allCompletedCodes = Object.keys(dataEntryContext?.completedCourses || {}).filter(
      code => dataEntryContext?.completedCourses[code]?.status === 'completed'
    );
    const allPlannedCodes = plannedCourses.map(course => course.code);
    const allTakenOrPlannedCodes = [...allCompletedCodes, ...allPlannedCodes];

    // Get the selected concentration from data entry context
    const selectedConcentration = dataEntryContext?.selectedConcentration;
    
    console.log('🔍 DEBUG: Analyzing concentrations with:', {
      selectedConcentration,
      concentrationsCount: concentrations.length,
      completedCodes: allCompletedCodes,
      plannedCodes: allPlannedCodes,
      totalConcentrations: concentrations.length
    });

    // Filter concentrations based on selection
    let concentrationsToAnalyze = concentrations;
    
    if (selectedConcentration && selectedConcentration !== 'general' && selectedConcentration !== '') {
      // Find the specific concentration by ID or name
      const specificConcentration = concentrations.find(c => 
        c.id === selectedConcentration || 
        c.name.toLowerCase() === selectedConcentration.toLowerCase()
      );
      
      if (specificConcentration) {
        concentrationsToAnalyze = [specificConcentration];
        console.log(`🔍 DEBUG: Analyzing only selected concentration: ${specificConcentration.name}`);
      } else {
        console.log(`🔍 DEBUG: Selected concentration '${selectedConcentration}' not found, analyzing all`);
      }
    } else {
      console.log('🔍 DEBUG: No specific concentration selected or "general" selected, analyzing all');
    }

    return concentrationsToAnalyze.map(concentration => {
      const concentrationCourseCodes = concentration.courses?.map(c => c.code) || [];
      const completedInConcentration = allCompletedCodes.filter(code => 
        concentrationCourseCodes.includes(code)
      );
      const plannedInConcentration = allPlannedCodes.filter(code => 
        concentrationCourseCodes.includes(code)
      );
      
      const totalProgress = completedInConcentration.length + plannedInConcentration.length;
      const progress = (totalProgress / (concentration.requiredCredits || 1)) * 100;
      const isEligible = totalProgress >= (concentration.requiredCredits || 0);
      const remainingCourses = Math.max(0, (concentration.requiredCredits || 0) - totalProgress);

      console.log(`🔍 DEBUG: Concentration '${concentration.name}':`, {
        requiredCredits: concentration.requiredCredits,
        concentrationCourses: concentrationCourseCodes,
        completedInConcentration,
        plannedInConcentration,
        totalProgress,
        progress: Math.min(100, progress),
        isEligible,
        remainingCourses
      });

      return {
        concentration,
        completedCourses: completedInConcentration,
        plannedCourses: plannedInConcentration,
        progress: Math.min(100, progress),
        isEligible,
        remainingCourses
      };
    });
  };

  // Save course plan to localStorage
  const saveCoursePlan = () => {
    if (!dataEntryContext) return;
    
    try {
      const coursePlanData = {
        curriculumId: dataEntryContext.selectedCurriculum,
        departmentId: dataEntryContext.selectedDepartment,
        plannedCourses,
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('coursePlan', JSON.stringify(coursePlanData));
      
      // Analyze concentrations and show modal
      console.log('🔍 DEBUG: Starting concentration analysis...');
      const analysis = analyzeConcentrations();
      console.log('🔍 DEBUG: Analysis result:', analysis);
      
      setConcentrationAnalysis(analysis);
      setShowConcentrationModal(true);
      
      // Check if we should show notification dialog
      const hasSeenNotification = localStorage.getItem('course-planning-notification-shown');
      if (!hasSeenNotification && plannedCourses.length > 0) {
        // Show notification dialog after concentration modal
        setTimeout(() => {
          setShowNotificationDialog(true);
          localStorage.setItem('course-planning-notification-shown', 'true');
        }, 500);
      }
      
    } catch (error) {
      console.error('Error saving course plan:', error);
      showError('Failed to save course plan. Please try again.', 'Save Failed');
    }
  };

  // Show error message if no valid data entry context
  if (!hasValidContext && !loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center flex items-center gap-2">
                <AlertTriangle className="text-yellow-500" />
                Access Restricted
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Course planning is only accessible after completing the data entry process.
              </p>
              <Button 
                onClick={() => router.push('/student/management/data-entry')}
                className="w-full"
              >
                Go to Data Entry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading course data...</p>
        </div>
      </div>
    );
  }

  if (!dataEntryContext) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-4 sm:px-6 sm:py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/student/management/data-entry')}
          className="flex items-center gap-2 mb-3 sm:mb-4"
        >
          <ArrowLeft size={16} />
          <span className="hidden xs:inline">Add/Edit Completed Courses</span>
          <span className="xs:hidden">Completed Courses</span>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Course Planning</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Browse and select courses for your future semesters
          </p>
        </div>
      </div>

      {/* Prompt to load tentative schedule and add completed courses */}
      <div className="space-y-3 mb-4 sm:mb-6">
        {!selectedTentativeSchedule && (
          <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
            <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-amber-900 dark:text-amber-100">
              <p className="font-medium mb-1">Load a Tentative Schedule to see available sections</p>
              <p className="text-sm">
                Select a tentative schedule below to see which courses are actually being offered with their sections and schedules.
              </p>
            </AlertDescription>
          </Alert>
        )}
        {completedCourses.size === 0 && (
          <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="text-blue-900 dark:text-blue-100">
              <p className="font-medium mb-1">Add completed courses for prerequisite validation</p>
              <p className="text-sm">
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-blue-600 dark:text-blue-400 underline"
                  onClick={() => router.push('/student/management/data-entry')}
                >
                  Add your completed courses
                </Button> 
                {' '}to validate prerequisites and get personalized course recommendations.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Course Search and Selection - Left Panel */}
        <div className="xl:col-span-2 space-y-4 sm:space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search size={20} />
                Available Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <CourseSearch
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categoryOptions={categoryOptions}
                filteredCoursesCount={filteredCourses.length}
              />

              {/* Semester Selection */}
              <div className="p-3 sm:p-4 bg-muted rounded-lg space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Semester</label>
                    <Select value={selectedSemester} onValueChange={handleSemesterSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select semester" />
                      </SelectTrigger>
                      <SelectContent>
                        {semesterOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Semester Label</label>
                    <Input
                      value={selectedSemesterLabel}
                      onChange={(event) => setSelectedSemesterLabel(event.target.value)}
                      placeholder={getSuggestedSemesterLabel(selectedSemester || '1')}
                      className="w-full"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use the format term/year such as 1/2025 for Semester 1, 2/2025 for Semester 2, or 3/2025 for Summer Session.
                </p>
              </div>

              {/* Tentative Schedule Selector - Always visible */}
              <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2 mb-3">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-blue-900 dark:text-blue-100 block mb-2">
                      Load from Tentative Schedule
                    </label>
                    
                    {/* Department Filter */}
                    {departments.length > 0 && (
                      <div className="mb-3">
                        <label className="text-xs text-blue-700 dark:text-blue-300 block mb-1">
                          Department
                        </label>
                        <Select 
                          value={selectedScheduleDepartmentId} 
                          onValueChange={setSelectedScheduleDepartmentId}
                        >
                          <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="my-department">My Department</SelectItem>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    
                    {loadingSchedules ? (
                      <div className="flex items-center gap-2 py-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-blue-700 dark:text-blue-300">Loading schedules...</span>
                      </div>
                    ) : tentativeSchedules.length > 0 ? (
                      <>
                        <Select 
                          value={selectedTentativeSchedule} 
                          onValueChange={handleTentativeScheduleSelect}
                        >
                          <SelectTrigger className="w-full bg-white dark:bg-gray-900">
                            <SelectValue placeholder="Select a tentative schedule..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-- None --</SelectItem>
                            {tentativeSchedules.map((schedule) => (
                              <SelectItem key={schedule.id} value={schedule.id}>
                                {schedule.name} ({schedule.semester}) - {schedule.coursesCount} courses
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                          Select a tentative schedule to automatically add courses to your plan.
                        </p>
                      </>
                    ) : (
                      <div className="py-2">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          No published tentative schedules available for the selected department.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Course Flags Legend - Mobile-optimized */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded text-xs">
                <span className="text-gray-600 dark:text-gray-400 font-medium">Course indicators:</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Summer only</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Permission required</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Senior standing</span>
                </div>
              </div>

              {/* Course List */}
              <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto space-y-2 sm:space-y-3">
                {filteredCourses.map((course) => {
                  const prerequisiteValidation = validatePrerequisites(course);
                  const bannedValidation = validateBannedCombinations(course);
                  const hasSections = course.sections && course.sections.length > 0;
                  
                  // Only show sections if a tentative schedule is loaded AND course has sections
                  if (hasSections && showSectionsInList && selectedTentativeSchedule) {
                    return (
                      <CourseWithSections
                        key={course.code}
                        course={course}
                        onAddToPlan={(course, section) => addCourseToPlan(course, 'planning', section)}
                        prerequisiteValidation={prerequisiteValidation}
                        bannedValidation={bannedValidation}
                        selectedSemester={selectedSemester}
                      />
                    );
                  }
                  
                  // Use regular card - either no sections or no schedule selected
                  return (
                    <CourseCard
                      key={course.code}
                      course={course}
                      onAddToPlan={(course) => addCourseToPlan(course, 'planning')}
                      selectedSemester={selectedSemester}
                      prerequisiteValidation={prerequisiteValidation}
                      bannedValidation={bannedValidation}
                    />
                  );
                })}
                
                {filteredCourses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No courses match your search criteria
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Plan Summary - Right Panel */}
        <div className="space-y-4 sm:space-y-6">
          {/* Planned Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Calendar size={18} className="sm:w-5 sm:h-5" />
                Course Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plannedCourses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No courses planned yet
                  </p>
                ) : (
                  <>
                    {/* Group courses by semester */}
                    {Object.entries(
                      plannedCourses.reduce((acc, course) => {
                        const label = course.semesterLabel || (course.semester === 'summer' ? 'Summer Session' : `Semester ${course.semester || '1'}`);
                        if (!acc[label]) acc[label] = [];
                        acc[label].push(course);
                        return acc;
                      }, {} as Record<string, PlannedCourse[]>)
                    ).map(([semesterLabel, courses]) => (
                      <div key={semesterLabel} className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground border-b pb-1">
                          {semesterLabel}
                        </h4>
                        {courses.map((course) => (
                          <PlannedCourseCard
                            key={course.id}
                            course={course}
                            onRemove={removeCourseFromPlan}
                            onStatusUpdate={updateCourseStatus}
                          />
                        ))}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Plan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3">
              <div className="flex justify-between text-sm">
                <span>Total Courses:</span>
                <span className="font-medium">{plannedCourses.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Credits:</span>
                <span className="font-medium">
                  {plannedCourses.reduce((sum, course) => sum + course.credits, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Valid Courses:</span>
                <span className="font-medium text-green-600">
                  {plannedCourses.filter(c => c.validationStatus === 'valid').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Warnings:</span>
                <span className="font-medium text-orange-600">
                  {plannedCourses.filter(c => c.validationStatus === 'warning').length}
                </span>
              </div>
              
              {/* Navigation Buttons */}
              <div className="pt-4 border-t space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push('/student/management/schedule-view')}
                  disabled={plannedCourses.length === 0}
                >
                  <Calendar size={16} className="mr-2" />
                  Visualize Schedule
                </Button>
                <Button 
                  className="w-full" 
                  onClick={() => router.push('/student/management/progress')}
                >
                  <CheckCircle size={16} className="mr-2" />
                  View Progress
                </Button>
              </div>
              
              <Button 
                className="w-full mt-3 sm:mt-4 text-sm sm:text-base" 
                onClick={saveCoursePlan}
              >
                <Clock size={14} className="mr-2 sm:w-4 sm:h-4" />
                Save Course Plan
              </Button>
              
              {plannedCourses.some(c => c.sections && c.sections.length > 0) && (
                <Button 
                  className="w-full mt-2 text-sm sm:text-base" 
                  variant="secondary"
                  onClick={handleViewScheduleOptions}
                  disabled={generatingSchedules}
                >
                  {generatingSchedules ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Calendar size={14} className="mr-2 sm:w-4 sm:h-4" />
                      View Schedule Options
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Schedule Calendar View - Full Width */}
      {plannedCourses.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar size={20} />
              Your Schedule
            </h2>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List size={16} className="mr-1" />
                List View
              </Button>
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
              >
                <LayoutGrid size={16} className="mr-1" />
                Calendar View
              </Button>
            </div>
          </div>
          
          {viewMode === 'calendar' ? (
            <CourseScheduleCalendar
              courses={plannedCourses}
              onSelectSection={handleSectionSelect}
              showSectionSelector={true}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Planned Courses List</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(
                    plannedCourses.reduce((acc, course) => {
                      const label = course.semesterLabel || (course.semester === 'summer' ? 'Summer Session' : `Semester ${course.semester || '1'}`);
                      if (!acc[label]) acc[label] = [];
                      acc[label].push(course);
                      return acc;
                    }, {} as Record<string, PlannedCourse[]>)
                  ).map(([semesterLabel, courses]) => (
                    <div key={semesterLabel} className="space-y-3">
                      <h3 className="font-semibold text-lg border-b pb-2">
                        {semesterLabel}
                      </h3>
                      <div className="grid gap-3">
                        {courses.map((course) => (
                          <div key={course.id} className="border rounded-lg p-4 hover:bg-muted/50">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-semibold text-lg">{course.code}</div>
                                <div className="text-sm text-muted-foreground">{course.title}</div>
                              </div>
                              <Badge>{course.credits} credits</Badge>
                            </div>
                            {course.selectedSection && (
                              <div className="mt-3 p-3 bg-muted rounded-lg text-sm space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Section:</span>
                                  <span>{course.selectedSection.section}</span>
                                </div>
                                {course.selectedSection.instructor && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Instructor:</span>
                                    <span>{course.selectedSection.instructor}</span>
                                  </div>
                                )}
                                {course.selectedSection.days && course.selectedSection.days.length > 0 && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Days:</span>
                                    <span>{course.selectedSection.days.join(', ')}</span>
                                  </div>
                                )}
                                {course.selectedSection.timeStart && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Time:</span>
                                    <span>{course.selectedSection.timeStart} - {course.selectedSection.timeEnd}</span>
                                  </div>
                                )}
                                {course.selectedSection.room && (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">Room:</span>
                                    <span>{course.selectedSection.room}</span>
                                  </div>
                                )}
                              </div>
                            )}
                            {course.sections && course.sections.length > 1 && (
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  {course.sections.length} sections available
                                </Badge>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Concentration Analysis Modal */}
      <Dialog open={showConcentrationModal} onOpenChange={setShowConcentrationModal}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Target size={18} className="sm:w-5 sm:h-5" />
              Concentration Analysis
            </DialogTitle>
            <DialogDescription>
              Based on your completed and planned courses, here's your progress toward available concentrations.
            </DialogDescription>
          </DialogHeader>
          
          <ConcentrationAnalysis
            concentrationAnalysis={concentrationAnalysis.map(analysis => ({
              concentration: {
                id: analysis.concentration.id,
                name: analysis.concentration.name,
                description: analysis.concentration.description,
                requiredCredits: analysis.concentration.requiredCredits || 0
              },
              isEligible: analysis.isEligible,
              progress: analysis.progress,
              completedCourses: analysis.completedCourses.map(code => ({ id: code, code, name: code })),
              plannedCourses: analysis.plannedCourses.map(code => ({ id: code, code, name: code })),
              remainingCourses: analysis.remainingCourses
            } as ConcentrationProgressProps))}
            onClose={() => setShowConcentrationModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="text-yellow-500" size={20} />
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription>
              {confirmDialog.message}
            </DialogDescription>
          </DialogHeader>
          
          {confirmDialog.warnings && confirmDialog.warnings.length > 0 && (
            <div className="space-y-2 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              {confirmDialog.warnings.map((warning, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" size={16} />
                  <span className="text-yellow-800 dark:text-yellow-200">{warning}</span>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDialog.onConfirm}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Schedule Viewer Modal */}
      <Dialog open={showScheduleViewer} onOpenChange={setShowScheduleViewer}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Available Schedule Combinations</DialogTitle>
            <DialogDescription>
              {scheduleCombinations.length > 0 ? (
                <>
                  Found {scheduleCombinations.length} possible schedule{scheduleCombinations.length > 1 ? 's' : ''}. 
                  {scheduleCombinations.filter(c => !c.hasConflicts).length > 0 && (
                    <span className="text-green-600 font-medium ml-1">
                      ({scheduleCombinations.filter(c => !c.hasConflicts).length} conflict-free)
                    </span>
                  )}
                </>
              ) : (
                'No schedules available'
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {scheduleCombinations.map((combination, index) => (
              <div
                key={combination.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedCombination === combination.id
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary/50'
                }`}
                onClick={() => setSelectedCombination(combination.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">Schedule Option {index + 1}</span>
                    {!combination.hasConflicts && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                        ✓ No Conflicts
                      </span>
                    )}
                    {combination.hasConflicts && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                        {combination.conflicts.length} Conflict{combination.conflicts.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {selectedCombination === combination.id && (
                    <span className="text-primary font-medium text-sm">Selected</span>
                  )}
                </div>
                
                {/* Course Details */}
                <div className="space-y-2">
                  {combination.courses.map((course) => (
                    <div key={course.id} className="flex flex-wrap items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800/50 p-2 rounded">
                      <span className="font-medium">{course.code}</span>
                      <span className="text-gray-600 dark:text-gray-400">Section {course.selectedSection.section}</span>
                      {course.selectedSection.instructor && (
                        <span className="text-gray-600 dark:text-gray-400">• {course.selectedSection.instructor}</span>
                      )}
                      {course.selectedSection.days && course.selectedSection.days.length > 0 && (
                        <span className="text-gray-600 dark:text-gray-400">
                          • {course.selectedSection.days.join(', ')}
                        </span>
                      )}
                      {course.selectedSection.timeStart && (
                        <span className="text-gray-600 dark:text-gray-400">
                          • {course.selectedSection.timeStart} - {course.selectedSection.timeEnd}
                        </span>
                      )}
                      {course.selectedSection.room && (
                        <span className="text-gray-600 dark:text-gray-400">• Room {course.selectedSection.room}</span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Conflicts */}
                {combination.hasConflicts && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                    <div className="font-medium text-red-700 dark:text-red-300 text-sm mb-1">Conflicts:</div>
                    <ul className="text-xs text-red-600 dark:text-red-400 space-y-1">
                      {combination.conflicts.map((conflict, idx) => (
                        <li key={idx}>• {conflict}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowScheduleViewer(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const selected = scheduleCombinations.find(c => c.id === selectedCombination);
                if (selected) {
                  applyScheduleCombination(selected);
                  setShowScheduleViewer(false);
                  success('Schedule applied to your course plan', 'Schedule Selected');
                }
              }}
              disabled={!selectedCombination}
            >
              Apply Selected Schedule
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notification Subscription Dialog */}
      <NotificationSubscribeDialog
        open={showNotificationDialog}
        onOpenChange={setShowNotificationDialog}
        departmentId={dataEntryContext.selectedDepartment}
      />
    </div>
  );
}