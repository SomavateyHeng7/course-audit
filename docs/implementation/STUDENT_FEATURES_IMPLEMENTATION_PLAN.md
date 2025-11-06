# Student Features Implementation Plan

**Date:** October 4, 2025  
**Target:** Student-side features for data-entry, course-planning, and progress pages  
**Status:** Planning Phase

---

## Executive Summary

This document outlines the implementation plan for completing critical student-facing features across three main pages: data-entry, course-planning, and progress. The implementation focuses on elective rules validation, course constraints checking, summer session support, and localStorage data consistency.

---

## Current State Analysis

### 1. **Data Entry Page** (`src/app/management/data-entry/page.tsx`)

#### ✅ **Implemented Features:**
- Course status tracking (completed, failed, withdrawn, planning, not_completed)
- CSV/Excel transcript import
- Free elective management
- Unmatched courses handling
- localStorage persistence for `studentAuditData`
- Department/curriculum/concentration selection
- Grade entry for completed courses

#### ❌ **Missing Features:**
- No validation against elective rules when adding courses
- No visual feedback for constraint violations
- Summer session courses not specially marked or filtered
- No real-time constraint checking when changing course statuses

#### 📊 **Data Structure:**
```typescript
{
  selectedDepartment: string;
  selectedCurriculum: string;
  selectedConcentration: string;
  completedCourses: {
    [code: string]: {
      status: 'completed' | 'failed' | 'withdrawn' | 'planning' | 'not_completed';
      grade?: string;
      // Missing: title, credits, category
    }
  };
  freeElectives: Array<{code: string; title: string; credits: number}>;
  actualDepartmentId?: string;
}
```

---

### 2. **Course Planning Page** (`src/app/management/course-planning/page.tsx`)

#### ✅ **Implemented Features:**
- Available courses fetching from curriculum
- Prerequisite validation
- Corequisite auto-addition
- Banned combinations checking (blacklist)
- Semester/year selection for planned courses
- Auto-sync of planning courses from data-entry
- Course plan localStorage persistence
- Concentration progress tracking

#### ❌ **Missing Features:**
- **No elective rules validation** - Cannot check if elective credit requirements are met
- **No course flags checking** (requiresPermission, summerOnly, requiresSeniorStanding)
- **Summer session filtering** - No way to filter/show only summer courses
- Semester dropdown only shows "Semester" (removed Semester 1/2 and Summer Session)
- No visual indicators for courses requiring special permissions
- No senior standing validation (min credit threshold)
- Limited constraint checking beyond prerequisites/banned combinations

#### 📊 **Data Structure:**
```typescript
interface AvailableCourse {
  code: string;
  title: string;
  credits: number;
  description?: string;
  prerequisites?: string[];
  corequisites?: string[];
  bannedWith?: string[];
  category: string;
  level: number;
  // Missing: summerOnly, requiresPermission, requiresSeniorStanding, minCreditThreshold
}
```

---

### 3. **Progress Page** (`src/app/management/progress/page.tsx`)

#### ✅ **Implemented Features:**
- localStorage data loading from `studentAuditData`, `coursePlan`, `concentrationAnalysis`
- Curriculum data fetching
- Blacklist warnings display
- Enhanced validation using `courseValidation.ts`
- Donut chart progress visualization
- Category-based progress tracking
- PDF/Excel export functionality
- Concentration progress analysis

#### ⚠️ **Partial Implementation:**
- Elective progress tracking exists but may not reflect actual elective rules
- Completed courses display works but doesn't validate against all constraints

#### ❌ **Missing Features:**
- **Elective rules validation incomplete** - Not properly checking against curriculum's elective rules
- No visual distinction between different elective categories (Major Elective vs Free Elective)
- Summer session courses not specially marked
- Course flags not displayed or validated
- Missing real-time validation feedback when data changes

---

## Implementation Requirements

### **Requirement 1: Elective Rules Implementation**

#### **Objective:**
Implement full elective rules validation across all three pages

#### **Tasks:**

##### **1.1 API Enhancement** (`src/app/api/available-courses/route.ts`)
- [x] Include `summerOnly` flag in course data
- [x] Include `requiresPermission` flag
- [x] Include `requiresSeniorStanding` flag
- [x] Include `minCreditThreshold` value
- [x] Fetch and include elective rules from curriculum
- [x] Return elective rules with course data

