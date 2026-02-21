'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useState, createContext, useContext, useRef, useEffect } from 'react';
import { useToastHelpers } from '@/hooks/useToast';
import { getPublicCurricula, getPublicFaculties, getPublicDepartments, API_BASE } from '@/lib/api/laravel';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { BarChart2, Calendar, ChevronDown, ArrowLeft } from 'lucide-react';
import { FaTrash } from 'react-icons/fa';
import StudentTranscriptImport from '@/components/role-specific/student/StudentTranscriptImport';
import UnmatchedCoursesSection, { UnmatchedCourse } from '@/components/role-specific/student/UnmatchedCoursesSection';
import FreeElectiveManager, { FreeElectiveCourse } from '@/components/role-specific/student/FreeElectiveManager';
import { type CourseData, type FileMetadata } from '@/components/features/excel/ExcelUtils';
import ExportDataMenu from '../../../../components/role-specific/student/dataentry/ExportDataMenu';
import CourseStatusDropdown from '../../../../components/role-specific/student/dataentry/CourseStatusDropdown';
import { CourseStatus, getDefaultSemesterLabel, isPendingStatus } from '../../../../components/role-specific/student/dataentry/types';

interface ProgressContextType {
  completedCourses: { [code: string]: CourseStatus };
  setCompletedCourses: React.Dispatch<React.SetStateAction<{ [code: string]: CourseStatus }>>;
  selectedDepartment: string;
  setSelectedDepartment: React.Dispatch<React.SetStateAction<string>>;
  selectedCurriculum: string;
  setSelectedCurriculum: React.Dispatch<React.SetStateAction<string>>;
  selectedConcentration: string;
  setSelectedConcentration: React.Dispatch<React.SetStateAction<string>>;
  freeElectives: { code: string; title: string; credits: number }[];
  setFreeElectives: React.Dispatch<React.SetStateAction<{ code: string; title: string; credits: number }[]>>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function useProgressContext() {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgressContext must be used within ProgressProvider');
  return ctx;
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedCurriculum, setSelectedCurriculum] = useState('');
  const [selectedConcentration, setSelectedConcentration] = useState('');
  // Use CourseStatus for completedCourses state
  const [completedCourses, setCompletedCourses] = useState<{ [code: string]: CourseStatus }>({});
  const [freeElectives, setFreeElectives] = useState<{ code: string; title: string; credits: number }[]>([]);
  const [initialized, setInitialized] = useState(false);

  // Load saved data from localStorage on mount
  useEffect(() => {
    if (initialized) return;
    
    try {
      const savedData = localStorage.getItem('studentAuditData');
      if (savedData) {
        const data = JSON.parse(savedData);
        console.log('Loading saved data from workflow:', data);
        
        if (data.selectedDepartment) setSelectedDepartment(data.selectedDepartment);
        if (data.selectedCurriculum) setSelectedCurriculum(data.selectedCurriculum);
        if (data.selectedConcentration) setSelectedConcentration(data.selectedConcentration);
        if (data.completedCourses) setCompletedCourses(data.completedCourses);
        if (data.freeElectives) setFreeElectives(data.freeElectives);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      setInitialized(true);
    }
  }, [initialized]);

  return (
    <ProgressContext.Provider value={{
      completedCourses, setCompletedCourses,
      selectedDepartment, setSelectedDepartment,
      selectedCurriculum, setSelectedCurriculum,
      selectedConcentration, setSelectedConcentration,
      freeElectives, setFreeElectives,
    }}>
      {children}
    </ProgressContext.Provider>
  );
}

// Grade options for student data entry
const gradeOptions: string[] = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F','W','TR','I','S','U'];

export default function DataEntryPage() {
  const router = useRouter();
  const { error: showError, warning } = useToastHelpers();
  // Use context for shared state
  const {
    completedCourses, setCompletedCourses,
    selectedDepartment, setSelectedDepartment,
    selectedCurriculum, setSelectedCurriculum,
    selectedConcentration, setSelectedConcentration,
    freeElectives, // <-- add this line
  } = useProgressContext();

  // Local state for faculty (loaded from localStorage)
  const [selectedFaculty, setSelectedFaculty] = useState('');

  // State to track if data came from workflow and whether to show selectors
  const [fromWorkflow, setFromWorkflow] = useState(false);
  const [showSelectors, setShowSelectors] = useState(true);
  const [departmentName, setDepartmentName] = useState('');
  const [curriculumName, setCurriculumName] = useState('');
  const [concentrationName, setConcentrationName] = useState('');

  // Auto-populate semester labels for planning courses that do not have one yet
  useEffect(() => {
    const needsDefaults = Object.entries(completedCourses).some(([, course]) =>
      course?.status === 'planning' && !course.plannedSemester
    );

    if (!needsDefaults) {
      return;
    }

    setCompletedCourses(prev => {
      const next = { ...prev };
      Object.entries(prev).forEach(([code, course]) => {
        if (course?.status === 'planning' && !course.plannedSemester) {
          next[code] = {
            ...course,
            plannedSemester: getDefaultSemesterLabel()
          };
        }
      });
      return next;
    });
  }, [completedCourses, setCompletedCourses]);

  const getCourseSelectValue = (courseCode: string) => {
    const courseState = completedCourses[courseCode];
    if (!courseState) return 'Pending';
    if (courseState.status === 'planning') return 'Planning';
    if (courseState.status === 'in_progress') return 'Currently Taking';
    if (isPendingStatus(courseState.status)) return 'Pending';
    return courseState.grade || 'Pending';
  };

  const handleCourseStatusChange = (courseCode: string, value: string) => {
    const newStatus: CourseStatus['status'] =
      value === 'Planning'
        ? 'planning'
        : value === 'Currently Taking'
          ? 'in_progress'
          : value === 'Pending'
            ? 'pending'
            : (value === 'F' || value === 'W')
              ? 'failed'
              : 'completed';

    setCompletedCourses(prev => ({
      ...prev,
      [courseCode]: {
        status: newStatus,
        grade: value === 'Planning' || value === 'Pending' || value === 'Currently Taking' ? '' : value,
        plannedSemester: newStatus === 'planning'
          ? (prev[courseCode]?.plannedSemester || getDefaultSemesterLabel())
          : undefined
      }
    }));
  };

  const handleSemesterChange = (courseCode: string, semester: string) => {
    setCompletedCourses(prev => ({
      ...prev,
      [courseCode]: {
        ...prev[courseCode],
        plannedSemester: semester,
      }
    }));
  };

  // State to track collapsed/expanded sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Helper function to toggle section collapse
  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };

