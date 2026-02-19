# Graduation Portal - Frontend Coordination Document

## ✅ IMPLEMENTATION COMPLETE (Backend + Frontend)

**Status:** REQ-1 through REQ-6 (except REQ-3/REQ-4) fully implemented. Breaking changes reviewed and resolved.

**Last Updated:** February 19, 2026

---

## 🔗 API ENDPOINT REFERENCE

### Public Endpoints (No Auth Required - For Students)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/public/graduation-portals` | List all active portals |
| GET | `/api/public/graduation-portals/{id}` | Get portal details |
| POST | `/api/public/graduation-portals/{id}/verify-pin` | Verify portal PIN |
| GET | `/api/public/graduation-portals/{id}/curricula` | Get curricula for portal |
| GET | `/api/public/graduation-portals/faculties` | List faculties |
| GET | `/api/public/graduation-portals/departments` | List departments |
| POST | `/api/graduation-portals/{id}/submit` | Submit to portal (requires PIN session) |

### Chairperson Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chairperson/graduation-portals` | List portals for department |
| POST | `/api/chairperson/graduation-portals` | Create portal |
| GET | `/api/chairperson/graduation-portals/{id}` | Get portal details |
| PUT | `/api/chairperson/graduation-portals/{id}` | Update portal |
| DELETE | `/api/chairperson/graduation-portals/{id}` | Delete portal |
| POST | `/api/chairperson/graduation-portals/{id}/close` | Close portal |
| POST | `/api/chairperson/graduation-portals/{id}/regenerate-pin` | Regenerate PIN |
| GET | `/api/chairperson/graduation-portals/{id}/submissions` | List submissions |
| POST | `/api/chairperson/graduation-portals/{id}/submissions/{subId}/process` | Process submission |
| POST | `/api/chairperson/graduation-portals/{id}/submissions/{subId}/approve` | Approve submission |
| POST | `/api/chairperson/graduation-portals/{id}/submissions/{subId}/reject` | Reject submission |

### Cache Submission Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chairperson/graduation-portals/{id}/cache-submissions` | List cached submissions |
| GET | `/api/chairperson/graduation-portals/{id}/cache-submissions/{subId}` | Get submission details |
| POST | `/api/chairperson/graduation-portals/{id}/cache-submissions/{subId}/validate` | Validate submission |
| POST | `/api/chairperson/graduation-portals/{id}/cache-submissions/{subId}/approve` | Approve submission |
| POST | `/api/chairperson/graduation-portals/{id}/cache-submissions/{subId}/reject` | Reject submission |
| GET | `/api/chairperson/graduation-portals/{id}/cache-submissions/{subId}/report` | Download report |
| POST | `/api/chairperson/graduation-submissions/batch-validate` | Batch validate submissions |

### Notification Endpoints (Auth Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chairperson/graduation-notifications` | List notifications |
| GET | `/api/chairperson/graduation-notifications/unread-count` | Get unread count |
| POST | `/api/chairperson/graduation-notifications/{id}/read` | Mark as read |
| POST | `/api/chairperson/graduation-notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/chairperson/graduation-notifications/{id}` | Delete notification |
| DELETE | `/api/chairperson/graduation-notifications/clear-read` | Clear read notifications |

---

## 🐛 TROUBLESHOOTING: Portal List Not Loading

### Backend Status (Verified Feb 19, 2026)
```bash
# Test: curl http://127.0.0.1:8000/api/public/graduation-portals
# Result: Returns 3 active portals ✅
```

### Common Frontend Issues

1. **Wrong API URL**
   - Check if frontend is calling `/api/public/graduation-portals` (not `/api/graduation-portals`)
   - Verify `NEXT_PUBLIC_API_URL` or similar env var is correct

2. **CORS Issue**
   - Backend is configured for CORS in `config/cors.php`
   - Check browser console for CORS errors

3. **Response Field Names**
   - Response returns `{ portals: [...], total: N }`
   - Frontend should access `response.data.portals` or `response.portals`

4. **Network/Server**
   - Ensure Laravel server is running: `php artisan serve`
   - Check port matches frontend config (default: 8000)

### Expected Response Format
```json
{
  "portals": [
    {
      "id": "12",
      "name": "Portal Name",
      "description": "...",
      "batch": "653",
      "deadline": "2026-02-19",
      "daysRemaining": 0.21,
      "grace_period_end": "2026-02-26T00:00:00+00:00",
      "is_in_grace_period": false,
      "acceptedFormats": [".xlsx", ".xls", ".csv"],
      "maxFileSizeMb": 5,
      "curriculum": { "id": "...", "name": "...", "year": "..." } | null,
      "department": { "id": "...", "name": "..." } | null
    }
  ],
  "total": 3
}
```

---

## 🔄 IMPLEMENTATION STATUS (February 11, 2026)

### Completed

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 1 | **Submission Retention Change** | ✅ Complete | Backend + Frontend updated. Now 1 week after portal deadline |
| 2 | **Chairperson Notification System** | ✅ Complete | Backend API + NotificationDropdown component |
| 3 | **File Pre-Validation** | 🟡 Pending | Frontend validation not yet implemented |
| 5 | **Grace Period** | ✅ Complete | Backend + Frontend done. Config: `GRADUATION_GRACE_PERIOD_DAYS=7` |
| 6 | **Enhanced Validation Response** | ✅ Complete | Backend returns `requirements[]`, `categoryProgress`, `summary` with all needed fields |

### Future Consideration

| # | Requirement | Status | Notes |
|---|-------------|--------|-------|
| 4 | **Auto Curriculum Mapping** | 🔵 Deferred | Map student ID to curriculum automatically to avoid human error |

---

## 📦 FRONTEND IMPLEMENTATION SUMMARY

### Files Created/Modified:

| File | Change |
|------|--------|
| `src/lib/api/laravel.ts` | Added `GraduationNotification` type, notification API functions, updated `CacheSubmission` type with `deletion_date`, added `SubmissionRetentionInfo` type, added `GRACE_PERIOD_DAYS` constant, added `grace_period_end` and `is_in_grace_period` fields to `GraduationPortal` and `SubmissionRetentionInfo` |
| `src/components/common/NotificationDropdown.tsx` | **NEW** - Discord-style notification dropdown component |
| `src/components/common/layout/Sidebar.tsx` | Integrated NotificationDropdown for chairperson/advisor roles |
| `src/app/chairperson/GraduationPortal/page.tsx` | Updated `ExpiryTimer` → `RetentionTimer` component to show days until deletion |
| `src/app/student/GraduationPortal/page.tsx` | Updated retention messages; Added Grace Period logic (grace period helpers, portal card amber styling, upload banner, preview/success retention messages) |
| `src/app/chairperson/GraduationPortal/[submissionId]/page.tsx` | **ENHANCED** - Added DonutChart, SegmentedProgressBar, GPA calculation, per-status course lists (completed/in-progress/planned/failed), graduation requirements checklist, validation summary, credit breakdown |

### API Functions Added (`src/lib/api/laravel.ts`):

```typescript
// Notification API
getGraduationNotifications()           // GET /api/graduation-notifications
getGraduationNotificationUnreadCount() // GET /api/graduation-notifications/unread-count
markGraduationNotificationRead(id)     // POST /api/graduation-notifications/{id}/read
markAllGraduationNotificationsRead()   // POST /api/graduation-notifications/mark-all-read
deleteGraduationNotification(id)       // DELETE /api/graduation-notifications/{id}
clearReadGraduationNotifications()     // DELETE /api/graduation-notifications/clear-read
```

### Types Added:

```typescript
interface GraduationNotification {
  id: string;
  type: 'new_submission' | 'submission_validated';
  title: string;
  message: string;
  data: { submission_id?, student_identifier?, course_count?, portal_name? };
  read: boolean;
  read_at: string | null;
  created_at: string;
  portal: { id: string; name: string; } | null;
}

interface SubmissionRetentionInfo {
  portal_deadline: string;
  retention_days: number;
  deletion_date: string;
}

// CacheSubmission now includes:
deletion_date?: string;  // NEW field
```

