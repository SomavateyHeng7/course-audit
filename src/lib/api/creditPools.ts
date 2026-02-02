/**
 * Credit Pool API Service
 * 
 * API integration for the Pools & Lists tab.
 * Handles all credit pool, sub-category, and course attachment operations.
 */

import { API_BASE } from './laravel';

// =============================================================================
// Types
// =============================================================================

export interface CourseTypeOption {
  id: string;
  name: string;
  color: string;
  position: number;
  isTopLevel?: boolean;
}

export interface AttachedCourse {
  id: number;
  courseId: string;
  code: string;
  name: string;
  credits: number;
  attachedAt: string;
}

export interface SubCategory {
  id: number;
  poolId: number;
  courseTypeId: string;
  courseTypeName: string;
  courseTypeColor: string;
  requiredCredits: number;
  orderIndex: number;
  attachedCourses: AttachedCourse[];
  attachedCredits: number;
}

export interface CreditPool {
  id: number;
  curriculumId: string;
  name: string;
  topLevelCourseTypeId: string;
  topLevelCourseTypeName?: string;
  topLevelCourseTypeColor?: string;
  enabled: boolean;
  orderIndex: number;
  subCategories: SubCategory[];
  totalRequiredCredits: number;
  totalAttachedCredits: number;
  createdAt: string;
  updatedAt: string;
}

export interface PoolSummary {
  id: number;
  name: string;
  color: string;
  requiredCredits: number;
  attachedCredits: number;
  isSatisfied: boolean;
  subCategoriesCount: number;
}

export interface PoolSummaryResponse {
  pools: PoolSummary[];
  totalRequiredCredits: number;
  totalAttachedCredits: number;
  allPoolsSatisfied: boolean;
}

export interface AvailableCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  description?: string;
}

// =============================================================================
// Credit Pool CRUD
// =============================================================================

/**
 * Fetch all credit pools for a curriculum
 */
export async function fetchCurriculumCreditPools(curriculumId: string): Promise<{ pools: CreditPool[] }> {
  const url = `${API_BASE}/curricula/${curriculumId}/credit-pools`;
  console.log('[fetchCurriculumCreditPools] GET request:', url);
  
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[fetchCurriculumCreditPools] Error:', error);
    throw new Error(error.error?.message || 'Failed to fetch credit pools');
  }
  const result = await response.json();
  console.log('[fetchCurriculumCreditPools] Response:', result);
  // Log first pool's first subcategory requiredCredits for debugging
  if (result.pools?.[0]?.subCategories?.[0]) {
    console.log('[fetchCurriculumCreditPools] First subCategory requiredCredits:', result.pools[0].subCategories[0].requiredCredits);
  }
  return result;
}

/**
 * Create a new credit pool
 */
export async function createCreditPool(
  curriculumId: string,
  data: {
    name: string;
    topLevelCourseTypeId: string;
    enabled?: boolean;
    subCategories?: Array<{ courseTypeId: string; requiredCredits: number }>;
  }
): Promise<CreditPool> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to create credit pool');
  }
  const result = await response.json();
  return result.pool || result;
}

/**
 * Update a credit pool
 */
export async function updateCreditPool(
  curriculumId: string,
  poolId: number,
  data: { name?: string; enabled?: boolean }
): Promise<CreditPool> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/${poolId}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to update credit pool');
  }
  const result = await response.json();
  return result.pool || result;
}

/**
 * Delete a credit pool
 */
export async function deleteCreditPool(curriculumId: string, poolId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/${poolId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to delete credit pool');
  }
}

/**
 * Reorder credit pools
 */
export async function reorderCreditPools(
  curriculumId: string,
  orderedPoolIds: number[]
): Promise<void> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/reorder`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ orderedPoolIds })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to reorder pools');
  }
}

// =============================================================================
// Pool Summary & Utilities
// =============================================================================

/**
 * Get credit pool summary for a curriculum
 */
export async function fetchPoolSummary(curriculumId: string): Promise<PoolSummaryResponse> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/summary`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch pool summary');
  }
  return response.json();
}

/**
 * Get available top-level course types for creating pools
 */
