# BOARD MODULE KNOWLEDGE BASE

Generated: 2026-02-17 (Asia/Seoul)
Scope: `apps/web/src/components/board`

## OVERVIEW
Feature module for issues board behavior, hierarchy, filtering, reorder flow, and detail-sheet interactions.

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Feature public entry | `board-page.tsx` | Exposes `BoardPage` integration point |
| Feature orchestration | `board-page-container.tsx` | Data flow/event handling |
| Shell rendering | `board-page-view.tsx` | Header, body shell, sheet, toast |
| Local state modules | `use-board-state.ts` | Filter/editor/interaction state hooks |
| Domain constants | `board-page.constants.ts` | Parent/root keys, DnD thresholds |
| Domain logic helpers | `board-page.utils.ts` | Hierarchy/filter/order utility logic |

## CONVENTIONS
- Keep board shell composition in `board-page-view.tsx`; do not move orchestration logic there.
- Keep board orchestration in `board-page-container.tsx`; use dedicated hooks from `use-board-state.ts`.
- Keep hierarchy/reorder/filter business rules centralized in `board-page.utils.ts` and constants.
- Preserve same-parent-only reorder behavior and filter/search-based reorder disabling.
- Preserve parent-cycle guards for issue hierarchy operations.
- Keep board filter persistence format: `board.filters.<workspaceId>.<projectId>`.

## ANTI-PATTERNS
- Spreading board state across unrelated UI components instead of board state hooks.
- Duplicating hierarchy/reorder logic in multiple component files.
- Introducing behavior that violates locked hierarchy/reorder rules in specs.
- Moving board domain logic into `components/ui` primitives.
