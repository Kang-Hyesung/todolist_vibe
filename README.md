# todolist_vibe

Lightweight team project management board.

## Stack

- Frontend: React + Vite (`apps/web`)
- API: ASP.NET Core 8 (`apps/api`)
- Database: PostgreSQL (Docker Compose)

## Repository Structure

```text
apps/
  web/   # frontend
  api/   # backend
infra/
  docker/ # compose
docs/     # feature/ui/checklist specs
scripts/  # dev command entrypoint
```

## Quick Start

1. Install Node.js and Docker Desktop.
2. Run from repository root:

```powershell
.\scripts\dev.cmd docker-up
```

3. Open:
- Web: `http://127.0.0.1:5173`
- API health: `http://localhost:8080/health`

## Common Commands

```powershell
.\scripts\dev.cmd docker-up
.\scripts\dev.cmd docker-down
.\scripts\dev.cmd web-lint
.\scripts\dev.cmd web-build
.\scripts\dev.cmd smoke
```

## Specs

- `docs/FEATURE_SPEC.md`
- `docs/UI_SPEC.md`
- `docs/CHECKLIST.md`