export async function fetchAvailableCourseTypes(curriculumId: string): Promise<{ courseTypes: CourseTypeOption[] }> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/available-course-types`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch available course types');
  }
  return response.json();
}

/**
 * Get curriculum courses with their course types
 */
export async function fetchCurriculumCoursesForPools(curriculumId: string): Promise<{ courses: AvailableCourse[] }> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/curriculum-courses`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch curriculum courses');
  }
  return response.json();
}

// =============================================================================
// Sub-Category Operations
// =============================================================================

/**
 * Add a sub-category to a pool
 */
export async function addSubCategory(
  curriculumId: string,
  poolId: number,
  data: { courseTypeId: string; requiredCredits: number }
): Promise<SubCategory> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/${poolId}/sub-categories`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to add sub-category');
  }
  const result = await response.json();
  return result.subCategory || result;
}

/**
 * Update a sub-category
 */
export async function updateSubCategory(
  curriculumId: string,
  poolId: number,
  subCatId: number,
  data: { requiredCredits?: number }
): Promise<SubCategory> {
  const url = `${API_BASE}/curricula/${curriculumId}/credit-pools/${poolId}/sub-categories/${subCatId}`;
  console.log('[updateSubCategory] PUT request:', { url, data });
  
  const response = await fetch(url, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(data)
  });
  
  console.log('[updateSubCategory] Response status:', response.status, response.statusText);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error('[updateSubCategory] Error response:', error);
    throw new Error(error.error?.message || 'Failed to update sub-category');
  }
  const result = await response.json();
  console.log('[updateSubCategory] Success response:', result);
  return result.subCategory || result;
}

/**
 * Delete a sub-category
 */
export async function deleteSubCategory(
  curriculumId: string,
  poolId: number,
  subCatId: number
): Promise<void> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/${poolId}/sub-categories/${subCatId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to delete sub-category');
  }
}

/**
 * Reorder sub-categories within a pool
 */
export async function reorderSubCategories(
  curriculumId: string,
  poolId: number,
  orderedSubCatIds: number[]
): Promise<void> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/${poolId}/sub-categories/reorder`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ orderedSubCategoryIds: orderedSubCatIds })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to reorder sub-categories');
  }
}

/**
 * Get available child course types for a pool
 */
export async function fetchAvailableSubTypes(
  curriculumId: string,
  poolId: number
): Promise<{ courseTypes: CourseTypeOption[] }> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/${poolId}/available-sub-types`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch available sub-types');
  }
  return response.json();
}

// =============================================================================
// Course Attachment Operations
// =============================================================================

/**
 * Attach courses to a sub-category
 */
export async function attachCoursesToSubCategory(
  curriculumId: string,
  subCatId: number,
  courseIds: string[]
): Promise<{ attached: number; courses: AttachedCourse[] }> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/sub-categories/${subCatId}/attach-courses`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ courseIds })
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to attach courses');
  }
  return response.json();
}

/**
 * Detach a course from a sub-category by course ID
 */
export async function detachCourseFromSubCategory(
  curriculumId: string,
  subCatId: number,
  courseId: string
): Promise<void> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/sub-categories/${subCatId}/courses/${courseId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to detach course');
  }
}

/**
 * Detach a course by attachment ID
 */
export async function detachCourseByAttachmentId(
  curriculumId: string,
  attachmentId: number
): Promise<void> {
  const response = await fetch(`${API_BASE}/curricula/${curriculumId}/credit-pools/attachments/${attachmentId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to detach course');
  }
}

/**
 * Get available courses for a sub-category
 */
export async function fetchAvailableCoursesForSubCategory(
  curriculumId: string,
  poolId: number,
  subCatId: number,
  search?: string
): Promise<{ courses: AvailableCourse[] }> {
  const url = new URL(`${API_BASE}/curricula/${curriculumId}/credit-pools/${poolId}/sub-categories/${subCatId}/available-courses`);
  if (search) {
    url.searchParams.set('search', search);
  }
  const response = await fetch(url.toString(), {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error?.message || 'Failed to fetch available courses');
  }
  return response.json();
}
