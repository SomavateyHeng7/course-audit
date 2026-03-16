# Frontend Final Fixes Plan

Date: 2026-03-13
Scope: Frontend only (backend already finalized)

## Goals

1. Rearrange planning page into two separate tabs:
   - Tab A: planning features
   - Tab B: tentative schedule viewing + schedule display
2. Fix tentative schedule rendering issues in planning page.
3. Remove email input flow that appears after first "Save Course Plan" click.
4. Fix prerequisite/corequisite flags and checks in chairperson curriculum info edit.
5. Fix/add/remove Add Course button behavior in info_edit (optional remove as requested).
6. Fix Download schedule as PDF on student side page.

## Current Status (2026-03-17)

1. Planning/tentative tab split: completed.
2. Tentative schedule rendering normalization: completed.
3. Save-triggered email input popup: removed from planning flow.
4. Prerequisite/corequisite + flags in planning flow: completed using payload-driven fallback mapping.
5. Diagnostics capture UI: removed from visible planning UI (helper code retained in file for future troubleshooting).
6. Student schedule PDF button: implemented in schedule-view page.
7. Chairperson info_edit Add Course button behavior:
- `CoursesTab` Add Course trigger is re-enabled.
- Existing modal + `handleSaveAddCourse` flow remains active in info_edit page.

## File Targets

### Student planning page
- `src/app/student/management/course-planning/page.tsx`
- `src/components/ui/tabs.tsx` (reuse existing tabs UI)
- `src/components/features/management/CourseWithSections.tsx`
- `src/components/features/management/CourseScheduleCalendar.tsx`

### Email subscribe popup removal
- `src/app/student/management/course-planning/page.tsx`
- `src/components/features/notifications/NotificationSubscribeDialog.tsx` (remove usage from planning page; component can remain for other pages if needed)

### Chairperson constraints and info_edit
- `src/app/chairperson/info_edit/[id]/page.tsx`
- `src/components/features/curriculum/ConstraintsTab.tsx`
- `src/components/features/curriculum/CoursesTab.tsx`
- `src/services/curriculumCourseConstraintsApi.ts`

### Student PDF export
- `src/app/student/management/progress/page.tsx` (existing PDF logic reference)
- `src/app/student/management/course-planning/page.tsx` and/or `src/app/student/management/schedule-view/page.tsx`

## Implementation Checklist

## 1) Planning page tab split
- Add page-level tabs with clear labels:
  - `Planning`
  - `Tentative & Schedule`
- Move current planning tools to `Planning` tab:
  - Search/filter/category/semester controls
  - Add/remove planned courses
  - Save Course Plan action
- Move tentative schedule selector + schedule renderers to `Tentative & Schedule` tab.
- Keep state shared across tabs (no reset when switching).

## 2) Tentative schedule rendering fix
- Normalize schedule detail payload immediately after fetch:
  - `days`, `timeStart`, `timeEnd`, `section`, `instructor`, `room`, `capacity`, `enrolled`
- Ensure list cards and calendar consume one normalized shape.
- Remove brittle render gating tied to UI-only booleans where possible.
- Add safe fallbacks for partial schedule data.

## 3) Remove email input popup after Save
- Remove save-triggered notification popup logic from course planning page.
- Remove related localStorage first-time trigger key usage in this flow.
- Keep save behavior limited to plan persistence + concentration analysis modal.

## 4) Prerequisite/corequisite + flags/check fix (chairperson)
- Ensure selected course mapping always resolves `curriculumCourseId` reliably.
- After add/remove prerequisite/corequisite, refresh constraints state from backend source of truth.
- Ensure override flags UI always reflects latest response from `updateOverrides`.
- Keep Courses tab rule display aligned with Constraints tab normalized fields.

## 5) Add Course in info_edit (optional)
- Option A (preferred if still needed): keep button and harden add flow + refresh.
- Option B (if truly optional/frozen): remove Add Course button and related modal trigger path.

## 6) Download schedule as PDF (student side)
- Reuse existing jsPDF approach from progress page.
- Add download action in schedule-focused student page.
- Export from normalized planned/scheduled course data (not mixed shapes).
- Include core fields: course code/title/credits/section/days/time/instructor/room.

## Acceptance Criteria

- Planning page is split into two tabs and both are functional on desktop/mobile.
- Tentative schedules show correctly (sections/times visible when data exists).
- No email input form appears after Save Course Plan.
- Prerequisite/corequisite operations and flag toggles update and persist correctly.
- Add Course behavior matches chosen option (working or removed).
- Student can download schedule PDF successfully from target page.

## Remaining Ownership Items

1. Student PDF flow is implemented and ready for final UAT.

## Endpoint Info Needed (from backend)

The frontend can proceed with current APIs, but one confirmation item will reduce risk:

1. Published schedule detail sample payload
   - Endpoint currently used: `GET /api/published-schedules/{id}`
   - Need one real response sample (with at least 2 courses and section data) to confirm exact field formats for:
     - `days` (array values format)
     - `timeStart`, `timeEnd` (24h vs 12h format)
     - `section`
     - `room`, `instructor`
     - `capacity`, `enrolled`

Optional but useful:

2. Constraints override response confirmation
   - Endpoint: `PUT /api/curricula/{curriculumId}/courses/{curriculumCourseId}/constraints`
   - Confirm response object is always under `overrides` with all four keys present:
     - `overrideRequiresPermission`
     - `overrideSummerOnly`
     - `overrideRequiresSeniorStanding`
     - `overrideMinCreditThreshold`

If you share those payload examples, frontend normalization and final QA can be locked quickly.
