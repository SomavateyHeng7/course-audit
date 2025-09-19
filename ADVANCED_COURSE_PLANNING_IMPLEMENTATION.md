# Advanced Course Planning Implementation Plan

## Overview
Enhance the course planning system with advanced validation logic, blacklist integration, and concentration analysis. This builds upon the existing course planning functionality to provide comprehensive academic planning validation.

## 1. Advanced Course Validation Logic

### 1.1 Enhanced Prerequisite Validation
**Current State**: Basic prerequisite checking  
**Target State**: Cascading validation with automatic dependency management

#### Implementation Details:
- **Cascading Removal Logic**
  - When a planned prerequisite is removed, automatically remove all dependent courses
  - Exception: If prerequisite is marked as "completed", dependent courses remain addable
  - Show warning dialog before cascading removal with list of affected courses

- **Smart Prerequisite Checking**
  - Check if prerequisites are: `completed` OR `planned in earlier/same semester`
  - Consider course sequencing (prerequisite must be planned for earlier semester)
  - Handle complex prerequisite chains (A → B → C)

#### Files to Modify:
- `src/app/management/course-planning/page.tsx`
  - Enhance `validatePrerequisites()` function
  - Add `cascadeRemoveDependent()` function
  - Add `findDependentCourses()` utility

### 1.2 Automatic Corequisite Addition
**Target**: When adding a course with corequisites, automatically add the corequisites to the same semester

#### Implementation Details:
- **Auto-add Corequisites**
  - When Course A is added, check for corequisites
  - Automatically add corequisites to the same semester
  - Show notification: "Added corequisite XYZ to Semester N"
  - Handle corequisite chains (if A requires B, and B requires C)

- **Corequisite Removal**
  - When removing a course, check if any corequisites become orphaned
  - Prompt user to remove orphaned corequisites or keep them

#### Files to Modify:
- `src/app/management/course-planning/page.tsx`
  - Enhance `addCourseToPlan()` function
  - Add `addCorequisites()` function
  - Add corequisite notification system

### 1.3 Banned Combination Prevention
**Target**: Prevent students from adding courses that are mutually exclusive

#### Implementation Details:
- **Blacklist Validation**
  - Check against `bannedCombinations` table when adding courses
  - Show error: "Cannot add XYZ - conflicts with completed/planned course ABC"
  - Bidirectional checking (A blocks B, B blocks A)

- **Visual Indicators**
  - Gray out unavailable courses in the course list
  - Show banned reason in tooltip/description
  - Add "Blocked by: [Course Name]" indicator

#### Database Integration:
- Query `bannedCombinations` table through existing API
- Cache banned combinations for performance

## 2. Blacklist Integration

### 2.1 Blacklist Validation Service
**Target**: Real-time validation against banned course combinations

#### API Enhancement:
- **Update `/api/available-courses`**
  - Include `bannedCombinations` data in response
  - Filter out courses that conflict with completed/planned courses
  - Add `blockingCourse` field to indicate which course is causing the block

#### Client-Side Validation:
- **Course Addition Validation**
  - Check against banned combinations before allowing course addition
  - Show clear error messages with blocking course information
  - Provide alternative course suggestions when available

#### Files to Modify:
- `src/app/api/available-courses/route.ts`
  - Add banned combinations query
  - Add conflict checking logic
- `src/app/management/course-planning/page.tsx`
  - Add blacklist validation to `addCourseToPlan()`
  - Add visual indicators for blocked courses

### 2.2 Dynamic Course Filtering
**Target**: Dynamically filter available courses based on current plan and completed courses

#### Implementation:
- Real-time filtering of course list based on:
  - Completed courses (from data entry)
  - Currently planned courses
  - Banned combinations
  - Prerequisite requirements

## 3. Concentration Analysis

### 3.1 Post-Save Concentration Analysis
**Target**: After clicking "Save Course Plan", show concentration progress analysis

#### Implementation Details:
- **Analysis Trigger**
  - Triggered after successful course plan save
  - Analyze against all available concentrations for the curriculum
  - Calculate progress toward each concentration

- **Concentration Progress Calculation**
  - Count completed + planned courses toward each concentration
  - Show: "Progress: X/Y courses completed for [Concentration Name]"
  - Highlight concentrations that are achievable with current plan

- **Analysis Display**
  - Modal/panel showing concentration analysis
  - Progress bars for each concentration
  - Recommendations for completing concentrations
  - "Courses needed" suggestions

#### Files to Modify:
- `src/app/management/course-planning/page.tsx`
  - Enhance `saveCoursePlan()` function
  - Add concentration analysis modal
- Create: `src/components/course-planning/ConcentrationAnalysis.tsx`
  - Concentration progress component
  - Recommendation system

### 3.2 Concentration Data Integration
**Target**: Integrate with existing concentration/elective rules system

#### Database Queries:
- Query curriculum concentrations and requirements
- Calculate course coverage for each concentration
- Identify gaps and recommendations

#### API Enhancement:
- **New endpoint**: `/api/concentration-analysis`
  - Input: curriculum ID, completed courses, planned courses
  - Output: concentration progress analysis
  - Recommendations for completing concentrations

## 4. User Experience Enhancements

### 4.1 Advanced Notifications
- **Toast Notifications** for:
  - Automatic corequisite additions
  - Cascading prerequisite removals
  - Blocked course attempts
  - Concentration progress updates

### 4.2 Smart Course Recommendations
- **Prerequisite Suggestions**: Show courses that would unlock more options
- **Concentration Completion**: Suggest courses to complete specific concentrations
- **Optimal Sequencing**: Recommend semester ordering for course plans

### 4.3 Validation Summary
- **Plan Validation Panel**: Real-time summary of plan validity
  - Prerequisites status
  - Banned combination conflicts
  - Credit requirements
  - Concentration progress

## 5. Implementation Priority

### Phase 1: Core Validation Logic
1. Enhanced prerequisite validation with cascading removal
2. Automatic corequisite addition
3. Basic blacklist integration

### Phase 2: Advanced Features
1. Concentration analysis system
2. Smart course recommendations
3. Advanced notification system

### Phase 3: UX Enhancements
1. Visual indicators and tooltips
2. Comprehensive validation summary
3. Optimal course sequencing suggestions

## 6. Technical Considerations

### Performance:
- Cache banned combinations and prerequisite data
- Optimize concentration analysis calculations
- Debounce real-time validation

### Error Handling:
- Graceful degradation when APIs fail
- Clear error messages for complex validation failures
- Fallback options for blocked courses

### Data Consistency:
- Ensure validation logic matches backend business rules
- Sync frontend validation with database constraints
- Handle edge cases in complex course relationships

This implementation will transform the course planning system into a comprehensive academic planning tool that actively guides students toward successful degree completion while preventing academic policy violations.