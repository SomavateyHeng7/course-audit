# Backend Handoff: Chairperson Config Page (Credit Pools + Type Hierarchies)

Front-end work is moving ahead per [CONFIG_PAGE_CREDIT_POOLS_PLAN.md](CONFIG_PAGE_CREDIT_POOLS_PLAN.md). This note captures the backend additions required so the new UI can fully function. Please keep column names aligned with the existing naming style in [docs/architecture/Databse_DDL.txt](../../architecture/Databse_DDL.txt) (snake_case, varchar PKs, timestamps, etc.).

> **📋 Coordination Document**: For detailed frontend implementation status, testing checklist, and action items, see [COURSE_TYPE_HIERARCHY_COORDINATION.md](COURSE_TYPE_HIERARCHY_COORDINATION.md).

## 1. Course Type Hierarchy

> **Frontend Status**: ✅ Tree UI, parentId in forms, expand/collapse, add-child button all implemented.  
> **Backend Status**: ⏳ Pending migration and controller updates.

### Schema Changes (table: `course_types`)
- Add nullable `parent_course_type_id varchar(255)` → FK to `course_types(id)` (ON DELETE SET NULL).
- Add `position int4` (default 0) to preserve sibling ordering.

### API Surface
- `GET /api/course-types/tree?department_id=` → returns nested types `{ id, name, color, parent_course_type_id, position, usage_counts }`.
- `POST /api/course-types` → accepts `{ name, color, department_id, parent_course_type_id?, position? }`.
- `PUT /api/course-types/{id}` → allow updates to name/color/parent/position (with cycle detection).
- `POST /api/course-types/reorder` → bulk payload to update sibling order + parent in one go.
- Existing bulk assign endpoint should remain but ensure it returns breadcrumb info (type ancestry) for the UI.

### Notes
- Keep existing unique constraint (`name`, `department_id`) intact.
- When deleting a type, ensure children either cascade to null parents or block deletion if UI requires warning.

## 2. Generic Course Lists (Consolidating Concentrations/Blacklists/Pools)
### Schema Additions
1. **`course_lists`**
   - Columns: `id`, `name`, `description`, `department_id`, `created_by_id`, `list_type` (`CONCENTRATION`, `BLACKLIST`, `POOL_LIST`), `default_required_credits int4`, timestamps.
   - Foreign keys similar to `concentrations` (department, user).
2. **`course_list_courses`**
   - `id`, `course_list_id`, `course_id`, timestamps; unique on (`course_list_id`, `course_id`).
3. **`curriculum_course_lists`** (attachment table)
   - `id`, `curriculum_id`, `course_list_id`, `required_credits int4`, `max_credits int4 NULL`, `order_index int4`, timestamps; unique (`curriculum_id`, `course_list_id`).

> Legacy tables (`concentrations`, `blacklists`, etc.) can remain for backwards compatibility, but exposing a unified list API lets the new UI manage every list from one panel.

### API Surface
- `GET /api/course-lists?list_type=` → pagination + filter by department.
- `POST /api/course-lists` → create list with optional inline courses (from uploaded CSV parse result).
- `PUT /api/course-lists/{id}` / `DELETE ...` for updates/removal.
- `POST /api/course-lists/{id}/courses` & `DELETE ...?course_id=` to manage membership.
- `GET /api/curricula/{id}/course-lists` + `POST/PUT/DELETE` to attach lists with curriculum-specific `required_credits`, `max_credits`, and `order_index`.

## 3. Credit Pools
### Schema Additions
1. **`credit_pools`**
   - Columns: `id`, `name`, `description`, `department_id`, `min_credits int4`, `max_credits int4 NULL`, `allow_non_curriculum bool DEFAULT false`, `created_by_id`, timestamps.
2. **`credit_pool_sources`**
   - `id`, `credit_pool_id`, `source_type` (`COURSE_TYPE`, `COURSE_LIST`), `course_type_id NULL`, `course_list_id NULL`, timestamps; enforce that exactly one of the foreign keys is set.
3. **`curriculum_credit_pools`**
   - `id`, `curriculum_id`, `credit_pool_id`, `required_credits int4`, `max_credits int4 NULL`, `order_index int4`, timestamps; unique (`curriculum_id`, `credit_pool_id`).

