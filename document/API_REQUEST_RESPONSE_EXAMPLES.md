# API 요청/응답 상세 가이드

## 1. 문서 목적
이 문서는 백엔드 API를 실무에서 안정적으로 연동하기 위해 필요한 내용을 상세히 설명합니다.
- 엔드포인트별 요청/응답 예시
- 필드 단위 스펙
- 검증 규칙과 오류 케이스
- 호출 순서 및 운영 가이드

## 2. 기본 정보
- Base URL: `http://localhost:18080`
- Content-Type: `application/json`
- 인증/인가: 현재 미적용
- 주요 성공 코드: `200`, `201`, `204`
- 주요 오류 코드: `400`, `404`, `409`

## 3. 공통 규칙
### 3.1 ID 타입
- 모든 리소스 ID는 UUID(GUID) 문자열

### 3.2 날짜/시간
- `createdAt`, `updatedAt`: ISO-8601 UTC (`2026-02-24T08:00:00Z`)
- `startDate`, `targetDate`: DateOnly 형식 (`YYYY-MM-DD`)

### 3.3 문자열 정리
- 서버는 일부 필드를 `trim()` 후 저장
- 공백 문자열은 nullable 필드에서 `null`로 정규화됨

## 4. 공통 오류 포맷
### 4.1 ProblemDetails 예시
```json
{
  "type": "about:blank",
  "title": "Project not found",
  "status": 404,
  "detail": "Cannot update project because it does not exist."
}
```

### 4.2 ValidationProblemDetails 예시
```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.1",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": {
    "keyPrefix": [
      "KeyPrefix must be 2 to 6 uppercase English letters."
    ]
  }
}
```

## 5. 리소스 스키마
## 5.1 WorkspaceResponse

| 필드 | 타입 | Nullable | 설명 |
|---|---|---:|---|
| id | string(UUID) | N | 워크스페이스 ID |
| name | string | N | 워크스페이스 이름 |
| slug | string | N | 이름 기반 slug |
| plan | string | N | Starter/Team/Scale |
| status | string | N | Active/Paused/Archived |
| memberCount | number | N | 멤버 수 |
| lead | string | Y | 리드 이름 |
| summary | string | N | 요약 |
| description | string | N | 설명 |
| createdAt | string(datetime) | N | 생성 시각 |
| updatedAt | string(datetime) | N | 수정 시각 |

## 5.2 ProjectResponse

| 필드 | 타입 | Nullable | 설명 |
|---|---|---:|---|
| id | string(UUID) | N | 프로젝트 ID |
| workspaceId | string(UUID) | N | 소속 워크스페이스 |
| name | string | N | 프로젝트명 |
| type | string | N | Product/Design/Marketing |
| keyPrefix | string | N | 이슈 키 Prefix |
| status | string | N | Backlog/Active/Paused/Completed |
| priority | string | N | None/Low/Medium/High |
| lead | string | Y | 프로젝트 리드 |
| summary | string | N | 요약 |
| description | string | N | 설명 |
| startDate | string(date) | Y | 시작일 |
| targetDate | string(date) | Y | 목표일 |
| label | string | Y | 태그/라벨 |
| createdAt | string(datetime) | N | 생성 시각 |
| updatedAt | string(datetime) | N | 수정 시각 |

## 5.3 IssueResponse

| 필드 | 타입 | Nullable | 설명 |
|---|---|---:|---|
| id | string(UUID) | N | 이슈 ID |
| key | string | N | 예: TASK-001 |
| projectId | string(UUID) | N | 소속 프로젝트 |
| parentIssueId | string(UUID) | Y | 상위 이슈 |
| title | string | N | 이슈 제목 |
| description | string | N | 이슈 설명 |
| status | string | N | Todo/InProgress/Done/Cancel |
| priority | string | N | Low/Medium/High |
| assigneeId | string | Y | 담당자 ID |
| order | number | N | 같은 부모 내 정렬 순서 |
| createdAt | string(datetime) | N | 생성 시각 |
| updatedAt | string(datetime) | N | 수정 시각 |

## 6. 엔드포인트 상세
## 6.1 Health
### GET `/health`
```bash
curl -X GET "http://localhost:18080/health"
```

응답:
```json
{ "status": "ok" }
```

## 6.2 Workspace API
### GET `/workspaces`
워크스페이스 목록 조회.
정렬: `CreatedAt ASC`.

```bash
curl -X GET "http://localhost:18080/workspaces"
```

### POST `/workspaces`
워크스페이스 생성.

요청 바디:
```json
{
  "name": "신규사업실",
  "plan": "Team",
  "status": "Active",
  "memberCount": 12,
  "lead": "홍길동",
  "summary": "신규 사업 기획/실행 조직",
  "description": "신규 비즈니스 기회를 발굴하고 MVP를 운영합니다."
}
```

검증:
- `name`: required, max 120
- `plan`: Starter/Team/Scale
- `status`: Active/Paused/Archived
- `memberCount`: 1~100000
- `lead`: max 120
- `summary`: max 400
- `description`: max 4000

주의:
- `summary`, `description` 미전달 시 서버는 빈 문자열로 저장
- `slug`는 서버에서 자동 생성

