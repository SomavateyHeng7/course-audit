# Progress Page Backend Implementation Plan

## Overview
This document outlines the future backend work required to support the enhanced student progress page. It focuses on keeping the API layer in sync with the UI refactors already shipped (credit overflow handling, category drill‑downs, and richer PDF export data).

## Objectives
1. Provide trustworthy credit totals per category directly from the backend (including overflow metadata) so the frontend no longer has to infer totals from planner/completed lists.
2. Expose the credit pool configuration defined on the chairperson side (category rules, elective pools, limits, overflow policies).
3. Normalize course status data (completed, in_progress, planned) so shared calculations can run server-side for CSV/PDF exports and analytics.
4. Offer export-ready summaries (PDF/CSV/Excel) so the frontend can request preformatted payloads when needed.

## Required APIs
| Endpoint | Method | Purpose | Notes |
| --- | --- | --- | --- |
| `/api/progress/{studentId}` | GET | Returns aggregate progress snapshot (earned/planned credits, GPA, overflow credits, per-category stats). | Response should already be capped at requirement thresholds and include overflow course references. |
| `/api/progress/{studentId}/categories` | GET | Detailed category breakdown including credit pools, requirement metadata, and course lists grouped by status. | Accept optional query params (`?includeCourses=true`, `status=planned`). |
| `/api/progress/{studentId}/overflow` | GET | Explicit list of overflow courses, their original category, reassigned category, and credit deltas. | Used to mirror the frontend overflow callouts. |
| `/api/progress/{studentId}/export` | POST | Generates PDF/CSV/Excel and returns a signed download URL. | Body includes export type and optional filters (category, term range). |

## Data Contracts
### CategoryCreditDetail
```ts
interface CategoryCreditDetail {
  category: string;
  requiredCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  plannedCredits: number;
  overflowCredits: number;
  courses: Array<{
    code: string;
    title: string;
    credits: number;
    status: 'completed' | 'in_progress' | 'planned';
    semesterLabel?: string;
    overflowPortion?: number;
  }>;
}
```

### ProgressSnapshot
```ts
interface ProgressSnapshot {
  studentId: string;
  curriculumId: string;
  totalCreditsRequired: number;
  earnedCredits: number;
  countedEarnedCredits: number;
  plannedCredits: number;
  countedPlannedCredits: number;
  overflowCredits: number;
  gpa: number | null;
  updatedAt: string;
  categories: CategoryCreditDetail[];
}
```

## Backend Tasks
1. **Credit Pool Service**
   - Persist the chairperson-defined credit pool configuration (per category quotas, elective sharing rules) in a dedicated table.
   - Expose a service that, given a student’s completed/planned courses, calculates category credit usage and overflow.

2. **Progress Aggregator**
   - Move the current frontend logic (grouping by category, capping totals, overflow routing) to a backend service.
   - Cache snapshot results per student/curriculum combination with invalidation on enrollment, planner, or grade changes.

3. **Overflow Reassignment Logic**
   - Implement the “excess credits convert to Free Elective” rule server-side, storing history so audits can see when/why a course overflowed.
   - Provide human-readable explanations (e.g., “CS401 exceeded Major allocation by 1 credit”).

4. **Export Pipeline**
   - Build a worker-friendly job that receives a snapshot ID + format, renders PDF/CSV/Excel using the backend data, and stores the artifact in blob storage.
   - Return signed URLs to the frontend along with telemetry/log identifiers.

5. **Testing & Validation**
   - Unit tests for credit redistribution, especially edge cases (multiple overflow sources, zero-credit courses, shared electives).
   - Contract tests ensuring the API always returns consistent totals vs. the legacy calculations.
   - Load tests for `/api/progress/{studentId}` to guarantee fast dashboard loads even with large course histories.

## Integration Notes
- Chairperson UI work will soon emit credit pool configuration changes; subscribe to those events (or poll the same API) so the student progress API stays aligned.
- Keep existing endpoints available until the frontend migrates; provide feature flags so the UI can opt into the new API per environment.
- Document migration steps for the mobile client if it consumes the same progress data.

## Open Questions
1. Should overflow reassignment be stored per term or only as a rolling total?
2. Do we need advisor approval workflows before certain credits can become Free Electives?
3. How should cross-listed courses (shared codes) be handled when quotas differ between departments?

---
Last updated: 2025-12-29
