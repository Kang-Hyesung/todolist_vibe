# CURRENT VALIDATION BASELINE (Active)

This section defines the minimum required checks for any new ticket.

## Web Changes
- `.\scripts\dev.ps1 web-lint`
- `.\scripts\dev.ps1 web-build`

## API / Infra Changes
- `.\scripts\dev.ps1 docker-up`
- `.\scripts\dev.ps1 api-health`
- `.\scripts\dev.ps1 smoke`

## Cross-Layer Changes
- Run both web and API validation sets, then run `.\scripts\dev.ps1 smoke`.

## Spec Alignment
- Must comply with:
  - docs/FEATURE_SPEC.md
  - docs/UI_SPEC.md

## Hierarchy Rules
- No cyclic parent assignment.
- Same-parent-only reorder enforcement.

## Filter Persistence
- Must use key:
  `board.filters.<workspaceId>.<projectId>`

## Testing Baseline (Current)
- Automated test framework is not configured yet (no unit/integration/E2E runner in repo).
- Minimum PR validation:
  - Frontend-only: `.\scripts\dev.ps1 web-lint` and `.\scripts\dev.ps1 web-build`
  - API/Infra change: `.\scripts\dev.ps1 docker-up`, `.\scripts\dev.ps1 api-health`, `.\scripts\dev.ps1 smoke`
  - Cross-layer change: run both sets and `.\scripts\dev.ps1 smoke`
- Manual smoke checklist (required until automated tests are added):
  - `/issues`: create/edit/delete issue, hierarchy parent change, same-parent reorder, filter persistence
  - `/projects`: create/edit/delete project, workspace filtering, context switch to issues
  - `/workspaces`: create/edit/delete workspace (including delete guard when projects exist)


# CHECKLIST

## Phase 0 - UI First
- [x] Scan `design/stitch/**` assets and auto-select references.
  - Verification: confirm selected paths are recorded in `docs/UI_SPEC.md`.
- [x] Create baseline documents (`FEATURE_SPEC`, `UI_SPEC`, `CHECKLIST`).
  - Verification: all three files exist under `docs/` and include required sections.
- [x] Scaffold web app at `apps/web` (React + Vite + TypeScript + Tailwind base).
  - Verification: `cd apps/web && npm install && npm run dev` starts without build errors.
- [x] Build board page shell with left/center/right regions.
  - Verification: one screen shows sidebar, issue table area, and right slide-over panel.
- [x] Implement mock domain model and data store (projects, issues, assignees, templates).
  - Verification: project switch updates issue list and type-based template issues appear.
- [x] Implement issue table features (search, status filter, default created order).
  - Verification: typing search and selecting status filter updates visible rows correctly.
- [x] Implement create/edit in right panel.
  - Verification: create/update reflects immediately in table and panel fields sync.
- [x] Implement drag-and-drop reorder.
  - Verification: row order changes by drag and remains stable after UI rerender.
- [x] Implement product states (loading, empty, error + retry/toast).
  - Verification: dev toggles can force each state and visuals are complete.
- [x] Polish UI consistency to stitch references (spacing, typography, tone, states).
  - Verification: side-by-side visual check against selected reference PNGs.

## Phase 1 - SPEC Freeze
- [x] Add freeze sections to `docs/FEATURE_SPEC.md` and `docs/UI_SPEC.md`.
  - Verification: both documents include explicit freeze date and locked decisions.

## Phase 2 - API + DB Minimal
- [x] Scaffold `apps/api` (.NET 8 Web API) with basic project structure.
  - Verification: API container image builds successfully via `docker compose ... up --build`.
- [x] Add PostgreSQL + API compose in `infra/docker`.
  - Verification: `docker compose -f infra/docker/docker-compose.yml up --build -d` starts both services and `docker compose ... ps` shows healthy/running.
- [x] Add EF Core + Npgsql and minimal schema for `Issue` and `Project`.
  - Verification: API startup `EnsureCreated()` creates tables and persisted issue data is retrievable after create/list calls.
- [x] Implement `POST /issues` and `GET /issues?projectId=...`.
  - Verification: host requests to `POST /issues`, `GET /issues` succeed and validation/not-found errors return `ProblemDetails`.
- [x] Connect web app API base URL via `VITE_API_BASE_URL` while preserving mock fallback.
  - Verification: `apps/web/src/lib/api.ts` + `.env.example` + optional API mode in board page are implemented.

## Phase 3 - Hierarchy (UI-first)
- [x] Extend issue domain with parent field (`parentIssueId`) and seed hierarchical mock data.
  - Verification: `apps/web/src/types/domain.ts` and `apps/web/src/data/mock.ts` include parent relationship values.
