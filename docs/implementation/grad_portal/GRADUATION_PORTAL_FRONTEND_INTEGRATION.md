# Graduation Portal Backend - Frontend Integration Guide

> **For Frontend Development with Claude Opus**  
> Last Updated: January 21, 2026

---

## Overview

The Laravel backend now supports PDPA-compliant graduation portal functionality. This document provides all the information needed to implement the frontend.

---

## Complete Submission Wizard Flow

This section provides the complete step-by-step flow for the student submission wizard.

### Visual Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Select Portal                                                      │
│  ───────────────────                                                        │
│  • Fetch active portals: GET /api/public/graduation-portals                 │
│  • Display portal cards with name, deadline, department                     │
│  • User clicks a portal → store portalId in state                          │
│  • Navigate to Step 2                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Enter PIN                                                          │
│  ─────────────────                                                          │
│  • Show PIN input field                                                     │
│  • On submit: POST /api/public/graduation-portals/{portalId}/verify-pin     │
│    Body: { "pin": "USER_INPUT" }                                            │
│  • On SUCCESS:                                                              │
│    - Store sessionToken from response.session.token                         │
│    - Store expiresAt from response.session.expires_at                       │
│    - Navigate to Step 3                                                     │
│  • On ERROR (401): Show "Invalid PIN", display attempts_remaining           │
│  • On ERROR (429): Show "Rate limited", display retry_after countdown       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Select Curriculum                                                  │
│  ─────────────────────────                                                  │
│  • Fetch curricula: GET /api/public/graduation-portals/{portalId}/curricula │
│  • IF total > 0:                                                            │
│    - Display curriculum cards (name, year, credits required)                │
│    - Pre-select the one with is_default: true                               │
│    - User selects curriculum → store curriculumId in state                  │
│  • IF total === 0 (no department on portal):                                │
│    - Fetch faculties: GET /api/public/faculties                             │
│    - User selects faculty                                                   │
│    - Fetch departments: GET /api/public/departments?faculty_id={id}         │
│    - User selects department                                                │
│    - Re-fetch curricula with filter: ?department_id={id}                    │
│    - User selects curriculum → store curriculumId in state                  │
│  • Navigate to Step 4                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Upload File                                                        │
│  ──────────────────                                                         │
│  • Show file upload zone (accept .xlsx, .xls, .csv)                         │
│  • On file select:                                                          │
│    - Parse file client-side (xlsx library for Excel, papaparse for CSV)     │
│    - Extract courses: code, name, credits, grade, semester                  │
│    - Map grades to status (A→completed, F→failed, IP→in_progress, etc.)     │
│    - Store parsedCourses in state                                           │
│  • Show parse summary: "Found 67 courses"                                   │
│  • Navigate to Step 5                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Preview & Confirm                                                  │
│  ────────────────────────                                                   │
│  • Show student identifier input (e.g., "John Doe - 6512345")               │
│  • Display selected curriculum name                                         │
│  • Display parsed courses in a table:                                       │
│    - Code | Name | Credits | Grade | Status                                 │
│  • Show summary: Total courses, by status (completed, in_progress, etc.)    │
│  • "Back" button to return to Step 4                                        │
│  • "Submit" button to proceed                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Submit                                                             │
│  ──────────────                                                             │
│  • POST /api/graduation-portals/{portalId}/submit                           │
│    Headers: { "X-Graduation-Session-Token": sessionToken }                  │
│    Body: {                                                                  │
│      "student_identifier": "John Doe - 6512345",                            │
│      "curriculum_id": curriculumId,                                         │
│      "courses": parsedCourses,                                              │
│      "metadata": { "file_name": "transcript.xlsx", "parsed_at": "..." }     │
│    }                                                                        │
│  • On SUCCESS (201):                                                        │
│    - Show confirmation with submission ID                                   │
│    - Show expiry countdown (30 minutes)                                     │
│    - Display message: "Your chairperson will review within 30 minutes"     │
│  • On ERROR (401): Session expired → redirect to Step 2                     │
│  • On ERROR (422): Validation error → show field errors                     │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7: Complete                                                           │
│  ───────────────                                                            │
│  • Show success message with submission details                             │
│  • Display: Submission ID, Expiry time, Selected curriculum                 │
│  • Inform: "Data will be automatically deleted after 30 minutes (PDPA)"    │
│  • Option: "Submit Another" → return to Step 1                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### State Management

