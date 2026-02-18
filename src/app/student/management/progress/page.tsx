"use client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from 'xlsx';
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToastHelpers } from '@/hooks/useToast';
import { curriculumBlacklistApi, type CurriculumBlacklistsResponse } from '@/services/curriculumBlacklistApi';
import { getPublicCurricula, getPublicCurriculum, API_BASE } from '@/lib/api/laravel';
import { AlertTriangle, ArrowLeft, Download, ChevronDown, BookOpen, Calendar, Plus, Target, Award, Clock } from "lucide-react";
import { GiGraduateCap } from "react-icons/gi";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { 
  validateStudentProgress, 
  calculateCurriculumProgress,
  type StudentCourseData,
  type ValidationResult,
  type CurriculumProgress
} from "@/lib/validation/courseValidation";

// Enhanced Donut Chart Component with Gradient and Shadow Effects
const DonutChart = ({ 
  completed, 
  planned, 
  total, 
  size = 120, 
  strokeWidth = 12 
}: { 
  completed: number; 
  planned: number; 
  total: number; 
  size?: number; 
  strokeWidth?: number; 
}) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  
  const completedPercent = total > 0 ? (completed / total) * 100 : 0;
  const plannedPercent = total > 0 ? (planned / total) * 100 : 0;
  const totalPercent = completedPercent + plannedPercent;
  
  const completedOffset = circumference - (completedPercent / 100) * circumference;
  const plannedOffset = circumference - (totalPercent / 100) * circumference;
  
  // Generate unique IDs for gradients
  const completedGradientId = `completed-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const plannedGradientId = `planned-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <div className="relative flex items-center justify-center drop-shadow-sm">
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90 filter drop-shadow-sm"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}
      >
        {/* Define gradients */}
        <defs>
          <linearGradient id={completedGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14b8a6" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id={plannedGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
          {/* Shadow filter */}
          <filter id="shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3"/>
          </filter>
        </defs>
        
        {/* Background circle with subtle shadow */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="transparent"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth - 2}
          className="dark:stroke-gray-700"
        />
        
        {/* Planned courses arc with gradient */}
        {plannedPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={`url(#${plannedGradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={plannedOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-in-out"
            filter="url(#shadow)"
          />
        )}
        
        {/* Completed courses arc with gradient */}
        {completedPercent > 0 && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke={`url(#${completedGradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={completedOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-in-out"
            filter="url(#shadow)"
          />
        )}
      </svg>
      
      {/* Enhanced center content with better typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <div className="text-2xl font-bold bg-gradient-to-br from-teal-500 to-emerald-500 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
          {Math.round(totalPercent)}%
        </div>
      </div>
    </div>
  );
};

// categoryOrder is now dynamically determined inside the component

interface CourseStatus {
  status: 'pending' | 'not_completed' | 'completed' | 'failed' | 'withdrawn' | 'planning' | 'in_progress';
  grade?: string;
  plannedSemester?: string;
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
  year?: number;
  semesterLabel?: string;
  status: 'planning'; // Now only supports 'planning' status
}

const getSuggestedSemesterLabel = (value?: string) => {
  const currentYear = new Date().getFullYear();
  if (value === '2') return `2/${currentYear}`;
  if (value === 'summer' || value === '3') return `3/${currentYear}`;
  return `1/${currentYear}`;
};

const normalizeSemesterLabel = (label?: string, semester?: string, year?: number) => {
  if (label && label.includes('/')) {
    return label;
  }
  if (semester && typeof year !== 'undefined') {
    const prefix = semester === 'summer' ? '3' : semester;
    return `${prefix}/${year}`;
  }
  return getSuggestedSemesterLabel(semester);
};

const getDisplaySemesterLabel = (semesterLabel?: string, semester?: string, year?: number) => {
  if (semesterLabel) return semesterLabel;
  if (semester === 'summer') {
    return year ? `Summer Session / ${year}` : 'Summer Session';
  }
  if (semester) {
    return year ? `Semester ${semester} / ${year}` : `Semester ${semester}`;
  }
  return 'Semester 1';
};

const deriveSemesterValueFromLabel = (label?: string, fallback?: string) => {
  if (fallback) return fallback;
  if (!label) return '1';
  const prefix = label.split('/')[0]?.trim();
  if (prefix === '3') return 'summer';
  if (prefix === '2') return '2';
  return '1';
};

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

type GraduationExportRow = {
  Title: string;
  Code: string;
  Credits: number;
  Category: string;
  Grade: string;
  Status: string;
  RawStatus: CourseStatus['status'] | 'pending';
  Semester: string;
};

const normalizeExportStatus = (status?: CourseStatus['status'] | 'pending') => {
  if (!status) return 'pending';
  if (status === 'not_completed') return 'pending';
  return status;
};

const isPendingExportStatus = (status?: CourseStatus['status'] | 'pending') => {
  return normalizeExportStatus(status) === 'pending';
};

const getExportStatusLabel = (status?: CourseStatus['status'] | 'pending') => {
  const normalized = normalizeExportStatus(status);
  switch (normalized) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'Currently Taking';
    case 'planning':
      return 'Planned';
    case 'failed':
      return 'Failed';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return 'Pending';
  }
};

const shouldHighlightExportRow = (status?: CourseStatus['status'] | 'pending') => {
  return !isPendingExportStatus(status);
};

const calculateActiveCredits = (courses: GraduationExportRow[]) => {
  return courses.reduce((sum, course) => {
    if (isPendingExportStatus(course.RawStatus)) return sum;
    return sum + (course.Credits || 0);
  }, 0);
};

const escapeCsvValue = (value: string | number | null | undefined) => {
  const stringValue = value === null || typeof value === 'undefined' ? '' : String(value);
  return `"${stringValue.replace(/"/g, '""')}"`;
};

const formatSemesterForCsvValue = (value?: string) => {
  if (!value) return '';
  return `="${value}"`;
};

const formatCsvRow = (values: Array<string | number | null | undefined>) => {
  return values.map(escapeCsvValue).join(',');
};

export default function ProgressPage() {
  const router = useRouter();
  const toast = useToastHelpers();
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
  const [curriculumError, setCurriculumError] = useState<string | null>(null);
  const [blacklistData, setBlacklistData] = useState<CurriculumBlacklistsResponse | null>(null);
  const [blacklistWarnings, setBlacklistWarnings] = useState<string[]>([]);
  const [savedTotalCredits, setSavedTotalCredits] = useState<number | null>(null); // Store credits from localStorage
  
  // Enhanced validation states
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [curriculumProgress, setCurriculumProgress] = useState<CurriculumProgress | null>(null);
  
  // Debug: Track when curriculumData changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 CURRICULUM DATA CHANGED:', curriculumData);
      console.log('🔍 CURRICULUM totalCreditsRequired:', curriculumData?.totalCreditsRequired);
    }
  }, [curriculumData]);
  
  // Load all data from localStorage and fetch curriculum data
  useEffect(() => {
    console.log('🔥 USEEFFECT STARTED - Loading progress page data');
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
        let curriculumId: string | null = null;

        if (savedCompletedData) {
          parsedData = JSON.parse(savedCompletedData);
          if (typeof window !== 'undefined') {
            console.log('Step 3: Parsed studentAuditData:', parsedData);
          }

          // Support both array and object
          const auditObj = Array.isArray(parsedData) ? parsedData[0] : parsedData;
          curriculumId = auditObj?.selectedCurriculum || null;
          
          if (typeof window !== 'undefined') {
            console.log('Step 3a: Extracted curriculumId:', curriculumId);
            console.log('Step 3b: auditObj keys:', auditObj ? Object.keys(auditObj) : 'null');
          }

          // Extract and save total credits from localStorage
          if (auditObj?.curriculumCreditsRequired) {
            setSavedTotalCredits(auditObj.curriculumCreditsRequired);
            if (typeof window !== 'undefined') {
              console.log('Found saved total credits:', auditObj.curriculumCreditsRequired);
            }
          }

          // Only set data if auditObj is not null
          if (auditObj) {
            setCompletedData(auditObj);
          }

          // Fetch curriculum data if we have a curriculum ID
          if (curriculumId) {
            if (typeof window !== 'undefined') {
              console.log('Step 4: Fetching curriculum for ID:', curriculumId);
            }
            try {
              const data = await getPublicCurriculum(curriculumId);
              if (typeof window !== 'undefined') {
                console.log('Step 5: API response:', data);
                console.log('Step 5a: API response type:', typeof data);
                console.log('Step 5b: API curriculum object:', data.curriculum);
                console.log('Step 5c: API totalCreditsRequired:', data.curriculum?.totalCreditsRequired);
              }
              // The API returns { curriculum: {...} } for single curriculum fetch
              const curriculum = data.curriculum || data;
              if (curriculum) {
                if (typeof window !== 'undefined') {
                  console.log('Step 6: Found curriculum data:', curriculum);
                  console.log('Step 6a: Curriculum totalCreditsRequired:', curriculum.totalCreditsRequired);
                  console.log('Step 6b: Setting curriculum data...');
                }
                setCurriculumData(curriculum);
                if (typeof window !== 'undefined') {
                  console.log('Step 6c: Curriculum data set successfully');
                }
              } else {
                if (typeof window !== 'undefined') {
                  console.log('Step 6: No curriculum found with ID:', curriculumId);
                }
              }
            } catch (error) {
              if (typeof window !== 'undefined') {
                console.error('Step 6: Error fetching curriculum data:', error);
                if (error instanceof Error) {
                  console.error('Error message:', error.message);
                  // Show user-friendly error if curriculum doesn't exist
                  if (error.message.includes('404') || error.message.includes('not found')) {
                    console.error('⚠️ CURRICULUM NOT FOUND: The curriculum ID saved in your data does not exist in the database.');
                    console.error('This may happen if:');
                    console.error('1. The curriculum was deleted from the system');
                    console.error('2. You copied data from a different environment');
                    console.error('3. The database was reset');
                    console.error('');
                    console.error('Solution: Go to Data Entry page and select a valid curriculum again.');
                    setCurriculumError(`Curriculum not found in database (ID: ${curriculumId}). Please select a valid curriculum in Course Entry.`);
                  } else {
                    setCurriculumError(`Failed to load curriculum data: ${error.message}`);
                  }
                }
              }
            }
          } else {
            if (typeof window !== 'undefined') {
              console.log('Step 4: No curriculum ID found in saved data');
              console.log('Step 4a: Trying fallback with selectedCurriculum from completedData state');
              
              // Try to get curriculum ID from the completedData state as fallback
              if (completedData?.selectedCurriculum) {
                console.log('Step 4b: Found fallback curriculum ID:', completedData.selectedCurriculum);
                try {
                  const data = await getPublicCurriculum(completedData.selectedCurriculum);
                  console.log('Step 4c: Fallback API response:', data);
                  const curriculum = data.curriculum || data;
                  if (curriculum) {
                    console.log('Step 4d: Setting curriculum data from fallback');
                    setCurriculumData(curriculum);
                  }
                } catch (error) {
                  console.error('Step 4e: Fallback curriculum fetch failed:', error);
                }
              }
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
            const normalizedPlan = (planData.plannedCourses || []).map((course: any) => {
              const normalizedLabel = normalizeSemesterLabel(course.semesterLabel, course.semester, course.year);
              return {
                ...course,
                semesterLabel: normalizedLabel,
                semester: deriveSemesterValueFromLabel(normalizedLabel, course.semester)
              };
            });
            setPlannedCourses(normalizedPlan);
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

  // Fallback useEffect: If we have a curriculum ID but no curriculum data, try to fetch it
  useEffect(() => {
    if (completedData?.selectedCurriculum && !curriculumData) {
      console.log('🚀 FALLBACK USEEFFECT: Attempting to fetch curriculum data for:', completedData.selectedCurriculum);
      const fetchCurriculumFallback = async () => {
        try {
          const data = await getPublicCurriculum(completedData.selectedCurriculum);
          console.log('🚀 FALLBACK: API response:', data);
          const curriculum = data.curriculum || data;
          if (curriculum) {
            console.log('🚀 FALLBACK: Setting curriculum data');
            setCurriculumData(curriculum);
          }
        } catch (error) {
          console.error('🚀 FALLBACK: Error:', error);
        }
      };
      fetchCurriculumFallback();
    }
  }, [completedData?.selectedCurriculum, curriculumData]);

  // Debug function to check localStorage content
  const debugLocalStorage = () => {
    if (typeof window !== 'undefined') {
      const studentData = localStorage.getItem('studentAuditData');
      console.log('🔍 CURRENT localStorage studentAuditData:', studentData);
      if (studentData) {
        try {
          const parsed = JSON.parse(studentData);
          console.log('🔍 PARSED data:', parsed);
          console.log('🔍 selectedCurriculum:', parsed?.selectedCurriculum);
        } catch (e) {
          console.log('🔍 PARSE ERROR:', e);
        }
      }
    }
  };

  // Call debug function on component render to see current state
  if (typeof window !== 'undefined') {
    debugLocalStorage();
  }

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
      const curriculaData = await getPublicCurricula();
      const currentCurriculum = curriculaData.curricula?.find((c: any) => c.id === data.selectedCurriculum);
      
      if (!currentCurriculum?.department?.id) {
        if (typeof window !== 'undefined') {
          console.log('🔍 DEBUG: No department ID found for concentration analysis');
        }
        return;
      }

      // Fetch concentrations
      const concResponse = await fetch(`${API_BASE}/public-concentrations?curriculum_id=${data.selectedCurriculum}&department_id=${currentCurriculum.department.id}`, {
        credentials: 'include'
      });
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
      const response = await fetch(`${API_BASE}/public-curricula/${curriculumId}/blacklists`, {
        credentials: 'include'
      });
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
  const [openCreditCardKey, setOpenCreditCardKey] = useState<string | null>(null);

  // Function to fetch all course data at once
  const fetchAllCourseData = async (): Promise<{ [courseCode: string]: { credits: number; title: string } }> => {
    try {
      if (!completedData.actualDepartmentId && !completedData.selectedDepartment) {
        console.warn('[fetchAllCourseData] No department ID available. Skipping fetch.');
        return {};
      }
  
      const departmentId = completedData.actualDepartmentId || completedData.selectedDepartment;
      const curriculumId = selectedCurriculum;
      const url = `${API_BASE}/available-courses?curriculum_id=${curriculumId}&department_id=${departmentId}`;
      console.log('[fetchAllCourseData] Fetching courses with:', { curriculumId, departmentId, url });
  
      const response = await fetch(url, {
        credentials: 'include'
      });
  
      // Log status and headers
      console.log('[fetchAllCourseData] Response status:', response.status);
      console.log('[fetchAllCourseData] Response headers:', response.headers);
  
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[fetchAllCourseData] Non-JSON response:', text);
        return {};
      }
  
      const data = await response.json();
      console.log('[fetchAllCourseData] Response JSON:', data);
  
      if (response.ok && data.courses) {
        const courseMap: { [courseCode: string]: { credits: number; title: string } } = {};
        data.courses.forEach((course: any) => {
          courseMap[course.code] = {
            credits: course.credits || 3,
            title: course.title || course.code
          };
        });
        setCourseDataCache(courseMap);
        console.log('[fetchAllCourseData] Course map created:', courseMap);
        return courseMap;
      } else {
        console.warn('[fetchAllCourseData] No courses found in response or response not OK.');
      }
  
      return {};
    } catch (error) {
      console.error('[fetchAllCourseData] Could not fetch course data:', error);
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
          status = 'IN_PROGRESS'; 
          break;
        case 'in_progress':
          status = 'IN_PROGRESS';
          break;
        case 'failed':
          status = 'FAILED';
          break;
        case 'withdrawn':
          status = 'DROPPED';
          break;
        case 'pending':
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
    console.log('📊 PROGRESS STATE DEBUG:');
    console.log('- completedCourses object:', completedCourses);
    console.log('- completedCourses keys:', Object.keys(completedCourses));
    console.log('- Sample completed course:', Object.keys(completedCourses)[0], completedCourses[Object.keys(completedCourses)[0]]);
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
    
    // Category name normalization mapping
    const normalizeCategory = (category: string): string => {
      const categoryMap: { [key: string]: string } = {
        // General Education variations
        'general education': 'General Education',
        'general_education': 'General Education',
        'gen ed': 'General Education',
        'gened': 'General Education',
        // Core Courses variations
        'core': 'Core Courses',
        'core courses': 'Core Courses',
        'core_courses': 'Core Courses',
        // Major variations
        'major': 'Major',
        'major courses': 'Major',
        'major_courses': 'Major',
        // Major Elective variations
        'major elective': 'Major Elective',
        'major electives': 'Major Elective',
        'major_elective': 'Major Elective',
        'major_electives': 'Major Elective',
        // Free Elective variations
        'free elective': 'Free Elective',
        'free electives': 'Free Elective',
        'free_elective': 'Free Elective',
        'free_electives': 'Free Elective',
        'elective': 'Free Elective',
        // Uncategorized
        'uncategorized': 'Uncategorized',
        'unassigned': 'Uncategorized',
      };
      const normalized = categoryMap[category.toLowerCase()] || category;
      return normalized;
    };
    
    // Transform real curriculum data into the format we need
    const coursesByCategory: { [category: string]: { code: string; title: string; credits: number }[] } = {};
    
    curriculumData.curriculumCourses.forEach((course: any, index: number) => {
      if (typeof window !== 'undefined') {
        console.log(`🔍 DEBUG: Processing course ${index}:`, {
          fullCourse: course,
          courseObj: course.course,
          directCategory: course.course?.category,
          departmentCourseTypes: course.course?.departmentCourseTypes,
          directDepartmentCourseType: course.departmentCourseType,
          hasDirectType: !!course.departmentCourseType,
          hasNestedTypes: !!course.course?.departmentCourseTypes,
          nestedTypesLength: course.course?.departmentCourseTypes?.length || 0,
          rawCredits: course.course.credits
        });
      }
      
      // Use the curriculum-specific department course type mapping
      let category = 'Uncategorized';
      
      // Method 0: Use pre-computed category from API (most reliable)
      if (course.course?.category && course.course.category !== 'Uncategorized') {
        category = normalizeCategory(course.course.category);
        if (typeof window !== 'undefined') {
          console.log(`🔍 Method 0 - API category: ${course.course.category} -> Normalized: ${category}`);
        }
      }
      // Method 1: Direct departmentCourseType with curriculum mapping
      else if (course.departmentCourseType?.name) {
        const departmentTypeName = course.departmentCourseType.name;
        const mappedCategory = departmentCourseTypes[departmentTypeName] || departmentTypeName || 'Uncategorized';
        category = normalizeCategory(mappedCategory);
        if (typeof window !== 'undefined') {
          console.log(`🔍 Method 1 - Direct type: ${departmentTypeName} -> Mapped: ${mappedCategory} -> Normalized: ${category}`);
        }
      }
      // Method 2: From nested departmentCourseTypes array with curriculum mapping
      else if (course.course?.departmentCourseTypes?.length > 0) {
        const firstType = course.course.departmentCourseTypes[0];
        const departmentTypeName = firstType.courseType?.name || firstType.name;
        const mappedCategory = departmentCourseTypes[departmentTypeName] || departmentTypeName || 'Uncategorized';
        category = normalizeCategory(mappedCategory);
        if (typeof window !== 'undefined') {
          console.log(`🔍 Method 2 - Nested type: ${departmentTypeName} -> Mapped: ${mappedCategory} -> Normalized: ${category}`, firstType);
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
      console.log('🔍 DEBUG: Categories found:', Object.keys(coursesByCategory));
      console.log('🔍 DEBUG: Course counts per category:', 
        Object.fromEntries(Object.entries(coursesByCategory).map(([k, v]) => [k, v.length]))
      );
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

  // Debug: Show what categories exist in allCoursesByCategory
  if (typeof window !== 'undefined') {
    console.log('📊 FINAL allCoursesByCategory:');
    console.log('- Categories:', Object.keys(allCoursesByCategory));
    console.log('- Course counts:', Object.fromEntries(
      Object.entries(allCoursesByCategory).map(([k, v]) => [k, v.length])
    ));
    console.log('- Looking for: General Education =', allCoursesByCategory['General Education']?.length || 0);
    console.log('- Looking for: Core Courses =', allCoursesByCategory['Core Courses']?.length || 0);
    console.log('- Looking for: Major =', allCoursesByCategory['Major']?.length || 0);
    console.log('- Looking for: Major Elective =', allCoursesByCategory['Major Elective']?.length || 0);
    console.log('- Looking for: Free Elective =', allCoursesByCategory['Free Elective']?.length || 0);
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
        let category = 'Uncategorized';
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
      'Uncategorized'
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
  let inProgressCredits = 0;
  let totalGradePoints = 0;
  let totalGpaCredits = 0;
  const categoryStats: { [category: string]: { completed: number; total: number; earned: number; totalCredits: number; planned: number; plannedCredits: number } } = {};
  const completedList: any[] = [];
  const takingList: any[] = [];
  const plannedFromPlannerList: any[] = [];
  const pendingList: any[] = [];

  // Get planned courses by code for easy lookup
  const plannedCoursesMap = new Map(plannedCourses.map(course => [course.code, course]));

  // Debug credit calculation
  if (typeof window !== 'undefined') {
    console.log('💰 CREDIT CALCULATION DEBUG:');
    console.log('- Total categories to process:', categoryOrder.length);
    console.log('- Categories:', categoryOrder);
    console.log('- completedCourses available:', Object.keys(completedCourses).length);
    console.log('- First 5 completed course codes:', Object.keys(completedCourses).slice(0, 5));
  }

  for (const category of categoryOrder) {
    const courses = allCoursesByCategory[category] || [];
    let completedCount = 0;
    let plannedCount = 0;
    let earnedCategoryCredits = 0;
    let totalCategoryCredits = 0;
    let plannedCategoryCredits = 0;
    
    for (const c of courses) {
      totalCategoryCredits += c.credits;
      const courseState = completedCourses[c.code];
      const status = courseState?.status;
      const plannedCourse = plannedCoursesMap.get(c.code);
      const isCurrentlyTaking = status === 'in_progress';
      
      if (status === 'completed') {
        completedList.push({
          ...c,
          category,
          grade: completedCourses[c.code]?.grade,
          source: 'completed',
          semesterLabel: completedCourses[c.code]?.plannedSemester
        });
        earnedCredits += c.credits;
        earnedCategoryCredits += c.credits;
        completedCount++;
        // GPA calculation
        const grade = completedCourses[c.code]?.grade;
        if (grade && gradeToGPA[grade] !== undefined) {
          totalGradePoints += gradeToGPA[grade] * c.credits;
          totalGpaCredits += c.credits;
        }
      } else if (isCurrentlyTaking) {
        takingList.push({
          ...c,
          category,
          source: 'in_progress',
          semesterLabel: courseState?.plannedSemester,
        });
        inProgressCredits += c.credits;
      } else if (plannedCourse) {
        // Course is in the planner
        plannedFromPlannerList.push({ 
          ...c, 
          category, 
          source: 'planner',
          semester: plannedCourse.semester,
          semesterLabel: plannedCourse.semesterLabel,
          year: plannedCourse.year,
          status: plannedCourse.status
        });
        plannedCredits += c.credits;
        plannedCount++;
        plannedCategoryCredits += c.credits;
      } else {
        pendingList.push({
          ...c,
          category,
          source: 'pending',
          status: status || 'pending'
        });
      }
    }
    
    categoryStats[category] = {
      completed: completedCount,
      planned: plannedCount,
      total: courses.length,
      earned: earnedCategoryCredits,
      totalCredits: totalCategoryCredits,
      plannedCredits: plannedCategoryCredits,
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
    const isOutsideCurriculum = !coursesInCategories.has(courseCode);
    if (courseStatus.status === 'completed' && isOutsideCurriculum) {
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
        source: 'completed',
        semesterLabel: courseStatus.plannedSemester
      });
      
      // Update statistics
      earnedCredits += credits;
      if (!categoryStats[category]) {
        categoryStats[category] = { completed: 0, planned: 0, total: 0, earned: 0, totalCredits: 0, plannedCredits: 0 };
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
    } else if (courseStatus.status === 'in_progress' && isOutsideCurriculum) {
      const category = 'Free Elective';
      const credits = 3;
      takingList.push({
        code: courseCode,
        title: courseCode,
        credits,
        category,
        source: 'in_progress',
        semesterLabel: courseStatus.plannedSemester,
      });
      inProgressCredits += credits;
    }
  });
  
  // Handle planned courses that aren't in predefined curriculum categories
  // These should be treated as Free Electives as per user specification
  plannedCourses.forEach(plannedCourse => {
    if (!coursesInCategories.has(plannedCourse.code)) {
      if (completedCourses[plannedCourse.code]?.status === 'in_progress') {
        return;
      }
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
        semesterLabel: plannedCourse.semesterLabel,
        year: plannedCourse.year,
        status: plannedCourse.status
      });
      
      // Update statistics
      plannedCredits += plannedCourse.credits;
      if (!categoryStats[category]) {
        categoryStats[category] = { completed: 0, planned: 0, total: 0, earned: 0, totalCredits: 0, plannedCredits: 0 };
      }
      categoryStats[category].planned += 1;
      categoryStats[category].total += 1;
      categoryStats[category].totalCredits += plannedCourse.credits;
      categoryStats[category].plannedCredits += plannedCourse.credits;
    }
  });

  if (typeof window !== 'undefined') {
    console.log('🔍 DEBUG: Final completed courses list:', completedList);
    console.log('🔍 DEBUG: Final planned courses list:', plannedFromPlannerList);
    console.log('🔍 DEBUG: Final category stats:', categoryStats);
  }
  
  const totalCreditsRequired = (() => {
    if (typeof window !== 'undefined') {
      console.log('🔍 CALCULATING TOTAL CREDITS REQUIRED...');
      console.log('🔍 CURRENT curriculumData state:', curriculumData);
      console.log('🔍 CURRENT savedTotalCredits:', savedTotalCredits);
    }
    
    // First priority: credits saved from data-entry page (most accurate)
    if (typeof savedTotalCredits === 'number' && savedTotalCredits > 0) {
      console.log('Using saved total credits from localStorage:', savedTotalCredits);
      return savedTotalCredits;
    }
    
    // Debug: Show what's in curriculumData
    if (typeof window !== 'undefined') {
      console.log('🔍 DEBUG: curriculumData object:', curriculumData);
      console.log('🔍 DEBUG: curriculumData.totalCreditsRequired:', curriculumData?.totalCreditsRequired);
      console.log('🔍 DEBUG: curriculumData.totalCredits:', curriculumData?.totalCredits);
      console.log('🔍 DEBUG: curriculumProgress:', curriculumProgress);
    }
    
    // Second priority: try multiple possible paths for total credits in the curriculum data
    if (typeof curriculumData?.totalCreditsRequired === 'number' && curriculumData.totalCreditsRequired > 0) {
      console.log('Using totalCreditsRequired from curriculumData:', curriculumData.totalCreditsRequired);
      return curriculumData.totalCreditsRequired;
    }
    if (typeof curriculumData?.totalCredits === 'number' && curriculumData.totalCredits > 0) {
      console.log('Using totalCredits from curriculumData:', curriculumData.totalCredits);
      return curriculumData.totalCredits;
    }
    if (typeof curriculumProgress?.totalCreditsRequired === 'number' && curriculumProgress.totalCreditsRequired > 0) {
      console.log('Using totalCreditsRequired from curriculumProgress:', curriculumProgress.totalCreditsRequired);
      return curriculumProgress.totalCreditsRequired;
    }
    
    // Third priority: calculate from course data if available
    if (curriculumData?.curriculumCourses?.length > 0) {
      const calculatedTotal = curriculumData.curriculumCourses.reduce((sum: number, cc: any) => {
        const credits = parseCredits(cc.course?.credits);
        return sum + credits;
      }, 0);
      if (calculatedTotal > 0) {
        console.log('Calculated total credits from curriculum courses:', calculatedTotal);
        return calculatedTotal;
      }
    }
    
    // Fallback to 132 only if no curriculum data is available
    console.warn('No total credits found in any source, using fallback of 132');
    return 132;
  })();

  const gpa = totalGpaCredits > 0 ? (totalGradePoints / totalGpaCredits).toFixed(2) : 'N/A';

  // Debug final calculation results
  if (typeof window !== 'undefined') {
    console.log('✅ FINAL CREDIT CALCULATION RESULTS:');
    console.log('- Earned Credits:', earnedCredits);
    console.log('- Planned Credits:', plannedCredits);
    console.log('- In Progress Credits:', inProgressCredits);
    console.log('- Total Credits Required:', totalCreditsRequired);
    console.log('- GPA:', gpa);
    console.log('- Total Grade Points:', totalGradePoints);
    console.log('- Total GPA Credits:', totalGpaCredits);
    console.log('- Completed Courses Count:', completedList.length);
    console.log('- Planned Courses Count:', plannedFromPlannerList.length);
  }

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

  const uncategorizedCompleted = categoryStats['Uncategorized']?.completed || 0;
  const uncategorizedPlanned = categoryStats['Uncategorized']?.planned || 0;
  const uncategorizedTotal = categoryStats['Uncategorized']?.total || 0;

  type CourseStatusKey = 'completed' | 'in_progress' | 'planned';

  type CategorizedCourseEntry = {
    code: string;
    title: string;
    credits: number;
    category: string;
    semesterLabel?: string;
    status: CourseStatusKey;
  };

  interface CategoryCreditDetail {
    requiredCredits: number;
    completedCredits: number;
    inProgressCredits: number;
    plannedCredits: number;
    coursesByStatus: Record<CourseStatusKey, CategorizedCourseEntry[]>;
  }

  const categoryCreditDetails: Record<string, CategoryCreditDetail> = {};

  const getCourseCredits = (course: { code?: string; credits?: number }) => {
    if (!course) return 0;
    const cacheEntry = course.code ? courseDataCache[course.code] : undefined;
    return course.credits ?? cacheEntry?.credits ?? 0;
  };

  const ensureCategoryDetail = (categoryName: string): CategoryCreditDetail => {
    const safeCategory = categoryName || 'Uncategorized';
    if (!categoryCreditDetails[safeCategory]) {
      const requiredFromStats = categoryStats[safeCategory]?.totalCredits || 0;
      const fallbackRequirement = safeCategory === 'Free Elective'
        ? freeElectiveRequiredCredits
        : (allCoursesByCategory[safeCategory]?.reduce((sum, course) => sum + (course.credits || 0), 0) || 0);

      categoryCreditDetails[safeCategory] = {
        requiredCredits: requiredFromStats || fallbackRequirement,
        completedCredits: 0,
        inProgressCredits: 0,
        plannedCredits: 0,
        coursesByStatus: {
          completed: [],
          in_progress: [],
          planned: [],
        },
      };
    }
    return categoryCreditDetails[safeCategory];
  };

  const registerCoursesForDetail = (courses: any[], status: CourseStatusKey) => {
    courses.forEach(course => {
      const category = course.category || 'Uncategorized';
      const detail = ensureCategoryDetail(category);
      const credits = getCourseCredits(course);
      const normalized: CategorizedCourseEntry = {
        code: course.code,
        title: course.title,
        credits,
        category,
        semesterLabel: course.semesterLabel,
        status,
      };

      detail.coursesByStatus[status].push(normalized);
      if (status === 'completed') {
        detail.completedCredits += credits;
      } else if (status === 'in_progress') {
        detail.inProgressCredits += credits;
      } else {
        detail.plannedCredits += credits;
      }
    });
  };

  registerCoursesForDetail(completedList, 'completed');
  registerCoursesForDetail(takingList, 'in_progress');
  registerCoursesForDetail(plannedFromPlannerList, 'planned');

  interface OverflowCourseInfo extends CategorizedCourseEntry {
    overflowCredits: number;
  }

  const overflowTotalsByStatus: Record<CourseStatusKey, number> = {
    completed: 0,
    in_progress: 0,
    planned: 0,
  };

  const overflowCourseDetails: OverflowCourseInfo[] = [];

  Object.entries(categoryCreditDetails).forEach(([category, detail]) => {
    let remainingRequirement = detail.requiredCredits;
    const overflowCoursesForCategory: OverflowCourseInfo[] = [];

    const consumeCourses = (courses: CategorizedCourseEntry[], status: CourseStatusKey) => {
      courses.forEach(course => {
        const credits = course.credits || 0;
        if (remainingRequirement <= 0) {
          overflowTotalsByStatus[status] += credits;
          overflowCoursesForCategory.push({ ...course, overflowCredits: credits });
          return;
        }

        if (credits <= remainingRequirement) {
          remainingRequirement -= credits;
          return;
        }

        const overflowPortion = credits - remainingRequirement;
        overflowTotalsByStatus[status] += overflowPortion;
        overflowCoursesForCategory.push({ ...course, overflowCredits: overflowPortion });
        remainingRequirement = 0;
      });
    };

    consumeCourses(detail.coursesByStatus.completed, 'completed');
    consumeCourses(detail.coursesByStatus.in_progress, 'in_progress');
    consumeCourses(detail.coursesByStatus.planned, 'planned');

    const overflowCredits = overflowCoursesForCategory.reduce((sum, course) => sum + course.overflowCredits, 0);

    if (overflowCredits > 0) {
      overflowCourseDetails.push(...overflowCoursesForCategory);
    }
  });

  const totalOverflowCredits = overflowCourseDetails.reduce((sum, course) => sum + course.overflowCredits, 0);

  const countedEarnedCredits = Math.max(0, earnedCredits - overflowTotalsByStatus.completed);
  const availableAfterEarned = Math.max(0, totalCreditsRequired - countedEarnedCredits);
  const netInProgressCredits = Math.max(0, inProgressCredits - overflowTotalsByStatus.in_progress);
  const countedInProgressCredits = Math.min(netInProgressCredits, availableAfterEarned);
  const netPlannedCredits = Math.max(0, plannedCredits - overflowTotalsByStatus.planned);
  const countedPlannedOnlyCredits = Math.max(
    0,
    Math.min(netPlannedCredits, availableAfterEarned - countedInProgressCredits)
  );
  const countedPlannedCredits = countedInProgressCredits + countedPlannedOnlyCredits;
  const percent = totalCreditsRequired
    ? Math.min(100, Math.round((countedEarnedCredits / totalCreditsRequired) * 100))
    : 0;
  const projectedPercent = totalCreditsRequired
    ? Math.min(100, Math.round(((countedEarnedCredits + countedPlannedCredits) / totalCreditsRequired) * 100))
    : percent;
  const remainingCreditsForBar = Math.max(0, totalCreditsRequired - (countedEarnedCredits + countedPlannedCredits));
  const actualRemainingCredits = Math.max(0, totalCreditsRequired - (earnedCredits + inProgressCredits + plannedCredits));

  const buildAggregateCreditDetail = (categories: string[]) => {
    return categories.reduce(
      (acc, key) => {
        const detail = categoryCreditDetails[key] || ensureCategoryDetail(key);
        if (!detail) {
          return acc;
        }

        acc.requiredCredits += detail.requiredCredits;
        acc.completedCredits += detail.completedCredits;
        acc.inProgressCredits += detail.inProgressCredits;
        acc.plannedCredits += detail.plannedCredits;
        acc.coursesByStatus.completed.push(...detail.coursesByStatus.completed);
        acc.coursesByStatus.in_progress.push(...detail.coursesByStatus.in_progress);
        acc.coursesByStatus.planned.push(...detail.coursesByStatus.planned);
        return acc;
      },
      {
        requiredCredits: 0,
        completedCredits: 0,
        inProgressCredits: 0,
        plannedCredits: 0,
        coursesByStatus: {
          completed: [] as CategorizedCourseEntry[],
          in_progress: [] as CategorizedCourseEntry[],
          planned: [] as CategorizedCourseEntry[],
        },
      }
    );
  };

  const overflowPreview = overflowCourseDetails.slice(0, 4);
  const additionalOverflowCount = Math.max(0, overflowCourseDetails.length - overflowPreview.length);
  const overflowStatusLabels: Record<CourseStatusKey, string> = {
    completed: 'Completed',
    in_progress: 'Currently Taking',
    planned: 'Planned',
  };

  const statusChipStyles: Record<CourseStatusKey, { chip: string; text: string; pill: string }> = {
    completed: {
      chip: 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:border-emerald-500/30',
      text: 'text-emerald-700 dark:text-emerald-200',
      pill: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    },
    in_progress: {
      chip: 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-500/10 dark:text-amber-200 dark:border-amber-500/30',
      text: 'text-amber-700 dark:text-amber-200',
      pill: 'bg-gradient-to-r from-amber-300 to-amber-500',
    },
    planned: {
      chip: 'bg-indigo-50 text-indigo-700 border border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-200 dark:border-indigo-500/30',
      text: 'text-indigo-700 dark:text-indigo-200',
      pill: 'bg-gradient-to-r from-indigo-400 to-fuchsia-500',
    },
  };

  const creditCardConfigs = [
    {
      key: 'general-education',
      label: 'General Ed',
      valueColor: 'text-blue-500 dark:text-blue-400',
      plannedColor: 'text-blue-400 dark:text-blue-300',
      completedCount: genEdCompleted,
      plannedCount: genEdPlanned,
      totalCount: genEdTotal,
      categories: ['General Education'],
      tooltipContent: (
        <>
          <p className="font-semibold mb-1">General Education Courses</p>
          <p className="text-sm">Foundational courses including:</p>
          <ul className="text-xs mt-1 space-y-0.5">
            <li>• Language Courses</li>
            <li>• Humanities Courses</li>
            <li>• Social Science Courses</li>
            <li>• Science and Mathematics Courses</li>
          </ul>
        </>
      ),
    },
    {
      key: 'core',
      label: 'Core',
      valueColor: 'text-teal-600 dark:text-teal-400',
      plannedColor: 'text-teal-500 dark:text-teal-300',
      completedCount: coreCompleted,
      plannedCount: corePlanned,
      totalCount: coreTotal,
      categories: ['Core Courses'],
      tooltipContent: (
        <>
          <p className="font-semibold mb-1">Core Courses</p>
          <p className="text-sm">Major required courses essential for your program.</p>
        </>
      ),
    },
    {
      key: 'major',
      label: 'Major',
      valueColor: 'text-cyan-600 dark:text-cyan-400',
      plannedColor: 'text-cyan-500 dark:text-cyan-300',
      completedCount: majorCompleted,
      plannedCount: majorPlanned,
      totalCount: majorTotal,
      categories: ['Major'],
      tooltipContent: (
        <>
          <p className="font-semibold mb-1">Major Courses</p>
          <p className="text-sm mb-2">Core curriculum courses organized into specialized groups:</p>
          <ul className="text-xs space-y-0.5">
            <li>• Organization Issues and Information Systems</li>
            <li>• Applications Technology</li>
            <li>• Technology and Software Methods</li>
            <li>• Systems Infrastructure</li>
            <li>• Hardware and Computer Architecture</li>
          </ul>
          <p className="text-xs mt-1 text-yellow-600 dark:text-yellow-400">⚠️ At least C grades are required.</p>
        </>
      ),
    },
    {
      key: 'electives',
      label: 'Electives',
      valueColor: 'text-green-600 dark:text-green-400',
      plannedColor: 'text-green-500 dark:text-green-300',
      completedCount: majorElectiveCompleted + freeElectiveCompleted,
      plannedCount: majorElectivePlanned + freeElectivePlanned,
      totalCount: majorElectiveTotal + freeElectiveTotal,
      categories: ['Major Elective', 'Free Elective'],
      tooltipContent: (
        <>
          <p className="font-semibold mb-1">Elective Courses</p>
          <p className="text-sm mb-2">Combined major and free electives:</p>
          <ul className="text-xs space-y-1">
            <li>• <span className="font-medium">Major Electives:</span> {majorElectiveCompleted}/{majorElectiveTotal} (≈15 credits)</li>
            <li>• <span className="font-medium">Free Electives:</span> {freeElectiveCompleted}/{freeElectiveTotal} (≈12 credits)</li>
          </ul>
        </>
      ),
    },
  ];

  const toggleCreditCard = (cardKey: string) => {
    setOpenCreditCardKey(prev => (prev === cardKey ? null : cardKey));
  };

  const renderCourseChipList = (courses: CategorizedCourseEntry[]) => {
    if (!courses.length) {
      return <div className="text-[11px] text-muted-foreground mt-1">No courses yet</div>;
    }
    const preview = courses.slice(0, 3);
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {preview.map((course, index) => (
          <span
            key={`${course.code}-${course.status}-${index}`}
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${statusChipStyles[course.status]?.chip || 'bg-muted text-muted-foreground'}`}
          >
            {course.code} ({course.credits})
          </span>
        ))}
        {courses.length > preview.length && (
          <span className="text-[11px] text-muted-foreground">+{courses.length - preview.length} more</span>
        )}
      </div>
    );
  };

  const renderCreditDetailRows = (categories: string[]) => {
    const aggregate = buildAggregateCreditDetail(categories);
    const trackedCredits = aggregate.completedCredits + aggregate.inProgressCredits + aggregate.plannedCredits;

    if (!trackedCredits) {
      return <div className="text-xs text-muted-foreground">No credit history recorded for this category yet.</div>;
    }

    const statusRows = [
      { label: 'Completed', value: aggregate.completedCredits, courses: aggregate.coursesByStatus.completed },
      { label: 'Currently Taking', value: aggregate.inProgressCredits, courses: aggregate.coursesByStatus.in_progress },
      { label: 'Planned', value: aggregate.plannedCredits, courses: aggregate.coursesByStatus.planned },
    ];

    return (
      <div className="space-y-3 text-xs">
        <div className="flex items-center justify-between text-[13px] font-semibold text-foreground/80">
          <span>Tracked Credits</span>
          <span>
            {trackedCredits}
            {aggregate.requiredCredits ? ` / ${aggregate.requiredCredits}` : ''}
          </span>
        </div>
        {statusRows.map(row => (
          <div key={row.label}>
            <div className="flex items-center justify-between text-[12px] text-muted-foreground">
              <span>{row.label}</span>
              <span>{row.value} credits</span>
            </div>
            {row.value > 0 ? renderCourseChipList(row.courses) : (
              <div className="text-[11px] text-muted-foreground mt-1">No courses yet</div>
            )}
          </div>
        ))}
        <div className="text-[11px] text-muted-foreground">
          Requirement reference: {aggregate.requiredCredits || 'Not specified'} credits
        </div>
      </div>
    );
  };

  // Simple PDF download handler - create text-based PDF instead of image
  const handleDownloadPDF = async () => {
    if (!selectedCurriculum) {
      toast.warning('Please select a curriculum first before generating PDF.', 'Curriculum Required');
      return;
    }
    
    if (loading) {
      toast.info('Please wait for data to load before generating PDF.', 'Loading');
      return;
    }
    
    try {
      // Create a text-based PDF instead of image-based
      const pdf = new jsPDF({ 
        orientation: "portrait", 
        unit: "pt", 
        format: "a4"
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 40;
      let yPosition = margin + 20;
      const lineHeight = 15;
      const maxWidth = pageWidth - (margin * 2);

      const ensureSpace = (heightNeeded = lineHeight) => {
        if (yPosition + heightNeeded > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin + 20;
        }
      };
      
      // Helper function to add text and handle page breaks
      const addText = (text: string, fontSize = 11, isBold = false, leftMargin = margin) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        // Handle long text by splitting into lines
        const lines = pdf.splitTextToSize(text, maxWidth - (leftMargin - margin));
        
        if (Array.isArray(lines)) {
          lines.forEach((line: string) => {
            ensureSpace(lineHeight);
            pdf.text(line, leftMargin, yPosition);
            yPosition += lineHeight;
          });
        } else {
          ensureSpace(lineHeight);
          pdf.text(lines, leftMargin, yPosition);
          yPosition += lineHeight;
        }
        
        return yPosition;
      };

      const addCreditSummaryColumns = (columns: { label: string; value: string | number; }[]) => {
        if (!columns.length) return;

        ensureSpace(lineHeight * 2);
        const availableWidth = maxWidth;
        const columnWidth = availableWidth / columns.length;
        const labelY = yPosition;
        const valueY = yPosition + lineHeight;

        pdf.setFontSize(11);
        columns.forEach((column, index) => {
          const xPosition = margin + (columnWidth * index);
          pdf.setFont('helvetica', 'bold');
          pdf.text(column.label, xPosition, labelY);
          pdf.setFont('helvetica', 'normal');
          pdf.text(String(column.value), xPosition, valueY);
        });

        yPosition = valueY + lineHeight;
      };

      type TableColumn<T> = {
        label: string;
        width: number;
        getValue: (item: T) => string;
      };

      const addCourseListSection = <T extends Record<string, any>>(
        title: string,
        data: T[],
        formatter: (item: T) => string
      ) => {
        if (!data.length) return;

        addText(title, 14, true);
        yPosition += 5;

        data.forEach(item => {
          const line = formatter(item);
          addText(`• ${line}`, 10, false, margin + 20);
        });

        yPosition += 5;
      };
      
      // Title
      addText('Academic Progress Report', 18, true);
      yPosition += 10;
      
      // Date
      const now = new Date();
      addText(`Generated on: ${now.toLocaleDateString()}`, 10);
      yPosition += 20;
      
      // Overall Progress
      addText('OVERALL PROGRESS', 14, true);
      yPosition += 5;
      const remainingCredits = Math.max(0, totalCreditsRequired - earnedCredits - plannedCredits);
      addCreditSummaryColumns([
        { label: 'Completed Credits', value: `${earnedCredits}` },
        { label: 'Planned Credits', value: `${plannedCredits}` },
        { label: 'Remaining Credits', value: `${remainingCredits}` }
      ]);
      addText(`Total Required Credits: ${totalCreditsRequired}`);
      addText(`Progress: ${percent}%`);
      if (gpa !== 'N/A') {
        addText(`GPA: ${gpa}`);
      }
      yPosition += 10;
      
      // Category Progress
      addText('CATEGORY PROGRESS', 14, true);
      yPosition += 5;
      
      const categories = [
        { name: 'General Education', completed: genEdCompleted, planned: genEdPlanned, total: genEdTotal },
        { name: 'Core Courses', completed: coreCompleted, planned: corePlanned, total: coreTotal },
        { name: 'Major', completed: majorCompleted, planned: majorPlanned, total: majorTotal },
        { name: 'Major Elective', completed: majorElectiveCompleted, planned: majorElectivePlanned, total: majorElectiveTotal },
        { name: 'Free Elective', completed: freeElectiveCompleted, planned: freeElectivePlanned, total: freeElectiveTotal }
      ];
      
      categories.forEach(category => {
        if (category.total > 0) {
          const plannedText = category.planned > 0 ? ` (+${category.planned} planned)` : '';
          addText(`${category.name}: ${category.completed}${plannedText} / ${category.total}`, 11, false, margin + 20);
        }
      });
      yPosition += 15;
      
      // Completed Courses
      if (completedList.length > 0) {
        addCourseListSection('COMPLETED COURSES', completedList, (course) => {
          const credits = courseDataCache[course.code]?.credits ?? course.credits ?? 0;
          const gradeText = course.grade ? ` (Grade: ${course.grade})` : '';
          return `${course.code} - ${course.title} (${credits} credits)${gradeText}`;
        });
      }

      // Currently Taking Courses
      if (takingList.length > 0) {
        addText('CURRENTLY TAKING COURSES', 14, true);
        yPosition += 5;
        takingList.forEach(course => {
          const termLabel = getDisplaySemesterLabel(course.semesterLabel, undefined, undefined);
          const termSuffix = termLabel ? ` (${termLabel})` : '';
          addText(`• ${course.code} - ${course.title}${termSuffix}`, 10, false, margin + 20);
        });
        yPosition += 15;
      }
      
      // Planned Courses
      if (plannedFromPlannerList.length > 0) {
        addCourseListSection('PLANNED COURSES', plannedFromPlannerList, (course) => {
          const credits = course.credits ?? courseDataCache[course.code]?.credits ?? 0;
          const termLabel = getDisplaySemesterLabel(course.semesterLabel, course.semester, course.year);
          const termText = termLabel ? ` (${termLabel})` : '';
          return `${course.code} - ${course.title} (${credits} credits)${termText}`;
        });
      }
      
      // Concentration Progress
      if (concentrationAnalysis.length > 0) {
        addText('CONCENTRATION PROGRESS', 14, true);
        yPosition += 5;
        
        concentrationAnalysis.forEach(analysis => {
          addText(`${analysis.concentration.name}: ${Math.round(analysis.progress)}%`, 12, true, margin + 20);
          addText(`  Completed: ${analysis.completedCourses.length} courses`, 10, false, margin + 40);
          addText(`  Required: ${analysis.concentration.requiredCourses} courses`, 10, false, margin + 40);
          if (analysis.remainingCourses > 0) {
            addText(`  Remaining: ${analysis.remainingCourses} courses`, 10, false, margin + 40);
          }
          yPosition += 5;
        });
        yPosition += 10;
      }
      
      // Remaining Courses
      if (pendingList.length > 0) {
        addText('REMAINING COURSES', 14, true);
        yPosition += 5;
        
        // Group by category
        const remainingByCategory: { [category: string]: typeof pendingList } = {};
        pendingList.forEach(course => {
          if (!remainingByCategory[course.category]) {
            remainingByCategory[course.category] = [];
          }
          remainingByCategory[course.category].push(course);
        });
        
        Object.entries(remainingByCategory).forEach(([category, courses]) => {
          addText(`${category}:`, 12, true, margin + 20);
          courses.forEach(course => {
            addText(`  • ${course.code} - ${course.title} (${course.credits} credits)`, 10, false, margin + 40);
          });
          yPosition += 5;
        });
      }
      
      // Validation warnings if any
      if (blacklistWarnings.length > 0) {
        yPosition += 15;
        addText('WARNINGS', 14, true);
        yPosition += 5;
        
        blacklistWarnings.forEach(warning => {
          addText(`⚠ ${warning}`, 10, false, margin + 20);
        });
      }
      
      // Generate filename with current date
      const dateStr = now.toISOString().split('T')[0];
      const filename = `academic-progress-report-${dateStr}.pdf`;
      
      pdf.save(filename);
      toast.success('PDF generated successfully!', 'Download Complete');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.', 'PDF Generation Failed');
    }
  };

  const buildGraduationExportRows = (): GraduationExportRow[] => {
    const rows: GraduationExportRow[] = [];

    completedList.forEach(course => {
      rows.push({
        Title: course.title,
        Code: (course.code || '').trim(),
        Credits: course.credits,
        Category: course.category,
        Grade: course.grade || '',
        Status: getExportStatusLabel('completed'),
        RawStatus: 'completed',
        Semester: course.semesterLabel || ''
      });
    });

    plannedFromPlannerList.forEach(course => {
      const normalizedStatus = normalizeExportStatus((course.status as CourseStatus['status']) || 'planning');
      const semesterDisplay = getDisplaySemesterLabel(course.semesterLabel, course.semester, course.year);
      rows.push({
        Title: course.title,
        Code: (course.code || '').trim(),
        Credits: course.credits,
        Category: course.category,
        Grade: '',
        Status: getExportStatusLabel(normalizedStatus),
        RawStatus: normalizedStatus,
        Semester: semesterDisplay || ''
      });
    });

    pendingList.forEach(course => {
      const normalizedStatus = normalizeExportStatus((course.status as CourseStatus['status']) || 'pending');
      rows.push({
        Title: course.title,
        Code: (course.code || '').trim(),
        Credits: course.credits,
        Category: course.category,
        Grade: '',
        Status: getExportStatusLabel(normalizedStatus),
        RawStatus: normalizedStatus,
        Semester: ''
      });
    });

    return rows;
  };

  // Export functions for CSV and Excel
  const exportToExcel = () => {
    const graduationRows = buildGraduationExportRows();
    const worksheetData: any[][] = [];
    const highlightRowIndices: number[] = [];

    worksheetData.push(['course data']); // Title (match CSV format)
    
    // Add curriculum metadata if available
    if (curriculumData) {
      worksheetData.push(['CURRICULUM_ID', curriculumData.id || '']);
      worksheetData.push(['CURRICULUM_NAME', curriculumData.name || '']);
      worksheetData.push(['CURRICULUM_YEAR', curriculumData.year || '']);
    }
    
    worksheetData.push([]); // Empty row before course data
    
    // Group courses by category
    const groupedCourses: { [key: string]: GraduationExportRow[] } = {};
    graduationRows.forEach(course => {
      const categoryKey = course.Category || 'Uncategorized';
      if (!groupedCourses[categoryKey]) {
        groupedCourses[categoryKey] = [];
      }
      groupedCourses[categoryKey].push(course);
    });
    
    // Add each category section
    Object.entries(groupedCourses).forEach(([category, courses]) => {
      const totalCredits = courses.reduce((sum, course) => sum + (course.Credits || 0), 0);
      const activeCredits = calculateActiveCredits(courses);
      worksheetData.push([`${category} (${totalCredits} Credits)`]);
      worksheetData.push([`Active Credits: ${activeCredits}`]);
      
      courses.forEach(course => {
        worksheetData.push([
          course.Title,
          course.Code,
          course.Credits,
          course.Grade,
          course.Status,
          course.Semester || ''
        ]);
        if (shouldHighlightExportRow(course.RawStatus)) {
          highlightRowIndices.push(worksheetData.length);
        }
      });
      
      worksheetData.push([]); // Empty row after each category
    });
    const totalActiveCredits = calculateActiveCredits(graduationRows);
    worksheetData.push([`Overall Active Credits: ${totalActiveCredits}`]);
    
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();

    if (highlightRowIndices.length > 0) {
      const highlightStyle = {
        fill: {
          patternType: 'solid',
          fgColor: { rgb: 'FFF6DB' }
        }
      };
      const columnCount = 6;
      highlightRowIndices.forEach(rowIndex => {
        for (let colIdx = 0; colIdx < columnCount; colIdx++) {
          const cellAddress = XLSX.utils.encode_cell({ r: rowIndex - 1, c: colIdx });
          const cell = ws[cellAddress];
          if (cell) {
            (cell as any).s = highlightStyle;
          }
        }
      });
    }

    XLSX.utils.book_append_sheet(wb, ws, 'Course Data');
    XLSX.writeFile(wb, 'course data.xlsx');
  };

  const exportToCSV = () => {
    const graduationRows = buildGraduationExportRows();

    // Convert to curriculum transcript CSV format (match data-entry page exactly)
    const csvLines: string[] = [];
    csvLines.push('course data'); // Title
    
    // Add curriculum metadata if available
    if (curriculumData) {
      csvLines.push(formatCsvRow(['CURRICULUM_ID', curriculumData.id || '']));
      csvLines.push(formatCsvRow(['CURRICULUM_NAME', curriculumData.name || '']));
      csvLines.push(formatCsvRow(['CURRICULUM_YEAR', curriculumData.year || '']));
    }
    
    csvLines.push(''); // Empty line before course data
    
    // Group courses by category
    const groupedCourses: { [key: string]: GraduationExportRow[] } = {};
    graduationRows.forEach(course => {
      const categoryKey = course.Category || 'Uncategorized';
      if (!groupedCourses[categoryKey]) {
        groupedCourses[categoryKey] = [];
      }
      groupedCourses[categoryKey].push(course);
    });
    
    // Add each category section
    Object.entries(groupedCourses).forEach(([category, courses]) => {
      const totalCredits = courses.reduce((sum, course) => sum + (course.Credits || 0), 0);
      const activeCredits = calculateActiveCredits(courses);
      csvLines.push(formatCsvRow([`${category} (${totalCredits} Credits)`]));
      csvLines.push(formatCsvRow(['Active Credits', activeCredits]));
      
      courses.forEach(course => {
        csvLines.push(formatCsvRow([
          course.Title,
          course.Code,
          course.Credits,
          course.Grade,
          course.Status,
          formatSemesterForCsvValue(course.Semester || '')
        ]));
      });
      
      csvLines.push(''); // Empty line after each category
    });
    const totalActiveCredits = calculateActiveCredits(graduationRows);
    csvLines.push(formatCsvRow(['Overall Active Credits', totalActiveCredits]));
    
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
            onClick={() => router.push('/student/management/course-planning')}
          >
            <ArrowLeft size={16} />
            Back to Course Planner
          </button>
          
          <button
            className="border border-input bg-background text-foreground px-4 py-2 rounded-lg font-medium hover:bg-accent hover:text-accent-foreground transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => router.push('/student/management/data-entry')}
          >
            Course Entry
          </button>
        </div>
        <h2 className="text-xl font-bold">Academic Progress Overview</h2>
      </div>
      
      <div ref={pdfRef} className="w-full">{/* Main content wrapper for PDF export */}

      {/* Show loading state */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-muted-foreground">Loading progress data...</p>
          </div>
        </div>
      )}

      {/* Show curriculum error if exists */}
      {!loading && curriculumError && selectedCurriculum && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              ⚠️ Curriculum Data Error
            </h3>
            <p className="text-red-700 dark:text-red-300 mb-4">
              {curriculumError}
            </p>
            <div className="text-sm text-red-600 dark:text-red-400 mb-4">
              <p className="mb-2">This may happen if:</p>
              <ul className="text-left inline-block space-y-1">
                <li>• The curriculum was deleted from the system</li>
                <li>• You copied data from a different environment</li>
                <li>• The database was reset or migrated</li>
              </ul>
            </div>
            <button
              onClick={() => router.push('/student/management/data-entry')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Go to Course Entry
            </button>
          </div>
        </div>
      )}

      {/* Show message if no data and not loading */}
      {!loading && !selectedCurriculum && !curriculumError && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
              No Student Data Found
            </h3>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Please go to the Course Entry page first to set up your curriculum and add completed courses.
            </p>
            <button
              onClick={() => router.push('/student/management/data-entry')}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              Go to Course Entry
            </button>
          </div>
        </div>
      )}

      {/* Show progress data if available and no curriculum error */}
      {!loading && selectedCurriculum && !curriculumError && (
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

          <div className="bg-white dark:bg-card rounded-xl p-6 mb-6 border border-gray-200 dark:border-border">
        {/* Custom Academic Progress Bar */}
        <div className="flex items-center relative h-24 mb-4 bg-gradient-to-r from-slate-50 via-emerald-50 to-emerald-100 dark:from-slate-900/40 dark:via-teal-900/20 dark:to-emerald-900/30 rounded-lg px-6 border border-emerald-100/60 dark:border-emerald-900/40 shadow-sm">
          {/* Progress bar */}
          <div className="flex-1 relative h-4 bg-slate-200 dark:bg-slate-800/70 rounded-full overflow-hidden shadow-inner">
            {/* Completed section */}
            <div 
              className={`absolute left-0 top-0 h-full bg-gradient-to-r from-teal-500 to-emerald-500 dark:from-teal-400 dark:to-emerald-300 transition-[width] duration-700 ease-out shadow-sm ${
                percent >= 100 ? 'rounded-full' : 'rounded-l-full'
              }`}
              style={{ width: `${percent}%` }}
            ></div>
            
            {/* Planned section */}
            {projectedPercent > percent && (
              <div 
                className="absolute top-0 h-full bg-gradient-to-r from-indigo-400 to-fuchsia-500 dark:from-indigo-300 dark:to-fuchsia-400 transition-[width] duration-700 ease-out"
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
          <div className="flex items-center ml-4 text-emerald-800 dark:text-emerald-200">
            <GiGraduateCap className="mr-2 text-emerald-700 dark:text-emerald-300" size={24} />
            <span className="font-semibold text-lg">Graduate!</span>
          </div>
        </div>
        
        {/* Progress segments breakdown */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm mb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <span className="font-medium text-emerald-700 dark:text-emerald-300">
              Counted Completed: {countedEarnedCredits} credits
            </span>
          </div>
          {countedInProgressCredits > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-300 to-amber-500"></div>
              <span className="font-medium text-amber-700 dark:text-amber-300">
                Counted Currently Taking: {countedInProgressCredits} credits
              </span>
            </div>
          )}
          {countedPlannedOnlyCredits > 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-indigo-400 to-fuchsia-500"></div>
              <span className="font-medium text-indigo-700 dark:text-indigo-300">
                Counted Planned: {countedPlannedOnlyCredits} credits
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full"></div>
            <span className="text-muted-foreground">
              Remaining (visible in bar): {remainingCreditsForBar} credits
            </span>
          </div>
        </div>
        <div className="text-center text-sm text-muted-foreground mb-4">
          Actual earned credits: <span className="font-semibold text-foreground">{earnedCredits} / {totalCreditsRequired}</span>
          {totalOverflowCredits > 0 && (
            <span className="ml-2 text-amber-600 dark:text-amber-400 font-medium">
              (+{totalOverflowCredits} overflow counted as Free Elective)
            </span>
          )}
          <div className="mt-1">Actual remaining credits (including planned): {actualRemainingCredits}</div>
        </div>

        {totalOverflowCredits > 0 && (
          <div className="rounded-lg border border-amber-200/70 dark:border-amber-500/30 bg-amber-50/60 dark:bg-amber-900/10 p-4 mb-6">
            <div className="text-sm font-semibold text-amber-800 dark:text-amber-200">
              Overflow credits reassigned to Free Electives: +{totalOverflowCredits}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              These courses exceeded their category requirements. They no longer add to the progress bar but remain in your record as Free Electives.
            </p>
            <div className="mt-3 space-y-2 text-sm">
              {overflowPreview.map((course, index) => (
                <div key={`${course.code}-${course.status}-${index}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white/70 dark:bg-slate-900/40 rounded-md px-3 py-2 text-foreground">
                  <div>
                    <span className="font-semibold">{course.code}</span>
                    <span className="text-muted-foreground"> • {course.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">({course.category})</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <span className={`inline-flex items-center gap-1 ${statusChipStyles[course.status]?.text || 'text-foreground'}`}>
                      +{course.overflowCredits} credits
                    </span>
                    <span className={`inline-flex items-center gap-1 ${statusChipStyles[course.status]?.text || 'text-muted-foreground'}`}>
                      {overflowStatusLabels[course.status]}
                    </span>
                  </div>
                </div>
              ))}
              {additionalOverflowCount > 0 && (
                <div className="text-xs text-muted-foreground">
                  +{additionalOverflowCount} more overflow {additionalOverflowCount === 1 ? 'course' : 'courses'}
                </div>
              )}
            </div>
          </div>
        )}
        {/* Academic Progress Stats - Reorganized Layout */}
        <TooltipProvider>
          {/* Row 1 - Requirements (4 columns) - dynamic */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {creditCardConfigs.map(card => {
              const isOpen = openCreditCardKey === card.key;
              return (
                <div key={card.key} className="space-y-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => toggleCreditCard(card.key)}
                        aria-expanded={isOpen}
                        className="group w-full bg-white dark:bg-card rounded-xl p-6 text-center border border-gray-200 dark:border-border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                      >
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {card.label}
                          <HelpCircle className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className={`text-2xl font-bold ${card.valueColor} mb-1`}>
                          {card.completedCount}
                          {card.plannedCount > 0 && (
                            <span className={card.plannedColor}>+{card.plannedCount}</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">/ {card.totalCount}</div>
                        <div className="text-[11px] text-muted-foreground mt-3">
                          {isOpen ? 'Tap to hide credit details' : 'Tap to view credit details'}
                        </div>
                      </button>
                    </TooltipTrigger>
                    {card.tooltipContent && (
                      <TooltipContent side="top" className="max-w-sm text-left">
                        {card.tooltipContent}
                      </TooltipContent>
                    )}
                  </Tooltip>
                  {isOpen && (
                    <div className="bg-white/90 dark:bg-slate-900/60 rounded-lg border border-gray-100 dark:border-slate-800 p-3 text-left shadow-inner">
                      {renderCreditDetailRows(card.categories)}
                      <div className="text-[11px] text-muted-foreground mt-3">Click the card again to collapse.</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overview and Summary Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-card rounded-xl p-6 text-center border border-gray-200 dark:border-border shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Credits</div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                {earnedCredits} 
                {plannedCredits > 0 && <span className="text-blue-500 dark:text-blue-300">+{plannedCredits}</span>}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">/ {totalCreditsRequired}</div>
            </div>
            
            <div className="bg-white dark:bg-card rounded-xl p-6 text-center border border-gray-200 dark:border-border shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">GPA</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">{gpa}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Current</div>
            </div>
            
            <div className="bg-white dark:bg-card rounded-xl p-6 text-center border border-gray-200 dark:border-border shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 cursor-pointer group">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">Progress</div>
              <div className="flex justify-center mb-3">
                <DonutChart 
                  completed={earnedCredits}
                  planned={plannedCredits}
                  total={totalCreditsRequired}
                  size={80}
                  strokeWidth={8}
                />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {earnedCredits + plannedCredits}/{totalCreditsRequired}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/30 rounded-xl p-6 text-center border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Remaining</div>
              <div className="text-3xl font-bold text-gray-600 dark:text-gray-300 mb-1">
                {Math.max(0, totalCreditsRequired - earnedCredits - plannedCredits)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Credits</div>
            </div>
          </div>
        </TooltipProvider>
        
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
      {/* Completed, Currently Taking, and Planned Courses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[150px]">
          <h3 className="text-lg font-bold mb-3">Completed Courses</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pdf-expandable">
            {completedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No completed courses yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mb-4">Start by adding your completed courses in the Course Entry page</p>
                <Button
                  onClick={() => router.push('/student/management/data-entry')}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Courses Now
                </Button>
              </div>
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
          <h3 className="text-lg font-bold mb-3">Currently Taking</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pdf-expandable">
            {takingList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-6 h-6 text-blue-400 dark:text-blue-500 mb-2" />
                No courses marked as Currently Taking
              </div>
            ) : (
              takingList.map((c) => {
                const termLabel = getDisplaySemesterLabel(c.semesterLabel, undefined, undefined);
                return (
                  <div key={c.code} className="flex justify-between items-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded px-3 py-2">
                    <span className="font-semibold text-xs text-yellow-800 dark:text-yellow-200">{c.code} - {c.title}</span>
                    <div className="text-xs text-yellow-700 dark:text-yellow-400">
                      {c.category}{termLabel ? ` • ${termLabel}` : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border min-h-[150px]">
          <h3 className="text-lg font-bold mb-3">Planned Courses <span className="text-sm text-blue-600">(From Course Planner)</span></h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pdf-expandable">
            {plannedFromPlannerList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-8 h-8 text-blue-400 dark:text-blue-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No courses planned yet</p>
                <p className="text-gray-400 dark:text-gray-500 text-xs mb-4">Use the Course Planner to organize your upcoming semesters</p>
                <Button
                  onClick={() => router.push('/student/management/course-planning')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Plan Courses Now
                </Button>
              </div>
            ) : (
              plannedFromPlannerList.map((c) => {
                const termLabel = getDisplaySemesterLabel(c.semesterLabel, c.semester, c.year);
                return (
                  <div key={c.code} className="flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded px-3 py-2">
                    <span className="font-semibold text-xs text-blue-800 dark:text-blue-200">{c.code} - {c.title}</span>
                    <div className="text-xs text-blue-600 dark:text-blue-400">
                      {c.category}{termLabel ? ` • ${termLabel}` : ''}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Concentration Analysis Section with Donut Charts */}
      {concentrationAnalysis.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-6">
            <Target className="w-6 h-6 text-purple-600" />
            <h3 className="text-xl font-bold">Concentration Progress</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {concentrationAnalysis.map((analysis) => {
              const completedCount = analysis.completedCourses.length;
              const plannedCount = analysis.plannedCourses.length;
              const totalRequired = analysis.concentration.requiredCourses;
              const totalProgress = completedCount + plannedCount;
              
              return (
                <div key={analysis.concentration.id} className="bg-white dark:bg-card rounded-xl p-6 border border-gray-200 dark:border-border shadow-sm hover:shadow-md transition-shadow">
                  {/* Header with status indicator */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{analysis.concentration.name}</h4>
                        {analysis.isEligible && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded-full">
                            <Award className="w-3 h-3 text-green-600" />
                            <span className="text-xs text-green-600 font-medium">Complete</span>
                          </div>
                        )}
                      </div>
                      {analysis.concentration.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">{analysis.concentration.description}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Donut Chart */}
                  <div className="flex justify-center mb-6">
                    <DonutChart 
                      completed={completedCount}
                      planned={plannedCount}
                      total={totalRequired}
                      size={140}
                      strokeWidth={14}
                    />
                  </div>
                  
                  {/* Progress Statistics */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Completed</span>
                      </div>
                      <span className="text-sm font-bold text-green-700 dark:text-green-300">{completedCount}</span>
                    </div>
                    
                    {plannedCount > 0 && (
                      <div className="flex items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Planned</span>
                        </div>
                        <span className="text-sm font-bold text-blue-700 dark:text-blue-300">{plannedCount}</span>
                      </div>
                    )}
                    
                    {analysis.remainingCourses > 0 && (
                      <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Remaining</span>
                        </div>
                        <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{analysis.remainingCourses}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Course Details */}
                  <div className="space-y-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {analysis.completedCourses.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-green-600 dark:text-green-400">Completed:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {analysis.completedCourses.join(', ')}
                        </p>
                      </div>
                    )}
                    {analysis.plannedCourses.length > 0 && (
                      <div className="text-sm">
                        <span className="font-medium text-blue-600 dark:text-blue-400">Planned:</span>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                          {analysis.plannedCourses.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mt-6">
        <div className="bg-white dark:bg-card rounded-xl p-8 border border-gray-200 dark:border-border min-h-[400px]">
          <h3 className="text-2xl font-bold mb-6">Remaining Courses</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto pdf-expandable">
            {pendingList.length === 0 ? (
              <div className="text-gray-400 text-center py-12 text-lg">All courses completed or planned! 🎉</div>
            ) : (
              pendingList.map((c) => (
                <div key={c.code} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-lg px-5 py-4 hover:bg-gray-100 dark:hover:bg-gray-800/70 transition-colors">
                  <span className="font-semibold text-base text-gray-800 dark:text-gray-200">{c.code} - {c.title}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">{c.category}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
        </>
      )}
      </div>{/* End of PDF ref wrapper */}
      
      {/* Download buttons - outside PDF export area */}
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
                Export Data
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
          onClick={() => {
            console.log('🔍 PDF Button clicked - Debug info:', {
              loading,
              selectedCurriculum,
              completedCoursesCount: Object.keys(completedCourses).length,
              plannedCoursesCount: plannedCourses.length,
              pdfRefExists: !!pdfRef.current,
              pdfRefDimensions: pdfRef.current ? {
                width: pdfRef.current.offsetWidth,
                height: pdfRef.current.offsetHeight
              } : null
            });
            handleDownloadPDF();
          }}
        >
          Download as PDF
        </button>
      </div>
    </div>
  );
}