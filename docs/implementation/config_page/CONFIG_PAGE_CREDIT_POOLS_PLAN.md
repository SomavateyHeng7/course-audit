# Chairperson Config Page: Credit Pools & Multi-Level Types Plan

Reference: see the overarching strategy in [docs/implementation/Creditpool_Category_lvl/CREDIT_POOLS_AND_LEVELS_PLAN (1).md](../Creditpool_Category_lvl/CREDIT_POOLS_AND_LEVELS_PLAN%20(1).md).

## 1. Goals
- Extend the existing chairperson config page to manage course-type hierarchies and credit pools while keeping legacy course types/concentrations/blacklists usable during transition.
- Provide UX scaffolding for upcoming backend APIs (hierarchical types, pools, generic lists) without breaking current flows.

## 2. Page Structure Updates
1. **Navigation/Sections**
   - Keep current sections (Course Types, Concentrations, Blacklists, Faculty Label) and add a new top-level section: “Pools & Lists”.
   - Each section becomes collapsible cards with summary badges (counts, last updated) for faster scanning.
2. **State Management**
   - Refactor config page state into dedicated hooks (e.g., `useCourseTypes`, `useConcentrations`, `useBlacklists`, `usePools`).
   - Introduce optimistic updates with rollback for list/pool actions.

## 3. Course Type Hierarchy UX
- Convert flat grid into a tree list:
  - Display parent/child indentation with color badges.
  - Add “New Type” modal supporting parent selection and color pickers.
  - Support drag-to-reparent (optional) or explicit parent dropdown per node.
  - Show usage chips (number of curricula/courses using the type) before deletion.
- Bulk assignment dialog updates:
  - Show breadcrumb labels (e.g., `GE › HUMAN`), require selection of deepest node, highlight parent path.
  - Provide search/filter by name/color.
- Upcoming backend requirement: endpoints returning type tree and accepting parentId + ordering.

## 4. Pools & Lists Section
1. **Generic Lists Panel**
   - Reuse concentration/blacklist components but allow list type tags (Concentration / Blacklist / Pool List).
   - CSV/XLSX upload modal that shows parsing summary (added/skipped/errored rows).
   - Inline add/remove courses with global course search.
2. **Credit Pools Builder**
   - Card per pool containing:
     - Name, description, chips for min/max credits.
     - Source list (type nodes + course lists) with badges.
     - Toggle to allow outside-curriculum courses (only Free Elective true initially).
     - Drag handle for pool order (determines evaluation priority).
   - “Add Pool” modal steps: pick name, min/max credits, select source nodes/lists, optional description.
   - Display live credit preview (current curriculum totals) using existing aggregation utilities once backend available.
3. **Legacy/Elective Bridging**
   - Legacy elective rule summary card (read-only) with link to curriculum tab for detailed edits.
   - Banner explaining that pools will replace elective rules; include feature flag to hide until API ready.

## 5. Data Fetch/API Touchpoints
- **Existing**: course types, concentrations, blacklists, faculty label, course search.
- **New** (to validate against backend checklist):
  - `GET/POST/PUT/DELETE /course-type-hierarchy` or reuse `/course-types` with `parentId`.
  - `GET/POST/PUT/DELETE /credit-pools` and `/curricula/{id}/credit-pools` attachments.
  - Generic list endpoints (possibly shared with concentrations/blacklists) to fetch “pool lists”.
- Until backend ready, gate new actions behind feature flags and show placeholders.

## 6. Component/Hook Tasks
- Extract existing modals (course type CRUD, list CSV upload) into reusable components under `src/components/chairperson/config`.
- Add `useConfigFeatureFlags` hook to read server-provided toggles (e.g., `enablePools`, `enableHierarchy`).
- Reuse the new backend capability checklist to ensure required APIs exist before enabling features.

## 7. UX/Interaction Details
- Maintain consistent toast messaging via `useToastHelpers`.
- Provide undo/snackbar for destructive actions (delete pool/list/type) where feasible.
- Ensure accessibility: keyboard navigation for tree nodes, proper aria labels on drag handles, live-region updates for uploads.

## 8. Rollout Plan
1. Ship UI with feature flag disabled; pools section shows “coming soon” placeholder if API unavailable.
2. Once backend endpoints verified, enable hierarchy management first (flat types still supported).
3. Enable pool creation once generic list + pool APIs land; hide legacy elective summary only after data migration sign-off.

## 9. Implementation Snapshot (Dec 2025)
- **Collapsible layout live**: Blacklists, Course Types, Concentrations, and Pools & Lists now render as collapsible cards with summary badges so chairpersons can scan counts without scrolling.
- **Hierarchy tree shipped**: The course-type grid has been replaced with a parent/child tree that supports inline child creation, usage chips, and a parent selector inside the add/edit modals.
- **Feature-flag guardrails**: The new `useConfigFeatureFlags` hook queries `/api/config/feature-flags` (with env fallbacks) for `enableHierarchy`, `enablePools`, `enableGenericLists`, and `showLegacyBridgeBanner`, so unfinished backend work stays behind placeholders.
- **Pools & Lists scaffolding**: A combined section now surfaces the upcoming credit pool builder and generic list summaries, but all destructive actions stay disabled until the backend endpoints land.