Store these values throughout the wizard:

```typescript
interface WizardState {
  // Step 1
  portalId: string | null;
  portalName: string | null;
  
  // Step 2
  sessionToken: string | null;
  sessionExpiresAt: string | null;  // ISO datetime
  
  // Step 3
  curriculumId: string | null;
  curriculumName: string | null;
  
  // Step 4
  parsedCourses: Course[] | null;
  fileName: string | null;
  
  // Step 5
  studentIdentifier: string | null;
  
  // Step 6/7
  submissionId: string | null;
  submissionExpiresAt: string | null;
}
```

### Error Handling at Each Step

| Step | Error Code | User Action |
|------|------------|-------------|
| 2 | `INVALID_PIN` | Show error, display attempts remaining |
| 2 | `RATE_LIMITED` | Show countdown timer, disable input |
| 2 | `PORTAL_INACTIVE` | Show message, redirect to Step 1 |
| 3 | Network error | Retry button |
| 6 | `SESSION_EXPIRED` | Show message, redirect to Step 2 |
| 6 | `SESSION_TOKEN_MISSING` | Redirect to Step 2 |
| 6 | 422 validation | Show field-level errors, stay on Step 5 |

### Session Expiry Handling

```typescript
// Start countdown after PIN verification
useEffect(() => {
  if (!sessionExpiresAt) return;
  
  const interval = setInterval(() => {
    const remaining = new Date(sessionExpiresAt).getTime() - Date.now();
    
    if (remaining <= 0) {
      // Session expired
      clearInterval(interval);
      showToast("Session expired. Please re-enter PIN.");
      redirectToStep(2);
    } else if (remaining <= 60000) {
      // 1 minute warning
      showWarning("Session expires in less than 1 minute!");
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [sessionExpiresAt]);
```

---

## Authentication Flow

### Student Submission Flow (No Login Required)

```
1. Browse portals     → GET /api/public/graduation-portals
2. View portal        → GET /api/public/graduation-portals/{id}
3. Verify PIN         → POST /api/public/graduation-portals/{id}/verify-pin
                        Request: { "pin": "GRAD123ABC" }
                        Response: { "session": { "token": "xxx", "expires_in_minutes": 15 } }
4. Submit courses     → POST /api/graduation-portals/{id}/submit
                        Header: X-Graduation-Session-Token: {token}
                        Body: See payload format below
```

### Chairperson/Advisor Flow (Requires Sanctum Auth)

- All existing auth flow remains the same
- New endpoints under `/api/graduation-portals/...`

---

## API Endpoints

### Public Endpoints (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/public/graduation-portals` | List active portals |
| `GET` | `/api/public/graduation-portals/{id}` | Portal details |
| `POST` | `/api/public/graduation-portals/{id}/verify-pin` | Verify PIN, get session token |
| `GET` | `/api/public/graduation-portals/{id}/curricula` | Get curricula for portal's department |
| `GET` | `/api/public/faculties` | List all faculties (for curriculum selection) |
| `GET` | `/api/public/departments` | List departments (optionally filter by faculty_id) |

### Session-Authenticated Endpoints (Session Token in Header)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/graduation-portals/{id}/submit` | Submit courses for validation |

**Required Header:** `X-Graduation-Session-Token: {token}`

### Sanctum-Authenticated Endpoints (Chairperson/Advisor)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/graduation-portals/{id}/close` | Close portal |
| `POST` | `/api/graduation-portals/{id}/regenerate-pin` | Regenerate PIN |
| `GET` | `/api/graduation-portals/{id}/cache-submissions` | List cached submissions |
| `GET` | `/api/graduation-portals/{id}/cache-submissions/{subId}` | Get submission details |
| `POST` | `/api/graduation-portals/{id}/cache-submissions/{subId}/validate` | Validate submission |
| `POST` | `/api/graduation-portals/{id}/cache-submissions/{subId}/approve` | Approve submission |
| `POST` | `/api/graduation-portals/{id}/cache-submissions/{subId}/reject` | Reject submission |
| `GET` | `/api/graduation-portals/{id}/cache-submissions/{subId}/report` | Download report |
| `POST` | `/api/graduation-submissions/batch-validate` | Batch validate multiple |

