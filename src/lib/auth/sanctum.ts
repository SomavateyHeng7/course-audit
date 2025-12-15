// Laravel Sanctum Authentication Service for Next.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  faculty_id?: string;
  department_id?: string;
  faculty?: {
    id: string;
    name: string;
    code: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface LoginResponse {
  user: User;
}

// Get CSRF cookie before making authenticated requests
export async function getCsrfCookie(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });
}

// Helper to get CSRF token from cookie
export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

// Login with email and password
export async function login(email: string, password: string): Promise<LoginResponse> {
  // First get CSRF cookie
  await getCsrfCookie();

  // Get CSRF token from cookie
  const csrfToken = getCsrfTokenFromCookie();

  const response = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Login failed');
  }

  const data = await response.json();
  return data;
}

// Logout
export async function logout(): Promise<void> {
  const csrfToken = getCsrfTokenFromCookie();
  
  await fetch(`${API_URL}/api/logout`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
    },
  });
}

// Get current user
export async function getUser(): Promise<User> {
  try {
    const response = await fetch(`${API_URL}/api/user`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      // Don't throw error for 401, just return null-like response
      if (response.status === 401) {
        console.log('User not authenticated - 401 response');
        throw new Error('Unauthenticated');
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

// Token management
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth_token', token);
  }
}

export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
}

export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth_token');
  }
}

// Helper to make authenticated API requests
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = getCsrfTokenFromCookie();
  
  return fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
      ...options.headers,
    },
  });
}
