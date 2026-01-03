# Implementation Plan: Credit Pool UI Flow

## Overview

This implementation plan breaks down the Credit Pool UI Flow feature into discrete coding tasks. The approach is incremental, starting with shared types and utilities, then building components from the bottom up, and finally integrating everything into the existing pages. Mock data is used throughout to enable frontend development before backend APIs are available.

## Tasks

- [ ] 1. Create shared types and mock data foundation
  - [x] 1.1 Create credit pool types file
    - Create `src/types/creditPool.ts` with all TypeScript interfaces (CreditPool, PoolSource, PoolList, CurriculumPoolAttachment, PoolCreditCalculation, etc.)
    - Export all types for use across components
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ] 1.2 Create mock data store
    - Create `src/lib/mockData/creditPoolMocks.ts` with MOCK_CREDIT_POOLS, MOCK_POOL_LISTS, and initial curriculum attachments
    - Include helper functions for CRUD operations on mock data
    - Add demo mode detection based on feature flags
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 1.3 Write property test for mock data CRUD operations
    - **Property 12: Demo Mode CRUD Operations**
    - **Validates: Requirements 5.3**

- [ ] 2. Implement credit calculation utilities
  - [x] 2.1 Create credit calculation module
    - Create `src/lib/utils/creditPoolCalculation.ts`
    - Implement `calculatePoolCredits` function with pool priority ordering
    - Implement `courseMatchesPoolSources` helper for source matching
    - Implement `courseTypeMatchesHierarchy` for hierarchy traversal
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ]* 2.2 Write property test for credit calculation correctness
    - **Property 10: Credit Calculation Correctness**
    - Test no double counting, priority order, overflow calculation
    - **Validates: Requirements 4.2, 4.3, 4.4**

  - [x] 2.3 Create breadcrumb utility
    - Create `src/lib/utils/courseTypeHierarchy.ts`
    - Implement `buildBreadcrumbPath` function for course type ancestry
    - Implement `getDescendantIds` for implicit child inclusion
    - _Requirements: 6.2, 6.5_

  - [ ]* 2.4 Write property test for breadcrumb path correctness
    - **Property 15: Breadcrumb Path Correctness**
    - **Validates: Requirements 6.5**

- [x] 3. Checkpoint - Ensure foundation is solid
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Build pool card components
  - [x] 4.1 Create CreditPoolCard component
    - Create `src/components/features/curriculum/CreditPoolCard.tsx`
    - Display pool name, description, credit range (min-max), source count
    - Include drag handle for reordering
    - Add edit and delete action buttons
    - _Requirements: 1.3, 1.4_

  - [x] 4.2 Create PoolListCard component
    - Create `src/components/features/curriculum/PoolListCard.tsx`
    - Display list name, description, course count badge
    - Add edit, delete, and view courses action buttons
    - _Requirements: 2.4_

  - [ ]* 4.3 Write property test for pool card display
    - **Property 2: Pool Save Validation and Display**
    - Verify card displays correct name, credit range, source count
    - **Validates: Requirements 1.3, 1.5**

- [ ] 5. Build source selector component
  - [x] 5.1 Create PoolSourceSelector component
    - Create `src/components/features/curriculum/PoolSourceSelector.tsx`
    - Render course type hierarchy as indented tree with expand/collapse
    - Show color badges and usage counts per node
    - Support multi-selection of course types and pool lists
    - Show breadcrumb paths for selected nodes
    - _Requirements: 1.2, 6.1, 6.2, 6.3, 6.5_

  - [ ]* 5.2 Write property test for source multi-selection
    - **Property 1: Pool Source Multi-Selection Completeness**
    - **Validates: Requirements 1.2**

  - [ ]* 5.3 Write property test for parent selection indication
    - **Property 13: Parent Selection Indicates Child Inclusion**
    - **Validates: Requirements 6.2**

- [ ] 6. Build modal components
  - [x] 6.1 Create AddPoolModal component
    - Create `src/components/features/curriculum/AddPoolModal.tsx`
    - Include fields: name, description, minCredits, maxCredits, allowNonCurriculum toggle
    - Integrate PoolSourceSelector for source selection
    - Add validation (name required, credits non-negative, max >= min)
    - Support both create and edit modes
    - _Requirements: 1.1, 1.5_

  - [x] 6.2 Create AddPoolListModal component
    - Create `src/components/features/curriculum/AddPoolListModal.tsx`
    - Include fields: name, description, defaultRequiredCredits
    - Add course search with database lookup
    - Support CSV/XLSX file upload with parsing
    - Display course list with add/remove functionality
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [ ]* 6.3 Write property test for CSV parsing
    - **Property 3: CSV Parsing Produces Valid Course List**
    - **Validates: Requirements 2.2**

  - [ ]* 6.4 Write property test for course search
    - **Property 4: Course Search Returns Matching Results**
    - **Validates: Requirements 2.3**

