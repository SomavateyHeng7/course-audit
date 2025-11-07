# SP2 Quick Reference - Curriculum-Specific Features

**Schema File:** `prisma/schema_for_sp2.prisma`  
**Status:** ✅ Validated & Ready  
**Date:** November 5, 2025

---

## 🎯 What's Curriculum-Specific Now?

### ✅ EVERYTHING Related to Courses:

| Feature | Before | After SP2 | Impact |
|---------|--------|-----------|---------|
| **Categories** | Shared across curricula | ✅ Per curriculum | OOP can be Core in CS, Elective in SE |
| **Required Status** | ✅ Already per curriculum | ✅ Unchanged | Already isolated |
| **Prerequisites** | Global only | ✅ Per curriculum (with fallback) | Different prereqs per curriculum |
| **Corequisites** | Global only | ✅ Per curriculum (with fallback) | Different coreqs per curriculum |
| **Course Rules** | Global only | ✅ Per curriculum (optional) | Summer-only, permissions, etc. |
| **Banned Combos** | ✅ Already per curriculum | ✅ Unchanged | Already isolated |
| **Elective Rules** | ✅ Already per curriculum | ✅ Unchanged | Already isolated |

---

## 📊 Schema Changes at a Glance

### 1. DepartmentCourseType (Course Categories)
```prisma
// ADDED:
curriculumId String
curriculum   Curriculum @relation(...)

// CHANGED:
@@unique([courseId, departmentId, curriculumId])  // Was: [courseId, departmentId]
```

### 2. CurriculumCourse (Junction Table)
```prisma
// ADDED:
overrideRequiresPermission     Boolean?
overrideSummerOnly             Boolean?
overrideRequiresSeniorStanding Boolean?
overrideMinCreditThreshold     Int?

// ADDED RELATIONS:
curriculumPrerequisites        CurriculumCoursePrerequisite[]
curriculumCorequisites         CurriculumCourseCorequisite[]
```

### 3. NEW: CurriculumCoursePrerequisite
```prisma
model CurriculumCoursePrerequisite {
  curriculumCourseId   String
  prerequisiteCourseId String
  
  @@unique([curriculumCourseId, prerequisiteCourseId])
}
```

### 4. NEW: CurriculumCourseCorequisite
```prisma
model CurriculumCourseCorequisite {
  curriculumCourseId    String
  corequisiteCourseId   String
  
  @@unique([curriculumCourseId, corequisiteCourseId])
}
```

---

## 🔄 Fallback Logic Pattern

All new features use a **two-tier system**:

```
1. Check curriculum-specific settings FIRST
   ↓
2. If none exist, fall back to global defaults
   ↓
3. Apply result
```

**Example:**
- Prerequisites: Check `CurriculumCoursePrerequisite` → Fall back to `CoursePrerequisite`
- Course rules: Check override fields → Fall back to Course model fields

---

## 🎨 User Experience

### For Chairpersons:
- ✅ Set different course categories per curriculum
- ✅ Override course rules when needed
- ✅ Define curriculum-specific prerequisites
- ✅ Define curriculum-specific corequisites
- ✅ Clear UI with "Revert to Global" options

### For Students:
- ✅ See correct course categories for THEIR curriculum
- ✅ See correct prerequisites for THEIR curriculum
- ✅ See correct corequisites for THEIR curriculum
- ✅ See correct course rules for THEIR curriculum
- ✅ No confusion from other curricula

---

## 📡 Key APIs to Update

### Critical (Must Fix):
1. `/api/course-types/assign` - Add `curriculumId`
2. `/api/curricula/[id]` - Filter by `curriculumId`
3. `/api/curricula/[id]/elective-rules` - Filter by `curriculumId`
4. `/api/available-courses` - Filter by `curriculumId`

### New APIs Needed:
5. `/api/curricula/[id]/courses/[courseId]/prerequisites` - Manage prereqs
6. `/api/curricula/[id]/courses/[courseId]/corequisites` - Manage coreqs
7. Update validation APIs to check curriculum-specific dependencies

---

