'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useToastHelpers } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  Plus,
  Calendar, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowLeft,
  BarChart3,
  Target
} from 'lucide-react';
import { CourseCard, AvailableCourse as MgmtAvailableCourse } from '@/components/features/management/CourseCard';
import { CourseSearch } from '@/components/features/management/CourseSearch';
import { PlannedCourseCard, PlannedCourse as MgmtPlannedCourse } from '@/components/features/management/PlannedCourseCard';
import { ConcentrationAnalysis, ConcentrationProgress as MgmtConcentrationProgress } from '@/components/features/management/ConcentrationAnalysis';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


// Extended interfaces to maintain compatibility
interface PlannedCourse extends MgmtPlannedCourse {
  semester?: string;
  prerequisites?: string[];
  corequisites?: string[];
}

interface AvailableCourse extends MgmtAvailableCourse {
  bannedWith?: string[];
  level?: number;
  blockingCourse?: string;
  minCreditThreshold?: number;
}

// Custom concentration interfaces
interface ConcentrationCourse {
  code: string;
  name: string;
  credits: number;
  description?: string;
}

interface Concentration {
  id: string;
  name: string;
  description?: string;
  requiredCourses: number;
  totalCourses: number;
  courses: ConcentrationCourse[];
}

interface ConcentrationProgress {
  concentration: Concentration;
  completedCourses: string[];
  plannedCourses: string[];
  progress: number;
  isEligible: boolean;
  remainingCourses: number;
}

interface DataEntryContext {
  selectedDepartment: string;
  selectedCurriculum: string;
  selectedConcentration: string;
  completedCourses: { [code: string]: { status: string; grade?: string } };
  freeElectives: { code: string; title: string; credits: number }[];
  actualDepartmentId?: string;
}

