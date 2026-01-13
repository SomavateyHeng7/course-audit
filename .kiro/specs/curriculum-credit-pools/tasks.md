# Implementation Plan: Curriculum-Based Credit Pools

## Overview

Brief implementation plan focusing on core functionality. Frontend-only with mock data.

## Tasks

- [x] 1. Create new types and mock data
  - [x] 1.1 Add CurriculumCreditPool types to creditPool.ts
  - [x] 1.2 Create mock data for curriculum pools (inline in component)
  - _Requirements: 1.1-1.5, 2.1-2.5_

- [x] 2. Build core components
  - [x] 2.1 Create CurriculumPoolsTab component (main container)
  - [x] 2.2 Create CreatePoolModal (select top-level type, auto-populate sub-categories)
  - [x] 2.3 Create CreditPoolCard (display pool with sub-categories)
  - [x] 2.4 Create SubCategoryPool component (credits input, course list, actions)
  - [x] 2.5 Create AttachCourseModal (select courses to attach)
  - [x] 2.6 Create PoolSummaryCard (stats overview)
  - _Requirements: 1.1-1.5, 2.1-2.5, 3.1-3.5, 4.1-4.5_

- [x] 3. Integrate into curriculum edit page
  - [x] 3.1 Replace PoolsListsTab with CurriculumPoolsTab in info_edit
  - [x] 3.2 Pass curriculum courses and course types as props
  - _Requirements: 1.1, 3.1-3.5_

- [x] 4. Remove pool creation from Config page
  - [x] 4.1 Remove Credit Pools section from info_config
  - [x] 4.2 Remove Pool Lists section from info_config
  - [x] 4.3 Add migration notice if needed
  - _Requirements: 7.1-7.4_

- [x] 5. Final integration
  - [x] 5.1 Wire up enable/disable toggle
  - [x] 5.2 Implement auto-attach functionality
  - [x] 5.3 Test complete flow
  - _Requirements: 4.1-4.5, 5.1-5.5, 6.1-6.5_

## Notes

- Focus on frontend wireframe with mock data
- Skip property-based tests for now (MVP)
- Can add tests later when backend is ready
