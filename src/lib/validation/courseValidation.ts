// Course validation and recommendation engine
// Integrates with curriculum constraints, elective rules, and blacklists

import { getPublicCurriculum, getPublicCourses, API_BASE } from '@/lib/api/laravel';

export interface CourseRecommendation {
  courseCode: string;
  courseName: string;
  credits: number;
  category: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  prerequisites?: string[];
  semester?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  recommendations: CourseRecommendation[];
}

export interface CurriculumProgress {
  totalCreditsRequired: number;
  totalCreditsCompleted: number;
  totalCreditsInProgress: number;
  categoryProgress: {
    [category: string]: {
      required: number;
      completed: number;
      inProgress: number;
      remaining: number;
      courses: string[];
    };
  };
  electiveProgress: {
    freeElectives: {
      required: number;
      completed: number;
      remaining: number;
    };
    majorElectives: {
      required: number;
      completed: number;
      remaining: number;
    };
  };
  graduationEligibility: {
    eligible: boolean;
    requirements: {
      name: string;
      satisfied: boolean;
      details: string;
    }[];
  };
}

export interface StudentCourseData {
  courseCode: string;
  courseName: string;
  credits: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING' | 'FAILED' | 'DROPPED';
  grade?: string;
  category?: string;
}

export interface CourseInfo {
  code: string;
  title: string;
  creditHours: number;
  prerequisites?: string[];
}

export interface CurriculumData {
  id: string;
  name: string;
  totalCreditsRequired?: number;
  totalCredits?: number;
}

export interface ConstraintData {
  courseType: string;
  minCredits: number;
  courses?: string[];
}

export interface ElectiveRuleData {
  ruleType: string;
  description: string;
  requiredCourses: number;
  courseList: string[];
}

export interface BlacklistData {
  courses: string[];
  reason?: string;
}

/**
 * Validate student courses against curriculum requirements
 */
export async function validateStudentProgress(
  courses: StudentCourseData[],
  curriculumId: string,
  departmentId: string
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const recommendations: CourseRecommendation[] = [];

  try {
    // Fetch curriculum data
    const [curriculum, constraints, electiveRules, blacklists] = await Promise.all([
      fetchCurriculum(curriculumId),
      fetchConstraints(curriculumId),
      fetchElectiveRules(curriculumId),
      fetchBlacklists(curriculumId)
    ]);

    // Validate against constraints
    const constraintValidation = validateConstraints(courses, constraints);
    errors.push(...constraintValidation.errors);
    warnings.push(...constraintValidation.warnings);

    // Validate against elective rules
    const electiveValidation = validateElectiveRules(courses, electiveRules);
    errors.push(...electiveValidation.errors);
    warnings.push(...electiveValidation.warnings);

    // Check blacklisted combinations
    const blacklistValidation = validateBlacklists(courses, blacklists);
    errors.push(...blacklistValidation.errors);
    warnings.push(...blacklistValidation.warnings);

    // Generate recommendations
    const courseRecommendations = await generateRecommendations(
      courses,
      curriculum,
      constraints,
      electiveRules,
      departmentId
    );
    recommendations.push(...courseRecommendations);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      recommendations
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: [],
      recommendations: []
    };
  }
}

/**
 * Calculate detailed curriculum progress
 */
