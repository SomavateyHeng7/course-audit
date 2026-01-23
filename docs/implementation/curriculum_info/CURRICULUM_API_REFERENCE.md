# Curriculum API Reference for Graduation Portal Frontend

> **Complete API Reference for Curriculum Progress Checking**  
> Last Updated: January 23, 2026

---

## Table of Contents

1. [Public APIs (No Auth Required)](#public-apis-no-auth-required)
2. [Curriculum Data APIs (Sanctum Auth)](#curriculum-data-apis-sanctum-auth)
3. [Credit Pool APIs](#credit-pool-apis)
4. [Course Type APIs](#course-type-apis)
5. [Elective Rules APIs](#elective-rules-apis)
6. [Curriculum Constraints APIs](#curriculum-constraints-apis)
7. [Course Constraints (Prerequisites/Corequisites)](#course-constraints-prerequisitescorequisites)
8. [Blacklist APIs](#blacklist-apis)
9. [Graduation Portal Submission & Validation](#graduation-portal-submission--validation)
10. [Data Models & Types](#data-models--types)
11. [Validation Logic Flow](#validation-logic-flow)

---

## Public APIs (No Auth Required)

These endpoints are publicly accessible for students using the graduation portal.

### 1. Get All Active Curricula
```
GET /api/public-curricula
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `faculty_id` | UUID | Filter by faculty |
| `department_id` | UUID | Filter by department |
| `year` | string | Filter by curriculum year |
| `curriculum_id` | UUID | Get specific curriculum |

**Response:**
```json
{
  "curricula": [
    {
      "id": "uuid",
      "name": "2022 BSCS (For 653 onward)",
      "year": "2022",
      "version": "1.0",
      "description": "For students batch 653 onwards",
      "totalCreditsRequired": 139,
      "startId": "653",
      "endId": null,
      "department": { "id": "uuid", "name": "Computer Science", "code": "CS" },
      "faculty": { "id": "uuid", "name": "Faculty of Science", "code": "SCI" },
      "curriculumConstraints": [...],
      "electiveRules": [...],
      "curriculumCourses": [
        {
          "id": "uuid",
          "curriculumId": "uuid",
          "courseId": "uuid",
          "isRequired": true,
          "semester": 1,
          "year": 1,
          "position": 1,
          "requiresPermission": false,
          "summerOnly": false,
          "requiresSeniorStanding": false,
          "minCreditThreshold": null,
          "course": {
            "id": "uuid",
            "code": "CS 101",
            "name": "Introduction to Computing",
            "credits": 3,
            "creditHours": "3-0-6",
            "description": "...",
            "category": "Core",
            "prerequisites": ["MATH 101"],
            "corequisites": []
          }
        }
      ]
    }
  ]
}
```

### 2. Get Single Curriculum Details
```
GET /api/public-curricula/{id}
```

**Response:** Same structure as single item in array above.

### 3. Get Curriculum Blacklists
```
GET /api/public-curricula/{id}/blacklists
```

**Response:**
```json
{
  "blacklists": [
    {
      "id": "uuid",
      "name": "Database Electives",
      "description": "Choose only one from this group",
      "createdAt": "2026-01-15T10:00:00Z",
      "courses": [
        { "course": { "code": "CS 301", "name": "Database Systems I" } },
        { "course": { "code": "CS 302", "name": "Database Systems II" } }
      ]
    }
  ]
}
```

### 4. Get Faculties
```
GET /api/public-faculties
```

**Response:**
```json
{
  "faculties": [
    { "id": "uuid", "name": "Faculty of Science", "code": "SCI" }
  ]
}
```

### 5. Get Departments
```
GET /api/public-departments
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `faculty_id` | UUID | Filter by faculty |

**Response:**
```json
{
  "departments": [
    { "id": "uuid", "name": "Computer Science", "code": "CS", "facultyId": "uuid" }
  ]
}
```

### 6. Get Concentrations
```
GET /api/public-concentrations
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `department_id` | UUID | Filter by department |
| `curriculum_id` | UUID | Filter by curriculum |

---

## Curriculum Data APIs (Sanctum Auth)

### 1. List Curricula (Paginated)
```
GET /api/curricula
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `departmentId` | UUID | Filter by department |
| `limit` / `perPage` | int | Items per page (default: 10) |
| `page` | int | Page number |
| `search` | string | Search by name/year/version |

**Response:**
```json
{
  "curricula": [
    {
      "id": "uuid",
      "name": "2022 BSCS",
      "year": "2022",
      "version": "1.0",
      "department": { "id": "uuid", "name": "CS", "code": "CS" },
      "faculty": { "id": "uuid", "name": "Science", "code": "SCI" },
      "_count": {
        "curriculumCourses": 45,
        "curriculumConstraints": 5,
        "electiveRules": 8
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

### 2. Get Single Curriculum (Full Details)
```
GET /api/curricula/{id}
```

**Response:**
```json
{
  "curriculum": {
    "id": "uuid",
    "name": "2022 BSCS",
    "year": "2022",
    "version": "1.0",
    "description": "...",
    "total_credits_required": 139,
    "department": {...},
    "faculty": {...},
    "curriculumCourses": [...],
    "curriculumConcentrations": [...],
    "curriculumBlacklists": [...],
    "curriculumConstraints": [...],
    "electiveRules": [...]
  }
}
```

### 3. Get Curriculum Elective Rules
```
GET /api/curricula/{id}/elective-rules
```

**Response:**
```json
{
  "electiveRules": [
    {
      "id": "uuid",
      "curriculum_id": "uuid",
      "category": "Major Elective",
      "required_credits": 15,
      "description": "Choose 15 credits from major electives"
    }
  ],
  "courseCategories": ["Core", "Major Elective", "Free Elective", "GE"],
  "curriculumCourses": [
    {
      "id": "uuid",
      "code": "CS 101",
      "name": "Intro to Computing",
      "category": "Core",
      "credits": 3,
      "isRequired": true,
      "semester": 1,
      "year": 1
    }
  ]
}
```

### 4. Get Curriculum Concentrations
```
GET /api/curricula/{id}/concentrations
```

**Response:**
```json
{
  "concentrations": [
    {
      "id": "uuid",
      "name": "Data Science",
      "description": "Focus on data analysis and ML",
      "required_credits": 12,
      "courses": [...]
    }
  ]
}
```

### 5. Get Curriculum Blacklists
```
GET /api/curricula/{id}/blacklists
```

---

## Credit Pool APIs

Credit pools define **category-based credit requirements** with sub-categories.

### 1. Get All Credit Pools for Curriculum
```
GET /api/curricula/{curriculumId}/credit-pools
```

**Response:**
```json
{
  "pools": [
    {
      "id": "uuid",
      "curriculumId": "uuid",
      "name": "Core Requirements",
      "topLevelCourseTypeId": "uuid",
      "topLevelCourseTypeColor": "#6366f1",
      "enabled": true,
      "subCategories": [
        {
          "id": "uuid",
          "poolId": "uuid",
          "courseTypeId": "uuid",
          "courseTypeName": "Core Mathematics",
          "courseTypeColor": "#3b82f6",
          "requiredCredits": 12,
          "attachedCourses": [
            {
              "id": "uuid",
              "courseId": "uuid",
              "code": "MATH 101",
              "name": "Calculus I",
              "credits": 3,
              "attachedAt": "2026-01-15T10:00:00Z"
            }
          ],
          "attachedCredits": 12
        }
      ],
      "totalRequiredCredits": 45,
      "totalAttachedCredits": 42
    }
  ]
}
```

### 2. Create Credit Pool
```
POST /api/curricula/{curriculumId}/credit-pools
```

**Body:**
```json
{
  "name": "Major Requirements",
  "topLevelCourseTypeId": "uuid",
  "enabled": true,
  "subCategories": [
    {
      "courseTypeId": "uuid",
      "requiredCredits": 15
    }
  ]
}
```

### 3. Update Credit Pool
```
PUT /api/curricula/{curriculumId}/credit-pools/{poolId}
```

### 4. Delete Credit Pool
```
DELETE /api/curricula/{curriculumId}/credit-pools/{poolId}
```

### 5. Add Sub-Category
```
POST /api/curricula/{curriculumId}/credit-pools/{poolId}/sub-categories
```

### 6. Attach Courses to Sub-Category
```
POST /api/curricula/{curriculumId}/credit-pools/sub-categories/{subCatId}/attach-courses
```

**Body:**
```json
{
  "courseIds": ["uuid1", "uuid2"]
}
```

### 7. Detach Course
```
DELETE /api/curricula/{curriculumId}/credit-pools/attachments/{attachmentId}
```

---

## Course Type APIs

Course types define **categories** for courses (e.g., Core, Elective, GE).

### 1. List Course Types
```
GET /api/course-types
```

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `departmentId` | UUID | Filter by department |

**Response:**
```json
{
  "courseTypes": [
    {
      "id": "uuid",
      "name": "Core",
      "color": "#3b82f6",
      "departmentId": "uuid",
      "seeded": false,
      "createdAt": "2026-01-10T10:00:00Z",
      "updatedAt": "2026-01-10T10:00:00Z"
    }
  ],
  "seeded": true,
  "total": 8
}
```

### 2. Create Course Type
```
POST /api/course-types
```

**Body:**
```json
{
  "name": "Major Elective",
  "color": "#10b981",
  "departmentId": "uuid"
}
```

### 3. Update Course Type
```
PUT /api/course-types/{id}
```

### 4. Delete Course Type
```
DELETE /api/course-types/{id}
```

### 5. Bulk Assign Courses to Type
```
POST /api/course-types/assign
```

**Body:**
```json
{
  "courseIds": ["uuid1", "uuid2"],
  "courseTypeId": "uuid",
  "departmentId": "uuid"
}
```

---

## Elective Rules APIs

Elective rules define **minimum credit requirements per category**.

### 1. Get Elective Rules
```
GET /api/curricula/{curriculumId}/elective-rules
```

### 2. Create Elective Rule
```
POST /api/curricula/{curriculumId}/elective-rules
```

**Body:**
```json
{
  "category": "Free Elective",
  "requiredCredits": 6,
  "description": "Any 6 credits from outside major"
}
```

### 3. Update Elective Rule
```
PUT /api/curricula/{curriculumId}/elective-rules/{ruleId}
```

### 4. Delete Elective Rule
```
DELETE /api/curricula/{curriculumId}/elective-rules/{ruleId}
```

### 5. Update Elective Settings (Bulk)
```
PUT /api/curricula/{curriculumId}/elective-rules/settings
```

**Body:**
```json
{
  "freeElectiveCredits": 6,
  "freeElectiveName": "Free Electives",
  "courseRequirements": [
    { "courseId": "uuid", "isRequired": true }
  ]
}
```

---

## Curriculum Constraints APIs

Constraints define **graduation rules** beyond credit counts.

### 1. Get All Constraints
```
GET /api/curricula/{id}/constraints
```

**Response:**
```json
{
  "success": true,
  "constraints": [
    {
      "id": "uuid",
      "curriculum_id": "uuid",
      "type": "CUSTOM",
      "name": "Banned: CS 301 + CS 302",
      "description": "Cannot take both courses",
      "is_required": true,
      "config": {
        "type": "banned_combination",
        "courses": [
          { "id": "uuid", "code": "CS 301", "name": "..." },
          { "id": "uuid", "code": "CS 302", "name": "..." }
        ]
      }
    }
  ]
}
```

### 2. Create Constraint
```
POST /api/curricula/{id}/constraints
```

**Body:**
```json
{
  "type": "CUSTOM",
  "name": "Banned: CSX 1001 + CSX 2005",
  "description": "Students cannot take both",
  "isRequired": true,
  "config": {
    "type": "banned_combination",
    "courses": [
      { "id": "uuid", "code": "CSX 1001", "name": "..." },
      { "id": "uuid", "code": "CSX 2005", "name": "..." }
    ]
  }
}
```

**Constraint Types:**
| Type | Description |
|------|-------------|
| `MINIMUM_GPA` | Minimum GPA required |
| `SENIOR_STANDING` | Course requires senior standing |
| `TOTAL_CREDITS` | Minimum total credits |
| `CATEGORY_CREDITS` | Minimum credits in category |
| `CUSTOM` | Custom constraint with config |

### 3. Delete Constraint
```
DELETE /api/curricula/{id}/constraints/{constraintId}
```

---

## Course Constraints (Prerequisites/Corequisites)

These are **per-course constraints** within a curriculum.

### 1. Get Course Constraints
```
GET /api/curricula/{curriculumId}/courses/{curriculumCourseId}/constraints
```

**Response:**
```json
{
  "success": true,
  "curriculumCourse": {
    "id": "uuid",
    "curriculumId": "uuid",
    "courseId": "uuid",
    "courseCode": "CS 301",
    "courseName": "Database Systems"
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
    "overrideRequiresSeniorStanding": true,
    "overrideMinCreditThreshold": 60
  },
  "mergedFlags": {
    "requiresPermission": false,
    "summerOnly": false,
    "requiresSeniorStanding": true,
    "minCreditThreshold": 60
  },
  "basePrerequisites": [
    { "courseId": "uuid", "code": "CS 201", "name": "Data Structures" }
  ],
  "baseCorequisites": [],
  "curriculumPrerequisites": [
    {
      "id": "uuid",
      "curriculumCourseId": "uuid",
      "courseId": "uuid",
      "code": "CS 201",
      "name": "Data Structures",
      "credits": 3
    }
  ],
  "curriculumCorequisites": []
}
```

### 2. Update Course Override Flags
```
PUT /api/curricula/{curriculumId}/courses/{curriculumCourseId}/constraints
```

**Body:**
```json
{
  "overrideRequiresPermission": true,
  "overrideSummerOnly": false,
  "overrideRequiresSeniorStanding": true,
  "overrideMinCreditThreshold": 60
}
```

### 3. Add Prerequisite
```
POST /api/curricula/{curriculumId}/courses/{curriculumCourseId}/prerequisites
```

**Body:**
```json
{
  "targetCurriculumCourseId": "uuid"
}
```

### 4. Remove Prerequisite
```
DELETE /api/curricula/{curriculumId}/courses/{curriculumCourseId}/prerequisites/{relationId}
```

### 5. Add Corequisite
```
POST /api/curricula/{curriculumId}/courses/{curriculumCourseId}/corequisites
```

**Body:**
```json
{
  "targetCurriculumCourseId": "uuid"
}
```

### 6. Remove Corequisite
```
DELETE /api/curricula/{curriculumId}/courses/{curriculumCourseId}/corequisites/{relationId}
```

---

## Blacklist APIs

Blacklists define **mutually exclusive course groups**.

### 1. List All Blacklists
```
GET /api/blacklists
```

**Response:**
```json
{
  "blacklists": [
    {
      "id": "uuid",
      "name": "Database Electives",
      "description": "Choose only one",
      "courses": [
        { "id": "uuid", "code": "CS 301", "name": "..." },
        { "id": "uuid", "code": "CS 302", "name": "..." }
      ]
    }
  ]
}
```

### 2. Create Blacklist
```
POST /api/blacklists
```

### 3. Attach Blacklist to Curriculum
```
POST /api/curricula/{id}/blacklists
```

**Body:**
```json
{
  "blacklistId": "uuid"
}
```

### 4. Remove Blacklist from Curriculum
```
DELETE /api/curricula/{id}/blacklists/{blacklistId}
```

---

## Graduation Portal Submission & Validation

### 1. Submit Courses (PIN-Auth)
```
POST /api/graduation-portals/{portalId}/submit
```

**Headers:**
```
X-Graduation-Session-Token: {token_from_pin_verification}
```

**Body:**
```json
{
  "student_identifier": "John Doe - 6512345",
  "curriculum_id": "uuid",
  "courses": [
    {
      "code": "CS 101",
      "name": "Introduction to Computing",
      "credits": 3,
      "grade": "A",
      "status": "completed",
      "semester": "1/2024",
      "category": "Core"
    },
    {
      "code": "CS 401",
      "name": "Senior Project I",
      "credits": 3,
      "grade": null,
      "status": "in_progress",
      "semester": "2/2025"
    },
    {
      "code": "CS 402",
      "name": "Senior Project II",
      "credits": 3,
      "grade": null,
      "status": "planned",
      "semester": "1/2026"
    }
  ],
  "metadata": {
    "file_name": "transcript.xlsx",
    "parsed_at": "2026-01-23T10:00:00Z"
  }
}
```

### 2. Validate Submission (CP/Advisor Auth)
```
POST /api/graduation-portals/{portalId}/cache-submissions/{submissionId}/validate
```

**Response:**
```json
{
  "message": "Validation completed",
  "submission": {
    "id": "uuid",
    "status": "has_issues",
    "validation_result": {
      "valid": false,
      "canGraduate": false,
      "summary": {
        "totalCreditsRequired": 139,
        "creditsCompleted": 85,
        "creditsInProgress": 12,
        "creditsPlanned": 42,
        "completionPercentage": 61.2,
        "gpa": 3.45,
        "coursesMatched": 42,
        "coursesUnmatched": 3
      },
      "categoryProgress": {
        "Core": {
          "name": "Core",
          "creditsRequired": 45,
          "creditsCompleted": 40,
          "creditsInProgress": 3,
          "creditsPlanned": 0,
          "coursesCompleted": 12,
          "coursesInProgress": 1,
          "coursesPlanned": 0,
          "percentComplete": 88.9,
          "isComplete": false
        },
        "Major Elective": {
          "name": "Major Elective",
          "creditsRequired": 15,
          "creditsCompleted": 9,
          "creditsInProgress": 3,
          "creditsPlanned": 3,
          "percentComplete": 60,
          "isComplete": false
        }
      },
      "requirements": {
        "totalCredits": {
          "name": "Total Credits",
          "required": 139,
          "current": 85,
          "met": false,
          "message": "Need 54 more credits"
        },
        "gpa": {
          "name": "Minimum GPA",
          "required": 2.0,
          "current": 3.45,
          "met": true,
          "message": "GPA of 3.45 meets minimum 2.0"
        },
        "noErrors": {
          "name": "No Validation Errors",
          "required": 0,
          "current": 2,
          "met": false,
          "message": "2 validation error(s) found"
        }
      },
      "errors": [
        "Missing prerequisite: CS301 requires CS201 to be completed first",
        "Missing 5 credits for Core requirement"
      ],
      "warnings": [
        "Course XYZ999 not found in curriculum",
        "Planned course CS401 requires prerequisite CS301"
      ],
      "matchedCourses": [...],
      "unmatchedCourses": [
        {
          "code": "XYZ999",
          "name": "Unknown Course",
          "credits": 3,
          "reason": "Not in curriculum"
        }
      ]
    }
  }
}
```

### 3. Batch Validate (CP/Advisor Auth)
```
POST /api/graduation-submissions/batch-validate
```

**Body:**
```json
{
  "submission_ids": ["uuid1", "uuid2", "uuid3"]
}
```

---

## Data Models & Types

### Course Status Types
```typescript
type CourseStatus = "completed" | "in_progress" | "planned" | "failed" | "withdrawn";
```

### Grade to Status Mapping
| Grade | Status |
|-------|--------|
| A, A-, B+, B, B-, C+, C, C-, D+, D, D-, S, P | `completed` |
| F | `failed` |
| W | `withdrawn` |
| IP, IN_PROGRESS, TAKING, CURRENT | `in_progress` |
| PLANNED, FUTURE, -, (empty) | `planned` |

### Grade Points (for GPA Calculation)
```typescript
const GRADE_POINTS = {
  'A': 4.0,  'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0
};

// S, U, P, W, I, IP are NOT included in GPA calculation
```

### Constraint Config Types
```typescript
interface ConstraintConfig {
  // For min_credits type
  type: 'min_credits';
  min_credits: number;
  category?: string;
}

interface ConstraintConfig {
  // For required_course type
  type: 'required_course';
  course_code: string;
}

interface ConstraintConfig {
  // For banned_combination type
  type: 'banned_combination';
  courses: Array<{ id: string; code: string; name: string }>;
}
```

### Validation Result Structure
```typescript
interface ValidationResult {
  valid: boolean;
  canGraduate: boolean;
  summary: {
    totalCreditsRequired: number;
    creditsCompleted: number;
    creditsInProgress: number;
    creditsPlanned: number;
    completionPercentage: number;
    gpa: number;
    coursesMatched: number;
    coursesUnmatched: number;
  };
  categoryProgress: Record<string, CategoryProgress>;
  requirements: Record<string, RequirementStatus>;
  errors: string[];
  warnings: string[];
  matchedCourses: MatchedCourse[];
  unmatchedCourses: UnmatchedCourse[];
}

interface CategoryProgress {
  name: string;
  creditsRequired: number;
  creditsCompleted: number;
  creditsInProgress: number;
  creditsPlanned: number;
  coursesCompleted: number;
  coursesInProgress: number;
  coursesPlanned: number;
  percentComplete: number;
  isComplete: boolean;
}

interface RequirementStatus {
  name: string;
  required: number;
  current: number;
  met: boolean;
  message: string;
}
```

---

## Validation Logic Flow

The backend validation follows this sequence:

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. MATCH COURSES TO CURRICULUM                                  │
│    • Compare submitted course codes to curriculum courses       │
│    • Track matched vs unmatched courses                         │
│    • Warn about credit mismatches                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. VALIDATE CONSTRAINTS                                         │
│    • Check min_credits per category                             │
│    • Check required_course completion                           │
│    • Skip GPA check (handled in requirements)                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. VALIDATE ELECTIVE RULES                                      │
│    • Check each category has minimum required credits           │
│    • Only count completed courses                               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. VALIDATE BLACKLISTS                                          │
│    • Check no student has taken multiple courses from           │
│      the same blacklist group                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. VALIDATE PREREQUISITES & COREQUISITES                        │
│    • For completed/in_progress: prereqs must be completed       │
│    • For completed/in_progress: coreqs must be at least taken   │
│    • For planned: only warn about missing prereqs               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. CALCULATE CATEGORY PROGRESS                                  │
│    • Group courses by category                                  │
│    • Sum credits by status (completed, in_progress, planned)    │
│    • Compare against elective rules                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. CALCULATE GPA                                                │
│    • Only completed courses with letter grades                  │
│    • Exclude S/U, P/F, W, I, IP grades                          │
│    • Weighted by credits                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. EVALUATE GRADUATION REQUIREMENTS                             │
│    • Total credits >= required                                  │
│    • GPA >= minimum (2.0)                                       │
│    • All category requirements met                              │
│    • No critical errors                                         │
│    → canGraduate = ALL requirements met                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Reference: Key Endpoints

### For Student Submission Flow
| Step | Endpoint | Purpose |
|------|----------|---------|
| 1 | `GET /api/public/graduation-portals` | List active portals |
| 2 | `POST /api/public/graduation-portals/{id}/verify-pin` | Get session token |
| 3 | `GET /api/public/graduation-portals/{id}/curricula` | Get available curricula |
| 4 | `POST /api/graduation-portals/{id}/submit` | Submit courses |

### For CP/Advisor Review
| Step | Endpoint | Purpose |
|------|----------|---------|
| 1 | `GET /api/graduation-portals/{id}/cache-submissions` | List submissions |
| 2 | `GET /api/graduation-portals/{id}/cache-submissions/{subId}` | View details |
| 3 | `POST /api/graduation-portals/{id}/cache-submissions/{subId}/validate` | Run validation |
| 4 | `POST /api/graduation-portals/{id}/cache-submissions/{subId}/approve` | Approve |
| 5 | `POST /api/graduation-portals/{id}/cache-submissions/{subId}/reject` | Reject |

### For Curriculum Data (Frontend Display)
| Purpose | Endpoint |
|---------|----------|
| Full curriculum with courses | `GET /api/public-curricula/{id}` |
| Elective rules | `GET /api/curricula/{id}/elective-rules` |
| Credit pools (structured) | `GET /api/curricula/{id}/credit-pools` |
| Course constraints | `GET /api/curricula/{currId}/courses/{courseId}/constraints` |
| Curriculum constraints | `GET /api/curricula/{id}/constraints` |
| Blacklists | `GET /api/curricula/{id}/blacklists` |

---

## Notes for Frontend Implementation

1. **Course Categories**: Categories come from `departmentCourseTypes` linked to courses, matched by curriculum ID.

2. **Prerequisites Priority**: Curriculum-level prerequisites override base course prerequisites.

3. **Grade is Optional**: Planned and in-progress courses may not have grades.

4. **Credit Pools vs Elective Rules**: 
   - Elective Rules = simple category → required credits
   - Credit Pools = hierarchical (pool → sub-categories → attached courses)

5. **Validation Timing**: Validation happens server-side after submission. Frontend should only do basic parsing/validation.

6. **PDPA Compliance**: Submissions expire in 30 minutes. No permanent student data storage.
