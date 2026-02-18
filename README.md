# todolist_vibe

가벼운 팀 프로젝트 관리 보드입니다.

## 기술 스택

- 프론트엔드: React + Vite (`apps/web`)
- API: ASP.NET Core 8 (`apps/api`)
- 데이터베이스: PostgreSQL (Docker Compose)

## 저장소 구조

```text
apps/
  web/     # 프론트엔드
  api/     # 백엔드
infra/
  docker/  # 도커 컴포즈
docs/      # 기능/UI/체크리스트 명세
scripts/   # 개발 명령 진입점
```

## 빠른 시작

1. Node.js와 Docker Desktop을 설치합니다.
2. 저장소 루트에서 아래 명령을 실행합니다.

```powershell
.\scripts\dev.cmd docker-up
```

3. 아래 주소로 접속합니다.
- 웹: `http://127.0.0.1:5173`
- API 헬스체크: `http://localhost:8080/health`

## 자주 쓰는 명령어

```powershell
.\scripts\dev.cmd docker-up
.\scripts\dev.cmd docker-down
.\scripts\dev.cmd web-lint
.\scripts\dev.cmd web-build
.\scripts\dev.cmd smoke
```

## 명세 문서

- `docs/FEATURE_SPEC.md`
- `docs/UI_SPEC.md`
- `docs/CHECKLIST.md`
