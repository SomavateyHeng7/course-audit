# Frontend Final Fixes Progress

Date: 2026-03-14

## Context
User test feedback after first implementation pass:
- Prerequisite/corequisite checking + flagging still not working as expected.
- Planning page split exists but schedule tab layout has excessive white space.
- Schedule should appear immediately after tentative schedule selection.

## Changes Applied (Second Pass)

### 1) Prerequisite/corequisite live checking + flagging
File:
- `src/app/student/management/course-planning/page.tsx`

Fixes:
- Extended live validation to check **corequisites** (not only prerequisites).
- Preserved system/manual warning notes while regenerating live missing prereq/coreq notes.
- Added missing-corequisite note generation:
  - `Missing corequisites: ...`
- Updated computed `validationStatus` to warning if either prereq/coreq is missing.

Flagging improvements:
- When adding a course with rule warnings (permission/senior standing), warning notes are now stored on the planned course.
- Those notes persist into live validation output.

### 2) Schedule tab layout white-space issue
File:
- `src/app/student/management/course-planning/page.tsx`

Fixes:
- Grid is now tab-aware:
  - `Planning` tab keeps 3-column layout (left tools + right summary).
  - `Tentative & Schedule` tab uses a full-width layout for the main panel.
- Right summary column is hidden in schedule tab to remove large empty side area.
- Left panel card title changes by tab context:
  - Planning tab: `Available Courses`
  - Schedule tab: `Tentative Schedule`

### 3) Schedule render timing after tentative selection
File:
- `src/app/student/management/course-planning/page.tsx`

Fixes:
- Schedule section now appears as soon as a tentative schedule is selected (even if course list not populated yet).
- Added immediate placeholder state under schedule area:
  - `Loading tentative schedule courses...`
  - or no-courses message if selected schedule has none.

## Files Changed in This Pass
- `src/app/student/management/course-planning/page.tsx`
- `docs/implementation/FRONTEND_FINAL_FIXES_PROGRESS.md`

## Pending User Re-test Items
Please retest these first and report exact behavior/screenshots if any still fail:
1. Corequisite warnings/validation updates after adding/removing related courses.
2. Flag-based warnings (permission/senior standing) persistence in planned course notes.
3. Schedule tab layout density and spacing after selecting a tentative schedule.
4. Immediate schedule area visibility after schedule selection.

## 2026-03-15 Follow-up Fix Pass

User report:
- Some courses still show `0 credits` in planning list.
- Curriculum prerequisite/corequisite checks still not enforced when adding courses.

Fixes applied:
1. `available-courses` mapping now derives credits from multiple backend field variants, not only `credits`:
  - `credits`
  - `creditHours` / `credit_hours` / `creditHour`
  - nested course fallbacks where present
2. Added canonical course-key normalization for all rule checks (case and spacing insensitive):
  - used in planned/completed/in-progress comparisons
  - used in prerequisite/corequisite validation
  - used in banned/blacklist validation
3. Expanded curriculum course relation extraction to support snake_case relation names:
  - `curriculum_prerequisites`
  - `curriculum_corequisites`

Primary file changed:
- `src/app/student/management/course-planning/page.tsx`

Requested re-test focus:
1. Course cards that previously showed `0 credits` now display expected values.
2. Add course with known curriculum prerequisite (e.g., Senior Project 2 requiring Senior Project 1) now shows missing prerequisite warning and status.
3. Corequisite checks are reflected in warning notes when pair course is absent.

## 2026-03-15 Payload-Shape Hardening Pass

Additional issue observed:
- Some courses still displayed `0 credits` and constraints still looked absent for certain records.

Additional fixes applied:
1. Improved credit parser behavior for hyphenated credit-hour strings:
  - Supports direct strings like `3`, `3 credits`
  - Supports `x-y-z` with fallback to last slot when first slot is `0` (e.g., `0-0-3`)
2. Expanded prerequisite/corequisite code extraction for nested payload shapes:
  - `item.code`
  - `item.courseCode`
  - `item.course.code`
  - `item.prerequisite.code`
  - `item.corequisite.code`
3. Added snake_case + camelCase normalization for course flags:
  - `requiresPermission` / `requires_permission`
  - `summerOnly` / `summer_only`
  - `requiresSeniorStanding` / `requires_senior_standing`
  - `minCreditThreshold` / `min_credit_threshold`
4. Added final stabilization pass for credits before setting available courses.

Primary file changed:
- `src/app/student/management/course-planning/page.tsx`

## Remaining Previously Planned Areas (not re-verified in this pass)
- Student PDF download flow (added in prior pass) needs your functional retest.
- Chairperson constraints add/remove and override toggles need your retest on real data.

## 2026-03-15 UI Credit Parser + Mapping Pass

Additional targeted fixes applied:
1. Fixed `0 credits` rendering in list cards by updating local parsers in UI components:
  - `src/components/features/management/CourseCard.tsx`
  - `src/components/features/management/CourseWithSections.tsx`
  - Both now support `0-0-3` style values by falling back to the last slot when the first is zero.
2. Expanded available-courses fallback mapping for prerequisite/corequisite variants:
  - `prerequisiteCodes` / `prerequisite_codes`
  - `corequisiteCodes` / `corequisite_codes`
  - nested `course.prerequisites` / `course.corequisites`
  - additional nested code keys (`course_code`, `prerequisiteCode`, `corequisiteCode`, etc.)
3. Expanded fallback for course code source itself:
  - `course.code`, `courseCode`, `course_code`, `course.code` (nested)

