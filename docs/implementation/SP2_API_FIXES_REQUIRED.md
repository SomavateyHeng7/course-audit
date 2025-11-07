# SP2 API Fixes Required - Curriculum-Specific Course Categories

**Date:** November 5, 2025  
**Branch:** lucas  
**Related Schema:** `schema_for_sp2.prisma`

## Overview

This document tracks all API endpoints that require updates to support curriculum-specific course category assignments. The core change is adding `curriculumId` to the `DepartmentCourseType` model, allowing the same course to have different categories in different curricula within the same department.

---

## Schema Changes Summary

### DepartmentCourseType Model Changes
- ✅ **Added:** `curriculumId` field (String, required)
- ✅ **Added:** `curriculum` relation to Curriculum model
- ✅ **Changed:** Unique constraint from `[courseId, departmentId]` to `[courseId, departmentId, curriculumId]`
- ✅ **Added:** Index on `curriculumId` for performance
- ✅ **Added:** Reverse relation `departmentCourseTypes` in Curriculum model

---

## 🚨 CRITICAL PRIORITY APIs

### 1. Course Type Assignment API
**File:** `src/app/api/course-types/assign/route.ts`  
**Priority:** 🔴 CRITICAL  
**Complexity:** Medium  

#### Current Issues:
- Accepts only `departmentId`, not `curriculumId`
- Deletes ALL assignments for a course in a department (affects all curricula)
- Creates assignments without curriculum context

#### Required Changes:

```typescript
// ❌ OLD Request Schema
const bulkAssignSchema = z.object({
  courseIds: z.array(z.string().min(1)),
  courseTypeId: z.string().min(1),
  departmentId: z.string().min(1),
});

// ✅ NEW Request Schema
const bulkAssignSchema = z.object({
  courseIds: z.array(z.string().min(1)),
  courseTypeId: z.string().min(1),
  departmentId: z.string().min(1),
  curriculumId: z.string().min(1), // 🔥 ADD THIS
});

// ❌ OLD Delete Logic
await tx.departmentCourseType.deleteMany({
  where: {
    courseId: { in: courseIds },
    departmentId: departmentId
  }
});

// ✅ NEW Delete Logic (curriculum-scoped)
await tx.departmentCourseType.deleteMany({
  where: {
    courseId: { in: courseIds },
    departmentId: departmentId,
    curriculumId: curriculumId // 🔥 ADD THIS
  }
});

// ❌ OLD Create Logic
const assignments = await tx.departmentCourseType.createMany({
  data: courseIds.map(courseId => ({
    courseId,
    departmentId,
    courseTypeId,
    assignedById: session.user.id
  }))
});

// ✅ NEW Create Logic (with curriculum)
const assignments = await tx.departmentCourseType.createMany({
  data: courseIds.map(courseId => ({
    courseId,
    departmentId,
    courseTypeId,
    curriculumId, // 🔥 ADD THIS
    assignedById: session.user.id
  }))
});
```

#### Additional Validation Needed:
- Verify curriculum belongs to the specified department
- Verify curriculum exists and is accessible to user

#### Testing Checklist:
- [ ] Can assign course type in Curriculum A
- [ ] Same course in Curriculum B remains unassigned
- [ ] Reassigning in Curriculum A doesn't affect Curriculum B
- [ ] Cannot assign with invalid curriculumId
- [ ] Cannot assign to curriculum from different department

---

### 2. Curriculum Details API
**File:** `src/app/api/curricula/[id]/route.ts`  
**Priority:** 🔴 CRITICAL  
**Complexity:** Low  

#### Current Issues:
- Fetches course type assignments by department only
- No curriculum scoping in query

#### Required Changes:

```typescript
// ❌ OLD Query
const courseTypeAssignments = await prisma.departmentCourseType.findMany({
  where: {
    courseId: { in: courseIds },
    departmentId: curriculum.departmentId
  },
  include: {
    courseType: true
  }
});

// ✅ NEW Query (curriculum-scoped)
const courseTypeAssignments = await prisma.departmentCourseType.findMany({
  where: {
    courseId: { in: courseIds },
    departmentId: curriculum.departmentId,
    curriculumId: curriculum.id // 🔥 ADD THIS
  },
  include: {
    courseType: true
  }
});
```

