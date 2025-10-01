# Student Audit System Enhancement Plan

## Overview
This document outlines the implementation plan for enhancing the student audit system to handle curriculum constraints, elective rules, unmatched courses, and comprehensive course planning validation.

## Current State Analysis

### What's Working (✅)
- **Course Matching**: 22 courses successfully matched from CSV to curriculum
- **Grade Import**: Student grades and completion status imported correctly
- **Basic Categorization**: Courses categorized by department course types (General Education, Core, Major, etc.)
- **CSV Parsing**: Robust parsing with support for various formats

### Identified Gaps (❌)
1. **Unmatched Courses**: No handling for courses not in curriculum
2. **Constraints Validation**: No validation of prerequisites, corequisites, banned combinations
3. **Elective Rules**: No processing of elective credit requirements
4. **Course Planning**: No validation for "taking" or "will-be-taken" courses
5. **Free Elective Management**: No tracking of free elective credits vs. requirements

## Implementation Plan

### Phase 1: Unmatched Courses & Free Elective Management

#### 1.1 Unmatched Course Handling
**Components to Create/Modify:**
- `UnmatchedCoursesSection.tsx` - Display unmatched courses
- `FreeElectiveManager.tsx` - Handle free elective assignment
- Modify `StudentTranscriptImport.tsx` - Add unmatched course processing

**Features:**
- Display courses that don't match curriculum in separate section
- Allow manual assignment to "Free Elective" category
- Show credit calculations for free electives
- Warn when free elective credits are exceeded/insufficient

**Database Schema:**
```sql
-- Add to existing StudentCourse model
ALTER TABLE student_courses ADD COLUMN is_free_elective BOOLEAN DEFAULT FALSE;
ALTER TABLE student_courses ADD COLUMN manual_assignment BOOLEAN DEFAULT FALSE;
```

#### 1.2 Free Elective Credit Tracking
**Logic Required:**
- Fetch free elective requirements from `ElectiveRule` table
- Calculate current free elective credits
- Display remaining/excess credits
- Validate against curriculum requirements

### Phase 2: Course Status Management Enhancement

#### 2.1 Simplified Status System for Data Entry Page
**Current Issue:** Too many status options causing confusion
**Solution:** Restrict data entry page to completion tracking only

**Status Options for Data Entry Page:**
- `completed` - Course finished with grade
- `failed` - Course attempted but failed
- `withdrawn` - Course dropped/withdrawn
- Remove: `taking`, `will-be-taken`, `planning` from this page

#### 2.2 Separate Course Planning Page
**New Page:** `/student/course-planning` or `/student/degree-planning`
**Purpose:** Handle future course selection and validation

**Features:**
- Course search and selection
- Constraint validation (prerequisites, corequisites, banned combinations)
- Semester planning
- Status options: `planning`, `will-take`, `considering`

### Phase 3: Constraint Validation System

#### 3.1 Prerequisite Validation
**Components:**
- `PrerequisiteValidator.tsx`
- `ConstraintDisplay.tsx`

**Validation Logic:**
```typescript
interface PrerequisiteValidation {
  courseCode: string;
  prerequisites: {
    required: string[];
    alternatives: string[][]; // OR groups
    completed: string[];
    missing: string[];
    satisfied: boolean;
  };
}
```

#### 3.2 Corequisite Validation
**Logic:**
- Check if corequisites are taken in same semester or completed
- Display warnings for unsatisfied corequisites
- Allow override with advisor approval flag

#### 3.3 Banned Combination Detection
**Features:**
- Check against `Blacklist` and `BlacklistCourse` tables
- Display warnings when banned combinations are selected
- Prevent submission until resolved

### Phase 4: Elective Rules Processing

#### 4.1 Category Credit Validation
**Data Source:** `ElectiveRule` table
**Features:**
- Calculate credits per elective category
- Display progress bars for each category
- Warn when requirements not met

#### 4.2 Elective Course Recommendations
**Features:**
- Suggest courses that fulfill remaining elective requirements
- Filter by department/level/prerequisites
- Show multiple pathways to completion

### Phase 5: Advanced Features (Future)

#### 5.1 Concentration Support
**Tables:** `Concentration`, `ConcentrationCourse`, `CurriculumConcentration`
**Features:**
- Allow concentration selection
- Validate concentration-specific requirements
- Display concentration progress

#### 5.2 Blacklist Integration
**Tables:** `Blacklist`, `BlacklistCourse`, `CurriculumBlacklist`
**Features:**
- Enforce blacklist rules
- Display alternative course suggestions
- Handle department-specific blacklists

## File Structure Plan

