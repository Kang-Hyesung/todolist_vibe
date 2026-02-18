import type { IssuePriority, IssueStatus } from "../../types/domain";

export type FilterStatus = "All" | IssueStatus;

export function formatIssueStatusLabel(status: IssueStatus) {
  if (status === "InProgress") {
    return "진행 중";
  }
  if (status === "Done") {
    return "완료";
  }
  if (status === "Cancel") {
    return "취소";
  }
  return "할 일";
}

export function formatIssuePriorityLabel(priority: IssuePriority) {
  if (priority === "High") {
    return "높음";
  }
  if (priority === "Medium") {
    return "보통";
  }
  return "낮음";
}

export function formatIssueFilterStatusLabel(status: FilterStatus) {
  if (status === "All") {
    return "전체";
  }
  return formatIssueStatusLabel(status);
}
