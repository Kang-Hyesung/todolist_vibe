export const ISSUE_STATUSES = ["Todo", "InProgress", "Done", "Cancel"] as const;
export const ISSUE_PRIORITIES = ["Low", "Medium", "High"] as const;
export const PROJECT_TYPES = ["Product", "Design", "Marketing"] as const;
export const WORKSPACE_PLANS = ["Starter", "Team", "Scale"] as const;
export const PROJECT_STATUSES = ["Backlog", "Active", "Paused", "Completed"] as const;
export const PROJECT_PRIORITIES = ["None", "Low", "Medium", "High"] as const;
export const WORKSPACE_STATUSES = ["Active", "Paused", "Archived"] as const;

export type IssueStatus = (typeof ISSUE_STATUSES)[number];
export type IssuePriority = (typeof ISSUE_PRIORITIES)[number];
export type ProjectType = (typeof PROJECT_TYPES)[number];
export type WorkspacePlan = (typeof WORKSPACE_PLANS)[number];
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];
export type WorkspaceStatus = (typeof WORKSPACE_STATUSES)[number];

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: WorkspacePlan;
  status: WorkspaceStatus;
  memberCount: number;
  lead: string | null;
  summary: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  apiId: string;
  workspaceId: string;
  name: string;
  type: ProjectType;
  keyPrefix: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  lead: string | null;
  summary: string;
  description: string;
  startDate: string | null;
  targetDate: string | null;
  label: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Assignee {
  id: string;
  name: string;
  avatarUrl?: string;
}

export interface Issue {
  id: string;
  key: string;
  projectId: string;
  parentIssueId: string | null;
  title: string;
  description: string;
  status: IssueStatus;
  isBacklog: boolean;
  priority: IssuePriority;
  assigneeId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface IssueDraft {
  title: string;
  description: string;
  status: IssueStatus;
  isBacklog: boolean;
  priority: IssuePriority;
  assigneeId: string | null;
  parentIssueId: string | null;
}

export interface IssueComment {
  id: string;
  issueId: string;
  authorId: string;
  body: string;
  createdAt: string;
}
