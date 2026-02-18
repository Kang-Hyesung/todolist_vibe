# UI Audit Results and Phased Improvement Plan

## Scope Reference
- `docs/FEATURE_SPEC.md`
- `docs/UI_SPEC.md`
- `docs/CHECKLIST.md`

## Priority Improvements

### Phase 1 (Critical/High)
1. Enforce same-parent-only drag reorder in board interactions.
   - Spec: UI/Feature hierarchy and reorder constraints are frozen.
   - File: `apps/web/src/components/board/board-page-container.tsx`
2. Keep workspace/project context selectors visible in route header for all routes.
   - Spec: route shell header includes workspace and project selector context.
   - File: `apps/web/src/App.tsx`
3. Add explicit management page loading/error states with retry action.
   - Spec: loading/empty/error states required for projects/workspaces.
   - Files:
     - `apps/web/src/components/management/project-management-page.tsx`
     - `apps/web/src/components/management/workspace-management-page.tsx`

### Phase 2 (Consistency/Polish)
4. Reduce ad-hoc surface/border/text classes in board shell and toolbar.
   - Spec: token-first semantic layer (`surface`, `border`, `ink`).
   - Files:
     - `apps/web/src/components/board/board-page-view.tsx`
     - `apps/web/src/components/board/issue-toolbar.tsx`
5. Improve token consistency in detail panel surfaces and metadata blocks.
   - Files:
     - `apps/web/src/components/board/issue-detail-left-panel.tsx`
     - `apps/web/src/components/board/issue-detail-right-panel.tsx`
6. Align table primitive surfaces and row/header states to semantic tokens.
   - File: `apps/web/src/components/ui/table.tsx`

## Out of Scope in This Pass
- Route changes
- Enum/data model changes
- API contract or backend behavior changes
- New architecture patterns beyond current component composition

## Validation Gates
1. `./scripts/dev.ps1 web-lint`
2. `./scripts/dev.ps1 web-build`
3. Manual smoke checklist notes for `/issues`, `/projects`, `/workspaces`
