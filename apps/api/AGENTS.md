# API KNOWLEDGE BASE

Generated: 2026-02-17 (Asia/Seoul)
Scope: `apps/api`

## OVERVIEW
ASP.NET Core 8 API backed by EF Core + PostgreSQL for project and issue data.

## STRUCTURE
```text
apps/api/
|- Program.cs                 # Startup, middleware, CORS, route mapping
|- Controllers/               # HTTP endpoints (`IssuesController`)
|- Contracts/                 # Request/response DTOs
|- Models/                    # EF entities
|- Data/AppDbContext.cs       # DbContext + mapping
\- Dockerfile                 # Container build/runtime entry
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Startup/middleware | `Program.cs` | CORS policy, health endpoint, controller map |
| Issue endpoint behavior | `Controllers/IssuesController.cs` | Create/update/delete/reorder rules |
| DB schema mapping | `Data/AppDbContext.cs` | Entity configuration |
| API contracts | `Contracts/*.cs` | Payload shape agreement with frontend |
| Domain entities | `Models/*.cs` | Persistent fields and relationships |

## CONVENTIONS
- Keep error responses aligned with `ProblemDetails` behavior.
- Enforce hierarchy invariants server-side: no self-parent, no cycles, same-project parent validity.
- Enforce reorder invariants server-side: same-parent-only reorder.
- Keep API contract changes explicit in `Contracts/` and align frontend consumers.
- Preserve health endpoint (`GET /health`) for smoke checks.

## VALIDATION
```powershell
.\scripts\dev.ps1 docker-up
.\scripts\dev.ps1 api-health
.\scripts\dev.ps1 smoke
```

## ANTI-PATTERNS
- Shipping API/infra changes without `smoke` verification.
- Returning ad-hoc error envelopes that diverge from `ProblemDetails`.
- Relaxing hierarchy/reorder guards defined by `docs/FEATURE_SPEC.md`.
- Changing contract fields without coordinated frontend impact review.
