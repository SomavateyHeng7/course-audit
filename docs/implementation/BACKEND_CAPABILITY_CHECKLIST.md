git # Backend Capability Checklist (Credit Pools & Levels)

Use this to verify the migrated backend has the needed surfaces. Keep names abstract; map to real routes/controllers on that stack.

## Course Types (Hierarchy)
- List hierarchy (tree), single deepest node per course.
- Create/update/delete type with optional parent.
- Assign type to course; fetch course with type.

## Course Lists (Generic)
- CRUD course lists with type flag (CONCENTRATION, BLACKLIST, POOL_LIST).
- Upload/parse CSV/XLSX into a list; add/remove courses.
- Attach/detach list to curriculum with per-curriculum required credits and label override.
- Optional default required-credits stored on list definition (overridable per curriculum).

## Credit Pools
- CRUD pools (name, description, minCredits, maxCredits, sources: courseTypeIds and/or listIds).
- Attach pool to curriculum with per-curriculum requiredCredits/max and ordering.
- Fetch pools for a curriculum (resolved sources, order, caps).
- Enforce single-consumption of a course across pools; overflow beyond max routes to Free Elective.

## Curriculum Courses / Must-Takes
- CRUD curriculum courses; flag must-take/required; set year/semester.
- Optional course-level overrides (permission, summer-only, senior-standing/credit threshold).

## Pool Computation / Audit
- Compute credits per type (roll-up hierarchy) and per pool with deterministic ordering; enforce must-takes first; overflow to Free Elective.
- Return breakdown for UI: per pool required/min/max, applied courses and their assigned pool, remaining, overflow, Free Elective status (and optional cap if present).

## Student Intake
- Upload transcript/courses; match to curriculum; prompt for non-curriculum courses → Free Elective; store choice.
- Recompute readiness using pool-aware rules.

## Search/Lookup
- Course search (code/title) for chairperson UI and list uploads.
- Course search for student upload flow.

## Legacy (Transition)
- Read-only legacy elective rules/categories for comparison.
- Flag/toggle to hide legacy once migrated.

## Auth/Role
- Chairperson-only for config, pools, lists; student access for upload/audit endpoints.