##### **1.2 Update AvailableCourse Interface**
```typescript
interface AvailableCourse {
  code: string;
  title: string;
  credits: number;
  description?: string;
  prerequisites?: string[];
  corequisites?: string[];
  bannedWith?: string[];
  category: string;
  level: number;
  // New fields:
  summerOnly: boolean;
  requiresPermission: boolean;
  requiresSeniorStanding: boolean;
  minCreditThreshold?: number;
}
```

##### **1.3 Course Planning Page - Elective Rules Validation**
- [x] Fetch elective rules from API
- [x] Display elective credit requirements in UI
- [x] Calculate current elective credits (completed + planned)
- [x] Show progress bars for each elective category
- [x] Validate when adding courses that elective requirements won't be exceeded
- [x] Display warnings when elective requirements are not met

##### **1.4 Progress Page - Elective Rules Display**
- [x] Fetch elective rules for the curriculum
- [x] Calculate elective progress correctly
- [x] Display elective requirements vs completed
- [x] Show breakdown by elective category (Major Elective, Free Elective, etc.)
- [x] Validate against elective credit requirements

---

### **Requirement 2: Course Flags & Special Requirements**

#### **Objective:**
Implement course flags checking and display throughout the system

#### **Tasks:**

##### **2.1 Course Planning Page - Flags Display**
- [x] Add "Course Flags & Special Requirements" section to UI
- [x] Display badges for courses with special requirements:
  - 🔒 Requires Permission
  - ☀️ Summer Only
  - 🎓 Senior Standing Required
- [x] Show minimum credit threshold for senior standing courses
- [x] Filter out courses that don't meet requirements when browsing

##### **2.2 Course Planning Page - Validation Logic**
```typescript
// Pseudo-code for validation
function validateCourseFlags(course: AvailableCourse, studentData: StudentData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check summer only flag
  if (course.summerOnly && selectedSemester !== 'summer') {
    errors.push(`${course.code} can only be taken during summer session`);
  }
  
  // Check senior standing
  if (course.requiresSeniorStanding) {
    const totalCredits = calculateTotalCredits(studentData);
    if (totalCredits < (course.minCreditThreshold || 90)) {
      warnings.push(`${course.code} requires ${course.minCreditThreshold || 90} credits (Senior Standing)`);
    }
  }
  
  // Check permission requirement
  if (course.requiresPermission) {
    warnings.push(`${course.code} requires chairperson permission to enroll`);
  }
  
  return { errors, warnings };
}
```

##### **2.3 Data Entry Page - Flags Display**
- [x] Show course flags when displaying completed courses
- [x] Add tooltips explaining what each flag means
- [x] Validate imported transcripts against flags

##### **2.4 Progress Page - Flags Summary**
- [x] Show list of flagged courses in completed/planned sections
- [x] Display warnings for permission-required courses
- [x] Highlight summer-only courses in separate section

---

### **Requirement 3: Summer Session Support**

#### **Objective:**
Full support for summer session courses with proper filtering and display

#### **Tasks:**

##### **3.1 Update Semester Dropdown**
```typescript
const semesterOptions = [
  { value: '1', label: 'Semester' },
  { value: 'summer', label: 'Summer Session' },
];
```

##### **3.2 Course Planning Page - Summer Session Logic**
- [x] Add "Summer Session" back to semester dropdown
- [x] When "Summer Session" is selected:
  - Filter available courses to show:
    - All courses with `summerOnly: true`
    - All courses with `summerOnly: false` (can be taken anytime)
  - Hide courses that cannot be taken in summer (if such flag exists)
- [x] Visual indicator (☀️) for summer-only courses
- [x] Separate section showing "Available for Summer"

##### **3.3 Data Entry Page - Summer Session**
- [x] Allow marking courses as "Taken in Summer"
- [x] Import logic should detect summer courses from transcript
- [x] Display summer badge next to summer courses

##### **3.4 Progress Page - Summer Session**
- [x] Show summer courses in separate section
- [x] Calculate summer credit progress if curriculum has summer requirements
- [x] Display summer session timeline in progress chart

---

### **Requirement 4: Constraints & Validation**

#### **Objective:**
Comprehensive constraint checking across all pages

#### **Tasks:**

