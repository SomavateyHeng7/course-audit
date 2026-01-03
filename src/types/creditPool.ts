/**
 * Credit Pool Types
 * 
 * This file contains all TypeScript interfaces for the Credit Pool and Pool List
 * management features. These types support the chairperson UI flow for creating
 * and managing credit pools at the department level and attaching them to curricula.
 * 
 * Requirements: 1.1, 2.1, 3.1
 */

// =============================================================================
// Core Types
// =============================================================================

/**
 * Credit Pool Definition (department-level)
 * A named container that aggregates courses from one or more sources
 * with configurable minimum and maximum credit requirements.
 */
export interface CreditPool {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  minCredits: number;
  maxCredits: number | null;
  allowNonCurriculum: boolean;
  sources: PoolSource[];
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Pool Source (course type or pool list reference)
 * Defines what feeds courses into a credit pool.
 */
export interface PoolSource {
  id: string;
  poolId: string;
  sourceType: 'COURSE_TYPE' | 'COURSE_LIST';
  courseTypeId?: string | null;
  courseListId?: string | null;
  // Resolved data for display
  sourceName?: string;
  sourceColor?: string;
}

/**
 * Pool List (reusable course collection)
 * A collection of courses that can be attached to credit pools as a source.
 */
export interface PoolList {
  id: string;
  name: string;
  description?: string;
  departmentId: string;
  listType: 'POOL_LIST';
  defaultRequiredCredits?: number;
  courses: PoolListCourse[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Pool List Course
 * A course entry within a pool list.
 */
export interface PoolListCourse {
  id: string;
  courseListId: string;
  courseId: string;
  // Resolved course data
  code: string;
  name: string;
  credits: number;
}

// =============================================================================
// Curriculum Pool Attachment Types
// =============================================================================

/**
 * Curriculum Pool Attachment
 * The binding of a credit pool to a specific curriculum with
 * curriculum-specific credit requirements.
 */
export interface CurriculumPoolAttachment {
  id: string;
  curriculumId: string;
  creditPoolId: string;
  requiredCredits: number;
  maxCredits: number | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  // Resolved pool data
  pool?: CreditPool;
}

/**
 * Curriculum Pool Attachment with calculated credits
 * Extended attachment type that includes credit calculation results.
 */
export interface CurriculumPoolAttachmentWithCredits extends CurriculumPoolAttachment {
  appliedCredits: number;
  remainingCredits: number;
  overflowCredits: number;
  isSatisfied: boolean;
  matchedCourses: string[];
}

// =============================================================================
// Credit Calculation Types
// =============================================================================

/**
 * Pool Credit Calculation Result
 * The result of calculating how credits are distributed across a pool.
 */
export interface PoolCreditCalculation {
  poolId: string;
  poolName: string;
  requiredCredits: number;
  maxCredits: number | null;
  appliedCredits: number;
  remainingCredits: number;
  overflowCredits: number;
  isSatisfied: boolean;
  matchedCourses: string[]; // course IDs
}

/**
 * Pool Credit Configuration
 * Configuration for attaching a pool to a curriculum.
 */
export interface PoolCreditConfig {
  requiredCredits: number;
  maxCredits: number | null;
}

// =============================================================================
// Form Data Types (for creating/editing)
// =============================================================================

/**
 * New Credit Pool Form Data
 * Data structure for creating a new credit pool.
 */
export interface NewCreditPool {
  name: string;
  description?: string;
  minCredits: number;
  maxCredits: number | null;
  allowNonCurriculum: boolean;
  sources: Omit<PoolSource, 'id' | 'poolId'>[];
}

/**
 * New Pool List Form Data
 * Data structure for creating a new pool list.
 */
export interface NewPoolList {
  name: string;
  description?: string;
  defaultRequiredCredits?: number;
  courseCodes: string[];
}

// =============================================================================
// Course Type Hierarchy Types
// =============================================================================

/**
 * Course Type Lite
 * Lightweight course type representation for pool source selection.
 */
export interface CourseTypeLite {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  parent_id?: string | null;
  parentCourseTypeId?: string | null;
  usageCount?: number;
  usage_count?: number;
  childCount?: number;
  child_count?: number;
}

/**
 * Course Type Tree Node
 * Course type with children for hierarchical display.
 */
export interface CourseTypeTreeNode extends CourseTypeLite {
  children: CourseTypeTreeNode[];
}

/**
 * Curriculum Course Lite
 * Lightweight course representation for credit calculations.
 */
export interface CurriculumCourseLite {
  id: string;
  courseType?: {
    id?: string;
    name?: string;
    color?: string;
  } | null;
  credits: number;
  code?: string;
  name?: string;
}

// =============================================================================
// Mock Data Store Types
// =============================================================================

/**
 * Mock Data Store
 * Structure for storing mock data in demo mode.
 */
export interface MockDataStore {
  creditPools: CreditPool[];
  poolLists: PoolList[];
  curriculumPoolAttachments: Map<string, CurriculumPoolAttachment[]>;
}

// =============================================================================
// Component Props Types
// =============================================================================

/**
 * Credit Pool Card Props
 */
export interface CreditPoolCardProps {
  pool: CreditPool;
  onEdit: (pool: CreditPool) => void;
  onDelete: (poolId: string) => void;
  onDragStart?: (e: React.DragEvent, poolId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetPoolId: string) => void;
  isDragging?: boolean;
  showDragHandle?: boolean;
}

/**
 * Pool List Card Props
 */
export interface PoolListCardProps {
  poolList: PoolList;
  onEdit: (list: PoolList) => void;
  onDelete: (listId: string) => void;
  onViewCourses: (list: PoolList) => void;
}

/**
 * Add Pool Modal Props
 */
export interface AddPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pool: NewCreditPool) => void;
  courseTypes: CourseTypeTreeNode[];
  poolLists: PoolList[];
  editingPool?: CreditPool | null;
}

/**
 * Add Pool List Modal Props
 */
export interface AddPoolListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (list: NewPoolList) => void;
  editingList?: PoolList | null;
}