---

## Curriculum Selection APIs

### Get Curricula for Portal

Returns all active curricula in the portal's department. If portal has no department, returns empty (use filters or faculty/department endpoints).

```
GET /api/public/graduation-portals/{portal_id}/curricula
GET /api/public/graduation-portals/{portal_id}/curricula?faculty_id={uuid}
GET /api/public/graduation-portals/{portal_id}/curricula?department_id={uuid}
```

**Response:**
```json
{
  "curricula": [
    {
      "id": "019b2d53-f1da-70ff-8814-38ddac90427c",
      "name": "2022 BSCS (For 653 onward)",
      "year": 2022,
      "version": null,
      "description": "For students batch 653 onwards",
      "total_credits_required": 139,
      "is_default": true,
      "department": {
        "id": "019b1831-1b79-70be-8daa-8e7347d72a47",
        "name": "Computer Science"
      },
      "faculty": {
        "id": "019b1830-fa12-7152-b0e1-f04e7c27af89",
        "name": "Faculty of Science"
      }
    },
    {
      "id": "019b2d57-2663-7168-bd9c-af91a0c14ddf",
      "name": "2022 BSCS (For 651-652)",
      "year": 2022,
      "version": null,
      "description": "For students batch 651-652",
      "total_credits_required": 139,
      "is_default": false,
      "department": {...},
      "faculty": {...}
    }
  ],
  "default_curriculum_id": "019b2d53-f1da-70ff-8814-38ddac90427c",
  "portal_department_id": "019b1831-1b79-70be-8daa-8e7347d72a47",
  "total": 2
}
```

### Get Faculties (for curriculum selection fallback)

Use when portal has no department assigned and student needs to select manually.

```
GET /api/public/faculties
```

**Response:**
```json
{
  "faculties": [
    { "id": "uuid", "name": "Faculty of Science" },
    { "id": "uuid", "name": "Faculty of Engineering" }
  ]
}
```

### Get Departments (filter by faculty)

```
GET /api/public/departments
GET /api/public/departments?faculty_id={uuid}
```

**Response:**
```json
{
  "departments": [
    { "id": "uuid", "name": "Computer Science", "faculty_id": "uuid" },
    { "id": "uuid", "name": "Information Technology", "faculty_id": "uuid" }
  ]
}
```

---

## Request/Response Formats

### Submission Payload Format

```typescript
// POST /api/graduation-portals/{id}/submit
// Header: X-Graduation-Session-Token: {token}

interface SubmissionPayload {
  student_identifier: string;  // "John Doe - 6512345"
  curriculum_id: string;       // UUID - SELECTED BY STUDENT
  courses: Course[];
  metadata?: {
    parsed_at?: string;
    file_name?: string;
    total_courses?: number;
  };
}

interface Course {
  code: string;        // "CS 101" - REQUIRED
  name?: string;       // "Introduction to Computing" - optional
  credits: number;     // 3 - REQUIRED
  grade?: string;      // "A", "B+", "IP", "P", "" or null - OPTIONAL (empty for planned courses)
  status: "completed" | "in_progress" | "planned" | "failed" | "withdrawn";  // REQUIRED
  semester?: string;   // "1/2024" - optional
  category?: string;   // "Core", "Major Elective" - optional
}
```

**IMPORTANT Backend Validation Notes:**
- `grade` field is OPTIONAL - planned courses won't have grades
- Backend should NOT require grade for all courses
- Validation should accept courses with any status (completed, in_progress, planned, etc.)
- The validation result should show:
  - Completion percentage
  - Credits completed vs required
  - Category progress
  - Rule errors (missing prerequisites, etc.)
  - Warnings for planned/in-progress courses
- This mirrors how the Student Progress page works - showing progress even if not all courses are taken

### Public Portal List Response

```json
{
  "portals": [
    {
      "id": "1",
      "name": "Graduation Check 2026",
      "description": "Submit your progress for graduation review",
      "batch": "2022",
      "deadline": "2026-02-15",
      "daysRemaining": 25,
      "acceptedFormats": [".xlsx", ".xls", ".csv"],
      "maxFileSizeMb": 5,
      "curriculum": {
        "id": "uuid",
        "name": "BSCS 2022",
        "year": 2022
      },
      "department": {
        "id": "uuid",
        "name": "Computer Science"
      }
    }
  ],
  "total": 1
}
```