#### Testing Checklist:
- [ ] Curriculum A shows only its own course type assignments
- [ ] Curriculum B shows only its own course type assignments
- [ ] Courses without assignments in a curriculum show as unassigned
- [ ] Performance is acceptable with index on curriculumId

---

### 3. Elective Rules API
**File:** `src/app/api/curricula/[id]/elective-rules/route.ts`  
**Priority:** 🔴 CRITICAL  
**Complexity:** Low  

#### Current Issues:
- Queries department course types without curriculum filter
- Category calculations may include courses from other curricula

#### Required Changes:

```typescript
// ❌ OLD Query (in GET endpoint around line 88)
departmentCourseTypes: {
  where: {
    departmentId: curriculum.departmentId
  },
  select: {
    courseType: {
      select: {
        name: true
      }
    }
  }
}

// ✅ NEW Query (curriculum-scoped)
departmentCourseTypes: {
  where: {
    departmentId: curriculum.departmentId,
    curriculumId: curriculumId // 🔥 ADD THIS
  },
  select: {
    courseType: {
      select: {
        name: true
      }
    }
  }
}
```

#### Impact Areas:
- Course category breakdown for elective rules
- Category validation when creating new rules
- Credits calculation per category

#### Testing Checklist:
- [ ] Elective rule categories reflect only current curriculum's assignments
- [ ] Credit counting is accurate per curriculum
- [ ] Creating rules only shows categories from current curriculum
- [ ] No cross-curriculum category pollution

---

### 4. Available Courses API
**File:** `src/app/api/available-courses/route.ts`  
**Priority:** 🔴 CRITICAL  
**Complexity:** Low  

#### Current Issues:
- Department course types fetched without curriculum context
- Students may see wrong categories for courses

#### Required Changes:

```typescript
// ❌ OLD Query (around line 35)
departmentCourseTypes: {
  where: {
    departmentId: departmentId
  },
  include: {
    courseType: true
  }
}

// ✅ NEW Query (curriculum-scoped)
departmentCourseTypes: {
  where: {
    departmentId: departmentId,
    curriculumId: curriculumId // 🔥 ADD THIS (already available in params)
  },
  include: {
    courseType: true
  }
}
```

#### Additional Changes:
- Apply same fix to second query around line 135
- Apply same fix to third query around line 152

#### Testing Checklist:
- [ ] Students see correct course categories for their curriculum
- [ ] Course selection/validation uses curriculum-specific categories
- [ ] Category-based filtering works correctly
- [ ] No categories leak from other curricula

---

## ⚠️ MEDIUM PRIORITY APIs

### 5. Public Curricula Detail API
**File:** `src/app/api/public-curricula/[id]/route.ts`  
**Priority:** 🟡 MEDIUM  
**Complexity:** Low  

#### Required Changes:
```typescript
// Add curriculumId filter to departmentCourseTypes query
departmentCourseTypes: {
  where: {
    departmentId: curriculum.departmentId,
    curriculumId: params.id // 🔥 ADD THIS
  }
}
```

#### Testing Checklist:
- [ ] Public curriculum view shows correct course categories
- [ ] No authentication required
- [ ] Categories match curriculum-specific assignments

---

### 6. Public Curricula List API
**File:** `src/app/api/public-curricula/route.ts`  
**Priority:** 🟡 MEDIUM  
**Complexity:** Low  

#### Required Changes:
```typescript
// Add curriculumId filter in curriculum courses include
departmentCourseTypes: {
  where: {
    departmentId: c.departmentId,
    curriculumId: c.id // 🔥 ADD THIS
  }
}
```

#### Testing Checklist:
- [ ] Public curriculum list shows correct categories per curriculum
- [ ] Multiple curricula from same department show different categories correctly

---

## 📝 LOW PRIORITY APIs

### 7. Course Type Deletion API
**File:** `src/app/api/course-types/[id]/route.ts`  
**Priority:** 🟢 LOW  
**Complexity:** Low  

#### Current Issues:
- Deletion check doesn't specify which curricula use the type
- May prevent deletion even if only used in other curricula