- [x] Render hierarchy in table with indentation and expand/collapse controls.
  - Verification: parent rows show chevron, child rows are indented, and collapse/expand updates visible rows.
- [x] Add parent selection to right detail panel for create/edit.
  - Verification: panel includes parent issue select with "root issue" option and applied value updates table structure.
- [x] Add cycle guards for invalid parent assignment.
  - Verification: self-parent and descendant-parent selections are blocked with error toast.
- [x] Restrict drag reorder to same parent level in hierarchy mode.
  - Verification: drag between different parent levels is rejected and sibling reorder still works.
- [x] Run quality checks for hierarchy patch.
  - Verification: `cd apps/web && npm run lint && npm run build` pass.
- [x] Persist hierarchy to API/DB (`parentIssueId`) in Phase 3 backend follow-up.
  - Verification: API create/list round-trip includes `parentIssueId`, cycle update returns 400, and cross-level reorder rejection returns 400.

## Phase 4 - Issue Detail Expansion
- [x] Add sub-issue CRUD in the issue detail panel.
  - Verification: panel can create/read/update/delete sub-issues and table hierarchy updates immediately.
- [x] Add comments in the issue detail panel.
  - Verification: comments can be posted with author selection and rendered in chronological order.
- [x] Display issue timestamps in the detail panel.
  - Verification: selected issue shows created and updated datetime in metadata section.
- [x] Add API support for issue delete (`DELETE /issues/{id}`) for sub-issue delete flow.
  - Verification: API image rebuild succeeds and UI delete works in API mode without local-only fallback.
- [x] Refactor center detail modal to a two-column information architecture.
  - Verification: left column handles issue editing/sub-issues, right column handles metadata/comments, and `npm run build` passes.
- [x] Refine workflow controls in issue detail to attribute-specific UI patterns.
  - Verification: status uses icon option buttons, priority uses severity cards, assignee uses avatar chips, and `npm run build` passes.
- [x] Improve Issue Info and Activity presentation in detail modal.
  - Verification: metadata card includes status/assignee/parent/project/timestamps, activity uses timeline-style comment list, and `npm run build` passes.
- [x] Improve workflow status control and comment composer usability.
  - Verification: status segmented control supports arrow/Home/End keyboard navigation, comments support Enter-to-post and Shift+Enter newline, and `npm run build` passes.
- [x] Add visibility toggle to hide completed issues in board list.
  - Verification: toolbar toggle hides `Done` issues consistently in default/filter/search views, and `npm run build` passes.
- [x] Widen activity pane and add markdown editor for description.
  - Verification: detail modal right pane width increases, description supports write/preview markdown workflow, and `npm run build` passes.
- [x] Start splitting board UI into focused components.
  - Verification: toolbar/inspector/detail panels moved to dedicated files (`issue-toolbar.tsx`, `issue-inspector-panel.tsx`, `issue-detail-left-panel.tsx`, `issue-detail-right-panel.tsx`) and board page build passes.
- [x] Unify board filters and expose active filter chips.
  - Verification: search/status/completed visibility operate from unified filter state and active chips can clear each filter.
- [x] Add row-level quick actions in issue list.
  - Verification: each row has `...` menu on the right with quick edit/delete actions and build passes.
- [x] Persist board filters between reloads.
  - Verification: search/status/completed filters restore from `localStorage` after refresh and build passes.
- [x] Reduce fragile global dark-mode overrides.
  - Verification: broad `.dark .text-slate-*` and `.dark .bg-*` overrides removed from `apps/web/src/index.css`, and build passes.
- [x] Apply board-wide visual polish pass for improved product feel.
  - Verification: refined shell/components (`Button`, `Input`, `Select`, `Table`, toolbar, inspector, detail panels) are reflected in UI and `npm run build` passes.

## Phase 5 - Workspace/Project Management Pages
- [x] Add route shell for `/issues`, `/projects`, `/workspaces`.
  - Verification: top navigation switches routes and direct URL access renders each page.
- [x] Add workspace management page with CRUD UI.
  - Verification: workspace list shows plan/member/project count and create/edit sheet works.
- [x] Add project management page with CRUD UI.
  - Verification: project list filters by workspace/search and create/edit sheet works.
- [x] Connect board page to dynamic project list.
  - Verification: board sidebar project list uses app state projects and newly created project appears with seeded template issues.
- [x] Add global workspace/project context switch UI.
  - Verification: changing workspace updates project options and board immediately reflects selected workspace/project context.
- [x] Persist and share active context via URL/local storage.
  - Verification: refreshing page restores active workspace/project; URL contains `workspace`/`project` query keys and direct open keeps same context.
- [x] Highlight active workspace/project in management tables.
  - Verification: selected rows are visibly highlighted and `Set/Current` actions switch context.