### API Surface
- `GET /api/credit-pools?department_id=` → returns pool definitions + sources.
- `POST /api/credit-pools` / `PUT /api/credit-pools/{id}` / `DELETE ...`.
- `GET /api/curricula/{id}/credit-pools` → list attachments, show resolved sources, min/max, order.
- `POST /api/curricula/{id}/credit-pools` → attach pool with curriculum-specific `required_credits`, `max_credits`, `order_index`.
- `PUT /api/curricula/{id}/credit-pools/{attachment_id}` → update order / credit requirements.
- `DELETE /api/curricula/{id}/credit-pools/{attachment_id}`.

### Computation Hook (future-proof)
Provide service method (used by student audit + config preview) that:
- Rolls curriculum credits up the course-type tree (using `course_types.parent_course_type_id`).
- Applies pools in `order_index`, enforcing min/max, single consumption, and overflow to Free Elective.
- Responds with per-pool breakdown: `{ pool_id, required_credits, max_credits, applied_credits, remaining, overflow }`.

## 4. Shared Concerns
- **Access Control**: continue using faculty-based checks (chairperson can manage any department in their faculty).
- **Auditing**: log CREATE/UPDATE/DELETE for course types, lists, pools, attachments (matching `audit_logs` conventions).
- **Validation**:
  - Unique constraints for new tables using existing naming style (`*_unique`).
  - Enforce `required_credits >= 0`, `max_credits IS NULL OR max_credits >= required_credits`.
  - Prevent pool source duplicates.
- **Migrations**: supply Laravel migrations for new tables/columns with indices similar to existing ones (btree on FK columns, order indices).

## 5. Integration Touchpoints
- Update seeding logic to populate default course types for every department (now including root nodes).
- Extend existing `/api/course-types/assign` handler to accept optional `curriculum_id` (already present) and respond with breadcrumb trail for UI.
- Provide feature flag endpoint or config so front-end can hide pools/hierarchy sections until backend ready.

## 6. Feature Flag Endpoint Contract
The front-end now calls `GET /api/config/feature-flags` on load. Please expose the following shape so the `useConfigFeatureFlags` hook can hydrate UI guards without redeploying:

```json
{
   "flags": {
      "enableHierarchy": true,
      "enablePools": false,
      "enableGenericLists": true,
      "showLegacyBridgeBanner": true
   }
}
```

- All values should be booleans; unknown keys are ignored.
- Keep the endpoint auth-protected (same Sanctum session) and cacheable so toggles can be flipped without client redeploys.
- The UI falls back to `NEXT_PUBLIC_ENABLE_CONFIG_*` env vars if the endpoint fails, so returning an error is preferable to partial payloads.

---
Ping the frontend team once the endpoints above are available so we can switch from placeholder data to live calls. Let us know if any schema naming deviates from the DDL so we can align the UI bindings.

## 7. Downstream Surfaces (Curriculum Edit + Student Checklist)

- The new **Pools & Lists** tab inside `chairperson/info_edit/[id]` consumes the same `/api/credit-pools` and `/api/course-lists` payloads defined above, but scoped to a single curriculum. Please expose:
   - `GET /api/curricula/{id}/course-lists` and `GET /api/curricula/{id}/credit-pools` with resolved sources (course types + lists) so the UI can render summaries without extra fan-out.
   - `POST /api/curricula/{id}/course-lists` and `/credit-pools` variants for attach/update/detach, mirroring the request shapes in Sections 2–3 with `order_index`, `required_credits`, and `max_credits` fields.
- **Legacy Elective Rules** becomes read-only whenever `enablePools=true`. The flag must therefore be flipped only after the curriculum-level endpoints above are stable to avoid stranding users.
- The **Student Checklist** screen now expects pool-aware progress data. Extend `GET /students/{id}/progress` (or provide `/students/{id}/progress?withPools=true`) to include:

```json
{
   "studentId": "uuid",
   "totalCredits": 96,
   "totalCreditsRequired": 132,
   "pools": [
      {
         "poolId": "pool-uuid",
         "name": "Core Engineering",
         "requiredCredits": 30,
         "maxCredits": null,
         "appliedCredits": 27,
         "remainingCredits": 3,
         "lists": [
            { "courseListId": "list-uuid", "name": "Robotics", "satisfied": false }
         ]
      }
   ]
}
```

- Each pool entry should already account for curriculum attachments (including list-based pools) so the frontend can display completion chips without recalculating lineage.
- Reuse whatever aggregation logic you implement for the config preview so the per-student breakdown and the Pools tab stay in sync.