##### **4.1 Course Validation Service** (`src/lib/courseValidation.ts`)
- [x] Already has `validateStudentProgress` function
- [x] Enhance to include all constraint types:
  - ✅ Prerequisites (done)
  - ✅ Corequisites (done)
  - ✅ Banned combinations (done)
  - ❌ Elective rules (needs enhancement)
  - ❌ Course flags (needs implementation)
  - ❌ Senior standing (needs implementation)

##### **4.2 Integration Points**

**Data Entry Page:**
```typescript
// When course status changes
const handleStatusChange = async (courseCode: string, newStatus: string) => {
  // Update status
  setCompletedCourses(prev => ({
    ...prev,
    [courseCode]: { ...prev[courseCode], status: newStatus }
  }));
  
  // Run validation
  const validation = await validateStudentProgress(
    getAllCourses(),
    selectedCurriculum,
    actualDepartmentId
  );
  
  // Show warnings/errors
  displayValidationResults(validation);
};
```

**Course Planning Page:**
```typescript
// When adding a course to plan
const addCourseToPlan = async (course: AvailableCourse) => {
  // Existing validations...
  
  // Add new validations
  const flagValidation = validateCourseFlags(course, getStudentData());
  if (flagValidation.errors.length > 0) {
    alert(flagValidation.errors.join('\n'));
    return;
  }
  
  if (flagValidation.warnings.length > 0) {
    const confirmed = confirm(
      `Warning:\n${flagValidation.warnings.join('\n')}\n\nAdd course anyway?`
    );
    if (!confirmed) return;
  }
  
  // Add course...
};
```

**Progress Page:**
```typescript
// On page load / data change
useEffect(() => {
  const runValidation = async () => {
    const validation = await validateStudentProgress(
      getAllCourses(),
      selectedCurriculum,
      actualDepartmentId
    );
    
    setValidationResult(validation);
    
    // Display errors/warnings in UI
    setErrors(validation.errors);
    setWarnings(validation.warnings);
  };
  
  if (completedData.selectedCurriculum) {
    runValidation();
  }
}, [completedData, plannedCourses]);
```

---

### **Requirement 5: LocalStorage Data Consistency**

#### **Objective:**
Ensure data consistency and proper loading across all pages

#### **Tasks:**

##### **5.1 Standardize Data Structure**

**studentAuditData:**
```typescript
interface StudentAuditData {
  selectedDepartment: string;
  selectedCurriculum: string;
  selectedConcentration: string;
  completedCourses: {
    [code: string]: {
      status: 'completed' | 'failed' | 'withdrawn' | 'planning' | 'not_completed';
      grade?: string;
      title: string;          // Add
      credits: number;        // Add
      category?: string;      // Add
    }
  };
  freeElectives: Array<{
    code: string;
    title: string;
    credits: number;
    category: string;        // Add
  }>;
  actualDepartmentId?: string;
  lastUpdated: number;      // Add timestamp
}
```

**coursePlan:**
```typescript
interface CoursePlan {
  curriculumId: string;
  departmentId: string;
  plannedCourses: PlannedCourse[];
  lastUpdated: number;      // Add timestamp
}
```

##### **5.2 Data Loading Enhancement**

**Data Entry Page:**
- [x] Save complete course data (title, credits, category) not just status
- [x] Add timestamp to track when data was last saved
- [x] Validate data structure before saving

**Course Planning Page:**
- [x] Load and validate studentAuditData before proceeding
- [x] Check timestamp to ensure fresh data
- [x] Handle missing or corrupted data gracefully
- [x] Merge planning courses from data-entry correctly

**Progress Page:**
- [x] Consolidate data loading from all localStorage keys
- [x] Validate data consistency across sources
- [x] Handle missing data scenarios
- [x] Display data freshness indicators

##### **5.3 Data Synchronization**
```typescript
// Utility function for data sync
function syncStudentData() {
  const auditData = loadFromLocalStorage('studentAuditData');
  const coursePlan = loadFromLocalStorage('coursePlan');
  const concentrationAnalysis = loadFromLocalStorage('concentrationAnalysis');
  
  // Validate consistency
  if (coursePlan && auditData.selectedCurriculum !== coursePlan.curriculumId) {
    console.warn('Curriculum mismatch between audit data and course plan');
    // Handle mismatch...
  }
  
  // Merge planning courses
  const planningCourses = Object.keys(auditData.completedCourses)
    .filter(code => auditData.completedCourses[code].status === 'planning')
    .map(code => ({
      code,
      ...auditData.completedCourses[code]
    }));
  
  // Sync to course plan
  // ...
}
```

