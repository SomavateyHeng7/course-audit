# Legacy Backend Features Needed for Credit Pools & Type Hierarchies

Use this checklist to confirm the Laravel backend already covers (or will cover) everything the legacy Next.js backend provided that the upcoming credit-pool + multi-level course-type work relies on. Endpoint names below follow the current API but are intentionally generic so you can map them to the new stack.

## 1. Course Catalog & Search
- Department-agnostic course store with CRUD:
  - List/search active courses (code/name/description filters, pagination, credit filter).
  - Create course with metadata (credits, credit hours, description, permission/summer/senior-standing flags, min-credit threshold).
  - Update/delete individual courses.
- Lightweight search optimized for dropdowns (code/name query, exclude list, limited fields).
- Prerequisite/corequisite relations included in payloads for curriculum UI.
- Audit logs for catalog changes (optional but existing implementation records operations).

## 2. Course Type Management (Current Flat Model)
- Department-scoped course-type catalog with default seeding (core/major/etc.).
- CRUD with validation and duplicate checks inside a faculty.
- Bulk assignment endpoint to attach a type to many courses within a curriculum (verifies department + curriculum access, rewrites departmentCourseType join rows, logs audit entry).
- Single-course fetch for editing palettes and name/color updates.
- Safeguard preventing deletion when a type is in use by curricula.

## 3. Curriculum Lifecycle & Course Attachment
- Curriculum list/create endpoints scoped by faculty department access.
- Creation flow that ingests Excel-uploaded courses, upserts them into the global catalog, then seeds curriculumCourses + constraints + elective rules.
- Curriculum detail fetch (year/version/total credits, aggregated counts, course roster with overrides, prerequisites/corequisites, etc.).
- Add/remove curriculum course endpoint that enforces year/semester/isRequired data plus audit logging.
- Per-course override flags persisted on curriculumCourse (permission/summer/senior-standing/min-credit overrides) for use in audits.

## 4. Elective Rules & Free-Elective Settings
- Curriculum-level elective rule API:
  - List: returns rules, inferred categories from departmentCourseType assignments, and curriculum course list with category, credits, required flag.
  - Create/update/delete a rule (category + requiredCredits + description).
  - Settings endpoint to rename the “Free Electives” rule, set its required credits, and bulk toggle individual course `isRequired` flags.
- Enforcement that each (curriculum, category) pair is unique.

## 5. Concentrations (Course Lists)
- Department-scoped concentration CRUD with duplicate-name checks.
- Ability to upload/parse CSV-derived courses when creating or updating a concentration (auto-creates courses if missing, attaches via concentrationCourse join).
- List endpoint that returns course counts plus full course metadata.
- Child endpoints for listing/adding/removing courses for a given concentration.
- Faculty-wide access control (chairperson can reach all departments in same faculty).

## 6. Blacklists (Course Lists)
- Department-scoped blacklist CRUD mirroring concentration behavior (name/description, duplicate guard, audit logging).
- Attachment of arbitrary existing courses to a blacklist, plus CSV upload to create-and-attach new courses.
- Usage counts (`curriculumBlacklists`) surfaced so UI knows if a blacklist feeds any curricula.
- Child endpoints for listing/updating blacklist courses.

## 7. Curriculum Attachments for Lists (Concentrations & Blacklists)
- Under `/curricula/{id}/concentrations` & `/curricula/{id}/blacklists` (not shown above but present in this codebase) the backend already:
  - Lists which concentrations/blacklists are attached to a curriculum, including required-course counts.
  - Adds/removes attachments and updates required-course quantities.
- These endpoints will be reused/extended when generic course lists become pool sources.

## 8. Supporting Capabilities
- Faculty/department access checks on every endpoint (chairperson role required, faculty-scope access to departments).
- Audit log entries for significant mutations (course catalog, course assignments, elective rules, concentrations, blacklists).
- Utility endpoints such as faculty label (rename “Concentrations” tab) and department/faculty lookups, which the UI already consumes.

## What to Verify on Laravel
When reviewing the migrated backend, ensure equivalents exist for each bullet above. In particular, confirm:
1. **Global course catalog** still supports the same metadata fields and search helpers.
2. **Course-type CRUD and bulk assignment** exist (even if hierarchy work is pending) so we can extend them to multi-level types.
3. **Curriculum course attach/remove + overrides** are intact, since credit pools rely on accurate curriculumCourses data.
4. **Elective rule + free elective settings** endpoints exist so we can migrate their logic into credit pools without regressions.
5. **Concentration/blacklist list + course upload flows** exist, because the new generic course lists/pools will build on them.
6. **Access control & auditing** remain consistent, preventing privilege regressions during migration.

Tick each area off on Laravel before wiring the new credit-pool + hierarchy features.
