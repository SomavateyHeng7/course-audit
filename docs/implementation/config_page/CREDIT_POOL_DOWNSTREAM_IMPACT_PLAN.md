# Credit Pool / Category Rollout: Downstream Impact Plan

## Goal
Document every Chairperson-facing surface that has to respect the new Credit Pool + Category system, identify the gaps in the current UI, and outline the order of operations for the incremental rollout after the `info_config` revamp.

## Feature Flag & Data Dependencies
- Keep the existing `configPoolsEnabled` flag (from `/config/feature-flags`) as the master switch; reuse it instead of creating per-page flags.
- Each impacted page must tolerate the absence of pool/category metadata. When the flag is **off** load existing endpoints and hide pool UI; when **on**
  - Fetch course-type hierarchy via `/course-types?departmentId=...` (already used in `info_config`).
  - Respect future `/credit-pools` read/write endpoints (schema still pending from backend team).

## Impact Overview
| Surface | Current Behavior | Required Change |
| --- | --- | --- |
| Curriculum Info Edit tabs | Tabs hard-coded to `Courses`, `Constraints`, `Elective Rules`, dynamic `Concentrations`, `Blacklist`. No notion of pools. | Add a "Pools & Lists" tab (mirrors config page tree) that controls curriculum-level overrides + pool-specific requirements. Update keyboard navigation and routing guards accordingly. |
| `ElectiveRulesTab` | Manages required vs elective toggles and free-elective credit buckets based only on curriculum courses. | Split responsibilities: (a) rename to "Legacy Electives" and hide when pools enabled, or (b) migrate functionality into the pool tab so that credit minimums live next to pool definitions. |
| Student Checklist | Displays program progress using raw totals from `/students/:id/progress`; no breakdown by pool/category. | Extend progress cards and planned course list to show pool/category completion and highlight shortages per pool. Requires new backend deltas per student. |
| Reporting / exports (CSV, PDF) | Not pool-aware. | Follow after UI once data model stabilizes; out of scope for this sprint but tracked here for visibility. |

## Detailed Notes
### 1. Curriculum Info Edit (`src/app/chairperson/info_edit/[id]/page.tsx`)
- Tabs defined in-line (`tabs = [...]`) without dynamic inserts ([lines 18-41](../../../../src/app/chairperson/info_edit/%5Bid%5D/page.tsx#L18-L41)). Adding another tab requires updating keyboard navigation helpers (`goToNextTab`, etc.) and existing `activeTab` checks.
- Course data already hydrates `courseTypes` via `/course-types?departmentId=...` ([lines 110-154](../../../../src/app/chairperson/info_edit/%5Bid%5D/page.tsx#L110-L154)), so the page has the metadata we need to render pools once the API supplies hierarchy details.
- Proposal:
  1. Introduce a `Pools & Lists` tab component that consumes the same course-type tree renderers created for `info_config`. Share UI primitives for the collapsible cards and actions.
  2. When the tab is active, show per-pool credit requirements + connections to curriculum courses (e.g., drag/drop, multi-select into pools).
  3. Persist changes via the forthcoming `/credit-pools` endpoints; fall back to no-op if the flag is off.

### 2. Elective Rules Tab (`src/components/features/curriculum/ElectiveRulesTab.tsx`)
- Currently fetches `electiveRulesApi.getElectiveRules` and stores "Major Elective" + "Free Elective" buckets ([lines 23-86](../../../../src/components/features/curriculum/ElectiveRulesTab.tsx#L23-L86)).
- UI allows toggling individual curriculum courses between required/elective and managing free-elective credit totals ([lines 120-260](../../../../src/components/features/curriculum/ElectiveRulesTab.tsx#L120-L260)).
- Credit pool rollout impact:
  - **Short term:** When flag is on, hide the category breakdown & inputs and replace with an alert pointing users to the new pool tab so we avoid conflicting data sources.
  - **Mid term:** Move reusable pieces (course search/filter, per-course requirement toggles) into shared hooks so the pool tab can reuse them when a pool references curriculum courses.
  - **Long term:** Deprecate this tab entirely once every department migrates.

### 3. Student Checklist (`src/app/chairperson/StudentCheckList/page.tsx`)
- Displays aggregate GPA, total credits vs requirement, and planned courses ([lines 201-395](../../../../src/app/chairperson/StudentCheckList/page.tsx#L201-L395)).
- No awareness of course categories or pools; progress bars aggregate across the entire curriculum.
- Required enhancements when pools are active:
  1. Add a pool summary card group that mirrors the `info_config` credit breakdown (e.g., Completed vs Required per pool/category) to help advisors quickly see shortages.
  2. Extend `/students/:id/progress` to return per-pool credit totals and whether each list (e.g., "Pick any 2") is satisfied.
  3. Update planned-course chips to display the pool they satisfy so advisors can identify redundant picks.

### 4. Additional Surfaces To Audit
- **CoursesTab / ConstraintsTab:** confirm if total credit displays or validation logic rely on fixed elective buckets.
- **Exports / PDF reports:** maintain parity once UI exposes pools; likely needs backend batch jobs.
- **Faculty Labels API:** ensure concentration terminology propagates into the new tab copy.

## Open Questions
1. Does every pool enforce a strict credit total, or do some pools describe course-count requirements ("take any 2")? UI wiring differs.
2. Should free electives remain separate from pools, or do they become a special pool with `source = external`?
3. How are student-progress deltas computed for archived curricula vs the edited one?

## Recommended Next Steps
1. Add `PoolsListsTab.tsx` component scaffold behind the existing `configPoolsEnabled` flag and wire it into the `info_edit` tab array.
2. Add flag-aware guard rails to `ElectiveRulesTab` (hide interactive controls, display migration notice).
3. Draft backend contract for student progress per pool so `StudentCheckList` can render meaningful status cards.
4. Create QA checklist covering tab switching, keyboard navigation, and regression of existing elective-rule flows (flag off scenario).
