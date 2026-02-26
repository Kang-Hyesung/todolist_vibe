# 프론트 필드 ↔ API JSON 매핑 상세 문서

## 1. 문서 목적
이 문서는 화면에서 입력하는 값이 API 요청/응답 JSON의 어떤 필드와 연결되는지 정리합니다.
아래 관점을 함께 다룹니다.
- 화면 입력 필드
- 프론트 타입 필드
- API 요청 JSON 키
- API 응답 JSON 키
- 서버 계산/파생 필드

## 2. 기준 파일
- `apps/web/src/types/domain.ts`
- `apps/web/src/lib/management-api.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/components/management/workspace-management-page.tsx`
- `apps/web/src/components/management/project-management-page.tsx`
- `apps/web/src/components/board/board-page-container.tsx`

## 3. 전체 데이터 흐름
### 3.1 앱 초기 카탈로그 로드
1. API 모드(`VITE_API_BASE_URL` 존재)에서 앱 시작
2. `GET /workspaces`, `GET /projects` 호출
3. 응답을 `Workspace[]`, `Project[]`로 매핑

### 3.2 이슈 로드
1. 활성 프로젝트 선택
2. `GET /issues?projectId={apiProjectId}` 호출
3. 응답 `ApiIssue[]`를 `Issue[]`로 매핑

### 3.3 저장 흐름
- Workspace/Project: 관리 화면의 `*MutationInput` → `*MutationPayload` → `POST/PATCH`
- Issue: 상세 패널 draft → `CreateIssuePayload` 또는 `UpdateIssuePayload` → `POST/PATCH`

## 4. Workspace 매핑
## 4.1 생성/수정 입력 매핑

| 화면 입력 개념 | 프론트 타입 필드 (`WorkspaceMutationInput`) | API 요청 키 (`POST/PATCH /workspaces`) | API 응답 키 (`WorkspaceResponse`) | 비고 |
|---|---|---|---|---|
| 이름 | `name` | `name` | `name` | 필수 |
| 플랜 | `plan` | `plan` | `plan` | `Starter/Team/Scale` |
| 상태 | `status` | `status` | `status` | `Active/Paused/Archived` |
| 멤버 수 | `memberCount` | `memberCount` | `memberCount` | 1~100000 |
| 리드 | `lead` | `lead` | `lead` | nullable |
| 요약 | `summary` | `summary` | `summary` | 문자열 |
| 설명 | `description` | `description` | `description` | 문자열 |

## 4.2 응답 전용/서버 계산 필드

| 프론트 도메인 필드 (`Workspace`) | API 응답 키 | 입력 가능 여부 | 설명 |
|---|---|---:|---|
| `id` | `id` | N | 서버 생성 UUID |
| `slug` | `slug` | N | 서버가 `name` 기반 생성/갱신 |
| `createdAt` | `createdAt` | N | 서버 생성 시각 |
| `updatedAt` | `updatedAt` | N | 서버 수정 시각 |

핵심:
- 화면에서 `slug`를 직접 입력하지 않습니다.
- `slug`는 서버가 이름으로 생성하며 응답으로만 받습니다.

## 5. Project 매핑
## 5.1 생성/수정 입력 매핑

| 화면 입력 개념 | 프론트 타입 필드 (`ProjectMutationInput`) | API 요청 키 (`POST/PATCH /projects`) | API 응답 키 (`ProjectResponse`) | 비고 |
|---|---|---|---|---|
| 이름 | `name` | `name` | `name` | 필수 |
| 워크스페이스 | `workspaceId` | `workspaceId` | `workspaceId` | 존재하는 워크스페이스여야 함 |
| 타입 | `type` | `type` | `type` | `Product/Design/Marketing` |
| Key Prefix | `keyPrefix` | `keyPrefix` | `keyPrefix` | `^[A-Z]{2,6}$` |
| 상태 | `status` | `status` | `status` | `Backlog/Active/Paused/Completed` |
| 우선순위 | `priority` | `priority` | `priority` | `None/Low/Medium/High` |
| 리드 | `lead` | `lead` | `lead` | nullable |
| 요약 | `summary` | `summary` | `summary` | 문자열 |
| 설명 | `description` | `description` | `description` | 문자열 |
| 시작일 | `startDate` | `startDate` | `startDate` | nullable, DateOnly |
| 목표일 | `targetDate` | `targetDate` | `targetDate` | nullable, DateOnly |
| 라벨 | `label` | `label` | `label` | nullable |

## 5.2 응답 전용 필드

| 프론트 도메인 필드 (`Project`) | API 응답 키 | 입력 가능 여부 | 설명 |
|---|---|---:|---|
| `id` | `id` | N | 서버 UUID |
| `apiId` | (응답 `id`를 복제) | N | 프론트에서 API 호출용 ID 캐시 |
| `createdAt` | `createdAt` | N | 서버 생성 시각 |
| `updatedAt` | `updatedAt` | N | 서버 수정 시각 |

핵심:
- API 모드에서 `id`와 `apiId`는 동일 값으로 세팅됩니다.
- Mock 모드까지 고려한 구조라 `apiId` 필드가 별도로 유지됩니다.

## 6. Issue 매핑
## 6.1 API 타입과 프론트 타입 차이

| 구분 | API 타입 (`ApiIssue`) | 프론트 타입 (`Issue`) | 비고 |
|---|---|---|---|
| 프로젝트 참조 | `projectId`(API project id) | `projectId`(local project id) | 매핑 함수가 local id로 주입 |
| 백로그 여부 | 없음 | `isBacklog` | `status === "Todo"`로 파생 |
| 상위 이슈 | `parentIssueId` | `parentIssueId` | null 허용 |

## 6.2 생성 요청 매핑 (`POST /issues`)

