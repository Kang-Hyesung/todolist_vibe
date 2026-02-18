# Draft: Enterprise UI Improvement Analysis

## Requirements (confirmed)
- User request: Analyze the current project in depth and provide UI improvement points to evolve toward an enterprise-grade solution.
- Preference: Clean, tidy, organized UI structure.
- Exclusion: Keyboard interaction improvements are not required for this analysis.

## Technical Decisions
- Mode: Analysis-first (no implementation).
- Approach: Parallel context gathering from codebase patterns and external enterprise UI guidance.

## Research Findings
- Architecture mapping (`apps/web`):
  - `apps/web/src/App.tsx` currently mixes route-shell rendering, navigation/history syncing, theme, workspace/project context persistence, and CRUD mutation orchestration.
  - `apps/web/src/components/board/board-page.tsx` is a high-complexity container with dense state ownership (filters/presets/dnd/comments/activity/api-sync/selection) and substantial UI markup.
  - Board decomposition started (`issue-toolbar.tsx`, `issue-detail-left-panel.tsx`, `issue-detail-right-panel.tsx`, `issue-inspector-panel.tsx`, `issue-row-action-menu.tsx`) but orchestration remains centralized.
  - Management screens (`project-management-page.tsx`, `workspace-management-page.tsx`) share near-identical page scaffolds with duplicated visual/state patterns.
- Visual consistency audit summary:
  - Typography discipline: medium (too many arbitrary text sizes).
  - Spacing/radius/shadow consistency: medium-low (mixed control heights and radius values).
  - Color-token consistency: low-medium (many direct `dark:bg-[#...]` values bypass token governance).
  - Table/list density consistency: low (feature-level overrides diverge from base table primitives).
  - Modal/sheet consistency: medium-high (shared primitive used, internal composition diverges).
  - Style logic duplication: low (segmented controls, status tones, inspector layouts repeated).
- External enterprise UI patterns (React + Tailwind + shadcn style):
  - Standardize shell hierarchy (global shell -> sticky page header -> feature workspace).
  - Introduce data-density presets for table-heavy screens (compact/default/comfortable).
  - Enforce one primary CTA policy and explicit overlay policy (Dialog for short critical decisions, Sheet for contextual edit flows).
  - Govern semantic tokens centrally and prohibit arbitrary per-feature color/size values.

## Open Questions
- Which primary UX priority should lead Phase 1 improvements?
  - A) Visual consistency (tokens/typography/spacing)
  - B) Information architecture (shell/page contracts)
  - C) Data table clarity/density
  - D) Component deduplication (shared primitives)
- Expected rollout style?
  - Incremental refactor over existing UI
  - Structured redesign with explicit enterprise shell standard

## Scope Boundaries
- INCLUDE: Information architecture, layout system, visual consistency, data-density/readability, component governance, state UX, workflow clarity.
- EXCLUDE: Keyboard shortcut/accessibility hotkey interaction redesign.

## Initial Recommendation (analysis-only)
- Start with visual foundation first (semantic tokens + typography + control-height normalization), then apply shared page contracts, then deduplicate feature components.

## Oracle Consultation (conventional architecture review)
- Priority order validated:
  1) Split monolithic containers (`App.tsx`, `board-page.tsx`) by responsibility boundaries.
  2) Establish semantic token governance (`index.css`, `tailwind.config.js`).
  3) Consolidate duplicated management/page patterns and segmented/status controls.
- Guardrails:
  - Preserve frozen contracts from `docs/UI_SPEC.md` and `docs/FEATURE_SPEC.md`.
  - Keep orchestration in containers; UI components remain presentational with typed props.
  - Restrict feature-level styling to semantic tokens; avoid raw per-file color chains.
- Major risks and mitigations:
  - Behavior drift during extraction -> phased parity checks for issues flow.
  - Visual inconsistency during token migration -> semantic-group migration (surface/text/border/status) with temporary aliases.
  - Over-abstraction in shared shells -> share only scaffolding; keep domain fields local.
