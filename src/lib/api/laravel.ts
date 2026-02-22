/**
 * Laravel Backend API Integration
 * 
 * This file contains all the API calls to Laravel backend.
 * It handles authentication, CSRF tokens, and all endpoint interactions.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const API_BASE = `${API_URL}/api`;

interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
  [key: string]: any;
}

/**
 * Initialize CSRF cookie for Laravel Sanctum
 * Must be called before login
 */
export async function initCsrf(): Promise<void> {
  try {
    await fetch(`${API_URL}/sanctum/csrf-cookie`, {
      credentials: 'include',
    });
  } catch (error) {
    console.error('Failed to initialize CSRF:', error);
  }
}

/**
 * Login to Laravel backend
 */
export async function login(credentials: LoginCredentials): Promise<User> {
  // First, get CSRF token
  await initCsrf();

  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

/**
 * Logout from Laravel backend
 */
export async function logout(): Promise<void> {
  const response = await fetch(`${API_BASE}/logout`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }
}

/**
 * Get current authenticated user
 */
export async function getUser(): Promise<User> {
  const response = await fetch(`${API_BASE}/user`, {
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Not authenticated');
  }

  return response.json();
}

// ===== PUBLIC ENDPOINTS (No auth required) =====

export async function getPublicCurricula() {
  const response = await fetch(`${API_BASE}/public-curricula`);
  if (!response.ok) throw new Error('Failed to fetch curricula');
  return response.json();
}

export async function getPublicCurriculum(id: string) {
  if (!id || typeof id !== 'string' || !id.includes('-')) {
    throw new Error(
      `[getPublicCurriculum] Invalid curriculum UUID: ${id}`
    );
  }

  const response = await fetch(
    `${API_BASE}/public-curricula/${id}`,
    {
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to fetch curriculum ${id}: ${response.status} ${text}`
    );
  }

  return response.json();
}

// Public Courses (No auth required)
export async function getPublicCourses() {
  const response = await fetch(`${API_BASE}/public-courses`);
  if (!response.ok) throw new Error('Failed to fetch public courses');
  return response.json();
}

export async function getPublicConcentrations() {
  const response = await fetch(`${API_BASE}/public-concentrations`);
  if (!response.ok) throw new Error('Failed to fetch concentrations');
  return response.json();
}

// ===== PROTECTED ENDPOINTS (Auth required) =====

/**
 * Helper to get CSRF token from cookie
 */
function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Generic authenticated request helper
 */
async function authenticatedRequest(
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const csrfToken = getCsrfTokenFromCookie();
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    // Handle different error response formats from backend
    let errorMessage = `Request failed with status ${response.status}`;
    
    if (error.error) {
      // Handle nested error object { error: { message: '...', details: {...} } }
      if (typeof error.error === 'object' && error.error.message) {
        errorMessage = error.error.message;
        // Add validation details if present
        if (error.error.details) {
          const details = typeof error.error.details === 'object' 
            ? Object.values(error.error.details).flat().join(', ')
            : error.error.details;
          errorMessage += `: ${details}`;
        }
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

// Dashboard
export async function getDashboardStats() {
  return authenticatedRequest('/dashboard-stats');
}

// Faculties
export async function getFaculties() {
  return authenticatedRequest('/faculties');
}

export async function createFaculty(data: any) {
  return authenticatedRequest('/faculties', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateFaculty(id: string, data: any) {
  return authenticatedRequest(`/faculties/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteFaculty(id: number) {
  return authenticatedRequest(`/faculties/${id}`, {
    method: 'DELETE',
  });
}

// Departments
export async function getDepartments() {
  return authenticatedRequest('/departments');
}

export async function createDepartment(data: any) {
  return authenticatedRequest('/departments', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDepartment(id: number, data: any) {
  return authenticatedRequest(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDepartment(id: number) {
  return authenticatedRequest(`/departments/${id}`, {
    method: 'DELETE',
  });
}

// Users
export async function getUsers() {
  return authenticatedRequest('/users');
}

export async function getUserById(id: number) {
  return authenticatedRequest(`/users/${id}`);
}

export async function createUser(data: any) {
  return authenticatedRequest('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: number, data: any) {
  return authenticatedRequest(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number) {
  return authenticatedRequest(`/users/${id}`, {
    method: 'DELETE',
  });
}

// Curricula
export async function getCurricula() {
  return authenticatedRequest('/curricula');
}

export async function getCurriculum(id: number) {
  return authenticatedRequest(`/curricula/${id}`);
}

export async function createCurriculum(data: any) {
  return authenticatedRequest('/curricula', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCurriculum(id: number, data: any) {
  return authenticatedRequest(`/curricula/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCurriculum(id: number) {
  return authenticatedRequest(`/curricula/${id}`, {
    method: 'DELETE',
  });
}

// Courses
export async function getCourses() {
  return authenticatedRequest('/courses');
}

export async function getCourse(id: number) {
  return authenticatedRequest(`/courses/${id}`);
}

export async function createCourse(data: any) {
  return authenticatedRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourse(id: number, data: any) {
  return authenticatedRequest(`/courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCourse(id: number) {
  return authenticatedRequest(`/courses/${id}`, {
    method: 'DELETE',
  });
}

// Course Types
export async function getCourseTypes() {
  return authenticatedRequest('/course-types');
}

export async function createCourseType(data: any) {
  return authenticatedRequest('/course-types', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCourseType(id: string, data: any) {
  return authenticatedRequest(`/course-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCourseType(id: string) {
  return authenticatedRequest(`/course-types/${id}`, {
    method: 'DELETE',
  });
}

// Concentration Courses
export async function getConcentrationCourses() {
  return authenticatedRequest('/concentration-courses');
}

export async function getConcentrationCourse(id: number) {
  return authenticatedRequest(`/concentration-courses/${id}`);
}

export async function createConcentrationCourse(data: any) {
  return authenticatedRequest('/concentration-courses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateConcentrationCourse(id: number, data: any) {
  return authenticatedRequest(`/concentration-courses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteConcentrationCourse(id: number) {
  return authenticatedRequest(`/concentration-courses/${id}`, {
    method: 'DELETE',
  });
}

// Available Courses
export async function getAvailableCourses() {
  return authenticatedRequest('/available-courses');
}

// Blacklists
export async function getBlacklists() {
  return authenticatedRequest('/blacklists');
}

export async function getBlacklist(id: string) {
  return authenticatedRequest(`/blacklists/${id}`);
}

export async function createBlacklist(data: any) {
  // courseIds are UUIDs (strings), no conversion needed
  return authenticatedRequest('/blacklists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBlacklist(id: string, data: any) {
  // courseIds are UUIDs (strings), no conversion needed
  return authenticatedRequest(`/blacklists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBlacklist(id: string) {
  return authenticatedRequest(`/blacklists/${id}`, {
    method: 'DELETE',
  });
}

// Completed Courses (Student)
export async function getCompletedCourses() {
  return authenticatedRequest('/completed-courses');
}

// System Settings
export async function getSystemSettings() {
  return authenticatedRequest('/system-settings');
}

// Downloads
export async function downloadSampleXlsx() {
  const response = await fetch(`${API_BASE}/download/sample-xlsx`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to download file');
  return response.blob();
}

export async function downloadSampleCsv() {
  const response = await fetch(`${API_BASE}/download/sample-csv`, {
    credentials: 'include',
  });
  if (!response.ok) throw new Error('Failed to download file');
  return response.blob();
}

// ===== GRADUATION PORTAL API =====

// ===== GRACE PERIOD CONFIGURATION =====
// The "Grace Period" is the window after the portal deadline during which
// students can still submit files and submissions are retained before auto-deletion.
export const GRACE_PERIOD_DAYS = 7;

// Types for Graduation Portal
export interface GraduationPortal {
  id: string;
  name: string;
  description: string;
  batch: string;
  deadline: string;
  daysRemaining?: number;
  acceptedFormats: string[];
  maxFileSizeMb: number;
  status: 'active' | 'closed';
  curriculum: {
    id: string;
    name: string;
    year?: number;
  };
  department: {
    id: string;
    name: string;
  };
  // CP-only fields
  pin?: string;
  pinHint?: string;
  submissionsCount?: number;
  createdAt?: string;
  closedAt?: string;
  // Grace period: submissions are accepted for GRACE_PERIOD_DAYS after the deadline
  grace_period_end?: string; // ISO date string: deadline + GRACE_PERIOD_DAYS
  is_in_grace_period?: boolean; // Computed: true if past deadline but within grace period
  is_active?: boolean; // Backend computed: true if deadline not passed or in grace period
}

export interface GraduationSession {
  token: string;
  expires_in_minutes: number;
  expires_at: string;
}

export interface SubmissionCourse {
  code: string;
  name?: string;
  credits: number;
  grade?: string;  // Optional - planned courses may not have grades
  status: 'completed' | 'in_progress' | 'planned' | 'failed' | 'withdrawn';
  semester?: string;
  category?: string;
}

export interface GraduationSubmissionPayload {
  student_identifier: string;
  curriculum_id: string;
  courses: SubmissionCourse[];
  metadata?: {
    parsed_at?: string;
    file_name?: string;
    total_courses?: number;
    student_email?: string;
  };
}

export interface CacheSubmission {
  id: string;
  student_identifier: string;
  studentIdentifier?: string; // Backend might use either
  status: 'pending' | 'processing' | 'validated' | 'has_issues' | 'approved' | 'rejected';
  submitted_at: string;
  submittedAt?: string; // Backend might use either
  expires_at: string;
  expiresAt?: string; // Backend might use either
  deletion_date?: string; // NEW: Simple date for display (YYYY-MM-DD)
  time_remaining_minutes?: number;
  course_count?: number;
  courses?: SubmissionCourse[];
  validation_result?: ValidationResult;
  metadata?: {
    file_name?: string;
    parsed_at?: string;
    total_credits?: number;
  };
  approved_at?: string;
  rejected_at?: string;
  rejection_reason?: string;
}

// Retention info for submissions list response
// Submissions are retained for the duration of the Grace Period (GRACE_PERIOD_DAYS after deadline)
export interface SubmissionRetentionInfo {
  portal_deadline: string;
  retention_days: number; // Same as GRACE_PERIOD_DAYS
  deletion_date: string;  // portal_deadline + GRACE_PERIOD_DAYS
  is_in_grace_period: boolean;
}

export interface ValidationResult {
  valid: boolean;
  canGraduate: boolean;
  can_graduate?: boolean;
  summary: {
    totalCreditsRequired: number;
    totalCreditsEarned?: number;
    // Backend may or may not send these; frontend computes locally as fallback
    creditsCompleted?: number;
    creditsInProgress?: number;
    creditsPlanned?: number;
    gpa?: number;
    // Backend sends these as counts
    matchedCourses?: number;
    unmatchedCourses?: number;
    // Legacy aliases
    coursesMatched?: number;
    coursesUnmatched?: number;
  };
  categoryProgress?: Record<string, {
    name?: string;
    // Backend sends earned/required/percentage
    earned?: number;
    required?: number;
    percentage?: number;
    // Frontend aliases (for compatibility)
    creditsRequired?: number;
    creditsCompleted?: number;
    percentComplete?: number;
    isComplete?: boolean;
  }>;
  requirements: Array<{
    name: string;
    label?: string;
    description?: string;
    required?: number;
    earned?: number;    // Backend sends this
    current?: number;   // Frontend alias
    fulfilled?: boolean; // Backend sends this
    met?: boolean;       // Frontend alias
    message?: string;
    courses?: Array<{ code: string; name?: string; credits?: number; status?: string }>;
  }>;
  errors?: string[];
  warnings?: string[];
  matchedCourses?: Array<{ code: string; name?: string; credits?: number; grade?: string; matched?: boolean; status?: string; semester?: string; category?: string }>;
  unmatchedCourses?: Array<string | { code: string; name?: string; credits?: number; grade?: string; status?: string }>;
}

// ===== PUBLIC GRADUATION PORTAL ENDPOINTS (No Auth) =====

/**
 * List active graduation portals
 * GET /api/public/graduation-portals
 */
export async function getPublicGraduationPortals(params?: {
  department_id?: string;
  batch?: string;
}): Promise<{ portals: GraduationPortal[]; total: number }> {
  const searchParams = new URLSearchParams();
  if (params?.department_id) searchParams.set('department_id', params.department_id);
  if (params?.batch) searchParams.set('batch', params.batch);
  
  const queryString = searchParams.toString();
  const url = `${API_BASE}/public/graduation-portals${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch graduation portals');
  }
  
  return response.json();
}

/**
 * Get single portal details (public info)
 * GET /api/public/graduation-portals/{id}
 */
export async function getPublicGraduationPortal(portalId: string): Promise<{ portal: GraduationPortal }> {
  const response = await fetch(`${API_BASE}/public/graduation-portals/${portalId}`, {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Portal not found');
  }
  
  return response.json();
}

/**
 * Verify portal PIN and get session token
 * POST /api/public/graduation-portals/{id}/verify-pin
 */
export async function verifyGraduationPortalPin(
  portalId: string, 
  pin: string
): Promise<{
  message: string;
  session: GraduationSession;
  portal: Pick<GraduationPortal, 'id' | 'name' | 'acceptedFormats' | 'maxFileSizeMb'> & { curriculum_id: string };
}> {
  const response = await fetch(`${API_BASE}/public/graduation-portals/${portalId}/verify-pin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ pin })
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorData = error.error || error;
    
    // Handle specific error codes
    if (response.status === 401) {
      throw new Error(JSON.stringify({
        code: errorData.code || 'INVALID_PIN',
        message: errorData.message || 'Invalid PIN',
        attempts_remaining: errorData.attempts_remaining
      }));
    }
    
    if (response.status === 429) {
      throw new Error(JSON.stringify({
        code: 'RATE_LIMITED',
        message: errorData.message || 'Too many attempts. Please try again later.',
        retry_after: errorData.retry_after
      }));
    }
    
    throw new Error(errorData.message || 'PIN verification failed');
  }
  
  return response.json();
}

/**
 * Public curriculum interface for graduation portal selection
 */
export interface PortalCurriculum {
  id: string;
  name: string;
  year: number;
  version: string | null;
  description: string | null;
  total_credits_required: number;
  is_default: boolean;
  department: { id: string; name: string } | null;
  faculty: { id: string; name: string } | null;
}

/**
 * Get curricula available for portal
 * GET /api/public/graduation-portals/{id}/curricula
 */
export async function getPortalCurricula(
  portalId: string,
  params?: { faculty_id?: string; department_id?: string }
): Promise<{
  curricula: PortalCurriculum[];
  default_curriculum_id: string | null;
  portal_department_id: string | null;
  total: number;
}> {
  const searchParams = new URLSearchParams();
  if (params?.faculty_id) searchParams.set('faculty_id', params.faculty_id);
  if (params?.department_id) searchParams.set('department_id', params.department_id);
  
  const queryString = searchParams.toString();
  const url = `${API_BASE}/public/graduation-portals/${portalId}/curricula${queryString ? `?${queryString}` : ''}`;
  
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch curricula');
  }
  
  return response.json();
}

/**
 * Get public faculties list (for curriculum selection fallback)
 * GET /api/public/faculties
 */
export async function getPublicFaculties(): Promise<{
  faculties: Array<{ id: string; name: string }>;
}> {
  const response = await fetch(`${API_BASE}/public/faculties`, {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch faculties');
  }
  
  return response.json();
}

/**
 * Get public departments list (for curriculum selection fallback)
 * GET /api/public/departments
 */
export async function getPublicDepartments(facultyId?: string): Promise<{
  departments: Array<{ id: string; name: string; faculty_id: string }>;
}> {
  const url = facultyId 
    ? `${API_BASE}/public/departments?faculty_id=${facultyId}`
    : `${API_BASE}/public/departments`;
    
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch departments');
  }
  
  return response.json();
}

// ===== SESSION-AUTHENTICATED ENDPOINTS (Session Token) =====

/**
 * Submit courses for graduation validation
 * POST /api/graduation-portals/{id}/submit
 * Header: X-Graduation-Session-Token
 */
export async function submitGraduationCourses(
  portalId: string,
  sessionToken: string,
  payload: GraduationSubmissionPayload
): Promise<{
  message: string;
  submission: {
    id: string;
    status: string;
    expires_at: string;
    course_count: number;
  };
}> {
  const response = await fetch(`${API_BASE}/graduation-portals/${portalId}/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Graduation-Session-Token': sessionToken
    },
    body: JSON.stringify(payload)
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const errorData = error.error || error;
    
    // Handle session errors
    if (response.status === 401) {
      throw new Error(JSON.stringify({
        code: errorData.code || 'SESSION_EXPIRED',
        message: errorData.message || 'Session expired. Please verify PIN again.'
      }));
    }

    // Handle grace period ended (422)
    if (response.status === 422 && (errorData.code === 'GRACE_PERIOD_ENDED' || error.code === 'GRACE_PERIOD_ENDED')) {
      throw new Error(JSON.stringify({
        code: 'GRACE_PERIOD_ENDED',
        message: errorData.message || error.error || 'The submission period (including grace period) has ended.',
        grace_period_end: errorData.grace_period_end || error.grace_period_end
      }));
    }
    
    throw new Error(errorData.message || error.error || 'Submission failed');
  }
  
  return response.json();
}

// ===== SANCTUM-AUTHENTICATED ENDPOINTS (CP/Advisor) =====

/**
 * List graduation portals for authenticated user
 * GET /api/graduation-portals
 */
export async function getGraduationPortals(params?: {
  status?: 'active' | 'closed';
  curriculum_id?: string;
}): Promise<{
  data: GraduationPortal[];
  meta?: { current_page: number; last_page: number; total: number };
}> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set('status', params.status);
  if (params?.curriculum_id) searchParams.set('curriculum_id', params.curriculum_id);
  
  const queryString = searchParams.toString();
  return authenticatedRequest(`/graduation-portals${queryString ? `?${queryString}` : ''}`);
}

/**
 * Create a new graduation portal
 * POST /api/graduation-portals
 */
export async function createGraduationPortal(data: {
  name: string;
  description?: string;
  curriculum_id: string;
  batch?: string;
  deadline?: string;
  accepted_formats?: string[];
  max_file_size_mb?: number;
  custom_pin?: string;
}): Promise<{
  portal: GraduationPortal;
  pin: string;
  message: string;
}> {
  return authenticatedRequest('/graduation-portals', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

/**
 * Get portal details (authenticated)
 * GET /api/graduation-portals/{id}
 */
export async function getGraduationPortal(portalId: string): Promise<{
  portal: GraduationPortal;
  pending_submissions_count: number;
}> {
  return authenticatedRequest(`/graduation-portals/${portalId}`);
}

/**
 * Update graduation portal
 * PUT /api/graduation-portals/{id}
 */
export async function updateGraduationPortal(
  portalId: string,
  data: Partial<{
    name: string;
    description: string;
    deadline: string;
    accepted_formats: string[];
    max_file_size_mb: number;
  }>
): Promise<{ portal: GraduationPortal; message: string }> {
  return authenticatedRequest(`/graduation-portals/${portalId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

/**
 * Delete graduation portal
 * DELETE /api/graduation-portals/{id}
 */
export async function deleteGraduationPortal(portalId: string): Promise<{ message: string }> {
  return authenticatedRequest(`/graduation-portals/${portalId}`, {
    method: 'DELETE'
  });
}

/**
 * Close graduation portal
 * POST /api/graduation-portals/{id}/close
 */
export async function closeGraduationPortal(portalId: string): Promise<{
  portal: GraduationPortal;
  message: string;
}> {
  return authenticatedRequest(`/graduation-portals/${portalId}/close`, {
    method: 'POST'
  });
}

/**
 * Reopen a closed graduation portal
 * POST /api/graduation-portals/{id}/reopen
 */
export async function reopenGraduationPortal(portalId: string): Promise<{
  portal: GraduationPortal;
  message: string;
}> {
  return authenticatedRequest(`/graduation-portals/${portalId}/reopen`, {
    method: 'POST'
  });
}

/**
 * Regenerate portal PIN
 * POST /api/graduation-portals/{id}/regenerate-pin
 */
export async function regeneratePortalPin(portalId: string): Promise<{
  pin: string;
  pin_hint: string;
  message: string;
}> {
  return authenticatedRequest(`/graduation-portals/${portalId}/regenerate-pin`, {
    method: 'POST'
  });
}

// ===== CACHE SUBMISSIONS (Retained until 7 days after portal deadline) =====

/**
 * List cached submissions for a portal
 * GET /api/graduation-portals/{id}/cache-submissions
 */
export async function getCacheSubmissions(portalId: string): Promise<{
  submissions: CacheSubmission[];
  total: number;
  retention_info?: SubmissionRetentionInfo;
  note?: string;
}> {
  return authenticatedRequest(`/graduation-portals/${portalId}/cache-submissions`);
}

/**
 * Get single cached submission
 * GET /api/graduation-portals/{id}/cache-submissions/{submissionId}
 */
export async function getCacheSubmission(
  portalId: string,
  submissionId: string
): Promise<{ submission: CacheSubmission & { courses: SubmissionCourse[] } }> {
  return authenticatedRequest(`/graduation-portals/${portalId}/cache-submissions/${submissionId}`);
}

/**
 * Validate a cached submission
 * POST /api/graduation-portals/{id}/cache-submissions/{submissionId}/validate
 */
export async function validateCacheSubmission(
  portalId: string,
  submissionId: string
): Promise<{
  message: string;
  submission: CacheSubmission;
  validation: ValidationResult & { can_graduate: boolean };
}> {
  return authenticatedRequest(
    `/graduation-portals/${portalId}/cache-submissions/${submissionId}/validate`,
    { method: 'POST' }
  );
}

/**
 * Approve a cached submission
 * POST /api/graduation-portals/{id}/cache-submissions/{submissionId}/approve
 */
export async function approveCacheSubmission(
  portalId: string,
  submissionId: string,
  note?: string
): Promise<{ message: string; submission: CacheSubmission }> {
  return authenticatedRequest(
    `/graduation-portals/${portalId}/cache-submissions/${submissionId}/approve`,
    {
      method: 'POST',
      body: JSON.stringify({ note })
    }
  );
}

/**
 * Reject a cached submission
 * POST /api/graduation-portals/{id}/cache-submissions/{submissionId}/reject
 */
export async function rejectCacheSubmission(
  portalId: string,
  submissionId: string,
  reason: string
): Promise<{ message: string; submission: CacheSubmission }> {
  return authenticatedRequest(
    `/graduation-portals/${portalId}/cache-submissions/${submissionId}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ reason })
    }
  );
}

// ===== GRADUATION NOTIFICATIONS API =====

/**
 * Notification types for graduation portal
 */
export interface GraduationNotification {
  id: string;
  type: 'new_submission' | 'submission_validated';
  title: string;
  message: string;
  data: {
    submission_id?: string;
    student_identifier?: string;
    course_count?: number;
    portal_name?: string;
  };
  read: boolean;
  read_at: string | null;
  created_at: string;
  portal: {
    id: string;
    name: string;
  } | null;
}

/**
 * List graduation notifications
 * GET /api/graduation-notifications
 */
export async function getGraduationNotifications(): Promise<{
  notifications: GraduationNotification[];
  total: number;
}> {
  return authenticatedRequest('/graduation-notifications');
}

/**
 * Get unread notification count
 * GET /api/graduation-notifications/unread-count
 */
export async function getGraduationNotificationUnreadCount(): Promise<{
  unread_count: number;
}> {
  return authenticatedRequest('/graduation-notifications/unread-count');
}

/**
 * Mark single notification as read
 * POST /api/graduation-notifications/{id}/read
 */
export async function markGraduationNotificationRead(notificationId: string): Promise<{
  message: string;
  notification: GraduationNotification;
}> {
  return authenticatedRequest(`/graduation-notifications/${notificationId}/read`, {
    method: 'POST'
  });
}

/**
 * Mark all notifications as read
 * POST /api/graduation-notifications/mark-all-read
 */
export async function markAllGraduationNotificationsRead(): Promise<{
  message: string;
  marked_count: number;
}> {
  return authenticatedRequest('/graduation-notifications/mark-all-read', {
    method: 'POST'
  });
}

/**
 * Delete a notification
 * DELETE /api/graduation-notifications/{id}
 */
export async function deleteGraduationNotification(notificationId: string): Promise<{
  message: string;
}> {
  return authenticatedRequest(`/graduation-notifications/${notificationId}`, {
    method: 'DELETE'
  });
}

/**
 * Clear all read notifications
 * DELETE /api/graduation-notifications/clear-read
 */
export async function clearReadGraduationNotifications(): Promise<{
  message: string;
  deleted_count: number;
}> {
  return authenticatedRequest('/graduation-notifications/clear-read', {
    method: 'DELETE'
  });
}

/**
 * Batch validate multiple submissions
 * POST /api/graduation-submissions/batch-validate
 */
export async function batchValidateSubmissions(
  portalId: string,
  submissionIds: string[]
): Promise<{
  message: string;
  results: Array<{ submission_id: string; success: boolean; can_graduate?: boolean; error_count?: number; error?: string }>;
  summary: { total: number; success: number; failed: number };
}> {
  return authenticatedRequest(`/graduation-submissions/batch-validate`, {
    method: 'POST',
    body: JSON.stringify({ submission_ids: submissionIds })
  });
}

/**
 * Download validation report
 * GET /api/graduation-portals/{id}/cache-submissions/{submissionId}/report
 */
export async function getSubmissionReport(
  portalId: string,
  submissionId: string
): Promise<{
  report: {
    student_identifier: string;
    curriculum: string;
    submitted_at: string;
    validated_at?: string;
    validation_result: ValidationResult;
    courses: SubmissionCourse[];
  };
}> {
  return authenticatedRequest(
    `/graduation-portals/${portalId}/cache-submissions/${submissionId}/report`
  );
}

// ===== TENTATIVE SCHEDULE ENDPOINTS =====

export interface TentativeScheduleCourse {
  courseId: string;
  section?: string;
  dayTimeSlots?: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
  days?: string[];
  time?: string;
  instructor?: string;
  seatLimit?: number;
}

export interface TentativeScheduleData {
  name: string;
  semester: string;
  version: string;
  department?: string;
  batch?: string;
  curriculumId?: string;
  status?: 'draft' | 'published';
  courses: TentativeScheduleCourse[];
}

export interface TentativeSchedule {
  id: string;
  name: string;
  semester: string;
  version: string;
  year: string;
  department?: string;
  batch?: string;
  coursesCount: number;
  status?: 'draft' | 'published';
  isPublished?: boolean;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
  curriculumName?: string;
  curriculumYear?: string;
  curriculum?: {
    id: string;
    name: string;
    year: string;
  };
  courses?: Array<{
    id: string;
    course: {
      id: string;
      code: string;
      title: string;
      credits: number;
    };
    section?: string;
    day?: string;
    timeStart?: string;
    timeEnd?: string;
    room?: string;
    instructor?: string;
    capacity?: number;
    enrolled?: number;
    courseType?: string;
  }>;
}

/**
 * Get list of tentative schedules
 * GET /api/tentative-schedules
 */
export async function getTentativeSchedules(params?: {
  search?: string;
  limit?: number;
  page?: number;
}): Promise<{
  schedules: TentativeSchedule[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.page) queryParams.append('page', params.page.toString());

  const url = `/tentative-schedules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  return authenticatedRequest(url);
}

/**
 * Create a new tentative schedule
 * POST /api/tentative-schedules
 */
export async function createTentativeSchedule(
  data: TentativeScheduleData
): Promise<{
  message: string;
  schedule: TentativeSchedule;
}> {
  return authenticatedRequest('/tentative-schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get a specific tentative schedule
 * GET /api/tentative-schedules/{id}
 */
export async function getTentativeSchedule(id: string): Promise<{
  schedule: TentativeSchedule & {
    courses: Array<{
      id: string;
      course: {
        id: string;
        code: string;
        title: string;
        credits: number;
      };
      section?: string;
      days?: string[];
      time?: string;
      instructor?: string;
      seatLimit?: number;
    }>;
  };
}> {
  return authenticatedRequest(`/tentative-schedules/${id}`);
}

/**
 * Update a tentative schedule
 * PUT /api/tentative-schedules/{id}
 */
export async function updateTentativeSchedule(
  id: string,
  data: TentativeScheduleData
): Promise<{
  message: string;
  schedule: TentativeSchedule;
}> {
  return authenticatedRequest(`/tentative-schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a tentative schedule
 * DELETE /api/tentative-schedules/{id}
 */
export async function deleteTentativeSchedule(id: string): Promise<{
  message: string;
}> {
  return authenticatedRequest(`/tentative-schedules/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Toggle publish status of a tentative schedule
 * POST /api/tentative-schedules/{id}/toggle-publish
 */
export async function togglePublishTentativeSchedule(id: string): Promise<{
  message: string;
  schedule: {
    id: string;
    isPublished: boolean;
  };
}> {
  return authenticatedRequest(`/tentative-schedules/${id}/toggle-publish`, {
    method: 'POST',
  });
}

/**
 * Toggle active status of a tentative schedule
 * POST /api/tentative-schedules/{id}/toggle-active
 */
export async function toggleActiveTentativeSchedule(id: string): Promise<{
  message: string;
  schedule: {
    id: string;
    isActive: boolean;
  };
}> {
  return authenticatedRequest(`/tentative-schedules/${id}/toggle-active`, {
    method: 'POST',
  });
}

/**
 * Get list of published tentative schedules (Public - No Authentication Required)
 * GET /api/published-schedules
 */
export async function getPublishedSchedules(params?: {
  search?: string;
  limit?: number;
  page?: number;
  departmentId?: string;
}): Promise<{
  schedules: TentativeSchedule[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.departmentId) queryParams.append('department_id', params.departmentId);

  const url = `${API_BASE}/published-schedules${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch published schedules');
  }

  return response.json();
}

/**
 * Get a specific published tentative schedule (Public - No Authentication Required)
 * GET /api/published-schedules/{id}
 */
export async function getPublishedSchedule(id: string): Promise<{
  schedule: TentativeSchedule & {
    courses: Array<{
      id: string;
      course: {
        id: string;
        code: string;
        title: string;
        credits: number;
      };
      section?: string;
      day?: string;
      days?: string[];
      timeStart?: string;
      timeEnd?: string;
      time?: string;
      room?: string;
      instructor?: string;
      capacity?: number;
      enrolled?: number;
      courseType?: string;
    }>;
  };
}> {
  const response = await fetch(`${API_BASE}/published-schedules/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch published schedule');
  }

  return response.json();
}
