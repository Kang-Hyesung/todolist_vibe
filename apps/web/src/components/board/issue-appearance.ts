import type { IssuePriority, IssueStatus } from "../../types/domain";

export function issuePriorityBadgeVariant(priority: IssuePriority): "low" | "medium" | "high" {
  if (priority === "High") {
    return "high";
  }
  if (priority === "Medium") {
    return "medium";
  }
  return "low";
}

export function issueStatusToneClass(status: IssueStatus) {
  if (status === "Done") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200";
  }
  if (status === "InProgress") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200";
  }
  if (status === "Cancel") {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200";
  }
  return "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";
}