/**
 * Pool Source Selector Props
 */
export interface PoolSourceSelectorProps {
  courseTypes: CourseTypeTreeNode[];
  poolLists: PoolList[];
  selectedSources: PoolSource[];
  onSourcesChange: (sources: PoolSource[]) => void;
}

/**
 * Curriculum Pool Attachment Component Props
 */
export interface CurriculumPoolAttachmentComponentProps {
  pool: CreditPool;
  attachment: CurriculumPoolAttachment;
  appliedCredits: number;
  overflowCredits: number;
  onUpdate: (attachment: CurriculumPoolAttachment) => void;
  onDetach: (attachmentId: string) => void;
  onDragStart?: (e: React.DragEvent, attachmentId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetAttachmentId: string) => void;
}

/**
 * Pool Credit Preview Props
 */
export interface PoolCreditPreviewProps {
  attachments: CurriculumPoolAttachmentWithCredits[];
  totalCurriculumCredits: number;
  freeElectiveOverflow: number;
}

/**
 * Enhanced Pools Lists Tab Props
 */
export interface EnhancedPoolsListsTabProps {
  curriculumId: string;
  curriculumName?: string;
  departmentId?: string;
  courseTypes: CourseTypeLite[];
  courses: CurriculumCourseLite[];
  isLoadingCourseTypes?: boolean;
  // New props for pool management
  availablePools: CreditPool[];
  attachedPools: CurriculumPoolAttachment[];
  poolLists: PoolList[];
  onAttachPool: (poolId: string, credits: PoolCreditConfig) => void;
  onDetachPool: (attachmentId: string) => void;
  onUpdateAttachment: (attachment: CurriculumPoolAttachment) => void;
  onReorderAttachments: (orderedIds: string[]) => void;
  isDemoMode?: boolean;
}

/**
 * Attach Pool Modal Props
 */
export interface AttachPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (poolId: string, credits: PoolCreditConfig) => void;
  availablePools: CreditPool[];
  selectedPoolId?: string | null;
}
