// Session management for anonymous students
// Handles course data persistence across browser sessions

import { type CourseData } from '@/components/excel/ExcelUtils';

export interface AnonymousSession {
  id: string;
  curriculum: string;
  department: string;
  concentration?: string;
  courses: CourseData[];
  createdAt: string;
  lastModified: string;
  expiresAt: string;
}

export interface SessionStorageData {
  courses: { [courseCode: string]: CourseStatus };
  curriculum: string;
  department: string;
  concentration?: string;
  freeElectives: { code: string; title: string; credits: number }[];
  lastSaved: string;
}

export interface CourseStatus {
  status: 'not_completed' | 'completed' | 'taking' | 'planning';
  grade?: string;
}

const SESSION_KEY = 'course-audit-session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

/**
 * Create a new anonymous session
 */
export function createAnonymousSession(
  curriculum: string,
  department: string,
  concentration?: string
): AnonymousSession {
  const now = new Date();
  const session: AnonymousSession = {
    id: generateSessionId(),
    curriculum,
    department,
    concentration,
    courses: [],
    createdAt: now.toISOString(),
    lastModified: now.toISOString(),
    expiresAt: new Date(now.getTime() + SESSION_DURATION).toISOString()
  };

  saveSessionToStorage(session);
  return session;
}

/**
 * Load existing session from storage
 */
export function loadAnonymousSession(): AnonymousSession | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;

    const session: AnonymousSession = JSON.parse(stored);
    
    // Check if session has expired
    if (new Date(session.expiresAt) < new Date()) {
      clearSession();
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
}

/**
 * Update session with new course data
 */
export function updateSessionCourses(courses: CourseData[]): void {
  const session = loadAnonymousSession();
  if (!session) return;

  session.courses = courses;
  session.lastModified = new Date().toISOString();
  
  saveSessionToStorage(session);
}

/**
 * Add courses to existing session
 */
export function addCoursesToSession(newCourses: CourseData[]): void {
  const session = loadAnonymousSession();
  if (!session) return;

  // Merge courses, avoiding duplicates
  const existingCodes = new Set(session.courses.map(c => c.courseCode));
  const coursesToAdd = newCourses.filter(c => !existingCodes.has(c.courseCode));
  
  session.courses = [...session.courses, ...coursesToAdd];
  session.lastModified = new Date().toISOString();
  
  saveSessionToStorage(session);
}

/**
 * Update course status in session
 */
export function updateCourseStatus(
  courseCode: string,
  status: CourseData['status'],
  grade?: string
): void {
  const session = loadAnonymousSession();
  if (!session) return;

  const courseIndex = session.courses.findIndex(c => c.courseCode === courseCode);
  if (courseIndex >= 0) {
    session.courses[courseIndex].status = status;
    if (grade !== undefined) {
      session.courses[courseIndex].grade = grade;
    }
  } else {
    // Add new course if not found
    session.courses.push({
      courseCode,
      courseName: `Course ${courseCode}`, // Would be fetched from API
      credits: 3, // Default
      status,
      grade
    });
  }

  session.lastModified = new Date().toISOString();
  saveSessionToStorage(session);
}

/**
 * Get session progress summary
 */
export function getSessionProgress(): {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalCredits: number;
  completedCredits: number;
} | null {
  const session = loadAnonymousSession();
  if (!session) return null;

  const completed = session.courses.filter(c => c.status === 'COMPLETED');
  const inProgress = session.courses.filter(c => c.status === 'IN_PROGRESS');

  return {
    totalCourses: session.courses.length,
    completedCourses: completed.length,
    inProgressCourses: inProgress.length,
    totalCredits: session.courses.reduce((sum, c) => sum + c.credits, 0),
    completedCredits: completed.reduce((sum, c) => sum + c.credits, 0)
  };
}

/**
 * Export session data for download
 */