  // State for dynamic options from API
  const [curricula, setCurricula] = useState<Array<{ 
    id: string; 
    name: string; 
    department?: { id: string } | null; 
    faculty: any;
    curriculumCourses?: any[];
    totalCreditsRequired?: number;
    totalCredits?: number;
  }>>([]);
  const [concentrations, setConcentrations] = useState<Array<{
    id: string;
    name: string;
    curriculumId: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic faculty and department options from API
  const [facultyOptions, setFacultyOptions] = useState<{ value: string; label: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<{ value: string; label: string }[]>([]);
  // selectedFaculty is already defined above

  // New state for enhanced transcript import
  const [unmatchedCourses, setUnmatchedCourses] = useState<UnmatchedCourse[]>([]);
  const [curriculumFreeElectives, setCurriculumFreeElectives] = useState<FreeElectiveCourse[]>([]);
  const [assignedFreeElectives, setAssignedFreeElectives] = useState<FreeElectiveCourse[]>([]);
  const [electiveRules, setElectiveRules] = useState<any[]>([]);
  const [assignedFreeElectiveCodes, setAssignedFreeElectiveCodes] = useState<Set<string>>(new Set());
  // Holds a concentration name received from an imported file until concentrations finish loading
  const [pendingConcentrationName, setPendingConcentrationName] = useState<string | null>(null);

  // Check if user has any completed courses
  const hasCompletedCourses = Object.values(completedCourses).some(
    course => course.status === 'completed' || course.grade
  );

  // Fetch curricula and faculties on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all curricula (public endpoint)
        const currData = await getPublicCurricula();
        const fetchedCurricula = currData.curricula || [];
        setCurricula(fetchedCurricula);

        // Fetch faculties (public endpoint)
        const facultyData = await getPublicFaculties();
        const fetchedFaculties = facultyData.faculties || [];
        setFacultyOptions(fetchedFaculties.map((f: any) => ({ 
          value: f.id, 
          label: f.name 
        })));
        
        // Load pre-selected data from localStorage (from workflow)
        try {
          const savedData = localStorage.getItem('studentAuditData');
          if (savedData) {
            const data = JSON.parse(savedData);
            if (data.selectedFaculty) {
              console.log('Pre-selecting faculty from workflow:', data.selectedFaculty);
              setSelectedFaculty(data.selectedFaculty);
            }
            
            // Check if data came from workflow with all required fields set
            if (data.fromWorkflow && data.selectedDepartment && data.selectedCurriculum) {
              setFromWorkflow(true);
              setShowSelectors(false); // Hide selectors initially
              
              // Look up display names for the summary
              const deptResponse = await getPublicDepartments();
              const dept = (deptResponse.departments || []).find((d: any) => d.id === data.selectedDepartment);
              if (dept) {
                setDepartmentName(dept.name);
              }
              
              const curr = fetchedCurricula.find((c: any) => c.id === data.selectedCurriculum);
              if (curr) {
                setCurriculumName(curr.name);
              }
              
              if (data.selectedConcentration && data.selectedConcentration !== 'general') {
                // Concentration name will be looked up in concentrations useEffect
                setConcentrationName(data.selectedConcentration);
              } else {
                setConcentrationName('General');
              }
            }
          }
        } catch (error) {
          console.error('Error loading data from localStorage:', error);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        showError('Failed to load initial data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Fetch departments when faculty changes
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!selectedFaculty) {
        setDepartmentOptions([]);
        return;
      }
      try {
        const deptData = await getPublicDepartments();
        const fetchedDepartments = deptData.departments || [];
        const filtered = fetchedDepartments
          .filter((dept: any) => dept.faculty_id === selectedFaculty)
          .map((dept: any) => ({ value: dept.id, label: dept.name }));
        setDepartmentOptions(filtered);
      } catch (error) {
        console.error('Error fetching departments:', error);
        showError('Failed to load departments. Please try again.');
        setDepartmentOptions([]);
      }
    };
    fetchDepartments();
  }, [selectedFaculty]);

  // Fetch concentrations when curriculum and department are selected
  useEffect(() => {
    const fetchConcentrations = async () => {
      if (!selectedCurriculum || !selectedDepartment) {
        setConcentrations([]);
        return;
      }

      try {
        // Find the department ID
        const selectedCurriculumData = curricula.find(c => c.id === selectedCurriculum);
        if (!selectedCurriculumData?.department?.id) {
          console.warn('Department ID not found for selected curriculum - please reselect department');
          // Clear concentrations and let user reselect department
          setConcentrations([]);
          return;
        }

        const departmentId = selectedCurriculumData.department.id;
        
        console.log('🔍 DEBUG: Fetching concentrations for:', {
          curriculumId: selectedCurriculum,
          departmentId: departmentId
        });

        const concResponse = await fetch(`${API_BASE}/public-concentrations?curriculum_id=${selectedCurriculum}&department_id=${departmentId}`, {
          credentials: 'include'
        });
        const concData = await concResponse.json();
        
        console.log('🔍 DEBUG: Concentration API response:', concData);
        
        const fetchedConcentrations = concData.concentrations || [];
        console.log('🔍 DEBUG: Fetched concentrations:', fetchedConcentrations);
        setConcentrations(fetchedConcentrations);
          
        // Auto-select "general" concentration if not already selected
        if (!selectedConcentration) {
          console.log('🔍 DEBUG: Auto-selecting general concentration');
          setSelectedConcentration('general');
        }

      } catch (error) {
        console.error('Error fetching concentrations:', error);
        showError('Failed to load concentrations. Please try selecting the curriculum again.');
        setConcentrations([]);
      }
    };

    fetchConcentrations();
  }, [selectedCurriculum, selectedDepartment, curricula]);

