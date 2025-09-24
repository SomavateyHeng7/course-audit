'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';


// Course planning specific interfaces
interface PlannedCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: string;
  year: number;
  status: 'planning' | 'will-take' | 'considering';
  prerequisites?: string[];
  corequisites?: string[];
  validationStatus: 'valid' | 'warning' | 'error';
  validationNotes?: string[];
}

interface AvailableCourse {
  code: string;
  title: string;
  credits: number;
  description?: string;
  prerequisites?: string[];
  corequisites?: string[];
  bannedWith?: string[];
  category: string;
  level: number;
  blockingCourse?: string; // Course that blocks this one from being added
}

interface Concentration {
  id: string;
  name: string;
  description?: string;
  requiredCourses: number;
  totalCourses: number;
  courses: {
    code: string;
    name: string;
    credits: number;
    description?: string;
  }[];
}

interface ConcentrationProgress {
  concentration: Concentration;
  completedCourses: string[];
  plannedCourses: string[];
  progress: number; // percentage
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
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

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

  // Year options (current year + next 4 years)
  const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() + i;
    return { value: year, label: year.toString() };
  });

  // Category options
  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'General Education', label: 'General Education' },
    { value: 'Core', label: 'Core Courses' },
    { value: 'Major', label: 'Major Courses' },
    { value: 'Major Elective', label: 'Major Electives' },
    { value: 'Free Elective', label: 'Free Electives' },
  ];

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

        console.log('Loaded data entry context:', context);
        console.log('Completed courses:', completedCourseCodes);

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
      setAvailableCourses(data.courses || []);
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
          level: 4
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
          level: 4
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
          level: 4
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
          level: 4
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
          level: 4
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

  // Load saved course plan from localStorage
  const loadSavedCoursePlan = () => {
    if (!dataEntryContext) return;
    
    try {
      const savedCoursePlan = localStorage.getItem('coursePlan');
      if (savedCoursePlan) {
        const planData = JSON.parse(savedCoursePlan);
        if (planData.curriculumId === dataEntryContext.selectedCurriculum && 
            planData.departmentId === dataEntryContext.selectedDepartment) {
          setPlannedCourses(planData.plannedCourses || []);
          console.log('Loaded saved course plan:', planData.plannedCourses);
        }
      }
    } catch (error) {
      console.error('Error loading saved course plan:', error);
    }
  };

  // Validate banned combinations for a course
  const validateBannedCombinations = (course: AvailableCourse): { valid: boolean; blockingCourse?: string; reason?: string } => {
    if (!course.bannedWith || course.bannedWith.length === 0) {
      return { valid: true };
    }

    // Check against completed courses
    for (const bannedCourseCode of course.bannedWith) {
      if (completedCourses.has(bannedCourseCode)) {
        return { 
          valid: false, 
          blockingCourse: bannedCourseCode, 
          reason: `Cannot add ${course.code} - conflicts with completed course ${bannedCourseCode}` 
        };
      }
    }

    // Check against planned courses
    for (const bannedCourseCode of course.bannedWith) {
      const plannedConflict = plannedCourses.find(planned => planned.code === bannedCourseCode);
      if (plannedConflict) {
        return { 
          valid: false, 
          blockingCourse: bannedCourseCode, 
          reason: `Cannot add ${course.code} - conflicts with planned course ${bannedCourseCode}` 
        };
      }
    }

    return { valid: true };
  };

  // Filter available courses based on search and category
  const filteredCourses = availableCourses.filter(course => {
    const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const notAlreadyPlanned = !plannedCourses.some(planned => planned.code === course.code);
    const notAlreadyCompleted = !completedCourses.has(course.code);
    
    // Check for banned combinations
    const bannedValidation = validateBannedCombinations(course);
    const notBanned = bannedValidation.valid;
    
    return matchesSearch && matchesCategory && notAlreadyPlanned && notAlreadyCompleted && notBanned;
  });

  // Find courses that depend on a specific prerequisite
  const findDependentCourses = (prerequisiteCode: string): PlannedCourse[] => {
    return plannedCourses.filter(planned => 
      planned.prerequisites?.includes(prerequisiteCode) &&
      !completedCourses.has(prerequisiteCode) // Only if prerequisite is not completed
    );
  };

  // Add corequisites automatically
  const addCorequisites = (course: AvailableCourse, semester: string, year: number): AvailableCourse[] => {
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
      !plannedCourses.some(planned => planned.code === prereq && planned.status !== 'considering')
    );

    return { valid: missing.length === 0, missing };
  };

  // Add course to plan with advanced validation and corequisite handling
  const addCourseToPlan = (course: AvailableCourse, status: PlannedCourse['status'] = 'planning') => {
    if (!selectedSemester || !selectedYear) {
      alert('Please select a semester and year first');
      return;
    }

    // 1. Validate banned combinations
    const bannedValidation = validateBannedCombinations(course);
    if (!bannedValidation.valid) {
      alert(bannedValidation.reason || `Cannot add ${course.code} due to banned combination`);
      return;
    }

    // 2. Validate prerequisites
    const prerequisiteValidation = validatePrerequisites(course);
    
    // 3. Check for corequisites that need to be added
    const corequisitesToAdd = addCorequisites(course, selectedSemester, selectedYear);
    
    // 4. Create the main planned course
    const plannedCourse: PlannedCourse = {
      id: `${course.code}-${selectedSemester}-${selectedYear}`,
      code: course.code,
      title: course.title,
      credits: parseCredits(course.credits),
      semester: selectedSemester,
      year: selectedYear,
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
      id: `${coreqCourse.code}-${selectedSemester}-${selectedYear}`,
      code: coreqCourse.code,
      title: coreqCourse.title,
      credits: parseCredits(coreqCourse.credits),
      semester: selectedSemester,
      year: selectedYear,
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
      alert(`Added ${course.code} and corequisites: ${coreqNames} to ${selectedSemester} ${selectedYear}`);
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
      const confirmRemoval = confirm(
        `Removing ${courseToRemove.code} will also remove dependent courses: ${dependentNames}. Continue?`
      );
      
      if (!confirmRemoval) {
        return;
      }
      
      // Remove the course and all its dependents
      const coursesToRemove = new Set([courseId, ...dependentCourses.map(c => c.id)]);
      setPlannedCourses(prev => prev.filter(course => !coursesToRemove.has(course.id)));
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
      alert('Failed to save course plan');
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading course data...</div>
      </div>
    );
  }

  if (!dataEntryContext) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Course Planning</h1>
          <p className="text-muted-foreground">
            Plan your future courses for {dataEntryContext.selectedDepartment} - {dataEntryContext.selectedCurriculum}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/management/data-entry')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Data Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Search and Selection - Left Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search size={20} />
                Available Courses
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground flex items-center">
                  {filteredCourses.length} course(s) available
                </div>
              </div>

              {/* Semester and Year Selection */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <label className="text-sm font-medium mb-2 block">Semester</label>
                  <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                    <SelectTrigger>
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
                  <label className="text-sm font-medium mb-2 block">Year</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Course List */}
              <div className="max-h-[600px] overflow-y-auto space-y-3">
                {filteredCourses.map((course) => {
                  const prerequisiteValidation = validatePrerequisites(course);
                  const bannedValidation = validateBannedCombinations(course);
                  const hasBlockingIssues = !prerequisiteValidation.valid || !bannedValidation.valid;
                  
                  return (
                    <div 
                      key={course.code} 
                      className={`border rounded-lg p-4 transition-colors ${
                        hasBlockingIssues 
                          ? 'border-red-200 bg-red-50/50 hover:bg-red-50' 
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{course.code}</h3>
                            <Badge variant="outline">{course.category}</Badge>
                            <Badge variant="secondary">{parseCredits(course.credits)} credits</Badge>
                            {!bannedValidation.valid && (
                              <Badge variant="destructive" className="text-xs">
                                🚫 Blocked
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm font-medium mb-1">{course.title}</p>
                          {course.description && (
                            <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                          )}
                          
                          {/* Prerequisites info */}
                          {course.prerequisites && course.prerequisites.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-1">
                              Prerequisites: {course.prerequisites.join(', ')}
                              {!prerequisiteValidation.valid && (
                                <span className="text-orange-600 ml-2">
                                  (Missing: {prerequisiteValidation.missing.join(', ')})
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Corequisites info */}
                          {course.corequisites && course.corequisites.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-1">
                              Corequisites: {course.corequisites.join(', ')}
                            </div>
                          )}
                          
                          {/* Banned combinations warning */}
                          {!bannedValidation.valid && (
                            <div className="text-xs text-red-600 mb-1">
                              ⚠️ Cannot be taken with: {bannedValidation.blockingCourse}
                              {bannedValidation.reason && (
                                <span className="block text-xs mt-1">
                                  {bannedValidation.reason}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            size="sm"
                            onClick={() => addCourseToPlan(course, 'planning')}
                            disabled={!selectedSemester || !selectedYear || hasBlockingIssues}
                            className="flex items-center gap-1"
                            variant={hasBlockingIssues ? "secondary" : "default"}
                          >
                            <Plus size={14} />
                            {hasBlockingIssues ? "Blocked" : "Add to Plan"}
                          </Button>
                          {!prerequisiteValidation.valid && (
                            <div className="text-xs text-orange-600 text-center">
                              ⚠️ Missing Prerequisites
                            </div>
                          )}
                          {!bannedValidation.valid && (
                            <div className="text-xs text-red-600 text-center">
                              🚫 Banned Combination
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
        <div className="space-y-6">
          {/* Planned Courses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={20} />
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
                    {/* Group courses by semester and year */}
                    {Object.entries(
                      plannedCourses.reduce((acc, course) => {
                        const key = `${course.year} - Semester ${course.semester}`;
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
                          <div key={course.id} className="bg-muted rounded-lg p-3 space-y-2">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">{course.code}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {course.credits} cr
                                  </Badge>
                                  {course.validationStatus === 'valid' && (
                                    <CheckCircle size={14} className="text-green-600" />
                                  )}
                                  {course.validationStatus === 'warning' && (
                                    <AlertTriangle size={14} className="text-orange-600" />
                                  )}
                                  {course.validationStatus === 'error' && (
                                    <AlertTriangle size={14} className="text-red-600" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">{course.title}</p>
                                
                                <Select
                                  value={course.status}
                                  onValueChange={(value) => updateCourseStatus(course.id, value as PlannedCourse['status'])}
                                >
                                  <SelectTrigger className="h-6 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="planning">Planning</SelectItem>
                                    <SelectItem value="will-take">Will Take</SelectItem>
                                    <SelectItem value="considering">Considering</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeCourseFromPlan(course.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              >
                                ×
                              </Button>
                            </div>
                            
                            {course.validationNotes && course.validationNotes.length > 0 && (
                              <Alert className="py-1 px-2">
                                <AlertDescription className="text-xs">
                                  {course.validationNotes.join(', ')}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
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
              <CardTitle className="text-lg">Plan Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                className="w-full mt-4" 
                onClick={saveCoursePlan}
                disabled={plannedCourses.length === 0}
              >
                <Clock size={16} className="mr-2" />
                Save Course Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Concentration Analysis Modal */}
      <Dialog open={showConcentrationModal} onOpenChange={setShowConcentrationModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target size={20} />
              Concentration Analysis
            </DialogTitle>
            <DialogDescription>
              Based on your completed and planned courses, here's your progress toward available concentrations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {concentrationAnalysis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target size={48} className="mx-auto mb-4 opacity-50" />
                <p>No concentration data available.</p>
              </div>
            ) : (
              concentrationAnalysis.map((analysis) => (
                <div key={analysis.concentration.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{analysis.concentration.name}</h3>
                      {analysis.concentration.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {analysis.concentration.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${analysis.isEligible ? 'text-green-600' : 'text-blue-600'}`}>
                        {Math.round(analysis.progress)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {analysis.completedCourses.length + analysis.plannedCourses.length} / {analysis.concentration.requiredCourses} required
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        analysis.isEligible ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(100, analysis.progress)}%` }}
                    />
                  </div>
                  
                  {/* Status */}
                  <div className="flex items-center gap-2 mb-4">
                    {analysis.isEligible ? (
                      <>
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-green-600 font-medium">Eligible for this concentration!</span>
                      </>
                    ) : (
                      <>
                        <Clock size={16} className="text-blue-600" />
                        <span className="text-blue-600">
                          {analysis.remainingCourses} more course{analysis.remainingCourses !== 1 ? 's' : ''} needed
                        </span>
                      </>
                    )}
                  </div>
                  
                  {/* Course Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Completed Courses */}
                    {analysis.completedCourses.length > 0 && (
                      <div>
                        <h4 className="font-medium text-green-600 mb-2 flex items-center gap-1">
                          <CheckCircle size={14} />
                          Completed ({analysis.completedCourses.length})
                        </h4>
                        <div className="space-y-1">
                          {analysis.completedCourses.map(courseCode => {
                            const course = analysis.concentration.courses.find(c => c.code === courseCode);
                            return (
                              <div key={courseCode} className="text-sm text-muted-foreground">
                                {courseCode} - {course?.name || 'Unknown Course'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Planned Courses */}
                    {analysis.plannedCourses.length > 0 && (
                      <div>
                        <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-1">
                          <Clock size={14} />
                          Planned ({analysis.plannedCourses.length})
                        </h4>
                        <div className="space-y-1">
                          {analysis.plannedCourses.map(courseCode => {
                            const course = analysis.concentration.courses.find(c => c.code === courseCode);
                            return (
                              <div key={courseCode} className="text-sm text-muted-foreground">
                                {courseCode} - {course?.name || 'Unknown Course'}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Available Courses for this Concentration */}
                  {!analysis.isEligible && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-muted-foreground mb-2">
                        Available courses for this concentration:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysis.concentration.courses
                          .filter(course => 
                            !analysis.completedCourses.includes(course.code) && 
                            !analysis.plannedCourses.includes(course.code)
                          )
                          .slice(0, 6) // Show first 6 remaining courses
                          .map(course => (
                            <div key={course.code} className="text-sm p-2 bg-muted rounded">
                              <div className="font-medium">{course.code}</div>
                              <div className="text-xs text-muted-foreground">{course.name}</div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => {
              // Store concentration analysis data for progress page
              localStorage.setItem('concentrationAnalysis', JSON.stringify(concentrationAnalysis));
              setShowConcentrationModal(false);
              router.push('/management/progress');
            }}>
              View Detailed Progress
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}