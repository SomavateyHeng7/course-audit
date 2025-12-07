/**
 * EXAMPLE: How to integrate Laravel backend with Next.js frontend
 * 
 * This file demonstrates various ways to use the Laravel API integration
 */

import { 
  login, 
  logout, 
  getUser,
  getDashboardStats,
  getFaculties,
  createFaculty,
  getPublicFaculties
} from '@/lib/api/laravel';

// ===== 1. AUTHENTICATION EXAMPLE =====

/**
 * Example: Login Form Handler
 */
export async function handleLogin(email: string, password: string) {
  try {
    const user = await login({ email, password });
    console.log('Login successful:', user);
    return user;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
}

/**
 * Example: Logout Handler
 */
export async function handleLogout() {
  try {
    await logout();
    console.log('Logout successful');
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

/**
 * Example: Get Current User
 */
export async function checkAuth() {
  try {
    const user = await getUser();
    console.log('Current user:', user);
    return user;
  } catch (error) {
    console.error('Not authenticated:', error);
    return null;
  }
}

// ===== 2. PUBLIC ENDPOINTS EXAMPLE =====

/**
 * Example: Fetch public data (no auth required)
 */
export async function fetchPublicData() {
  try {
    const faculties = await getPublicFaculties();
    console.log('Public faculties:', faculties);
    return faculties;
  } catch (error) {
    console.error('Failed to fetch public data:', error);
    throw error;
  }
}

// ===== 3. PROTECTED ENDPOINTS EXAMPLE =====

/**
 * Example: Fetch dashboard stats (auth required)
 */
export async function fetchDashboard() {
  try {
    const stats = await getDashboardStats();
    console.log('Dashboard stats:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to fetch dashboard:', error);
    throw error;
  }
}

/**
 * Example: CRUD Operations - Get all faculties
 */
export async function fetchFaculties() {
  try {
    const faculties = await getFaculties();
    console.log('Faculties:', faculties);
    return faculties;
  } catch (error) {
    console.error('Failed to fetch faculties:', error);
    throw error;
  }
}

/**
 * Example: CRUD Operations - Create a new faculty
 */
export async function addFaculty(name: string, description: string) {
  try {
    const newFaculty = await createFaculty({ name, description });
    console.log('Faculty created:', newFaculty);
    return newFaculty;
  } catch (error) {
    console.error('Failed to create faculty:', error);
    throw error;
  }
}

// ===== 4. REACT COMPONENT EXAMPLE =====

/**
 * Example: Using in a React component
 */
export const ReactComponentExample = `
'use client';

import { useState, useEffect } from 'react';
import { getDashboardStats } from '@/lib/api/laravel';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Dashboard Stats</h1>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
`;

// ===== 5. SERVER-SIDE RENDERING EXAMPLE =====

/**
 * Example: Using in Next.js Server Components or getServerSideProps
 */
export const ServerSideExample = `
import { getPublicFaculties } from '@/lib/api/laravel';

export default async function FacultiesPage() {
  const faculties = await getPublicFaculties();

  return (
    <ul>
      {faculties.map(faculty => (
        <li key={faculty.id}>{faculty.name}</li>
      ))}
    </ul>
  );
}
`;

// ===== 6. FORM SUBMISSION EXAMPLE =====

/**
 * Example: Form submission with error handling
 */
export const FormSubmissionExample = `
'use client';

import { useState } from 'react';
import { createFaculty } from '@/lib/api/laravel';

export default function CreateFacultyForm() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await createFaculty({ name });
      alert('Faculty created successfully!');
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="text-red-600">{error}</div>}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Faculty name"
        required
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Faculty'}
      </button>
    </form>
  );
}
`;
