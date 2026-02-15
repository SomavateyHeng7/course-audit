# Multi-Fix Coordination Document

This document coordinates three fixes that need frontend/backend work.

**Last Updated:** February 16, 2026

---

## Status Summary

| Task | Frontend | Backend | Status |
|------|----------|---------|--------|
| Task 1 (Categories→Faculty) | ✅ **DONE** | ✅ **DONE + MIGRATED** | ✅ Complete |
| Task 2 (Credits) | ✅ **DONE** | ✅ **DONE + MIGRATED** | ✅ Complete |
| Task 3 (Middleware) | ✅ DONE | Not needed | ✅ Complete |

---

## Frontend Completion Summary (Feb 16, 2026)

### Task 1: CourseType departmentId → facultyId
**Files Changed:**
- `src/services/courseTypesApi.ts` - Interface: `departmentId` → `facultyId`
- `src/app/chairperson/create/details/page.tsx` - API call param: `departmentId` → `facultyId`
- `src/app/chairperson/info_edit/[id]/page.tsx` - API call param: `departmentId` → `facultyId`
- `src/components/features/curriculum/CoursesTab.tsx` - Added `facultyId` prop, API call updated

### Task 2: requiredCourses → requiredCredits
**Files Changed:**
- `src/services/concentrationApi.ts` - API params: `requiredCourses` → `requiredCredits`
- `src/components/features/curriculum/ConcentrationsTab_new.tsx` - Interface + UI labels updated
- `src/components/features/management/ConcentrationAnalysis.tsx` - Interface + display text updated

---

## Backend Completion Summary (Feb 16, 2026)

### Task 1: Category Association → Faculty Scope
**Files Changed:**
- `app/Models/CourseType.php` - `department_id` → `faculty_id`, relationship `department()` → `faculty()`
- `app/Http/Controllers/API/Chairperson/CourseTypeController.php` - All 7 methods updated
- `app/Http/Controllers/API/Chairperson/CreditPoolController.php` - Line ~706 query updated
- `database/migrations/2026_02_14_100000_change_course_types_to_faculty_scope.php` - ✅ MIGRATED

**API Response Changes:**
| Endpoint | Field Change |
|----------|--------------|
| `GET /api/chairperson/course-types` | `departmentId` → `facultyId` |
| `POST /api/chairperson/course-types` | Request: `departmentId` → `facultyId` |
| `GET /api/chairperson/course-types/{id}` | `departmentId` → `facultyId` |
| `PUT /api/chairperson/course-types/{id}` | Request: `departmentId` → `facultyId` |
| `GET /api/chairperson/course-types/tree` | `departmentId` → `facultyId` |

### Task 2: Concentration Required Credits
**Files Changed:**
- `app/Models/CurriculumConcentration.php` - fillable `required_courses` → `required_credits`
- `app/Http/Controllers/API/Chairperson/CurriculaController.php` - 4 occurrences updated
- `database/migrations/2026_02_14_100001_rename_required_courses_to_required_credits.php` - ✅ MIGRATED

**API Response Changes:**
| Endpoint | Field Change |
|----------|--------------|
| `GET /api/chairperson/curricula/{id}` | In concentrations array: `requiredCourses` → `requiredCredits` |
| `POST /api/chairperson/curricula/{id}/concentrations` | Request: `requiredCourses` → `requiredCredits` |
| `PUT /api/chairperson/curricula/{id}/concentrations` | Request: `requiredCourses` → `requiredCredits` |

---

## Task 1: Concentration Required Credits (Instead of Course Count)

### Current Behavior
- Chairperson specifies the **number of courses** required from each concentration
- Students need X courses from a concentration to declare it

### Desired Behavior
- Chairperson specifies the **number of credits** required from each concentration
- Students need X credits from a concentration to declare it

### Frontend Changes Needed
- Update UI labels from "Required Courses" → "Required Credits"
- Update input validation (credits typically 1-30, not course count 1-10)
- Update display in curriculum details

### Backend Changes Needed
- Rename/repurpose field: `required_courses` → `required_credits` (or add new field)
- Update validation rules
- Update any graduation/audit calculations that use this field

### Files to Check (Frontend)
- Config page concentration management components
- Curriculum detail views
- Audit/graduation calculation logic

---

## Task 2: Category Attachment to New Faculties/Departments

### Problem Summary
Categories not showing for IT department's curriculums but show for CS department. Same issue occurs when multiple departments exist in a faculty.

### Root Cause
1. Default categories are created when first CP accesses config page
2. Categories only get associated with that CP's department
3. Other departments in same faculty don't get the association
4. New departments added later also miss the association

### Solution (Previously Implemented in Next.js Backend)
1. When default categories are created → associate with ALL departments in the faculty
2. When new categories are added → associate with ALL departments in the faculty
3. When new department is added → associate ALL existing faculty categories with it

