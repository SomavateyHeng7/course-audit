# Course Type Hierarchy Implementation: Frontend ↔ Backend Coordination

> **Status**: ⚠️ BLOCKED - Backend Bug  
> **Last Updated**: January 28, 2026  
> **Related Docs**:
> - [BACKEND_HANDOFF_FOR_CONFIG_PAGE.md](BACKEND_HANDOFF_FOR_CONFIG_PAGE.md) – Full schema & API contract
> - [CONFIG_PAGE_CREDIT_POOLS_PLAN.md](CONFIG_PAGE_CREDIT_POOLS_PLAN.md) – UI/UX plan
> - [CREDIT_POOLS_AND_LEVELS_PLAN](../Creditpool_Category_lvl/CREDIT_POOLS_AND_LEVELS_PLAN%20(1).md) – Overarching strategy
> - [CURRICULUM_API_REFERENCE.md](../curriculum_info/CURRICULUM_API_REFERENCE.md) – Current API docs

---

## 🚨 CRITICAL BUG: Backend Not Returning courseType in Curriculum Response

**Date Discovered**: January 28, 2026  
**Severity**: Blocker - Course category assignment appears to work but doesn't persist after refresh

### Problem

The `GET /api/curricula/{id}` endpoint does **NOT** include `course_type` on each course in the response. 

**Evidence from browser console logs:**
```
Sample course.courseType: undefined
Sample course.course_type: undefined
```

**Raw backend response** (course object):
```json
{
  "id": "019b20d0-622d-711d-9d90-d2735c3f3918",
  "code": "ELE1001",
  "name": "Communicative English 1",
  "credits": 3,
  "credit_hours": "3-0-6",
  "description": "...",
  "requires_permission": false,
  "summer_only": false,
  "requires_senior_standing": false,
  "min_credit_threshold": null,
  "is_active": true
  // ❌ NO course_type field!
}
```

### What Frontend Expects

```json
{
  "course": {
    "id": "...",
    "code": "ELE1001",
    "name": "...",
    "course_type": {           // <-- MISSING!
      "id": "type-uuid",
      "name": "General Education",
      "color": "#6366f1"
    }
  }
}
```

### Backend Fix Required

In `CurriculumController::show()`, join the `department_course_types` table to get the assigned course type for each course in this curriculum:

```php
// Pseudocode
foreach ($curriculum->curriculumCourses as $cc) {
    $dct = DepartmentCourseType::where('course_id', $cc->course_id)
        ->where('curriculum_id', $curriculum->id)
        ->with('courseType')
        ->first();
    
    $cc->course->course_type = $dct?->courseType ? [
        'id' => $dct->courseType->id,
        'name' => $dct->courseType->name,
        'color' => $dct->courseType->color,
    ] : null;
}
```

### Verification

After fix, the curriculum response should include:
```json
"course": {
  "id": "...",
  "code": "ELE1001",
  ...
  "course_type": {
    "id": "019b258e-294f-735f-ae99-96bfe7085d8e",
    "name": "General Education", 
    "color": "#6366f1"
  }
}
```

---

## 1. Executive Summary

The **Course Type Hierarchy** feature allows course types to have parent/child relationships (e.g., `GE → HUMAN → LANGUAGE`). A course is assigned to the **deepest** node; ancestor totals roll up automatically.

| Layer | Current State | Hierarchy Support |
|-------|---------------|-------------------|
| **Frontend (config page)** | ✅ Tree UI, parentId in forms, expand/collapse | Ready – needs backend |
| **Frontend (types/services)** | ✅ `CourseTypeLite`, `CourseTypeTreeNode`, `parentId` | Ready |
| **Laravel Backend API** | ✅ Updated with hierarchy support | **Complete** |
| **Database** | ✅ Migration ready | **Run `php artisan migrate`** |

---

## 2. Frontend Implementation Status

### 2.1 Already Implemented ✅

