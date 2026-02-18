# WEB KNOWLEDGE BASE

Generated: 2026-02-17 (Asia/Seoul)
Scope: `apps/web`

## OVERVIEW
React + Vite frontend with three route surfaces: issues board, project management, workspace management.

## STRUCTURE
```text
apps/web/
|- src/App.tsx                    # Route shell + context/theme orchestration
|- src/main.tsx                   # React mount entry
|- src/components/board/          # Issues board feature module
|- src/components/management/     # Project/workspace management pages
|- src/components/ui/             # Reusable UI primitives
|- src/data/mock.ts               # Local mock data seeds
\- src/lib/api.ts                 # API mode toggle + HTTP helpers
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Route/context behavior | `src/App.tsx` | URL query + localStorage sync (`workspace`,`project`) |
| Board shell wiring | `src/components/board/board-page.tsx` | Public board feature entry |
| Board orchestration | `src/components/board/board-page-container.tsx` | Event/state composition |
| Board rendering shell | `src/components/board/board-page-view.tsx` | Header/sheet/toast layout |
| Management page layout | `src/components/management/enterprise-layout.tsx` | 3-column contract |
| Shared primitives | `src/components/ui/` | Tokenized UI building blocks |

## CONVENTIONS
- Preserve board split: orchestration in `BoardPageContainer`, shell rendering in `BoardPageView`.
- Preserve management split: catalog pane, command center, operations controls.
- Keep issue/status/priority behavior aligned with locked enums in `docs/FEATURE_SPEC.md` and `docs/UI_SPEC.md`.
- Keep board filter persistence key format: `board.filters.<workspaceId>.<projectId>`.
- Prefer semantic surface/border/ink token classes over one-off dark hex values.
- Keep API mode behavior centralized in `src/lib/api.ts` and board container integration.

## VALIDATION
```powershell
.\scripts\dev.ps1 web-lint
.\scripts\dev.ps1 web-build
```

## ANTI-PATTERNS
- Mixing board business rules directly into generic `ui` primitives.
- Breaking URL/localStorage context synchronization in `App.tsx`.
- Adding management layouts that bypass the 3-column enterprise contract.
- Introducing new status/priority/table-column variants without spec updates.
