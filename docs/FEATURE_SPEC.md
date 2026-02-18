# FEATURE SPEC (MVP-Optimized)

---

# 1. Product Goal

Product:
Lightweight team PM board tool (project + sprint style).

Target User:
Small teams managing issues with minimal workflow overhead.

Product Priority:
1. UI-first product quality.
2. Minimal but stable API/DB connection.
3. Architecture clarity over feature breadth.

---

# 2. MVP Scope (Phase 1)

## Included Screens

- `/issues` (Board)
- `/projects` (Project Management)
- `/workspaces` (Workspace Management)

## Explicitly Included

- Workspace CRUD
- Project CRUD
- Issue CRUD (within selected project)
- Sub-issue CRUD
- Search (title only)
- Status filter
- Drag reorder (same-parent rule)
- Hierarchy (parent-child)
- Template auto-apply by project type (mock allowed)
- Comments (mocked identity)

## Explicitly Excluded (MVP)

- Authentication / Authorization
- RBAC / Permissions
- Real user identity system
- Real-time updates
- Optimistic concurrency control
- Analytics / Reporting
- Full audit log backend

---

# 3. Context Model

## Active Context

- One active workspace at a time.
- One active project at a time.
- Project must belong to active workspace.

Context is:
- Stored in URL query params
  `?workspace=<id>&project=<id>`
- Persisted in localStorage.

Context change must:
- Immediately refresh issue list.
- Not require full page reload.

---

# 4. Core User Flow

1. User lands on `/issues`.
2. Workspace and Project are selected via header.
3. User manages issues in table + detail modal.
4. User can navigate to `/projects` or `/workspaces` for management.
5. Returning to `/issues` restores last active context.

---

# 5. Functional Requirements (MVP)

## Workspace

Fields:
- id
- name
- slug
- plan
- memberCount
- projectCount
- createdAt

Rules:
- Cannot delete workspace if projects exist.
- Slug uniqueness not enforced in MVP.

---

## Project

Fields:
- id
- workspaceId
- name
- type
- keyPrefix
- updatedAt

Rules:
- Must belong to one workspace.
- Cannot exist without workspace.
- Template issues auto-generated on create (mock allowed).

---

## Issue

Fields:
- id
- projectId
- title (required)
- description
- status
- priority
- assigneeId (nullable)
- order
- parentIssueId (nullable)
- createdAt
- updatedAt

Status Enum:
- Todo
- InProgress
- Done
- Cancel

Priority Enum:
- Low
- Medium
- High

Rules:
- Title required.
- order defines default sort.
- parentIssueId cannot reference self.
- parentIssueId cannot create cyclic hierarchy.
- Unlimited depth allowed.
- Drag reorder allowed only within same parent level.
- Drag reorder disabled when search/filter active.

---

## Sub-Issue

- Uses same Issue model.
- Identified by parentIssueId.
- CRUD allowed inside detail modal.

---

## Comments (MVP)

- No authentication.
- Comments are authored by the current mock user (default: first assignee in local mock data).
- No permission model.
- Stored in client state during Phase 1.
- API persistence is a Phase 2 target.
- Chronological display.

---

# 6. Hierarchy Rules (Server-Authoritative)

Backend must enforce:
- No self-parent.
- No circular references.
- Same-parent-only reorder validation.
- Parent must belong to same project.

Frontend:
- Collapse/expand per parent row.
- Indentation by depth level.

---

# 7. Drag Reorder Rules

Default order:
- Server-provided numeric `order`.

Reorder:
- Client updates local state immediately.
- Persist via:
  `PUT /issues/reorder`

Constraints:
- Only same-parent level reorder allowed.
- Disabled if search or status filter active.

MVP Persistence:
- Must persist to backend in Phase 2.
- Phase 1 may simulate persistence.

---

# 8. Search & Filtering

Search:
- Case-insensitive title contains.
- Client-side only (MVP).

Status Filter:
- All / Todo / InProgress / Done / Cancel.

Completed Toggle:
- Show/Hide Done issues.

Filter persistence:
- localStorage key:
  `board.filters.<workspaceId>.<projectId>`

Stored:
- search
- statusFilter
- showCompleted

Reset when workspace or project changes.

---

# 9. Template Behavior (MVP)

When creating project:
- Predefined base issues created automatically.
- Logic may be mock/static.
- Template type determines issue seed set.
- No dynamic template editing in MVP.

---

# 10. API Contract (Phase 2 Target)

Minimal endpoints:

- `POST /issues`
- `GET /issues?projectId=...`
- `PATCH /issues/{id}`
- `PUT /issues/reorder`

Error format:
- ASP.NET Core `ProblemDetails`.

No envelope wrapper required.

---

# 11. System States

Must support:

- Loading (skeleton UI)
- Empty (CTA)
- Error (banner + toast + retry)

These states apply to:
- Issues board
- Projects page
- Workspaces page

---

# 12. Execution Model

Frontend:
- `apps/web`
- `npm run dev`

Backend + DB:
- `infra/docker/docker-compose.yml`
- `docker compose up --build`

scripts/dev.ps1 is authoritative for validation.

---

# 13. Freeze Policy

Freeze Date: 2026-02-14

Frozen:
- Screen routes
- Issue fields
- Status enum
- Priority enum
- Hierarchy rules
- Drag reorder constraints
- Filter persistence format
- Detail modal interaction model

Changes after freeze require explicit spec update.

---

# 14. Phase Definition

Phase 1:
- UI-first
- Mock-friendly
- No auth
- Client-side search/filter
- Drag reorder persisted (mock allowed)

Phase 2:
- Real DB persistence
- API integration
- Server hierarchy validation
- Real comments storage

Phase 3 (Future):
- Authentication
- Permissions
- Activity feed
- Real-time collaboration
