'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useToastHelpers } from '@/hooks/useToast';
import { useAuth } from '@/contexts/SanctumAuthContext';
import { API_BASE, getPublicDepartments, getPublishedSchedules, getPublishedSchedule } from '@/lib/api/laravel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { CourseScheduleCalendar } from '@/components/features/management/CourseScheduleCalendar';
import { ConcentrationAnalysis, type ConcentrationProgress as ConcentrationProgressProps } from '@/components/features/management/ConcentrationAnalysis';
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
  LayoutGrid,
  UserCheck,
  ToggleLeft,
  ToggleRight,
  Sparkles
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
  source?: 'tentative' | 'manual'; // Track source of the course
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

interface ElectiveRule {
  id: string;
  category: string;
  required_credits: number;
  description?: string;
}

interface ConcentrationProgress {
  concentration: Concentration;
  completed?: number;
  required?: number;
  remaining?: number;
  percentage?: number;
  completedCourses: Array<{ id: string; code: string; }>;
  plannedCourses: Array<{ id: string; code: string; }>;
  completedCredits: number;
  plannedCredits: number;
  totalCredits: number;
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

const normalizeDays = (days?: string[] | null, day?: string | null): string[] => {
  if (Array.isArray(days) && days.length > 0) {
    return days;
  }
  if (day && day.trim().length > 0) {
    return [day.trim()];
  }
  return [];
};

const splitTimeRange = (time?: string | null): { timeStart?: string; timeEnd?: string } => {
  if (!time || !time.includes('-')) {
    return {};
  }

  const [start, end] = time.split('-').map((part) => part.trim());
  return {
    timeStart: start || undefined,
    timeEnd: end || undefined,
  };
};

const toCourseKey = (code?: string | null): string =>
  (code || '').replace(/\s+/g, '').trim().toUpperCase();

export default function CoursePlanningPage() {
  const router = useRouter();
  const { success, error: showError, warning, info } = useToastHelpers();
  const { user } = useAuth();
  
  // Check for data entry context
  const [dataEntryContext, setDataEntryContext] = useState<DataEntryContext | null>(null);
  const [hasValidContext, setHasValidContext] = useState(false);
  
  // Split planning page into two focused tabs
  const [planningTab, setPlanningTab] = useState<'planning' | 'schedule'>('planning');
  
  // State management
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  // Map of courseCode -> array of banned course codes from curriculum-level constraints
  const [curriculumBannedCombosMap, setCurriculumBannedCombosMap] = useState<Record<string, string[]>>({});
  const [plannedCourses, setPlannedCourses] = useState<PlannedCourse[]>([]);
  const [completedCourses, setCompletedCourses] = useState<Set<string>>(new Set());
  const [inProgressCourses, setInProgressCourses] = useState<Set<string>>(new Set());
  const [concentrations, setConcentrations] = useState<Concentration[]>([]);
  const [concentrationAnalysis, setConcentrationAnalysis] = useState<ConcentrationProgress[]>([]);
  const [showConcentrationModal, setShowConcentrationModal] = useState(false);
  const [electiveRules, setElectiveRules] = useState<ElectiveRule[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
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
  
  // Track if course plan has been saved
  const [isCoursePlanSaved, setIsCoursePlanSaved] = useState(false);
  
  // In-page diagnostics to inspect real payload shapes without browser console scripting
  const showDiagnosticsCapture = false;
  const [diagnosticCode, setDiagnosticCode] = useState('CSX3011');
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticPayload, setDiagnosticPayload] = useState<any | null>(null);
  
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

  // Helper function to parse credit hours from string/number/object payload variants.
  const parseCredits = (creditsValue: unknown): number => {
    if (typeof creditsValue === 'number') {
      return creditsValue;
    }

    if (typeof creditsValue === 'string') {
      const normalized = creditsValue.trim();
      if (!normalized) return 0;

      // Extract first number from formats like "3" or "3 credits"
      if (!normalized.includes('-')) {
        const direct = Number.parseInt(normalized.replace(/[^\d-]/g, ''), 10);
        return Number.isNaN(direct) ? 0 : direct;
      }

      // Handle credit-hour formats like "3-0-6" and "0-0-3"
      const parts = normalized
        .split('-')
        .map((part) => Number.parseInt(part.trim(), 10))
        .filter((value) => Number.isFinite(value));
      if (parts.length === 0) return 0;

      const first = parts[0] ?? 0;
      const last = parts[parts.length - 1] ?? 0;

      // If first slot is zero (common in project/lab style entries), fall back to last slot
      if (first === 0 && last > 0) {
        return last;
      }

      return first > 0 ? first : Math.max(0, last);
    }

    if (creditsValue && typeof creditsValue === 'object') {
      const obj = creditsValue as Record<string, unknown>;
      const candidates = [
        obj.credits,
        obj.creditHours,
        obj.credit_hours,
        obj.creditHour,
        obj.value,
        obj.total,
      ];

      for (const candidate of candidates) {
        const parsed = parseCredits(candidate);
        if (parsed > 0) return parsed;
      }
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

  // Merge curriculum-level banned combinations into available courses
  const enrichedAvailableCourses = React.useMemo<AvailableCourse[]>(() => {
    if (Object.keys(curriculumBannedCombosMap).length === 0) return availableCourses;
    return availableCourses.map(course => {
      const extraBanned = curriculumBannedCombosMap[course.code] || [];
      if (extraBanned.length === 0) return course;
      const merged = Array.from(new Set([...(course.bannedWith || []), ...extraBanned]));
      return { ...course, bannedWith: merged };
    });
  }, [availableCourses, curriculumBannedCombosMap]);

  // Calculate credits by category (dynamic — uses actual category names from planned courses)
  const creditsByCategory = React.useMemo(() => {
    const all: Record<string, number> = {};

    plannedCourses.forEach(course => {
      const category = course.category || 'Uncategorized';
      all[category] = (all[category] || 0) + (course.credits || 0);
    });

    // Normalized buckets kept for legacy compatibility
    const genEd = (all['General Ed'] || 0) + (all['General Education'] || 0);
    const core = (all['Core'] || 0) + (all['Core Courses'] || 0) + (all['Major'] || 0);
    const majorElectives = (all['Major Elective'] || 0) + (all['Major Electives'] || 0);
    const freeElectives = (all['Free Elective'] || 0) + (all['Free Electives'] || 0);

    return { genEd, core, majorElectives, freeElectives, all };
  }, [plannedCourses]);

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

        // Load elective rules from saved audit data
        if (auditData.electiveRules && Array.isArray(auditData.electiveRules)) {
          setElectiveRules(auditData.electiveRules);
        }

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
            const creditsRaw = (courseData as any)?.credits;
            const credits = creditsRaw ? parseCredits(creditsRaw) : 3;
            const category = (courseData as any)?.category || 'Uncategorized';
            const derivedSemesterValue = getSemesterValueFromLabel((courseData as any)?.plannedSemester);
            const derivedSemesterLabel = ensureSemesterLabel((courseData as any)?.plannedSemester, derivedSemesterValue);
            
            return {
              id: `planned-${code}-${Date.now()}-${index}`,
              code: code,
              title: title,
              credits: credits,
              category: category,
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
      fetchCurriculumConstraints();
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

  // Enrich planned course categories once availableCourses are loaded
  // (auto-synced courses from data-entry may lack category info)
  useEffect(() => {
    if (availableCourses.length === 0) return;
    setPlannedCourses(prev => prev.map(course => {
      if (course.category && course.category !== 'Uncategorized') return course;
      const found = availableCourses.find(ac => ac.code === course.code);
      if (found?.category) return { ...course, category: found.category };
      return course;
    }));
  }, [availableCourses]);

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
      const departmentId = dataEntryContext.actualDepartmentId || dataEntryContext.selectedDepartment;
      const curriculumId = dataEntryContext.selectedCurriculum;

      // Normalize helper
      const normalizeCodeArray = (arr: any[]): string[] =>
        (arr || []).map((item: any) => {
          if (typeof item === 'string') return item.trim();
          const candidate =
            item?.code ||
            item?.courseCode ||
            item?.course_code ||
            item?.prerequisiteCode ||
            item?.prerequisite_code ||
            item?.corequisiteCode ||
            item?.corequisite_code ||
            item?.prerequisite_course_code ||
            item?.corequisite_course_code ||
            item?.course?.code ||
            item?.course?.courseCode ||
            item?.course?.course_code ||
            item?.prerequisite?.code ||
            item?.prerequisite_course?.code ||
            item?.prerequisiteCourse?.code ||
            item?.prerequisiteCourse?.course?.code ||
            item?.corequisite?.code ||
            item?.corequisite_course?.code ||
            item?.corequisiteCourse?.code ||
            item?.corequisiteCourse?.course?.code ||
            '';
          return String(candidate).trim();
        }).filter(Boolean);

      // ── Fetch 1: available courses list ──────────────────────────────────
      const [coursesResponse, curriculumResponse] = await Promise.all([
        fetch(`${API_BASE}/available-courses?curriculum_id=${curriculumId}&department_id=${departmentId}`, {
          credentials: 'include'
        }),
        // ── Fetch 2: full curriculum data – to get CurriculumCourse pivot IDs ──
        fetch(`${API_BASE}/public-curricula/${curriculumId}`, {
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        }),
      ]);

      if (!coursesResponse.ok) throw new Error('Failed to fetch available courses');
      const coursesData = await coursesResponse.json();

      // ── Build prereq / coreq map from curriculum course constraints ────────
      // The public-curricula/{id} endpoint returns curriculumCourses with IDs.
      // Section 6a of the API: GET /api/curricula/{cid}/courses/{ccId}/constraints
      // returns curriculumPrerequisites[] and curriculumCorequisites[] with code fields.
      //
      // strategy:
      //   1. extract prereqs from curriculumCourses[i].curriculumPrerequisites (if eager-loaded)
      //   2. also try curriculumCourses[i].course.prerequisites (global, if present)
      //   3. if neither, individually call the constraints endpoint per course

      const prereqMap: Record<string, string[]> = {};   // normalized course key → [prereqCodes]
      const coreqMap: Record<string, string[]> = {};    // normalized course key → [coreqCodes]
      const curriculumCreditsMap: Record<string, number> = {}; // normalized course key → numeric credits from curriculum payload
      // Store pivot IDs for later fallback individual fetches
      const pivotIdByCode: Record<string, string> = {};  // normalized course key → curriculumCourse.id

      if (curriculumResponse.ok) {
        const currData = await curriculumResponse.json();
        const curriculumCourses: any[] = (currData.curriculum || currData)?.curriculumCourses || [];

        curriculumCourses.forEach((cc: any) => {
          const code = (cc.course?.code || '').trim();
          const codeKey = toCourseKey(code);
          if (!code) return;
          if (cc.id) pivotIdByCode[codeKey] = cc.id;

          const curriculumParsedCredits = parseCredits(
            cc.course?.credits ??
            cc.course?.creditHours ??
            cc.course?.credit_hours ??
            cc.course?.creditHour ??
            0
          );
          if (curriculumParsedCredits > 0) {
            curriculumCreditsMap[codeKey] = curriculumParsedCredits;
          }

          const curriculumPrerequisites = cc.curriculumPrerequisites || cc.curriculum_prerequisites || [];
          const curriculumCorequisites = cc.curriculumCorequisites || cc.curriculum_corequisites || [];

          // Path A: curriculum-specific prerequisites already eager-loaded
          if (Array.isArray(curriculumPrerequisites) && curriculumPrerequisites.length > 0) {
            prereqMap[codeKey] = normalizeCodeArray(curriculumPrerequisites);
          } else if (Array.isArray(cc.course?.prerequisites) && cc.course.prerequisites.length > 0) {
            // Path B: global course-level prerequisites (CoursePrerequisite relation)
            prereqMap[codeKey] = normalizeCodeArray(cc.course.prerequisites);
          }

          if (Array.isArray(curriculumCorequisites) && curriculumCorequisites.length > 0) {
            coreqMap[codeKey] = normalizeCodeArray(curriculumCorequisites);
          } else if (Array.isArray(cc.course?.corequisites) && cc.course.corequisites.length > 0) {
            coreqMap[codeKey] = normalizeCodeArray(cc.course.corequisites);
          }
        });

        // ── Path C: If none of the courses got prereqs from the curriculum data,
        //    individually call section-6a constraints endpoint for each pivot ID.
        //    This handles backends that don't eager-load prereqs in the public endpoint.
        const codesNeedingPrereqs = Object.keys(pivotIdByCode).filter(code =>
          !prereqMap[code] && !coreqMap[code]
        );

        if (codesNeedingPrereqs.length > 0) {
          // Batch-fetch in parallel (max 10 at a time to avoid overwhelming the server)
          const BATCH = 10;
          for (let i = 0; i < codesNeedingPrereqs.length; i += BATCH) {
            const batch = codesNeedingPrereqs.slice(i, i + BATCH);
            await Promise.all(batch.map(async (code) => {
              const ccId = pivotIdByCode[code];
              try {
                const r = await fetch(`${API_BASE}/curricula/${curriculumId}/courses/${ccId}/constraints`, {
                  credentials: 'include'
                });
                if (!r.ok) return;
                const d = await r.json();

                // Prefer curriculum-specific, fall back to base
                const prereqs = (d.curriculumPrerequisites?.length ? d.curriculumPrerequisites : d.basePrerequisites) || [];
                const coreqs = (d.curriculumCorequisites?.length ? d.curriculumCorequisites : d.baseCorequisites) || [];

                if (prereqs.length > 0) {
                  prereqMap[code] = normalizeCodeArray(prereqs);
                }
                if (coreqs.length > 0) {
                  coreqMap[code] = normalizeCodeArray(coreqs);
                }
              } catch {
                // silently skip per-course failures
              }
            }));
          }
        }
      }

      // ── Merge prereq/coreq data into courses ─────────────────────────────
      const coursesWithTrimmedCodes = (coursesData.courses || []).map((course: any) => {
        const code = (course.code || course.courseCode || course.course_code || course.course?.code || '').trim();
        const codeKey = toCourseKey(code);
        const creditsSource =
          course.credits ??
          course.creditHours ??
          course.credit_hours ??
          course.creditHour ??
          course.course_credit_hours ??
          course.courseCreditHours ??
          course.course?.credits ??
          course.course?.creditHours ??
          course.course?.credit_hours ??
          course.course?.creditHour ??
          curriculumCreditsMap[codeKey] ??
          '0';
        const parsedCredits = parseCredits(creditsSource);

        return {
          ...course,
          code,
          credits: parsedCredits,
          requiresPermission: Boolean(course.requiresPermission ?? course.requires_permission ?? false),
          summerOnly: Boolean(course.summerOnly ?? course.summer_only ?? false),
          requiresSeniorStanding: Boolean(course.requiresSeniorStanding ?? course.requires_senior_standing ?? false),
          minCreditThreshold: course.minCreditThreshold ?? course.min_credit_threshold ?? null,
          // Prefer individually-fetched map; fall back to whatever the API returned inline
          prerequisites: prereqMap[codeKey]?.length
            ? prereqMap[codeKey]
            : normalizeCodeArray(
              course.prerequisites ||
              course.prerequisiteCodes ||
              course.prerequisite_codes ||
              course.course?.prerequisites ||
              course.course?.prerequisiteCodes ||
              course.course?.prerequisite_codes ||
              []
            ),
          corequisites: coreqMap[codeKey]?.length
            ? coreqMap[codeKey]
            : normalizeCodeArray(
              course.corequisites ||
              course.corequisiteCodes ||
              course.corequisite_codes ||
              course.course?.corequisites ||
              course.course?.corequisiteCodes ||
              course.course?.corequisite_codes ||
              []
            ),
          bannedWith: normalizeCodeArray(course.bannedWith || course.banned_with || course.banned_combinations || []),
        };
      });

      // Defensive patch: if some entries still resolve to 0 credits, attempt a final parse from any known credit fields.
      const stabilizedCourses = coursesWithTrimmedCodes.map((course: any) => {
        if (typeof course.credits === 'number' && course.credits > 0) {
          return course;
        }
        const fallbackCreditSource =
          course.creditHours ??
          course.credit_hours ??
          course.creditHour ??
          course.course_credit_hours ??
          course.courseCreditHours ??
          course.course?.creditHours ??
          course.course?.credit_hours ??
          course.course?.creditHour ??
          course.course?.credits ??
          curriculumCreditsMap[toCourseKey(course.code)] ??
          course.credits;
        const fallbackCredits = parseCredits(fallbackCreditSource || '0');
        return {
          ...course,
          credits: fallbackCredits,
        };
      });

      if (process.env.NODE_ENV !== 'production') {
        const suspicious = stabilizedCourses.filter((c: any) => (c.credits || 0) <= 0 || ((c.prerequisites?.length || 0) + (c.corequisites?.length || 0) === 0));
        if (suspicious.length > 0) {
          console.log('🔎 available-courses suspicious records (first 15):', suspicious.slice(0, 15));
        }
      }

      console.log('📚 Courses with prereqs merged:', stabilizedCourses.filter((c: any) => c.prerequisites?.length > 0));
      setAvailableCourses(stabilizedCourses);
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

  // Fetch curriculum-level constraints (banned combinations) from the constraints API
  const fetchCurriculumConstraints = async () => {
    if (!dataEntryContext) return;

    try {
      const response = await fetch(
        `${API_BASE}/curricula/${dataEntryContext.selectedCurriculum}/constraints`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        console.log('No curriculum constraints found (this is okay)');
        return;
      }

      const data = await response.json();
      const constraints: any[] = data.constraints || [];

      // Build a map: courseCode -> [bannedWithCode, ...]
      // Each CUSTOM banned_combination entry lists N courses that cannot be taken together.
      const map: Record<string, string[]> = {};

      constraints
        .filter(
          (c: any) =>
            c.type === 'CUSTOM' &&
            c.config?.type === 'banned_combination' &&
            Array.isArray(c.config?.courses) &&
            c.config.courses.length >= 2
        )
        .forEach((c: any) => {
          const courses: Array<{ id: string; code: string }> = c.config.courses;
          courses.forEach((course, i) => {
            const code = (course.code || '').trim();
            if (!code) return;
            const otherCodes = courses
              .filter((_, j) => j !== i)
              .map((other) => (other.code || '').trim())
              .filter(Boolean);
            map[code] = Array.from(new Set([...(map[code] || []), ...otherCodes]));
          });
        });

      console.log('Curriculum banned combinations map:', map);
      setCurriculumBannedCombosMap(map);
    } catch (error) {
      console.log('Error fetching curriculum constraints (continuing):', error);
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
              credits: parseCredits(course.credits), // Ensure credits are parsed
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
        const courseSections: CourseSection[] = sections.map(schedCourse => {
          const fallbackTime = splitTimeRange(schedCourse.time);
          return {
            id: schedCourse.id,
            section: schedCourse.section || 'A',
            instructor: schedCourse.instructor || undefined,
            days: normalizeDays(schedCourse.days, schedCourse.day),
            timeStart: schedCourse.timeStart || fallbackTime.timeStart,
            timeEnd: schedCourse.timeEnd || fallbackTime.timeEnd,
            room: schedCourse.room || 'TBA',
            capacity: typeof schedCourse.capacity === 'number' ? schedCourse.capacity : 0,
            enrolled: typeof schedCourse.enrolled === 'number' ? schedCourse.enrolled : 0,
          };
        });
        
        // Use first section as default selected section
        const firstSection = courseSections[0];
        const firstSchedCourse = sections[0];
        
        const plannedCourse: PlannedCourse = {
          id: `${courseCode}-${schedule.semester}-${Date.now()}`,
          code: courseCode,
          title: firstSchedCourse.course.title,
          credits: parseCredits(firstSchedCourse.course.credits),
          semester: getSemesterValueFromLabel(schedule.semester),
          semesterLabel: schedule.semester,
          status: 'planning',
          validationStatus: 'valid',
          prerequisites: availableCourse.prerequisites,
          corequisites: availableCourse.corequisites,
          sections: courseSections,
          selectedSection: firstSection,
          source: 'tentative', // Mark as loaded from tentative schedule
        };
        
        newPlannedCourses.push(plannedCourse);
        coursesToAdd.push(courseCode);
      }
      
      // Add new courses to the plan
      if (newPlannedCourses.length > 0) {
        setPlannedCourses(prev => [...prev, ...newPlannedCourses]);
        // Reset saved state since plan has been modified
        setIsCoursePlanSaved(false);
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
    const currentCourseKey = toCourseKey(course.code);
    // First check if course is blacklisted for this curriculum
    if (Array.from(blacklistedCourses).some(code => toCourseKey(code) === currentCourseKey)) {
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
      const bannedKey = toCourseKey(trimmedBannedCode);
      if (Array.from(completedCourses).some(code => toCourseKey(code) === bannedKey)) {
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
      const bannedKey = toCourseKey(trimmedBannedCode);
      const plannedConflict = plannedCourses.find(planned => toCourseKey(planned.code) === bannedKey);
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
  const filteredCourses = enrichedAvailableCourses.filter(course => {
    const courseKey = toCourseKey(course.code);
    const matchesSearch = course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const notAlreadyPlanned = !plannedCourses.some(planned => toCourseKey(planned.code) === courseKey);
    const notAlreadyCompleted = !Array.from(completedCourses).some(code => toCourseKey(code) === courseKey);
    const notCurrentlyTaking = !Array.from(inProgressCourses).some(code => toCourseKey(code) === courseKey);
    
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
    const prerequisiteKey = toCourseKey(prerequisiteCode);
    return plannedCourses.filter(planned => 
      (planned.prerequisites || []).some(code => toCourseKey(code) === prerequisiteKey) &&
      !Array.from(completedCourses).some(code => toCourseKey(code) === prerequisiteKey) // Only if prerequisite is not completed
    );
  };

  // Add corequisites automatically
  const addCorequisites = (course: AvailableCourse, semester: string): AvailableCourse[] => {
    const corequisitesToAdd: AvailableCourse[] = [];
    
    if (!course.corequisites || course.corequisites.length === 0) {
      return corequisitesToAdd;
    }

    for (const coreqCode of course.corequisites) {
      const coreqKey = toCourseKey(coreqCode);
      // Skip if already completed or planned
      if (Array.from(completedCourses).some(code => toCourseKey(code) === coreqKey) || 
          plannedCourses.some(planned => toCourseKey(planned.code) === coreqKey)) {
        continue;
      }

      // Find the corequisite course in available courses (use enriched for correct bannedWith)
      const coreqCourse = enrichedAvailableCourses.find(c => toCourseKey(c.code) === coreqKey);
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

    const missing = course.prerequisites.filter(prereq => {
      const prereqKey = toCourseKey(prereq);
      return !Array.from(completedCourses).some(code => toCourseKey(code) === prereqKey) &&
        !plannedCourses.some(planned => toCourseKey(planned.code) === prereqKey);
    }
    );

    return { valid: missing.length === 0, missing };
  };

  // Live re-validation: re-evaluate every planned course's prereq status whenever the plan changes
  const liveValidatedPlannedCourses = useMemo(() => {
    const plannedCodeKeys = new Set(plannedCourses.map(c => toCourseKey(c.code)));
    const completedCodeKeys = new Set(Array.from(completedCourses).map(code => toCourseKey(code)));
    return plannedCourses.map(course => {
      // Preserve manual/system notes that are not regenerated by live checks
      const preservedNotes = (course.validationNotes || []).filter(
        n => !n.startsWith('Missing prerequisites:') && !n.startsWith('Missing corequisites:')
      );

      // Re-check prerequisites against current completed + planned set
      const prereqs = course.prerequisites || [];
      const missing = prereqs.filter(p => {
        const key = toCourseKey(p);
        return !completedCodeKeys.has(key) && !plannedCodeKeys.has(key);
      });
      const prereqNotes = missing.length > 0 ? [`Missing prerequisites: ${missing.join(', ')}`] : [];

      // Re-check corequisites against current completed + planned set
      const coreqs = course.corequisites || [];
      const missingCoreqs = coreqs.filter(c => {
        const key = toCourseKey(c);
        return !completedCodeKeys.has(key) && !plannedCodeKeys.has(key);
      });
      const coreqNotes = missingCoreqs.length > 0 ? [`Missing corequisites: ${missingCoreqs.join(', ')}`] : [];

      return {
        ...course,
        validationStatus: (missing.length > 0 || missingCoreqs.length > 0 ? 'warning' : 'valid') as 'valid' | 'warning',
        validationNotes: [...prereqNotes, ...coreqNotes, ...preservedNotes],
      };
    });
  }, [plannedCourses, completedCourses]);

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
          proceedWithAddingCourse(course, status, normalizedSemesterLabel, selectedSection, flagWarnings);
        }
      });
      return;
    }
    // ===== END: Course Flags Validation =====
    
    // If no warnings, proceed directly
    proceedWithAddingCourse(course, status, normalizedSemesterLabel, selectedSection, []);
  };
  
  // Helper function to proceed with adding course after validation
  const proceedWithAddingCourse = (
    course: AvailableCourse,
    status: PlannedCourse['status'],
    semesterLabel: string,
    selectedSection?: CourseSection,
    flagWarnings: string[] = []
  ) => {

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
      category: course.category,
      semester: selectedSemester,
      semesterLabel,
      status,
      prerequisites: course.prerequisites,
      corequisites: course.corequisites,
      sections: course.sections,
      selectedSection: selectedSection,
      validationStatus: (prerequisiteValidation.valid && flagWarnings.length === 0) ? 'valid' : 'warning',
      validationNotes: [
        ...(prerequisiteValidation.missing.length > 0
          ? [`Missing prerequisites: ${prerequisiteValidation.missing.join(', ')}`]
          : []),
        ...flagWarnings,
      ],
      source: 'manual', // Mark as manually added
    };

    // 5. Create corequisite planned courses
    const corequisitePlannedCourses: PlannedCourse[] = corequisitesToAdd.map(coreqCourse => ({
      id: `${coreqCourse.code}-${selectedSemester}`,
      code: coreqCourse.code,
      title: coreqCourse.title,
      credits: parseCredits(coreqCourse.credits),
      category: coreqCourse.category,
      semester: selectedSemester,
      semesterLabel,
      status,
      prerequisites: coreqCourse.prerequisites,
      corequisites: coreqCourse.corequisites,
      validationStatus: 'valid', // Corequisites are automatically valid when added together
      validationNotes: [`Auto-added as corequisite for ${course.code}`],
      source: 'manual', // Mark as manually added
    }));

    // 6. Add all courses (main + corequisites) to the plan
    setPlannedCourses(prev => [...prev, plannedCourse, ...corequisitePlannedCourses]);
    
    // Reset saved state since plan has been modified
    setIsCoursePlanSaved(false);
    
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
          // Reset saved state since plan has been modified
          setIsCoursePlanSaved(false);
        }
      });
    } else {
      // Simple removal - no dependents
      setPlannedCourses(prev => prev.filter(course => course.id !== courseId));
      // Reset saved state since plan has been modified
      setIsCoursePlanSaved(false);
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

    // Get completed courses with their credits
    const completedCourses = Object.entries(dataEntryContext?.completedCourses || {})
      .filter(([, course]) => course?.status === 'completed')
      .map(([code, course]) => ({
        code,
        credits: (course as any)?.credits || 3
      }));
    
    // Get the selected concentration from data entry context
    const selectedConcentration = dataEntryContext?.selectedConcentration;
    
    console.log('🔍 DEBUG: Analyzing concentrations with:', {
      selectedConcentration,
      concentrationsCount: concentrations.length,
      completedCourses,
      plannedCourses: plannedCourses.map(c => ({ code: c.code, credits: c.credits })),
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
      
      // Calculate total credits from completed courses in this concentration
      const completedCredits = completedCourses
        .filter(c => concentrationCourseCodes.includes(c.code))
        .reduce((sum, c) => sum + (parseCredits(c.credits) || 0), 0);
      
      // Calculate total credits from planned courses in this concentration
      const plannedCredits = plannedCourses
        .filter(c => concentrationCourseCodes.includes(c.code))
        .reduce((sum, c) => sum + (c.credits || 0), 0);
      
      const totalCredits = completedCredits + plannedCredits;
      const requiredCredits = concentration.requiredCredits || 1;
      const progress = (totalCredits / requiredCredits) * 100;
      const isEligible = totalCredits >= requiredCredits;
      const remainingCredits = Math.max(0, requiredCredits - totalCredits);

      console.log(`🔍 DEBUG: Concentration '${concentration.name}':`, {
        requiredCredits,
        concentrationCourses: concentrationCourseCodes,
        completedCredits,
        plannedCredits,
        totalCredits,
        progress: Math.min(100, progress),
        isEligible,
        remainingCredits
      });

      return {
        concentration,
        completedCourses: completedCourses.filter(c => concentrationCourseCodes.includes(c.code)).map(c => ({ id: c.code, code: c.code })),
        plannedCourses: plannedCourses.filter(c => concentrationCourseCodes.includes(c.code)).map(c => ({ id: c.id, code: c.code })),
        completedCredits,
        plannedCredits,
        totalCredits,
        progress: Math.min(100, progress),
        isEligible,
        remainingCourses: Math.ceil(remainingCredits / 3) // Estimate courses needed (assuming 3 credits per course)
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
      
      // Mark course plan as saved
      setIsCoursePlanSaved(true);
      
      // Analyze concentrations and show modal
      console.log('🔍 DEBUG: Starting concentration analysis...');
      const analysis = analyzeConcentrations();
      console.log('🔍 DEBUG: Analysis result:', analysis);
      
      setConcentrationAnalysis(analysis);
      setShowConcentrationModal(true);
      
    } catch (error) {
      console.error('Error saving course plan:', error);
      showError('Failed to save course plan. Please try again.', 'Save Failed');
    }
  };

  const captureCourseDiagnostics = async () => {
    if (!dataEntryContext) {
      warning('Data entry context is not ready yet.', 'Diagnostics Unavailable');
      return;
    }

    const requestedCode = diagnosticCode.trim();
    if (!requestedCode) {
      warning('Enter a course code first (e.g. CSX3011).', 'Course Code Required');
      return;
    }

    const curriculumId = dataEntryContext.selectedCurriculum;
    const departmentId = dataEntryContext.actualDepartmentId || dataEntryContext.selectedDepartment;

    try {
      setDiagnosticLoading(true);

      const [availableResponse, curriculumResponse] = await Promise.all([
        fetch(`${API_BASE}/available-courses?curriculum_id=${curriculumId}&department_id=${departmentId}`, {
          credentials: 'include',
        }),
        fetch(`${API_BASE}/public-curricula/${curriculumId}`, {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }),
      ]);

      const availableData = availableResponse.ok ? await availableResponse.json() : null;
      const curriculumData = curriculumResponse.ok ? await curriculumResponse.json() : null;

      const courseKey = toCourseKey(requestedCode);
      const availableCourse = (availableData?.courses || []).find((course: any) => {
        const code = course?.code || course?.courseCode || course?.course_code || course?.course?.code || '';
        return toCourseKey(String(code)) === courseKey;
      }) || null;

      const curriculumCourses = (curriculumData?.curriculum || curriculumData)?.curriculumCourses || [];
      const curriculumCourse = curriculumCourses.find((cc: any) =>
        toCourseKey(cc?.course?.code || cc?.course?.courseCode || cc?.course?.course_code || '') === courseKey
      ) || null;

      let constraintsData: any = null;
      if (curriculumCourse?.id) {
        const constraintsResponse = await fetch(
          `${API_BASE}/curricula/${curriculumId}/courses/${curriculumCourse.id}/constraints`,
          { credentials: 'include' }
        );
        constraintsData = constraintsResponse.ok ? await constraintsResponse.json() : null;
      }

      const payload = {
        capturedAt: new Date().toISOString(),
        requestedCode,
        request: { curriculumId, departmentId },
        availableCourse,
        curriculumCourse,
        constraintsData,
      };

      setDiagnosticPayload(payload);
      success(`Diagnostics captured for ${requestedCode}`, 'Diagnostics Ready');
    } catch (err) {
      console.error('Error capturing diagnostics:', err);
      showError('Failed to capture diagnostics payload. Please try again.', 'Diagnostics Failed');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const copyDiagnosticsPayload = async () => {
    if (!diagnosticPayload) {
      warning('Capture diagnostics first.', 'No Payload Yet');
      return;
    }

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(JSON.stringify(diagnosticPayload, null, 2));
      success('Diagnostics JSON copied. Paste it in chat.', 'Copied');
    } catch {
      warning('Copy failed. Select and copy the JSON shown below manually.', 'Clipboard Unavailable');
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

      <Tabs value={planningTab} onValueChange={(value) => setPlanningTab(value as 'planning' | 'schedule')} className="mb-4 sm:mb-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="planning">Planning Features</TabsTrigger>
          <TabsTrigger value="schedule">Tentative & Schedule</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Prompt to load tentative schedule and add completed courses */}
      <div className="space-y-3 mb-4 sm:mb-6">
        {planningTab === 'schedule' && !selectedTentativeSchedule && (
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

        {/* Diagnostics capture card temporarily hidden from UI per request. */}
      </div>

      <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${planningTab === 'planning' ? 'xl:grid-cols-3' : ''}`}>
        {/* Course Search and Selection - Left Panel */}
        <div className={`${planningTab === 'planning' ? 'xl:col-span-2' : 'xl:col-span-3'} space-y-4 sm:space-y-6`}>
          {/* Search and Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search size={20} />
                {planningTab === 'planning' ? 'Available Courses' : 'Tentative Schedule'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              {planningTab === 'planning' && (
                <CourseSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  categoryOptions={categoryOptions}
                  filteredCoursesCount={filteredCourses.length}
                />
              )}

              <div className="border-2 border-primary/20 rounded-lg p-3 sm:p-4 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="text-sm font-semibold text-foreground flex items-center gap-2 mb-2">
                  {planningTab === 'schedule' ? <Sparkles className="w-4 h-4 text-primary" /> : <Plus className="w-4 h-4" />}
                  {planningTab === 'schedule' ? 'Tentative Schedule View' : 'Planning View'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {planningTab === 'schedule'
                    ? 'Load published tentative schedules and review section/time-based display.'
                    : 'Browse available courses and build your future plan.'}
                </p>
              </div>

              {/* Semester Selection */}
              {planningTab === 'planning' && (
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
              )}

              {/* Tentative Schedule Selector - Only visible in tentative mode */}
              {planningTab === 'schedule' && (
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
              )}

              {/* Course Flags Legend - Mobile-optimized */}
              {planningTab === 'planning' && (
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
              )}

              {/* Course List */}
              {planningTab === 'planning' && (
              <div className="max-h-[500px] sm:max-h-[600px] overflow-y-auto space-y-2 sm:space-y-3">
                {filteredCourses.map((course) => {
                  const prerequisiteValidation = validatePrerequisites(course);
                  const bannedValidation = validateBannedCombinations(course);
                  const hasSections = course.sections && course.sections.length > 0;
                  
                  // Only show sections if a tentative schedule is loaded AND course has sections
                  if (hasSections && showSectionsInList && selectedTentativeSchedule && selectedTentativeSchedule !== 'none') {
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Course Plan Summary - Right Panel */}
        {planningTab === 'planning' && (
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
                {liveValidatedPlannedCourses.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No courses planned yet
                  </p>
                ) : (
                  <>
                    {/* Group courses by semester */}
                    {Object.entries(
                      liveValidatedPlannedCourses.reduce((acc, course) => {
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
              {/* Credits by Category */}
              <div className="space-y-3 pb-3 border-b">
                <div className="text-sm font-medium text-muted-foreground mb-2">Credits by Category</div>
                
                {Object.entries(creditsByCategory.all).filter(([, v]) => v > 0).length === 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {([['General Ed', 'bg-blue-50/50 dark:bg-blue-950/20'], ['Core', 'bg-purple-50/50 dark:bg-purple-950/20'], ['Major Electives', 'bg-green-50/50 dark:bg-green-950/20'], ['Free Electives', 'bg-orange-50/50 dark:bg-orange-950/20']] as [string, string][]).map(([label, colorClass]) => (
                      <div key={label} className={`p-3 rounded-lg border ${colorClass}`}>
                        <div className="text-xs text-muted-foreground mb-1">{label}</div>
                        <div className="text-xl font-bold">0</div>
                        <div className="text-xs text-muted-foreground">credits</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(creditsByCategory.all)
                      .filter(([, v]) => v > 0)
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([category, credits], idx) => {
                        const colorClasses = [
                          'bg-blue-50/50 dark:bg-blue-950/20',
                          'bg-purple-50/50 dark:bg-purple-950/20',
                          'bg-green-50/50 dark:bg-green-950/20',
                          'bg-orange-50/50 dark:bg-orange-950/20',
                          'bg-teal-50/50 dark:bg-teal-950/20',
                          'bg-pink-50/50 dark:bg-pink-950/20',
                        ];
                        return (
                          <div key={category} className={`p-3 rounded-lg border ${colorClasses[idx % colorClasses.length]}`}>
                            <div className="text-xs text-muted-foreground mb-1 leading-tight">{category}</div>
                            <div className="text-xl font-bold">{credits}</div>
                            <div className="text-xs text-muted-foreground">credits</div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Category Pool Progress shortcut */}
              {electiveRules.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 -mt-1"
                  onClick={() => setShowCategoryModal(true)}
                >
                  <LayoutGrid size={12} className="mr-1" />
                  View Category Pool Progress →
                </Button>
              )}

              {/* Overall Statistics */}
              <div className="space-y-2 pt-2">
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
                    {liveValidatedPlannedCourses.filter(c => c.validationStatus === 'valid').length}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Warnings:</span>
                  <span className="font-medium text-orange-600">
                    {liveValidatedPlannedCourses.filter(c => c.validationStatus === 'warning').length}
                  </span>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="pt-4 border-t space-y-2">
                {isCoursePlanSaved && plannedCourses.length > 0 && (
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => router.push('/student/management/schedule-view')}
                  >
                    <Calendar size={16} className="mr-2" />
                    Visualize Schedule
                  </Button>
                )}
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
        )}
      </div>
      
      {/* Schedule Calendar View - Full Width */}
      {planningTab === 'schedule' && (plannedCourses.length > 0 || Boolean(selectedTentativeSchedule)) && (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="text-xl font-semibold flex items-center gap-2 mb-1">
                <Calendar size={20} />
                Your Schedule
              </h2>
              {user?.advisor && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <UserCheck size={14} />
                  <span>Advisor: <span className="font-medium text-foreground">{user.advisor.name}</span></span>
                </div>
              )}
            </div>
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
          
          {plannedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                {loadingSchedules ? 'Loading tentative schedule courses...' : 'No courses loaded from selected tentative schedule yet.'}
              </CardContent>
            </Card>
          ) : viewMode === 'calendar' ? (
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
                    liveValidatedPlannedCourses.reduce((acc, course) => {
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
                          <div key={course.id} className="border rounded-lg p-4 hover:bg-muted/50 relative">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <div className="font-semibold text-lg">{course.code}</div>
                                  <Badge>{course.credits} credits</Badge>
                                  {course.source === 'tentative' && (
                                    <Badge variant="secondary" className="text-xs gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
                                      <Sparkles className="w-3 h-3" />
                                      From Schedule
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mb-2">{course.title}</div>
                                
                                {/* Prerequisites and Corequisites */}
                                {course.prerequisites && course.prerequisites.length > 0 && (
                                  <div className="text-xs text-muted-foreground/80 mb-1">
                                    <span className="font-medium">Prerequisites:</span> {course.prerequisites.join(', ')}
                                  </div>
                                )}
                                {course.corequisites && course.corequisites.length > 0 && (
                                  <div className="text-xs text-muted-foreground/80 mb-1">
                                    <span className="font-medium">Corequisites:</span> {course.corequisites.join(', ')}
                                  </div>
                                )}
                                
                                {/* Validation Status and Warnings */}
                                {course.validationStatus && (
                                  <div className="flex items-center gap-2 mt-1 mb-1">
                                    {course.validationStatus === 'valid' && (
                                      <Badge variant="outline" className="text-xs gap-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700">
                                        <CheckCircle className="w-3 h-3" />
                                        Valid
                                      </Badge>
                                    )}
                                    {course.validationStatus === 'warning' && (
                                      <Badge variant="outline" className="text-xs gap-1 bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-700">
                                        <AlertTriangle className="w-3 h-3" />
                                        Warning
                                      </Badge>
                                    )}
                                    {course.validationStatus === 'error' && (
                                      <Badge variant="outline" className="text-xs gap-1 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border-red-300 dark:border-red-700">
                                        <AlertTriangle className="w-3 h-3" />
                                        Error
                                      </Badge>
                                    )}
                                  </div>
                                )}
                                {course.validationNotes && course.validationNotes.length > 0 && (
                                  <Alert className="py-2 px-3 mt-2">
                                    <AlertDescription className="text-xs">
                                      {course.validationNotes.join(', ')}
                                    </AlertDescription>
                                  </Alert>
                                )}
                                
                                {/* Section Selection - only show if sections available */}
                                {course.sections && course.sections.length > 0 && (
                                  <div className="mt-2">
                                    <Select
                                      value={course.selectedSection?.id || course.sections[0]?.id}
                                      onValueChange={(sectionId) => {
                                        const section = course.sections?.find(s => s.id === sectionId);
                                        if (section) {
                                          handleSectionSelect(course.id, section);
                                        }
                                      }}
                                    >
                                      <SelectTrigger className="w-full text-sm">
                                        <SelectValue>
                                          {course.selectedSection ? (
                                            <span className="flex items-center gap-2">
                                              <span className="font-medium">Section {course.selectedSection.section}</span>
                                              {course.selectedSection.instructor && (
                                                <span className="text-muted-foreground">• {course.selectedSection.instructor}</span>
                                              )}
                                              {course.selectedSection.days && course.selectedSection.days.length > 0 && (
                                                <span className="text-muted-foreground">• {course.selectedSection.days.join('')}</span>
                                              )}
                                              {course.selectedSection.timeStart && (
                                                <span className="text-muted-foreground">• {course.selectedSection.timeStart}</span>
                                              )}
                                            </span>
                                          ) : (
                                            'Select section'
                                          )}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {course.sections.map((section) => (
                                          <SelectItem key={section.id} value={section.id}>
                                            <div className="flex flex-col py-1">
                                              <div className="font-medium">
                                                Section {section.section}
                                                {section.instructor && ` - ${section.instructor}`}
                                              </div>
                                              <div className="text-xs text-muted-foreground">
                                                {section.days && section.days.length > 0 && `${section.days.join(', ')} `}
                                                {section.timeStart && `${section.timeStart} - ${section.timeEnd} `}
                                                {section.room && `• Room ${section.room}`}
                                              </div>
                                              {section.capacity && (
                                                <div className="text-xs text-muted-foreground">
                                                  Enrolled: {section.enrolled || 0}/{section.capacity}
                                                </div>
                                              )}
                                            </div>
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    {course.sections.length > 1 && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {course.sections.length} sections available
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Remove button */}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeCourseFromPlan(course.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
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
          
          {/* Credit Pool Progress — brief summary inside concentration modal */}
          {electiveRules.length > 0 && (
            <div className="mb-6 p-4 rounded-xl border bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <LayoutGrid size={15} className="text-indigo-500" />
                <span className="text-sm font-semibold text-foreground">Credit Pool Requirements</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {electiveRules.map(rule => {
                  const filled = creditsByCategory.all[rule.category] || 0;
                  const req = rule.required_credits;
                  const pct = req > 0 ? Math.min(100, Math.round((filled / req) * 100)) : 100;
                  const isComplete = filled >= req;
                  return (
                    <div key={rule.id} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium truncate max-w-[65%]">{rule.category}</span>
                        <span className={isComplete ? 'text-green-600 font-semibold' : 'text-muted-foreground'}>{filled}/{req} cr</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-indigo-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
              completedCourses: analysis.completedCourses.map(c => ({ 
                id: c.id, 
                code: c.code, 
                name: c.code 
              })),
              plannedCourses: analysis.plannedCourses.map(c => ({ 
                id: c.id, 
                code: c.code, 
                name: c.code 
              })),
              completedCredits: analysis.completedCredits,
              plannedCredits: analysis.plannedCredits,
              totalCredits: analysis.totalCredits,
              remainingCourses: analysis.remainingCourses
            } as ConcentrationProgressProps))}
            onClose={() => setShowConcentrationModal(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Category Pool Progress Modal */}
      <Dialog open={showCategoryModal} onOpenChange={setShowCategoryModal}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <LayoutGrid size={18} className="sm:w-5 sm:h-5" />
              Category Pool Progress
            </DialogTitle>
            <DialogDescription>
              Based on your planned courses, here's how much of each category credit requirement you've filled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {electiveRules.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <LayoutGrid size={48} className="mx-auto mb-4 opacity-50" />
                <p>No category requirements configured for this curriculum.</p>
              </div>
            ) : (
              electiveRules.map(rule => {
                const filled = creditsByCategory.all[rule.category] || 0;
                const required = rule.required_credits;
                const pct = required > 0 ? Math.min(100, Math.round((filled / required) * 100)) : 100;
                const isComplete = filled >= required;
                const remaining = Math.max(0, required - filled);

                return (
                  <div key={rule.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{rule.category}</h3>
                        {rule.description && (
                          <p className="text-sm text-muted-foreground mt-0.5">{rule.description}</p>
                        )}
                      </div>
                      <div className={`text-2xl font-bold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                        {pct}%
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${isComplete ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{filled} / {required} credits</span>
                      {isComplete ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle size={14} />
                          <span className="font-medium text-xs">Pool fulfilled!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-blue-600">
                          <Clock size={14} />
                          <span className="text-xs">{remaining} more credits needed</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => {
                setShowCategoryModal(false);
                router.push('/student/management/progress');
              }}
            >
              View Detailed Progress
            </Button>
          </div>
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

    </div>
  );
}