### PIN Verification Request/Response

**Request:**
```json
{
  "pin": "GRAD123ABC"
}
```

**Success Response (200):**
```json
{
  "message": "PIN verified successfully",
  "session": {
    "token": "abc123def456...",
    "expires_in_minutes": 15,
    "expires_at": "2026-01-21T12:30:00Z"
  },
  "portal": {
    "id": "1",
    "name": "Graduation Check 2026",
    "curriculum_id": "uuid",
    "accepted_formats": [".xlsx", ".xls", ".csv"],
    "max_file_size_mb": 5
  }
}
```

**Error Response (401):**
```json
{
  "error": {
    "message": "Invalid PIN",
    "code": "INVALID_PIN",
    "attempts_remaining": 4
  }
}
```

**Rate Limited Response (429):**
```json
{
  "error": {
    "message": "Too many failed attempts. Please try again in 15 minutes.",
    "code": "RATE_LIMITED",
    "retry_after": 900
  }
}
```

### Submission Response

**Success (201):**
```json
{
  "message": "Submission received successfully",
  "submission": {
    "id": "uuid",
    "status": "pending",
    "expires_at": "2026-01-21T13:00:00Z",
    "course_count": 45
  }
}
```

### Validation Result Response

```json
{
  "message": "Validation completed",
  "submission": {
    "id": "uuid",
    "status": "validated",
    "validation_result": {
      "valid": true,
      "canGraduate": true,
      "summary": {
        "totalCreditsRequired": 120,
        "creditsCompleted": 118,
        "creditsInProgress": 6,
        "creditsPlanned": 3,
        "gpa": 3.45,
        "coursesMatched": 42,
        "coursesUnmatched": 3
      },
      "categoryProgress": {
        "Core": {
          "name": "Core",
          "creditsRequired": 45,
          "creditsCompleted": 45,
          "percentComplete": 100,
          "isComplete": true
        },
        "Major Elective": {
          "name": "Major Elective",
          "creditsRequired": 15,
          "creditsCompleted": 12,
          "percentComplete": 80,
          "isComplete": false
        }
      },
      "requirements": {
        "totalCredits": {
          "name": "Total Credits",
          "required": 120,
          "current": 118,
          "met": false,
          "message": "Need 2 more credits"
        },
        "gpa": {
          "name": "Minimum GPA",
          "required": 2.0,
          "current": 3.45,
          "met": true,
          "message": "GPA of 3.45 meets minimum 2.0"
        }
      },
      "errors": [],
      "warnings": ["Course CS 999 not found in curriculum"],
      "matchedCourses": [...],
      "unmatchedCourses": [...]
    }
  }
}
```

### Reject Submission Request

```json
{
  "reason": "Missing required internship course"
}
```

---

## Session Token Handling

### Storage
- Store the session token in memory or sessionStorage (NOT localStorage for security)
- Token expires in 15 minutes

### Usage
Add to all submission-related requests:
```typescript
headers: {
  'X-Graduation-Session-Token': sessionToken,
  'Content-Type': 'application/json'
}
```

### Expiry Handling
- Track `expires_at` from the response
- Show countdown to user
- On 401 with code `SESSION_EXPIRED`, redirect to PIN entry

---

## Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `SESSION_TOKEN_MISSING` | No token provided | Redirect to PIN entry |
| `SESSION_EXPIRED` | Token expired | Redirect to PIN entry |
| `SESSION_IP_MISMATCH` | IP changed | Redirect to PIN entry |
| `SESSION_PORTAL_MISMATCH` | Wrong portal | Show error |
| `PORTAL_INACTIVE` | Portal closed/expired | Show message |
| `INVALID_PIN` | Wrong PIN | Show attempts remaining |
| `RATE_LIMITED` | Too many attempts | Show wait time |
| `SUBMISSION_EXPIRED` | Submission data expired | Ask to resubmit |

---

## Frontend Components Needed

### Student Side