export async function calculateCurriculumProgress(
  courses: StudentCourseData[],
  curriculumId: string
): Promise<CurriculumProgress> {
  try {
    const [curriculum, constraints] = await Promise.all([
      fetchCurriculum(curriculumId),
      fetchConstraints(curriculumId)
    ]);

    const completedCourses = courses.filter(c => c.status === 'COMPLETED');
    const inProgressCourses = courses.filter(c => c.status === 'IN_PROGRESS');

    const totalCreditsCompleted = completedCourses.reduce((sum, c) => sum + c.credits, 0);
    const totalCreditsInProgress = inProgressCourses.reduce((sum, c) => sum + c.credits, 0);

    // Calculate category progress
    const categoryProgress: CurriculumProgress['categoryProgress'] = {};
    
    for (const constraint of constraints) {
      const categoryName = constraint.courseType || 'General';
      const requiredCredits = constraint.minCredits || 0;
      
      const categoryCourses = completedCourses.filter(c => 
        constraint.courses?.includes(c.courseCode) || c.category === categoryName
      );
      
      const categoryInProgress = inProgressCourses.filter(c => 
        constraint.courses?.includes(c.courseCode) || c.category === categoryName
      );

      const completedCredits = categoryCourses.reduce((sum, c) => sum + c.credits, 0);
      const inProgressCredits = categoryInProgress.reduce((sum, c) => sum + c.credits, 0);

      categoryProgress[categoryName] = {
        required: requiredCredits,
        completed: completedCredits,
        inProgress: inProgressCredits,
        remaining: Math.max(0, requiredCredits - completedCredits - inProgressCredits),
        courses: categoryCourses.map(c => c.courseCode)
      };
    }

    // Calculate elective progress
    const freeElectiveCredits = completedCourses
      .filter(c => c.category === 'Free Electives' || c.category === 'Electives')
      .reduce((sum, c) => sum + c.credits, 0);

    const majorElectiveCredits = completedCourses
      .filter(c => c.category === 'Major Electives')
      .reduce((sum, c) => sum + c.credits, 0);

    // Check graduation eligibility
    const requirements = [
      {
        name: 'Minimum Credit Hours',
        satisfied: totalCreditsCompleted >= (curriculum.totalCreditsRequired ?? curriculum.totalCredits ?? 120),
        details: `${totalCreditsCompleted}/${curriculum.totalCreditsRequired ?? curriculum.totalCredits ?? 120} credits completed`
      },
      {
        name: 'Core Course Requirements',
        satisfied: categoryProgress['Core']?.remaining === 0,
        details: `${categoryProgress['Core']?.completed || 0}/${categoryProgress['Core']?.required || 0} core credits`
      },
      {
        name: 'GPA Requirement',
        satisfied: calculateGPA(completedCourses) >= 2.0,
        details: `Current GPA: ${calculateGPA(completedCourses).toFixed(2)}`
      }
    ];

    return {
      totalCreditsRequired: curriculum.totalCreditsRequired ?? curriculum.totalCredits ?? 120,
      totalCreditsCompleted,
      totalCreditsInProgress,
      categoryProgress,
      electiveProgress: {
        freeElectives: {
          required: 12, // Default, should come from curriculum
          completed: freeElectiveCredits,
          remaining: Math.max(0, 12 - freeElectiveCredits)
        },
        majorElectives: {
          required: 9, // Default, should come from curriculum
          completed: majorElectiveCredits,
          remaining: Math.max(0, 9 - majorElectiveCredits)
        }
      },
      graduationEligibility: {
        eligible: requirements.every(req => req.satisfied),
        requirements
      }
    };

  } catch (error) {
    throw new Error(`Failed to calculate progress: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate smart course recommendations
 */
async function generateRecommendations(
  courses: StudentCourseData[],
  curriculum: CurriculumData,
  constraints: ConstraintData[],
  electiveRules: ElectiveRuleData[],
  departmentId: string
): Promise<CourseRecommendation[]> {
  const recommendations: CourseRecommendation[] = [];
  const completedCodes = new Set(courses.filter(c => c.status === 'COMPLETED').map(c => c.courseCode));
  const inProgressCodes = new Set(courses.filter(c => c.status === 'IN_PROGRESS').map(c => c.courseCode));

  try {
    // Fetch available courses for the department
    const availableCourses: CourseInfo[] = await fetchCourses(departmentId, curriculum.id);

    // Recommend missing core courses
    for (const constraint of constraints) {
      if (constraint.courseType === 'Core' && constraint.courses) {
        for (const courseCode of constraint.courses) {
          if (!completedCodes.has(courseCode) && !inProgressCodes.has(courseCode)) {
            const course = availableCourses.find((c: CourseInfo) => c.code === courseCode);
            if (course) {
              recommendations.push({
                courseCode,
                courseName: course.title,
                credits: course.creditHours,
                category: 'Core',
                priority: 'high',
                reason: 'Required core course',
                prerequisites: course.prerequisites || []
              });
            }
          }
        }
      }
    }

    // Recommend electives based on rules
    for (const rule of electiveRules) {
      if (rule.courseList && rule.requiredCourses) {
        const takenFromRule = rule.courseList.filter((code: string) => completedCodes.has(code)).length;
        const needed = rule.requiredCourses - takenFromRule;
        
        if (needed > 0) {
          const availableFromRule = rule.courseList.filter((code: string) => 
            !completedCodes.has(code) && !inProgressCodes.has(code)
          );

          for (const courseCode of availableFromRule.slice(0, needed)) {
            const course = availableCourses.find((c: CourseInfo) => c.code === courseCode);
            if (course) {
              recommendations.push({
                courseCode,
                courseName: course.title,
                credits: course.creditHours,
                category: rule.ruleType || 'Elective',
                priority: 'medium',
                reason: `Elective requirement: ${rule.description || 'Meet elective criteria'}`,
                prerequisites: course.prerequisites || []
              });
            }
          }
        }
      }
    }

    // Sort recommendations by priority and prerequisites
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, 10); // Limit to top 10 recommendations

  } catch (error) {
    console.error('Failed to generate recommendations:', error);
    return [];
  }
}

// Helper functions for API calls
async function fetchCurriculum(curriculumId: string): Promise<CurriculumData> {
  const data = await getPublicCurriculum(parseInt(curriculumId));
  return data.curriculum;
}

async function fetchConstraints(curriculumId: string): Promise<ConstraintData[]> {
  const response = await fetch(`${API_BASE}/api/public-curricula/${curriculumId}/constraints`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch constraints');
  const data = await response.json();
  return data.constraints;
}

async function fetchElectiveRules(curriculumId: string): Promise<ElectiveRuleData[]> {
  const response = await fetch(`${API_BASE}/api/public-curricula/${curriculumId}/elective-rules`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch elective rules');
  const data = await response.json();
  return data.electiveRules;
}

async function fetchBlacklists(curriculumId: string): Promise<BlacklistData[]> {
  const response = await fetch(`${API_BASE}/api/public-curricula/${curriculumId}/blacklists`, {
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Failed to fetch blacklists');
  const data = await response.json();
  return data.blacklists;
}

async function fetchCourses(departmentId: string, curriculumId?: string): Promise<CourseInfo[]> {
  // If we have both IDs, use the available-courses endpoint which includes departmentCourseTypes
  if (curriculumId && departmentId) {
    const response = await fetch(`${API_BASE}/api/available-courses?curriculumId=${curriculumId}&departmentId=${departmentId}`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch available courses');
    const data = await response.json();
    return data.courses || [];
  }
  
  // Use public courses endpoint
  const courses = await getPublicCourses();
  return courses.filter((c: any) => c.departmentId === parseInt(departmentId));
}

// Validation helper functions
function validateConstraints(courses: StudentCourseData[], constraints: ConstraintData[]) {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const constraint of constraints) {
    if (constraint.minCredits) {
      const relevantCourses = courses.filter(c => 
        constraint.courses?.includes(c.courseCode) && c.status === 'COMPLETED'
      );
      const totalCredits = relevantCourses.reduce((sum, c) => sum + c.credits, 0);
      
      if (totalCredits < constraint.minCredits) {
        errors.push(`Insufficient credits in ${constraint.courseType}: ${totalCredits}/${constraint.minCredits}`);
      }
    }
  }

  return { errors, warnings };
}

function validateElectiveRules(courses: StudentCourseData[], electiveRules: ElectiveRuleData[]) {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of electiveRules) {
    if (rule.requiredCourses && rule.courseList) {
      const takenCourses = rule.courseList.filter((code: string) => 
        courses.some(c => c.courseCode === code && c.status === 'COMPLETED')
      ).length;
      
      if (takenCourses < rule.requiredCourses) {
        warnings.push(`Elective rule not satisfied: ${takenCourses}/${rule.requiredCourses} courses from ${rule.description}`);
      }
    }
  }

  return { errors, warnings };
}

function validateBlacklists(courses: StudentCourseData[], blacklists: BlacklistData[]) {
  const errors: string[] = [];
  const warnings: string[] = [];
  const completedCodes = courses.filter(c => c.status === 'COMPLETED').map(c => c.courseCode);

  for (const blacklist of blacklists) {
    if (blacklist.courses && blacklist.courses.length > 1) {
      const takenFromBlacklist = blacklist.courses.filter((code: string) => completedCodes.includes(code));
      
      if (takenFromBlacklist.length > 1) {
        errors.push(`Blacklist violation: Cannot take multiple courses from [${takenFromBlacklist.join(', ')}] - ${blacklist.reason || 'Conflicting courses'}`);
      }
    }
  }

  return { errors, warnings };
}

function calculateGPA(courses: StudentCourseData[]): number {
  let totalPoints = 0;
  let totalCredits = 0;

  const gradePoints: { [grade: string]: number } = {
    'A+': 4.0, 'A': 4.0, 'A-': 3.7,
    'B+': 3.3, 'B': 3.0, 'B-': 2.7,
    'C+': 2.3, 'C': 2.0, 'C-': 1.7,
    'D+': 1.3, 'D': 1.0, 'D-': 0.7,
    'F': 0.0
  };

  for (const course of courses) {
    if (course.status === 'COMPLETED' && course.grade && gradePoints[course.grade] !== undefined) {
      totalPoints += gradePoints[course.grade] * course.credits;
      totalCredits += course.credits;
    }
  }

  return totalCredits > 0 ? totalPoints / totalCredits : 0;
}
