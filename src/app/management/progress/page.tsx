"use client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from 'xlsx';
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { curriculumBlacklistApi, type CurriculumBlacklistsResponse } from '@/services/curriculumBlacklistApi';
import { AlertTriangle, ArrowLeft, Download, ChevronDown } from "lucide-react";
import { GiGraduateCap } from "react-icons/gi";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  validateStudentProgress, 
  calculateCurriculumProgress,
  type StudentCourseData,
  type ValidationResult,
  type CurriculumProgress
} from "@/lib/courseValidation";

// categoryOrder is now dynamically determined inside the component

interface CourseStatus {
  status: 'not_completed' | 'completed' | 'failed' | 'withdrawn' | 'planning';
  grade?: string;
}

interface CompletedCourseData {
  completedCourses: { [code: string]: CourseStatus };
  selectedDepartment: string;
  selectedCurriculum: string;
  selectedConcentration: string;
  freeElectives: { code: string; title: string; credits: number }[];
  actualDepartmentId?: string; // Real department ID from curriculum data
  electiveRules?: any[]; // Rules for elective credit requirements
}

interface PlannedCourse {
  id: string;
  code: string;
  title: string;
  credits: number;
  semester: string;
  year: number;
  status: 'planning'; // Now only supports 'planning' status
}

interface ConcentrationProgress {
  concentration: {
    id: string;
    name: string;
    description?: string;
    requiredCourses: number;
    courses: Array<{
      code: string;
      name: string;
      credits: number;
    }>;
  };
  completedCourses: string[];
  plannedCourses: string[];
  progress: number;
  isEligible: boolean;
  remainingCourses: number;
}