### Backend Changes Needed
- On category creation: Loop through all departments in faculty, create associations
- On department creation: Associate all existing faculty categories
- Migration to fix existing orphaned associations

### Frontend Changes Needed
- None (this is purely a backend data association issue)

---

## Task 3: Middleware Session Cookie Issue ✅ COMPLETE

### Problem Summary
When logging out from auth-required account (CP/Admin) and logging into student side (non-auth required):
- Can access student pages
- BUT sidebar and account info still show last logged-in CP account
- Have to manually delete session cookie to fix

### Root Cause Analysis
- Logout doesn't properly clear all session/auth state
- Student side doesn't require auth, so it doesn't validate the stale session
- Frontend reads cached user data from cookie/localStorage

### Solution Implemented (Frontend)
**File:** `src/contexts/SanctumAuthContext.tsx`

Changes made:
1. Added `usePathname()` hook from Next.js to track route changes
2. Added helper function `isPublicPath()` to identify student/advisor paths
3. Added useEffect that clears user state when navigating to public paths
4. Added `pathname` to fetchUser useEffect dependencies

Now when navigating to `/student/` or `/advisor/` pages:
- User state is immediately set to `null`
- Sidebar shows default "User" instead of stale CP info
- No backend changes needed

---

## Parallel Work Strategy

### Can Be Done in Parallel:

| Task | Frontend | Backend | Dependencies |
|------|----------|---------|--------------|
| Task 1 (Credits) | After backend schema | Schema change first | Backend → Frontend |
| Task 2 (Categories) | None needed | Standalone | None |
| Task 3 (Middleware) | Can start immediately | Can start immediately | Independent |

### Recommended Approach:

**Round 1 - CURRENT:**
- **Frontend:** ✅ Task 3 (middleware/logout) - DONE
- **Backend:** Task 2 (category associations) - TODO NOW

**Round 2 - After Round 1:**
- **Backend:** Task 1 schema change (credits field) - TODO
- **Frontend:** Task 1 UI updates (after backend is ready) - PENDING

---

## Backend Prompt

Copy and paste this section to the backend repo:

---

### BACKEND TASKS (2 items)

#### Task 1: Category Association Fix (PRIORITY - Do First)

**Problem:**
Categories are not showing for IT department's curriculums but show for CS department. The same issue happens when there are multiple departments in a faculty.

**Root Cause:**
When default categories are created (or any new category), they only get associated with the creating CP's department. Other departments in the same faculty don't get the association. Same problem when new departments are added.

**Solution Required:**

1. **When creating categories (including defaults):**
```php
// After creating a category:
$category = Category::create([...]);

// Get the faculty_id from the CP's department
$facultyId = $chairperson->department->faculty_id;

// Get ALL departments in this faculty
$departmentIds = Department::where('faculty_id', $facultyId)->pluck('id');

// Associate category with ALL departments in the faculty
$category->departments()->attach($departmentIds);
```

2. **When creating a new department:**
```php
// After creating a department:
$department = Department::create([...]);

// Get all existing categories for this faculty
// (Categories created by other departments in the same faculty)
$categoryIds = Category::whereHas('departments', function($query) use ($department) {
    $query->where('faculty_id', $department->faculty_id);
})->pluck('id');

// Or if categories have direct faculty_id:
// $categoryIds = Category::where('faculty_id', $department->faculty_id)->pluck('id');

// Associate all existing faculty categories with the new department
$department->categories()->attach($categoryIds);
```

3. **Migration to fix existing data:**
```php
// For each faculty:
// - Get all categories associated with ANY department in that faculty
// - Associate those categories with ALL departments in that faculty
```

**Tables involved:**
- `categories`
- `departments`
- `category_department` (pivot table)
- `faculties`

---

#### Task 2: Concentration Required Credits (Instead of Course Count)

**Current:**
- Field stores number of courses required from concentration
- CP specifies "Student needs 3 courses from this concentration"

**Change To:**
- Field stores number of credits required from concentration
- CP specifies "Student needs 9 credits from this concentration"

**Schema Change:**
```php
// Migration
Schema::table('concentrations', function (Blueprint $table) {
    $table->renameColumn('required_courses', 'required_credits');
});

// Or if adding new field and deprecating old:
Schema::table('concentrations', function (Blueprint $table) {
    $table->integer('required_credits')->default(0)->after('required_courses');
});
```

**Validation Update:**
```php
// In ConcentrationController or request validation
'required_credits' => 'required|integer|min:1|max:30'
```

**API Response Update:**
Ensure the field is returned correctly in curriculum/concentration endpoints.

**Note:** Frontend will update labels and UI after backend schema is ready.

---

### Order of Implementation:
1. **Task 1 (Categories)** - Do first, no frontend changes needed
2. **Task 2 (Credits)** - After Task 1, frontend will update after