#### Required Changes:
```typescript
// ❌ OLD Query
const assignmentsUsingType = await prisma.departmentCourseType.findFirst({
  where: { courseTypeId: id }
});

// ✅ NEW Query (with curriculum context)
const assignmentsUsingType = await prisma.departmentCourseType.findMany({
  where: { courseTypeId: id },
  include: {
    curriculum: {
      select: { id: true, name: true, year: true }
    }
  }
});

// Update error message to specify which curricula use this type
```

#### Testing Checklist:
- [ ] Can delete course type not used in any curriculum
- [ ] Cannot delete course type used in curricula
- [ ] Error message specifies which curricula use the type

---

## 🎨 FRONTEND COMPONENTS

### 1. Curriculum Editor Page
**File:** `src/app/chairperson/info_edit/[id]/page.tsx`  
**Priority:** 🔴 CRITICAL  
**Lines:** ~276-290  

#### Required Changes:
```typescript
// ❌ OLD API Call
const assignResponse = await fetch('/api/course-types/assign', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    courseIds: [editingCourse.id],
    courseTypeId: editingCourse.selectedCourseTypeId,
    departmentId: curriculum.departmentId
  }),
});

// ✅ NEW API Call (with curriculumId)
const assignResponse = await fetch('/api/course-types/assign', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    courseIds: [editingCourse.id],
    courseTypeId: editingCourse.selectedCourseTypeId,
    departmentId: curriculum.departmentId,
    curriculumId: curriculum.id // 🔥 ADD THIS
  }),
});
```

#### Additional UI Changes:
- Consider adding visual indicator that assignments are curriculum-specific
- Update help text to clarify scope of assignments
- Add confirmation when switching curricula with unsaved changes

#### Testing Checklist:
- [ ] Assigning course type in curriculum editor works
- [ ] UI reflects curriculum-scoped nature of assignments
- [ ] No confusion about assignment scope

---

### 2. Student Progress Page
**File:** `src/app/management/progress/page.tsx`  
**Priority:** 🟡 MEDIUM  
**Lines:** ~746, ~758, ~784, ~792  

#### Required Changes:
- Verify curriculum context is passed to API calls
- Update course category display logic to use curriculum-scoped data
- Ensure no hardcoded department-level queries

#### Testing Checklist:
- [ ] Student progress shows correct categories for their curriculum
- [ ] Category-based requirements calculated correctly
- [ ] No categories from other curricula appear

---

## 🗄️ DATABASE MIGRATION

### Migration Strategy: Option A (Recommended)
**Delete all existing assignments - users will re-assign**

#### Migration Steps:
```sql
-- Step 1: Create backup of existing assignments
CREATE TABLE department_course_types_backup AS 
SELECT * FROM department_course_types;

-- Step 2: Drop existing unique constraint
ALTER TABLE department_course_types 
DROP CONSTRAINT IF EXISTS department_course_types_courseId_departmentId_key;

-- Step 3: Add curriculumId column (nullable first)
ALTER TABLE department_course_types 
ADD COLUMN "curriculumId" TEXT;

-- Step 4: Delete all existing assignments (OPTION A)
DELETE FROM department_course_types;

-- Step 5: Make curriculumId NOT NULL
ALTER TABLE department_course_types 
ALTER COLUMN "curriculumId" SET NOT NULL;

-- Step 6: Add new unique constraint
ALTER TABLE department_course_types 
ADD CONSTRAINT department_course_types_courseId_departmentId_curriculumId_key 
UNIQUE ("courseId", "departmentId", "curriculumId");

-- Step 7: Add index on curriculumId
CREATE INDEX "department_course_types_curriculumId_idx" 
ON department_course_types("curriculumId");

-- Step 8: Add foreign key constraint
ALTER TABLE department_course_types 
ADD CONSTRAINT department_course_types_curriculumId_fkey 
FOREIGN KEY ("curriculumId") REFERENCES curricula(id) ON DELETE CASCADE;
```

#### Communication Plan:
- [ ] Notify all chairpersons before migration
- [ ] Provide documentation on re-assigning course types
- [ ] Set maintenance window for migration
- [ ] Create rollback plan

---

## 🧪 TESTING STRATEGY

### Test Scenario 1: Same Course, Different Curricula
**Setup:**
- Department: Computer Science
- Curriculum A: 2024-2025
- Curriculum B: 2025-2026
- Course: "CS101 - OOP"

