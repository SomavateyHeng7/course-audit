# Department-Specific Course Types Implementation Plan

## Overview
Implement department-scoped course types and course categorization system to replace the current global course category system.

## Problem Statement
- Current `Course.category` field is global but course types are faculty/department-specific
- Course types should be managed at department level (not faculty level)
- Each department needs to categorize courses according to their own standards
- Need clean slate approach - remove global categories and let departments start fresh

## Database Schema Changes

### 1. Update CourseType Model
```prisma
// BEFORE (incorrect - faculty-scoped):
model CourseType {
  facultyId String
  faculty   Faculty @relation(fields: [facultyId], references: [id])
  @@unique([name, facultyId])
}

// AFTER (correct - department-scoped):
model CourseType {
  id           String     @id @default(cuid())
  name         String     // e.g., "Core", "Major Elective"
  color        String     // Hex color for UI
  departmentId String     // ✅ Department-scoped
  department   Department @relation(fields: [departmentId], references: [id])
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  @@unique([name, departmentId])  // Unique per department
  @@map("course_types")
}
```

### 2. Remove Global Course Category
```prisma
// REMOVE from Course model:
// category String // References CourseType.name
```

### 3. Add Department Course Type Assignment Model
```prisma
model DepartmentCourseType {
  id           String     @id @default(cuid())
  courseId     String
  departmentId String
  courseTypeId String
  
  course       Course     @relation(fields: [courseId], references: [id])
  department   Department @relation(fields: [departmentId], references: [id])
  courseType   CourseType @relation(fields: [courseTypeId], references: [id])
  
  // Audit trail
  assignedAt   DateTime   @default(now())
  assignedById String     // Which chairperson assigned this
  
  @@unique([courseId, departmentId])
  @@map("department_course_types")
}
```

## API Endpoints

### Course Types Management
- ✅ `GET /api/course-types` - List course types for chairperson's department
- ✅ `POST /api/course-types` - Create course type for department
- ✅ `PUT /api/course-types/[id]` - Update department course type
- ✅ `DELETE /api/course-types/[id]` - Delete department course type

### Course Type Assignments (NEW)
- 🆕 `GET /api/department/course-types/assignments` - Get all course assignments for department
- 🆕 `POST /api/department/course-types/assignments` - Bulk assign course types
- 🆕 `PUT /api/department/course-types/assignments/[courseId]` - Update single course assignment
- 🆕 `DELETE /api/department/course-types/assignments/[courseId]` - Remove course assignment

## Frontend Implementation

### 1. Info Config Page
- ✅ **COMPLETE** - Course types management UI
- ✅ Update to use department-scoped data (API already corrected)
- ✅ Default course types creation per department

### 2. Info Edit - Courses Tab
- 🆕 **Course Type Display**: Show assigned course types with colors
- 🆕 **Bulk Assignment Tool**: Mass assign course types to multiple courses
- 🆕 **Course Type Filter**: Filter courses by department-specific types
- 🆕 **Individual Assignment**: Edit course type for single courses

### 3. Course Creation/Edit Forms
- 🆕 **Course Type Dropdown**: Fetch department-specific course types
- 🆕 **Color Indicators**: Show course type colors in dropdown
- 🆕 **Default Handling**: Show "-" for courses without assigned types

## Migration Strategy: Clean Slate (Option A)

### What Happens:
1. ✅ Remove global `category` field from all courses
2. ✅ Each department starts with default course types (Core, Major, Major Elective, etc.)
3. ✅ All courses initially show "-" for course type
4. ✅ Chairpersons use bulk assignment tools to categorize ~60 courses per department

### Benefits:
- ✅ Clean architecture with no legacy data issues
- ✅ Department-specific categorization from day one
- ✅ Accurate course type assignments based on department needs
- ✅ No inherited categorization errors

## Implementation Phases

### Phase 1: Database & API Foundation ✅ COMPLETED
- [x] Update CourseType schema (faculty → department)
- [x] Remove Course.category field
- [x] Add DepartmentCourseType model
- [x] Update existing course-types API routes
- [x] Create new course assignment API routes
- [x] Fix compilation errors from category field removal

### Phase 2: Frontend Course Management 📋 NEXT
- [ ] Update info_config to use department-scoped course types
- [ ] Create bulk assignment UI in courses tab
- [ ] Add course type filtering in courses tab
- [ ] Update course edit forms with department course types

### Phase 3: User Experience Enhancements 🎨
- [ ] Course type color indicators throughout UI
- [ ] Smart bulk assignment patterns (e.g., "CSX 1XXX" = Core)
- [ ] Course type statistics and overview
- [ ] Assignment progress tracking

### Phase 4: Testing & Polish ✨
- [ ] Test with ~60 courses per department scenario
- [ ] Optimize bulk assignment performance
- [ ] User feedback and improvements

## Technical Considerations

### Performance
- Department-scoped queries are efficient
- Bulk assignment operations need optimization for ~60 courses
- Course type filtering should be fast

### User Experience
- Bulk assignment tools make clean slate manageable
- Visual course type indicators improve usability
- Progressive assignment (can assign types gradually)

### Data Integrity
- Prevent deletion of course types in use
- Audit trail for course type assignments
- Validation for course type assignments

## Success Metrics
- [ ] Each department can manage their own course types
- [ ] Chairpersons can bulk assign course types efficiently
- [ ] Course type assignments are accurate and department-specific
- [ ] UI clearly shows course types with appropriate colors
- [ ] No performance issues with ~60 courses per department

## Notes
- Chairpersons are associated with departments, not faculties
- Course types are unique per department (same name allowed across departments)
- Default course types: Core, Major, Major Elective, General Education, Free Elective
- Course type assignments are optional (courses can show "-" if unassigned)
- Implementation prioritizes courses tab bulk assignment and course creation forms
