# Category Implementation Plan

## Problem Analysis
Based on Prisma schema analysis and user feedback:

### Current Issue:
- All courses are showing under "General" category
- Need to fetch and display courses by their actual categories
- Categories are managed through `CourseType` and `DepartmentCourseType` models

### Database Structure:
```
Course → DepartmentCourseType → CourseType
```
- `CourseType`: Defines category names (name, color) per department
- `DepartmentCourseType`: Links courses to course types within departments
- Each course can have a category assignment per department

## Implementation Strategy

### Phase 1: Fetch Course Types (Categories)
1. Fetch all `CourseType` records for the selected department
2. These will become our dynamic category headers

### Phase 2: Group Courses by Category
1. For each curriculum course, check its `DepartmentCourseType` assignment
2. Group courses by their assigned `CourseType.name`
3. Handle unassigned courses (courses without `DepartmentCourseType` entry)

### Phase 3: Dynamic UI Rendering
1. Replace hardcoded categories with fetched `CourseType` names
2. Render sections dynamically based on available categories
3. Show "Unassigned" category for courses without type assignment

## API Changes Needed

### Option 1: Extend public-curricula endpoint
Add course type information to the existing response:
```typescript
include: {
  course: {
    include: {
      departmentCourseTypes: {
        where: { departmentId: curriculum.departmentId },
        include: { courseType: true }
      }
    }
  }
}
```

### Option 2: Create new endpoint for course types
```
GET /api/public-course-types?departmentId=xxx
```

## Implementation Steps

### Step 1: Update API Response
- Modify `/api/public-curricula` to include course type information
- Test API response structure

### Step 2: Update Frontend Logic
- Fetch course types for selected department
- Group curriculum courses by their assigned types
- Handle unassigned courses gracefully

### Step 3: Dynamic Category Rendering
- Replace hardcoded `courseTypeOrder` with dynamic list
- Render categories based on fetched data
- Add "Unassigned" category if needed

### Step 4: Test and Validate
- Test course categorization
- Test transcript import with new categories
- Validate course status and grades preservation

## Files to Modify

1. `src/app/api/public-curricula/route.ts` - Add course type data
2. `src/app/management/data-entry/page.tsx` - Update categorization logic
3. Test with existing curricula data

## Success Criteria
- [ ] Dynamic categories based on database `CourseType` records
- [ ] Courses properly grouped by their assigned types
- [ ] Unassigned courses handled gracefully
- [ ] Transcript import works with new category structure
- [ ] No hardcoded category assumptions