- [x] 7. Checkpoint - Ensure components work in isolation
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Build curriculum pool attachment components
  - [x] 8.1 Create CurriculumPoolAttachment component
    - Create `src/components/features/curriculum/CurriculumPoolAttachment.tsx`
    - Display pool name, curriculum-specific credits (required/max)
    - Show applied credits, remaining credits, satisfaction status
    - Include warning indicator for unsatisfied pools
    - Show overflow credits when applicable
    - Add drag handle for reordering
    - _Requirements: 3.3, 4.1, 4.3, 4.4_

  - [x] 8.2 Create PoolCreditPreview component
    - Create `src/components/features/curriculum/PoolCreditPreview.tsx`
    - Display summary of all attached pools with credit breakdown
    - Show total curriculum credits and free elective overflow
    - Highlight pools below minimum or above maximum
    - _Requirements: 4.1, 4.3, 4.4_

  - [ ]* 8.3 Write property test for attached pools display
    - **Property 8: Attached Pools Display Calculated Credits**
    - **Validates: Requirements 3.3**

- [ ] 9. Build pool attachment modal
  - [x] 9.1 Create AttachPoolModal component
    - Create `src/components/features/curriculum/AttachPoolModal.tsx`
    - Display available pools from department
    - Prompt for curriculum-specific requiredCredits and maxCredits
    - Show pool's default credit range as reference
    - _Requirements: 3.2_

- [ ] 10. Enhance PoolsListsTab for curriculum edit
  - [x] 10.1 Refactor PoolsListsTab with full functionality
    - Update `src/components/features/curriculum/PoolsListsTab.tsx`
    - Add available pools section with attach functionality
    - Add attached pools section with drag-to-reorder
    - Integrate PoolCreditPreview for live calculations
    - Add overlap detection with warning icons
    - Show demo mode banner when using mock data
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.5, 5.2, 7.1, 7.3_

  - [ ]* 10.2 Write property test for pool reordering
    - **Property 9: Pool Reordering Maintains Consistency**
    - **Validates: Requirements 3.4, 7.2**

  - [ ]* 10.3 Write property test for real-time calculation updates
    - **Property 11: Real-Time Calculation Updates**
    - **Validates: Requirements 4.5**

  - [ ]* 10.4 Write property test for overlap detection
    - **Property 17: Overlap Detection and Warning**
    - **Validates: Requirements 7.3**

  - [ ]* 10.5 Write property test for default ordering
    - **Property 18: Default Alphabetical Ordering**
    - **Validates: Requirements 7.5**

- [x] 11. Checkpoint - Ensure curriculum edit integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Integrate pools section into Config page
  - [x] 12.1 Add Pools & Lists section to info_config
    - Update `src/app/chairperson/info_config/page.tsx`
    - Add collapsible "Credit Pools" subsection with pool cards
    - Add collapsible "Pool Lists" subsection with list cards
    - Wire up Add Pool and Add Pool List buttons to modals
    - Implement drag-to-reorder for pools
    - Connect to mock data store with feature flag check
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.4, 5.1, 5.2_

  - [ ]* 12.2 Write property test for available pools display
    - **Property 7: Available Pools Display Credit Ranges**
    - **Validates: Requirements 3.1**

  - [ ]* 12.3 Write property test for pools display order
    - **Property 16: Pools Display in Order with Positions**
    - **Validates: Requirements 7.1**

- [ ] 13. Wire up info_edit page integration
  - [x] 13.1 Connect PoolsListsTab to curriculum data
    - Update `src/app/chairperson/info_edit/[id]/page.tsx`
    - Pass curriculum courses, course types, and mock pool data to PoolsListsTab
    - Handle pool attachment/detachment callbacks
    - Persist attachment changes to mock data store
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 13.2 Write property test for pool list edit
    - **Property 6: Pool List Edit Updates State**
    - **Validates: Requirements 2.5**

  - [ ]* 13.3 Write property test for pool list count display
    - **Property 5: Pool List Save Displays Correct Count**
    - **Validates: Requirements 2.4**

- [ ] 14. Add course type hierarchy enhancements
  - [x] 14.1 Enhance course type tree display
    - Update PoolSourceSelector with search/filter for deep hierarchies (>3 levels)
    - Add visual indication for implicitly included children
    - Ensure color badges and usage counts display correctly
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 14.2 Write property test for course type node display
    - **Property 14: Course Type Node Display**
    - **Validates: Requirements 6.3**

- [x] 15. Final checkpoint - Full integration testing
  - Ensure all tests pass, ask the user if questions arise.
  - Verify complete user flow: create pool → create list → attach to curriculum → view preview
  - Test drag-and-drop reordering in both Config and Edit pages
  - Verify demo mode indicator appears when using mock data
  - Test feature flag toggling shows/hides pool sections

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All components should follow existing patterns in the codebase (collapsible cards, modals, toast notifications)
- Mock data enables full UI development before backend APIs are ready
