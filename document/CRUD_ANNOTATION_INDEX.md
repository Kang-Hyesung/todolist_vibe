# CRUD 주석 문서 인덱스

## 1. 목적
`screenshots` 기준으로 CRUD 핵심 동선을 번호/사각형/화살표로 마킹한 문서 모음입니다.

## 2. 문서 목록
1. [홈(첫 화면) 온보딩 주석 가이드](./HOME_ONBOARDING_ANNOTATED_GUIDE.md)
2. [이슈 CRUD 주석 가이드](./ISSUES_CRUD_ANNOTATED_GUIDE.md)
3. [프로젝트 CRUD 주석 가이드](./PROJECTS_CRUD_ANNOTATED_GUIDE.md)
4. [워크스페이스 CRUD 주석 가이드](./WORKSPACES_CRUD_ANNOTATED_GUIDE.md)

## 3. 마킹 색상 범례
- 파랑: 생성
- 초록: 조회
- 주황: 수정
- 빨강: 삭제

## 4. 생성 이미지
- `screenshots/annotated/home-onboarding-annotated.png`
- `screenshots/annotated/issues-crud-annotated.png`
- `screenshots/annotated/projects-crud-annotated.png`
- `screenshots/annotated/workspaces-crud-annotated.png`

## 5. 재생성 방법
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\annotate-screenshots.ps1 -RootPath .
```
