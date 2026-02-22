const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  faculty_id?: string;
  department_id?: string;
  advisor_id?: string;
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
  advisor?: {
    id: string;
    email: string;
    name: string;
    role: string;
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
    
    const response = await fetch(`${API_URL}/api/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        ...(csrfToken && { 'X-XSRF-TOKEN': csrfToken }),
      },
    });
    
    // Wait for the response to ensure server-side session is cleared
    if (response.ok) {
      console.log('Server logout successful');
    } else {
      console.warn('Server logout returned non-OK status:', response.status);
    }
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Always clear client data regardless of server response
    clearAllClientData();
  }
}

function clearAllClientData(): void {
  if (typeof window === 'undefined') return;

  // Clear all storage
  localStorage.clear();
  sessionStorage.clear();
  
  // Get all cookies and clear them with multiple domain/path variations
  const cookies = document.cookie.split(';');
  const hostname = window.location.hostname;
  const pathVariations = ['/', '/api', '/sanctum'];
  const domainVariations = [
    '', // no domain (current document domain)
    hostname,
    `.${hostname}`,
    // Handle localhost specially
    ...(hostname === 'localhost' ? ['localhost', '.localhost'] : []),
  ];
  
  for (const cookie of cookies) {
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    if (!name) continue;
    
    // Clear cookie with all path/domain combinations
    for (const path of pathVariations) {
      // Without domain
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
      
      for (const domain of domainVariations) {
        if (domain) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
        }
      }
    }
  }
  
  // Specifically clear Laravel/Sanctum session cookies
  const laravelCookies = [
    'laravel_session',
    'XSRF-TOKEN',
    'remember_web',
  ];
  
  for (const cookieName of laravelCookies) {
    for (const path of pathVariations) {
      document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
      for (const domain of domainVariations) {
        if (domain) {
          document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path};domain=${domain}`;
        }
      }
    }
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
        // User not authenticated - this is normal, throw silently
        throw new Error('Unauthenticated');
      }
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    // Only log actual network errors, not authentication errors
    if (error instanceof Error && error.message !== 'Unauthenticated') {
      console.error('Error fetching user:', error);
    }
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