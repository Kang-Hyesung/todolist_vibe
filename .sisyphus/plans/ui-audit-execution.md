# UI Audit and Improvement Execution Plan

## Scope and Constraints
- Source of truth: `docs/FEATURE_SPEC.md`, `docs/UI_SPEC.md`, `docs/CHECKLIST.md`
- Validation gate: `scripts/dev.ps1` commands in checklist
- Frozen items in spec must not be changed (routes, issue columns/enums, hierarchy/reorder rules, filter key format, enterprise page contract)
- Delivery model: small, reviewable staged changes

## Phase 0 - Traceability and Baseline
### Goals
- Build spec-to-UI traceability map for `/issues`, `/projects`, `/workspaces`
- Identify mismatches between implemented UI and frozen requirements

### Tasks
1. Inspect current shell/layout, tokens, and shared primitives
2. Map each major screen contract to existing components/files
3. Produce prioritized mismatch list by severity (critical/high/medium/low)

### Exit Criteria
- Every proposed change is linked to at least one spec/checklist rule
- No out-of-scope feature additions

## Phase 1 - High-Impact Corrective Fixes
### Goals
- Improve usability and readability with minimal-risk UI edits
- Fix high-severity visual and interaction inconsistencies

### Task Boundaries
- Token-consistent surfaces/text/borders in key shells/panels
- Header/navigation readability and hierarchy clarity
- Action affordance and state visibility where currently weak
- Responsive issues that break layout/interaction on mobile widths

### Must Not Do
- No architecture rewrites
- No new feature behavior outside frozen scope
- No API/data model changes

### Exit Criteria
- No regressions in core flows across three routes
- Changed files pass diagnostics

## Phase 2 - Consistency and Polish
### Goals
- Reduce style drift and improve coherence across board and management pages
- Refine spacing, density, and typographic consistency

### Task Boundaries
- Harmonize repeated one-off utility patterns to semantic token usage
- Improve section hierarchy and metadata readability
- Tighten table/panel polish while preserving existing behaviors

### Must Not Do
- No uncontrolled global CSS overrides
- No breaking changes to existing component props/contracts

### Exit Criteria
- UI appears visually consistent across routes and themes
- No functional behavior changes to locked interaction rules

## Phase 3 - Verification and Reviewer Gate
### Required Validation
1. `./scripts/dev.ps1 web-lint`
2. `./scripts/dev.ps1 web-build`
3. LSP diagnostics on all modified UI files
4. Manual smoke checklist from `docs/CHECKLIST.md` for web scope:
   - `/issues`: create/edit/delete issue, hierarchy parent change, same-parent reorder, filter persistence
   - `/projects`: create/edit/delete project, workspace filtering, context switch to issues
   - `/workspaces`: create/edit/delete workspace (including delete guard when projects exist)
5. Record smoke outcomes as pass/fail notes in final report

### Completion Criteria
- Validation commands succeed
- No new diagnostics errors in changed files
- Final change log includes:
  - What was improved in each phase
  - What was intentionally deferred
  - Remaining optional enhancements

## Prioritization Rubric
- Critical: blocks task completion or violates locked contract
- High: materially harms usability/readability or cross-route consistency
- Medium: noticeable polish/consistency gap with workaround
- Low: cosmetic refinements with low product impact

## Reviewer Checklist
- Every edit maps to spec/checklist reference
- No frozen contract drift
- No accidental behavior changes in hierarchy/filter/reorder rules
- No new one-off visual tokens that bypass semantic layer
- Validation evidence captured and passed