```
src/
├── components/student/
│   ├── StudentTranscriptImport.tsx (existing - enhance)
│   ├── UnmatchedCoursesSection.tsx (new)
│   ├── FreeElectiveManager.tsx (new)
│   ├── CourseConstraintValidator.tsx (new)
│   ├── ElectiveRulesDisplay.tsx (new)
│   └── CoursePlanningInterface.tsx (new)
├── app/student/
│   ├── data-entry/page.tsx (existing - simplify)
│   └── course-planning/page.tsx (new)
├── lib/
│   ├── constraintValidation.ts (new)
│   ├── electiveRulesEngine.ts (new)
│   └── coursePlanningUtils.ts (new)
└── api/
    ├── student-constraints/route.ts (new)
    ├── elective-rules/route.ts (new)
    └── course-validation/route.ts (new)
```

## API Endpoints Required

### Constraint Validation
```
GET /api/student-constraints?curriculumId=xxx&studentId=xxx
POST /api/validate-course-selection
```

### Elective Rules
```
GET /api/elective-rules?curriculumId=xxx
POST /api/calculate-elective-progress
```

### Course Planning
```
GET /api/available-courses?curriculumId=xxx&semester=xxx
POST /api/validate-course-plan
```

## Database Schema Enhancements

### New Fields for StudentCourse
```sql
ALTER TABLE student_courses ADD COLUMN is_free_elective BOOLEAN DEFAULT FALSE;
ALTER TABLE student_courses ADD COLUMN manual_assignment BOOLEAN DEFAULT FALSE;
ALTER TABLE student_courses ADD COLUMN planned_semester STRING;
ALTER TABLE student_courses ADD COLUMN planned_year INT;
ALTER TABLE student_courses ADD COLUMN validation_status STRING; -- 'valid', 'warning', 'error'
ALTER TABLE student_courses ADD COLUMN validation_notes TEXT;
```

### New Tables (if needed)
```sql
-- Course Planning Sessions
CREATE TABLE course_planning_sessions (
  id STRING PRIMARY KEY,
  student_id STRING,
  curriculum_id STRING,
  semester_plan JSON,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## Implementation Priority

### High Priority (Immediate)
1. **Unmatched Courses Display** - Critical for transcript import completeness
2. **Free Elective Management** - Essential for accurate credit tracking
3. **Simplified Data Entry** - Remove confusion from current interface

### Medium Priority (Next Sprint)
1. **Course Planning Page** - Separate complex planning from simple data entry
2. **Basic Constraint Validation** - Prerequisites and corequisites
3. **Elective Rules Display** - Show progress toward requirements

### Low Priority (Future Iterations)
1. **Advanced Constraint Validation** - Banned combinations, special flags
2. **Concentration Support** - Department-specific programs
3. **Blacklist Integration** - Advanced rule enforcement

## Technical Considerations

### Performance
- Cache curriculum data and constraints
- Implement lazy loading for large course lists
- Use React Query for API state management

### User Experience
- Progressive disclosure of complex information
- Clear visual indicators for validation status
- Contextual help and tooltips

### Data Integrity
- Validate all constraint rules server-side
- Maintain audit trail for manual overrides
- Implement proper error handling and rollback

### Security
- Ensure students can only access their own data
- Validate curriculum access permissions
- Implement proper session management

## Success Criteria

### Phase 1 Success Metrics
- [ ] All unmatched courses displayed with assignment options
- [ ] Free elective credits accurately calculated and displayed
- [ ] Students can manually assign courses to free electives
- [ ] Credit warnings displayed when limits exceeded

### Phase 2 Success Metrics
- [ ] Data entry page simplified to completion tracking only
- [ ] Course planning page created with future course selection
- [ ] Clear separation between completed and planned courses

### Phase 3 Success Metrics
- [ ] Prerequisites validated before course selection
- [ ] Corequisites checked and warnings displayed
- [ ] Banned combinations prevented with clear messaging

## Risk Assessment

### High Risk
- **Complexity Creep**: Feature scope expanding beyond user needs
- **Performance Issues**: Large curriculum data affecting load times
- **Data Migration**: Existing student records may need updates

### Medium Risk
- **User Adoption**: New interface patterns requiring training
- **Integration Complexity**: Multiple validation systems interacting

### Low Risk
- **Browser Compatibility**: Modern React features may need polyfills
- **Mobile Responsiveness**: Complex interfaces on small screens

## Next Steps

1. **Review and Approval**: Get stakeholder sign-off on this plan
2. **Bug Fixing**: Address current system issues before enhancement
3. **Phase 1 Implementation**: Start with unmatched courses and free electives
4. **User Testing**: Validate each phase with actual student workflows
5. **Documentation**: Create user guides for new features

---

*This plan serves as a living document and should be updated as requirements evolve and implementation progresses.*