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

export async function getCsrfCookie(): Promise<void> {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
    },
  });
}

export function getCsrfTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  await getCsrfCookie();

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

export async function logout(): Promise<void> {
  try {
    const csrfToken = getCsrfTokenFromCookie();
    
    await fetch(`${API_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
      },
    });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    clearAllClientData();
  }
}

function clearAllClientData(): void {
  if (typeof window === 'undefined') return;

  localStorage.clear();
  sessionStorage.clear();
  
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
  }
}

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