export function exportSessionData(): string {
  const session = loadAnonymousSession();
  if (!session) throw new Error('No session found');

  const exportData = {
    curriculum: session.curriculum,
    department: session.department,
    concentration: session.concentration,
    courses: session.courses,
    exportedAt: new Date().toISOString()
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Import session data from file
 */
export function importSessionData(jsonData: string): AnonymousSession {
  try {
    const data = JSON.parse(jsonData);
    
    if (!data.curriculum || !data.department || !Array.isArray(data.courses)) {
      throw new Error('Invalid session data format');
    }

    const session = createAnonymousSession(
      data.curriculum,
      data.department,
      data.concentration
    );

    session.courses = data.courses;
    session.lastModified = new Date().toISOString();
    
    saveSessionToStorage(session);
    return session;
  } catch (error) {
    throw new Error(`Failed to import session data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clear current session
 */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Extend session expiry
 */
export function extendSession(): void {
  const session = loadAnonymousSession();
  if (!session) return;

  session.expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
  session.lastModified = new Date().toISOString();
  
  saveSessionToStorage(session);
}

/**
 * Check if session is about to expire (within 24 hours)
 */
export function isSessionExpiringSoon(): boolean {
  const session = loadAnonymousSession();
  if (!session) return false;

  const expiryTime = new Date(session.expiresAt).getTime();
  const now = Date.now();
  const timeUntilExpiry = expiryTime - now;
  
  return timeUntilExpiry < (24 * 60 * 60 * 1000); // 24 hours
}

// Helper functions

function generateSessionId(): string {
  // Use crypto.randomUUID if available (modern browsers), otherwise fall back to timestamp + counter
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `session_${crypto.randomUUID()}`;
  }
  
  // Fallback for older browsers - use timestamp + counter to avoid SSR issues
  const timestamp = Date.now();
  const counter = Math.floor(timestamp / 1000) % 10000; // Use deterministic counter
  return `session_${timestamp}_${counter.toString(36)}`;
}

function saveSessionToStorage(session: AnonymousSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session to storage:', error);
  }
}

/**
 * Convert between local storage format and session format
 */
export function convertFromLocalStorage(storageData: SessionStorageData): AnonymousSession {
  const courses: CourseData[] = Object.entries(storageData.courses).map(([code, courseInfo]) => ({
    courseCode: code,
    courseName: `Course ${code}`,
    credits: 3, // Default
    status: courseInfo.status === 'completed' ? 'COMPLETED' :
           courseInfo.status === 'taking' ? 'IN_PROGRESS' :
           courseInfo.status === 'planning' ? 'PENDING' : 'PENDING',
    grade: courseInfo.grade
  }));

  // Add free electives
  storageData.freeElectives.forEach(elective => {
    courses.push({
      courseCode: elective.code,
      courseName: elective.title,
      credits: elective.credits,
      status: 'COMPLETED' // Assuming free electives are completed when added
    });
  });

  return createAnonymousSession(
    storageData.curriculum,
    storageData.department,
    storageData.concentration
  );
}

/**
 * Hook for React components to use session management
 */
export function useAnonymousSession() {
  const loadSession = () => loadAnonymousSession();
  const saveSession = (curriculum: string, department: string, concentration?: string) => 
    createAnonymousSession(curriculum, department, concentration);
  const updateCourses = (courses: CourseData[]) => updateSessionCourses(courses);
  const addCourses = (courses: CourseData[]) => addCoursesToSession(courses);
  const updateStatus = (code: string, status: CourseData['status'], grade?: string) => 
    updateCourseStatus(code, status, grade);
  const getProgress = () => getSessionProgress();
  const clear = () => clearSession();
  const extend = () => extendSession();
  const checkExpiry = () => isSessionExpiringSoon();

  return {
    loadSession,
    saveSession,
    updateCourses,
    addCourses,
    updateStatus,
    getProgress,
    clear,
    extend,
    checkExpiry,
    exportData: exportSessionData,
    importData: importSessionData
  };
}
