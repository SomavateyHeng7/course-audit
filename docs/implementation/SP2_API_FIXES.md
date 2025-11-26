# SP2 Schema Fixes – API Adjustments

Tracking the API endpoints that have been updated while rolling in the SP2 schema changes.

| Endpoint | Method | Update | Notes |
| --- | --- | --- | --- |
| `/api/available-courses` | GET | Returns department-course type metadata per curriculum, enabling scoped category assignments. | Aligns course picker with curriculum-specific overrides. |
| `/api/course-types` | GET | Auto-seeds missing course types for the requested department, cloning any definitions that already exist in the faculty (fallback to defaults). | Ensures new departments inherit the full type catalog on first access. |
| `/api/course-types` | POST | Allows optional department selection and propagates newly created types across all departments in the same faculty. | Keeps course categories aligned across sibling departments. |
| `/api/course-types/[id]` | PUT/DELETE | Hardened updates and deletions with faculty/department access checks. | Prevents cross-department edits and orphan cleanup issues. |
| `/api/course-types/assign` | POST | Validates faculty access, clears previous scoped assignments, and writes new `DepartmentCourseType` rows per curriculum. | Guarantees curriculum-scoped category maps stay consistent. |
| `/api/curricula/[id]` | GET | Enriches curriculum payload with override metadata (prereq/coreq, course flags, department types). | Powers the chairperson editor with accurate curriculum-specific data. |
| `/api/curricula/[id]/elective-rules` | GET/POST | Normalizes elective rule reads and writes, returning cohesive rule sets with curriculum linkage. | Keeps elective configuration synchronized during edits. |
| `/api/curricula` | POST | Accepts `totalCreditsRequired`, persists it on the curriculum, and validates department via faculty scope. | Prevents hard-coded credit requirements after migration. |
| `/api/curriculum` | POST | Persists `totalCreditsRequired`, defaulting to the sum of supplied course credits when omitted. | Legacy chairperson flow now populates the new column. |
| `/api/public-curricula` | GET | Added `totalCreditsRequired` to the public curriculum payload. | Keeps student/guest views in sync with the new schema field. |
| `/api/public-curricula/[id]` | GET | Added `totalCreditsRequired` to the detailed curriculum response. | Downstream consumers no longer rely on the legacy total. |
| `/api/curricula/[id]/courses/[curriculumCourseId]/constraints` | GET/PUT | Surfaces base vs curriculum override flags and accepts partial override updates with audit logging. | Enables chairpersons to scope permission/senior-standing rules per curriculum course. |
| `/api/curricula/[id]/courses/[curriculumCourseId]/prerequisites` | GET/POST | Returns curriculum-only prerequisite relations and guards creation against duplicates/self references. | Lets editors curate prerequisites without touching global course relations. |
| `/api/curricula/[id]/courses/[curriculumCourseId]/prerequisites/[relationId]` | DELETE | Removes curriculum-level prerequisite links with faculty-scoped access checks. | Keeps override prerequisites clean when requirements change. |
| `/api/curricula/[id]/courses/[curriculumCourseId]/corequisites` | GET/POST | Mirrors prerequisite handling for co-requisite overrides within a curriculum. | Supports synchronized lecture/lab pairings per curriculum. |
| `/api/curricula/[id]/courses/[curriculumCourseId]/corequisites/[relationId]` | DELETE | Deletes curriculum-only co-requisite relations while recording audit entries. | Prevents stale override co-requisites after course realignments. |

_Last updated: 2025-11-25_