## 🗄️ Migration Strategy

### Chosen: Option A (Delete & Re-assign)

**Why?**
- Clean slate for curriculum-specific data
- No ambiguity about which curriculum owns what
- Forces explicit assignment (better data quality)

**Steps:**
1. Backup `department_course_types` table
2. Add new columns and tables
3. Delete existing assignments
4. Update constraints and indexes
5. Notify users to re-assign

**User Impact:**
- Chairpersons re-assign course types to courses
- Chairpersons set curriculum-specific prerequisites/corequisites if needed
- Global defaults still work (fallback)

---

## 🧪 Example Use Cases

### Use Case 1: Different Course Categories
**Problem:** "OOP" is Core in CS curriculum but Elective in SE curriculum

**Solution:**
```typescript
// CS Curriculum
DepartmentCourseType {
  courseId: "oop",
  curriculumId: "cs-2024",
  courseTypeId: "core"
}

// SE Curriculum (same department!)
DepartmentCourseType {
  courseId: "oop",
  curriculumId: "se-2024",
  courseTypeId: "elective"
}
```

### Use Case 2: Additional Prerequisites
**Problem:** Honors curriculum needs extra prerequisites

**Solution:**
```typescript
// Regular curriculum: uses global prerequisites (fallback)
// No CurriculumCoursePrerequisite records
// → Falls back to CoursePrerequisite

// Honors curriculum: defines its own
CurriculumCoursePrerequisite {
  curriculumCourseId: "adv-algo-honors",
  prerequisiteCourseId: "data-structures-honors"
}
CurriculumCoursePrerequisite {
  curriculumCourseId: "adv-algo-honors",
  prerequisiteCourseId: "discrete-math-honors"  // Extra!
}
```

### Use Case 3: Override Summer-Only Rule
**Problem:** Internship is summer-only in old curricula, year-round in new

**Solution:**
```typescript
// Course default
Course { summerOnly: true }

// Old curricula
CurriculumCourse { overrideSummerOnly: null }  // → Uses default (true)

// New 2025 curriculum
CurriculumCourse { overrideSummerOnly: false }  // → Override (false)
```

---

## ✅ Validation Status

```bash
$ npx prisma validate --schema=prisma/schema_for_sp2.prisma
✅ The schema at prisma\schema_for_sp2.prisma is valid 🚀
```

**Checks Passed:**
- ✅ Syntax validation
- ✅ Relationship validation
- ✅ Constraint validation
- ✅ Index validation
- ✅ Formatting

---

## 📦 What's Safe Right Now

✅ **Your current database:** UNCHANGED  
✅ **Your current schema:** UNTOUCHED  
✅ **Your running app:** NORMAL  
✅ **All SP2 files:** DOCUMENTATION ONLY  

**Nothing will change until you decide to proceed!**

---

## 📁 Files Created

1. `prisma/schema_for_sp2.prisma` - Test schema
2. `SP2_API_FIXES_REQUIRED.md` - API update guide
3. `SP2_SCHEMA_TESTING_GUIDE.md` - Testing procedures
4. `SP2_SAFETY_CONFIRMATION.md` - Safety proof
5. `SP2_COURSE_RULE_OVERRIDES.md` - Rule overrides guide
6. `SP2_PREREQUISITES_COREQUISITES.md` - Dependencies guide
7. `SP2_COMPLETE_SUMMARY.md` - Executive summary
8. `SP2_QUICK_REFERENCE.md` - This file

---

## 🚀 Next Steps

1. **Review** all documentation
2. **Verify** externally with your team
3. **Approve** the approach
4. **Plan** implementation timeline
5. **Execute** following the guides

---

## 💡 Key Principles

1. **Curriculum Isolation** - Zero cross-curriculum pollution
2. **Backward Compatible** - NULL/fallback = use global defaults
3. **Flexible** - Override only what you need
4. **Consistent** - Same pattern across all features
5. **Safe** - Test schema separate from production

---

**Questions?** Check the detailed documentation files above!  
**Ready to implement?** Start with `SP2_API_FIXES_REQUIRED.md`