---

## 🛠️ IMPLEMENTED BACKEND CHANGES

### REQ-1: Submission Retention Change ✅

**Previous Behavior:** Submissions expired 30 minutes after submission (cache-based).

**New Behavior:** Submissions are retained until **1 week after the portal deadline**, then auto-deleted.

#### What Changed:

1. **`config/graduation.php`:**
   ```php
   // Changed from:
   'submission_ttl_minutes' => 30,
   
   // To:
   'submission_retention_days' => env('GRADUATION_SUBMISSION_RETENTION_DAYS', 7),
   ```

2. **`GraduationSubmissionController.php`:**
   - Added `calculateDeletionDate()` helper method
   - Updated `store()` method to calculate `expires_at` as `portal.deadline + 7 days`
   - Added `deletion_date` field to submission data and API response
   - Updated `addToPortalSubmissionList()` to use Carbon datetime instead of TTL minutes

3. **API Response Changes:**
   ```json
   {
     "submission": {
       "id": "uuid",
       "status": "pending",
       "expires_at": "2026-02-22T00:00:00+00:00",
       "deletion_date": "2026-02-22",
       "course_count": 45
     }
   }
   ```

4. **Submissions List Response:**
   ```json
   {
     "submissions": [...],
     "total": 5,
     "retention_info": {
       "portal_deadline": "2026-02-15",
       "retention_days": 7,
       "deletion_date": "2026-02-22"
     },
     "note": "Submissions will be deleted 7 days after the portal deadline (2026-02-22)"
   }
   ```

#### Environment Variable:
```env
# New variable (default: 7 days)
GRADUATION_SUBMISSION_RETENTION_DAYS=7
```

---

### REQ-2: Chairperson Notification System ✅

**Requirement:** Chairpersons/Advisors receive notifications when students submit to their portals.

#### Files Created:

1. **Migration:** `database/migrations/2026_02_06_100000_create_graduation_notifications_table.php`
2. **Model:** `app/Models/GraduationNotification.php`
3. **Controller:** `app/Http/Controllers/GraduationNotificationController.php`

#### Database Schema:

```sql
CREATE TABLE graduation_notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    portal_id BIGINT NOT NULL REFERENCES graduation_portals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON NULL,
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Indexes
CREATE INDEX ON graduation_notifications (user_id);
CREATE INDEX ON graduation_notifications (portal_id);
CREATE INDEX ON graduation_notifications (type);
CREATE INDEX ON graduation_notifications (read);
CREATE INDEX ON graduation_notifications (user_id, read);
CREATE INDEX ON graduation_notifications (created_at);
```

#### API Endpoints:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/graduation-notifications` | List notifications (limit 50) |
| GET | `/api/graduation-notifications/unread-count` | Get unread count |
| POST | `/api/graduation-notifications/{id}/read` | Mark as read |
| POST | `/api/graduation-notifications/mark-all-read` | Mark all as read |
| DELETE | `/api/graduation-notifications/{id}` | Delete notification |
| DELETE | `/api/graduation-notifications/clear-read` | Delete all read notifications |

#### Notification Types:

- `new_submission` - When a student submits to a portal

#### API Response Examples:

**GET /api/graduation-notifications**
```json
{
  "notifications": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "new_submission",
      "title": "New Graduation Submission",
      "message": "New submission from John Doe - 6512345 in portal \"Graduation Check 2026\" with 45 courses.",
      "data": {
        "submission_id": "660e8400-e29b-41d4-a716-446655440001",
        "student_identifier": "John Doe - 6512345",
        "course_count": 45,
        "portal_name": "Graduation Check 2026"
      },
      "read": false,
      "read_at": null,
      "created_at": "2026-02-06T10:30:00Z",
      "portal": {
        "id": "1",
        "name": "Graduation Check 2026"
      }
    }
  ],
  "total": 1
}
```

**GET /api/graduation-notifications/unread-count**
```json
{
  "unread_count": 5
}
```

**POST /api/graduation-notifications/{id}/read**
```json
{
  "message": "Notification marked as read",
  "notification": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "read": true,
    "read_at": "2026-02-06T10:35:00Z"
  }
}
```

**POST /api/graduation-notifications/mark-all-read**
```json
{
  "message": "All notifications marked as read",
  "marked_count": 5
}
```

#### How Notifications Are Created:

When a student submits, the system automatically creates notifications for:
- All **CHAIRPERSON** users in the portal's department
- All **ADVISOR** users in the portal's department

```php
// In GraduationSubmissionController::store()
GraduationNotification::notifyDepartmentStaff(
    $portal->department_id,
    $portal->id,
    $portal->name,
    $studentIdentifier,
    $submissionId,
    count($courses)
);
```