### PATCH `/workspaces/{id}`
워크스페이스 수정. 요청 스키마는 POST와 동일.

```bash
curl -X PATCH "http://localhost:18080/workspaces/{workspaceId}" \
  -H "Content-Type: application/json" \
  -d '{"name":"제품개발본부","plan":"Scale","status":"Active","memberCount":45,"lead":"김민준","summary":"업데이트 요약","description":"업데이트 설명"}'
```

오류:
- `404`: 대상 ID 없음
- `400`: 유효성 실패

### DELETE `/workspaces/{id}`
워크스페이스 삭제.

```bash
curl -X DELETE "http://localhost:18080/workspaces/{workspaceId}"
```

오류:
- `404`: 대상 ID 없음
- `409`: 하위 프로젝트 존재

## 6.3 Project API
### GET `/projects`
프로젝트 목록 조회.
정렬: `UpdatedAt DESC`, `Name ASC`.

```bash
curl -X GET "http://localhost:18080/projects"
```

### GET `/projects?workspaceId={workspaceId}`
워크스페이스 기준 필터 조회.

```bash
curl -X GET "http://localhost:18080/projects?workspaceId={workspaceId}"
```

### POST `/projects`
프로젝트 생성.

요청 바디:
```json
{
  "workspaceId": "90000000-0000-0000-0000-000000000001",
  "name": "정산 대시보드 개선",
  "type": "Product",
  "keyPrefix": "BILL",
  "status": "Active",
  "priority": "High",
  "lead": "최예린",
  "summary": "정산 지표의 가시성 향상",
  "description": "재무팀 운영 지표를 실시간으로 확인할 수 있도록 개선",
  "startDate": "2026-03-01",
  "targetDate": "2026-07-31",
  "label": "Finance"
}
```

검증:
- `workspaceId`: required, 빈 GUID 불가
- `name`: required, max 120
- `type`: Product/Design/Marketing
- `keyPrefix`: `^[A-Z]{2,6}$`
- `status`: Backlog/Active/Paused/Completed
- `priority`: None/Low/Medium/High
- `lead`: max 120
- `summary`: max 400
- `description`: max 4000
- `label`: max 60
- `startDate <= targetDate`

오류:
- `404`: workspaceId 없음
- `400`: 유효성 실패

### PATCH `/projects/{id}`
프로젝트 수정. 요청 스키마는 POST와 동일.

```bash
curl -X PATCH "http://localhost:18080/projects/{projectId}" \
  -H "Content-Type: application/json" \
  -d '{"workspaceId":"90000000-0000-0000-0000-000000000001","name":"관리자 감사로그 고도화","type":"Product","keyPrefix":"AUDT","status":"Completed","priority":"Low","lead":"김민준","summary":"요약","description":"설명","startDate":"2025-10-01","targetDate":"2025-12-20","label":"Audit"}'
```

오류:
- `404`: projectId 또는 workspaceId 없음
- `400`: 유효성 실패

### DELETE `/projects/{id}`
프로젝트 삭제.

```bash
curl -X DELETE "http://localhost:18080/projects/{projectId}"
```

동작:
- 프로젝트 하위 이슈를 먼저 삭제 후 프로젝트 삭제

오류:
- `404`: 대상 projectId 없음

## 6.4 Issue API
### GET `/issues?projectId={projectId}`
프로젝트 이슈 목록 조회.
정렬: `Order ASC`, `CreatedAt ASC`.

```bash
curl -X GET "http://localhost:18080/issues?projectId={projectId}"
```

오류:
- `400`: projectId 미전달 또는 빈 GUID

### POST `/issues`
이슈 생성.

요청 바디:
```json
{
  "projectId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "parentIssueId": null,
  "title": "로그 검색 성능 개선",
  "description": "인덱스 전략과 조회 쿼리를 개선합니다.",
  "status": "Todo",
  "priority": "Medium",
  "assigneeId": "user-minjun",
  "order": 10
}
```

검증:
- `projectId`: required
- `title`: required, max 160
- `description`: max 4000
- `status`: Todo/InProgress/Done/Cancel
- `priority`: Low/Medium/High
- `assigneeId`: max 120
- `order`: optional, 전달 시 1 이상
- `parentIssueId`: 동일 프로젝트 내 이슈만 허용

동작:
- `order` 미전달 시 같은 부모 기준 max(order)+1
- `key`는 프로젝트 keyPrefix 기반 자동 생성

오류:
- `404`: projectId 없음
- `400`: parentIssueId 불일치 또는 유효성 실패

### PATCH `/issues/{id}`
이슈 수정.

요청 바디:
```json
{
  "parentIssueId": null,
  "title": "로그 검색 성능 개선",
  "description": "조회 속도 목표 30% 개선",
  "status": "InProgress",
  "priority": "High",
  "assigneeId": "user-seoyeon"
}
```

검증/제약:
- 자기 자신을 부모로 지정 불가
- 자기 하위 이슈를 부모로 지정 불가(사이클 방지)
- parentIssueId는 동일 프로젝트 내 이슈여야 함