  // Auto-select concentration once concentrations are loaded (triggered by file import metadata)
  useEffect(() => {
    if (!pendingConcentrationName || concentrations.length === 0) return;
    const match = concentrations.find(
      c => c.name.toLowerCase() === pendingConcentrationName.toLowerCase()
    );
    setSelectedConcentration(match ? match.id : 'general');
    setPendingConcentrationName(null);
  }, [concentrations, pendingConcentrationName]);

  // Save data to localStorage whenever context changes
  useEffect(() => {
    try {
      // Get the actual department ID from curriculum data
      const selectedCurriculumData = curricula.find(c => c.id === selectedCurriculum);
      const actualDeptId = selectedCurriculumData?.department?.id || selectedDepartment;
      
      const dataToSave = {
        completedCourses,
        selectedDepartment,
        selectedCurriculum,
        selectedConcentration,
        selectedFaculty, // Include faculty for consistency
        freeElectives,
        actualDepartmentId: actualDeptId, // Add the real department ID
        fromWorkflow, // Preserve the workflow flag
        electiveRules, // Add elective rules for Free Elective credit requirements
        curriculumCreditsRequired: selectedCurriculumData?.totalCreditsRequired ?? selectedCurriculumData?.totalCredits ?? null,
        // Human-readable names for export headers and progress page
        facultyName: facultyOptions.find((o: { value: string; label: string }) => o.value === selectedFaculty)?.label || '',
        departmentName: departmentOptions.find((o: { value: string; label: string }) => o.value === selectedDepartment)?.label || '',
        curriculumName: curriculumOptions.find((o: { value: string; label: string }) => o.value === selectedCurriculum)?.label || '',
        concentrationName: concentrationOptions[selectedCurriculum]?.find((o: { value: string; label: string }) => o.value === selectedConcentration)?.label || '',
      };
      localStorage.setItem('studentAuditData', JSON.stringify(dataToSave));
      
      console.log('🔍 DEBUG: Saving to localStorage with actualDepartmentId:', actualDeptId);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [completedCourses, selectedDepartment, selectedCurriculum, selectedConcentration, selectedFaculty, freeElectives, curricula, fromWorkflow]);

  // Computed curriculum options based on selected department ID
  const curriculumOptions = selectedDepartment
    ? curricula
        .filter(curr => {
          const match = curr.department?.id === selectedDepartment;
          if (typeof window !== 'undefined') {
            console.log('🔍 DEBUG: Curriculum filtering:', {
              curriculumName: curr.name,
              curriculumDeptId: curr.department?.id,
              selectedDeptId: selectedDepartment,
              match: match
            });
          }
          return match;
        })
        .map(curr => ({ value: curr.id, label: curr.name }))
    : [];

  // Dynamic concentration options based on fetched data
  const concentrationOptions: { [key: string]: { value: string; label: string }[] } = {};
  
  if (selectedCurriculum) {
    // Always include 'general' as default
    const curriculumConcentrations = [{ value: 'general', label: 'General' }];
    
    // Add fetched concentrations for the selected curriculum
    const curriculumSpecificConcentrations = concentrations.map(conc => ({ 
      value: conc.id, 
      label: conc.name 
    }));
    
    console.log(`🔍 DEBUG: Curriculum ${selectedCurriculum} concentrations:`, {
      allConcentrations: concentrations,
      mappedConcentrations: curriculumSpecificConcentrations,
      finalOptions: [...curriculumConcentrations, ...curriculumSpecificConcentrations]
    });
    
    concentrationOptions[selectedCurriculum] = [
      ...curriculumConcentrations,
      ...curriculumSpecificConcentrations
    ];
  }


  // Reset lower selections when a higher one changes
  const handleDepartmentChange = (value: string) => {
    setSelectedDepartment(value);
    setSelectedCurriculum('');
    setSelectedConcentration('');
  };
  const handleCurriculumChange = (value: string) => {
    setSelectedCurriculum(value);
    // Set default concentration to 'general' when curriculum changes
    setSelectedConcentration('general');
  };

  const mapTranscriptStatusToCourseStatus = (status?: string, grade?: string): CourseStatus['status'] => {
    const normalized = status?.toString().trim().toLowerCase();

    switch (normalized) {
      case 'completed':
        return 'completed';
      case 'planning':
      case 'planned':
        return 'planning';
      case 'in_progress':
      case 'in-progress':
      case 'in progress':
      case 'taking':
      case 'currently taking':
        return 'in_progress';
      case 'failed':
        return 'failed';
      case 'withdrawn':
      case 'dropped':
        return 'withdrawn';
      case 'not_completed':
      case 'not-completed':
        return 'not_completed';
      case 'pending':
        return 'pending';
      default:
        return grade && grade.trim() ? 'completed' : 'pending';
    }
  };

  // Handle imported courses from transcript
  const handleCoursesImported = (courses: CourseData[]) => {
    const newCompletedCourses: { [code: string]: CourseStatus } = {};
    
    courses.forEach(course => {
      const status = mapTranscriptStatusToCourseStatus(course.status, course.grade);

      newCompletedCourses[course.courseCode] = {
        status,
        grade: course.grade,
        plannedSemester: status === 'planning'
          ? (course.semester || getDefaultSemesterLabel())
          : undefined
      };
    });

    setCompletedCourses(prev => ({ ...prev, ...newCompletedCourses }));
  };

  // Handle categorized courses from enhanced transcript import
  const handleCategorizedCoursesImported = (data: any) => {
    console.log('Received import data:', data);
    
    const { categorizedCourses, unmatchedCourses, freeElectives, electiveRules } = data;
    
    // Update state for unmatched courses and free electives
    setUnmatchedCourses(unmatchedCourses || []);
    setCurriculumFreeElectives(freeElectives || []);
    setElectiveRules(electiveRules || []);
    
    const newCompletedCourses: { [code: string]: CourseStatus } = {};
    
    // Process each category
    Object.entries(categorizedCourses || {}).forEach(([categoryName, courses]: [string, any]) => {
      console.log(`Processing category: ${categoryName}`);
      if (Array.isArray(courses)) {
        courses.forEach((course: any) => {
          console.log('Processing course:', {
            code: course.code,
            title: course.title,
            found: course.found,
            status: course.status,
            grade: course.grade
          });
          
          if (course.found) { // Only import courses that were found in transcript
            console.log('Adding course to completed:', course.code, course.status, course.grade);
            const normalizedStatus = mapTranscriptStatusToCourseStatus(course.status, course.grade);
            const trimmedPlannedSemester = typeof course.plannedSemester === 'string'
              ? course.plannedSemester.trim()
              : undefined;

            newCompletedCourses[course.code] = {
              status: normalizedStatus,
              grade: course.grade,
              plannedSemester: normalizedStatus === 'planning'
                ? (trimmedPlannedSemester || getDefaultSemesterLabel())
                : undefined
            };
          }
        });
      } else {
        console.warn(`Category ${categoryName} is not an array:`, courses);
      }
    });

    console.log('New completed courses object:', newCompletedCourses);
    setCompletedCourses(prev => {
      const updated = { ...prev, ...newCompletedCourses };
      console.log('Updated completed courses state:', updated);
      console.log('All course codes in state:', Object.keys(updated));
      return updated;
    });
  };

  const handleBackToManagement = () => {
    router.push('/student/management');
  };

  // Dynamic curriculum courses state
  const [curriculumCourses, setCurriculumCourses] = useState<Record<string, { [category: string]: { code: string; title: string; credits: number }[] }>>({});

  // Get dynamic course type order based on available categories
  const getCourseTypeOrder = () => {
    if (!selectedCurriculum || !curriculumCourses[selectedCurriculum]) {
      return []; // Return empty if no curriculum selected or no courses loaded
    }
    
    const availableCategories = Object.keys(curriculumCourses[selectedCurriculum]);
    console.log('Available categories:', availableCategories);
    
    // Define preferred order, but include all available categories
    const preferredOrder = [
      'General Education',
      'Core Courses', 
      'Major',
      'Major Elective',
      'Free Elective',
      'Uncategorized'
    ];
    
    // Start with preferred order categories that exist
    const orderedCategories = preferredOrder.filter(cat => availableCategories.includes(cat));
    
    // Add any additional categories not in preferred order
    const additionalCategories = availableCategories.filter(cat => !preferredOrder.includes(cat));
    
    return [...orderedCategories, ...additionalCategories];
  };

  const courseTypeOrder = getCourseTypeOrder();


  // Debug logging for curriculumCourses changes
  useEffect(() => {
    console.log('curriculumCourses state updated:', curriculumCourses);
    console.log('selectedCurriculum:', selectedCurriculum);
    console.log('courses for selected curriculum:', curriculumCourses[selectedCurriculum]);
  }, [curriculumCourses, selectedCurriculum]);

  // Fetch real curriculum data when curriculum is selected
  useEffect(() => {
    const fetchCourses = async () => {
      console.log('🔍 DEBUG: fetchCourses called with:', {
        selectedCurriculum,
        curriculaLength: curricula.length,
        hasSelectedCurriculum: !!selectedCurriculum,
        hasCurricula: curricula.length > 0
      });
      
      if (selectedCurriculum && curricula.length > 0) {
        try {
          // Find the selected curriculum from our curricula data
          const selectedCurriculumData = curricula.find(c => c.id === selectedCurriculum);
          console.log('🔍 DEBUG: Selected curriculum data:', selectedCurriculumData);
          const departmentId = selectedCurriculumData?.department?.id || selectedDepartment;
          
          if (selectedCurriculumData && selectedCurriculumData.curriculumCourses) {
            console.log('🔍 DEBUG: Found curriculum courses, processing...');
            // Group courses by category
            const grouped: { [category: string]: { code: string; title: string; credits: number }[] } = {};
            
            selectedCurriculumData.curriculumCourses.forEach((currCourse: any) => {
              const course = currCourse.course;
              
              console.log('Course debug:', {
                code: course.code,
                name: course.name,
                apiCategory: course.category,
                credits: course.credits,
                creditHours: course.creditHours,
                departmentId,
              });
              
              const category = course.category || 'Uncategorized';
              const credits = typeof course.credits === 'number'
                ? course.credits
                : (typeof course.creditHours === 'number' ? course.creditHours : 0);
              
              if (!grouped[category]) {
                grouped[category] = [];
              }
              
              grouped[category].push({
                code: course.code,
                title: course.name,
                credits,
              });
            });
            
            console.log('Grouped curriculum courses:', grouped);
            setCurriculumCourses({ [selectedCurriculum]: grouped });
          } else {
            console.log('No curriculumCourses found in selected curriculum data');
          }
        } catch (error) {
          console.error('Error processing curriculum data:', error);
        }
      }
    };

    fetchCourses();
  }, [selectedCurriculum, curricula]);

  // Only keep mockConcentrations for bscs2022
  const mockConcentrations: { [curriculum: string]: { [concentration: string]: { label: string; Major: { code: string; title: string; credits: number }[] } } } = {
    bscs2022: {
      se: {
        label: 'Software Engineering',
        Major: [
          { code: 'CS520', title: 'Software Architecture', credits: 3 },
          { code: 'CS521', title: 'DevOps Practices', credits: 3 },
        ],
      },
      ds: {
        label: 'Data Science',
        Major: [
          { code: 'CS530', title: 'Big Data Analytics', credits: 3 },
          { code: 'CS531', title: 'Data Mining', credits: 3 },
        ],
      },
      none: {
        label: 'No Concentration',
        Major: [],
      },
    },
    bba2022: {
      dbm: {
        label: 'Digital Business Management',
        Major: [],
      },
    },
  };

  const handleCoursePlanning = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('coursePlan');
      localStorage.removeItem('planningData');
    }
    // Data is automatically stored in localStorage via useEffect
    // Navigate to course planning page
    router.push('/student/management/course-planning');
  };

