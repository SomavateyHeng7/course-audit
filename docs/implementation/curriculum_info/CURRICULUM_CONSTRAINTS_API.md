# Curriculum Full API Reference

> **Auth:** All endpoints require Laravel Sanctum. Send `credentials: 'include'` with every request.  
> **Role guard:** All write endpoints require `role === 'CHAIRPERSON'`.  
> **Base prefix:** `/api`

---

## Table of Contents

1. [Curricula CRUD](#1-curricula-crud)
2. [Curriculum Courses](#2-curriculum-courses)
3. [Concentrations (Curriculum-scoped)](#3-concentrations-curriculum-scoped)
4. [Blacklists (Curriculum-scoped)](#4-blacklists-curriculum-scoped)
5. [Curriculum-Level Constraints (Banned Combinations etc.)](#5-curriculum-level-constraints)
6. [Curriculum Course Constraints — Prerequisites, Corequisites & Flags](#6-curriculum-course-constraints)
   - [6a. GET / read constraints + flags](#6a-get-constraints-for-a-curriculum-course)
   - [6b. PUT — override flags](#6b-put-override-flags)
   - [6c. Prerequisites](#6c-prerequisites)
   - [6d. Corequisites](#6d-corequisites)
7. [Elective Rules](#7-elective-rules)

---

## 1. Curricula CRUD

### GET `/api/curricula`
List all curricula (paginated).

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `departmentId` | string | Filter by department |
| `search` | string | Search name / year / version |
| `page` | int | Page number (default 1) |
| `limit` | int | Per-page count (default 10) |

**Response:**
```json
{
  "curricula": [
    {
      "id": "uuid",
      "name": "BSCS 2024",
      "year": "2024",
      "version": "1.0",
      "description": "...",
      "department_id": "uuid",
      "faculty_id": "uuid",
      "total_credits_required": 144,
      "is_active": true,
      "department": { "id": "uuid", "name": "CS", "code": "CS" },
      "faculty": { "id": "uuid", "name": "Engineering", "code": "ENG" },
      "_count": {
        "curriculumCourses": 42,
        "curriculumConstraints": 3,
        "electiveRules": 2
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

---

### GET `/api/curricula/{id}`
Get a single curriculum with all sub-resources.

**Response:**
```json
{
  "curriculum": {
    "id": "uuid",
    "name": "BSCS 2024",
    "year": "2024",
    "version": "1.0",
    "total_credits_required": 144,
    "is_active": true,
    "department": { "id": "uuid", "name": "CS", "code": "CS" },
    "faculty": { "id": "uuid", "name": "Engineering", "code": "ENG" },
    "curriculumCourses": [ ... ],
    "curriculumConcentrations": [ ... ],
    "curriculumBlacklists": [ ... ],
    "curriculumConstraints": [ ... ],
    "electiveRules": [ ... ]
  }
}
```

---

### POST `/api/curricula`
Create a new curriculum (optionally with seed courses).

**Request body:**
```json
{
  "name": "BSCS 2024",
  "year": "2024",
  "version": "1.0",
  "description": "Bachelor of Science in Computer Science",
  "departmentId": "dept-uuid",
  "facultyId": "faculty-uuid",
  "startId": "2024-1",
  "endId": "2030-1",
  "totalCreditsRequired": 144,
  "courses": [
    {
      "code": "CS 101",
      "name": "Intro to CS",
      "credits": 3,
      "creditHours": "3-0-6",
      "description": "...",
      "isRequired": true,
      "position": 11,
      "requiresPermission": false,
      "summerOnly": false,
      "requiresSeniorStanding": false
    }
  ]
}
```

**Response (201):**
```json
{
  "curriculum": { "id": "uuid", "name": "BSCS 2024", ... }
}
```

---

### PUT `/api/curricula/{id}`
Update curriculum metadata.

**Request body (all optional):**
```json
{
  "name": "BSCS 2024 Revised",
  "departmentId": "uuid",
  "description": "Updated description"
}
```

**Response:**
```json
{ "curriculum": { ... } }
```

---

### DELETE `/api/curricula/{id}`
Delete a curriculum (cascades all sub-resources).

**Response:**
```json
{ "message": "Curriculum deleted successfully" }
```

---

### POST `/api/curricula/{id}/duplicate`
Duplicate a curriculum and all its sub-resources (courses, concentrations, blacklists, constraints, elective rules). New curriculum is created as **inactive** with `(Copy)` suffix.

**Response (201):**
```json
{
  "message": "Curriculum duplicated successfully",
  "curriculum": { "id": "new-uuid", "name": "BSCS 2024 (Copy)", "is_active": false, ... }
}
```

---

## 2. Curriculum Courses

These use the `/api/curriculum/{id}` (singular) controller, separate from `/api/curricula`.

### GET `/api/curriculum/{id}/courses`
List all courses in a curriculum.

### POST `/api/curriculum/{id}/courses`
Add a course to a curriculum.

**Request body:**
```json
{
  "courseId": "course-uuid",
  "isRequired": true,
  "position": 21
}
```

### DELETE `/api/curriculum/{id}/courses/{courseId}`
Remove a course from a curriculum.

---

## 3. Concentrations (Curriculum-scoped)

### GET `/api/curricula/{id}/concentrations`

**Response:**
```json
{
  "concentrations": [
    {
      "id": 1,
      "requiredCredits": 9,
      "concentration": {
        "id": 1,
        "name": "Web Development",
        "description": "...",
        "courses": [
          {
            "id": "uuid",
            "code": "CS 401",
            "name": "Advanced Web Dev",
            "credits": 3,
            "description": "..."
          }
        ]
      }
    }
  ]
}
```

---

### POST `/api/curricula/{id}/concentrations`
Assign a concentration to the curriculum.

**Request body:**
```json
{
  "concentrationId": 1,
  "requiredCredits": 9
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `concentrationId` | integer | ✅ | must exist in `concentrations` table |
| `requiredCredits` | integer | optional | min 1, max 30, defaults to `3` |

**Response (201):**
```json
{
  "message": "Concentration added to curriculum successfully",
  "curriculumConcentration": {
    "id": 5,
    "curriculum_id": "uuid",
    "concentration_id": 1,
    "required_credits": 9,
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**Error (400) — already added:**
```json
{ "error": "Concentration already added to curriculum" }
```

---

### PUT `/api/curricula/{id}/concentrations/{concentrationId}`
Update the required credits for an assigned concentration.

**Request body:**
```json
{ "requiredCredits": 12 }
```

**Response:**
```json
{
  "message": "Concentration requirement updated successfully",
  "curriculumConcentration": { ... }
}
```

---

### DELETE `/api/curricula/{id}/concentrations/{concentrationId}`
Remove a concentration from the curriculum.

**Response:**
```json
{ "message": "Concentration removed from curriculum successfully" }
```

---

## 4. Blacklists (Curriculum-scoped)

### GET `/api/curricula/{id}/blacklists`
Returns assigned blacklists and all available blacklists in the faculty.

**Response:**
```json
{
  "availableBlacklists": [
    {
      "id": "uuid",
      "name": "Restricted Electives",
      "description": "...",
      "courses": [
        { "id": "uuid", "code": "CS 499", "name": "...", "credits": 3, "description": "..." }
      ],
      "courseCount": 4,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "assignedBlacklists": [
    {
      "id": "pivot-uuid",
      "blacklistId": "uuid",
      "assignedAt": "...",
      "blacklist": {
        "id": "uuid",
        "name": "Restricted Electives",
        "description": "...",
        "courses": [ ... ],
        "courseCount": 4,
        "createdAt": "...",
        "updatedAt": "..."
      }
    }
  ],
  "stats": {
    "totalAvailable": 3,
    "totalAssigned": 1,
    "totalBlacklistedCourses": 4
  }
}
```

---

### POST `/api/curricula/{id}/blacklists`
Assign a blacklist to the curriculum.

**Request body:**
```json
{ "blacklistId": "uuid" }
```

**Response:**
```json
{
  "assignment": { "id": "pivot-uuid", "curriculum_id": "uuid", "blacklist_id": "uuid", ... },
  "message": "Blacklist \"Restricted Electives\" assigned successfully and is now effective for this curriculum"
}
```

**Error (409) — already assigned:**
```json
{ "error": "Blacklist is already assigned to this curriculum" }
```

---

### DELETE `/api/curricula/{id}/blacklists/{blacklistId}`
Remove a blacklist from the curriculum. `{blacklistId}` is the **blacklist's own id** (not the pivot id).

**Response:**
```json
{ "message": "Blacklist \"Restricted Electives\" removed successfully from curriculum" }
```

---

## 5. Curriculum-Level Constraints

These are high-level curriculum constraints such as banned course combinations, minimum GPA rules, credit thresholds, etc.

### GET `/api/curricula/{id}/constraints`

**Response:**
```json
{
  "success": true,
  "constraints": [
    {
      "id": "uuid",
      "curriculum_id": "uuid",
      "type": "CUSTOM",
      "name": "Banned: CSX 1001 + CSX 2005",
      "description": "Students cannot take CSX 1001 and CSX 2005 together",
      "is_required": true,
      "config": {
        "type": "banned_combination",
        "courses": [
          { "id": "uuid", "code": "CSX 1001", "name": "Introduction to CS" },
          { "id": "uuid", "code": "CSX 2005", "name": "Programming Fundamentals" }
        ]
      },
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

---

### POST `/api/curricula/{id}/constraints`
Create a curriculum-level constraint.

**Request body:**
```json
{
  "type": "CUSTOM",
  "name": "Banned: CSX 1001 + CSX 2005",
  "description": "Students cannot take CSX 1001 and CSX 2005 together",
  "isRequired": true,
  "config": {
    "type": "banned_combination",
    "courses": [
      { "id": "uuid", "code": "CSX 1001", "name": "Introduction to CS" },
      { "id": "uuid", "code": "CSX 2005", "name": "Programming Fundamentals" }
    ]
  }
}
```

**Supported `type` values:**

| Value | Description |
|-------|-------------|
| `CUSTOM` | Custom rule, e.g. banned course combination |
| `MINIMUM_GPA` | Minimum GPA requirement |
| `SENIOR_STANDING` | Senior standing requirement |
| `TOTAL_CREDITS` | Total credits threshold |
| `CATEGORY_CREDITS` | Category-specific credit requirement |

**Response (201):**
```json
{
  "success": true,
  "message": "Constraint created successfully",
  "constraint": { "id": "uuid", "type": "CUSTOM", "name": "...", "is_required": true, "config": { ... }, ... }
}
```

**Error (409) — duplicate:**
```json
{ "success": false, "message": "A constraint with this type and name already exists for this curriculum" }
```

**Error (422) — validation:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "type": ["The type field is required."],
    "name": ["The name field is required."]
  }
}
```

---

### DELETE `/api/curricula/{id}/constraints/{constraintId}`

**Response:**
```json
{ "success": true, "message": "Constraint deleted successfully" }
```

---

## 6. Curriculum Course Constraints

Per-course constraints scoped to a specific curriculum: **prerequisite overrides, corequisite overrides, and the three boolean flags**.

> **Note:** `{curriculumCourseId}` is the **`curriculum_courses.id`** (the pivot/link row id), NOT the `course.id`.

---

### 6a. GET Constraints for a Curriculum Course

**GET** `/api/curricula/{curriculumId}/courses/{curriculumCourseId}/constraints`

Returns the base (course-level) flags, the per-curriculum override flags, the merged effective values, and both base and curriculum-scoped prerequisite/corequisite lists.

**Response:**
```json
{
  "success": true,
  "curriculumCourse": {
    "id": "cc-uuid",
    "curriculumId": "curriculum-uuid",
    "courseId": "course-uuid",
    "courseCode": "CS 301",
    "courseName": "Data Structures"
  },
  "baseFlags": {
    "requiresPermission": false,
    "summerOnly": false,
    "requiresSeniorStanding": false,
    "minCreditThreshold": null
  },
  "overrideFlags": {
    "overrideRequiresPermission": null,
    "overrideSummerOnly": null,
    "overrideRequiresSeniorStanding": null,
    "overrideMinCreditThreshold": null
  },
  "mergedFlags": {
    "requiresPermission": false,
    "summerOnly": false,
    "requiresSeniorStanding": false,
    "minCreditThreshold": null
  },
  "basePrerequisites": [
    { "courseId": "uuid", "code": "CS 201", "name": "Intro to Programming" }
  ],
  "baseCorequisites": [
    { "courseId": "uuid", "code": "CS 302", "name": "Algorithms Lab" }
  ],
  "curriculumPrerequisites": [
    {
      "id": "relation-uuid",
      "curriculumCourseId": "cc-uuid",
      "courseId": "course-uuid",
      "code": "CS 201",
      "name": "Intro to Programming",
      "credits": 3
    }
  ],
  "curriculumCorequisites": [
    {
      "id": "relation-uuid",
      "curriculumCourseId": "cc-uuid",
      "courseId": "course-uuid",
      "code": "CS 302",
      "name": "Algorithms Lab",
      "credits": 1
    }
  ]
}
```

---

### 6b. PUT Override Flags

**PUT** `/api/curricula/{curriculumId}/courses/{curriculumCourseId}/constraints`

Override the three course flags (chairperson approval, summer course, senior standing) and/or credit threshold **for this curriculum only**. Pass `null` to clear an override and fall back to the course-level default.

#### Flag Reference

| Flag | Meaning |
|------|---------|
| `overrideRequiresPermission` | Chairperson approval required before a student can register |
| `overrideSummerOnly` | Course is only offered in summer term |
| `overrideRequiresSeniorStanding` | Student must have senior standing to enroll |
| `overrideMinCreditThreshold` | Minimum total earned credits before enrollment |

**Request body (all optional — omit fields you don't want to change):**
```json
{
  "overrideRequiresPermission": true,
  "overrideSummerOnly": false,
  "overrideRequiresSeniorStanding": null,
  "overrideMinCreditThreshold": 90
}
```

**Response:**
```json
{
  "success": true,
  "message": "Constraint overrides updated successfully",
  "overrides": {
    "overrideRequiresPermission": true,
    "overrideSummerOnly": false,
    "overrideRequiresSeniorStanding": null,
    "overrideMinCreditThreshold": 90
  }
}
```

---

### 6c. Prerequisites

#### POST — Add a prerequisite
**POST** `/api/curricula/{curriculumId}/courses/{curriculumCourseId}/prerequisites`

`targetCurriculumCourseId` is the `curriculum_courses.id` of the course that must be taken **before** the target course.

**Request body:**
```json
{ "targetCurriculumCourseId": "cc-uuid-of-prerequisite" }
```

**Response:**
```json
{
  "success": true,
  "message": "Prerequisite added successfully",
  "prerequisite": {
    "id": "relation-uuid",
    "curriculumCourseId": "cc-uuid",
    "courseId": "course-uuid",
    "code": "CS 201",
    "name": "Intro to Programming",
    "credits": 3
  }
}
```

**Error (400):** `{ "error": "Cannot add self as prerequisite" }`  
**Error (409):** `{ "error": "Prerequisite already exists" }`

---

#### DELETE — Remove a prerequisite
**DELETE** `/api/curricula/{curriculumId}/courses/{curriculumCourseId}/prerequisites/{relationId}`

`{relationId}` is the `id` from the `curriculumPrerequisites` array returned by the GET endpoint.

**Response:**
```json
{ "success": true, "message": "Prerequisite removed successfully" }
```

---

### 6d. Corequisites

> Corequisites are **bidirectional** — adding A→B automatically creates B→A. Removing one relation ID removes both directions.

#### POST — Add a corequisite
**POST** `/api/curricula/{curriculumId}/courses/{curriculumCourseId}/corequisites`

**Request body:**
```json
{ "targetCurriculumCourseId": "cc-uuid-of-corequisite" }
```

**Response:**
```json
{
  "success": true,
  "message": "Corequisite added successfully",
  "corequisite": {
    "id": "relation-uuid",
    "curriculumCourseId": "cc-uuid",
    "courseId": "course-uuid",
    "code": "CS 302",
    "name": "Algorithms Lab",
    "credits": 1
  }
}
```

**Error (400):** `{ "error": "Cannot add self as corequisite" }`  
**Error (409):** `{ "error": "Corequisite already exists" }`

---

#### DELETE — Remove a corequisite
**DELETE** `/api/curricula/{curriculumId}/courses/{curriculumCourseId}/corequisites/{relationId}`

Removes the relation in **both directions** atomically.

**Response:**
```json
{ "success": true, "message": "Corequisite removed successfully" }
```

---

## 7. Elective Rules

### GET `/api/curricula/{id}/elective-rules`

**Response:**
```json
{
  "electiveRules": [
    {
      "id": "uuid",
      "curriculum_id": "uuid",
      "category": "Free Electives",
      "required_credits": 6,
      "description": null,
      "created_at": "...",
      "updated_at": "..."
    }
  ],
  "courseCategories": ["Core", "Math", "Free Electives"],
  "curriculumCourses": [
    {
      "id": "course-uuid",
      "code": "CS 101",
      "name": "Intro to CS",
      "category": "Core",
      "credits": 3,
      "isRequired": true,
      "semester": "1",
      "year": 1
    }
  ]
}
```

---

### POST `/api/curricula/{id}/elective-rules`
Create a new elective rule for a category.

**Request body:**
```json
{
  "category": "Free Electives",
  "requiredCredits": 6,
  "description": "Choose any 6 credits of free electives"
}
```

| Field | Type | Required |
|-------|------|----------|
| `category` | string | ✅ |
| `requiredCredits` | integer ≥ 0 | ✅ |
| `description` | string | optional |

**Response (201):**
```json
{ "electiveRule": { "id": "uuid", "curriculum_id": "uuid", "category": "Free Electives", "required_credits": 6, ... } }
```

---

### PUT `/api/curricula/{id}/elective-rules/settings`
Batch-update free elective credits and/or toggle `isRequired` on individual courses.

**Request body (all optional):**
```json
{
  "freeElectiveCredits": 6,
  "freeElectiveName": "Free Electives",
  "courseRequirements": [
    { "courseId": "uuid", "isRequired": false },
    { "courseId": "uuid2", "isRequired": true }
  ]
}
```

**Response:**
```json
{
  "message": "Elective rules updated successfully",
  "updatesCount": 3
}
```

---

### PUT `/api/curricula/{id}/elective-rules/{rule}`
Update a single elective rule.

**Request body:**
```json
{
  "required_credits": 9,
  "description": "Updated description"
}
```

**Response:**
```json
{ "electiveRule": { ... } }
```

---

### DELETE `/api/curricula/{id}/elective-rules/{rule}`

**Response:**
```json
{ "message": "Elective rule deleted" }
```

---

## Authentication Notes

All endpoints require Sanctum session cookies:
```javascript
fetch(url, { credentials: 'include' })
```

Write endpoints (`POST`, `PUT`, `DELETE`) additionally require the authenticated user to have `role === 'CHAIRPERSON'`.

---

## Frontend Component Mapping

| Component | Endpoints used |
|-----------|---------------|
| `CurriculaList.tsx` | `GET /api/curricula` |
| `CurriculumDetail.tsx` | `GET /api/curricula/{id}` |
| `ConcentrationsTab.tsx` | `GET/POST/PUT/DELETE /api/curricula/{id}/concentrations` |
| `BlacklistsTab.tsx` | `GET/POST/DELETE /api/curricula/{id}/blacklists` |
| `ConstraintsTab.tsx` | `GET/POST/DELETE /api/curricula/{id}/constraints` |
| `CourseConstraintsPanel.tsx` | `GET/PUT /api/curricula/{id}/courses/{ccId}/constraints` |
| `PrerequisitesPanel.tsx` | `POST/DELETE /api/curricula/{id}/courses/{ccId}/prerequisites/{rel}` |
| `CorequisitesPanel.tsx` | `POST/DELETE /api/curricula/{id}/courses/{ccId}/corequisites/{rel}` |
| `ElectiveRulesTab.tsx` | `GET/POST/PUT/DELETE /api/curricula/{id}/elective-rules` |

## Endpoints

### 1. List All Constraints for a Curriculum
**GET** `/api/curricula/{id}/constraints`

Retrieves all constraints associated with a specific curriculum.

**Response:**
```json
{
  "success": true,
  "constraints": [
    {
      "id": "constraint-uuid",
      "curriculum_id": "curriculum-uuid",
      "type": "CUSTOM",
      "name": "Banned: CSX 1001 + CSX 2005",
      "description": "Students cannot take CSX 1001 and CSX 2005 together",
      "is_required": true,
      "config": {
        "type": "banned_combination",
        "courses": [
          {"id": "course-id-1", "code": "CSX 1001", "name": "Introduction to CS"},
          {"id": "course-id-2", "code": "CSX 2005", "name": "Programming Fundamentals"}
        ]
      },
      "created_at": "2025-12-30T10:00:00Z",
      "updated_at": "2025-12-30T10:00:00Z"
    }
  ]
}
```

---

### 2. Create a New Constraint
**POST** `/api/curricula/{id}/constraints`

Creates a new constraint for the specified curriculum.

**Request Body:**
```json
{
  "type": "CUSTOM",
  "name": "Banned: CSX 1001 + CSX 2005",
  "description": "Students cannot take CSX 1001 and CSX 2005 together",
  "isRequired": true,
  "config": {
    "type": "banned_combination",
    "courses": [
      {"id": "course-id-1", "code": "CSX 1001", "name": "Introduction to CS"},
      {"id": "course-id-2", "code": "CSX 2005", "name": "Programming Fundamentals"}
    ]
  }
}
```

**Constraint Types:**
- `MINIMUM_GPA` - Minimum GPA requirement
- `SENIOR_STANDING` - Senior standing requirement
- `TOTAL_CREDITS` - Total credit requirement
- `CATEGORY_CREDITS` - Category-specific credit requirement
- `CUSTOM` - Custom constraints (e.g., banned combinations)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Constraint created successfully",
  "constraint": {
    "id": "new-constraint-uuid",
    "curriculum_id": "curriculum-uuid",
    "type": "CUSTOM",
    "name": "Banned: CSX 1001 + CSX 2005",
    "description": "Students cannot take CSX 1001 and CSX 2005 together",
    "is_required": true,
    "config": {...},
    "created_at": "2025-12-30T10:00:00Z",
    "updated_at": "2025-12-30T10:00:00Z"
  }
}
```

**Error Response (409) - Duplicate:**
```json
{
  "success": false,
  "message": "A constraint with this type and name already exists for this curriculum"
}
```

**Error Response (422) - Validation:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "type": ["The type field is required."],
    "name": ["The name field is required."]
  }
}
```

---

### 3. Delete a Constraint
**DELETE** `/api/curricula/{id}/constraints/{constraintId}`

Removes a specific constraint from the curriculum.

**Success Response:**
```json
{
  "success": true,
  "message": "Constraint deleted successfully"
}
```

**Error Response (404):**
```json
{
  "message": "No query results for model [App\\Models\\CurriculumConstraint]."
}
```

---

## Usage Examples

### Example 1: Create a Banned Combination Constraint
```javascript
const response = await fetch(`${API_BASE}/curricula/${curriculumId}/constraints`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    type: 'CUSTOM',
    name: 'Banned: CSX 3001 + CSX 3002',
    description: 'Students cannot take CSX 3001 and CSX 3002 together due to scheduling conflicts',
    isRequired: true,
    config: {
      type: 'banned_combination',
      courses: [
        { id: 'course-1-id', code: 'CSX 3001', name: 'Advanced Algorithms' },
        { id: 'course-2-id', code: 'CSX 3002', name: 'Data Structures II' }
      ]
    }
  }),
});
```

### Example 2: Create a Minimum GPA Constraint
```javascript
const response = await fetch(`${API_BASE}/curricula/${curriculumId}/constraints`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    type: 'MINIMUM_GPA',
    name: 'Minimum GPA for Major Courses',
    description: 'Students must maintain a minimum 2.5 GPA in major courses',
    isRequired: true,
    config: {
      minimum_gpa: 2.5,
      applies_to: 'major_courses'
    }
  }),
});
```

### Example 3: List All Constraints
```javascript
const response = await fetch(`${API_BASE}/curricula/${curriculumId}/constraints`, {
  credentials: 'include',
});
const data = await response.json();
console.log('Constraints:', data.constraints);
```

### Example 4: Delete a Constraint
```javascript
const response = await fetch(
  `${API_BASE}/curricula/${curriculumId}/constraints/${constraintId}`,
  {
    method: 'DELETE',
    credentials: 'include',
  }
);
```

---

## Database Schema

The `curriculum_constraints` table:
```
- id (string, primary key)
- curriculum_id (string, foreign key -> curricula.id)
- type (enum: MINIMUM_GPA, SENIOR_STANDING, TOTAL_CREDITS, CATEGORY_CREDITS, CUSTOM)
- name (string, max 255 characters)
- description (text, nullable)
- is_required (boolean, default true)
- config (json, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

**Unique Constraint:** `[curriculum_id, type, name]`

---

## Authentication
All endpoints require authentication via Laravel Sanctum. Include credentials in requests:
```javascript
fetch(url, { credentials: 'include' })
```

---

## Frontend Integration
These endpoints are used by `ConstraintsTab.tsx` in the course-audit frontend to manage curriculum-specific constraints like banned course combinations.
