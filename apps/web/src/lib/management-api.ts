import { apiBaseUrl } from "./api";
import type {
  Project,
  ProjectPriority,
  ProjectStatus,
  ProjectType,
  Workspace,
  WorkspacePlan,
  WorkspaceStatus,
} from "../types/domain";

export interface WorkspaceMutationPayload {
  name: string;
  plan: WorkspacePlan;
  status: WorkspaceStatus;
  memberCount: number;
  lead: string | null;
  summary: string;
  description: string;
}

export interface ProjectMutationPayload {
  name: string;
  workspaceId: string;
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
}

interface ApiWorkspace {
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

interface ApiProject {
  id: string;
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

function toWorkspace(payload: ApiWorkspace): Workspace {
  return {
    id: payload.id,
    name: payload.name,
    slug: payload.slug,
    plan: payload.plan,
    status: payload.status,
    memberCount: payload.memberCount,
    lead: payload.lead,
    summary: payload.summary,
    description: payload.description,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

function toProject(payload: ApiProject): Project {
  return {
    id: payload.id,
    apiId: payload.id,
    workspaceId: payload.workspaceId,
    name: payload.name,
    type: payload.type,
    keyPrefix: payload.keyPrefix,
    status: payload.status,
    priority: payload.priority,
    lead: payload.lead,
    summary: payload.summary,
    description: payload.description,
    startDate: payload.startDate,
    targetDate: payload.targetDate,
    label: payload.label,
    createdAt: payload.createdAt,
    updatedAt: payload.updatedAt,
  };
}

export async function fetchWorkspacesFromApi(): Promise<Workspace[]> {
  const response = await fetch(`${apiBaseUrl}/workspaces`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Workspace list request failed with status ${response.status}`);
  }
  const payload = (await response.json()) as ApiWorkspace[];
  return payload.map(toWorkspace);
}

export async function createWorkspaceInApi(payload: WorkspaceMutationPayload): Promise<Workspace> {
  const response = await fetch(`${apiBaseUrl}/workspaces`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Workspace create request failed with status ${response.status}`);
  }
  return toWorkspace((await response.json()) as ApiWorkspace);
}

export async function updateWorkspaceInApi(
  workspaceId: string,
  payload: WorkspaceMutationPayload,
): Promise<Workspace> {
  const response = await fetch(`${apiBaseUrl}/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Workspace update request failed with status ${response.status}`);
  }
  return toWorkspace((await response.json()) as ApiWorkspace);
}

export async function deleteWorkspaceInApi(workspaceId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/workspaces/${encodeURIComponent(workspaceId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Workspace delete request failed with status ${response.status}`);
  }
}

export async function fetchProjectsFromApi(workspaceId?: string): Promise<Project[]> {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : "";
  const response = await fetch(`${apiBaseUrl}/projects${query}`, { method: "GET" });
  if (!response.ok) {
    throw new Error(`Project list request failed with status ${response.status}`);
  }
  const payload = (await response.json()) as ApiProject[];
  return payload.map(toProject);
}

export async function createProjectInApi(payload: ProjectMutationPayload): Promise<Project> {
  const response = await fetch(`${apiBaseUrl}/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Project create request failed with status ${response.status}`);
  }
  return toProject((await response.json()) as ApiProject);
}

export async function updateProjectInApi(
  projectId: string,
  payload: ProjectMutationPayload,
): Promise<Project> {
  const response = await fetch(`${apiBaseUrl}/projects/${encodeURIComponent(projectId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Project update request failed with status ${response.status}`);
  }
  return toProject((await response.json()) as ApiProject);
}

export async function deleteProjectInApi(projectId: string): Promise<void> {
  const response = await fetch(`${apiBaseUrl}/projects/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Project delete request failed with status ${response.status}`);
  }
}