| Component / File | Description |
|------------------|-------------|
| [src/app/chairperson/info_config/page.tsx](../../../../src/app/chairperson/info_config/page.tsx) | Tree rendering (`renderCourseTypeNode`), expand/collapse, add-child button, parent selector in add/edit modals |
| [src/types/creditPool.ts#L171-L196](../../../../src/types/creditPool.ts#L171-L196) | `CourseTypeLite` and `CourseTypeTreeNode` interfaces with `parentId` |
| [src/services/courseTypesApi.ts](../../../../src/services/courseTypesApi.ts) | `CreateCourseTypeRequest` / `UpdateCourseTypeRequest` include `parentId` |
| [src/lib/utils/creditPoolCalculation.ts](../../../../src/lib/utils/creditPoolCalculation.ts) | `courseTypeMatchesHierarchy()` walks parent chain for pool matching |
| [src/hooks/useConfigFeatureFlags.ts](../../../../src/hooks/useConfigFeatureFlags.ts) | `enableHierarchy` flag controls visibility |

### 2.2 Frontend Helper Functions (info_config)

```ts
// Build tree from flat list
buildCourseTypeTree(types: CourseTypeData[]): CourseTypeTreeNode[]

// Flatten tree back into dropdown options with indent
flattenCourseTypeTree(nodes, depth): CourseTypeOption[]

// Find node by id
findCourseTypeNode(nodes, id): CourseTypeTreeNode | null

// Collect descendant ids (for disallowing self as parent)
collectDescendantIds(node): string[]

// Tree depth (for UI guard rails)
calculateTreeDepth(nodes, depth): number
```

### 2.3 UI Flow

1. **Listing**: Types render as an expandable tree with indentation; usage chip shows course count.
2. **Add Type**: Modal has a **Parent** dropdown populated from `courseTypeOptions` (indented names).
3. **Edit Type**: Same modal; dropdown excludes self & descendants to prevent cycles.
4. **Add Child**: Clicking `+` on a node opens Add modal with parent pre-selected.
5. **Delete**: Warns about child types; backend should decide cascade vs block.

---

## 3. Backend Requirements (Gap Analysis)

### 3.1 Database Migration

```sql
-- Add to course_types table
ALTER TABLE course_types
  ADD COLUMN parent_course_type_id VARCHAR(255) NULL,
  ADD COLUMN position INT DEFAULT 0,
  ADD CONSTRAINT fk_course_type_parent
    FOREIGN KEY (parent_course_type_id)
    REFERENCES course_types(id)
    ON DELETE SET NULL;

CREATE INDEX idx_course_types_parent ON course_types(parent_course_type_id);
```

**Decisions needed**:
- `ON DELETE SET NULL` vs `ON DELETE CASCADE` vs `RESTRICT`
- If cascade, orphaned children become roots automatically.

### 3.2 API Surface Changes

| Endpoint | Current | Required Change |
|----------|---------|-----------------|
| `GET /api/course-types` | Returns flat list | Add `parentId`, `position`, `childCount` to response |
| `GET /api/course-types/tree` | ❌ Does not exist | **New** – Returns nested structure for efficient tree render |
| `POST /api/course-types` | Accepts `name`, `color`, `departmentId` | Accept `parentId` (nullable), `position` (optional) |
| `PUT /api/course-types/{id}` | Updates name/color | Accept `parentId`, `position`; **validate no cycles** |
| `POST /api/course-types/reorder` | ❌ Does not exist | **New** – Bulk update `position` + `parentId` for drag-drop |
| `DELETE /api/course-types/{id}` | Deletes type | Return error if children exist? Or set children's parent to null? |

### 3.3 Recommended Response Shapes

#### Flat with hierarchy metadata (existing endpoint enhanced)
```json
GET /api/course-types?departmentId=xxx

{
  "courseTypes": [
    {
      "id": "uuid-1",
      "name": "General Education",
      "color": "#6366f1",
      "departmentId": "uuid",
      "parentId": null,
      "position": 0,
      "childCount": 2,
      "usageCount": 15,
      "seeded": false,
      "createdAt": "...",
      "updatedAt": "..."
    },
    {
      "id": "uuid-2",
      "name": "Humanities",
      "color": "#8b5cf6",
      "departmentId": "uuid",
      "parentId": "uuid-1",
      "position": 0,
      "childCount": 0,
      "usageCount": 8,
      ...
    }
  ],
  "seeded": true,
  "total": 10
}
```

#### Tree endpoint (optional, improves performance)
```json
GET /api/course-types/tree?departmentId=xxx

{
  "tree": [
    {
      "id": "uuid-1",
      "name": "General Education",
      "color": "#6366f1",
      "usageCount": 15,
      "children": [
        {
          "id": "uuid-2",
          "name": "Humanities",
          "color": "#8b5cf6",
          "usageCount": 8,
          "children": []
        }
      ]
    }
  ]
}
```

### 3.4 Validation Rules

1. **Cycle Prevention**: When updating `parentId`, ensure the new parent is not a descendant of the node being edited.
2. **Unique Name per Level**: `(departmentId, parentId, name)` should be unique to avoid sibling duplicates.
3. **Depth Limit (optional)**: Consider max depth (e.g., 4 levels) to keep UI manageable.

---

## 4. Feature Flag Coordination

The frontend reads flags from `GET /api/config/feature-flags`:

```json
{
  "flags": {
    "enableHierarchy": true,   // ← controls tree UI
    "enablePools": false,
    "enableGenericLists": true,
    "showLegacyBridgeBanner": true
  }
}
```

**Rollout sequence**:
1. Backend deploys migration + updated endpoints with `enableHierarchy: false`.
2. QA verifies endpoints manually.
3. Flip `enableHierarchy: true` → frontend starts using parentId.
4. Monitor for issues; rollback flag if needed.

---

## 5. Downstream Surfaces Impacted

Once hierarchy is live on config page, propagate to:

| Surface | File | Required Changes |
|---------|------|------------------|
| Curriculum Edit – Courses Tab | `info_edit/[id]/page.tsx` | Show breadcrumb when assigning type (e.g., `GE › HUMAN`) |
| Curriculum Edit – Pools Tab | (new) `PoolsListsTab.tsx` | Allow pool sources from any level in hierarchy |
| Student Checklist | `StudentCheckList/page.tsx` | Display category breakdown using hierarchy roll-up |
| Course Assignment Modal | `CoursesTab.tsx` | Type selector becomes tree-aware dropdown |

See [CREDIT_POOL_DOWNSTREAM_IMPACT_PLAN.md](CREDIT_POOL_DOWNSTREAM_IMPACT_PLAN.md) for full breakdown.

---

## 6. Testing Checklist

### Backend (Laravel)
- [ ] Migration runs without data loss on existing course_types
- [ ] Creating type with parentId sets relationship correctly
- [ ] Updating parentId to descendant returns 422 (cycle)
- [ ] Deleting parent type handles children per policy
- [ ] `/course-types` response includes new fields
- [ ] `/course-types/tree` returns nested structure (if implemented)

### Frontend (Next.js)
- [ ] Tree renders correctly with 3+ levels
- [ ] Add child pre-selects parent
- [ ] Edit modal excludes self & descendants from parent dropdown
- [ ] Collapse/expand persists during session
- [ ] Feature flag `enableHierarchy: false` hides tree UI, shows flat grid
- [ ] `courseTypeMatchesHierarchy()` correctly matches parent types in pool calc

---

## 7. Action Items

| # | Owner | Task | Status |
|---|-------|------|--------|
| 1 | Backend | Add `parent_course_type_id` and `position` columns via migration | ✅ Done |
| 2 | Backend | Update `CourseTypeController` to accept/return `parentId`, `position`, `childCount` | ✅ Done |
| 3 | Backend | Implement cycle detection in update logic | ✅ Done |
| 4 | Backend | Add `/course-types/tree` endpoint | ✅ Done |
| 5 | Backend | Expose `enableHierarchy` in `/api/config/feature-flags` | ✅ Done |
| 6 | Backend | Add `curriculum_id` to `department_course_types` table | ✅ Done |
| 7 | Backend | Update `CurriculumController::show()` to include `course_type` | ✅ Fixed (use `setAttribute` for JSON serialization) |
| 8 | Frontend | Verify tree UI with mock parentId data (local) | ✅ Done |
| 9 | Frontend | Add snake_case → camelCase normalization for courseType in curriculum response | ✅ Done |
| 10 | Frontend | Add toast notifications for bulk assignment feedback | ✅ Done |
| 11 | Frontend | **Extract normalization into reusable function for refresh callback** | ✅ Done |
| 12 | QA | End-to-end test with real backend | ⏳ Ready to test |

---

## 8. Questions for Backend Team

1. **Cascade policy**: Should deleting a parent type cascade-delete children, or set their `parentId` to null (promote to root)?
2. **Reorder endpoint**: Do you prefer a bulk `POST /course-types/reorder` or individual `PUT` calls with `position`?
3. **Seeded types**: Are default types created by seeder? If so, should they have predefined hierarchy (e.g., GE with children)?
4. **Usage count scope**: Does `usageCount` reflect direct assignments only, or include descendants?

---

## 9. Quick Reference: Frontend Files to Update Post-Backend

```
src/
├── services/
│   └── courseTypesApi.ts          # Ensure parentId passed to Laravel
├── lib/api/
│   └── laravel.ts                 # Already calls /course-types
├── app/chairperson/
│   ├── info_config/page.tsx       # ✅ Tree UI ready
│   └── info_edit/[id]/
│       ├── page.tsx               # Add breadcrumb to type column
│       └── components/
│           └── CoursesTab.tsx     # Tree-aware type selector
├── types/
│   └── creditPool.ts              # ✅ Types ready
└── hooks/
    └── useConfigFeatureFlags.ts   # ✅ Reads enableHierarchy
```

---

## 10. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Backend migration & controller update | 2-3 days | None |
| Feature flag exposure | 0.5 day | Migration |
| Frontend integration testing | 1 day | Backend endpoints |
| Downstream surfaces (Courses Tab, Pools Tab) | 3-5 days | Hierarchy stable |
| QA & rollout | 2 days | All above |

**Total estimated time**: ~1.5-2 weeks for full hierarchy support.

---

## 11. Course Type Assignment APIs (Critical for Courses Tab)

The following APIs are required for course category assignment to work in the Curriculum Edit → Courses Tab.

### 11.1 Current Issue

**Symptom**: Course types don't appear in the Courses Tab dropdown or on course cards.

**Root Causes**:
1. `GET /api/course-types?departmentId=xxx` - ✅ Working (fixed with hierarchy update)
2. `GET /api/curricula/{id}` - ⚠️ Must return `course.courseType` for each curriculum course
3. `POST /api/course-types/assign` - ⚠️ Working but changes may not reflect in curriculum response

### 11.2 API Endpoints Used by Courses Tab

| Endpoint | Method | Purpose | Frontend File |
|----------|--------|---------|---------------|
| `/api/course-types?departmentId=xxx` | GET | Fetch available types for dropdown | `CoursesTab.tsx:77-89` |
| `/api/curricula/{id}` | GET | Fetch curriculum with course types | `info_edit/[id]/page.tsx:135` |
| `/api/course-types/assign` | POST | Bulk assign type to courses | `CoursesTab.tsx:100-136` |
| `/api/courses/{id}` | PUT | Update single course | `info_edit/[id]/page.tsx:546` |

### 11.3 Required: Curriculum Response Must Include Course Types

**Endpoint**: `GET /api/curricula/{id}`

**Current Response Structure Expected by Frontend**:
```json
{
  "curriculum": {
    "id": "uuid",
    "name": "BSCS 2022",
    "department_id": "uuid",
    "curriculum_courses": [
      {
        "id": "curriculum-course-uuid",
        "year": 1,
        "semester": "1",
        "is_required": true,
        "course": {
          "id": "course-uuid",
          "code": "CSC101",
          "name": "Intro to Programming",
          "credits": 3,
          "creditHours": "3-0-6",
          "courseType": {
            "id": "type-uuid",
            "name": "Core",
            "color": "#ef4444"
          }
        }
      }
    ]
  }
}
```

**⚠️ CRITICAL**: The `course.courseType` object must be populated by looking up the `department_course_types` table:

```php
// In CurriculumController@show or similar
$curriculum = Curriculum::with([
    'curriculumCourses.course' => function($query) use ($departmentId) {
        $query->with(['departmentCourseTypes' => function($q) use ($departmentId) {
            $q->where('department_id', $departmentId)
              ->with('courseType');
        }]);
    }
])->find($id);

// Then transform to include courseType on each course
foreach ($curriculum->curriculumCourses as $cc) {
    $dct = $cc->course->departmentCourseTypes
        ->where('curriculum_id', $curriculum->id)
        ->first();
    
    $cc->course->courseType = $dct?->courseType ? [
        'id' => $dct->courseType->id,
        'name' => $dct->courseType->name,
        'color' => $dct->courseType->color,
    ] : null;
}
```

### 11.4 POST /api/course-types/assign Request Format

**Request Body (Frontend sends this)**:
```json
{
  "courseIds": ["course-uuid-1", "course-uuid-2"],
  "courseTypeId": "type-uuid",
  "departmentId": "dept-uuid",
  "curriculumId": "curriculum-uuid"
}
```

**Expected Response**:
```json
{
  "success": true
}
```

**Backend Logic** (from `CourseTypeController::bulkAssign`):
1. Delete existing `department_course_types` for these courses in this curriculum
2. Insert new rows linking each course to the selected type
3. Return success

### 11.5 Table Relationships

```
courses (id)
    ↓
department_course_types (course_id, course_type_id, curriculum_id, department_id)
    ↓
course_types (id, name, color, department_id, parent_course_type_id)
```

**Important**: The `department_course_types` table stores:
- `course_id` - which course
- `course_type_id` - which category (Core, Major, etc.)
- `curriculum_id` - scoped to this curriculum (**nullable in DB, required at API level**)
- `department_id` - scoped to this department

### 11.5.1 curriculum_id Design Decision

| Layer | Nullable? | Enforcement |
|-------|-----------|-------------|
| **Database** | ✅ Yes | Allows flexibility for existing data, edge cases |
| **API** (`bulkAssign`) | ❌ Required | `'curriculumId' => 'required\|string'` - returns 422 if missing |
| **Seeder** | ✅ Provided | Includes `curriculum_id` when creating type assignments |

**What happens when `curriculumId` is null/missing in API request:**
```json
// Request without curriculumId
POST /api/course-types/assign
{ "courseIds": [...], "courseTypeId": "...", "departmentId": "..." }

// Response: 422 Unprocessable Entity
{
  "message": "The curriculum id field is required.",
  "errors": { "curriculumId": ["The curriculum id field is required."] }
}
```

The assignment **will not go through** if `curriculumId` is missing.

### 11.6 Verification Checklist for Backend

- [x] `GET /api/course-types?departmentId=xxx` returns types with `parentId`, `position`, `childCount`, `usageCount`
- [x] `GET /api/curricula/{id}` returns each course with `course_type: { id, name, color }` or `null`
- [x] The `course_type` on each course is looked up from `department_course_types` WHERE `curriculum_id` = current curriculum
- [x] `POST /api/course-types/assign` creates entries in `department_course_types` with `curriculum_id`
- [x] `curriculumId` is **required** in assign request (nullable in DB, enforced at API level)
- [x] After assignment, re-fetching the curriculum shows the updated `course_type` on affected courses

### 11.6.1 Bug Fix: course_type Not Serializing (Jan 28, 2026)

**Problem**: The `CurriculumController::show()` was setting `$cc->course->courseType = ...` which doesn't serialize to JSON.

**Solution**: Use `setAttribute()` to add the attribute to the model's attributes array:

```php
// ❌ WRONG - doesn't serialize
$cc->course->courseType = $courseTypeData;

// ✅ CORRECT - serializes properly
$cc->course->setAttribute('course_type', $courseTypeData);
```

**Note**: The response now uses snake_case `course_type` to match Laravel conventions. Frontend should normalize to camelCase if needed.

### 11.7 Frontend Debug Points

If categories still don't show after backend fixes:

1. **Check if departmentId reaches CoursesTab**:
   ```tsx
   // In CoursesTab, add console.log:
   console.log('CoursesTab departmentId:', departmentId);
   ```

2. **Check if courseTypes are fetched**:
   ```tsx
   // After setCourseTypes:
   console.log('Fetched courseTypes:', data.courseTypes);
   ```

3. **Check if courses have courseType**:
   ```tsx
   // In info_edit after mapping coursesData:
   console.log('Courses with types:', coursesData.map(c => ({ code: c.code, type: c.courseType })));
   ```

---

*This document serves as the single source of truth for coordinating the Course Type Hierarchy feature between frontend and backend teams. Update status fields as work progresses.*
