# Chairperson Feature Porting Checklist

Detailed inventory of the legacy chairperson experience. Use it to verify the Laravel port preserves every dependency needed before layering credit pools and multi-level course types.

## 1. Authentication & Access Control
- Login flow mirrors legacy (NextAuth) behaviour: session cookie, refresh, logout, and role metadata (`CHAIRPERSON`) available to the client.
- Route guards redirect to `/auth` when unauthenticated and to `/dashboard` when the user lacks the chairperson role.
- User context exposes faculty + department relationships so downstream API calls can scope access automatically (faculty-wide department lists, department IDs, faculty labels).
- Middleware (e.g., `src/middleware.ts`) continues to protect `/chairperson/**` routes and server components with server-side auth checks.

## 2. Dashboard & Navigation Shell
- Persistent layout with sidebar/topbar providing entry points to:
  - Curriculum list + creation wizard.
  - Chairperson config (course types, concentrations, blacklists, pools module).
  - Student checklist / audit view.
  - Tentative schedule tooling (if not deprecated).
- Global UI state services (toast helper, modals) still accessible via hooks (`useToastHelpers`) and ported to Laravel stack.
- Loading/skeleton states for each page section, including route-level suspense fallbacks.

## 3. Curriculum Creation & Editing Suite
- **Creation Flow**
  - Accepts Excel/CSV upload with course rows; performs deduplication and course upserts.
  - Captures metadata (name, year, version, start/end ID, total credits, dept/faculty) and seeds elective rules + constraints.
- **Courses Tab**
  - Table with search, pagination, selection, per-row actions (edit/delete, description modal).
  - Course modal supports editing credits, credit hours, description, overrides (permission, summer, senior-standing, min credits).
  - Bulk assign dialog allowing multi-select of curriculum courses and mapping to a course type (currently flat, soon hierarchical).
  - Manual add modal combining course search + new-course creation, capturing year/semester/required flags.
- **Constraints Tab**: CRUD for GPA/min credit/custom constraints with JSON config blocks.
- **Elective Rules Tab**: category credit requirements, free-elective renaming, `isRequired` toggles per course, inline search/filter, backend sync to `/elective-rules` + `/settings` endpoints.
- **Concentrations Tab**: list of attached concentrations, ability to set required course counts, view concentration contents, detach with confirmation.
- **Blacklist Tab**: assign blacklists to curricula, inspect courses, keep read-only warning if list shared elsewhere.
- **Audit Logging**: every mutation (course add, rule change, assignment) triggers backend audit log entries for traceability.

## 4. Chairperson Info Config Page
- **Course Types**: CRUD with color picker, default seeding when empty, usage badges, delete guard if type used; tie into department/faculty scoping.
- **Concentrations**: list with course counts, modal to edit descriptions, CSV/XLSX upload (parsing with chunked progress), manual course add/remove, duplicate checks.
- **Blacklists**: identical toolkit as concentrations plus usage counts (# curricula referencing), inline preview of courses.
- **Faculty Label Customization**: API call to rename “Concentrations” tab, persisted per faculty.
- **Pools & Lists Placeholder**: need UI scaffolding ready for upcoming credit pools (sections/accordions, add button, empty state messaging) even before backend ready.
- **Course Search Integration**: same global search component reused for manual additions; handles debounce, spinner, no-result state.

## 5. Global Course Catalog & Search Tools
- `/courses` page/API accessible from config + curriculum modals.
- Server endpoints support: list with filters, detail fetch, create, update, soft delete, prerequisites/corequisites editing.
- Frontend components for search dropdowns (typeahead with highlight, keyboard navigation) and course detail popovers reused across config and curriculum pages.

## 6. File Upload & Utility Infrastructure
- CSV/XLSX parsing helpers (client-side + API fallbacks) for courses, concentrations, blacklists, and future pool lists.
- Dropzone UI with drag-over highlight, file validation (extension + size), error toasts, success confirmation.
- Export/download flows (if legacy allowed exporting curriculum lists or concentration contents) either preserved or clearly deprecated.
- Global modal + confirmation dialog patterns for destructive actions with double-confirm for shared entities.

## 7. Student-Facing Dependencies
- APIs powering student course-audit flows still ingest chairperson-curated data:
  - Curriculum course roster (isRequired flags, overrides).
  - Elective rule configuration (category credits, free-elective naming/credits, per-course required toggles).
  - Concentration and blacklist attachments determine what students see in their dashboards/checklists.
- Student upload flow relies on free-elective prompt logic triggered when a course isn’t in the curriculum but free-elective credits remain.
- Ensure any rewrite keeps these response shapes stable until the pool-aware student audit lands.

## 8. Feature Flags & Legacy Coexistence
- Ability to keep the legacy elective rule UI (and data) visible while new pool UI rolls out.
- Read-only states for deprecated sections once data migrates (e.g., banner explaining that legacy rules are reference-only).
- Configurable feature flag (env/DB) to toggle new Pools & Lists section per department/faculty.

## 9. Validation Steps on Laravel Port
- For each section above, confirm equivalent API endpoints, UI flows, and guardrails exist on the migrated stack.
- Record any gaps (missing upload handler, no audit logging, etc.) before scheduling pool/hierarchy implementation.
- Document intentional scope cuts (e.g., Tentative Schedule) so downstream teams know they are unsupported.
