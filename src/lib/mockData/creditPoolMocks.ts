/**
 * Credit Pool Mock Data Store
 * 
 * This file provides mock data and CRUD operations for the Credit Pool and Pool List
 * management features. It enables frontend development and demonstration before
 * backend APIs are available.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */

import type {
  CreditPool,
  PoolList,
  PoolSource,
  PoolListCourse,
  CurriculumPoolAttachment,
  NewCreditPool,
  NewPoolList,
  PoolCreditConfig,
} from '@/types/creditPool';

// =============================================================================
// Demo Mode Detection
// =============================================================================

/**
 * Check if the application is running in demo mode.
 * Demo mode is active when:
 * 1. The enablePools feature flag is true, AND
 * 2. The backend API is unavailable or returns an error
 * 
 * For simplicity, we check the NEXT_PUBLIC_ENABLE_CONFIG_POOLS env variable
 * and assume demo mode when pools are enabled but no backend is configured.
 */
export function isDemoMode(): boolean {
  // Check if pools feature is enabled via environment variable
  const poolsEnabled = process.env.NEXT_PUBLIC_ENABLE_CONFIG_POOLS?.toLowerCase() === 'true';
  
  // In demo mode when pools are enabled (backend integration will override this)
  return poolsEnabled;
}

/**
 * Check if demo mode is active based on feature flags object
 */
export function isDemoModeFromFlags(flags: { enablePools?: boolean }): boolean {
  return flags.enablePools === true;
}

// =============================================================================
// ID Generation Utilities
// =============================================================================

/**
 * Generate a unique ID for mock data entities
 */
function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Get current ISO timestamp
 */
function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

// =============================================================================
// Initial Mock Data
// =============================================================================

/**
 * Initial mock credit pools for demonstration
 */