동작:
- 부모 변경 시 기존 부모와 신규 부모의 형제 order 재정렬

오류:
- `404`: 대상 issueId 없음
- `400`: 유효성 실패/계층 제약 위반

### DELETE `/issues/{id}`
이슈 삭제.

```bash
curl -X DELETE "http://localhost:18080/issues/{issueId}"
```

동작:
- 대상 이슈 + 하위 트리 전체 삭제
- 동일 부모의 남은 형제 이슈 order 재정렬

오류:
- `404`: 대상 issueId 없음

### PUT `/issues/reorder`
형제 이슈 순서 재정렬.

요청 바디:
```json
{
  "projectId": "cccccccc-cccc-cccc-cccc-cccccccccccc",
  "issueIds": [
    "8c91f157-6e0d-4f46-8f33-2d7717b91037",
    "f8ee2bf2-7d8f-4cde-b4e8-1234567890ab"
  ]
}
```

검증:
- `projectId`: required
- `issueIds`: 1개 이상
- payload issueIds는 모두 같은 프로젝트 소속이어야 함
- payload issueIds는 모두 같은 부모 레벨이어야 함

동작:
- payload 순서를 우선 반영
- payload에 없는 같은 부모 형제는 뒤에 기존 순서대로 이어붙임

오류:
- `404`: projectId 없음
- `400`: issueIds가 프로젝트 불일치 또는 부모 레벨 불일치

## 7. 리소스별 요청 필드 요약
## 7.1 Create/Update Workspace

| 필드 | 필수 | 타입 | 제약 |
|---|---:|---|---|
| name | Y | string | max 120 |
| plan | Y | string | Starter/Team/Scale |
| status | Y | string | Active/Paused/Archived |
| memberCount | Y | number | 1~100000 |
| lead | N | string | max 120 |
| summary | N | string | max 400 |
| description | N | string | max 4000 |

## 7.2 Create/Update Project

| 필드 | 필수 | 타입 | 제약 |
|---|---:|---|---|
| workspaceId | Y | UUID | empty GUID 불가 |
| name | Y | string | max 120 |
| type | Y | string | Product/Design/Marketing |
| keyPrefix | Y | string | `^[A-Z]{2,6}$` |
| status | Y | string | Backlog/Active/Paused/Completed |
| priority | Y | string | None/Low/Medium/High |
| lead | N | string | max 120 |
| summary | N | string | max 400 |
| description | N | string | max 4000 |
| startDate | N | date | targetDate보다 늦으면 안 됨 |
| targetDate | N | date | startDate보다 빠르면 안 됨 |
| label | N | string | max 60 |

## 7.3 Create Issue

| 필드 | 필수 | 타입 | 제약 |
|---|---:|---|---|
| projectId | Y | UUID | 존재하는 프로젝트 |
| parentIssueId | N | UUID | 동일 프로젝트 이슈만 허용 |
| title | Y | string | max 160 |
| description | N | string | max 4000 |
| status | Y | string | Todo/InProgress/Done/Cancel |
| priority | Y | string | Low/Medium/High |
| assigneeId | N | string | max 120 |
| order | N | number | 1 이상 |

## 7.4 Update Issue

| 필드 | 필수 | 타입 | 제약 |
|---|---:|---|---|
| parentIssueId | N | UUID | 자기 자신/하위 지정 불가 |
| title | Y | string | max 160 |
| description | N | string | max 4000 |
| status | Y | string | Todo/InProgress/Done/Cancel |
| priority | Y | string | Low/Medium/High |
| assigneeId | N | string | max 120 |

## 8. 실무 연동 시 권장 호출 순서
1. `GET /workspaces`
2. `GET /projects?workspaceId=...`
3. `GET /issues?projectId=...`
4. 신규 생성은 `POST`
5. 속성 변경은 `PATCH`
6. 정렬은 `PUT /issues/reorder`
7. 삭제는 하위 영향 확인 후 `DELETE`

## 9. curl 실전 예시 (한 세션)
```bash
# 1) 워크스페이스 목록
curl -X GET "http://localhost:18080/workspaces"

# 2) 특정 워크스페이스 프로젝트 목록
curl -X GET "http://localhost:18080/projects?workspaceId=90000000-0000-0000-0000-000000000001"

# 3) 프로젝트 이슈 목록
curl -X GET "http://localhost:18080/issues?projectId=cccccccc-cccc-cccc-cccc-cccccccccccc"

# 4) 이슈 생성
curl -X POST "http://localhost:18080/issues" \
  -H "Content-Type: application/json" \
  -d '{"projectId":"cccccccc-cccc-cccc-cccc-cccccccccccc","parentIssueId":null,"title":"신규 운영 점검 항목","description":"배포 후 로그 검증","status":"Todo","priority":"Medium","assigneeId":"user-minjun"}'
```

## 10. 프론트 연동 참고
- 웹 URL 예시:
`http://127.0.0.1:5173/issues?workspace=90000000-0000-0000-0000-000000000001&project=cccccccc-cccc-cccc-cccc-cccccccccccc`
- API 모드 활성화 시 웹은 실제 DB 데이터를 조회/수정합니다.