| 화면 입력 개념 | 프론트 draft/source | API 요청 키 (`CreateIssuePayload`) | 비고 |
|---|---|---|---|
| 대상 프로젝트 | `activeProject.apiId` | `projectId` | API 프로젝트 ID 사용 |
| 상위 이슈 | `draft.parentIssueId` | `parentIssueId` | null이면 루트 |
| 제목 | `draft.title` | `title` | 필수 |
| 설명 | `draft.description` | `description` | 문자열 |
| 상태 | `draft.status` | `status` | Todo/InProgress/Done/Cancel |
| 우선순위 | `draft.priority` | `priority` | Low/Medium/High |
| 담당자 | `draft.assigneeId` | `assigneeId` | nullable |
| 순서(옵션) | 계산값/지정값 | `order` | 미전달 시 서버 계산 |

## 6.3 수정 요청 매핑 (`PATCH /issues/{id}`)

| 화면 입력 개념 | 프론트 draft/source | API 요청 키 (`UpdateIssuePayload`) | 비고 |
|---|---|---|---|
| 상위 이슈 | `draft.parentIssueId` | `parentIssueId` | 계층 검증 적용 |
| 제목 | `draft.title` | `title` | 필수 |
| 설명 | `draft.description` | `description` | 문자열 |
| 상태 | `draft.status` | `status` | enum |
| 우선순위 | `draft.priority` | `priority` | enum |
| 담당자 | `draft.assigneeId` | `assigneeId` | nullable |

## 6.4 정렬 요청 매핑 (`PUT /issues/reorder`)

| 프론트 입력 | API 요청 키 | 설명 |
|---|---|---|
| `activeProject.apiId` | `projectId` | 대상 프로젝트 |
| `orderedIssueIds` | `issueIds` | 형제 레벨 순서 배열 |

제약:
- 같은 프로젝트 이슈만 허용
- 같은 부모 레벨 형제만 허용

## 6.5 응답 매핑
`toIssue(apiIssue, localProjectId)`에서 아래 파생/변환이 발생합니다.

| 프론트 필드 (`Issue`) | 원본 | 규칙 |
|---|---|---|
| `id` | `apiIssue.id` | 그대로 |
| `key` | `apiIssue.key` | 그대로 |
| `projectId` | `localProjectId` | API 값 대신 로컬 컨텍스트 주입 |
| `parentIssueId` | `apiIssue.parentIssueId` | undefined/null → null |
| `title` | `apiIssue.title` | 그대로 |
| `description` | `apiIssue.description` | 그대로 |
| `status` | `apiIssue.status` | 그대로 |
| `isBacklog` | `apiIssue.status` | `status === "Todo"` |
| `priority` | `apiIssue.priority` | 그대로 |
| `assigneeId` | `apiIssue.assigneeId` | 그대로 |
| `order` | `apiIssue.order` | 그대로 |
| `createdAt` | `apiIssue.createdAt` | 그대로 |
| `updatedAt` | `apiIssue.updatedAt` | 그대로 |

## 7. 화면별 API 호출 매핑

| 화면 | 기능 | 호출 API | 프론트 함수 |
|---|---|---|---|
| `/workspaces` | 목록 | `GET /workspaces` | `fetchWorkspacesFromApi` |
| `/workspaces` | 생성 | `POST /workspaces` | `createWorkspaceInApi` |
| `/workspaces` | 수정 | `PATCH /workspaces/{id}` | `updateWorkspaceInApi` |
| `/workspaces` | 삭제 | `DELETE /workspaces/{id}` | `deleteWorkspaceInApi` |
| `/projects` | 목록 | `GET /projects` 또는 `GET /projects?workspaceId=` | `fetchProjectsFromApi` |
| `/projects` | 생성 | `POST /projects` | `createProjectInApi` |
| `/projects` | 수정 | `PATCH /projects/{id}` | `updateProjectInApi` |
| `/projects` | 삭제 | `DELETE /projects/{id}` | `deleteProjectInApi` |
| `/issues` | 목록 | `GET /issues?projectId=` | `fetchIssuesFromApi` |
| `/issues` | 생성 | `POST /issues` | `createIssueInApi` |
| `/issues` | 수정 | `PATCH /issues/{id}` | `updateIssueInApi` |
| `/issues` | 삭제 | `DELETE /issues/{id}` | `deleteIssueInApi` |
| `/issues` | 순서 변경 | `PUT /issues/reorder` | `reorderIssuesInApi` |

## 8. API 모드와 Mock 모드 차이

| 항목 | API 모드 | Mock 모드 |
|---|---|---|
| 활성 조건 | `VITE_API_BASE_URL` 존재 | 미설정 |
| Workspace/Project ID | 서버 UUID | 프론트 생성 ID 가능 |
| Issue key/order/timestamp | 서버 기준 | 프론트 생성/갱신 |
| `isBacklog` | status 기반 파생 | status 기반 파생 |

## 9. 자주 발생하는 매핑 실수
- `projectId` 혼동:
- Issue API 요청은 `activeProject.apiId`를 사용해야 함
- 프론트 도메인 `Issue.projectId`는 로컬 프로젝트 ID로 유지됨
- `slug` 입력 시도:
- 워크스페이스 slug는 서버 생성 필드라 요청에 넣지 않음
- `isBacklog` 전송 시도:
- API 요청 필드가 아니라 프론트 파생 필드
- 날짜 역전:
- Project `startDate > targetDate`는 서버에서 400

## 10. 빠른 체크리스트
- 화면 입력값이 `*MutationInput`에 반영되는지 확인
- API 요청 직전 payload 키 이름이 문서와 일치하는지 확인
- 서버 응답 후 파생 필드(`apiId`, `isBacklog`) 처리 확인
- UUID/enum/date 포맷 검증 확인
