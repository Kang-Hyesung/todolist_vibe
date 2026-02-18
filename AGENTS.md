# PROJECT KNOWLEDGE BASE

Generated: 2026-02-17 (Asia/Seoul)
Workspace: non-git local repository

## OVERVIEW
Monorepo for a lightweight team PM board tool.
Stack: React + Vite frontend (`apps/web`), ASP.NET Core 8 API (`apps/api`), PostgreSQL via Docker (`infra/docker`).

## STRUCTURE
```text
.
|- apps/
|  |- web/                  # Frontend app
|  |  \- src/components/    # board, ui, management modules
|  \- api/                  # .NET API + EF Core models/contracts/controllers
|- docs/                    # Product/UI/checklist source-of-truth specs
|- infra/docker/            # Compose runtime for postgres + api
|- scripts/                 # Canonical command router (`dev.ps1`)
|- AGENTS/                  # Planner/Builder/Reviewer role definitions
\- AGENTS.md                # This root knowledge base
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Product behavior | `docs/FEATURE_SPEC.md` | Hierarchy/reorder/business constraints |
| UI behavior | `docs/UI_SPEC.md` | Layout contract, token policy, frozen UI sections |
| Validation baseline | `docs/CHECKLIST.md` | Required command matrix + manual smoke checklist |
| Dev command entrypoint | `scripts/dev.ps1` | Canonical command router |
| Web runtime entry | `apps/web/src/main.tsx` | App mount |
| API runtime entry | `apps/api/Program.cs` | Middleware/routes/startup |

## CONVENTIONS (PROJECT-SPECIFIC)
- Sources of truth are `docs/FEATURE_SPEC.md`, `docs/UI_SPEC.md`, `docs/CHECKLIST.md`.
- If source docs conflict or are unclear, stop and ask clarification before implementation.
- Workflow order is strict: Planner -> Builder -> Reviewer.
- Keep changes PR-sized and reviewable.
- Never bypass validation rules in `scripts/dev.ps1`.
- Do not introduce undocumented architecture patterns.
- Respect frozen/locked spec sections; changes require explicit spec update.

## ANTI-PATTERNS (THIS PROJECT)
- Skipping Planner/Builder/Reviewer stage transitions.
- Running ad-hoc validation while skipping required `scripts/dev.ps1` commands.
- Changing locked enums/columns/hierarchy rules without updating specs.
- Treating docs as advisory when they are marked authoritative/frozen.

## UNIQUE STYLES
- Management pages follow a 3-column enterprise contract: catalog pane, command center, operations controls.
- Board page contract splits orchestration (`BoardPageContainer`) from shell rendering (`BoardPageView`).
- Semantic token policy is required for surfaces/borders/ink; avoid one-off dark hex backgrounds.
- Board density presets (`compact`, `default`, `comfortable`) adjust spacing only.

## COMMANDS
```powershell
.\scripts\dev.ps1 web-lint
.\scripts\dev.ps1 web-build
.\scripts\dev.ps1 docker-up
.\scripts\dev.ps1 api-health
.\scripts\dev.ps1 smoke
```

## NOTES
- Automated unit/integration/E2E runners are not configured yet; manual smoke checklist in `docs/CHECKLIST.md` is required.
- If validation command guidance differs across docs, follow `docs/CHECKLIST.md` because it is a declared source of truth.
