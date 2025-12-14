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

export async function getPublicFaculties() {
  const response = await fetch(`${API_BASE}/public-faculties`);
  if (!response.ok) throw new Error('Failed to fetch faculties');
  return response.json();
}

export async function getPublicDepartments() {
  const response = await fetch(`${API_BASE}/public-departments`);
  if (!response.ok) throw new Error('Failed to fetch departments');
  return response.json();
}

export async function getPublicCurricula() {
  const response = await fetch(`${API_BASE}/public-curricula`);
  if (!response.ok) throw new Error('Failed to fetch curricula');
  return response.json();
}

export async function getPublicCurriculum(id: string | number) {
  const response = await fetch(`${API_BASE}/public-curricula/${id}`);
  if (!response.ok) throw new Error('Failed to fetch curriculum');
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
    throw new Error(error.message || 'Request failed');
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

export async function updateFaculty(id: number, data: any) {
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

export async function updateCourseType(id: number, data: any) {
  return authenticatedRequest(`/course-types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteCourseType(id: number) {
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

export async function getBlacklist(id: number) {
  return authenticatedRequest(`/blacklists/${id}`);
}

export async function createBlacklist(data: any) {
  return authenticatedRequest('/blacklists', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBlacklist(id: number, data: any) {
  return authenticatedRequest(`/blacklists/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteBlacklist(id: number) {
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