Primary files changed in this pass:
- `src/components/features/management/CourseCard.tsx`
- `src/components/features/management/CourseWithSections.tsx`
- `src/app/student/management/course-planning/page.tsx`

## 2026-03-15 Object-Shape Credit + Constraints Pass

User validation still showed:
- `CSX3011` rendering `0 credits` in planning while data-entry shows `3 credits`
- prerequisite/corequisite checks still not consistently appearing

Fixes applied in planning mapper/parsers:
1. Upgraded planning `parseCredits` to accept object payloads (not only string/number):
  - supports nested keys like `credits`, `creditHours`, `credit_hours`, `creditHour`, `value`, `total`
2. Added additional credit source fallbacks used by some payloads:
  - `courseCreditHours` / `course_credit_hours`
  - nested `course.creditHour`
3. Strengthened relation code extraction for prerequisites/corequisites:
  - `prerequisite_course_code`, `corequisite_course_code`
  - nested `prerequisiteCourse.course.code`, `corequisiteCourse.course.code`
4. Switched per-course constraints response parsing to shared `normalizeCodeArray` for consistent extraction.
5. Added dev-only debug logging for suspicious records (zero-credit or empty prereq/coreq arrays) to quickly capture real payload shapes.

Primary file changed:
- `src/app/student/management/course-planning/page.tsx`

## 2026-03-15 Payload-Driven Finalization (CSX3011)

Real captured payload confirmed:
- `availableCourse.credits` is malformed (contains description text, not numeric credits)
- Correct numeric credits exist at `curriculumCourse.course.credits` (`3`)
- Course-level prerequisites are delivered as string arrays in `curriculumCourse.course.prerequisites` (e.g., `["CSX3010"]`)

Fixes applied:
1. Added `curriculumCreditsMap` from `public-curricula` response and used it as authoritative fallback when `available-courses` credit fields are malformed.
2. Switched curriculum prerequisite/corequisite extraction to shared `normalizeCodeArray(...)` so both object arrays and string arrays are supported.
3. Added curriculum credit map into both primary and stabilization credit fallbacks.

Expected outcome for retest:
1. `CSX3011` now displays `3 credits` in planning (matching data-entry).
2. Prerequisite check for `CSX3011` should now surface missing `CSX3010` if not completed/planned.

## 2026-03-17 Cleanup + Verification Summary

### 1) Diagnostics panel kept but disabled
File:
- `src/app/student/management/course-planning/page.tsx`

Change:
- Added `showDiagnosticsCapture = false` feature flag and gated the diagnostics UI rendering.
- Diagnostics code is preserved for future troubleshooting and can be re-enabled by changing the flag to `true`.

### 2) Add Course button status (chairperson info_edit)
Verification:
- In `CoursesTab`, the visible Add Course trigger is still intentionally removed (optional removal path).
- The info_edit add modal and `handleSaveAddCourse` flow still exist, but no tab-level trigger button is rendered from `CoursesTab`.

Status:
- This item is not broken by recent fixes; it is currently in the intentionally-disabled state.

### 3) Student Download Schedule as PDF status
Verification:
- Implemented in `src/app/student/management/schedule-view/page.tsx`.
- `handleDownloadSchedulePDF` maps planned courses into PDF payload and calls `exportScheduleToPDF(...)`.
- UI button exists: `Download as PDF`.

Status:
- Implemented and ready for UAT.

## Test Flow (Requested)

### A) Student schedule PDF
1. Go to `Student > Course Management > Course Planning` and add at least one course with schedule details.
2. Navigate to `Student > Course Management > Schedule View`.
3. Confirm planned courses are visible.
4. Click `Download as PDF`.
5. Verify file is downloaded and contains course code, title, section, day/time, instructor, room, and credits.

### B) Chairperson Add Course (current intended state)
1. Go to `Chairperson > Curriculum Info Edit` and open `Courses` tab.
2. Confirm there is no tab-level `Add Course` action in `CoursesTab`.
3. This matches the chosen optional path (button removed, not partially broken).

### C) Chairperson Add Course (if you decide to re-enable)
1. Re-enable Add Course trigger in `CoursesTab`.
2. Open `Courses` tab and click `Add Course`.
3. Select existing course or create new course in the modal.
4. Click `Add Course` and verify success toast plus refreshed course list.

## 2026-03-17 Re-enable + UI Cleanup Pass

### 1) Re-enabled Add Course button in CoursesTab
File:
- `src/components/features/curriculum/CoursesTab.tsx`

Change:
- Restored visible `Add Course` action in the top controls area.
- Button now calls existing `onAddCourse` handler from info_edit page.

### 2) Removed Diagnostics Capture card from planning page UI
File:
- `src/app/student/management/course-planning/page.tsx`

Change:
- Removed rendered diagnostics card block so it no longer appears in either planning tab context.
- Kept underlying helper logic in file for potential future troubleshooting.

## Updated Test Flow

### A) Chairperson Add Course (re-enabled)
1. Open `Chairperson > Curriculum Info Edit > Courses` tab.
2. Click `Add Course` button near search/bulk assign controls.
3. In modal, either select existing course or create new course.
4. Click `Add Course`.
5. Verify success toast and course appears in the courses table.

### B) Planning page diagnostics card visibility
1. Open `Student > Course Planning`.
2. Switch between `Planning Features` and `Tentative & Schedule`.
3. Verify `Diagnostics Capture (No Console Needed)` is not visible.