export const INITIAL_MOCK_CREDIT_POOLS: CreditPool[] = [
  {
    id: 'pool-1',
    name: 'Core Engineering',
    description: 'Fundamental engineering courses required for all students',
    departmentId: 'dept-1',
    minCredits: 30,
    maxCredits: null,
    allowNonCurriculum: false,
    sources: [
      {
        id: 'src-1',
        poolId: 'pool-1',
        sourceType: 'COURSE_TYPE',
        courseTypeId: 'type-core',
        sourceName: 'Core',
        sourceColor: '#3B82F6',
      },
    ],
    orderIndex: 0,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pool-2',
    name: 'Major Electives',
    description: 'Elective courses within the major field',
    departmentId: 'dept-1',
    minCredits: 15,
    maxCredits: 24,
    allowNonCurriculum: false,
    sources: [
      {
        id: 'src-2',
        poolId: 'pool-2',
        sourceType: 'COURSE_TYPE',
        courseTypeId: 'type-major-elective',
        sourceName: 'Major Elective',
        sourceColor: '#10B981',
      },
    ],
    orderIndex: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pool-3',
    name: 'General Education',
    description: 'Broad educational foundation courses',
    departmentId: 'dept-1',
    minCredits: 30,
    maxCredits: 36,
    allowNonCurriculum: false,
    sources: [
      {
        id: 'src-3',
        poolId: 'pool-3',
        sourceType: 'COURSE_TYPE',
        courseTypeId: 'type-ge',
        sourceName: 'General Education',
        sourceColor: '#F59E0B',
      },
    ],
    orderIndex: 2,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'pool-4',
    name: 'Free Electives',
    description: 'Any courses to fulfill remaining credit requirements',
    departmentId: 'dept-1',
    minCredits: 6,
    maxCredits: null,
    allowNonCurriculum: true,
    sources: [],
    orderIndex: 3,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

/**
 * Initial mock pool lists for demonstration
 */
export const INITIAL_MOCK_POOL_LISTS: PoolList[] = [
  {
    id: 'list-1',
    name: 'Data Science Track',
    description: 'Courses for data science specialization',
    departmentId: 'dept-1',
    listType: 'POOL_LIST',
    defaultRequiredCredits: 12,
    courses: [
      {
        id: 'lc-1',
        courseListId: 'list-1',
        courseId: 'c-1',
        code: 'CS 301',
        name: 'Machine Learning',
        credits: 3,
      },
      {
        id: 'lc-2',
        courseListId: 'list-1',
        courseId: 'c-2',
        code: 'CS 302',
        name: 'Data Mining',
        credits: 3,
      },
      {
        id: 'lc-3',
        courseListId: 'list-1',
        courseId: 'c-3',
        code: 'STAT 301',
        name: 'Statistical Learning',
        credits: 3,
      },
      {
        id: 'lc-4',
        courseListId: 'list-1',
        courseId: 'c-4',
        code: 'CS 303',
        name: 'Big Data Analytics',
        credits: 3,
      },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 'list-2',
    name: 'Software Engineering Track',
    description: 'Courses for software engineering specialization',
    departmentId: 'dept-1',
    listType: 'POOL_LIST',
    defaultRequiredCredits: 12,
    courses: [
      {
        id: 'lc-5',
        courseListId: 'list-2',
        courseId: 'c-5',
        code: 'CS 401',
        name: 'Software Architecture',
        credits: 3,
      },
      {
        id: 'lc-6',
        courseListId: 'list-2',
        courseId: 'c-6',
        code: 'CS 402',
        name: 'DevOps Practices',
        credits: 3,
      },
      {
        id: 'lc-7',
        courseListId: 'list-2',
        courseId: 'c-7',
        code: 'CS 403',
        name: 'Agile Development',
        credits: 3,
      },
      {
        id: 'lc-8',
        courseListId: 'list-2',
        courseId: 'c-8',
        code: 'CS 404',
        name: 'Software Testing',
        credits: 3,
      },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

/**
 * Initial mock curriculum pool attachments for demonstration
 */
export const INITIAL_MOCK_CURRICULUM_ATTACHMENTS: Record<string, CurriculumPoolAttachment[]> = {
  'curriculum-demo-1': [
    {
      id: 'attach-1',
      curriculumId: 'curriculum-demo-1',
      creditPoolId: 'pool-1',
      requiredCredits: 30,
      maxCredits: null,
      orderIndex: 0,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
    {
      id: 'attach-2',
      curriculumId: 'curriculum-demo-1',
      creditPoolId: 'pool-3',
      requiredCredits: 30,
      maxCredits: 36,
      orderIndex: 1,
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  ],
};

// =============================================================================
// Mock Data Store Class
// =============================================================================

/**
 * MockCreditPoolStore manages the in-memory state for credit pools, pool lists,
 * and curriculum attachments during demo mode.
 */
class MockCreditPoolStore {
  private creditPools: CreditPool[];
  private poolLists: PoolList[];
  private curriculumAttachments: Map<string, CurriculumPoolAttachment[]>;
  private initialized: boolean = false;

  constructor() {
    this.creditPools = [];
    this.poolLists = [];
    this.curriculumAttachments = new Map();
  }

  /**
   * Initialize the store with default mock data
   */
  initialize(): void {
    if (this.initialized) return;
    
    this.creditPools = [...INITIAL_MOCK_CREDIT_POOLS];
    this.poolLists = [...INITIAL_MOCK_POOL_LISTS];
    this.curriculumAttachments = new Map(
      Object.entries(INITIAL_MOCK_CURRICULUM_ATTACHMENTS).map(([key, value]) => [
        key,
        [...value],
      ])
    );
    this.initialized = true;
  }

  /**
   * Reset the store to initial state (for page refresh simulation)
   */
  reset(): void {
    this.initialized = false;
    this.initialize();
  }

  // ===========================================================================
  // Credit Pool CRUD Operations
  // ===========================================================================

  /**
   * Get all credit pools for a department
   * Note: In demo mode, we return all pools regardless of department to ensure
   * mock data is always visible for demonstration purposes.
   */
  getCreditPools(departmentId?: string): CreditPool[] {
    this.initialize();
    // In demo mode, always return all pools to ensure visibility
    // The departmentId filter is ignored for mock data demonstration
    return [...this.creditPools];
  }

  /**
   * Get a single credit pool by ID
   */
  getCreditPool(poolId: string): CreditPool | undefined {
    this.initialize();
    return this.creditPools.find((p) => p.id === poolId);
  }

  /**
   * Create a new credit pool
   */
  createCreditPool(data: NewCreditPool, departmentId: string): CreditPool {
    this.initialize();
    const timestamp = getCurrentTimestamp();
    const poolId = generateId('pool');
    
    // Create sources with IDs
    const sources: PoolSource[] = data.sources.map((source) => ({
      ...source,
      id: generateId('src'),
      poolId,
    }));

    // Calculate order index (add to end)
    const maxOrderIndex = Math.max(
      -1,
      ...this.creditPools
        .filter((p) => p.departmentId === departmentId)
        .map((p) => p.orderIndex)
    );

    const newPool: CreditPool = {
      id: poolId,
      name: data.name,
      description: data.description,
      departmentId,
      minCredits: data.minCredits,
      maxCredits: data.maxCredits,
      allowNonCurriculum: data.allowNonCurriculum,
      sources,
      orderIndex: maxOrderIndex + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.creditPools.push(newPool);
    return newPool;
  }

  /**
   * Update an existing credit pool
   */
  updateCreditPool(poolId: string, data: Partial<NewCreditPool>): CreditPool | undefined {
    this.initialize();
    const index = this.creditPools.findIndex((p) => p.id === poolId);
    if (index === -1) return undefined;

    const existing = this.creditPools[index];
    const timestamp = getCurrentTimestamp();

    // Update sources if provided
    let sources = existing.sources;
    if (data.sources) {
      sources = data.sources.map((source, idx) => ({
        ...source,
        id: existing.sources[idx]?.id || generateId('src'),
        poolId,
      }));
    }

    const updated: CreditPool = {
      ...existing,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      minCredits: data.minCredits ?? existing.minCredits,
      maxCredits: data.maxCredits !== undefined ? data.maxCredits : existing.maxCredits,
      allowNonCurriculum: data.allowNonCurriculum ?? existing.allowNonCurriculum,
      sources,
      updatedAt: timestamp,
    };

    this.creditPools[index] = updated;
    return updated;
  }

  /**
   * Delete a credit pool
   */
  deleteCreditPool(poolId: string): boolean {
    this.initialize();
    const index = this.creditPools.findIndex((p) => p.id === poolId);
    if (index === -1) return false;

    this.creditPools.splice(index, 1);

    // Also remove any curriculum attachments for this pool
    this.curriculumAttachments.forEach((attachments, curriculumId) => {
      const filtered = attachments.filter((a) => a.creditPoolId !== poolId);
      this.curriculumAttachments.set(curriculumId, filtered);
    });

    return true;
  }

  /**
   * Reorder credit pools within a department
   */
  reorderCreditPools(departmentId: string, orderedPoolIds: string[]): void {
    this.initialize();
    orderedPoolIds.forEach((poolId, index) => {
      const pool = this.creditPools.find(
        (p) => p.id === poolId && p.departmentId === departmentId
      );
      if (pool) {
        pool.orderIndex = index;
        pool.updatedAt = getCurrentTimestamp();
      }
    });
  }

  // ===========================================================================
  // Pool List CRUD Operations
  // ===========================================================================

  /**
   * Get all pool lists for a department
   * Note: In demo mode, we return all pool lists regardless of department to ensure
   * mock data is always visible for demonstration purposes.
   */
  getPoolLists(departmentId?: string): PoolList[] {
    this.initialize();
    // In demo mode, always return all pool lists to ensure visibility
    // The departmentId filter is ignored for mock data demonstration
    return [...this.poolLists];
  }

  /**
   * Get a single pool list by ID
   */
  getPoolList(listId: string): PoolList | undefined {
    this.initialize();
    return this.poolLists.find((l) => l.id === listId);
  }

  /**
   * Create a new pool list
   */
  createPoolList(
    data: NewPoolList,
    departmentId: string,
    resolvedCourses: Omit<PoolListCourse, 'id' | 'courseListId'>[]
  ): PoolList {
    this.initialize();
    const timestamp = getCurrentTimestamp();
    const listId = generateId('list');

    const courses: PoolListCourse[] = resolvedCourses.map((course) => ({
      ...course,
      id: generateId('lc'),
      courseListId: listId,
    }));

    const newList: PoolList = {
      id: listId,
      name: data.name,
      description: data.description,
      departmentId,
      listType: 'POOL_LIST',
      defaultRequiredCredits: data.defaultRequiredCredits,
      courses,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.poolLists.push(newList);
    return newList;
  }

  /**
   * Update an existing pool list
   */
  updatePoolList(
    listId: string,
    data: Partial<NewPoolList>,
    resolvedCourses?: Omit<PoolListCourse, 'id' | 'courseListId'>[]
  ): PoolList | undefined {
    this.initialize();
    const index = this.poolLists.findIndex((l) => l.id === listId);
    if (index === -1) return undefined;

    const existing = this.poolLists[index];
    const timestamp = getCurrentTimestamp();

    // Update courses if provided
    let courses = existing.courses;
    if (resolvedCourses) {
      courses = resolvedCourses.map((course) => ({
        ...course,
        id: generateId('lc'),
        courseListId: listId,
      }));
    }

    const updated: PoolList = {
      ...existing,
      name: data.name ?? existing.name,
      description: data.description ?? existing.description,
      defaultRequiredCredits: data.defaultRequiredCredits ?? existing.defaultRequiredCredits,
      courses,
      updatedAt: timestamp,
    };

    this.poolLists[index] = updated;
    return updated;
  }

  /**
   * Delete a pool list
   */
  deletePoolList(listId: string): boolean {
    this.initialize();
    const index = this.poolLists.findIndex((l) => l.id === listId);
    if (index === -1) return false;

    this.poolLists.splice(index, 1);

    // Also remove this list from any pool sources
    this.creditPools.forEach((pool) => {
      pool.sources = pool.sources.filter(
        (s) => !(s.sourceType === 'COURSE_LIST' && s.courseListId === listId)
      );
    });

    return true;
  }

  /**
   * Add a course to a pool list
   */
  addCourseToPoolList(
    listId: string,
    course: Omit<PoolListCourse, 'id' | 'courseListId'>
  ): PoolList | undefined {
    this.initialize();
    const list = this.poolLists.find((l) => l.id === listId);
    if (!list) return undefined;

    // Check if course already exists
    if (list.courses.some((c) => c.courseId === course.courseId)) {
      return list;
    }

    list.courses.push({
      ...course,
      id: generateId('lc'),
      courseListId: listId,
    });
    list.updatedAt = getCurrentTimestamp();

    return list;
  }

  /**
   * Remove a course from a pool list
   */
  removeCourseFromPoolList(listId: string, courseId: string): PoolList | undefined {
    this.initialize();
    const list = this.poolLists.find((l) => l.id === listId);
    if (!list) return undefined;

    list.courses = list.courses.filter((c) => c.courseId !== courseId);
    list.updatedAt = getCurrentTimestamp();

    return list;
  }

  // ===========================================================================
  // Curriculum Pool Attachment CRUD Operations
  // ===========================================================================

  /**
   * Get all pool attachments for a curriculum
   */
  getCurriculumAttachments(curriculumId: string): CurriculumPoolAttachment[] {
    this.initialize();
    return this.curriculumAttachments.get(curriculumId) || [];
  }

  /**
   * Attach a pool to a curriculum
   */
  attachPoolToCurriculum(
    curriculumId: string,
    poolId: string,
    credits: PoolCreditConfig
  ): CurriculumPoolAttachment | undefined {
    this.initialize();
    
    // Verify pool exists
    const pool = this.getCreditPool(poolId);
    if (!pool) return undefined;

    // Get existing attachments
    const attachments = this.curriculumAttachments.get(curriculumId) || [];

    // Check if already attached
    if (attachments.some((a) => a.creditPoolId === poolId)) {
      return undefined;
    }

    // Calculate order index
    const maxOrderIndex = Math.max(-1, ...attachments.map((a) => a.orderIndex));
    const timestamp = getCurrentTimestamp();

    const newAttachment: CurriculumPoolAttachment = {
      id: generateId('attach'),
      curriculumId,
      creditPoolId: poolId,
      requiredCredits: credits.requiredCredits,
      maxCredits: credits.maxCredits,
      orderIndex: maxOrderIndex + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
      pool,
    };

    attachments.push(newAttachment);
    this.curriculumAttachments.set(curriculumId, attachments);

    return newAttachment;
  }

  /**
   * Update a curriculum pool attachment
   */
  updateCurriculumAttachment(
    attachmentId: string,
    data: Partial<PoolCreditConfig>
  ): CurriculumPoolAttachment | undefined {
    this.initialize();
    
    for (const [, attachments] of this.curriculumAttachments.entries()) {
      const index = attachments.findIndex((a) => a.id === attachmentId);
      if (index !== -1) {
        const existing = attachments[index];
        const updated: CurriculumPoolAttachment = {
          ...existing,
          requiredCredits: data.requiredCredits ?? existing.requiredCredits,
          maxCredits: data.maxCredits !== undefined ? data.maxCredits : existing.maxCredits,
          updatedAt: getCurrentTimestamp(),
        };
        attachments[index] = updated;
        return updated;
      }
    }

    return undefined;
  }

  /**
   * Detach a pool from a curriculum
   */
  detachPoolFromCurriculum(attachmentId: string): boolean {
    this.initialize();
    
    for (const [, attachments] of this.curriculumAttachments.entries()) {
      const index = attachments.findIndex((a) => a.id === attachmentId);
      if (index !== -1) {
        attachments.splice(index, 1);
        // Reindex remaining attachments
        attachments.forEach((a, i) => {
          a.orderIndex = i;
        });
        return true;
      }
    }

    return false;
  }

  /**
   * Reorder pool attachments for a curriculum
   */
  reorderCurriculumAttachments(curriculumId: string, orderedAttachmentIds: string[]): void {
    this.initialize();
    const attachments = this.curriculumAttachments.get(curriculumId);
    if (!attachments) return;

    const timestamp = getCurrentTimestamp();
    orderedAttachmentIds.forEach((attachmentId, index) => {
      const attachment = attachments.find((a) => a.id === attachmentId);
      if (attachment) {
        attachment.orderIndex = index;
        attachment.updatedAt = timestamp;
      }
    });

    // Sort by new order
    attachments.sort((a, b) => a.orderIndex - b.orderIndex);
  }

  /**
   * Get attachments with resolved pool data
   */
  getCurriculumAttachmentsWithPools(curriculumId: string): CurriculumPoolAttachment[] {
    this.initialize();
    const attachments = this.getCurriculumAttachments(curriculumId);
    
    return attachments.map((attachment) => ({
      ...attachment,
      pool: this.getCreditPool(attachment.creditPoolId),
    }));
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

/**
 * Singleton instance of the mock data store
 */
export const mockCreditPoolStore = new MockCreditPoolStore();

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Get mock credit pools (convenience wrapper)
 */
export function getMockCreditPools(departmentId?: string): CreditPool[] {
  return mockCreditPoolStore.getCreditPools(departmentId);
}

/**
 * Get mock pool lists (convenience wrapper)
 */
export function getMockPoolLists(departmentId?: string): PoolList[] {
  return mockCreditPoolStore.getPoolLists(departmentId);
}

/**
 * Get mock curriculum attachments (convenience wrapper)
 */
export function getMockCurriculumAttachments(curriculumId: string): CurriculumPoolAttachment[] {
  return mockCreditPoolStore.getCurriculumAttachmentsWithPools(curriculumId);
}

/**
 * Reset mock data to initial state
 */
export function resetMockData(): void {
  mockCreditPoolStore.reset();
}

// =============================================================================
// Export Constants for Testing
// =============================================================================

export const MOCK_CREDIT_POOLS = INITIAL_MOCK_CREDIT_POOLS;
export const MOCK_POOL_LISTS = INITIAL_MOCK_POOL_LISTS;
