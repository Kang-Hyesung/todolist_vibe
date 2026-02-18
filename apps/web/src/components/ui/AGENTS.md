# UI MODULE KNOWLEDGE BASE

Generated: 2026-02-17 (Asia/Seoul)
Scope: `apps/web/src/components/ui`

## OVERVIEW
Reusable UI primitives and composable controls used by board and management feature modules.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Variant-driven buttons | `button.tsx` | `cva`-based variant surface |
| Form primitives | `input.tsx`, `textarea.tsx`, `select.tsx`, `label.tsx` | Shared field controls |
| Feedback primitives | `alert.tsx`, `badge.tsx`, `tooltip.tsx`, `skeleton.tsx` | Status/feedback UI |
| Overlay/menu primitives | `sheet.tsx`, `dropdown-menu.tsx` | Dialog/menu interaction wrappers |
| Reusable composite UI | `metric-card.tsx`, `empty-state.tsx`, `segmented-tabs.tsx` | Cross-page reusable blocks |

## CONVENTIONS
- Keep this module presentation-focused; avoid board/management-specific business logic.
- Keep APIs strongly typed via component props and variant definitions.
- Use semantic token classes for surfaces, borders, and ink tones.
- Keep light/dark parity for all variants and interaction states.
- Reuse shared class composition helpers (`cn`, `cva`) for consistency.

## ANTI-PATTERNS
- Importing feature-domain logic/types from `components/board` or `components/management`.
- Adding one-off style patterns that bypass established token semantics.
- Embedding route/context/query/localStorage behavior into UI primitives.
- Creating narrowly scoped feature widgets in `ui` when they are not cross-module reusable.
