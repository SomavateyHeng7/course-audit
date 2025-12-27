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
import { type CourseData } from '@/components/features/excel/ExcelUtils';
import ExportDataMenu from '../../../../components/role-specific/student/dataentry/ExportDataMenu';
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
  const [selectedFaculty, setSelectedFaculty] = useState('');

  // New state for enhanced transcript import
  const [unmatchedCourses, setUnmatchedCourses] = useState<UnmatchedCourse[]>([]);
  const [curriculumFreeElectives, setCurriculumFreeElectives] = useState<FreeElectiveCourse[]>([]);
  const [assignedFreeElectives, setAssignedFreeElectives] = useState<FreeElectiveCourse[]>([]);
  const [electiveRules, setElectiveRules] = useState<any[]>([]);
  const [assignedFreeElectiveCodes, setAssignedFreeElectiveCodes] = useState<Set<string>>(new Set());

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
        // Don't fetch departments here - wait until faculty is selected
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
          .filter((dept: any) => dept.facultyId === selectedFaculty)
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
        freeElectives,
        actualDepartmentId: actualDeptId, // Add the real department ID
        electiveRules, // Add elective rules for Free Elective credit requirements
        curriculumCreditsRequired: selectedCurriculumData?.totalCreditsRequired ?? selectedCurriculumData?.totalCredits ?? null,
      };
      localStorage.setItem('studentAuditData', JSON.stringify(dataToSave));
      
      console.log('🔍 DEBUG: Saving to localStorage with actualDepartmentId:', actualDeptId);
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [completedCourses, selectedDepartment, selectedCurriculum, selectedConcentration, freeElectives, curricula]);

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
      case 'in_progress':
      case 'in-progress':
      case 'in progress':
      case 'taking':
        return 'planning';
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
      'Unassigned'
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
              
              const category = course.category || 'Unassigned';
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
    // Data is automatically stored in localStorage via useEffect
    // Navigate to course planning
    router.push('/student/management/course-planning');
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

      {/* Transcript Import Section */}
      {selectedDepartment && selectedCurriculum && selectedConcentration && (
        <StudentTranscriptImport 
          curriculumId={selectedCurriculum}
          departmentId={selectedDepartment}
          onCoursesImported={handleCategorizedCoursesImported}
          onError={(error) => {
            console.error('Import error:', error);
            showError('Failed to import transcript data. Please check the file format and try again.');
          }}
        />
      )}

      {/* Unmatched Courses Section */}
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
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                                    <Select
                                      value={getCourseSelectValue(course.code)}
                                      onValueChange={value => handleCourseStatusChange(course.code, value)}
                                    >
                                      <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                                        <SelectValue placeholder="Select Grade" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Currently Taking">Currently Taking</SelectItem>
                                        <SelectItem value="Planning">Planning</SelectItem>
                                        {gradeOptions.map((g: string) => (
                                          <SelectItem key={g} value={g}>{g}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {completedCourses[course.code]?.status === 'planning' && (
                                      <Input
                                        type="text"
                                        placeholder="e.g., 1/2026"
                                        value={completedCourses[course.code]?.plannedSemester || ''}
                                        onChange={e => {
                                          const semester = e.target.value;
                                          setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                            ...prev,
                                            [course.code]: {
                                              ...prev[course.code],
                                              plannedSemester: semester
                                            }
                                          }));
                                        }}
                                        className="w-28 border border-input rounded-lg px-3 py-2 text-sm"
                                      />
                                    )}
                                  </div>
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
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                              <Select
                                value={getCourseSelectValue(course.code)}
                                onValueChange={value => handleCourseStatusChange(course.code, value)}
                              >
                                <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                                  <SelectValue placeholder="Select Grade" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Planning">Planning</SelectItem>
                                  {gradeOptions.map((g: string) => (
                                    <SelectItem key={g} value={g}>{g}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {completedCourses[course.code]?.status === 'planning' && (
                                <Input
                                  type="text"
                                  placeholder="e.g., 1/2026"
                                  value={completedCourses[course.code]?.plannedSemester || ''}
                                  onChange={e => {
                                    const semester = e.target.value;
                                    setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                      ...prev,
                                      [course.code]: {
                                        ...prev[course.code],
                                        plannedSemester: semester
                                      }
                                    }));
                                  }}
                                  className="w-28 border border-input rounded-lg px-3 py-2 text-sm"
                                />
                              )}
                            </div>
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
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                              <Select
                                value={getCourseSelectValue(course.code)}
                                onValueChange={value => handleCourseStatusChange(course.code, value)}
                              >
                              <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                                <SelectValue placeholder="Select Grade" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="Pending">Pending</SelectItem>
                                  <SelectItem value="Planning">Planning</SelectItem>
                                {gradeOptions.map((g: string) => (
                                  <SelectItem key={g} value={g}>{g}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {completedCourses[course.code]?.status === 'planning' && (
                              <Input
                                type="text"
                                placeholder="e.g., 1/2026"
                                value={completedCourses[course.code]?.plannedSemester || ''}
                                onChange={e => {
                                  const semester = e.target.value;
                                  setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                    ...prev,
                                    [course.code]: {
                                      ...prev[course.code],
                                      plannedSemester: semester
                                    }
                                  }));
                                }}
                                className="w-28 border border-input rounded-lg px-3 py-2 text-sm"
                              />
                            )}
                          </div>
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
                    <FreeElectiveAddButton />
                    {/* Render static free electives, if any */}
                    {(curriculumCourses[selectedCurriculum]?.['Free Elective'] || []).map(course => (
                      <div key={course.code} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-muted rounded-lg px-4 py-3 border border-border mb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <span className="font-semibold text-sm">{course.code} - {course.title}</span>
                          <span className="text-sm text-muted-foreground">{course.credits} credits</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                            <Select
                              value={getCourseSelectValue(course.code)}
                              onValueChange={value => handleCourseStatusChange(course.code, value)}
                            >
                            <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                              <SelectValue placeholder="Select Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Planning">Planning</SelectItem>
                              {gradeOptions.map((g: string) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {completedCourses[course.code]?.status === 'planning' && (
                            <Input
                              type="text"
                              placeholder="e.g., 1/2026"
                              value={completedCourses[course.code]?.plannedSemester || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const semester = e.target.value;
                                setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                  ...prev,
                                  [course.code]: {
                                    ...prev[course.code],
                                    plannedSemester: semester
                                  }
                                }));
                              }}
                              className="w-28 border border-input rounded-lg px-3 py-2 text-sm"
                            />
                          )}
                        </div>
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
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mt-2 sm:mt-0">
                            <Select
                              value={getCourseSelectValue(course.code)}
                              onValueChange={value => handleCourseStatusChange(course.code, value)}
                            >
                            <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                              <SelectValue placeholder="Select Grade" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Planning">Planning</SelectItem>
                              {gradeOptions.map((g: string) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {completedCourses[course.code]?.status === 'planning' && (
                            <Input
                              type="text"
                              placeholder="e.g., 1/2026"
                              value={completedCourses[course.code]?.plannedSemester || ''}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const semester = e.target.value;
                                setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                                  ...prev,
                                  [course.code]: {
                                    ...prev[course.code],
                                    plannedSemester: semester
                                  }
                                }));
                              }}
                              className="w-28 border border-input rounded-lg px-3 py-2 text-sm"
                            />
                          )}
                        </div>
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
              />
            )}
            <div className="flex flex-col items-stretch sm:items-end gap-2">
              <Button 
                onClick={handleCoursePlanning}
                className="bg-primary hover:bg-primary/90 dark:bg-primary dark:hover:bg-primary/90 text-primary-foreground flex items-center gap-2 px-8 py-3 text-lg shadow-md transform transition-all duration-200 hover:scale-[1.01] border-0"
                disabled={!selectedCurriculum || !selectedDepartment}
                size="lg"
              >
                <Calendar className="w-5 h-5" />
                Continue to Course Planning
              </Button>
              {(!selectedCurriculum || !selectedDepartment) && (
                <p className="text-sm text-muted-foreground text-left sm:text-right">
                  Please select a faculty and department first
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

// Add this component at the top level of the file (outside DataEntryPage)
function FreeElectiveAddButton() {
  const { completedCourses, setCompletedCourses, freeElectives, setFreeElectives } = useProgressContext();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', title: '', credits: '' });

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
        grade: newStatus === 'completed' ? value : undefined,
        status: newStatus,
        plannedSemester: newStatus === 'planning'
          ? prev[courseCode]?.plannedSemester || getDefaultSemesterLabel()
          : undefined
      }
    }));
  };


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
                  <Select
                    value={getCourseSelectValue(course.code)}
                    onValueChange={value => handleCourseStatusChange(course.code, value)}
                  >
                  <SelectTrigger className="w-full border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground">
                    <SelectValue placeholder="Select Grade" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Currently Taking">Currently Taking</SelectItem>
                      <SelectItem value="Planning">Planning</SelectItem>
                    {gradeOptions.map((g: string) => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {completedCourses[course.code]?.status === 'planning' && (
                  <Input
                    type="text"
                    placeholder="e.g., 1/2026"
                    value={completedCourses[course.code]?.plannedSemester || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const semester = e.target.value;
                      setCompletedCourses((prev: { [code: string]: CourseStatus }) => ({
                        ...prev,
                        [course.code]: {
                          ...prev[course.code],
                          plannedSemester: semester
                        }
                      }));
                    }}
                    className="w-28 border border-input rounded-lg px-3 py-2 text-sm"
                  />
                )}
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