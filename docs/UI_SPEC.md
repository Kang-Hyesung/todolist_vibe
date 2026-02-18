# UI SPEC (MVP, Enterprise-Structured)

---

# 1. Reference Lock (Frozen)

## Reference Sources
Scan:
- `design/stitch/**.png`
- `design/stitch/**.html`

## Locked References
- Main:
  - `design/stitch/cleaned_project_issue_hierarchy/screen.png`
- Sub:
  - `design/stitch/issue_detail_slide-over_panel_1/screen.png`
  - `design/stitch/project_list_view/screen.png`

References define structure and interaction model, not pixel-perfect values.

---

# 2. Global Layout Rules

## Route Shell
Top global navigation + route-based content.

Routes:
- `/issues`
- `/projects`
- `/workspaces`

Header includes:
- Workspace selector
- Project selector
- URL context:
  - `?workspace=<id>&project=<id>`

Theme:
- Light/Dark toggle persisted in localStorage.

---

# 3. Enterprise Page Contract

## Canonical Structure
Management pages use a consistent 3-column contract:

1. `Catalog Pane` (left): searchable/selectable list + compact metrics
2. `Command Center` (center): selected entity context + tabbed content
3. `Operations Controls` (right): quick edit controls + validation state

## Terminology Mapping
- Workspace page: Organization hub semantics
- Project page: Delivery portfolio semantics

## Shared UI Building Blocks
- `ManagementFilterBar`
- `SegmentedTabs`
- `MetricCard`
- `EmptyState`

---

# 4. Issues Page Layout

## Regions
1. Left: project/work-context list behavior inside board shell
2. Center: issue table board + toolbar + scope controls
3. Right slide-over: issue detail sheet (create/edit shared)

## Board Contract
- `BoardPageView` owns shell/header/sheet/toast composition.
- `BoardPageContainer` owns orchestration and event wiring.
- State is modularized via `useBoardFilterState`, `useBoardEditorState`, `useBoardInteractionState`.

## Data Density
Issue table supports density presets:
- `compact`
- `default`
- `comfortable`

Density changes row/header spacing only; data schema and behavior remain unchanged.

---

# 5. Component Structure

## Pages
- `BoardPage`
- `ProjectManagementPage`
- `WorkspaceManagementPage`
- `App`

## Management Shared
- `ManagementFilterBar`
- `management-status-tone` (shared tone mapping)

## Board Shared
- `IssueToolbar`
- `IssueRow`
- `IssueDetailLeftPanel`
- `IssueDetailRightPanel`
- `board-page.types`
- `board-page.constants`
- `board-page.utils`

## UI Primitives
- `SegmentedTabs`
- `MetricCard`
- `EmptyState`
- shadcn/ui primitives (`Button`, `Input`, `Select`, `Sheet`, `Table`, etc.)

---

# 6. Visual Semantics & Token Policy

## Semantic Token Layer (Required)
Use semantic tokens over ad-hoc surface classes:
- `surface.0`, `surface.1`, `surface.2`
- `border.subtle`, `border.strong`
- `ink.muted`, `ink.soft`

## Styling Rules
- Prefer tokenized classes for page shells/panels/cards.
- Avoid new one-off dark background hex values in feature components.
- Reuse shared tone utilities for status badges.

## Contrast and Readability
- Primary content must remain high-contrast in both themes.
- Supporting metadata should use `ink.muted` style consistently.

---

# 7. Data Model (UI Level)

## Issue Table Columns (Locked)
- Key
- Title
- Status
- Priority
- Assignee
- UpdatedAt
- Actions

## Priority Enum (Locked)
- Low
- Medium
- High

## Status Enum (Locked)
- Todo
- InProgress
- Done
- Cancel

---

# 8. Interaction Rules (MVP)

## Sorting
Default:
- Server-provided `order`

User reorder:
- Drag and drop
- Client reorder first
- Persist via API: `PUT /issues/reorder`

Disable reorder when:
- Search active
- Status/scope filter active
- Completion hidden mode active

## Search
- Title-based client filtering (Phase 1)

## Status Filter
Values:
- All
- Todo
- InProgress
- Done
- Cancel

## Completed Visibility
- Show/Hide Done toggle

## Scope Presets
- All
- Active
- Backlog

---

# 9. Hierarchy Rules (MVP)

- `parentIssueId` nullable
- No self-reference
- No circular reference
- Unlimited depth
- Drag reorder only within same parent level
- Parent selector must block descendant selection

---

# 10. Detail Sheet Rules (Create/Edit Shared)

Required:
- Title

Optional:
- Description
- Status
- Priority
- Assignee
- Parent Issue
- Sub-issue list

Save button:
- Disabled if title empty
- Disabled while saving

---

# 11. Management Page Rules

## Project Management
- Left: project catalog + filter/search + compact project metrics
- Center: project command center tabs
  - Overview
  - Activity log
  - Operations docs
- Right: execution controls and quick mutation fields

## Workspace Management
- Left: workspace directory + filter/search + compact org metrics
- Center: workspace control plane tabs
  - Overview
  - Operations log
  - Operations docs
- Right: operations controls and quick mutation fields

CRUD entry remains Sheet-based for both pages.

---

# 12. Comments (MVP Simplified)

- No authentication system
- Current mock user authoring
- Client-state persistence in Phase 1
- No permission model
- Chronological timeline

Future:
- Real identity and server persistence

---

# 13. Filter Persistence (Locked)

LocalStorage key format:
- `board.filters.<workspaceId>.<projectId>`

Stored:
- query
- status filter
- completion visibility

Reset when:
- workspace changes
- project changes

---

# 14. Loading / Empty / Error States

## Loading
- Table skeleton rows
- Contextual loading indicators in board and management center panes

## Empty
- Friendly explanatory message
- Action CTA when applicable

## Error
- Inline banner for critical fetch/action errors
- Toast for mutation failure/success feedback
- Retry affordance where possible

---

# 15. shadcn/ui Policy

Allowed primitives:
- Button
- Input
- Badge
- Select
- Sheet
- Table
- Skeleton
- Alert
- Textarea
- Label

Rules:
- Minimal variants
- Consistent focus ring
- Sticky table header
- Light/Dark parity
- Token-first surfaces and borders

---

# 16. Phase Definition

## Phase 1 Scope (MVP)
- No authentication
- No role/permission system
- Client-side search/filter
- Drag reorder persisted
- Simple comments
- No optimistic concurrency

---

# 17. Frozen Section

Freeze Date: 2026-02-16

Locked:
- Route shell and context URL rules
- Issue table columns and enums
- Detail sheet create/edit model
- Hierarchy and reorder rules
- Enterprise page contract (catalog/command center/operations controls)
- Board density preset behavior (spacing-only)
- Filter persistence model

Changes require explicit spec update.