**Test Steps:**
1. In Curriculum A, assign CS101 as "Core"
2. Verify CS101 shows as "Core" in Curriculum A
3. Open Curriculum B (same department)
4. Verify CS101 shows as "Unassigned" in Curriculum B
5. In Curriculum B, assign CS101 as "Elective"
6. Verify CS101 shows as "Elective" in Curriculum B
7. Return to Curriculum A
8. Verify CS101 still shows as "Core" in Curriculum A

**Expected Result:** ✅ Each curriculum maintains independent assignments

---

### Test Scenario 2: Elective Rules with Curriculum Scope
**Setup:**
- Same department, two curricula with same courses
- Different category assignments per curriculum

**Test Steps:**
1. Curriculum A: Assign 5 courses as "Technical Electives"
2. Create elective rule: "Technical Electives - 12 credits required"
3. Verify rule shows 5 courses in "Technical Electives" category
4. Curriculum B: Assign only 2 of those courses as "Technical Electives"
5. Create elective rule: "Technical Electives - 6 credits required"
6. Verify rule shows only 2 courses in category
7. Verify Curriculum A still shows 5 courses

**Expected Result:** ✅ Elective rules are curriculum-scoped

---

### Test Scenario 3: Student Course Selection
**Setup:**
- Student enrolled in Curriculum A
- Course exists in multiple curricula with different categories

**Test Steps:**
1. Student views available courses
2. Verify course categories match Curriculum A assignments
3. Student selects courses based on category
4. Verify category-based validation uses Curriculum A rules
5. Check progress report
6. Verify category credits calculated from Curriculum A assignments

**Expected Result:** ✅ Students see curriculum-specific data

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Schema & Migration
- [ ] Review and approve `schema_for_sp2.prisma`
- [ ] Create Prisma migration file
- [ ] Test migration on development database
- [ ] Create rollback procedure
- [ ] Schedule maintenance window
- [ ] Execute migration on production

### Phase 2: Backend APIs (Critical)
- [ ] Fix `/api/course-types/assign` (assignment endpoint)
- [ ] Fix `/api/curricula/[id]` (curriculum details)
- [ ] Fix `/api/curricula/[id]/elective-rules` (elective rules)
- [ ] Fix `/api/available-courses` (student course selection)
- [ ] Test all critical APIs

### Phase 3: Backend APIs (Medium/Low)
- [ ] Fix `/api/public-curricula/[id]`
- [ ] Fix `/api/public-curricula`
- [ ] Fix `/api/course-types/[id]` (deletion)
- [ ] Test all remaining APIs

### Phase 4: Frontend Components
- [ ] Update curriculum editor page
- [ ] Update student progress page
- [ ] Update any other components using course types
- [ ] Add UI indicators for curriculum scope

### Phase 5: Testing & Validation
- [ ] Run Test Scenario 1 (Same Course, Different Curricula)
- [ ] Run Test Scenario 2 (Elective Rules)
- [ ] Run Test Scenario 3 (Student Course Selection)
- [ ] Perform integration testing
- [ ] User acceptance testing with chairpersons

### Phase 6: Documentation & Deployment
- [ ] Update user manual for chairpersons
- [ ] Create migration announcement
- [ ] Deploy to production
- [ ] Monitor for issues
- [ ] Gather user feedback

---

## ⚡ QUICK REFERENCE

### Key Query Pattern Change

```typescript
// ❌ BEFORE (Department-scoped)
where: {
  departmentId: someDepartmentId
}

// ✅ AFTER (Curriculum-scoped)
where: {
  departmentId: someDepartmentId,
  curriculumId: someCurriculumId // Always add this!
}
```

### Key API Parameter Change

```typescript
// ❌ BEFORE
{ departmentId, courseIds, courseTypeId }

// ✅ AFTER
{ departmentId, curriculumId, courseIds, courseTypeId } // Add curriculumId!
```

---

## 📞 SUPPORT & QUESTIONS

For questions about this implementation:
1. Review the test schema: `prisma/schema_for_sp2.prisma`
2. Check specific API file for current implementation
3. Refer to test scenarios above for expected behavior

---

**Last Updated:** November 5, 2025  
**Status:** 🔴 NOT STARTED - Awaiting approval to proceed with implementation
