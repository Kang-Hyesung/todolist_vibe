import type { Issue } from "../types/domain";

export const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? "";
export const apiEnabled = apiBaseUrl.length > 0;

interface ApiIssue {
  id: string;
  key: string;
  projectId: string;
  parentIssueId?: string | null;
  title: string;
  description: string;
  status: "Todo" | "InProgress" | "Done" | "Cancel";
  priority: "Low" | "Medium" | "High";
  assigneeId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface CreateIssuePayload {
  projectId: string;
  parentIssueId?: string | null;
  title: string;
  description: string;
  status: "Todo" | "InProgress" | "Done" | "Cancel";
  priority: "Low" | "Medium" | "High";
  assigneeId: string | null;
  order?: number;
}

interface UpdateIssuePayload {
  parentIssueId?: string | null;
  title: string;
  description: string;
  status: "Todo" | "InProgress" | "Done" | "Cancel";
  priority: "Low" | "Medium" | "High";
  assigneeId: string | null;
}

function toIssue(apiIssue: ApiIssue, localProjectId: string): Issue {
  return {
    id: apiIssue.id,
    key: apiIssue.key,
    projectId: localProjectId,
    parentIssueId: apiIssue.parentIssueId ?? null,
    title: apiIssue.title,
    description: apiIssue.description,
    status: apiIssue.status,
    isBacklog: apiIssue.status === "Todo",
    priority: apiIssue.priority,
    assigneeId: apiIssue.assigneeId,
    order: apiIssue.order,
    createdAt: apiIssue.createdAt,
    updatedAt: apiIssue.updatedAt,
  };
}

export async function fetchIssuesFromApi(apiProjectId: string, localProjectId: string): Promise<Issue[]> {
  const response = await fetch(
    `${apiBaseUrl}/issues?projectId=${encodeURIComponent(apiProjectId)}`,
    { method: "GET" },
  );

  if (!response.ok) {
    throw new Error(`Issue list request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ApiIssue[];
  return payload.map((item) => toIssue(item, localProjectId));
}

export async function createIssueInApi(
  payload: CreateIssuePayload,
  localProjectId: string,
): Promise<Issue> {
  const response = await fetch(`${apiBaseUrl}/issues`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Issue create request failed with status ${response.status}`);
  }

  const result = (await response.json()) as ApiIssue;
  return toIssue(result, localProjectId);
}

export async function updateIssueInApi(
  issueId: string,
  payload: UpdateIssuePayload,
  localProjectId: string,
): Promise<Issue> {
  const response = await fetch(`${apiBaseUrl}/issues/${encodeURIComponent(issueId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Issue update request failed with status ${response.status}`);
  }

  const result = (await response.json()) as ApiIssue;
  return toIssue(result, localProjectId);
}

export async function reorderIssuesInApi(
  apiProjectId: string,
  orderedIssueIds: string[],
  localProjectId: string,
): Promise<Issue[]> {
  const response = await fetch(`${apiBaseUrl}/issues/reorder`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: apiProjectId,
      issueIds: orderedIssueIds,
    }),
  });

  if (!response.ok) {
    throw new Error(`Issue reorder request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as ApiIssue[];
  return payload.map((item) => toIssue(item, localProjectId));
}

export async function deleteIssueInApi(issueId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/issues/${encodeURIComponent(issueId)}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Issue delete request failed with status ${response.status}`);
  }
}
