# Design Document: Curriculum-Based Credit Pools

## Overview

This design document describes the architecture for a redesigned Credit Pool management system. The key architectural change is moving pool creation from a global configuration page to curriculum-specific management within the Pool List tab. Pools are now created based on the course type hierarchy already assigned to the curriculum, making the system more intuitive and eliminating redundant configuration steps.

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Curriculum Edit Page (info_edit)                      │
├─────────────────────────────────────────────────────────────────────────┤
│  [Courses] [Course Types] [Concentrations] [Blacklist] [Pool List]      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Pool List Tab (Redesigned)                       │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Summary Card: 3 pools | 45 total credits | 2 Complete, 1 Needs  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  [+ Add Pool]                                                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📦 Major Courses (Total: 30 credits) [Enabled ✓] [Edit] [Delete]│   │
│  │ ├── 📁 Core CS (18 credits required) [Auto-attach] [+ Add]      │   │
│  │ │   ├── CS 101 - Intro to Programming (3 cr) [×]                │   │
│  │ │   ├── CS 201 - Data Structures (3 cr) [×]                     │   │
│  │ │   └── ... (6/18 credits attached)                             │   │
│  │ ├── 📁 Electives (12 credits required) [Auto-attach] [+ Add]    │   │
│  │ │   └── (0/12 credits attached)                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 📦 General Education (Total: 15 credits) [Disabled] [Edit]      │   │
│  │ └── ...                                                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Curriculum      │     │  Course Types    │     │  Curriculum      │
│  Courses         │────▶│  (Hierarchy)     │────▶│  Credit Pools    │
│  (with types)    │     │  Used in Curr.   │     │  (Local to Curr) │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                │                         │
                                ▼                         ▼
                    ┌──────────────────────────────────────────┐
                    │         Pool Creation Modal              │
                    │  1. Select top-level category            │
                    │  2. Auto-populate sub-categories         │
                    │  3. Set required credits per sub-cat     │
                    │  4. Attach courses (manual/auto)         │
                    └──────────────────────────────────────────┘
