import type {
  Assignee,
  Issue,
  IssueComment,
  IssueDraft,
  IssuePriority,
  IssueStatus,
  Project,
  ProjectType,
  Workspace,
} from "../types/domain";

const now = new Date().toISOString();

export const mockWorkspaces: Workspace[] = [
  {
    id: "workspace-engineering",
    name: "제품개발본부",
    slug: "product-development",
    plan: "Team",
    status: "Active",
    memberCount: 18,
    lead: "김민준",
    summary: "제품 플랫폼, 코어 백엔드, 데이터 파이프라인을 통합 운영합니다.",
    description: "분기별 로드맵과 서비스 운영 이슈를 함께 관리하는 핵심 조직입니다.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "workspace-design",
    name: "브랜드경험실",
    slug: "brand-experience",
    plan: "Scale",
    status: "Active",
    memberCount: 11,
    lead: "박서연",
    summary: "브랜드 경험과 제품 UI 품질을 담당합니다.",
    description: "프로젝트 디자인 시스템과 브랜드 자산을 일관되게 유지합니다.",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockProjects: Project[] = [
  {
    id: "project-core",
    apiId: "11111111-1111-1111-1111-111111111111",
    workspaceId: "workspace-engineering",
    name: "통합 과제관리 웹앱",
    type: "Product",
    keyPrefix: "TASK",
    status: "Active",
    priority: "High",
    lead: "김민준",
    summary: "이슈 계층/백로그/보드 연동을 제공하는 핵심 웹앱 프로젝트입니다.",
    description: "Linear 스타일 UX를 참고해 작업 흐름을 명확하게 운영합니다.",
    startDate: null,
    targetDate: null,
    label: "Work",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "project-design",
    apiId: "22222222-2222-2222-2222-222222222222",
    workspaceId: "workspace-design",
    name: "디자인 시스템 고도화",
    type: "Design",
    keyPrefix: "DSGN",
    status: "Backlog",
    priority: "Medium",
    lead: "박서연",
    summary: "컴포넌트 일관성과 접근성 기준을 강화합니다.",
    description: "기존 스타일 토큰과 컴포넌트 재사용성을 단계적으로 개선합니다.",
    startDate: null,
    targetDate: null,
    label: "Design",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "project-growth",
    apiId: "33333333-3333-3333-3333-333333333333",
    workspaceId: "workspace-engineering",
    name: "2026 상반기 리드 전환 캠페인",
    type: "Marketing",
    keyPrefix: "MKTG",
    status: "Paused",
    priority: "Low",
    lead: "이지훈",
    summary: "리드 전환 퍼널을 정비하는 상반기 캠페인입니다.",
    description: "광고-랜딩-CRM 전환 흐름을 개선하고 운영 지표를 수집합니다.",
    startDate: null,
    targetDate: null,
    label: "Growth",
    createdAt: now,
    updatedAt: now,
  },
];

export const mockAssignees: Assignee[] = [
  { id: "user-minjun", name: "김민준" },
  { id: "user-seoyeon", name: "박서연" },
  { id: "user-jihun", name: "이지훈" },
  { id: "user-yerin", name: "최예린" },
];

interface TemplateIssue {
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  parentIndex?: number;
}

const projectTemplates: Record<ProjectType, TemplateIssue[]> = {
  Product: [
    {
      title: "스프린트 목표 및 인수조건 확정",
      description: "이번 스프린트 범위를 개발/디자인/기획과 합의하고 완료 기준을 문서화합니다.",
      status: "Todo",
      priority: "High",
    },
    {
      title: "이슈 계층 구조 UX 시나리오 작성",
      description: "부모-자식 이동 규칙, 드래그 허용 범위, 예외 케이스를 정의합니다.",
      status: "InProgress",
      priority: "Medium",
      parentIndex: 0,
    },
    {
      title: "계층 정보 표시 접근성 점검",
      description: "스크린리더 안내, 색상 대비, 키보드 포커스를 검증합니다.",
      status: "Done",
      priority: "Medium",
      parentIndex: 0,
    },
  ],
  Design: [
    {
      title: "컴포넌트 토큰 매핑 점검",
      description: "간격/타이포 토큰이 최신 디자인 기준과 일치하는지 확인합니다.",
      status: "Todo",
      priority: "High",
    },
    {
      title: "브랜드 카드 인터랙션 QA",
      description: "열림/닫힘 애니메이션과 접근성 동작을 검증합니다.",
      status: "InProgress",
      priority: "Medium",
      parentIndex: 0,
    },
    {
      title: "중복 컴포넌트 정리 및 가이드 반영",
      description: "구형 컴포넌트를 정리하고 마이그레이션 가이드를 업데이트합니다.",
      status: "Cancel",
      priority: "Low",
    },
  ],
  Marketing: [
    {
      title: "캠페인 백로그 작성",
      description: "랜딩/광고/CRM 실행 항목을 포함한 초기 작업 목록을 구성합니다.",
      status: "Todo",
      priority: "High",
    },
    {
      title: "광고 카피-브랜드 톤 적합성 리뷰",
      description: "캠페인 카피가 브랜드 가이드와 제품 메시지와 일치하는지 검토합니다.",
      status: "InProgress",
      priority: "Medium",
      parentIndex: 0,
    },
    {
      title: "이전 캠페인 잔여 작업 종료",
      description: "종료된 캠페인 문서를 정리하고 성과 요약을 공유합니다.",
      status: "Done",
      priority: "Low",
    },
  ],
};

function issueId(projectId: string, index: number) {
  return `${projectId}-issue-${index + 1}`;
}

function issueKey(project: Project, index: number) {
  return `${project.keyPrefix}-${120 + index + 1}`;
}

export function createTemplateIssuesForProject(project: Project, assignees: Assignee[]): Issue[] {
  const templates = projectTemplates[project.type];
  const seeded = templates.map((template, index) => {
    const assigned = assignees[index % assignees.length];
    return {
      id: issueId(project.id, index),
      key: issueKey(project, index),
      projectId: project.id,
      parentIssueId: null,
      title: template.title,
      description: template.description,
      status: template.status,
      isBacklog: template.status === "Todo",
      priority: template.priority,
      assigneeId: assigned?.id ?? null,
      order: index + 1,
      createdAt: now,
      updatedAt: now,
    };
  });

  return seeded.map((issue, index) => {
    const parentIndex = templates[index].parentIndex;
    if (parentIndex === undefined) {
      return issue;
    }
    return {
      ...issue,
      parentIssueId: seeded[parentIndex]?.id ?? null,
    };
  });
}

export function createInitialIssueMap(projects: Project[], assignees: Assignee[]) {
  return projects.reduce<Record<string, Issue[]>>((acc, project) => {
    acc[project.id] = createTemplateIssuesForProject(project, assignees);
    return acc;
  }, {});
}

export function createInitialCommentMap(
  issuesByProject: Record<string, Issue[]>,
  assignees: Assignee[],
) {
  const comments: Record<string, IssueComment[]> = {};

  Object.values(issuesByProject).forEach((issues, projectIndex) => {
    const target = issues.find((issue) => issue.parentIssueId === null) ?? issues[0];
    if (!target) {
      return;
    }

    const author = assignees[projectIndex % assignees.length] ?? assignees[0];
    if (!author) {
      return;
    }

    comments[target.id] = [
      {
        id: `comment-${target.id}-1`,
        issueId: target.id,
        authorId: author.id,
        body: "초기 방향 공유 완료. 실행 가능한 단위로 작업을 분해해 주세요.",
        createdAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      },
    ];
  });

  return comments;
}

export const emptyIssueDraft: IssueDraft = {
  title: "",
  description: "",
  status: "Todo",
  isBacklog: true,
  priority: "Medium",
  assigneeId: null,
  parentIssueId: null,
};