export default function CoursePlanningPage() {
  const router = useRouter();
  const toast = useToastHelpers();
  
  // Check for data entry context
  const [dataEntryContext, setDataEntryContext] = useState<DataEntryContext | null>(null);
  const [hasValidContext, setHasValidContext] = useState(false);
  
  // State management
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [concentrationAnalysis, setConcentrationAnalysis] = useState<ConcentrationProgress[]>([]);
  const [showConcentrationModal, setShowConcentrationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [loading, setLoading] = useState(true);
  const [blacklistedCourses, setBlacklistedCourses] = useState<Set<string>>(new Set());
  
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
    { value: '1', label: 'Semester' },
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
          selectedConcentration: auditData.selectedConcentration || '',
          completedCourses: auditData.completedCourses || {},
          freeElectives: auditData.freeElectives || []
        };

        setDataEntryContext(context);
        setHasValidContext(true);

        // Auto-sync completed courses
        const completedCourseCodes = Object.keys(context.completedCourses).filter(
          code => context.completedCourses[code]?.status === 'completed'
        );
        setCompletedCourses(new Set(completedCourseCodes));

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
            
            return {
              id: `planned-${code}-${Date.now()}-${index}`,
              code: code,
              title: title,
              credits: credits,
              semester: '1', // Default semester
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
      fetchAvailableCourses();
      fetchConcentrations();
      fetchBlacklistedCourses();
      loadSavedCoursePlan();
    }
  }, [hasValidContext, dataEntryContext]);

  const fetchAvailableCourses = async () => {
    if (!dataEntryContext) return;
    
    try {
      setLoading(true);
      // Use actualDepartmentId if available, fall back to selectedDepartment
      const departmentId = dataEntryContext.actualDepartmentId || dataEntryContext.selectedDepartment;
      const response = await fetch(`/api/available-courses?curriculumId=${dataEntryContext.selectedCurriculum}&departmentId=${departmentId}`);
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
      const response = await fetch(`/api/public-concentrations?curriculumId=${dataEntryContext.selectedCurriculum}&departmentId=${actualDepartmentId}`);
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
          requiredCourses: 5,
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
          requiredCourses: 4,
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
      const response = await fetch(`/api/public-curricula/${dataEntryContext.selectedCurriculum}/blacklists`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch blacklisted courses');
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
      console.error('Error fetching blacklisted courses:', error);
      // Set empty set on error
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
          savedCourses = (planData.plannedCourses || []).map((course: any) => ({
            ...course,
            status: 'planning' // Convert all statuses to 'planning'
          }));
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
    
    // Check for banned combinations
    const bannedValidation = validateBannedCombinations(course);
    const notBanned = bannedValidation.valid;
    
    // Summer session filtering:
    // - If "Summer Session" selected: show ONLY summer-flagged courses
    // - If regular semester selected: show ALL courses
    const matchesSemester = selectedSemester === 'summer'
      ? course.summerOnly  // In summer session: show ONLY summer courses
      : true;              // In regular semester: show ALL courses
    
    return matchesSearch && matchesCategory && notAlreadyPlanned && notAlreadyCompleted && notBanned && matchesSemester;
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
  const addCourseToPlan = (course: AvailableCourse, status: PlannedCourse['status'] = 'planning') => {
    if (!selectedSemester) {
      toast.warning('Please select a semester first', 'Semester Required');
      return;
    }

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
      toast.error(flagErrors.join(' • '), 'Cannot Add Course');
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
          proceedWithAddingCourse(course, status);
        }
      });
      return;
    }
    // ===== END: Course Flags Validation =====
    
    // If no warnings, proceed directly
    proceedWithAddingCourse(course, status);
  };
  
  // Helper function to proceed with adding course after validation
  const proceedWithAddingCourse = (course: AvailableCourse, status: PlannedCourse['status']) => {

    // 1. Validate banned combinations
    const bannedValidation = validateBannedCombinations(course);
    if (!bannedValidation.valid) {
      toast.error(bannedValidation.reason || `Cannot add ${course.code} due to banned combination`, 'Banned Combination');
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
      status,
      prerequisites: course.prerequisites,
      corequisites: course.corequisites,
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
      toast.success(`Added ${course.code} and corequisites: ${coreqNames} to ${selectedSemester}`, 'Courses Added', 5000);
    } else {
      toast.success(`Added ${course.code} to ${selectedSemester}`, 'Course Added');
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
      const concentrationCourseCodes = concentration.courses.map(c => c.code);
      const completedInConcentration = allCompletedCodes.filter(code => 
        concentrationCourseCodes.includes(code)
      );
      const plannedInConcentration = allPlannedCodes.filter(code => 
        concentrationCourseCodes.includes(code)
      );
      
      const totalProgress = completedInConcentration.length + plannedInConcentration.length;
      const progress = (totalProgress / concentration.requiredCourses) * 100;
      const isEligible = totalProgress >= concentration.requiredCourses;
      const remainingCourses = Math.max(0, concentration.requiredCourses - totalProgress);

      console.log(`🔍 DEBUG: Concentration '${concentration.name}':`, {
        requiredCourses: concentration.requiredCourses,
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
      
    } catch (error) {
      console.error('Error saving course plan:', error);
      toast.error('Failed to save course plan. Please try again.', 'Save Failed');
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
                onClick={() => router.push('/management/data-entry')}
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
          onClick={() => router.push('/management/data-entry')}
          className="flex items-center gap-2 mb-3 sm:mb-4"
        >
          <ArrowLeft size={16} />
          <span className="hidden xs:inline">Back to Data Entry</span>
          <span className="xs:hidden">Back</span>
        </Button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Course Planning</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Plan your future courses for {dataEntryContext.selectedDepartment} - {dataEntryContext.selectedCurriculum}
          </p>
        </div>
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
              <div className="p-3 sm:p-4 bg-muted rounded-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Semester</label>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
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
                        const key = `Semester ${course.semester || '1'}`;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(course);
                        return acc;
                      }, {} as Record<string, PlannedCourse[]>)
                    ).map(([semesterKey, courses]) => (
                      <div key={semesterKey} className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground border-b pb-1">
                          {semesterKey}
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
              
              <Button 
                className="w-full mt-3 sm:mt-4 text-sm sm:text-base" 
                onClick={saveCoursePlan}
              >
                <Clock size={14} className="mr-2 sm:w-4 sm:h-4" />
                Save Course Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

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
              ...analysis,
              completedCourses: analysis.completedCourses.map(code => ({ id: code, code, name: code })),
              plannedCourses: analysis.plannedCourses.map(code => ({ id: code, code, name: code }))
            }))}
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
    </div>
  );
}