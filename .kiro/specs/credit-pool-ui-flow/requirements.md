# Requirements Document

## Introduction

This document specifies the requirements for improving the UI flow of the Credit Pool and Pool List management features in the Chairperson side of the course audit system. The feature enables chairpersons to create and manage credit pools at the faculty/department level (via the Config page), and then apply these pools to individual curricula with curriculum-specific credit requirements (via the info_edit page). This is a frontend-only implementation using mock data to demonstrate the user flow before backend integration.

## Glossary

- **Credit_Pool**: A named container that aggregates courses from one or more sources (course types or course lists) with configurable minimum and maximum credit requirements
- **Pool_List**: A reusable collection of courses that can be attached to credit pools as a source
- **Course_Type_Hierarchy**: A tree structure of course categories where child types inherit from parent types (e.g., GE → HUMAN/LANGUAGE)
- **Curriculum_Pool_Attachment**: The binding of a credit pool to a specific curriculum with curriculum-specific credit requirements
- **Config_Page**: The chairperson configuration page (`/chairperson/info_config`) where faculty-wide settings are managed
- **Info_Edit_Page**: The curriculum editing page (`/chairperson/info_edit/[id]`) where curriculum-specific settings are configured
- **Mock_Data**: Placeholder data used to demonstrate UI functionality before backend APIs are available
- **Pool_Source**: A course type node or course list that feeds courses into a credit pool

## Requirements

### Requirement 1: Credit Pool Creation in Config Page

**User Story:** As a chairperson, I want to create credit pools with defined credit requirements and sources, so that I can establish reusable credit groupings for my department's curricula.

#### Acceptance Criteria

1. WHEN a chairperson clicks "Add Pool" in the Pools & Lists section, THE Config_Page SHALL display a modal with fields for pool name, description, minimum credits, maximum credits (optional), and source selection
2. WHEN a chairperson selects sources for a pool, THE Config_Page SHALL allow selection of multiple course type nodes and/or pool lists as sources
3. WHEN a chairperson saves a new pool, THE Config_Page SHALL add the pool to the pools list with a visual card showing name, credit range, and source count
4. WHEN a chairperson views the pools list, THE Config_Page SHALL display each pool with drag handles for reordering (determining evaluation priority)
5. IF a chairperson attempts to save a pool without a name, THEN THE Config_Page SHALL display a validation error and prevent saving

### Requirement 2: Pool List Management in Config Page

**User Story:** As a chairperson, I want to create and manage pool lists (reusable course collections), so that I can define course groupings that can be attached to multiple credit pools.

#### Acceptance Criteria

1. WHEN a chairperson clicks "Add Pool List" in the Pools & Lists section, THE Config_Page SHALL display a modal for creating a new pool list with name and course selection
2. WHEN a chairperson uploads a CSV/XLSX file for a pool list, THE Config_Page SHALL parse the file and display a summary of courses to be added
3. WHEN a chairperson searches for courses to add to a pool list, THE Config_Page SHALL display matching courses from the database with code, title, and credits
4. WHEN a chairperson saves a pool list, THE Config_Page SHALL display the list in the Pool Lists section with course count badge
5. WHEN a chairperson edits a pool list, THE Config_Page SHALL allow adding/removing courses and updating the list name

### Requirement 3: Credit Pool Application to Curriculum

**User Story:** As a chairperson, I want to attach credit pools to a specific curriculum with custom credit requirements, so that each curriculum can have unique credit allocations per pool.

#### Acceptance Criteria

1. WHEN a chairperson opens the Pools & Lists tab in curriculum edit, THE Info_Edit_Page SHALL display available pools from the department with their default credit ranges
2. WHEN a chairperson attaches a pool to the curriculum, THE Info_Edit_Page SHALL prompt for curriculum-specific required credits and optional max credits
3. WHEN a chairperson views attached pools, THE Info_Edit_Page SHALL display each pool with its curriculum-specific credit requirements and current credit totals from matched courses
4. WHEN a chairperson reorders attached pools, THE Info_Edit_Page SHALL update the evaluation priority (drag-to-reorder)
5. WHEN a chairperson detaches a pool from the curriculum, THE Info_Edit_Page SHALL remove the pool attachment after confirmation

### Requirement 4: Pool Credit Preview and Validation

**User Story:** As a chairperson, I want to see a live preview of how credit pools are satisfied by curriculum courses, so that I can validate pool configurations before publishing.

#### Acceptance Criteria

1. WHEN a chairperson views the Pools & Lists tab, THE Info_Edit_Page SHALL display a credit breakdown showing required vs applied credits per pool
2. WHEN curriculum courses match pool sources, THE Info_Edit_Page SHALL calculate and display the applied credits for each pool
3. WHEN a pool's applied credits are below the required minimum, THE Info_Edit_Page SHALL highlight the pool with a warning indicator
4. WHEN a pool's applied credits exceed the maximum, THE Info_Edit_Page SHALL show overflow credits that would route to Free Elective
5. WHILE viewing pool credit preview, THE Info_Edit_Page SHALL update calculations in real-time as pool attachments change

### Requirement 5: Mock Data Integration for UI Development

**User Story:** As a developer, I want the UI to function with mock data, so that the user flow can be demonstrated and tested before backend APIs are available.

#### Acceptance Criteria

1. WHEN the backend API is unavailable, THE System SHALL use mock data for credit pools, pool lists, and pool attachments
2. WHEN mock data is active, THE System SHALL display a visual indicator (banner or badge) showing "Demo Mode"
3. WHEN a chairperson performs CRUD operations in demo mode, THE System SHALL update local state to simulate the operation
4. WHEN the page is refreshed in demo mode, THE System SHALL restore mock data to initial state
5. WHEN backend APIs become available, THE System SHALL seamlessly switch from mock data to live data based on feature flags

### Requirement 6: Course Type Hierarchy Display Enhancement

**User Story:** As a chairperson, I want to see the course type hierarchy clearly when selecting pool sources, so that I can understand the parent-child relationships and select appropriate nodes.

#### Acceptance Criteria

1. WHEN a chairperson selects course type sources for a pool, THE Config_Page SHALL display the hierarchy as an indented tree with expand/collapse controls
2. WHEN a parent course type is selected, THE Config_Page SHALL indicate that child types are implicitly included
3. WHEN displaying course type nodes, THE Config_Page SHALL show the color badge and usage count for each node
4. WHEN the hierarchy has more than 3 levels, THE Config_Page SHALL provide a search/filter option to find specific types
5. WHILE selecting sources, THE Config_Page SHALL show breadcrumb paths for selected nodes (e.g., "GE › HUMAN")

### Requirement 7: Pool Evaluation Order Management

**User Story:** As a chairperson, I want to control the order in which pools are evaluated, so that I can ensure courses are allocated to the correct pools when there are overlapping sources.

#### Acceptance Criteria

1. WHEN multiple pools are attached to a curriculum, THE Info_Edit_Page SHALL display them in evaluation order with numbered positions
2. WHEN a chairperson drags a pool to a new position, THE Info_Edit_Page SHALL update the evaluation order for all affected pools
3. WHEN pools have overlapping sources, THE Info_Edit_Page SHALL display a warning icon with tooltip explaining the overlap
4. WHEN viewing pool order, THE Info_Edit_Page SHALL show a visual flow diagram indicating how courses flow through pools
5. IF no explicit order is set, THEN THE Info_Edit_Page SHALL default to alphabetical ordering by pool name