```

## Components and Interfaces

### New/Modified Components

#### 1. CurriculumPoolsTab (Replaces PoolsListsTab)

Main container component for the redesigned Pool List tab.

```typescript
interface CurriculumPoolsTabProps {
  curriculumId: string;
  curriculumName: string;
  courseTypes: CourseTypeLite[];        // All course types used in curriculum
  courses: CurriculumCourseLite[];      // All courses in curriculum
  onPoolsChange?: (pools: CurriculumCreditPool[]) => void;
}
```

#### 2. CreatePoolModal

Modal for creating a new credit pool based on course type hierarchy.

```typescript
interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pool: NewCurriculumCreditPool) => void;
  availableTopLevelTypes: CourseTypeLite[];  // Top-level types from curriculum
  courseTypeHierarchy: CourseTypeTreeNode[]; // Full hierarchy for sub-categories
  curriculumCourses: CurriculumCourseLite[]; // For course attachment
}
```

#### 3. CreditPoolCard

Displays a single credit pool with its sub-category pools.

```typescript
interface CreditPoolCardProps {
  pool: CurriculumCreditPool;
  onEdit: (pool: CurriculumCreditPool) => void;
  onDelete: (poolId: string) => void;
  onToggleEnabled: (poolId: string, enabled: boolean) => void;
  onUpdateSubCategory: (poolId: string, subCatId: string, updates: SubCategoryUpdates) => void;
  onAttachCourse: (poolId: string, subCatId: string, course: CurriculumCourseLite) => void;
  onDetachCourse: (poolId: string, subCatId: string, courseId: string) => void;
  onAutoAttach: (poolId: string, subCatId: string) => void;
  curriculumCourses: CurriculumCourseLite[];
}
```

#### 4. SubCategoryPool

Displays a sub-category within a credit pool.

```typescript
interface SubCategoryPoolProps {
  subCategory: SubCategoryPool;
  parentPoolId: string;
  onUpdateCredits: (credits: number) => void;
  onAttachCourse: (course: CurriculumCourseLite) => void;
  onDetachCourse: (courseId: string) => void;
  onAutoAttach: () => void;
  availableCourses: CurriculumCourseLite[];  // Courses matching this sub-category type
  isExpanded: boolean;
  onToggleExpand: () => void;
}
```

#### 5. AttachCourseModal

Modal for manually selecting courses to attach to a sub-category.

```typescript
interface AttachCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttach: (courses: CurriculumCourseLite[]) => void;
  availableCourses: CurriculumCourseLite[];
  alreadyAttachedIds: string[];
  subCategoryName: string;
}
```

#### 6. PoolSummaryCard

Displays summary statistics for all pools.

```typescript
interface PoolSummaryCardProps {
  pools: CurriculumCreditPool[];
  totalRequiredCredits: number;
  completePools: number;
  needsAttentionPools: number;
}
```

## Data Models

### CurriculumCreditPool

```typescript
interface CurriculumCreditPool {
  id: string;
  curriculumId: string;
  name: string;                          // From top-level course type
  topLevelCourseTypeId: string;          // Reference to the selected top-level type
  enabled: boolean;
  subCategories: SubCategoryPool[];
  totalRequiredCredits: number;          // Computed: sum of sub-category requirements
  totalAttachedCredits: number;          // Computed: sum of attached course credits
  createdAt: string;
  updatedAt: string;
}
```

### SubCategoryPool

```typescript
interface SubCategoryPool {
  id: string;
  poolId: string;                        // Parent pool reference
  courseTypeId: string;                  // The course type this sub-category represents
  courseTypeName: string;
  courseTypeColor: string;
  requiredCredits: number;
  attachedCourses: AttachedCourse[];
  attachedCredits: number;               // Computed: sum of attached course credits
}
```

### AttachedCourse

```typescript
interface AttachedCourse {
  id: string;
  courseId: string;
  code: string;
  name: string;
  credits: number;
  attachedAt: string;
}
```

### NewCurriculumCreditPool

```typescript
interface NewCurriculumCreditPool {
  topLevelCourseTypeId: string;
  subCategories: {
    courseTypeId: string;
    requiredCredits: number;
  }[];
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*



### Property 1: Top-Level Category Filtering

*For any* curriculum with courses assigned to various course types, when opening the "Add Pool" modal, only top-level course categories (those with no parent) that have at least one course in the curriculum (directly or through descendants) should be displayed as options.

**Validates: Requirements 1.2, 1.5**

### Property 2: Sub-Category Population from Hierarchy

*For any* selected top-level course type, the pool should be populated with all descendant course types that are actually used by courses in the current curriculum. Unused descendant types should not appear.

**Validates: Requirements 1.3**

### Property 3: Total Credits Equals Sum of Sub-Category Requirements

*For any* credit pool, the displayed total required credits should always equal the sum of all sub-category required credits. This invariant must hold after any modification to sub-category credits.

**Validates: Requirements 2.3, 2.4, 2.5**

### Property 4: Non-Negative Credit Validation

*For any* input to a required credits field, the system should reject negative values and only accept non-negative numbers (including zero).

**Validates: Requirements 2.2**

### Property 5: Course Type Matching for Attachment

*For any* sub-category pool, the "Add Course" modal should only display courses from the curriculum that have the sub-category's course type (or a descendant type) assigned.

**Validates: Requirements 3.2**

### Property 6: No Duplicate Course Attachment Within Pool

*For any* credit pool, a course can only be attached to one sub-category within that pool. Attempting to attach a course that is already attached to another sub-category in the same pool should be prevented.

**Validates: Requirements 3.5**

### Property 7: Attached Credits Equals Sum of Course Credits

*For any* sub-category pool, the displayed attached credits should always equal the sum of credits from all attached courses. This invariant must hold after any course attachment or removal.

**Validates: Requirements 3.4, 9.3, 9.4**

### Property 8: Auto-Attach Completeness and Idempotence

*For any* sub-category pool, clicking "Auto-attach All" should attach all curriculum courses matching the sub-category's course type that are not already attached. Running auto-attach twice should produce the same result as running it once (idempotent).

**Validates: Requirements 4.2, 4.4**

### Property 9: Pool Status Reflects Credit Requirements

*For any* credit pool, the status should be "Complete" if and only if every sub-category has attached credits >= required credits. Otherwise, the status should be "Needs Attention".

**Validates: Requirements 8.2, 8.3, 9.5**

### Property 10: Disabled Pool Exclusion from Calculations

*For any* disabled credit pool, it should not contribute to overall curriculum credit calculations or student progress tracking. Enabling the pool should restore its contribution.

**Validates: Requirements 5.3, 5.4**

### Property 11: Cascade Delete Removes All Associated Data

*For any* deleted credit pool, all sub-category pools and course attachments associated with it should be removed. No orphaned data should remain.

**Validates: Requirements 6.4**

### Property 12: Summary Statistics Accuracy

*For any* set of credit pools, the summary card should display accurate counts: total pools, sum of all required credits, count of complete pools, and count of pools needing attention.

**Validates: Requirements 8.1, 8.5**

## Error Handling

### Validation Errors

| Error Condition | User Feedback | Recovery Action |
|----------------|---------------|-----------------|
| Empty pool name | "Pool name is required" | Focus on name field |
| Negative credits | "Credits must be non-negative" | Reset to previous valid value |
| Duplicate course attachment | "Course already attached to [sub-category]" | Prevent attachment, show warning |
| No matching courses for auto-attach | "No courses available to attach" | Show info message |
| Delete confirmation cancelled | No action | Close confirmation dialog |

### Edge Cases

1. **Empty curriculum**: If no courses exist in the curriculum, the "Add Pool" button should be disabled with a tooltip explaining why.

2. **Single-level hierarchy**: If a top-level type has no sub-categories used in the curriculum, the pool should contain only that single category as both the pool and its only sub-category.

3. **All courses already attached**: When all matching courses are already attached to a sub-category, the "Add Course" modal should show an empty state message.

4. **Zero required credits**: A sub-category can have 0 required credits, which means it's optional but courses can still be attached for tracking.

## Testing Strategy

### Unit Tests

Unit tests should cover:
- Component rendering with various props
- User interaction handlers (click, input change)
- Validation logic for credit inputs
- Course type hierarchy traversal utilities

### Property-Based Tests

Property-based tests should be implemented for all 12 correctness properties defined above. Each test should:
- Generate random but valid curriculum configurations
- Perform operations (create pool, attach courses, etc.)
- Verify the property holds after each operation
- Run minimum 100 iterations per property

**Testing Framework**: Use the existing testing setup with Jest and React Testing Library. For property-based testing, use `fast-check` library.

**Test File Location**: `src/components/features/curriculum/__tests__/CurriculumPoolsTab.test.tsx`

### Integration Tests

Integration tests should verify:
- Complete flow: Create pool → Set credits → Attach courses → Verify summary
- Pool enable/disable affects calculations correctly
- Config page no longer shows pool creation UI
- Data persistence across tab switches

## UI/UX Considerations

### Visual Hierarchy

```
Pool Card (elevated, with shadow)
├── Header: Pool name + total credits + toggle + actions
├── Sub-category 1 (indented, lighter background)
│   ├── Name + required credits input
│   ├── Progress bar (attached/required)
│   ├── Attached courses list (collapsible)
│   └── Action buttons (Auto-attach, Add Course)
├── Sub-category 2
│   └── ...
└── Sub-category N
```

### Color Coding

- **Complete sub-category**: Green progress bar, checkmark icon
- **Incomplete sub-category**: Amber progress bar, warning icon
- **Disabled pool**: Grayed out appearance, muted colors
- **Course type colors**: Inherit from course type configuration

### Responsive Design

- On mobile: Stack sub-categories vertically, collapse by default
- On tablet: Show 1-2 pools per row
- On desktop: Show full expanded view with all details

## Migration Plan

### Phase 1: Add New Components
- Create new `CurriculumPoolsTab` component
- Create supporting components (CreatePoolModal, CreditPoolCard, etc.)
- Add to curriculum edit page alongside existing tab

### Phase 2: Remove Old Pool Creation
- Remove pool creation UI from Config page
- Add migration notice for legacy pools
- Keep read-only view of legacy pools if any exist

### Phase 3: Data Migration (Future)
- When backend is ready, migrate existing pool data to new structure
- Convert global pools to curriculum-specific pools