  const handleSkipToPlanning = () => {
    // Navigate to course planning regardless — new students can plan without entering past data
    router.push('/student/management/course-planning');
  };

  /** Auto-fills dropdowns from metadata embedded in an imported transcript file */
  const handleMetadataExtracted = (meta: FileMetadata) => {
    // Only act when the file actually carries planning metadata
    const hasMeta = meta.faculty || meta.department || meta.curriculum || meta.curriculumId || meta.concentration;
    if (!hasMeta) return;

    // ALWAYS clear all selectors first so no stale manual selections can linger
    // alongside freshly imported values — this prevents confusing mismatches.
    setSelectedFaculty('');
    setSelectedDepartment('');
    setSelectedCurriculum('');
    setSelectedConcentration('');
    setPendingConcentrationName(null);

    if (!meta.curriculum && !meta.curriculumId) return;

    // Find the matching curriculum — prefer exact UUID match (new format), fall back to name match (old format)
    const matchedCurriculum =
      meta.curriculumId
        ? curricula.find(c => c.id === meta.curriculumId)
        : curricula.find(c => c.name.toLowerCase() === meta.curriculum!.toLowerCase());

    if (!matchedCurriculum) {
      const label = meta.curriculumId ?? meta.curriculum;
      console.log('[AutoFill] No curriculum match found for:', label);
      warning(`Could not auto-fill: curriculum "${label}" was not found in the system. Please select your values manually.`);
      return;
    }

    // Auto-select faculty (by name)
    if (meta.faculty) {
      const facOption = facultyOptions.find(
        o => o.label.toLowerCase() === meta.faculty!.toLowerCase()
      );
      if (facOption) setSelectedFaculty(facOption.value);
    }

    // Auto-select department (from curriculum's linked department)
    if (matchedCurriculum.department?.id) {
      setSelectedDepartment(matchedCurriculum.department.id);
    }

    // Auto-select curriculum
    setSelectedCurriculum(matchedCurriculum.id);

    // Queue concentration – will be matched once concentrations finish loading
    if (meta.concentration && meta.concentration.toLowerCase() !== 'general') {
      setPendingConcentrationName(meta.concentration);
    } else {
      setSelectedConcentration('general');
    }

    console.log('[AutoFill] Applied metadata:', meta);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <Button variant="outline" onClick={handleBackToManagement} className="mb-4">
          <ArrowLeft size={16} />
          Back to Management
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">Course Data Entry</h1>
      </div>

      {/* Step 1: Select Faculty, Department, Curriculum, and Concentration */}
      {/* Show summary card when coming from workflow with pre-filled data */}
      {fromWorkflow && !showSelectors ? (
        <div className="mb-8 p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-2">Your Academic Info (from workflow)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <span className="ml-2 font-medium">{departmentName || 'Loading...'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Curriculum:</span>
                  <span className="ml-2 font-medium">{curriculumName || 'Loading...'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Concentration:</span>
                  <span className="ml-2 font-medium">{concentrationName || 'General'}</span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowSelectors(true)}
              className="ml-4"
            >
              Edit
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {fromWorkflow && showSelectors && (
            <div className="col-span-full mb-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowSelectors(false)}
                className="text-muted-foreground"
              >
                ← Hide selectors
              </Button>
            </div>
          )}
          {/* UX hint — let users know the upload section below can fill these automatically */}
          <div className="col-span-full flex items-start gap-2 px-3 py-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
            <span className="mt-0.5">💡</span>
            <span>
              <strong>Have a file exported from this system?</strong> Use the &quot;Import Transcript&quot; section below — your faculty, department, curriculum, and concentration will be filled in automatically.
            </span>
          </div>
          <div>
            <label className="block font-bold mb-2 text-gray-900 dark:text-foreground">Select Faculty</label>
            <Select value={selectedFaculty} onValueChange={value => {
              setSelectedFaculty(value);
              setSelectedDepartment('');
              setSelectedCurriculum('');
              setSelectedConcentration('');
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose faculty" />
              </SelectTrigger>
              <SelectContent>
                {facultyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block font-bold mb-2 text-gray-900 dark:text-foreground">Select Department</label>
            <Select value={selectedDepartment} onValueChange={handleDepartmentChange} disabled={!selectedFaculty}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block mb-2 font-bold text-gray-900 dark:text-foreground">Select Curriculum</label>
            <Select value={selectedCurriculum} onValueChange={handleCurriculumChange} disabled={!selectedDepartment}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!selectedDepartment ? 'Select department first' : 'Choose curriculum'} />
              </SelectTrigger>
              <SelectContent>
                {curriculumOptions.map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block mb-2 font-bold text-gray-900 dark:text-foreground">Select Concentration</label>
            <Select value={selectedConcentration} onValueChange={setSelectedConcentration} disabled={!selectedCurriculum}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!selectedCurriculum ? 'Select curriculum first' : 'Choose concentration'} />
              </SelectTrigger>
              <SelectContent>
                {(concentrationOptions[selectedCurriculum] || []).map((opt: { value: string; label: string }) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Transcript Import Section – always visible so users can upload before selecting values */}
      <StudentTranscriptImport 
        curriculumId={selectedCurriculum}
        departmentId={selectedDepartment}
        onCoursesImported={handleCategorizedCoursesImported}
        onMetadataExtracted={handleMetadataExtracted}
        onError={(error) => {
          console.error('Import error:', error);
          showError('Failed to import transcript data. Please check the file format and try again.');
        }}
      />

      {unmatchedCourses.length > 0 && (
        <UnmatchedCoursesSection
          unmatchedCourses={unmatchedCourses}
          assignedFreeElectives={assignedFreeElectiveCodes}
          onAssignToFreeElective={(courseCode: string) => {
            // Find the course details
            const course = unmatchedCourses.find(c => c.courseCode === courseCode);
            if (course) {
              // Convert to FreeElectiveCourse format
              const freeElectiveCourse: FreeElectiveCourse = {
                courseCode: course.courseCode,
                courseName: course.courseName,
                credits: course.credits,
                grade: course.grade,
                source: 'transcript',
                isRequired: false
              };
              setAssignedFreeElectives(prev => [...prev, freeElectiveCourse]);
              // Update assigned codes set
              const newCodes = new Set(assignedFreeElectiveCodes);
              newCodes.add(courseCode);
              setAssignedFreeElectiveCodes(newCodes);
              // Remove from unmatched
              setUnmatchedCourses(prev => 
                prev.filter(course => course.courseCode !== courseCode)
              );
            }
          }}
          onRemoveFromFreeElective={(courseCode: string) => {
            // Remove from assigned free electives
            setAssignedFreeElectives(prev => 
              prev.filter(course => course.courseCode !== courseCode)
            );
            // Update assigned codes set
            const newCodes = new Set(assignedFreeElectiveCodes);
            newCodes.delete(courseCode);
            setAssignedFreeElectiveCodes(newCodes);
          }}
        />
      )}

      {/* Free Elective Manager Section
      {(curriculumFreeElectives.length > 0 || assignedFreeElectives.length > 0) && (
        <FreeElectiveManager
          curriculumId={selectedCurriculum}
          departmentId={selectedDepartment}
          curriculumFreeElectives={curriculumFreeElectives}
          assignedFreeElectives={assignedFreeElectives}
          electiveRules={electiveRules}
          onRemoveAssignedCourse={(courseCode: string) => {
            setAssignedFreeElectives(prev => 
              prev.filter(course => course.courseCode !== courseCode)
            );
            // Update assigned codes set
            const newCodes = new Set(assignedFreeElectiveCodes);
            newCodes.delete(courseCode);
            setAssignedFreeElectiveCodes(newCodes);
            // Add back to unmatched if it was originally unmatched
            // (This is a simplified approach - in practice you might want to track original source)
          }}
        />
      )} */}

      {/* Only show curriculum course list if all three are selected (concentration can be 'none') */}
      {(() => {
        const shouldShow = selectedDepartment && selectedCurriculum && selectedConcentration;
        console.log('🔍 DEBUG: Course display condition:', {
          selectedDepartment,
          selectedCurriculum,
          selectedConcentration,
          shouldShow,
          curriculumCoursesAvailable: !!curriculumCourses[selectedCurriculum]
        });
        return shouldShow;
      })() && (
        <div className="flex flex-col gap-8">
          {/* Render all categories in the new order, with special logic for Major (concentration) if needed */}
          {courseTypeOrder.map(category => {
            if (category === 'Major' && selectedCurriculum === 'bscs2022') {
              const isCollapsed = collapsedSections.has(category);
              return (
                <div key={category} className="border border-border rounded-lg mb-6 p-6">
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full flex items-center justify-between text-lg font-bold mb-2 text-foreground p-4 pb-0 hover:text-primary transition-colors"
                  >
                    <span>Major</span>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} 
                    />
                  </button>
                  {!isCollapsed && (
                    <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                    {(!selectedConcentration || selectedConcentration === 'none') ? (
                      (() => {
                        const realConcentrations = Object.entries(mockConcentrations[selectedCurriculum] || {}).filter(([concKey]) => concKey !== 'none');
                        if (realConcentrations.length === 0) {
                          return <div className="text-muted-foreground text-center py-4">No concentrations available.</div>;
                        }
                        return realConcentrations.map(([concKey, concData]) => (
                          <div key={concKey} className="mb-6">
                            <div className="font-semibold text-base mb-2">{concData.label}</div>
                            {concData.Major.length === 0 ? (
                              <div className="text-muted-foreground text-center py-2">No major courses for this concentration.</div>
                            ) : (
                              concData.Major.map(course => (
                                <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                    <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                                    <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                                  </div>
                                  <CourseStatusDropdown
                                    value={getCourseSelectValue(course.code)}
                                    onValueChange={(value: string) => handleCourseStatusChange(course.code, value)}
                                    gradeOptions={gradeOptions}
                                    isPlanning={completedCourses[course.code]?.status === 'planning'}
                                    plannedSemester={completedCourses[course.code]?.plannedSemester || ''}
                                    onSemesterChange={(semester: string) => handleSemesterChange(course.code, semester)}
                                  />
                                </div>
                              ))
                            )}
                          </div>
                        ));
                      })()
                    ) : (
                      (mockConcentrations[selectedCurriculum]?.[selectedConcentration]?.Major.length === 0 ? (
                        <div className="text-muted-foreground text-center py-4">No major courses for this concentration.</div>
                      ) : (
                        mockConcentrations[selectedCurriculum][selectedConcentration].Major.map(course => (
                          <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                              <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                              <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                            </div>
                            <CourseStatusDropdown
                              value={getCourseSelectValue(course.code)}
                              onValueChange={(value: string) => handleCourseStatusChange(course.code, value)}
                              gradeOptions={gradeOptions}
                              isPlanning={completedCourses[course.code]?.status === 'planning'}
                              plannedSemester={completedCourses[course.code]?.plannedSemester || ''}
                              onSemesterChange={(semester: string) => handleSemesterChange(course.code, semester)}
                            />
                          </div>
                        ))
                      ))
                    )}
                  </div>
                  )}
                </div>
              );
            }
            if (category === 'Major Elective') {
              const isCollapsed = collapsedSections.has(category);
              return (
                <div key={category} className="border border-border rounded-lg mb-6 p-6">
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full flex items-center justify-between text-lg font-bold mb-2 text-foreground p-4 pb-0 hover:text-primary transition-colors"
                  >
                    <span>Major Elective</span>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} 
                    />
                  </button>
                  {!isCollapsed && (
                    <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                    {(curriculumCourses[selectedCurriculum]?.['Major Elective'] || []).length === 0 ? (
                      <div className="text-muted-foreground text-center py-4">No courses in this category.</div>
                    ) : (
                      (curriculumCourses[selectedCurriculum]?.['Major Elective'] || []).map(course => (
                        <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                            <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                            <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                          </div>
                          <CourseStatusDropdown
                            value={getCourseSelectValue(course.code)}
                            onValueChange={(value: string) => handleCourseStatusChange(course.code, value)}
                            gradeOptions={gradeOptions}
                            isPlanning={completedCourses[course.code]?.status === 'planning'}
                            plannedSemester={completedCourses[course.code]?.plannedSemester || ''}
                            onSemesterChange={(semester: string) => handleSemesterChange(course.code, semester)}
                          />
                        </div>
                      ))
                    )}
                  </div>
                  )}
                </div>
              );
            }
            if (category === 'Free Elective') {
              const isCollapsed = collapsedSections.has(category);
              return (
                <div key={category} className="border border-border rounded-lg mb-6 p-6">
                  <button
                    onClick={() => toggleSection(category)}
                    className="w-full flex items-center justify-between text-lg font-bold text-foreground p-4 pb-0 hover:text-primary transition-colors"
                  >
                    <span>Free Elective</span>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} 
                    />
                  </button>
                  {!isCollapsed && (
                    <>
                      <div className="text-sm text-muted-foreground p-4 mb-2">
                        Students can take free elective courses of 12 credits from any faculty in Assumption University upon completion of the prerequisite. Check with academic advisor for the course availability.
                      </div>
                      <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                    <FreeElectiveAddButton
                      gradeOptions={gradeOptions}
                      completedCourses={completedCourses}
                      getCourseSelectValue={getCourseSelectValue}
                      handleCourseStatusChange={handleCourseStatusChange}
                      handleSemesterChange={handleSemesterChange}
                    />
                    {/* Render static free electives, if any */}
                    {(curriculumCourses[selectedCurriculum]?.['Free Elective'] || []).map(course => (
                      <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                          <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                        </div>
                        <CourseStatusDropdown
                          value={getCourseSelectValue(course.code)}
                          onValueChange={(value: string) => handleCourseStatusChange(course.code, value)}
                          gradeOptions={gradeOptions}
                          isPlanning={completedCourses[course.code]?.status === 'planning'}
                          plannedSemester={completedCourses[course.code]?.plannedSemester || ''}
                          onSemesterChange={(semester: string) => handleSemesterChange(course.code, semester)}
                        />
                      </div>
                    ))}
                      </div>
                    </>
                  )}
                </div>
              );
            }
            // General Education, Core Courses
            const isCollapsed = collapsedSections.has(category);
            return (
              <div key={category} className="border border-border rounded-lg mb-6 p-6">
                <button
                  onClick={() => toggleSection(category)}
                  className="w-full flex items-center justify-between text-lg font-bold mb-2 text-foreground p-4 pb-0 hover:text-primary transition-colors"
                >
                  <span>{category}</span>
                  <ChevronDown 
                    className={`w-5 h-5 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} 
                  />
                </button>
                {!isCollapsed && (
                  <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                  {(curriculumCourses[selectedCurriculum]?.[category] || []).length === 0 ? (
                    <div className="text-muted-foreground text-center py-4">No courses in this category.</div>
                  ) : (
                    curriculumCourses[selectedCurriculum][category].map(course => (
                      <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                          <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                        </div>
                        <CourseStatusDropdown
                          value={getCourseSelectValue(course.code)}
                          onValueChange={(value: string) => handleCourseStatusChange(course.code, value)}
                          gradeOptions={gradeOptions}
                          isPlanning={completedCourses[course.code]?.status === 'planning'}
                          plannedSemester={completedCourses[course.code]?.plannedSemester || ''}
                          onSemesterChange={(semester: string) => handleSemesterChange(course.code, semester)}
                        />
                      </div>
                    ))
                  )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Free Electives Section - Show assigned free electives */}
          {assignedFreeElectives.length > 0 && (
            <div className="border border-border rounded-lg mb-6 p-6">
              <button
                onClick={() => toggleSection('Assigned Free Electives')}
                className="w-full flex items-center justify-between text-lg font-bold mb-2 text-foreground p-4 pb-0 hover:text-primary transition-colors"
              >
                <div className="flex items-center justify-between w-full">
                  <span>Free Electives</span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm text-muted-foreground">
                      {(() => {
                        const assignedCredits = assignedFreeElectives.reduce((total, course) => total + course.credits, 0);
                        const freeElectiveRule = electiveRules.find(rule => rule.category === 'Free Elective');
                        const requiredCredits = freeElectiveRule?.requiredCredits || 0;
                        
                        if (requiredCredits > 0) {
                          const isComplete = assignedCredits >= requiredCredits;
                          return (
                            <span className={`font-semibold ${isComplete ? 'text-green-600' : assignedCredits > requiredCredits ? 'text-orange-600' : 'text-blue-600'}`}>
                              {assignedCredits} / {requiredCredits} credits 
                              {isComplete && assignedCredits === requiredCredits && ' ✓'}
                              {assignedCredits > requiredCredits && ` (+${assignedCredits - requiredCredits} extra)`}
                            </span>
                          );
                        } else {
                          return <span className="font-semibold text-blue-600">{assignedCredits} credits assigned</span>;
                        }
                      })()}
                    </div>
                    <ChevronDown 
                      className={`w-5 h-5 transition-transform duration-200 ${collapsedSections.has('Assigned Free Electives') ? '-rotate-90' : 'rotate-0'}`} 
                    />
                  </div>
                </div>
              </button>
              {!collapsedSections.has('Assigned Free Electives') && (
                <div className="bg-background rounded-lg p-4 flex flex-col gap-3">
                  {assignedFreeElectives.map(course => (
                    <div key={course.courseCode} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span className="font-semibold text-sm">{course.courseCode} - {course.courseName}</span>
                        <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                        {course.grade && (
                          <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                            Grade: {course.grade}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // Remove from assigned free electives
                            setAssignedFreeElectives(prev => 
                              prev.filter(c => c.courseCode !== course.courseCode)
                            );
                            // Update assigned codes set
                            const newCodes = new Set(assignedFreeElectiveCodes);
                            newCodes.delete(course.courseCode);
                            setAssignedFreeElectiveCodes(newCodes);
                            // Add back to unmatched courses
                            const unmatchedCourse: UnmatchedCourse = {
                              courseCode: course.courseCode,
                              courseName: course.courseName,
                              credits: course.credits,
                              grade: course.grade,
                              status: 'completed'
                            };
                            setUnmatchedCourses(prev => [...prev, unmatchedCourse]);
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove from Free Electives
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 mt-6 sm:flex-row sm:items-center sm:justify-between">
            {!loading && selectedCurriculum && (
              <ExportDataMenu
                selectedCurriculum={selectedCurriculum}
                courseTypeOrder={courseTypeOrder}
                curriculumCourses={curriculumCourses}
                completedCourses={completedCourses}
                assignedFreeElectives={assignedFreeElectives}
                freeElectives={Array.isArray(freeElectives) ? freeElectives : []}
                warning={warning}
                facultyName={facultyOptions.find(o => o.value === selectedFaculty)?.label || ''}
                departmentName={departmentOptions.find(o => o.value === selectedDepartment)?.label || ''}
                curriculumName={curriculumOptions.find(o => o.value === selectedCurriculum)?.label || ''}
                concentrationName={concentrationOptions[selectedCurriculum]?.find(o => o.value === selectedConcentration)?.label || ''}
              />
            )}
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-2">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  {hasCompletedCourses
                    ? 'ℹ️ Courses imported. Continue to planning when ready.'
                    : 'ℹ️ New here or no prior courses? You can skip straight to planning — no data entry needed.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleSkipToPlanning}
                  variant="outline"
                  className="flex items-center gap-2 px-6 py-3 text-lg"
                  size="lg"
                >
                  Skip to Planning
                </Button>
                <Button 
                  onClick={handleCoursePlanning}
                  className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground flex items-center gap-2 px-8 py-3 text-lg shadow-md transform transition-all duration-200 hover:scale-[1.01] border-0"
                  disabled={!selectedCurriculum || !selectedDepartment}
                  size="lg"
                >
                  <Calendar className="w-5 h-5" />
                  {hasCompletedCourses ? 'Continue to Course Planning' : 'Enter Data & Continue'}
                </Button>
              </div>
              {(!selectedCurriculum || !selectedDepartment) && (
                <p className="text-sm text-muted-foreground text-left sm:text-right">
                  Please select a faculty, department and curriculum first
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

interface FreeElectiveAddButtonProps {
  gradeOptions: string[];
  completedCourses: { [code: string]: CourseStatus };
  getCourseSelectValue: (courseCode: string) => string;
  handleCourseStatusChange: (courseCode: string, value: string) => void;
  handleSemesterChange: (courseCode: string, semester: string) => void;
}

// Add this component at the top level of the file (outside DataEntryPage)
function FreeElectiveAddButton({
  gradeOptions,
  completedCourses,
  getCourseSelectValue,
  handleCourseStatusChange,
  handleSemesterChange,
}: FreeElectiveAddButtonProps) {
  const { freeElectives, setFreeElectives } = useProgressContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', title: '', credits: '' });


  const handleAdd = () => {
    if (!form.code.trim() || !form.title.trim() || !form.credits) return;
    const newEntry = { code: form.code.trim(), title: form.title.trim(), credits: Number(form.credits) };
    setFreeElectives(prev => [...prev, newEntry]);
    setForm({ code: '', title: '', credits: '' });
  };



  const handleRemove = (idx: number) => {
    setFreeElectives(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="mb-3">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-1 bg-primary text-primary-foreground rounded shadow text-sm font-medium focus:outline-none hover:bg-primary/90 transition-colors"
        onClick={() => setShowForm((v) => !v)}
      >
        <span className="text-lg leading-none">+</span> Add Free Elective
      </button>
      {showForm && (
        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-end md:gap-4">
          <input
            type="text"
            placeholder="Course Code"
            className="w-full md:w-32 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.code}
            onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Course Name"
            className="w-full md:w-64 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Credits"
            className="w-full md:w-24 border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground text-sm"
            value={form.credits}
            min={0}
            max={3}
            onChange={e => {
              let value = e.target.value;
              if (Number(value) > 3) value = '3';
              setForm(f => ({ ...f, credits: value }));
            }}
          />
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded shadow text-sm font-medium focus:outline-none hover:bg-primary/90 transition-colors"
            onClick={handleAdd}
          >
            Add
          </button>
        </div>
      )}
      {/* List of added free electives */}
      {freeElectives.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {freeElectives.map((course, idx) => (
            <div key={course.code + idx} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                <span className="text-sm text-muted-foreground">{course.credits} credits</span>
              </div>

              <div className="flex flex-row items-center gap-3 mt-2 sm:mt-0">
                <CourseStatusDropdown
                  value={getCourseSelectValue(course.code)}
                  onValueChange={(value: string) => handleCourseStatusChange(course.code, value)}
                  gradeOptions={gradeOptions}
                  isPlanning={completedCourses[course.code]?.status === 'planning'}
                  plannedSemester={completedCourses[course.code]?.plannedSemester || ''}
                  onSemesterChange={(semester: string) => handleSemesterChange(course.code, semester)}
                  className="flex-1 mt-0"
                />
                <button
                  type="button"
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  onClick={() => handleRemove(idx)}
                  title="Delete Course"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
} 