export default function ProgressPage() {
  const router = useRouter();
  const pdfRef = useRef<HTMLDivElement>(null);
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [concentrationAnalysis, setConcentrationAnalysis] = useState<ConcentrationProgress[]>([]);
  const [completedData, setCompletedData] = useState<CompletedCourseData>({
    completedCourses: {},
    selectedDepartment: '',
    selectedCurriculum: '',
    selectedConcentration: '',
    freeElectives: []
  });
  const [curriculumData, setCurriculumData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [blacklistData, setBlacklistData] = useState<CurriculumBlacklistsResponse | null>(null);
  const [blacklistWarnings, setBlacklistWarnings] = useState<string[]>([]);
  
  // Enhanced validation states
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [curriculumProgress, setCurriculumProgress] = useState<CurriculumProgress | null>(null);
  
  // Load all data from localStorage and fetch curriculum data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Only run debugging during client-side execution, not during build
        if (typeof window !== 'undefined') {
          console.log('=== PROGRESS PAGE DEBUGGING ===');
          console.log('Step 1: Loading data from localStorage');
        }
        
        // Only access localStorage on client side
        if (typeof window === 'undefined') {
          setLoading(false);
          return;
        }
        
        // Check all localStorage keys
        const allKeys = Object.keys(localStorage);
        if (typeof window !== 'undefined') {
          console.log('All localStorage keys:', allKeys);
        }
        
        // Load completed courses data from data-entry page
        const savedCompletedData = localStorage.getItem('studentAuditData');
        if (typeof window !== 'undefined') {
          console.log('Step 2: Raw studentAuditData:', savedCompletedData);
        }
        
        let parsedData: CompletedCourseData | null = null;
        
        if (savedCompletedData) {
          parsedData = JSON.parse(savedCompletedData);
          if (typeof window !== 'undefined') {
            console.log('Step 3: Parsed studentAuditData:', parsedData);
          }
          
          // Only set data if parsedData is not null
          if (parsedData) {
            setCompletedData(parsedData);
          }
          
          // Fetch curriculum data if we have a curriculum ID
          if (parsedData && parsedData.selectedCurriculum) {
            if (typeof window !== 'undefined') {
              console.log('Step 4: Fetching curriculum for ID:', parsedData.selectedCurriculum);
            }
            try {
              const response = await fetch('/api/public-curricula');
              const data = await response.json();
              if (typeof window !== 'undefined') {
                console.log('Step 5: API response:', data);
              }
              const curriculum = data.curricula?.find((c: any) => c.id === parsedData!.selectedCurriculum);
              if (curriculum) {
                if (typeof window !== 'undefined') {
                  console.log('Step 6: Found curriculum data:', curriculum);
                }
                setCurriculumData(curriculum);
              } else {
                if (typeof window !== 'undefined') {
                  console.log('Step 6: No curriculum found with ID:', parsedData!.selectedCurriculum);
                  console.log('Available curricula:', data.curricula?.map((c: any) => ({ id: c.id, name: c.name })));
                }
              }
            } catch (error) {
              if (typeof window !== 'undefined') {
                console.error('Step 6: Error fetching curriculum data:', error);
              }
            }
          } else {
            if (typeof window !== 'undefined') {
              console.log('Step 4: No curriculum ID found in saved data');
            }
          }
        } else {
          if (typeof window !== 'undefined') {
            console.log('Step 3: No studentAuditData found in localStorage');
          }
        }
        
        // Load planned courses from course planner
        const savedCoursePlan = localStorage.getItem('coursePlan');
        if (typeof window !== 'undefined') {
          console.log('Step 7: Raw coursePlan:', savedCoursePlan);
        }
        
        if (savedCoursePlan) {
          const planData = JSON.parse(savedCoursePlan);
          if (typeof window !== 'undefined') {
            console.log('Step 8: Parsed coursePlan:', planData);
          }
          setPlannedCourses(planData.plannedCourses || []);
        } else {
          if (typeof window !== 'undefined') {
            console.log('Step 8: No coursePlan found in localStorage');
          }
        }
        
        // Load concentration analysis
        const savedConcentrationAnalysis = localStorage.getItem('concentrationAnalysis');
        if (typeof window !== 'undefined') {
          console.log('Step 9: Raw concentrationAnalysis:', savedConcentrationAnalysis);
        }
        
        if (savedConcentrationAnalysis) {
          const analysisData = JSON.parse(savedConcentrationAnalysis);
          if (typeof window !== 'undefined') {
            console.log('Step 10: Parsed concentrationAnalysis:', analysisData);
          }
          setConcentrationAnalysis(analysisData);
        } else {
          if (typeof window !== 'undefined') {
            console.log('Step 10: No concentrationAnalysis found in localStorage');
          }
        }
        
        if (typeof window !== 'undefined') {
          console.log('=== END PROGRESS PAGE DEBUGGING ===');
        }
        
        // If no concentration analysis found, try to generate it
        if (!savedConcentrationAnalysis && parsedData && parsedData.selectedCurriculum) {
          await generateConcentrationAnalysis(parsedData);
        }
        
        // Load blacklist data for the curriculum
        if (parsedData && parsedData.selectedCurriculum) {
          await loadBlacklistData(parsedData.selectedCurriculum);
        }
        
        // Run enhanced validation
        await runEnhancedValidation();
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Re-run enhanced validation when key data changes
  useEffect(() => {
    if (!loading && completedData.selectedCurriculum) {
      runEnhancedValidation();
    }
  }, [completedData, plannedCourses, loading]);

  // Generate concentration analysis if missing
  const generateConcentrationAnalysis = async (data: CompletedCourseData) => {
    try {
      if (typeof window !== 'undefined') {
        console.log('🔍 DEBUG: Generating concentration analysis...');
      }
      
      // Find the department ID from curriculum data
      const response = await fetch('/api/public-curricula');
      const curriculaData = await response.json();
      const currentCurriculum = curriculaData.curricula?.find((c: any) => c.id === data.selectedCurriculum);
      
      if (!currentCurriculum?.department?.id) {
        if (typeof window !== 'undefined') {
          console.log('🔍 DEBUG: No department ID found for concentration analysis');
        }
        return;
      }

      // Fetch concentrations
      const concResponse = await fetch(`/api/public-concentrations?curriculumId=${data.selectedCurriculum}&departmentId=${currentCurriculum.department.id}`);
      const concData = await concResponse.json();
      
      if (concResponse.ok && concData.concentrations) {
        const concentrations = concData.concentrations;
        // Get completed courses from data-entry
        const completedCoursesCodes = Object.keys(data.completedCourses).filter(
          code => data.completedCourses[code]?.status === 'completed'
        );
        
        // Get planning courses from data-entry (courses marked as 'planning')
        const planningCoursesFromDataEntry = Object.keys(data.completedCourses).filter(
          code => data.completedCourses[code]?.status === 'planning'
        );
        
        // Get planned courses from course planner
        const plannedCoursesData = JSON.parse(localStorage.getItem('coursePlan') || '{}');
        const plannedCoursesFromPlanner = plannedCoursesData.plannedCourses?.map((c: any) => c.code) || [];
        
        // Combine all planned courses (from data-entry and course planner)
        const allPlannedCourses = [...new Set([...planningCoursesFromDataEntry, ...plannedCoursesFromPlanner])];

        const analysis = concentrations.map((concentration: any) => {
          const concentrationCourseCodes = concentration.courses.map((c: any) => c.code);
          const completedInConcentration = completedCoursesCodes.filter((code: string) => 
            concentrationCourseCodes.includes(code)
          );
          const plannedInConcentration = allPlannedCourses.filter((code: string) => 
            concentrationCourseCodes.includes(code)
          );
          
          const totalProgress = completedInConcentration.length + plannedInConcentration.length;
          const progress = (totalProgress / concentration.requiredCourses) * 100;
          const isEligible = totalProgress >= concentration.requiredCourses;
          const remainingCourses = Math.max(0, concentration.requiredCourses - totalProgress);

          return {
            concentration,
            completedCourses: completedInConcentration,
            plannedCourses: plannedInConcentration,
            progress: Math.min(100, progress),
            isEligible,
            remainingCourses
          };
        });

        setConcentrationAnalysis(analysis);
        localStorage.setItem('concentrationAnalysis', JSON.stringify(analysis));
        
        if (typeof window !== 'undefined') {
          console.log('🔍 DEBUG: Generated concentration analysis:', analysis);
        }
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        console.error('Error generating concentration analysis:', error);
      }
    }
  };

  // Load blacklist data for the curriculum
  const loadBlacklistData = async (curriculumId: string) => {
    try {
      if (typeof window !== 'undefined') {
        console.log('🔍 DEBUG: Loading blacklist data for curriculum:', curriculumId);
      }
      
      // Use public API endpoint instead of protected one
      const response = await fetch(`/api/public-curricula/${curriculumId}/blacklists`);
      if (!response.ok) {
        throw new Error(`Failed to fetch blacklists: ${response.status}`);
      }
      const { blacklists } = await response.json();
      
      // Transform to match expected format
      const transformedBlacklists: CurriculumBlacklistsResponse = {
        availableBlacklists: [],
        assignedBlacklists: blacklists.map((blacklist: any) => ({
          assignedAt: blacklist.createdAt || new Date().toISOString(),
          blacklist: {
            id: blacklist.id,
            name: blacklist.name,
            description: blacklist.description,
            courses: blacklist.courses.map((courseItem: any) => ({
              code: courseItem.course.code,
              name: courseItem.course.name
            }))
          }
        })),
        stats: {
          totalAvailable: 0,
          totalAssigned: blacklists.length,
          totalBlacklistedCourses: blacklists.reduce((total: number, blacklist: any) => 
            total + blacklist.courses.length, 0
          )
        }
      };
      
      setBlacklistData(transformedBlacklists);
      
      // Validate completed courses against blacklists
      const warnings = validateBlacklistConflicts(transformedBlacklists);
      setBlacklistWarnings(warnings);
      
      if (typeof window !== 'undefined') {
        console.log('🔍 DEBUG: Loaded blacklist data:', transformedBlacklists);
        console.log('🔍 DEBUG: Blacklist warnings:', warnings);
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        console.warn('Blacklist data temporarily unavailable:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Continuing without blacklist validation...');
      }
      // Continue without blacklist data - don't block the page
      setBlacklistData({
        availableBlacklists: [],
        assignedBlacklists: [],
        stats: {
          totalAvailable: 0,
          totalAssigned: 0,
          totalBlacklistedCourses: 0
        }
      });
      setBlacklistWarnings([]);
    }
  };

  // Validate completed courses against blacklist rules
  const validateBlacklistConflicts = (blacklists: CurriculumBlacklistsResponse): string[] => {
    const warnings: string[] = [];
    const completedCoursesCodes = Object.keys(completedCourses).filter(
      code => completedCourses[code]?.status === 'completed'
    );

    // Check each assigned blacklist for violations
    blacklists.assignedBlacklists.forEach(assignedBlacklist => {
      const blacklistCourses = assignedBlacklist.blacklist.courses.map(course => course.code);
      const takenFromBlacklist = completedCoursesCodes.filter(code => 
        blacklistCourses.includes(code)
      );

      if (takenFromBlacklist.length > 1) {
        warnings.push(
          `⚠️ Blacklist Violation: You have completed multiple courses from "${assignedBlacklist.blacklist.name}" blacklist: ${takenFromBlacklist.join(', ')}. This may affect your graduation requirements.`
        );
      }
    });

    return warnings;
  };

  // Convert completed courses to StudentCourseData format for validation


  // Cache for course data to avoid multiple API calls
  const [courseDataCache, setCourseDataCache] = useState<{ [courseCode: string]: { credits: number; title: string } }>({});

  // Function to fetch all course data at once
  const fetchAllCourseData = async (): Promise<{ [courseCode: string]: { credits: number; title: string } }> => {
    try {
      if (!completedData.actualDepartmentId && !completedData.selectedDepartment) {
        return {};
      }
      
      const departmentId = completedData.actualDepartmentId || completedData.selectedDepartment;
      const response = await fetch(`/api/available-courses?curriculumId=${selectedCurriculum}&departmentId=${departmentId}`);
      const data = await response.json();
      
      if (response.ok && data.courses) {
        const courseMap: { [courseCode: string]: { credits: number; title: string } } = {};
        data.courses.forEach((course: any) => {
          courseMap[course.code] = {
            credits: course.credits || 3,
            title: course.title || course.code
          };
        });
        setCourseDataCache(courseMap);
        return courseMap;
      }
      
      return {};
    } catch (error) {
      console.warn('Could not fetch course data:', error);
      return {};
    }
  };

  // Enhanced course data conversion with proper credit lookup
  const convertToStudentCourseDataWithCredits = async (): Promise<StudentCourseData[]> => {
    const courses: StudentCourseData[] = [];
    
    // Fetch all course data at once for efficiency
    const allCourseData = Object.keys(courseDataCache).length > 0 ? courseDataCache : await fetchAllCourseData();
    
    // Add courses from data-entry page with proper status mapping and credit lookup
    Object.entries(completedCourses).forEach(([courseCode, courseInfo]) => {
      let status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FAILED' | 'DROPPED';
      
      switch (courseInfo.status) {
        case 'completed':
          status = 'COMPLETED';
          break;
        case 'planning':
          status = 'IN_PROGRESS'; // Planning courses are considered in progress
          break;
        case 'failed':
          status = 'FAILED';
          break;
        case 'withdrawn':
          status = 'DROPPED';
          break;
        case 'not_completed':
        default:
          status = 'PENDING';
          break;
      }
      
      const courseData = allCourseData[courseCode];
      const credits = courseData?.credits || 3; // Use actual credits or default to 3
      const courseName = courseData?.title || courseCode; // Use actual title or fallback to code
      
      courses.push({
        courseCode,
        courseName,
        credits,
        status,
        grade: courseInfo.grade
      });
    });
    
    // Add planned courses (only if not already included from data-entry)
    let existingCourseCodes = new Set(courses.map(c => c.courseCode));
    plannedCourses.forEach(course => {
      if (!existingCourseCodes.has(course.code)) {
        courses.push({
          courseCode: course.code,
          courseName: course.title,
          credits: course.credits,
          status: 'IN_PROGRESS' // Planned courses are considered in progress
        });
        existingCourseCodes.add(course.code);
      }
    });
    
    // Add free electives (only if not already included)
    freeElectives.forEach(elective => {
      if (!existingCourseCodes.has(elective.code)) {
        courses.push({
          courseCode: elective.code,
          courseName: elective.title,
          credits: elective.credits,
          status: 'COMPLETED'
        });
        existingCourseCodes.add(elective.code);
      }
    });

    return courses;
  };

  // Enhanced validation function
  const runEnhancedValidation = async () => {
    if (!selectedCurriculum) return;
    
    try {
      if (typeof window !== 'undefined') {
        console.log('🔍 DEBUG: Running enhanced validation...');
      }
      
      const studentCourses = await convertToStudentCourseDataWithCredits();
      
      if (typeof window !== 'undefined') {
        console.log('🔍 DEBUG: Student courses for validation:', studentCourses);
        console.log('🔍 DEBUG: Completed courses:', studentCourses.filter(c => c.status === 'COMPLETED'));
        console.log('🔍 DEBUG: In-progress courses (planning):', studentCourses.filter(c => c.status === 'IN_PROGRESS'));
        console.log('🔍 DEBUG: Total credits - Completed:', studentCourses.filter(c => c.status === 'COMPLETED').reduce((sum, c) => sum + c.credits, 0));
        console.log('🔍 DEBUG: Total credits - In Progress:', studentCourses.filter(c => c.status === 'IN_PROGRESS').reduce((sum, c) => sum + c.credits, 0));
      }
      
      // Get curriculum and department IDs - use actualDepartmentId from data-entry page
      const curriculumId = selectedCurriculum;
      const departmentId = completedData.actualDepartmentId || completedData.selectedDepartment || 'default-dept';
      
      if (typeof window !== 'undefined') {
        console.log('🔍 DEBUG: Department ID resolution:', {
          selectedCurriculum: curriculumId,
          actualDepartmentId: completedData.actualDepartmentId,
          departmentId,
          fallbackDepartment: completedData.selectedDepartment
        });
      }
      
      // Run comprehensive validation
      const [validation, progress] = await Promise.all([
        validateStudentProgress(studentCourses, curriculumId, departmentId),
        calculateCurriculumProgress(studentCourses, curriculumId)
      ]);
      
      // Validate the progress data before setting it
      if (progress && typeof progress.totalCreditsRequired === 'number' && progress.totalCreditsRequired > 0) {
        setCurriculumProgress(progress);
        if (typeof window !== 'undefined') {
          console.log('🔍 DEBUG: Valid curriculum progress set:', progress);
        }
      } else {
        if (typeof window !== 'undefined') {
          console.warn('🔍 DEBUG: Invalid curriculum progress data:', progress);
        }
        setCurriculumProgress(null);
      }
      
      setValidationResult(validation);
      
      if (typeof window !== 'undefined') {
        console.log('🔍 DEBUG: Validation result:', validation);
        console.log('🔍 DEBUG: Final curriculum progress state:', progress);
      }
      
    } catch (error) {
      if (typeof window !== 'undefined') {
        console.warn('Enhanced validation temporarily unavailable:', error instanceof Error ? error.message : 'Unknown error');
        console.log('Continuing with basic functionality...');
      }
      // Continue with basic functionality - don't block the page
      setValidationResult(null);
      setCurriculumProgress(null);
    }
  };

  const { completedCourses, selectedCurriculum, selectedConcentration, freeElectives } = completedData;

  // Only log during client-side execution
  if (typeof window !== 'undefined') {
    console.log('Progress Page - Current state:', {
      selectedCurriculum,
      selectedConcentration,
      completedCoursesCount: Object.keys(completedCourses).length,
      freeElectivesCount: freeElectives.length,
      plannedCoursesCount: plannedCourses.length
    });
  }

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

  // Use real curriculum data if available, otherwise fall back to mock data
  const curriculumCourses: { [key: string]: { [category: string]: { code: string; title: string; credits: number }[] } } = {};
  
  if (typeof window !== 'undefined') {
    console.log('🔍 DEBUG: Processing curriculum data:', {
      curriculumData,
      hasCurriculumData: !!curriculumData,
      hasCurriculumCourses: !!curriculumData?.curriculumCourses,
      curriculumCoursesLength: curriculumData?.curriculumCourses?.length,
      selectedCurriculum,
      firstCourse: curriculumData?.curriculumCourses?.[0],
      sampleCourseStructure: {
        course: curriculumData?.curriculumCourses?.[0]?.course,
        departmentCourseType: curriculumData?.curriculumCourses?.[0]?.departmentCourseType,
        nestedTypes: curriculumData?.curriculumCourses?.[0]?.course?.departmentCourseTypes
      }
    });
  }
  
  if (curriculumData && curriculumData.curriculumCourses) {
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: Found curriculum courses, processing...');
    }
    
    // Get department course types mapping from the curriculum
    const departmentCourseTypes = curriculumData?.departmentCourseTypes || {};
    
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: Department course types mapping:', departmentCourseTypes);
    }
    
    // Transform real curriculum data into the format we need
    const coursesByCategory: { [category: string]: { code: string; title: string; credits: number }[] } = {};
    
    curriculumData.curriculumCourses.forEach((course: any, index: number) => {
      if (typeof window !== 'undefined') {
        console.log(`🔍 DEBUG: Processing course ${index}:`, {
          fullCourse: course,
          courseObj: course.course,
          departmentCourseTypes: course.course?.departmentCourseTypes,
          directDepartmentCourseType: course.departmentCourseType,
          hasDirectType: !!course.departmentCourseType,
          hasNestedTypes: !!course.course?.departmentCourseTypes,
          nestedTypesLength: course.course?.departmentCourseTypes?.length || 0,
          rawCredits: course.course.credits
        });
      }
      
      // Use the curriculum-specific department course type mapping
      let category = 'Unassigned';
      
      // Method 1: Direct departmentCourseType with curriculum mapping
      if (course.departmentCourseType?.name) {
        const departmentTypeName = course.departmentCourseType.name;
        category = departmentCourseTypes[departmentTypeName] || departmentTypeName || 'Unassigned';
        if (typeof window !== 'undefined') {
          console.log(`🔍 Method 1 - Direct type: ${departmentTypeName} -> Mapped to: ${category}`);
        }
      }
      // Method 2: From nested departmentCourseTypes array with curriculum mapping
      else if (course.course?.departmentCourseTypes?.length > 0) {
        const firstType = course.course.departmentCourseTypes[0];
        const departmentTypeName = firstType.courseType?.name || firstType.name;
        category = departmentCourseTypes[departmentTypeName] || departmentTypeName || 'Unassigned';
        if (typeof window !== 'undefined') {
          console.log(`🔍 Method 2 - Nested type: ${departmentTypeName} -> Mapped to: ${category}`, firstType);
        }
      }
      
      const parsedCredits = parseCredits(course.course.credits);
      
      if (typeof window !== 'undefined') {
        console.log(`🔍 Final: ${course.course.code} -> Category: ${category}, Credits: ${course.course.credits} -> ${parsedCredits}`);
      }
      
      if (!coursesByCategory[category]) {
        coursesByCategory[category] = [];
      }
      coursesByCategory[category].push({
        code: course.course.code,
        title: course.course.name,
        credits: parsedCredits
      });
    });
    
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: Built coursesByCategory:', coursesByCategory);
    }
    curriculumCourses[selectedCurriculum] = coursesByCategory;
  } else {
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: No curriculum data found, using mock data');
    }
    // Fall back to mock data for development
    curriculumCourses.bscs2022 = {
      "General Education": [
        { code: "ELE1001", title: "Communication English I", credits: 3 },
        { code: "ELE1002", title: "Communication English II", credits: 3 },
        { code: "GE1411", title: "Thai Language for Multicultural Communication", credits: 2 },
        { code: "GE2110", title: "Human Civilizations and Global Citizens", credits: 2 },
      ],
      "Core Courses": [
        { code: "CS101", title: "Intro to Computer Science", credits: 3 },
        { code: "CS201", title: "Data Structures", credits: 3 },
        { code: "CS301", title: "Algorithms", credits: 3 },
      ],
      Major: [
        { code: "CS410", title: "AI Fundamentals", credits: 3 },
        { code: "CS420", title: "Web Development", credits: 3 },
      ],
      "Major Elective": [
        { code: "CS430", title: "Mobile App Dev", credits: 3 },
        { code: "CS440", title: "Cloud Computing", credits: 3 },
      ],
      "Free Elective": [
        { code: "ART1001", title: "Art Appreciation", credits: 3 },
      ],
    };
  }
  const mockConcentrations: { [curriculum: string]: { [concentration: string]: { label: string; Major: { code: string; title: string; credits: number }[] } } } = {
    bscs2022: {
      ai: {
        label: "Artificial Intelligence",
        Major: [
          { code: "CS510", title: "Machine Learning", credits: 3 },
          { code: "CS511", title: "Neural Networks", credits: 3 },
        ],
      },
      se: {
        label: "Software Engineering",
        Major: [
          { code: "CS520", title: "Software Architecture", credits: 3 },
          { code: "CS521", title: "DevOps Practices", credits: 3 },
        ],
      },
      ds: {
        label: "Data Science",
        Major: [
          { code: "CS530", title: "Big Data Analytics", credits: 3 },
          { code: "CS531", title: "Data Mining", credits: 3 },
        ],
      },
    },
  };

  // Gather all courses for the selected curriculum (and concentration for Major)
  let allCoursesByCategory: { [category: string]: { code: string; title: string; credits: number }[] } = {};
  
  if (typeof window !== 'undefined') {
    console.log('Building course categories for curriculum:', selectedCurriculum);
    console.log('Available curricula in curriculumCourses:', Object.keys(curriculumCourses));
  }
  
  if (selectedCurriculum && curriculumCourses[selectedCurriculum]) {
    allCoursesByCategory = { ...curriculumCourses[selectedCurriculum] };
    if (typeof window !== 'undefined') {
      console.log('Loaded courses for curriculum:', selectedCurriculum, allCoursesByCategory);
    }
    
    // Handle concentration-specific Major courses for bscs2022
    if (selectedCurriculum === "bscs2022") {
      if (selectedConcentration && selectedConcentration !== "none" && selectedConcentration !== "general") {
        allCoursesByCategory["Major"] =
          mockConcentrations[selectedCurriculum]?.[selectedConcentration]?.Major || [];
      } else {
        // If no specific concentration, flatten all concentration majors
        allCoursesByCategory["Major"] = Object.values(
          mockConcentrations[selectedCurriculum] || {}
        ).flatMap((c) => c.Major);
      }
    }
    
    // Merge free electives from context
    allCoursesByCategory["Free Elective"] = [
      ...(allCoursesByCategory["Free Elective"] || []),
      ...freeElectives.filter(
        (fe) => !(allCoursesByCategory["Free Elective"] || []).some((c) => c.code === fe.code)
      ),
    ];
  } else {
    if (typeof window !== 'undefined') {
      console.warn('No curriculum data found for:', selectedCurriculum);
    }
    // Create empty categories to avoid errors
    const defaultCategories = [
      'General Education',
      'Core Courses', 
      'Major',
      'Major Elective',
      'Free Elective',
      'General'
    ];
    defaultCategories.forEach(category => {
      allCoursesByCategory[category] = [];
    });
    // At least add free electives
    allCoursesByCategory["Free Elective"] = freeElectives;
  }

  // Also collect categories from completed courses that aren't in curriculum
  const allPossibleCategories = new Set<string>();
  
  // Add curriculum categories
  if (allCoursesByCategory) {
    Object.keys(allCoursesByCategory).forEach(cat => allPossibleCategories.add(cat));
  }
  
  // Add categories from completed courses
  if (typeof window !== 'undefined') {
    Object.keys(completedCourses).forEach(courseCode => {
      const courseStatus = completedCourses[courseCode];
      if (courseStatus.status === 'completed') {
        // Simple categorization logic for completed courses not in curriculum
        let category = 'Unassigned';
        if (courseCode.startsWith('CSX') || courseCode.startsWith('CS')) {
          category = 'Major';
        } else if (courseCode.startsWith('ITX') || courseCode.startsWith('IT')) {
          category = 'Major';  
        } else if (courseCode.startsWith('GE')) {
          category = 'General Education';
        } else if (courseCode.startsWith('ELE')) {
          category = 'Free Elective';
        }
        allPossibleCategories.add(category);
      }
    });
  }
  
  // Add categories from planned courses
  if (typeof window !== 'undefined') {
    const storedPlanningData = localStorage.getItem('planningData');
    if (storedPlanningData) {
      const planningData = JSON.parse(storedPlanningData);
      planningData.forEach((plannedCourse: any) => {
        if (plannedCourse.category) {
          allPossibleCategories.add(plannedCourse.category);
        }
      });
    }
  }

  // Update getCategoryOrder to use all possible categories
  const getCategoryOrder = () => {
    const availableCategories = Array.from(allPossibleCategories);
    console.log('🔍 DEBUG: All possible categories:', availableCategories);
    
    // Define preferred order, but include all available categories
    const preferredOrder = [
      'General Education',
      'Core Courses', 
      'Major',
      'Major Elective',
      'Free Elective',
      'General',
      'Unassigned'
    ];
    
    // Start with preferred order categories that exist
    const orderedCategories = preferredOrder.filter(cat => availableCategories.includes(cat));
    
    // Add any additional categories not in preferred order
    const additionalCategories = availableCategories.filter(cat => !preferredOrder.includes(cat));
    
    return [...orderedCategories, ...additionalCategories];
  };

  const categoryOrder = getCategoryOrder();

  // GPA mapping
  const gradeToGPA: Record<string, number> = {
    'A': 4.0,
    'A-': 3.7,
    'B+': 3.3,
    'B': 3.0,
    'B-': 2.7,
    'C+': 2.3,
    'C': 2.0,
    'C-': 1.7,
    'D': 1.0,
    'S': 0.0,
  };

  // Calculate stats (include both completed and planned courses)
  let totalCredits = 0;
  let earnedCredits = 0;
  let plannedCredits = 0;
  let totalGradePoints = 0;
  let totalGpaCredits = 0;
  const categoryStats: { [category: string]: { completed: number; total: number; earned: number; totalCredits: number; planned: number } } = {};
  const completedList: any[] = [];
  const takingList: any[] = [];
  const plannedFromPlannerList: any[] = [];
  const pendingList: any[] = [];

  // Get planned courses by code for easy lookup
  const plannedCoursesMap = new Map(plannedCourses.map(course => [course.code, course]));

  for (const category of categoryOrder) {
    const courses = allCoursesByCategory[category] || [];
    let completedCount = 0;
    let plannedCount = 0;
    let earnedCategoryCredits = 0;
    let totalCategoryCredits = 0;
    
    for (const c of courses) {
      const status = completedCourses[c.code]?.status;
      const plannedCourse = plannedCoursesMap.get(c.code);
      
      if (status === 'completed') {
        completedList.push({ ...c, category, grade: completedCourses[c.code]?.grade, source: 'completed' });
        earnedCredits += c.credits;
        earnedCategoryCredits += c.credits;
        completedCount++;
        // GPA calculation
        const grade = completedCourses[c.code]?.grade;
        if (grade && gradeToGPA[grade] !== undefined) {
          totalGradePoints += gradeToGPA[grade] * c.credits;
          totalGpaCredits += c.credits;
        }
      } else if (plannedCourse) {
        // Course is in the planner
        plannedFromPlannerList.push({ 
          ...c, 
          category, 
          source: 'planner',
          semester: plannedCourse.semester,
          year: plannedCourse.year,
          status: plannedCourse.status
        });
        plannedCredits += c.credits;
        plannedCount++;
      } else {
        pendingList.push({ ...c, category, source: 'pending' });
      }
      
      totalCategoryCredits += c.credits;
    }
    
    categoryStats[category] = {
      completed: completedCount,
      planned: plannedCount,
      total: courses.length,
      earned: earnedCategoryCredits,
      totalCredits: totalCategoryCredits,
    };
  }
  
  // Categorize completed courses that aren't in predefined curriculum categories
  const coursesInCategories = new Set();
  Object.values(allCoursesByCategory).flat().forEach(course => {
    coursesInCategories.add(course.code);
  });
  
  if (typeof window !== 'undefined') {
    console.log('🔍 DEBUG: Courses in predefined categories:', Array.from(coursesInCategories));
    console.log('🔍 DEBUG: All completed course codes:', Object.keys(completedCourses));
  }
  
  // Add completed courses that aren't in any predefined category
  Object.keys(completedCourses).forEach(courseCode => {
    const courseStatus = completedCourses[courseCode];
    if (courseStatus.status === 'completed' && !coursesInCategories.has(courseCode)) {
      // Courses not in curriculum are treated as Free Electives
      const category = 'Free Elective';
      
      // Parse credits from the course (assume 3 credits if not found)
      const credits = 3; // Default credits
      
      if (typeof window !== 'undefined') {
        console.log(`🔍 DEBUG: Categorizing external course ${courseCode} as ${category} with ${credits} credits`);
      }
      
      // Add to completed list
      completedList.push({
        code: courseCode,
        title: courseCode, // Use course code as title if no title available
        credits: credits,
        category: category,
        grade: courseStatus.grade,
        source: 'completed'
      });
      
      // Update statistics
      earnedCredits += credits;
      if (!categoryStats[category]) {
        categoryStats[category] = { completed: 0, planned: 0, total: 0, earned: 0, totalCredits: 0 };
      }
      categoryStats[category].completed += 1;
      categoryStats[category].earned += credits;
      categoryStats[category].total += 1;
      categoryStats[category].totalCredits += credits;
      
      // Update GPA calculation
      const grade = courseStatus.grade;
      if (grade && gradeToGPA[grade] !== undefined) {
        totalGradePoints += gradeToGPA[grade] * credits;
        totalGpaCredits += credits;
      }
    }
  });
  
  // Handle planned courses that aren't in predefined curriculum categories
  // These should be treated as Free Electives as per user specification
  plannedCourses.forEach(plannedCourse => {
    if (!coursesInCategories.has(plannedCourse.code)) {
      // This planned course is not in the predefined curriculum - treat as Free Elective
      const category = 'Free Elective';
      
      if (typeof window !== 'undefined') {
        console.log(`🔍 DEBUG: Adding planned course outside curriculum: ${plannedCourse.code} as ${category}`);
      }
      
      // Add to planned list
      plannedFromPlannerList.push({
        code: plannedCourse.code,
        title: plannedCourse.title,
        credits: plannedCourse.credits,
        category: category,
        source: 'planner',
        semester: plannedCourse.semester,
        year: plannedCourse.year,
        status: plannedCourse.status
      });
      
      // Update statistics
      plannedCredits += plannedCourse.credits;
      if (!categoryStats[category]) {
        categoryStats[category] = { completed: 0, planned: 0, total: 0, earned: 0, totalCredits: 0 };
      }
      categoryStats[category].planned += 1;
      categoryStats[category].total += 1;
      categoryStats[category].totalCredits += plannedCourse.credits;
    }
  });

  if (typeof window !== 'undefined') {
    console.log('🔍 DEBUG: Final completed courses list:', completedList);
    console.log('🔍 DEBUG: Final planned courses list:', plannedFromPlannerList);
    console.log('🔍 DEBUG: Final category stats:', categoryStats);
  }
  
  const totalCreditsRequired = 132; // Replace with real value from curriculum when available
  const percent = totalCreditsRequired ? Math.round((earnedCredits / totalCreditsRequired) * 100) : 0;
  const projectedPercent = totalCreditsRequired ? Math.round(((earnedCredits + plannedCredits) / totalCreditsRequired) * 100) : 0;
  const gpa = totalGpaCredits > 0 ? (totalGradePoints / totalGpaCredits).toFixed(2) : 'N/A';

  // For each category, count completed, planned and total courses
  const coreCompleted = categoryStats['Core Courses']?.completed || 0;
  const corePlanned = categoryStats['Core Courses']?.planned || 0;
  const coreTotal = allCoursesByCategory['Core Courses']?.length || 0;
  
  const majorCompleted = categoryStats['Major']?.completed || 0;
  const majorPlanned = categoryStats['Major']?.planned || 0;
  const majorTotal = allCoursesByCategory['Major']?.length || 0;
  
  const majorElectiveCompleted = categoryStats['Major Elective']?.completed || 0;
  const majorElectivePlanned = categoryStats['Major Elective']?.planned || 0;
  // For Major Electives, use the total from categoryStats if no predefined courses exist
  const majorElectiveTotal = allCoursesByCategory['Major Elective']?.length || categoryStats['Major Elective']?.total || 0;
  
  // For Free Electives, use credit-based calculations instead of course counts
  const freeElectiveCompletedCredits = categoryStats['Free Elective']?.earned || 0;
  
  // Calculate planned credits for Free Electives
  const freeElectivePlannedCreditSum = plannedFromPlannerList
    .filter(course => course.category === 'Free Elective')
    .reduce((sum, course) => sum + course.credits, 0);
  
  // Get Free Elective requirement from saved elective rules or use default
  const freeElectiveRule = completedData.electiveRules?.find(rule => rule.category === 'Free Elective');
  const freeElectiveRequiredCredits = freeElectiveRule?.requiredCredits || 12; // Default to 12 if not found
  
  // For display purposes, convert to course equivalents (assuming 3 credits per course average)
  const freeElectiveCompleted = Math.ceil(freeElectiveCompletedCredits / 3);
  const freeElectivePlanned = Math.ceil(freeElectivePlannedCreditSum / 3);
  const freeElectiveTotal = Math.ceil(freeElectiveRequiredCredits / 3);
  
  if (typeof window !== 'undefined') {
    console.log('🔍 DEBUG: Free Elective calculations:', {
      completedCredits: freeElectiveCompletedCredits,
      plannedCredits: freeElectivePlannedCreditSum,
      requiredCredits: freeElectiveRequiredCredits,
      displayValues: { completed: freeElectiveCompleted, planned: freeElectivePlanned, total: freeElectiveTotal }
    });
  }
  
  const genEdCompleted = categoryStats['General Education']?.completed || 0;
  const genEdPlanned = categoryStats['General Education']?.planned || 0;
  const genEdTotal = allCoursesByCategory['General Education']?.length || 0;
  
  const generalCompleted = categoryStats['General']?.completed || 0;
  const generalPlanned = categoryStats['General']?.planned || 0;
  const generalTotal = allCoursesByCategory['General']?.length || 0;

  const unassignedCompleted = categoryStats['Unassigned']?.completed || 0;
  const unassignedPlanned = categoryStats['Unassigned']?.planned || 0;
  const unassignedTotal = categoryStats['Unassigned']?.total || 0;

  // PDF download handler
  const handleDownloadPDF = async () => {
    if (!pdfRef.current) return;
    const element = pdfRef.current;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Calculate image dimensions to fit A4
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 20, 20, imgWidth, imgHeight);
    pdf.save("progress-report.pdf");
  };

  // Export functions for CSV and Excel
  const exportToExcel = () => {
    // Prepare all courses data (both completed and planned)
    const allCourses: any[] = [];
    
    // Add all completed courses
    completedList.forEach(course => {
      allCourses.push({
        Title: course.title,
        Code: course.code,
        Credits: course.credits,
        Category: course.category,
        Grade: course.grade || '',
        Status: 'completed'
      });
    });
    
    // Add all planned courses
    plannedFromPlannerList.forEach((course: any) => {
      allCourses.push({
        Title: course.title,
        Code: course.code,
        Credits: course.credits,
        Category: course.category,
        Grade: '',
        Status: course.status || 'planning'
      });
    });

    const worksheetData: any[][] = [];
    worksheetData.push(['course data']); // Title (match CSV format)
    worksheetData.push([]); // Empty row
    
    // Group courses by category
    const groupedCourses: { [key: string]: any[] } = {};
    allCourses.forEach(course => {
      if (!groupedCourses[course.Category]) {
        groupedCourses[course.Category] = [];
      }
      groupedCourses[course.Category].push(course);
    });
    
    // Add each category section
    Object.entries(groupedCourses).forEach(([category, courses]) => {
      const totalCredits = courses.reduce((sum, course) => sum + (course.Credits || 0), 0);
      worksheetData.push([`${category} (${totalCredits} Credits)`]);
      
      courses.forEach(course => {
        const status = course.Status === 'completed' ? '' : course.Status;
        worksheetData.push([
          course.Title,
          course.Code,
          course.Credits,
          course.Grade,
          status
        ]);
      });
      
      worksheetData.push([]); // Empty row after each category
    });
    
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Course Data');
    XLSX.writeFile(wb, 'course data.xlsx');
  };

  const exportToCSV = () => {
    // Prepare all courses data (both completed and planned)
    const allCourses: any[] = [];
    
    // Add all completed courses
    completedList.forEach(course => {
      allCourses.push({
        Title: course.title,
        Code: course.code,
        Credits: course.credits,
        Category: course.category,
        Grade: course.grade || '',
        Status: 'completed'
      });
    });
    
    // Add all planned courses
    plannedFromPlannerList.forEach((course: any) => {
      allCourses.push({
        Title: course.title,
        Code: course.code,
        Credits: course.credits,
        Category: course.category,
        Grade: '',
        Status: course.status || 'planning'
      });
    });

    // Convert to curriculum transcript CSV format (match data-entry page exactly)
    const csvLines: string[] = [];
    csvLines.push('course data'); // Title
    csvLines.push(''); // Empty line
    
    // Group courses by category
    const groupedCourses: { [key: string]: any[] } = {};
    allCourses.forEach(course => {
      if (!groupedCourses[course.Category]) {
        groupedCourses[course.Category] = [];
      }
      groupedCourses[course.Category].push(course);
    });
    
    // Add each category section
    Object.entries(groupedCourses).forEach(([category, courses]) => {
      const totalCredits = courses.reduce((sum, course) => sum + (course.Credits || 0), 0);
      csvLines.push(`"${category} (${totalCredits} Credits)"`);
      
      courses.forEach(course => {
        const status = course.Status === 'completed' ? '' : course.Status;
        csvLines.push(`"${course.Title}","${course.Code}",${course.Credits},"${course.Grade}","${status}"`);
      });
      
      csvLines.push(''); // Empty line after each category
    });
    
    const csvContent = csvLines.join('\n');

    // Create and download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'course data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container py-8">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <button
            className="border border-input bg-background text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={() => router.push('/management/course-planning')}
          >
            <ArrowLeft size={16} />
            Back to Course Planner
          </button>
          
          <button
            className="border border-input bg-background text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => router.push('/management/data-entry')}
          >
            Course Entry
          </button>
        </div>
        <h2 className="text-xl font-bold">Academic Progress Overview</h2>
      </div>

      {/* Show loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading progress data...</p>
          </div>
        </div>
      )}

      {/* Show message if no data and not loading */}
      {!loading && !selectedCurriculum && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              No Student Data Found
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Please go to the Course Entry page first to set up your curriculum and add completed courses.
            </p>
            <button
              onClick={() => router.push('/management/data-entry')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Go to Course Entry
            </button>
          </div>
        </div>
      )}

      {/* Show progress data if available */}
      {!loading && selectedCurriculum && (
        <>
          {/* Blacklist Warnings Section */}
          {blacklistWarnings.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" size={20} />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200 mb-2">
                    Course Conflict Warnings
                  </h3>
                  <div className="space-y-2">
                    {blacklistWarnings.map((warning, index) => (
                      <p key={index} className="text-orange-700 dark:text-orange-300 text-sm">
                        {warning}
                      </p>
                    ))}
                  </div>
                  <p className="text-orange-600 dark:text-orange-400 text-xs mt-2">
                    Contact your academic advisor to review these course combinations and ensure they meet graduation requirements.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Validation Results Section */}
          {validationResult && (
            <>
              {/* Validation Errors */}
              {validationResult.errors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 dark:text-red-400 mt-1 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                        Validation Errors
                      </h3>
                      <div className="space-y-2">
                        {validationResult.errors.map((error, index) => (
                          <p key={index} className="text-red-700 dark:text-red-300 text-sm">
                            • {error}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-1 flex-shrink-0" size={20} />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                        Academic Warnings
                      </h3>
                      <div className="space-y-2">
                        {validationResult.warnings.map((warning, index) => (
                          <p key={index} className="text-yellow-700 dark:text-yellow-300 text-sm">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Course Recommendations */}
              {validationResult.recommendations && validationResult.recommendations.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0">💡</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
                        Course Recommendations
                      </h3>
                      <div className="space-y-3">
                        {validationResult.recommendations.map((rec, index) => (
                          <div key={index} className="bg-white dark:bg-slate-700 rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-blue-900 dark:text-blue-100">{rec.courseCode}</span>
                              <span className="text-sm bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                {rec.priority} priority
                              </span>
                              <span className="text-sm text-gray-600 dark:text-gray-400">{rec.credits} credits</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{rec.courseName}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.reason}</p>
                            {rec.prerequisites && rec.prerequisites.length > 0 && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                Prerequisites: {rec.prerequisites.join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={pdfRef} className="bg-white dark:bg-card rounded-xl p-6 mb-6 border border-gray-200 dark:border-border">
        {/* Custom Academic Progress Bar */}
        <div className="flex items-center relative h-24 mb-4 bg-gradient-to-r from-emerald-100 to-blue-100 dark:from-emerald-900/20 dark:to-blue-900/20 rounded-lg px-6">
          {/* Progress bar */}
          <div className="flex-1 relative h-4 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
            {/* Completed section */}
            <div 
              className={`absolute left-0 top-0 h-full bg-emerald-500 dark:bg-emerald-400 transition-all duration-700 ease-out shadow-sm ${
                percent >= 100 ? 'rounded-lg' : 'rounded-l-lg'
              }`}
              style={{ width: `${percent}%` }}
            ></div>
            
            {/* Planned section */}
            {projectedPercent > percent && (
              <div 
                className="absolute top-0 h-full bg-sky-300 dark:bg-sky-400 transition-all duration-700 ease-out rounded-r-lg"
                style={{ 
                  left: `${percent}%`, 
                  width: `${projectedPercent - percent}%` 
                }}
              ></div>
            )}
            
            {/* Progress milestones */}
            <div className="absolute inset-0 flex items-center justify-between px-2">
              {[25, 50, 75].map((milestone) => (
                <div 
                  key={milestone}
                  className="w-0.5 h-2 bg-white/40 dark:bg-gray-900/40 rounded-full"
                  style={{ marginLeft: `${milestone}%` }}
                ></div>
              ))}
            </div>
          </div>
          
          {/* Graduate label at the far right */}
          <div className="flex items-center ml-4">
            <GiGraduateCap className="mr-2 text-emerald-700 dark:text-emerald-300" size={24} />
            <span className="font-semibold text-lg text-emerald-700 dark:text-emerald-300">Graduate!</span>
          </div>
        </div>
        
        {/* Progress segments breakdown */}
        <div className="flex items-center justify-center gap-6 text-sm mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full"></div>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              Completed: {earnedCredits} credits
            </span>
          </div>
          {projectedPercent > percent && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-sky-300 dark:bg-sky-400 rounded-full"></div>
              <span className="font-medium text-sky-700 dark:text-sky-400">
                Planned: {plannedCredits} credits
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full"></div>
            <span className="text-muted-foreground">
              Remaining: {totalCreditsRequired - earnedCredits - plannedCredits} credits
            </span>
          </div>
        </div>
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Total Credits</div>
            <div className="text-2xl font-bold text-primary">
              {earnedCredits} 
              {plannedCredits > 0 && <span className="text-blue-600">+{plannedCredits}</span>}
              <span className="text-gray-400"> / {totalCreditsRequired}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">GPA</div>
            <div className="text-2xl font-bold text-primary">{gpa}</div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">General Education</div>
            <div className="text-xl font-bold text-primary">
              {genEdCompleted}
              {genEdPlanned > 0 && <span className="text-blue-600">+{genEdPlanned}</span>}
              <span className="text-gray-400"> / {genEdTotal}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Core Courses</div>
            <div className="text-xl font-bold text-primary">
              {coreCompleted}
              {corePlanned > 0 && <span className="text-blue-600">+{corePlanned}</span>}
              <span className="text-gray-400"> / {coreTotal}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Major</div>
            <div className="text-xl font-bold text-primary">
              {majorCompleted}
              {majorPlanned > 0 && <span className="text-blue-600">+{majorPlanned}</span>}
              <span className="text-gray-400"> / {majorTotal}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Major Elective</div>
            <div className="text-xl font-bold text-primary">
              {majorElectiveCompleted}
              {majorElectivePlanned > 0 && <span className="text-blue-600">+{majorElectivePlanned}</span>}
              <span className="text-gray-400"> / {majorElectiveTotal}</span>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-xs text-gray-500">Free Elective</div>
            <div className="text-xl font-bold text-primary">
              {freeElectiveCompleted}
              {freeElectivePlanned > 0 && <span className="text-blue-600">+{freeElectivePlanned}</span>}
              <span className="text-gray-400"> / {freeElectiveTotal}</span>
            </div>
          </div>
          {generalCompleted > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-xs text-gray-500">General</div>
              <div className="text-xl font-bold text-primary">
                {generalCompleted}
                {generalPlanned > 0 && <span className="text-blue-600">+{generalPlanned}</span>}
                <span className="text-gray-400"> / {generalTotal}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced Curriculum Progress Summary - HIDDEN */}
        {curriculumProgress && curriculumProgress.totalCreditsRequired > 0 ? (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 mb-6 border border-purple-200 dark:border-purple-800 hidden">
            <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4">📊 Enhanced Progress Analysis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {curriculumProgress.totalCreditsCompleted}
                  {curriculumProgress.totalCreditsInProgress > 0 && (
                    <span className="text-blue-600">+{curriculumProgress.totalCreditsInProgress}</span>
                  )}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Credits Completed</div>
                <div className="text-xs text-gray-500">of {curriculumProgress.totalCreditsRequired} required</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {curriculumProgress.totalCreditsRequired > 0 
                    ? Math.round((curriculumProgress.totalCreditsCompleted / curriculumProgress.totalCreditsRequired) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">Overall Progress</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {curriculumProgress.graduationEligibility?.eligible ? '✅' : '⏳'}
                </div>
                <div className="text-sm text-purple-600 dark:text-purple-400">
                  {curriculumProgress.graduationEligibility?.eligible ? 'Eligible' : 'In Progress'}
                </div>
                <div className="text-xs text-gray-500">Graduation Status</div>
              </div>
            </div>
            
            {/* Category Breakdown */}
            {curriculumProgress.categoryProgress && Object.keys(curriculumProgress.categoryProgress).length > 0 && (
              <div className="mt-4">
                <h4 className="text-md font-semibold text-purple-800 dark:text-purple-200 mb-2">Category Progress Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(curriculumProgress.categoryProgress).map(([category, progress]) => (
                    <div key={category} className="bg-white dark:bg-slate-700 rounded-lg p-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{category}</div>
                      <div className="text-purple-700 dark:text-purple-300">
                        {progress.completed}
                        {progress.inProgress > 0 && <span className="text-blue-600">+{progress.inProgress}</span>}
                        <span className="text-gray-500"> / {progress.required}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {progress.remaining > 0 ? `${progress.remaining} remaining` : 'Complete'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Elective Progress */}
            {curriculumProgress.electiveProgress && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Free Electives</h5>
                  <div className="text-lg text-purple-700 dark:text-purple-300">
                    {curriculumProgress.electiveProgress.freeElectives.completed} / {curriculumProgress.electiveProgress.freeElectives.required}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {curriculumProgress.electiveProgress.freeElectives.remaining} credits remaining
                  </div>
                </div>
                
                <div className="bg-white dark:bg-slate-700 rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Major Electives</h5>
                  <div className="text-lg text-purple-700 dark:text-purple-300">
                    {curriculumProgress.electiveProgress.majorElectives.completed} / {curriculumProgress.electiveProgress.majorElectives.required}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {curriculumProgress.electiveProgress.majorElectives.remaining} credits remaining
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-6 mb-6 border border-yellow-200 dark:border-yellow-800 hidden">
            <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-2">📊 Enhanced Progress Analysis</h3>
            <p className="text-yellow-700 dark:text-yellow-300">
              Enhanced progress analysis is temporarily unavailable. This may occur if curriculum data is still loading or if there are validation issues.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
              The basic progress summary above should still provide accurate information about your completed courses.
            </p>
          </div>
        )}
      </div>
      {/* Completed and Planned Courses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[150px]">
          <h3 className="text-lg font-bold mb-3">Completed Courses</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {completedList.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No completed courses yet.</div>
            ) : (
              completedList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-3 py-2">
                  <span className="font-semibold text-xs text-green-800 dark:text-green-200">{c.code} - {c.title}</span>
                  <div className="text-xs text-green-600 dark:text-green-400">
                    {c.category}{c.grade ? ` • ${c.grade}` : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[150px]">
          <h3 className="text-lg font-bold mb-3">Planned Courses <span className="text-sm text-blue-600">(From Course Planner)</span></h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {plannedFromPlannerList.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No courses planned yet. <br /><span className="text-xs">Use the Course Planner to add courses.</span></div>
            ) : (
              plannedFromPlannerList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded px-3 py-2">
                  <span className="font-semibold text-xs text-blue-800 dark:text-blue-200">{c.code} - {c.title}</span>
                  <div className="text-xs text-blue-600 dark:text-blue-400">
                    {c.category} • {c.semester} {c.year}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Add Concentration Analysis Section */}
      {concentrationAnalysis.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xl font-bold mb-4">Concentration Progress</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {concentrationAnalysis.map((analysis) => (
              <div key={analysis.concentration.id} className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{analysis.concentration.name}</h4>
                    {analysis.concentration.description && (
                      <p className="text-sm text-muted-foreground">{analysis.concentration.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${analysis.isEligible ? 'text-green-600' : 'text-blue-600'}`}>
                      {Math.round(analysis.progress)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {analysis.completedCourses.length + analysis.plannedCourses.length} / {analysis.concentration.requiredCourses}
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                  <div 
                    className={`h-2 rounded-full transition-all ${
                      analysis.isEligible ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, analysis.progress)}%` }}
                  />
                </div>
                
                {/* Course breakdown */}
                <div className="space-y-2">
                  {analysis.completedCourses.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-green-600">Completed:</span> {analysis.completedCourses.join(', ')}
                    </div>
                  )}
                  {analysis.plannedCourses.length > 0 && (
                    <div className="text-sm">
                      <span className="font-medium text-blue-600">Planned:</span> {analysis.plannedCourses.join(', ')}
                    </div>
                  )}
                  {analysis.remainingCourses > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {analysis.remainingCourses} more course{analysis.remainingCourses !== 1 ? 's' : ''} needed
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[300px]">
          <h3 className="text-lg font-bold mb-3">Remaining Courses</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {pendingList.length === 0 ? (
              <div className="text-gray-400 text-center py-8">All courses completed or planned! 🎉</div>
            ) : (
              pendingList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded px-3 py-2">
                  <span className="font-semibold text-xs">{c.code} - {c.title}</span>
                  <span className="text-xs text-gray-500">{c.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-8">
        {/* Export Data Dropdown */}
        {!loading && selectedCurriculum && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="default"
                className="bg-purple-600 hover:bg-purple-600/90 text-white min-w-[180px] shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                Download Data
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                Download as XLSX
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportToCSV} className="cursor-pointer">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
                </svg>
                Download as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        
        <button
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleDownloadPDF}
        >
          Download as PDF
        </button>
      </div>
        </>
      )}
    </div>
  );
}