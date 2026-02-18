import { useMemo, useState } from "react";
import type { Assignee, Issue, IssueComment, IssuePriority, IssueStatus } from "../../types/domain";
import { cn } from "../../lib/utils";
import { formatIssuePriorityLabel } from "./issue-labels";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface IssueDetailRightPanelProps {
  selectedIssue: Issue | null;
  selectedParentIssue: Issue | null;
  activeProjectName: string;
  selectedComments: IssueComment[];
  selectedActivityEntries: Array<{
    id: string;
    message: string;
    actorName: string;
    createdAt: string;
  }>;
  commentDraft: string;
  onCommentDraftChange: (value: string) => void;
  onAddComment: () => void;
  currentUserName: string;
  assigneeMap: Map<string, Assignee>;
  formatStatusLabel: (status: IssueStatus) => string;
  formatDateTime: (timestamp: string) => string;
  formatRelativeTime: (timestamp: string) => string;
  formatActivityDayLabel: (timestamp: string) => string;
  isSameCalendarDay: (a: string | Date, b: string | Date) => boolean;
  priorityBadgeVariant: (priority: IssuePriority) => "low" | "medium" | "high";
}

type RightPanelTab = "overview" | "activity";
type ActivityFilter = "all" | "changes" | "comments";

interface TimelineItem {
  id: string;
  kind: "change" | "comment";
  actorName: string;
  createdAt: string;
  message: string;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function IssueDetailRightPanel({
  selectedIssue,
  selectedParentIssue,
  activeProjectName,
  selectedComments,
  selectedActivityEntries,
  commentDraft,
  onCommentDraftChange,
  onAddComment,
  currentUserName,
  assigneeMap,
  formatStatusLabel,
  formatDateTime,
  formatRelativeTime,
  formatActivityDayLabel,
  isSameCalendarDay,
  priorityBadgeVariant,
}: IssueDetailRightPanelProps) {
  const [tab, setTab] = useState<RightPanelTab>("overview");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const effectiveTab: RightPanelTab = selectedIssue ? tab : "overview";
  const timelineItems = useMemo<TimelineItem[]>(
    () =>
      [...selectedActivityEntries.map((entry) => ({
        id: `change-${entry.id}`,
        kind: "change" as const,
        actorName: entry.actorName,
        createdAt: entry.createdAt,
        message: entry.message,
      })), ...selectedComments.map((comment) => ({
        id: `comment-${comment.id}`,
        kind: "comment" as const,
        actorName: assigneeMap.get(comment.authorId)?.name ?? "사용자",
        createdAt: comment.createdAt,
        message: comment.body,
      }))]
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [assigneeMap, selectedActivityEntries, selectedComments],
  );
  const filteredTimelineItems = useMemo(
    () =>
      timelineItems.filter((item) => {
        if (activityFilter === "all") {
          return true;
        }
        if (activityFilter === "changes") {
          return item.kind === "change";
        }
        return item.kind === "comment";
      }),
    [activityFilter, timelineItems],
  );

  return (
    <aside className="min-h-0 overflow-y-auto border-t border-border-subtle bg-surface-1/70 px-3.5 py-3 dark:border-border-subtle dark:bg-surface-1/80 sm:px-4 sm:py-4 lg:border-l lg:border-t-0">
      <div className="space-y-4">
        <div className="rounded-lg border border-border-subtle bg-surface-0 p-1 dark:border-border-subtle dark:bg-surface-0">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              className={cn(
                "h-7 rounded-md text-[11px] font-medium transition",
                effectiveTab === "overview"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-ink-muted hover:bg-surface-1 dark:text-ink-muted dark:hover:bg-surface-1",
              )}
              onClick={() => setTab("overview")}
            >
              요약
            </button>
            <button
              type="button"
              className={cn(
                "h-7 rounded-md text-[11px] font-medium transition",
                effectiveTab === "activity"
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                  : "text-ink-muted hover:bg-surface-1 dark:text-ink-muted dark:hover:bg-surface-1",
              )}
              onClick={() => setTab("activity")}
            >
              활동
            </button>
          </div>
        </div>

        {effectiveTab === "overview" ? (
          <div className="rounded-lg border border-border-subtle bg-surface-0 p-3.5 dark:border-border-subtle dark:bg-surface-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">이슈 정보</p>
              {selectedIssue ? (
                <Badge variant={priorityBadgeVariant(selectedIssue.priority)}>
                  {formatIssuePriorityLabel(selectedIssue.priority)}
                </Badge>
              ) : null}
            </div>

            {selectedIssue ? (
              <div className="mt-3 space-y-3">
                <div className="rounded-lg border border-border-subtle bg-surface-1/80 p-3 dark:border-border-subtle dark:bg-surface-1/80">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-[hsl(var(--text-main))]">{selectedIssue.key}</p>
                    <span className="text-[10px] text-ink-muted">{formatRelativeTime(selectedIssue.updatedAt)}</span>
                  </div>
                  <p className="mt-1 text-[13px] text-ink-muted">{selectedIssue.title}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md border border-border-subtle bg-surface-0 px-2.5 py-2 dark:border-border-subtle dark:bg-surface-0">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-ink-soft">상태</p>
                    <p className="mt-1 text-[11px] font-medium text-[hsl(var(--text-main))]">
                      {formatStatusLabel(selectedIssue.status)}
                    </p>
                  </div>
                  <div className="rounded-md border border-border-subtle bg-surface-0 px-2.5 py-2 dark:border-border-subtle dark:bg-surface-0">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-ink-soft">담당자</p>
                    <p className="mt-1 text-[11px] font-medium text-[hsl(var(--text-main))]">
                      {assigneeMap.get(selectedIssue.assigneeId ?? "")?.name ?? "미할당"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-lg border border-border-subtle bg-surface-0 px-3 py-2.5 text-[11px] dark:border-border-subtle dark:bg-surface-0">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>프로젝트</span>
                    <span className="font-medium text-[hsl(var(--text-main))]">{activeProjectName}</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>상위 이슈</span>
                    <span className="max-w-[190px] truncate font-medium text-[hsl(var(--text-main))]">
                      {selectedParentIssue ? `${selectedParentIssue.key} ${selectedParentIssue.title}` : "루트 이슈"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>생성일</span>
                    <span className="font-medium text-[hsl(var(--text-main))]">
                      {formatDateTime(selectedIssue.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>수정일</span>
                    <span className="font-medium text-[hsl(var(--text-main))]">
                      {formatDateTime(selectedIssue.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-3 rounded-md border border-dashed border-border-subtle px-3 py-2 text-[11px] text-ink-muted dark:border-border-subtle">
                이슈를 생성하거나 선택하면 메타데이터가 표시됩니다.
              </p>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-border-subtle bg-surface-0 p-3.5 dark:border-border-subtle dark:bg-surface-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">활동</p>
              <Badge variant="default">{timelineItems.length}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className={cn(
                  "inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-semibold transition",
                  activityFilter === "all"
                    ? "border-slate-300 bg-slate-900 text-white dark:border-slate-500 dark:bg-slate-100 dark:text-slate-900"
                    : "border-border-subtle bg-surface-0 text-ink-muted hover:bg-surface-1 dark:border-border-subtle dark:bg-surface-0 dark:text-ink-muted dark:hover:bg-surface-1",
                )}
                onClick={() => setActivityFilter("all")}
              >
                전체 {timelineItems.length}
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-semibold transition",
                  activityFilter === "changes"
                    ? "border-slate-300 bg-slate-900 text-white dark:border-slate-500 dark:bg-slate-100 dark:text-slate-900"
                    : "border-border-subtle bg-surface-0 text-ink-muted hover:bg-surface-1 dark:border-border-subtle dark:bg-surface-0 dark:text-ink-muted dark:hover:bg-surface-1",
                )}
                onClick={() => setActivityFilter("changes")}
              >
                변경 {selectedActivityEntries.length}
              </button>
              <button
                type="button"
                className={cn(
                  "inline-flex h-6 items-center rounded-full border px-2.5 text-[10px] font-semibold transition",
                  activityFilter === "comments"
                    ? "border-slate-300 bg-slate-900 text-white dark:border-slate-500 dark:bg-slate-100 dark:text-slate-900"
                    : "border-border-subtle bg-surface-0 text-ink-muted hover:bg-surface-1 dark:border-border-subtle dark:bg-surface-0 dark:text-ink-muted dark:hover:bg-surface-1",
                )}
                onClick={() => setActivityFilter("comments")}
              >
                댓글 {selectedComments.length}
              </button>
            </div>

            <div className="mt-3 rounded-lg border border-border-subtle bg-surface-1/80 p-3 dark:border-border-subtle dark:bg-surface-1/70">
              <div className="mb-2 flex items-center justify-between text-[11px]">
                <span className="text-ink-muted">작성자</span>
                <span className="font-medium text-[hsl(var(--text-main))]">{currentUserName}</span>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={commentDraft}
                  onChange={(event) => onCommentDraftChange(event.target.value)}
                  placeholder={selectedIssue ? "댓글 작성" : "이슈 생성 후 작성 가능"}
                  disabled={!selectedIssue}
                  className="min-h-[84px] resize-none"
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      onAddComment();
                    }
                  }}
                />
                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-ink-muted">Enter 등록, Shift+Enter 줄바꿈</p>
                  <Button
                    className="h-7 text-[11px]"
                    size="sm"
                    onClick={onAddComment}
                    disabled={!selectedIssue || commentDraft.trim().length === 0}
                  >
                    등록
                  </Button>
                </div>
              </div>
            </div>

            {!selectedIssue ? (
              <p className="mt-3 rounded border border-dashed border-border-subtle px-3 py-2 text-[11px] text-ink-muted dark:border-border-subtle">
                이슈 생성 후 활동 내역을 확인할 수 있습니다.
              </p>
            ) : filteredTimelineItems.length === 0 ? (
              <p className="mt-3 rounded border border-dashed border-border-subtle px-3 py-2 text-[11px] text-ink-muted dark:border-border-subtle">
                선택한 필터에 해당하는 활동이 없습니다.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {filteredTimelineItems.map((item, index) => {
                  const previous = index > 0 ? filteredTimelineItems[index - 1] : null;
                  const showDateLabel =
                    previous === null || !isSameCalendarDay(previous.createdAt, item.createdAt);
                  return (
                    <div key={item.id} className="space-y-2">
                        {showDateLabel ? (
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                              {formatActivityDayLabel(item.createdAt)}
                            </span>
                            <span className="h-px flex-1 bg-border-subtle dark:bg-border-subtle" />
                          </div>
                        ) : null}
                        <div className="rounded-lg border border-border-subtle bg-surface-0 px-3 py-2.5 dark:border-border-subtle dark:bg-surface-0">
                          <div className="flex items-start gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback>{initials(item.actorName)}</AvatarFallback>
                          </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 text-[10px] text-ink-muted">
                                <span className="truncate font-medium text-[hsl(var(--text-main))]">
                                  {item.actorName}
                                </span>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em]",
                                    item.kind === "change"
                                      ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-200"
                                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
                                  )}
                                >
                                  {item.kind === "change" ? "변경" : "댓글"}
                                </span>
                                <span>{formatRelativeTime(item.createdAt)}</span>
                              </div>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap text-[12px] leading-5 text-[hsl(var(--text-main))]">
                              {item.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
