# Requirements Document

## Introduction

This document specifies the requirements for a redesigned Credit Pool management system. The key change is moving pool creation from the global Config page to the curriculum-specific Pool List tab. Credit pools are now created directly within each curriculum based on the course type hierarchy already assigned to that curriculum. This approach is more efficient as it eliminates the need to create pools globally and then re-apply them to curricula.

## Glossary

- **Credit_Pool**: A named container based on a top-level course category that aggregates sub-category pools with configurable credit requirements
- **Sub_Category_Pool**: A child pool within a Credit Pool representing a specific course type from the curriculum's hierarchy
- **Course_Type_Hierarchy**: A tree structure of course categories where child types inherit from parent types (e.g., Major Courses → Core CS → Electives)
- **Top_Level_Category**: The highest level course type in the hierarchy that can be selected to create a pool (e.g., "Major Courses", "General Education")
- **Curriculum_Course**: A course that has been assigned to the current curriculum with a specific course type
- **Pool_List_Tab**: The tab within curriculum edit page (`/chairperson/info_edit/[id]`) where credit pools are created and managed
- **Config_Page**: The chairperson configuration page (`/chairperson/info_config`) - pool creation will be removed from here
- **Auto_Attach**: Feature to automatically attach all courses from the curriculum that match a sub-category's course type
- **Required_Credits**: The minimum number of credits a student must complete from a sub-category pool
- **Total_Pool_Credits**: The sum of all required credits from sub-category pools, displayed next to the main pool name

## Requirements

### Requirement 1: Pool Creation Based on Curriculum Course Types

**User Story:** As a chairperson, I want to create credit pools based on the course type hierarchy already used in my curriculum, so that pools are automatically relevant to the courses I've assigned.

#### Acceptance Criteria

1. WHEN a chairperson opens the Pool List tab in curriculum edit, THE Pool_List_Tab SHALL display an "Add Pool" button to create a new credit pool
2. WHEN a chairperson clicks "Add Pool", THE Pool_List_Tab SHALL display a modal showing only top-level course categories that are used in the current curriculum
3. WHEN a chairperson selects a top-level category, THE Pool_List_Tab SHALL automatically populate the pool with all sub-categories from that hierarchy that are used in the current curriculum
4. WHEN a pool is created, THE Pool_List_Tab SHALL display the pool with the top-level category name and all its sub-category pools nested underneath
5. IF no courses in the curriculum use a particular course type hierarchy, THEN THE Pool_List_Tab SHALL not show that hierarchy as an option for pool creation

### Requirement 2: Sub-Category Credit Requirements

**User Story:** As a chairperson, I want to set required credits for each sub-category within a pool, so that I can define specific credit requirements for different course groupings.

#### Acceptance Criteria

1. WHEN a pool is created with sub-categories, THE Pool_List_Tab SHALL display each sub-category with an editable required credits field
2. WHEN a chairperson enters required credits for a sub-category, THE Pool_List_Tab SHALL validate that the value is a non-negative number
3. WHEN required credits are set for sub-categories, THE Pool_List_Tab SHALL calculate and display the total credits next to the main pool name
4. WHEN a chairperson changes a sub-category's required credits, THE Pool_List_Tab SHALL immediately update the total pool credits display
5. WHILE viewing a pool, THE Pool_List_Tab SHALL show the format "[Pool Name] (Total: X credits required)" where X is the sum of all sub-category requirements

### Requirement 3: Manual Course Attachment to Sub-Categories

**User Story:** As a chairperson, I want to manually attach courses from my curriculum to specific sub-category pools, so that I can control which courses satisfy which requirements.

#### Acceptance Criteria

1. WHEN a chairperson views a sub-category pool, THE Pool_List_Tab SHALL display an "Add Course" button
2. WHEN a chairperson clicks "Add Course", THE Pool_List_Tab SHALL display a list of curriculum courses that match the sub-category's course type
3. WHEN a chairperson selects a course to attach, THE Pool_List_Tab SHALL add the course to the sub-category pool and display it with code, name, and credits
4. WHEN a course is attached to a sub-category, THE Pool_List_Tab SHALL show the current attached credits vs required credits for that sub-category
5. IF a course is already attached to another sub-category in the same pool, THEN THE Pool_List_Tab SHALL prevent duplicate attachment and show a warning

### Requirement 4: Auto-Attach Courses Feature

**User Story:** As a chairperson, I want to automatically attach all matching courses to a sub-category pool, so that I can quickly populate pools without manual selection.

#### Acceptance Criteria