---

## Implementation Priority

### **Phase 1: Critical (Week 1)**
1. **API Enhancement** - Add course flags to available-courses endpoint
2. **Course Flags Display** - Show flags in course planning page
3. **Summer Session Support** - Re-add summer session dropdown and filtering
4. **LocalStorage Data Fix** - Ensure completedCourses store full data

### **Phase 2: Important (Week 2)**
5. **Elective Rules Validation** - Implement in course planning
6. **Constraint Checking** - Enhance validation in all pages
7. **Progress Page Fixes** - Ensure completed courses display correctly

### **Phase 3: Polish (Week 3)**
8. **UI Enhancements** - Better visualization of constraints and requirements
9. **Error Messages** - Improve validation feedback
10. **Testing & Bug Fixes** - Comprehensive testing

---

## Testing Checklist

### **Data Entry Page**
- [ ] Import transcript with summer courses
- [ ] Change course status and verify validation
- [ ] Add free electives with different categories
- [ ] Verify localStorage saves complete data
- [ ] Check data persists after page refresh

### **Course Planning Page**
- [ ] Select "Summer Session" and verify filtering
- [ ] Try to add summer-only course in regular semester (should warn)
- [ ] Try to add course requiring permission (should warn)
- [ ] Try to add course requiring senior standing without enough credits (should warn)
- [ ] Verify elective credit tracking works
- [ ] Check banned combinations validation
- [ ] Verify planning courses sync from data-entry

### **Progress Page**
- [ ] Verify all completed courses display correctly
- [ ] Check elective progress shows accurate numbers
- [ ] Verify summer courses are marked/separated
- [ ] Check flagged courses are highlighted
- [ ] Verify PDF/Excel export includes all data
- [ ] Test with missing/incomplete localStorage data

---

## Technical Notes

### **Database Schema Verification**
Verify these fields exist in Course model:
```prisma
model Course {
  // ...existing fields
  summerOnly             Boolean   @default(false)
  requiresPermission     Boolean   @default(false)
  requiresSeniorStanding Boolean   @default(false)
  minCreditThreshold     Int?
}
```

### **API Endpoints to Modify**
1. `/api/available-courses` - Add course flags
2. `/api/curricula/[id]/elective-rules` - Ensure elective rules are returned
3. `/api/public-curricula` - Include elective rules in response

### **Utility Functions Needed**
```typescript
// Calculate total credits for senior standing check
function calculateTotalCredits(studentData: StudentAuditData): number {
  // Sum completed + in progress credits
}

// Check if student meets senior standing
function hasSeniorStanding(studentData: StudentAuditData, threshold: number = 90): boolean {
  return calculateTotalCredits(studentData) >= threshold;
}

// Filter courses by summer availability
function filterBySemester(courses: AvailableCourse[], semester: string): AvailableCourse[] {
  if (semester === 'summer') {
    // Return all summer-only + courses without semester restriction
    return courses.filter(c => c.summerOnly || !c.summerOnly);
  }
  // For regular semester, exclude summer-only courses
  return courses.filter(c => !c.summerOnly);
}
```

---

## Success Criteria

✅ **Complete when:**
1. Elective rules are properly validated in course planning page
2. Course flags (permission, summer, senior standing) are checked and displayed
3. Summer session dropdown works with proper course filtering
4. Completed courses display correctly in progress page with all details
5. LocalStorage data is consistent and complete across all pages
6. All validation checks run in real-time with user-friendly feedback
7. All tests pass successfully

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| API changes break existing functionality | High | Implement with backward compatibility, test thoroughly |
| LocalStorage data corruption | Medium | Add data validation and recovery mechanisms |
| Performance issues with real-time validation | Low | Debounce validation calls, use efficient algorithms |
| Complex elective rules not fully captured | Medium | Start with common cases, iterate based on feedback |

---

## Next Steps

1. Review this plan with the team
2. Set up development environment
3. Create feature branch: `feature/student-enhancements`
4. Begin Phase 1 implementation
5. Create pull requests for each major feature
6. Conduct code reviews
7. Test thoroughly
8. Deploy to staging
9. User acceptance testing
10. Production deployment

---

**Document Version:** 1.0  
**Last Updated:** October 4, 2025  
**Status:** Approved for Implementation
