import type { ComponentType } from "react";
import type { Issue, Project } from "../../types/domain";
import type { FilterStatus } from "./issue-labels";

export type VisualMode = "ready" | "loading" | "empty" | "error";
export type CompletionFilter = "all" | "hideDone";
export type BoardScope = "all" | "active" | "backlog";
export type MoveFlashDirection = "toActive" | "toBacklog";
export type TableDensity = "compact" | "default" | "comfortable";

export interface BoardFilters {
  query: string;
  scope: BoardScope;
  status: FilterStatus;
  completion: CompletionFilter;
}

export interface FilterPresetFilters {
  scope: BoardScope;
  status: FilterStatus;
  completion: CompletionFilter;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterPresetFilters;
}

export interface ToastMessage {
  kind: "success" | "error";
  text: string;
}

export interface IssueTableRow {
  issue: Issue;
  depth: number;
  hasChildren: boolean;
  childCount: number;
  isExpanded: boolean;
}

export interface BulkUndoState {
  projectId: string;
  label: string;
  previousIssues: Issue[];
}

export interface IssueActivityEntry {
  id: string;
  issueId: string;
  message: string;
  actorName: string;
  createdAt: string;
}

export interface StatusMetaItem {
  label: string;
  icon: ComponentType<{ className?: string }>;
  activeClass: string;
  idleClass: string;
  iconClass: string;
}

export interface PriorityMetaItem {
  description: string;
  activeClass: string;
  idleClass: string;
  dotClass: string;
}

export interface BoardPageProps {
  projects?: Project[];
  activeProjectId?: string;
  onActiveProjectChange?: (projectId: string) => void;
}