1. **Portal Browser Page**
   - List active portals with deadline countdown
   - Filter by department/batch
   - Show portal details

2. **PIN Entry Modal**
   - PIN input field
   - Show attempts remaining on failure
   - Handle rate limiting

3. **Curriculum Selection Step** ← NEW
   - Fetch curricula from `/api/public/graduation-portals/{id}/curricula`
   - If curricula returned, show selection cards/dropdown
   - If empty (portal has no department), show faculty → department → curriculum cascade
   - Highlight `is_default: true` curriculum if exists
   - Store selected `curriculum_id` for submission

4. **Submission Form**
   - Student identifier input
   - Show selected curriculum name (from step 3)
   - File upload (Excel/CSV)
   - File preview before submit

5. **File Parser Utility**
   - Parse Excel using `xlsx` library
   - Parse CSV using `papaparse`
   - Convert to JSON format
   - Validate required columns

6. **Submission Confirmation**
   - Show submission ID
   - Show expiry countdown

### Chairperson/Advisor Side

1. **Portal Management**
   - "Close Portal" button
   - "Regenerate PIN" button (shows new PIN)
   - Show `closed_at` status

2. **Cache Submissions List**
   - List with expiry countdown
   - Status badges (pending, validated, approved, rejected)
   - "30-minute data retention" notice

3. **Submission Detail View**
   - Student identifier
   - Graduation eligibility badge
   - Credit progress charts
   - Category breakdown
   - Course list with status
   - Errors and warnings

4. **Validation Actions**
   - Validate button
   - Approve button
   - Reject button (with reason input)
   - Batch validate selected

---

## Curriculum Selection Flow

### Scenario A: Portal has department assigned (most common)

```
1. GET /api/public/graduation-portals/{id}/curricula
   → Returns all curricula in portal's department
   → Show list for student to select
   → Pre-select the one with is_default: true
```

### Scenario B: Portal has no department (fallback flow)

```
1. GET /api/public/graduation-portals/{id}/curricula
   → Returns empty array (total: 0)

2. Show Faculty dropdown:
   GET /api/public/faculties
   → Student selects faculty

3. Show Department dropdown:
   GET /api/public/departments?faculty_id={selected_faculty_id}
   → Student selects department

4. Fetch curricula with filter:
   GET /api/public/graduation-portals/{id}/curricula?department_id={selected_department_id}
   → Returns curricula in that department
   → Student selects curriculum
```

### TypeScript Example

```typescript
interface Curriculum {
  id: string;
  name: string;
  year: number;
  version: string | null;
  description: string | null;
  total_credits_required: number;
  is_default: boolean;
  department: { id: string; name: string } | null;
  faculty: { id: string; name: string } | null;
}

interface CurriculaResponse {
  curricula: Curriculum[];
  default_curriculum_id: string | null;
  portal_department_id: string | null;
  total: number;
}

// After PIN verification, fetch curricula
async function fetchCurricula(portalId: string): Promise<CurriculaResponse> {
  const res = await fetch(`/api/public/graduation-portals/${portalId}/curricula`);
  return res.json();
}

// Check if we need fallback flow
const { curricula, total, portal_department_id } = await fetchCurricula(portalId);

if (total === 0 && !portal_department_id) {
  // Show faculty/department selection
  showFallbackCurriculumSelection();
} else {
  // Show curriculum cards
  showCurriculumCards(curricula);
}
```

---

## Grade to Status Mapping

Frontend should map grades to status before submission:

| Grade | Status |
|-------|--------|
| A, A-, B+, B, B-, C+, C, C-, D+, D, D-, S, P | `completed` |
| F | `failed` |
| W | `withdrawn` |
| IP, IN_PROGRESS, TAKING, CURRENT | `in_progress` |
| P (when planned), PLANNED, FUTURE, - | `planned` |

---

## Important Notes

1. **PDPA Compliance**: Submissions are stored in cache for 30 minutes only, then auto-deleted
2. **No Login Required**: Students don't need accounts, just the portal PIN
3. **File Parsing**: Must be done client-side, send JSON not files
4. **Session Duration**: 15 minutes from PIN verification
5. **Rate Limiting**: 5 PIN attempts per 15 minutes per IP
6. **Curriculum Selection**: Student MUST select curriculum - it's required for submission
