# Student API Expectations

This document lists every backend endpoint the current student-facing flows rely on. All routes are relative to `API_BASE` (see `src/lib/api/laravel.ts`).

## Shared Requirements
- All fetches include credentials (`include`), so Laravel Sanctum cookies must be available when required.
- JSON responses should wrap data using the shapes referenced below. Missing optional fields should default to empty arrays/objects rather than `null`.

## Data Entry & Transcript Import
1. `GET /public-faculties`
   - Provides faculty list used to start the audit wizard.
2. `GET /public-departments`
   - Supplies department dropdown data.
3. `GET /public-curricula`
   - Returns all curricula with department references.
4. `GET /public-concentrations?curriculum_id={uuid}&department_id={id}`
   - Populates concentration choices after the curriculum selection.
5. `GET /public-curricula?curriculumId={uuid}` *(legacy shape in transcript import)*
   - Must include `curriculumCourses`, `electiveRules`, and course `category` metadata for auto-categorization.
6. `GET /courses?departmentId={id}&code={courseCode}` *(fallback during transcript reconciliation)*
   - Used sparingly to hydrate missing course titles/credits.

## Course Planning
1. `GET /available-courses?curriculum_id={uuid}&department_id={id}`
   - Drives the entire "Available Courses" list, including course flags, categories, prerequisites, and `bannedWith` data.
2. `GET /public-concentrations?curriculum_id={uuid}&department_id={id}`
   - Required for the concentration analysis modal.
3. `GET /public-curricula/{uuid}/blacklists`
   - Returns the active blacklist entries with nested course details.

## Academic Progress
1. `GET /public-curricula`
   - Used to rehydrate the student's curriculum metadata when rendering the progress dashboard.
2. `GET /public-concentrations?curriculum_id={uuid}&department_id={id}`
   - Enables concentration progress recomputation if no saved analysis exists.
3. `GET /public-curricula/{uuid}/blacklists`
   - Supplies blacklist violations surfaced in the warning banner.
4. `GET /available-courses?curriculum_id={uuid}&department_id={id}`
   - Needed when exporting grouped course data to CSV.

## Validation & Recommendations (`src/lib/validation/courseValidation.ts`)
1. `GET /public-curricula/{uuid}`
   - Source of constraints, elective rules, and total credit targets for `validateStudentProgress` and `calculateCurriculumProgress`.
2. `GET /public-curricula/{uuid}/blacklists`
   - Invoked inside `fetchBlacklists` for validator blacklist checks.
3. `GET /available-courses?curriculumId={uuid}&departmentId={id}`
   - Preferred source of course metadata for recommendations. The helper falls back to:
4. `GET /public-courses`
   - Filtered client-side by `departmentId` when the specialized endpoint fails.

## Notes
- All UUID parameters reference the curriculum IDs stored in `studentAuditData` localStorage records.
- Ensure CORS and Sanctum cookie settings allow calls from the Next.js domain in both local and deployed environments.
- When new student features go live, update this file so backend and frontend stay aligned.