1. WHEN a chairperson views a sub-category pool, THE Pool_List_Tab SHALL display an "Auto-attach All" button
2. WHEN a chairperson clicks "Auto-attach All", THE Pool_List_Tab SHALL attach all curriculum courses that have the sub-category's course type assigned
3. WHEN auto-attach completes, THE Pool_List_Tab SHALL display a summary showing how many courses were attached
4. WHEN auto-attach is performed, THE Pool_List_Tab SHALL skip courses that are already attached to the sub-category
5. IF no matching courses exist in the curriculum for a sub-category, THEN THE Pool_List_Tab SHALL display a message indicating no courses available to attach

### Requirement 5: Pool Enable/Disable Toggle

**User Story:** As a chairperson, I want to enable or disable credit pools, so that I can control which pools are active for student progress tracking without deleting them.

#### Acceptance Criteria

1. WHEN a pool is created, THE Pool_List_Tab SHALL display an enable/disable toggle defaulting to enabled
2. WHEN a chairperson disables a pool, THE Pool_List_Tab SHALL visually indicate the disabled state (grayed out appearance)
3. WHEN a pool is disabled, THE Pool_List_Tab SHALL exclude it from credit calculations and student progress tracking
4. WHEN a chairperson enables a previously disabled pool, THE Pool_List_Tab SHALL restore it to active state and include it in calculations
5. WHILE a pool is disabled, THE Pool_List_Tab SHALL still allow editing of the pool configuration

### Requirement 6: Pool Management Operations

**User Story:** As a chairperson, I want to edit and delete credit pools, so that I can maintain and update pool configurations as curriculum requirements change.

#### Acceptance Criteria

1. WHEN a chairperson views a pool, THE Pool_List_Tab SHALL display edit and delete action buttons
2. WHEN a chairperson clicks edit on a pool, THE Pool_List_Tab SHALL allow modification of sub-category required credits and attached courses
3. WHEN a chairperson clicks delete on a pool, THE Pool_List_Tab SHALL prompt for confirmation before removing the pool
4. WHEN a pool is deleted, THE Pool_List_Tab SHALL remove all sub-category pools and course attachments associated with it
5. WHEN editing a pool, THE Pool_List_Tab SHALL allow removing individual courses from sub-category pools

### Requirement 7: Config Page Pool Section Removal

**User Story:** As a chairperson, I want the config page to no longer have pool creation functionality, so that I only manage pools within specific curricula where they are used.

#### Acceptance Criteria

1. WHEN a chairperson opens the Config page, THE Config_Page SHALL not display the Credit Pools creation section
2. WHEN a chairperson opens the Config page, THE Config_Page SHALL not display the Pool Lists creation section
3. WHEN the Config page loads, THE Config_Page SHALL retain all other existing functionality (blacklists, concentrations, course types, etc.)
4. IF legacy pools exist from the old system, THEN THE Config_Page SHALL display a migration notice directing users to manage pools in curriculum edit

### Requirement 8: Pool Credit Summary Display

**User Story:** As a chairperson, I want to see a summary of all pools and their credit status, so that I can quickly assess the curriculum's credit pool configuration.

#### Acceptance Criteria

1. WHEN viewing the Pool List tab, THE Pool_List_Tab SHALL display a summary card showing total pools, total required credits, and overall status
2. WHEN a pool has all sub-categories with attached courses meeting requirements, THE Pool_List_Tab SHALL show a "Complete" status indicator
3. WHEN a pool has sub-categories with insufficient attached courses, THE Pool_List_Tab SHALL show a "Needs Attention" status indicator
4. WHEN hovering over a pool's status indicator, THE Pool_List_Tab SHALL display a tooltip with details about which sub-categories need attention
5. WHILE viewing the summary, THE Pool_List_Tab SHALL update in real-time as pool configurations change

### Requirement 9: Course Removal from Sub-Category Pools

**User Story:** As a chairperson, I want to remove courses from sub-category pools, so that I can adjust pool configurations when curriculum changes occur.

#### Acceptance Criteria

1. WHEN viewing attached courses in a sub-category, THE Pool_List_Tab SHALL display a remove button for each course
2. WHEN a chairperson clicks remove on a course, THE Pool_List_Tab SHALL detach the course from the sub-category pool
3. WHEN a course is removed, THE Pool_List_Tab SHALL update the sub-category's attached credits display
4. WHEN a course is removed, THE Pool_List_Tab SHALL update the main pool's total credits if applicable
5. IF removing a course causes the sub-category to fall below required credits, THEN THE Pool_List_Tab SHALL display a warning indicator

