# Credit Pools, Course Type Levels, and Config Modularity — Planning Draft

## Context
- Backend recently migrated; keep integration details abstract (no framework-specific endpoints assumed).
- Current UI (chairperson) supports flat course types, concentrations, blacklists, elective rules with fixed categories.
- Goal: support credit pools (flexible credit minimums across oversupplied course sets), course type levels (parent/child like GE → HUMAN/LANGUAGE), and modular config sections (add/remove list-based sections akin to concentrations/blacklists).

## Proposed Model (API-agnostic)
- **Course Type Hierarchy**: allow parent → child nesting (e.g., GE → HUMAN). Courses link to a single deepest node; ancestors derive totals by roll-up.
- **Credit Pools**: named pools with required/min/max credits. Pools reference one or more course type nodes and/or explicit course lists. Pools have priority/order to resolve overlaps; overflow beyond max credits is routed to Free Elective.
- **Course Lists (Generic)**: unified list construct for concentrations, blacklists, and pool lists; each list can carry a suggested required-credit value when attached to a curriculum.
- **Curriculum Attachments**: curricula attach pools and lists with per-curriculum overrides (required credits, labels, order). Legacy elective rules can map to default pools (e.g., “Major Elective” pool bound to course type Major Elective).
- **Computation**: roll credits bottom-up by course type hierarchy; pools consume credits from their sources in priority order to avoid double counting; a course contributes to at most one pool. Overflow beyond a pool’s max moves to Free Elective.
- **Student Flow**: when a student uploads courses not in curriculum, allow assigning to an eligible pool (e.g., Free Elective) if pool rules permit out-of-curriculum contributions.

## UI/UX Plan (high level)
- **Config Page**: add "Pools & Lists" section to create/edit pools, pick sources (type nodes or uploaded list), set required credits, order, optional caps; manage generic lists (concentration/blacklist/pool list) with CSV/XLSX upload.
- **Curriculum Edit**: replace/augment Elective Rules tab with a Pool tab showing pool name, required credits, current credits from matched curriculum courses, source(s), and drag order (deterministic evaluation). Respect course-level “must-take” flags before pool allocation. Keep legacy view read-only until migration finishes.
- **Courses Tab**: course assignment chooses one deepest type; show breadcrumb (e.g., GE › HUMAN). Filtering by pool/type.
- **Student Side**: prompt to place unmatched courses into permitted pools (e.g., Free Elective) per rules.

## Decisions/Constraints Locked In
1) **Course typing cardinality**: single deepest node per course in the hierarchy (no multi-tagging). Ancestors roll up automatically.
2) **Pool overlap usage**: a course should be consumed by only one pool; pools may overlap in eligible sets, so we need a deterministic resolution (priority still TBD).
3) **Type depth**: allow deeper trees (no 2-level cap), but UI should stay usable (may need guardrails later).
4) **Pool sources**: support both type-based and explicit course lists. Out-of-curriculum courses can only go to Free Elective.
7) **Caps vs floors**: support minCredits and maxCredits. Overflow flows into Free Elective by rule.
9) **Free-elective UX**: always prompt the student when uploading a non-curriculum course (existing flow), then place into Free Elective if confirmed.

## Updated Decisions
- **Legacy coexistence**: keep legacy elective rules visible/read-only during transition; surface both legacy and pools in UI until data migrated, then hide legacy via a flag.
- **List semantics / required credits**: required credits per pool are set on the curriculum attachment (per-curriculum). Lists (e.g., concentrations, pool lists) can store an optional default suggested required-credits, but the binding to a curriculum sets the actual number. Curriculum creation flow already captures required credits at the curriculum level; pools’ required credits are determined in the curriculum editor.
- **Audit ordering / priority**: no explicit numeric priority. Instead: (a) “must-take” courses are enforced first (course-level required flag), (b) pools evaluate in deterministic order derived from UI ordering (drag order) when overlaps exist, (c) overflow beyond max goes to Free Elective. If no order is set, fall back to name sort.
- **Data migration path**: automated mapping recommended: map legacy elective categories → default pools; convert concentrations/blacklists into generic lists with type tags; keep legacy view read-only for verification until sign-off.

## Phased Approach (suggested)
1) Introduce course type hierarchy (data + UI picker); keep flat types working as-is.
2) Add generic course lists; migrate concentrations/blacklists into this construct.
3) Add credit pool entities and curriculum attachments; expose pool-aware audit service; keep legacy rules as derived pools.
4) Update chairperson UI: Pools & Lists in config, Pool tab in curriculum edit; keep legacy toggle during transition.
5) Update student graduation check to use pool computation; add tests for hierarchy, overlap, overflow, and out-of-curriculum handling.

## Risks / Watchouts
- Double counting if overlap resolution is unclear.
- UX complexity if multi-tagging or deep hierarchies are allowed without guardrails.
- Migration consistency: legacy data may lack parent/child typing; need defaults.
- Performance for roll-up if not cached; may need precomputed aggregates per curriculum.

## Next Steps (blocking on decisions)
- Agree on items in Open Decisions, especially 1–4 and 7–9.
- Once agreed, draft an ADR and lightweight schema sketch (abstract, backend-agnostic) plus UI wireframes for Pools & Lists and the Pool tab.