---
       {
           $notification = GraduationNotification::where('user_id', $request->user()->id)
               ->findOrFail($id);
           $notification->markAsRead();
           
           return response()->json(['message' => 'Marked as read']);
       }
       
       public function markAllAsRead(Request $request)
       {
           GraduationNotification::where('user_id', $request->user()->id)
               ->where('read', false)
               ->update(['read' => true, 'read_at' => now()]);
           
---

### REQ-3: File Pre-Validation (Frontend Only)

**Note:** This is primarily a **frontend responsibility** (client-side validation before submission).

**Frontend is responsible for:**
- File format validation (.xlsx, .xls, .csv)
- File size validation (max 5MB by default)
- File parsing (corrupt file detection)
- Required column detection
- Data type validation
- Course code format hints
- Grade format validation

Backend validation is already handled by `StoreGraduationSubmissionRequest.php`.

---

### REQ-5: Grace Period ✅

**Concept:** Students can still submit graduation files for 7 days after the portal deadline. This "Grace Period" gives students extra time while still auto-deleting data for PDPA compliance.

**Frontend Implementation (✅ Done):**
- `GRACE_PERIOD_DAYS = 7` constant added to `laravel.ts`
- Helper functions: `getGracePeriodEnd()`, `isInGracePeriod()`, `isAcceptingSubmissions()`, `getDaysUntilGracePeriodEnd()`
- Portal selection: portals in grace period shown with amber badge "Grace Period" and countdown
- Upload step: amber banner warning that submission is during grace period
- Preview/success steps: retention messages reference grace period end date
- Chairperson portal page: info alert mentions grace period

**Backend Implementation (✅ Done):**

1. **Config (`config/graduation.php`):**
   ```php
   'grace_period_days' => (int) env('GRADUATION_GRACE_PERIOD_DAYS', 7),
   ```

2. **Model (`GraduationPortal.php`):**
   - `isActive()` — returns `true` during grace period (not just before deadline)
   - `scopeActive()` — includes portals in grace period in listings
   - `getGracePeriodEnd()` — returns `Carbon` of `deadline + grace_period_days`
   - `isInGracePeriod()` — returns `true` if now is between deadline and grace period end

3. **Portal API responses now include:**
   ```json
   {
     "deadline": "2026-02-15",
     "grace_period_end": "2026-02-22T00:00:00.000000Z",
     "is_in_grace_period": true
   }
   ```
   Note: `deadline` stays in `Y-m-d` format. `grace_period_end` uses ISO 8601.

4. **Submission Endpoint (`POST /api/graduation-portals/{id}/submit`):**
   - Accepts submissions when `now <= portal.deadline + grace_period_days`
   - Rejects with 422 + `GRACE_PERIOD_ENDED` error code when past grace period
   - Retention/deletion date is still `portal.deadline + submission_retention_days`

5. **Submissions List (`GET .../cache-submissions`) — `retention_info` now includes:**
   ```json
   { "is_in_grace_period": true }
   ```

6. **PDPA Note:** Grace period submissions follow the same retention policy (deleted `retention_days` after portal deadline). The grace period only extends the *submission window*, not the *data retention window*.

---

### REQ-6: Enhanced Validation Response ✅

**Requirement:** The chairperson's submission review page should show the same level of detail as the student progress page.

**Frontend Implementation (✅ Done):**

| Component | Description |
|-----------|-------------|
| `DonutChart` | Multi-segment SVG donut showing credit distribution (completed/in-progress/planned/failed/remaining) |
| `SegmentedProgressBar` | Gradient bar with legend showing credit progress toward required total |
| GPA Calculation | Client-side GPA from `GRADE_GPA_MAP` (A=4.0, B+=3.5, ..., F=0) |
| Stats Row | 6 stat cards: Total Courses, Completed, In Progress, Planned, Credits Earned, GPA |
| Credit Breakdown | Side-by-side: donut chart + itemized credit rows with color indicators |
| Course Lists | 4 collapsible sections: Completed (with grades), In Progress (with semester), Planned (with semester), Failed/Withdrawn |
| Requirements Checklist | Uses `validation.requirements[]` from backend to show met/unmet checklist |
| Validation Summary | Uses `validation.summary` for matched/unmatched courses, required credits |

**Backend Implementation (✅ Done):**

The `POST .../cache-submissions/{id}/validate` response now returns:

```json
{
  "message": "Validation completed",
  "submission": {
    "id": "uuid", "status": "validated",
    "student_identifier": "...", "curriculum_id": "...",
    "courses": [...], "submitted_at": "...", "expires_at": "...", "deletion_date": "..."
  },
  "validation": {
    "valid": true,
    "can_graduate": true,
    "canGraduate": true,
    "summary": {
      "totalCreditsRequired": 120, "totalCreditsEarned": 95,
      "creditsCompleted": 95, "creditsInProgress": 15, "creditsPlanned": 6,
      "completionPercentage": 79.2, "gpa": 3.20,
      "matchedCourses": 30, "unmatchedCourses": 2,
      "coursesMatched": 30, "coursesUnmatched": 2
    },
    "categoryProgress": { "Core": { "creditsRequired": 60, "creditsCompleted": 45, ... } },
    "requirements": [
      { "name": "Minimum Credits", "met": false, "label": "...", "description": "...", "message": "...", "required": 120, "current": 95 },
      { "name": "GPA Requirement", "met": true, ... }
    ],
    "errors": [], "warnings": [],
    "matchedCourses": [ { "code": "CS101", "name": "...", "credits": 3, "grade": "A", "status": "completed", "semester": "1/2025", "category": "Core", "matched": true } ],
    "unmatchedCourses": [ { "code": "BUS201", "name": "...", "credits": 3, "grade": "B+", "status": "completed", "reason": "Not in curriculum" } ]
  }
}
```

**Key decisions (reviewed Feb 11, 2026):**
- `validation_result` stays in cached submission (for `show()` endpoint)
- Top-level `validation` key used in validate response (for frontend)
- `requirements` is an indexed array (not keyed object)
- `unmatchedCourses` kept as objects (not stripped to strings)
- `deadline` format stays `Y-m-d` (no ISO 8601 change)
- `matchedCourses` stripped internal IDs (`is_required`, `curriculum_course_id`, `course_id`) — frontend confirmed safe

---

### REQ-4: Auto Curriculum Mapping (DEFERRED)

**Status:** Deferred for future consideration.

**Backend Requirements (for future):**
1. Student ID pattern configuration per department
2. Batch-to-curriculum mapping table
3. API endpoint: `GET /api/resolve-curriculum?student_id={id}&department_id={uuid}`
4. Fallback to manual selection when auto-mapping fails

---

## 1. Executive Summary

The **Graduation Portal** allows students to submit their course progress for graduation eligibility review. The system is designed with **PDPA compliance** - student data is stored temporarily and automatically deleted 1 week after the portal deadline.

### Key Features
- **Public portal access** - Students don't need accounts
- **PIN-based authentication** - Secure session tokens after PIN verification
- **Time-bound submissions** - Auto-expires 1 week after portal deadline (PDPA compliant)
- **Chairperson notifications** - Discord-style notification dropdown for new submissions
- **File pre-validation** - Format and data validation before submission
- **Curriculum validation** - Automatic validation against curriculum requirements

---

## 2. Quick Start for Frontend

### 2.1 Base URLs

```typescript
// Public endpoints (no auth required)
const PUBLIC_BASE = '/api/public/graduation-portals';

// Session-authenticated (requires PIN verification token)
const SESSION_BASE = '/api/graduation-portals';

// Chairperson/Advisor endpoints (requires Sanctum auth)
const ADMIN_BASE = '/api/graduation-portals';
```

### 2.2 Authentication Types

| Flow | Auth Method | Header |
|------|-------------|--------|
| Student browsing | None | - |
| Student submission | Session Token | `X-Graduation-Session-Token: {token}` |
| Chairperson/Advisor | Sanctum | `Authorization: Bearer {token}` |

---

## 3. Database Schema

### 3.1 graduation_portals Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key (auto-increment) |
| `name` | VARCHAR(255) | Portal name |
| `description` | TEXT | Portal description |
| `batch` | VARCHAR(100) | Target batch (e.g., "2022") |
| `curriculum` | VARCHAR(255) | Legacy curriculum name field |
| `curriculum_id` | UUID | Foreign key to curricula table |
| `deadline` | DATE | Submission deadline |
| `status` | ENUM | 'active', 'closed' |
| `pin` | VARCHAR(20) | Raw PIN (legacy, for display) |
| `pin_hash` | VARCHAR(255) | Hashed PIN (for verification) |
| `accepted_formats` | JSON | Array of accepted file types |
| `max_file_size_mb` | INTEGER | Max file size (default: 5) |
| `created_by` | UUID | Foreign key to users table |
| `department_id` | UUID | Foreign key to departments table |
| `closed_at` | TIMESTAMP | When portal was closed |
| `created_at` | TIMESTAMP | Created timestamp |
| `updated_at` | TIMESTAMP | Updated timestamp |

### 3.2 graduation_portal_logs Table (Audit Log)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `portal_id` | BIGINT | Foreign key to graduation_portals |
| `action` | VARCHAR | Action type |
| `performed_by` | UUID | User ID (nullable for anonymous) |
| `metadata` | JSON | Additional context |
| `created_at` | TIMESTAMP | When action occurred |

**Action Types:**
- `created` - Portal created
- `updated` - Portal updated
- `closed` - Portal closed
- `pin_verified` - Successful PIN verification
- `pin_failed` - Failed PIN attempt
- `submission_received` - New submission received
- `submission_validated` - Submission validated
- `submission_approved` - Submission approved
- `submission_rejected` - Submission rejected

### 3.3 Cache-Based Submissions (No DB Table)

Submissions are stored in cache with the following structure:

```typescript
interface CachedSubmission {
  id: string;                    // UUID
  portal_id: number;
  student_identifier: string;    // e.g., "John Doe - 6512345"
  curriculum_id: string;         // UUID
  courses: Course[];
  status: 'pending' | 'validated' | 'approved' | 'rejected';
  validation_result: ValidationResult | null;
  submitted_at: string;          // ISO datetime
  expires_at: string;            // ISO datetime (portal_deadline + 7 days)
  metadata: object;
  ip_address: string;
}
```

---

## 4. API Endpoints Reference

### 4.1 Public Endpoints (No Authentication)

#### List Active Portals
```http
GET /api/public/graduation-portals
```

**Response:**
```json
{
  "portals": [
    {
      "id": "1",
      "name": "Graduation Check 2026",
      "description": "Submit your progress for graduation review",
      "batch": "2022",
      "deadline": "2026-02-15",
      "daysRemaining": 9,
      "acceptedFormats": [".xlsx", ".xls", ".csv"],
      "maxFileSizeMb": 5,
      "curriculum": {
        "id": "019b2d53-f1da-70ff-8814-38ddac90427c",
        "name": "BSCS 2022",
        "year": 2022
      },
      "department": {
        "id": "019b1831-1b79-70be-8daa-8e7347d72a47",
        "name": "Computer Science"
      }
    }
  ],
  "total": 1
}
```

#### Get Portal Details
```http
GET /api/public/graduation-portals/{id}
```

**Response:**
```json
{
  "portal": {
    "id": "1",
    "name": "Graduation Check 2026",
    "description": "Submit your progress for graduation review",
    "batch": "2022",
    "deadline": "2026-02-15",
    "daysRemaining": 9,
    "acceptedFormats": [".xlsx", ".xls", ".csv"],
    "maxFileSizeMb": 5,
    "curriculum": {...},
    "department": {...},
    "requiresPin": true
  }
}
```

**Error (410 Gone - Portal Inactive):**
```json
{
  "error": {
    "message": "This portal is no longer active",
    "code": "PORTAL_INACTIVE"
  }
}
```

#### Verify PIN
```http
POST /api/public/graduation-portals/{id}/verify-pin
Content-Type: application/json

{
  "pin": "GRAD123ABC"
}
```

**Success Response (200):**
```json
{
  "message": "PIN verified successfully",
  "session": {
    "token": "abc123def456ghi789...",
    "expires_in_minutes": 15,
    "expires_at": "2026-02-06T12:30:00Z"
  },
  "portal": {
    "id": "1",
    "name": "Graduation Check 2026",
    "curriculum_id": "019b2d53-f1da-70ff-8814-38ddac90427c",
    "accepted_formats": [".xlsx", ".xls", ".csv"],
    "max_file_size_mb": 5
  }
}
```

**Error Response (401 - Invalid PIN):**
```json
{
  "error": {
    "message": "Invalid PIN",
    "code": "INVALID_PIN",
    "attempts_remaining": 4
  }
}
```

**Error Response (429 - Rate Limited):**
```json
{
  "error": {
    "message": "Too many failed attempts. Please try again in 15 minutes.",
    "code": "RATE_LIMITED",
    "retry_after": 900
  }
}
```

#### Get Available Curricula
```http
GET /api/public/graduation-portals/{id}/curricula
GET /api/public/graduation-portals/{id}/curricula?faculty_id={uuid}
GET /api/public/graduation-portals/{id}/curricula?department_id={uuid}
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
    }
  ],
  "default_curriculum_id": "019b2d53-f1da-70ff-8814-38ddac90427c",
  "portal_department_id": "019b1831-1b79-70be-8daa-8e7347d72a47",
  "total": 2
}
```

#### Get Faculties (for curriculum fallback)
```http
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

#### Get Departments
```http
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

### 4.2 Session-Authenticated Endpoints (Student Submission)

#### Submit Courses
```http
POST /api/graduation-portals/{id}/submit
X-Graduation-Session-Token: {token}
Content-Type: application/json

{
  "student_identifier": "John Doe - 6512345",
  "curriculum_id": "019b2d53-f1da-70ff-8814-38ddac90427c",
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
      "code": "CS 201",
      "name": "Data Structures",
      "credits": 3,
      "grade": null,
      "status": "in_progress",
      "semester": "2/2025"
    }
  ],
  "metadata": {
    "file_name": "transcript.xlsx",
    "parsed_at": "2026-02-06T10:00:00Z",
    "total_courses": 45
  }
}
```

**Success Response (201):**
```json
{
  "message": "Submission received successfully",
  "submission": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "pending",
    "expires_at": "2026-02-06T10:30:00Z",
    "course_count": 45
  }
}
```

**Error Response (401 - Session Issues):**
```json
{
  "error": {
    "message": "Session has expired. Please verify PIN again.",
    "code": "SESSION_EXPIRED"
  }
}
```

---

### 4.3 Chairperson/Advisor Endpoints (Sanctum Auth)

#### List Portals
```http
GET /api/graduation-portals
GET /api/graduation-portals?status=active
GET /api/graduation-portals?search=2026
Authorization: Bearer {sanctum_token}
```

#### Create Portal
```http
POST /api/graduation-portals
Authorization: Bearer {sanctum_token}
Content-Type: application/json

{
  "name": "Graduation Check 2026",
  "description": "Submit your progress for graduation review",
  "batch": "2022",
  "curriculumId": "019b2d53-f1da-70ff-8814-38ddac90427c",
  "deadline": "2026-02-15",
  "acceptedFormats": [".xlsx", ".xls", ".csv"]
}
```

#### Update Portal
```http
PUT /api/graduation-portals/{id}
Authorization: Bearer {sanctum_token}
```

#### Delete Portal
```http
DELETE /api/graduation-portals/{id}
Authorization: Bearer {sanctum_token}
```

#### Close Portal
```http
POST /api/graduation-portals/{id}/close
Authorization: Bearer {sanctum_token}
```

**Response:**
```json
{
  "message": "Portal closed successfully",
  "portal": {
    "id": "1",
    "status": "closed",
    "closed_at": "2026-02-06T10:00:00Z"
  }
}
```

#### Regenerate PIN
```http
POST /api/graduation-portals/{id}/regenerate-pin
Authorization: Bearer {sanctum_token}
```

**Response:**
```json
{
  "message": "PIN regenerated successfully",
  "pin": "XYZ789ABC"
}
```

#### List Cached Submissions
```http
GET /api/graduation-portals/{portal}/cache-submissions
Authorization: Bearer {sanctum_token}
```

**Response:**
```json
{
  "submissions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "student_identifier": "John Doe - 6512345",
      "curriculum_id": "019b2d53-f1da-70ff-8814-38ddac90427c",
      "status": "pending",
      "course_count": 45,
      "submitted_at": "2026-02-06T10:00:00Z",
      "expires_at": "2026-02-06T10:30:00Z",
      "has_validation_result": false
    }
  ],
  "total": 1,
  "note": "Submissions are stored temporarily and will expire after 30 minutes"
}
```

#### Get Submission Details
```http
GET /api/graduation-portals/{portal}/cache-submissions/{submissionId}
Authorization: Bearer {sanctum_token}
```

#### Validate Submission
```http
POST /api/graduation-portals/{portal}/cache-submissions/{submissionId}/validate
Authorization: Bearer {sanctum_token}
```

**Response (v1.4+):**
```json
{
  "message": "Validation completed",
  "submission": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "validated",
    "student_identifier": "John Doe - 6512345",
    "curriculum_id": "019b2d53-f1da-70ff-8814-38ddac90427c",
    "courses": [...],
    "submitted_at": "2026-02-11T10:00:00.000000Z",
    "expires_at": "2026-02-22T00:00:00.000000Z",
    "deletion_date": "2026-02-22"
  },
  "validation": {
    "valid": false,
    "can_graduate": false,
    "canGraduate": false,
    "summary": {
      "totalCreditsRequired": 139,
      "totalCreditsEarned": 85,
      "creditsCompleted": 85,
      "creditsInProgress": 12,
      "creditsPlanned": 42,
      "completionPercentage": 61.2,
      "gpa": 3.45,
      "matchedCourses": 42,
      "unmatchedCourses": 3,
      "coursesMatched": 42,
      "coursesUnmatched": 3
    },
    "categoryProgress": {
      "Core": {
        "name": "Core",
        "creditsRequired": 45,
        "creditsCompleted": 40,
        "creditsInProgress": 3,
        "creditsPlanned": 6,
        "coursesCompleted": 12,
        "coursesInProgress": 1,
        "coursesPlanned": 2,
        "percentComplete": 88.9,
        "isComplete": false
      }
    },
    "requirements": [
      {
        "name": "Minimum Credits",
        "met": false,
        "label": "Minimum credit requirement: 85/139 completed — need 54 more",
        "description": "Minimum credit requirement: 85/139 completed — need 54 more",
        "message": "Minimum credit requirement: 85/139 completed — need 54 more",
        "required": 139,
        "current": 85
      },
      {
        "name": "GPA Requirement",
        "met": true,
        "label": "Current GPA: 3.45 (meets requirement)",
        "description": "Current GPA: 3.45 (meets requirement)",
        "message": "Current GPA: 3.45 (meets requirement)",
        "required": 2.0,
        "current": 3.45
      },
      {
        "name": "No Validation Errors",
        "met": false,
        "label": "2 validation error(s) found",
        "description": "2 validation error(s) found",
        "message": "2 validation error(s) found",
        "required": 0,
        "current": 2
      }
    ],
    "errors": [
      "Missing prerequisite: CS301 requires CS201 to be completed first",
      "Missing 5 credits for Core requirement"
    ],
    "warnings": [
      "Course XYZ999 not found in curriculum",
      "12 credits still in progress"
    ],
    "matchedCourses": [
      { "code": "CS101", "name": "Intro to CS", "credits": 3, "grade": "A", "status": "completed", "semester": "1/2024", "category": "Core", "matched": true }
    ],
    "unmatchedCourses": [
      { "code": "XYZ999", "name": "Unknown Course", "credits": 3, "grade": "B", "status": "completed", "reason": "Not in curriculum" }
    ]
  }
}
```

> **Note:** The `validation_result` key is still stored inside the cached submission (for the `GET .../cache-submissions/{id}` endpoint). The `POST .../validate` response uses the top-level `validation` key.

#### Approve Submission
```http
POST /api/graduation-portals/{portal}/cache-submissions/{submissionId}/approve
Authorization: Bearer {sanctum_token}
```

#### Reject Submission
```http
POST /api/graduation-portals/{portal}/cache-submissions/{submissionId}/reject
Authorization: Bearer {sanctum_token}
Content-Type: application/json

{
  "reason": "Missing required internship course"
}
```

#### Download Report
```http
GET /api/graduation-portals/{portal}/cache-submissions/{submissionId}/report
Authorization: Bearer {sanctum_token}
```

#### Batch Validate
```http
POST /api/graduation-submissions/batch-validate
Authorization: Bearer {sanctum_token}
Content-Type: application/json

{
  "portal_id": 1,
  "submission_ids": [
    "550e8400-e29b-41d4-a716-446655440000",
    "660e8400-e29b-41d4-a716-446655440001"
  ]
}
```

---

## 5. Student Submission Wizard Flow

### 5.1 Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 1: Select Portal                                                      │
│  ───────────────────                                                        │
│  • API: GET /api/public/graduation-portals                                  │
│  • Display portal cards with name, deadline, department                     │
│  • User clicks portal → store portalId                                      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 2: Enter PIN                                                          │
│  ─────────────────                                                          │
│  • API: POST /api/public/graduation-portals/{id}/verify-pin                 │
│  • On SUCCESS: Store sessionToken + expiresAt → Step 3                      │
│  • On ERROR 401: Show "Invalid PIN", display attempts_remaining             │
│  • On ERROR 429: Show countdown timer, disable input                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 3: Select Curriculum                                                  │
│  ─────────────────────────                                                  │
│  • API: GET /api/public/graduation-portals/{id}/curricula                   │
│  • IF total > 0: Display curriculum cards, pre-select is_default            │
│  • IF total === 0: Use faculty/department cascade selection                 │
│  • Store curriculumId → Step 4                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 4: Upload & Validate File                                             │
│  ──────────────────────────────                                             │
│  • Accept .xlsx, .xls, .csv                                                 │
│  • Parse file CLIENT-SIDE (xlsx library for Excel, papaparse for CSV)       │
│  • ⚠️ PRE-VALIDATION (before proceeding):                                   │
│    - Check file format is valid (not corrupted)                             │
│    - Verify required columns exist (code, name, credits, grade)             │
│    - Validate data types (credits = number, grade = valid format)           │
│    - Check minimum row count (at least 1 course)                            │
│    - Validate course code format (e.g., "XX 000" pattern)                   │
│    - Show validation errors with specific row/column details                │
│  • Extract: code, name, credits, grade, semester                            │
│  • Map grades to status (A→completed, F→failed, IP→in_progress)             │
│  • Store parsedCourses → Step 5                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 5: Preview & Confirm                                                  │
│  ────────────────────────                                                   │
│  • Student identifier input                                                 │
│  • Display curriculum name + parsed courses table                           │
│  • Show summary: Total courses, by status                                   │
│  • "Back" to Step 4 | "Submit" to Step 6                                    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 6: Submit                                                             │
│  ──────────────                                                             │
│  • API: POST /api/graduation-portals/{id}/submit                            │
│  • Header: X-Graduation-Session-Token: {token}                              │
│  • On SUCCESS 201: Show confirmation + expiry countdown                     │
│  • On ERROR 401: Session expired → redirect to Step 2                       │
│  • On ERROR 422: Show field errors, stay on Step 5                          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  STEP 7: Complete                                                           │
│  ───────────────                                                            │
│  • Success message with submission ID                                       │
│  • Display data retention notice:                                           │
│    "Your submission will be retained until [deadline + 7 days]"             │
│    "Data will be automatically deleted after this date (PDPA)"              │
│  • Show portal deadline + calculated deletion date                          │
│  • Option: "Submit Another" → return to Step 1                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 State Management

```typescript
interface GraduationWizardState {
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

interface Course {
  code: string;        // "CS 101"
  name?: string;       // "Introduction to Computing"
  credits: number;     // 3
  grade?: string;      // "A", "B+", "IP", "P" - OPTIONAL for planned courses
  status: "completed" | "in_progress" | "planned" | "failed" | "withdrawn";
  semester?: string;   // "1/2024"
  category?: string;   // "Core", "Major Elective"
}
```

### 5.3 Grade to Status Mapping

```typescript
const gradeToStatus = (grade: string | null): CourseStatus => {
  if (!grade) return 'planned';
  
  const passingGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'S', 'P'];
  const inProgressGrades = ['IP', 'IN_PROGRESS', 'TAKING', 'CURRENT'];
  const withdrawnGrades = ['W'];
  const failedGrades = ['F'];
  
  const upperGrade = grade.toUpperCase();
  
  if (passingGrades.includes(upperGrade)) return 'completed';
  if (inProgressGrades.includes(upperGrade)) return 'in_progress';
  if (withdrawnGrades.includes(upperGrade)) return 'withdrawn';
  if (failedGrades.includes(upperGrade)) return 'failed';
  
  return 'planned';
};
```

### 5.4 Session Expiry Handling

```typescript
// Start countdown after PIN verification
useEffect(() => {
  if (!sessionExpiresAt) return;
  
  const interval = setInterval(() => {
    const remaining = new Date(sessionExpiresAt).getTime() - Date.now();
    
    if (remaining <= 0) {
      clearInterval(interval);
      showToast("Session expired. Please re-enter PIN.");
      redirectToStep(2);
    } else if (remaining <= 60000) {
      showWarning("Session expires in less than 1 minute!");
    }
  }, 1000);
  
  return () => clearInterval(interval);
}, [sessionExpiresAt]);
```

---

## 6. Curriculum Selection Flow

### 6.1 Scenario A: Portal has department assigned (common)

```typescript
// After PIN verification, fetch curricula
const { curricula, total, default_curriculum_id, portal_department_id } = 
  await fetch(`/api/public/graduation-portals/${portalId}/curricula`).then(r => r.json());

if (total > 0) {
  // Show curriculum selection cards
  // Pre-select the one with is_default: true
  setCurricula(curricula);
  setSelectedCurriculum(default_curriculum_id);
}
```

### 6.2 Scenario B: Portal has no department (fallback)

```typescript
if (total === 0 && !portal_department_id) {
  // Step 1: Fetch faculties
  const { faculties } = await fetch('/api/public/faculties').then(r => r.json());
  
  // Step 2: User selects faculty
  // Step 3: Fetch departments for selected faculty
  const { departments } = await fetch(
    `/api/public/departments?faculty_id=${selectedFacultyId}`
  ).then(r => r.json());
  
  // Step 4: User selects department
  // Step 5: Fetch curricula with department filter
  const { curricula } = await fetch(
    `/api/public/graduation-portals/${portalId}/curricula?department_id=${selectedDeptId}`
  ).then(r => r.json());
  
  // Step 6: User selects curriculum
}
```

---

## 6.3 File Pre-Validation (NEW)

Before allowing submission, validate the uploaded file client-side:

### Validation Rules

```typescript
interface FileValidationResult {
  valid: boolean;
  errors: FileValidationError[];
  warnings: FileValidationWarning[];
  parsedData: Course[] | null;
}

interface FileValidationError {
  type: 'format' | 'structure' | 'data';
  message: string;
  row?: number;
  column?: string;
}

interface FileValidationWarning {
  type: 'data_quality' | 'missing_optional';
  message: string;
  row?: number;
  column?: string;
}

const validateFile = async (file: File): Promise<FileValidationResult> => {
  const errors: FileValidationError[] = [];
  const warnings: FileValidationWarning[] = [];
  
  // 1. Format validation
  const validExtensions = ['.xlsx', '.xls', '.csv'];
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validExtensions.includes(ext)) {
    errors.push({
      type: 'format',
      message: `Invalid file format. Accepted: ${validExtensions.join(', ')}`
    });
    return { valid: false, errors, warnings, parsedData: null };
  }
  
  // 2. File size validation
  const maxSizeMB = 5;
  if (file.size > maxSizeMB * 1024 * 1024) {
    errors.push({
      type: 'format',
      message: `File too large. Maximum size: ${maxSizeMB}MB`
    });
    return { valid: false, errors, warnings, parsedData: null };
  }
  
  // 3. Parse file
  let data: any[];
  try {
    data = await parseFile(file); // Uses xlsx or papaparse
  } catch (e) {
    errors.push({
      type: 'format',
      message: 'Failed to parse file. File may be corrupted.'
    });
    return { valid: false, errors, warnings, parsedData: null };
  }
  
  // 4. Structure validation - check required columns
  const requiredColumns = ['code', 'name', 'credits'];
  const optionalColumns = ['grade', 'semester', 'category'];
  const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase().trim());
  
  for (const col of requiredColumns) {
    if (!headers.some(h => h.includes(col))) {
      errors.push({
        type: 'structure',
        message: `Missing required column: "${col}"`
      });
    }
  }
  
  // 5. Minimum data validation
  if (data.length === 0) {
    errors.push({
      type: 'data',
      message: 'File contains no course data'
    });
  }
  
  if (errors.length > 0) {
    return { valid: false, errors, warnings, parsedData: null };
  }
  
  // 6. Row-by-row data validation
  const parsedCourses: Course[] = [];
  
  data.forEach((row, index) => {
    const rowNum = index + 2; // Excel rows start at 1, plus header
    
    // Course code format (flexible: "XX 000" or "XX000" or "XX-000")
    const code = row.code?.toString().trim();
    if (!code) {
      errors.push({
        type: 'data',
        message: `Missing course code`,
        row: rowNum,
        column: 'code'
      });
    } else if (!/^[A-Z]{2,4}[\s\-]?\d{3,4}[A-Z]?$/i.test(code)) {
      warnings.push({
        type: 'data_quality',
        message: `Unusual course code format: "${code}"`,
        row: rowNum,
        column: 'code'
      });
    }
    
    // Credits must be a number
    const credits = parseFloat(row.credits);
    if (isNaN(credits) || credits <= 0 || credits > 12) {
      errors.push({
        type: 'data',
        message: `Invalid credits value: "${row.credits}"`,
        row: rowNum,
        column: 'credits'
      });
    }
    
    // Grade validation (if present)
    const grade = row.grade?.toString().trim().toUpperCase();
    const validGrades = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F', 'S', 'U', 'P', 'W', 'IP', 'I', ''];
    if (grade && !validGrades.includes(grade)) {
      warnings.push({
        type: 'data_quality',
        message: `Unrecognized grade: "${grade}"`,
        row: rowNum,
        column: 'grade'
      });
    }
    
    parsedCourses.push({
      code: code || '',
      name: row.name?.toString().trim() || '',
      credits: credits || 0,
      grade: grade || null,
      status: gradeToStatus(grade),
      semester: row.semester?.toString().trim() || null,
      category: row.category?.toString().trim() || null
    });
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    parsedData: errors.length === 0 ? parsedCourses : null
  };
};
```

### Validation UI Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  File Upload                                                    │
│  ────────────                                                   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  📄 Drop file here or click to browse                   │   │
│  │     Accepted: .xlsx, .xls, .csv (max 5MB)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │
│                                                                 │
│  📋 Validation Results                                          │
│                                                                 │
│  ✅ File format valid                                           │
│  ✅ Required columns found                                      │
│  ✅ 45 courses parsed                                           │
│                                                                 │
│  ⚠️ Warnings (2):                                               │
│  • Row 12: Unusual course code format "ELEC1234"               │
│  • Row 28: Unrecognized grade "AU"                             │
│                                                                 │
│  [View Parsed Data]  [Re-upload]  [Continue →]                 │
└─────────────────────────────────────────────────────────────────┘
```

### Error State UI

```
┌─────────────────────────────────────────────────────────────────┐
│  ❌ Validation Failed                                           │
│                                                                 │
│  Errors (3):                                                    │
│  • Missing required column: "credits"                          │
│  • Row 5: Missing course code                                  │
│  • Row 15: Invalid credits value "three"                       │
│                                                                 │
│  Please fix these issues and re-upload your file.              │
│                                                                 │
│  [Download Template]  [Re-upload File]                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Error Handling

### 7.1 Error Codes Reference

| Code | HTTP Status | Description | Frontend Action |
|------|-------------|-------------|-----------------|
| `SESSION_TOKEN_MISSING` | 401 | No token in header | Redirect to PIN entry |
| `SESSION_EXPIRED` | 401 | Token expired | Redirect to PIN entry |
| `SESSION_IP_MISMATCH` | 401 | IP changed | Redirect to PIN entry |
| `SESSION_PORTAL_MISMATCH` | 403 | Wrong portal | Show error message |
| `PORTAL_INACTIVE` | 410 | Portal closed/expired | Show message, go to Step 1 |
| `INVALID_PIN` | 401 | Wrong PIN | Show attempts remaining |
| `RATE_LIMITED` | 429 | Too many attempts | Show countdown timer |
| `SUBMISSION_EXPIRED` | 404 | Submission data expired | Ask to resubmit |

### 7.2 Step-by-Step Error Handling

| Step | Error | User Action |
|------|-------|-------------|
| 2 | `INVALID_PIN` | Show error, display attempts remaining |
| 2 | `RATE_LIMITED` | Show countdown timer, disable input |
| 2 | `PORTAL_INACTIVE` | Show message, redirect to Step 1 |
| 3 | Network error | Show retry button |
| 6 | `SESSION_EXPIRED` | Show message, redirect to Step 2 |
| 6 | 422 validation | Show field-level errors, stay on Step 5 |

---

## 8. WebSocket Events (Real-time Updates)

### 8.1 Channels

```typescript
// Private channel for specific portal
`private-graduation-portal.{portalId}`

// Private channel for department-wide notifications
`private-department.{departmentId}.graduation`
```

### 8.2 Events

#### New Submission Event
```typescript
// Event name: submission.new
{
  submission_id: "550e8400-e29b-41d4-a716-446655440000",
  portal_id: 1,
  portal_name: "Graduation Check 2026",
  student_identifier: "John Doe - 6512345",
  curriculum_id: "019b2d53-f1da-70ff-8814-38ddac90427c",
  course_count: 45,
  submitted_at: "2026-02-06T10:00:00Z"
}
```

#### Submission Validated Event
```typescript
// Event name: submission.validated
{
  submission_id: "550e8400-e29b-41d4-a716-446655440000",
  portal_id: 1,
  status: "validated",
  can_graduate: false,
  completion_percentage: 61.2
}
```

### 8.3 Laravel Echo Setup (Frontend)

```typescript
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const echo = new Echo({
  broadcaster: 'pusher',
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  forceTLS: true,
  authorizer: (channel, options) => {
    return {
      authorize: (socketId, callback) => {
        fetch('/api/broadcasting/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            socket_id: socketId,
            channel_name: channel.name
          })
        })
        .then(response => response.json())
        .then(data => callback(false, data))
        .catch(error => callback(true, error));
      }
    };
  }
});

// Listen for new submissions
echo.private(`graduation-portal.${portalId}`)
  .listen('.submission.new', (event) => {
    console.log('New submission:', event);
    // Refresh submissions list
    fetchSubmissions();
    // Add to notification dropdown
    addNotification(event);
  })
  .listen('.submission.validated', (event) => {
    console.log('Submission validated:', event);
    // Update submission status in UI
  });
```

---

## 8.4 Chairperson Notification System (NEW)

A Discord-style notification dropdown for chairpersons to receive real-time updates about new submissions.

### Notification Data Structure

```typescript
interface GraduationNotification {
  id: string;                    // UUID
  type: 'new_submission' | 'submission_validated' | 'portal_deadline_reminder';
  portal_id: number;
  portal_name: string;
  title: string;                 // e.g., "New Submission"
  message: string;               // e.g., "John Doe - 6512345 submitted to Graduation Check 2026"
  timestamp: string;             // ISO datetime
  read: boolean;
  data: {                        // Additional context for routing
    submission_id?: string;
    student_identifier?: string;
  };
}

interface NotificationState {
  notifications: GraduationNotification[];
  unreadCount: number;
  isOpen: boolean;
}
```

### Notification Dropdown Component

```tsx
// components/graduation/NotificationDropdown.tsx

interface NotificationDropdownProps {
  className?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ className }) => {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isOpen: false
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setState(prev => ({ ...prev, isOpen: false }));
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // WebSocket listener
  useEffect(() => {
    const channel = echo.private(`department.${departmentId}.graduation`);
    
    channel.listen('.submission.new', (event: any) => {
      const notification: GraduationNotification = {
        id: crypto.randomUUID(),
        type: 'new_submission',
        portal_id: event.portal_id,
        portal_name: event.portal_name,
        title: 'New Submission',
        message: `${event.student_identifier} submitted to ${event.portal_name}`,
        timestamp: event.submitted_at,
        read: false,
        data: {
          submission_id: event.submission_id,
          student_identifier: event.student_identifier
        }
      };
      
      setState(prev => ({
        ...prev,
        notifications: [notification, ...prev.notifications].slice(0, 50), // Keep last 50
        unreadCount: prev.unreadCount + 1
      }));
    });
    
    return () => channel.stopListening('.submission.new');
  }, [departmentId]);

  const handleNotificationClick = (notification: GraduationNotification) => {
    // Mark as read
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - (notification.read ? 0 : 1)),
      isOpen: false
    }));
    
    // Navigate to the submission
    router.push(`/graduation-portals/${notification.portal_id}/submissions/${notification.data.submission_id}`);
  };

  const markAllAsRead = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0
    }));
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setState(prev => ({ ...prev, isOpen: !prev.isOpen }))}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <Bell className="h-5 w-5" />
        {state.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {state.unreadCount > 9 ? '9+' : state.unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {state.isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm">Graduation Submissions</h3>
            {state.unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {state.notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              state.notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "p-3 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                    !notification.read && "bg-blue-50 dark:bg-blue-900/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-2",
                      !notification.read ? "bg-blue-500" : "bg-transparent"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatRelativeTime(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Footer */}
          {state.notifications.length > 0 && (
            <div className="p-2 border-t border-gray-200 dark:border-gray-700">
              <Link 
                href="/graduation-portals"
                className="block text-center text-xs text-blue-600 hover:text-blue-800"
              >
                View all submissions
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### Visual Design Reference (Discord-style)

```
┌──────────────────────────────────────────────┐
│ ┌────┐                                       │
│ │ 🔔 │ ← Bell icon in header/navbar          │
│ │ (2)│ ← Unread badge (red circle)           │
│ └────┘                                       │
│     │                                        │
│     ▼                                        │
│ ┌────────────────────────────────────────┐   │
│ │ Graduation Submissions    [Mark all]   │   │
│ ├────────────────────────────────────────┤   │
│ │ ● New Submission                       │   │ ← Blue dot = unread
│ │   John Doe - 6512345 submitted...      │   │
│ │   2 minutes ago                        │   │
│ ├────────────────────────────────────────┤   │
│ │ ● New Submission                       │   │
│ │   Jane Smith - 6512346 submitted...    │   │
│ │   5 minutes ago                        │   │
│ ├────────────────────────────────────────┤   │
│ │   Submission Validated ← read (no dot) │   │
│ │   Mike Johnson reviewed...             │   │
│ │   1 hour ago                           │   │
│ ├────────────────────────────────────────┤   │
│ │        View all submissions →          │   │
│ └────────────────────────────────────────┘   │
│                                              │
│  Clicking outside closes the dropdown        │
└──────────────────────────────────────────────┘
```

### Placement in Layout

The notification bell should be placed in the chairperson's header/navbar:

```tsx
// In chairperson layout header
<header className="flex items-center justify-between px-4 py-2">
  <Logo />
  <nav>{/* navigation items */}</nav>
  <div className="flex items-center gap-4">
    <NotificationDropdown />  {/* ← Add here */}
    <UserMenu />
  </div>
</header>
```

---

## 9. Configuration

### 9.1 Environment Variables

```env
# Session TTL (minutes)
GRADUATION_SESSION_TTL=15

# Submission retention (days after portal deadline) - PDPA compliance
# Submissions are kept for review until this many days after portal deadline
GRADUATION_SUBMISSION_RETENTION_DAYS=7

# IP validation (disable for VPN users)
GRADUATION_VALIDATE_IP=true

# Max file size (MB)
GRADUATION_MAX_FILE_SIZE=5

# Cache store (redis recommended for production)
GRADUATION_CACHE_STORE=file

# Rate limiting
GRADUATION_MAX_PIN_ATTEMPTS=5
GRADUATION_PIN_ATTEMPT_DECAY=15

# Max pending submissions per portal
GRADUATION_MAX_PENDING_SUBMISSIONS=100
```

### 9.2 Config File Reference

File: `config/graduation.php`

```php
return [
    'session_ttl_minutes' => env('GRADUATION_SESSION_TTL', 15),
    'submission_retention_days' => env('GRADUATION_SUBMISSION_RETENTION_DAYS', 7),
    'validate_ip' => env('GRADUATION_VALIDATE_IP', true),
    'max_file_size_mb' => env('GRADUATION_MAX_FILE_SIZE', 5),
    'cache_store' => env('GRADUATION_CACHE_STORE', 'file'),
    'max_pin_attempts' => env('GRADUATION_MAX_PIN_ATTEMPTS', 5),
    'pin_attempt_decay_minutes' => env('GRADUATION_PIN_ATTEMPT_DECAY', 15),
    'max_pending_submissions' => env('GRADUATION_MAX_PENDING_SUBMISSIONS', 100),
];
```

---

## 10. Backend Files Reference

### 10.1 Controllers

| File | Description |
|------|-------------|
| `app/Http/Controllers/PublicGraduationPortalController.php` | Public endpoints for students |
| `app/Http/Controllers/GraduationSubmissionController.php` | Cache-based submission handling |
| `app/Http/Controllers/API/Chairperson/GraduationPortalController.php` | Chairperson portal management |

### 10.2 Models

| File | Description |
|------|-------------|
| `app/Models/GraduationPortal.php` | Portal model with PIN methods |
| `app/Models/GraduationPortalLog.php` | Audit log model |
| `app/Models/GraduationSubmission.php` | Legacy DB submission model |

### 10.3 Services

| File | Description |
|------|-------------|
| `app/Services/GraduationValidationService.php` | Validates courses against curriculum |

### 10.4 Middleware

| File | Description |
|------|-------------|
| `app/Http/Middleware/ValidateGraduationSession.php` | Session token validation |

### 10.5 Events

| File | Description |
|------|-------------|
| `app/Events/NewGraduationSubmission.php` | Broadcast new submission |
| `app/Events/SubmissionValidated.php` | Broadcast validation result |

### 10.6 Requests

| File | Description |
|------|-------------|
| `app/Http/Requests/StoreGraduationPortalRequest.php` | Portal creation validation |
| `app/Http/Requests/UpdateGraduationPortalRequest.php` | Portal update validation |
| `app/Http/Requests/StoreGraduationSubmissionRequest.php` | Submission validation |

### 10.7 Migrations

| File | Description |
|------|-------------|
| `2026_01_14_163703_create_graduation_portals_table.php` | Main portal table |
| `2026_01_14_163720_create_graduation_submissions_table.php` | Legacy submissions table |
| `2026_01_20_100000_add_column_name_graduation_portals.php` | Added pin_hash, max_file_size_mb, closed_at |
| `2026_01_20_100001_create_graduation_portal_logs_table.php` | Audit log table |

---

## 11. Frontend Components Needed

### 11.1 Student Side

| Component | Description |
|-----------|-------------|
| `PortalBrowserPage` | List active portals with deadline countdown |
| `PinEntryModal` | PIN input with rate limit handling |
| `CurriculumSelectionStep` | Curriculum cards or cascade selector |
| `FileUploadStep` | File dropzone with client-side parsing |
| `FilePreValidator` | **NEW** - Validates file format and data before submission |
| `SubmissionPreview` | Review courses before submit |
| `SubmissionConfirmation` | Success message with retention notice |
| `SessionExpiryWarning` | Toast/modal for session expiry |

### 11.2 Chairperson/Advisor Side

| Component | Description |
|-----------|-------------|
| `NotificationDropdown` | **NEW** - Discord-style notification bell with dropdown |
| `PortalManagement` | Create/edit/close portals |
| `SubmissionsList` | Cached submissions with deletion countdown |
| `SubmissionDetail` | Full validation result view |
| `ValidationActions` | Validate/approve/reject buttons |
| `BatchValidation` | Multi-select and batch validate |
| `SubmissionReport` | Downloadable PDF/Excel report |

---

## 12. PDPA Compliance Notes

1. **No Permanent Storage**: Student submissions are stored in cache only (not database)
2. **Time-Bound Retention**: Submissions auto-delete 1 week after portal deadline
3. **PIN Hashing**: PINs are hashed with bcrypt
4. **IP Validation**: Optional IP verification for session security
5. **Rate Limiting**: Prevents brute-force PIN attempts
6. **Audit Logging**: Actions are logged for accountability (without PII)

---

## 13. Testing Commands

```bash
# List all graduation routes
php artisan route:list --path=graduation

# Test model instantiation
php artisan tinker --execute="new \App\Models\GraduationPortal(); new \App\Models\GraduationPortalLog();"

# Check config values
php artisan tinker --execute="config('graduation');"

# Clear cache (useful during development)
php artisan cache:clear
```

---

## 14. Related Documentation

- [GRADUATION_PORTAL_BACKEND_UPDATES.md](../GRADUATION_PORTAL_BACKEND_UPDATES.md) - Backend changes summary
- [GRADUATION_PORTAL_FRONTEND_INTEGRATION.md](../GRADUATION_PORTAL_FRONTEND_INTEGRATION.md) - Full frontend integration guide
- [CODEBASE_OVERVIEW.md](../CODEBASE_OVERVIEW.md) - Overall codebase structure

---

## 15. Future Considerations

### 15.1 Auto Curriculum Mapping (DEFERRED)

> ⚠️ **Status:** Deferred for future implementation  
> **Requested:** February 6, 2026  
> **Reason:** Requires additional backend support and student ID pattern analysis

**Requirement:**  
Automatically map student IDs to their correct curriculum instead of letting students manually select. This would reduce human error in curriculum selection.

**Proposed Implementation:**
1. Extract batch/year from student ID (e.g., `6512345` → batch `65` → year 2022)
2. Match batch to department-specific curriculum rules
3. Auto-select the appropriate curriculum based on:
   - Student ID prefix/batch number
   - Department the portal belongs to
   - Active curriculum for that batch

**Considerations:**
- Different departments may have different ID patterns
- Some students may have transferred or changed programs
- Edge cases: students retaking, delayed graduation, etc.
- May need a "Override curriculum" option for edge cases

**Backend Requirements (when implemented):**
- API endpoint to resolve curriculum from student ID
- Curriculum-batch mapping configuration
- Fallback to manual selection when auto-mapping fails

---

**Document Version:** 1.4  
**Last Updated:** February 11, 2026  
**Author:** Backend Team / Frontend Team

**Changelog:**
- v1.4 (Feb 11, 2026): REQ-5 backend complete (grace period config, model, controller, submission gate). REQ-6 backend complete (enhanced validation response shape). Breaking changes reviewed with frontend — 6 items resolved. `deadline` stays `Y-m-d`, `unmatchedCourses` kept as objects, `requirements` converted to array, `validation` moved to top-level key.
- v1.3 (Feb 7, 2026): Added REQ-5 (Grace Period) - frontend complete, backend requirements documented. Added REQ-6 (Enhanced Submission Detail) - frontend complete with DonutChart, SegmentedProgressBar, GPA, course breakdowns, validation checklist. Updated files modified table.
- v1.2 (Feb 6, 2026): Added detailed backend requirements for REQ-1 (retention), REQ-2 (notifications), REQ-3 (validation)
- v1.1 (Feb 6, 2026): Added pending updates - submission retention change, notification system, file pre-validation, auto curriculum mapping note
- v1.0 (Feb 6, 2026): Initial document

---

## Implementation Order

### Recommended Sequence:

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: Frontend can proceed immediately                      │
│  ─────────────────────────────────────────────                  │
│  ✅ REQ-3: File Pre-Validation (Frontend Only)                  │
│     → No backend changes needed                                 │
│     → Implement FilePreValidator component                      │
│     → Update FileUploadStep with validation                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: Backend implements, Frontend integrates               │
│  ───────────────────────────────────────────────                │
│  🟡 REQ-1: Submission Retention Change                          │
│     → Backend: Update cache TTL calculation                     │
│     → Backend: Add deletion_date to API response                │
│     → Frontend: Update SubmissionConfirmation component         │
│                                                                 │
│  🟡 REQ-2: Notification System                                  │
│     → Backend: Create notification model & migration            │
│     → Backend: Create notification API endpoints                │
│     → Backend: Update submission handler to create notifs       │
│     → Frontend: Implement NotificationDropdown component        │
│     → Frontend: Add to chairperson layout header                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: Future (after all above complete)                     │
│  ──────────────────────────────────────────                     │
│  🔵 REQ-4: Auto Curriculum Mapping                              │
│     → Requires discussion on student ID patterns                │
│     → Backend + Frontend changes                                │
└─────────────────────────────────────────────────────────────────┘
```

### Current Action Items:

| Owner | Task | Priority |
|-------|------|----------|
| **Frontend** | Implement FilePreValidator component (REQ-3) | 🟢 Start Now |
| **Both** | Integration testing — verify REQ-5/REQ-6 end-to-end | 🟡 High |
| **Backend** | Add `GRADUATION_GRACE_PERIOD_DAYS=7` to production `.env` | 🟢 Before deploy |
