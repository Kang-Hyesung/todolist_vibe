import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import type { Assignee, Issue, IssueDraft, IssuePriority, IssueStatus } from "../../types/domain";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "../../types/domain";
import { cn } from "../../lib/utils";
import { formatIssuePriorityLabel, formatIssueStatusLabel } from "./issue-labels";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";

interface StatusMetaItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  idleClass: string;
  iconClass: string;
}

interface PriorityMetaItem {
  description: string;
  activeClass: string;
  idleClass: string;
  dotClass: string;
}

interface IssueDetailLeftPanelProps {
  draft: IssueDraft;
  onDraftChange: (updater: (current: IssueDraft) => IssueDraft) => void;
  descriptionEditorMode: "write" | "preview";
  onDescriptionModeChange: (mode: "write" | "preview") => void;
  onInsertDescriptionToken: (prefix: string, suffix?: string, placeholder?: string) => void;
  descriptionInputRef: RefObject<HTMLTextAreaElement | null>;
  descriptionPreviewHtml: string;
  onWorkflowStatusKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
  statusMeta: Record<IssueStatus, StatusMetaItem>;
  priorityMeta: Record<IssuePriority, PriorityMetaItem>;
  onSetDraftStatus: (status: IssueStatus) => void;
  assignees: Assignee[];
  onSetAssignee: (assigneeId: string | null) => void;
  onSetRootParent: () => void;
  onParentIssueSelect: (parentIssueId: string | null) => void;
  parentIssueQuery: string;
  onParentIssueQueryChange: (value: string) => void;
  filteredParentOptions: Issue[];
  selectedIssue: Issue | null;
  selectedSubIssues: Issue[];
  subIssueDraftTitle: string;
  onSubIssueDraftTitleChange: (value: string) => void;
  onCreateSubIssue: () => void;
  subIssueEditingId: string | null;
  subIssueEditingTitle: string;
  onSubIssueEditingTitleChange: (value: string) => void;
  onSaveSubIssueEdit: (subIssue: Issue) => void;
  onStartSubIssueEdit: (subIssue: Issue) => void;
  onCancelSubIssueEdit: () => void;
  onDeleteSubIssue: (subIssue: Issue) => void;
  onSubIssueStatusChange: (subIssue: Issue, status: IssueStatus) => void;
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function IssueDetailLeftPanel({
  draft,
  onDraftChange,
  descriptionEditorMode,
  onDescriptionModeChange,
  onInsertDescriptionToken,
  descriptionInputRef,
  descriptionPreviewHtml,
  onWorkflowStatusKeyDown,
  statusMeta,
  priorityMeta,
  onSetDraftStatus,
  assignees,
  onSetAssignee,
  onSetRootParent,
  onParentIssueSelect,
  parentIssueQuery,
  onParentIssueQueryChange,
  filteredParentOptions,
  selectedIssue,
  selectedSubIssues,
  subIssueDraftTitle,
  onSubIssueDraftTitleChange,
  onCreateSubIssue,
  subIssueEditingId,
  subIssueEditingTitle,
  onSubIssueEditingTitleChange,
  onSaveSubIssueEdit,
  onStartSubIssueEdit,
  onCancelSubIssueEdit,
  onDeleteSubIssue,
  onSubIssueStatusChange,
}: IssueDetailLeftPanelProps) {
  return (
    <section className="min-h-0 overflow-y-auto bg-surface-0 px-4 py-3 dark:bg-surface-0 sm:px-5 sm:py-4">
      <div className="space-y-4">
        <div className="rounded-lg border border-border-subtle bg-surface-0 p-3.5 dark:border-border-subtle dark:bg-surface-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">기본 정보</p>
          <div className="mt-3 space-y-3">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={draft.title}
                onChange={(event) =>
                  onDraftChange((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="이슈 제목 입력"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">설명</Label>
                <div className="inline-flex rounded-md border border-border-subtle bg-surface-1 p-0.5 text-[10px] dark:border-border-subtle dark:bg-surface-1/80">
                  <button
                    type="button"
                    className={cn(
                      "rounded px-2 py-1 font-medium leading-none transition",
                      descriptionEditorMode === "write"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-ink-muted hover:bg-surface-2 dark:text-ink-muted dark:hover:bg-surface-2",
                    )}
                    onClick={() => onDescriptionModeChange("write")}
                  >
                    작성
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded px-2 py-1 font-medium leading-none transition",
                      descriptionEditorMode === "preview"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-ink-muted hover:bg-surface-2 dark:text-ink-muted dark:hover:bg-surface-2",
                    )}
                    onClick={() => onDescriptionModeChange("preview")}
                  >
                    미리보기
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-border-subtle dark:border-border-subtle">
                <div className="flex flex-wrap items-center gap-1 border-b border-border-subtle bg-surface-1/80 px-2 py-1.5 dark:border-border-subtle dark:bg-surface-1/70">
                  <Button className="h-7 px-2 text-[11px]" type="button" size="sm" variant="ghost" onClick={() => onInsertDescriptionToken("## ", "", "제목")}>
                    H2
                  </Button>
                  <Button className="h-7 px-2 text-[11px]" type="button" size="sm" variant="ghost" onClick={() => onInsertDescriptionToken("**", "**", "강조 텍스트")}>
                    강조
                  </Button>
                  <Button className="h-7 px-2 text-[11px]" type="button" size="sm" variant="ghost" onClick={() => onInsertDescriptionToken("*", "*", "기울임 텍스트")}>
                    기울임
                  </Button>
                  <Button className="h-7 px-2 text-[11px]" type="button" size="sm" variant="ghost" onClick={() => onInsertDescriptionToken("- ", "", "목록 항목")}>
                    목록
                  </Button>
                  <Button className="h-7 px-2 text-[11px]" type="button" size="sm" variant="ghost" onClick={() => onInsertDescriptionToken("`", "`", "코드")}>
                    코드
                  </Button>
                  <Button
                    className="h-7 px-2 text-[11px]"
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => onInsertDescriptionToken("[", "](https://)", "link text")}
                  >
                    링크
                  </Button>
                </div>
                {descriptionEditorMode === "write" ? (
                  <Textarea
                    ref={descriptionInputRef}
                    id="description"
                    value={draft.description}
                    onChange={(event) =>
                      onDraftChange((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="마크다운으로 이슈 설명 작성"
                    className="min-h-[190px] rounded-none border-0 focus-visible:ring-0"
                  />
                ) : (
                  <div
                    className="min-h-[190px] bg-surface-0 px-3 py-2 dark:bg-surface-0"
                    dangerouslySetInnerHTML={{ __html: descriptionPreviewHtml }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border-subtle bg-surface-0 p-3.5 dark:border-border-subtle dark:bg-surface-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">워크플로우</p>
          <div className="mt-3 space-y-4">
            <div className="space-y-2">
              <Label>상태</Label>
              <div className="rounded-lg border border-border-subtle bg-surface-1/70 p-1 dark:border-border-subtle dark:bg-surface-1/70">
                <div
                  role="radiogroup"
                  aria-label="Issue status"
                  className="grid grid-cols-2 gap-1"
                  onKeyDown={onWorkflowStatusKeyDown}
                >
                  {ISSUE_STATUSES.map((status) => {
                    const meta = statusMeta[status];
                    const StatusIcon = meta.icon;
                    const selected = draft.status === status;

                    return (
                      <button
                        key={status}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        tabIndex={selected ? 0 : -1}
                        data-status-option="true"
                        data-status={status}
                      className={cn(
                          "flex h-8 items-center justify-center gap-1.5 rounded-md border px-2 text-center text-[11px] font-medium transition-all duration-150 motion-safe:active:scale-[0.98]",
                          selected ? cn(meta.activeClass, "shadow-sm") : meta.idleClass,
                        )}
                        onClick={() => onSetDraftStatus(status)}
                      >
                        <StatusIcon className={cn("h-4 w-4", meta.iconClass)} />
                        <span>{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[11px] text-ink-muted">
                현재 상태: <span className="font-medium text-[hsl(var(--text-main))]">{formatIssueStatusLabel(draft.status)}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label>우선순위</Label>
              <div className="grid grid-cols-3 gap-2">
                {ISSUE_PRIORITIES.map((priority) => {
                  const meta = priorityMeta[priority];
                  const selected = draft.priority === priority;

                  return (
                    <button
                      key={priority}
                      type="button"
                      className={cn(
                        "rounded-md border px-2.5 py-2 text-left text-xs transition-all duration-150 motion-safe:active:scale-[0.98]",
                        selected ? cn(meta.activeClass, "shadow-sm") : meta.idleClass,
                      )}
                      onClick={() =>
                        onDraftChange((current) => ({
                          ...current,
                          priority,
                        }))
                      }
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", meta.dotClass)} />
                        <span className="font-medium">{formatIssuePriorityLabel(priority)}</span>
                      </div>
                      <p className="mt-1 text-[10px] opacity-80">{meta.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>담당자</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(
                    "inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs transition",
                    draft.assigneeId === null
                      ? "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900",
                  )}
                  onClick={() => onSetAssignee(null)}
                >
                  미할당
                </button>
                {assignees.map((assignee) => {
                  const selected = draft.assigneeId === assignee.id;
                  return (
                    <button
                      key={assignee.id}
                      type="button"
                      className={cn(
                        "inline-flex h-8 items-center gap-2 rounded-md border px-2.5 text-xs transition",
                        selected
                          ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900",
                      )}
                      onClick={() => onSetAssignee(assignee.id)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{initials(assignee.name)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{assignee.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>상위 이슈</Label>
                <Button className="h-7 text-[11px]" type="button" size="sm" variant="ghost" onClick={onSetRootParent}>
                  루트로 설정
                </Button>
              </div>
              <Select
                value={draft.parentIssueId ?? "root"}
                onValueChange={(value) => onParentIssueSelect(value === "root" ? null : value)}
              >
                <Input
                  value={parentIssueQuery}
                  onChange={(event) => onParentIssueQueryChange(event.target.value)}
                  placeholder="키 또는 제목 검색"
                  className="mb-2 h-8 text-xs"
                />
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="root">상위 없음 (루트 이슈)</SelectItem>
                  {filteredParentOptions.map((issue) => (
                    <SelectItem key={issue.id} value={issue.id}>
                      {issue.key} - {issue.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {parentIssueQuery.trim().length > 0 && filteredParentOptions.length === 0 ? (
                <p className="text-[11px] text-ink-muted">일치하는 상위 이슈가 없습니다.</p>
              ) : null}
              <p className="text-[10px] text-ink-muted">
                상위 이슈를 지정하면 계층 구조로 배치됩니다.
              </p>
            </div>
          </div>
        </div>

        {selectedIssue ? (
          <div className="rounded-lg border border-border-subtle bg-surface-0 p-3.5 dark:border-border-subtle dark:bg-surface-0">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">하위 이슈</p>
              <Badge variant="default">{selectedSubIssues.length}</Badge>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                className="h-8 text-xs"
                placeholder="하위 이슈 제목 추가"
                value={subIssueDraftTitle}
                onChange={(event) => onSubIssueDraftTitleChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onCreateSubIssue();
                  }
                }}
              />
              <Button className="h-8 text-xs" size="sm" onClick={onCreateSubIssue}>
                추가
              </Button>
            </div>

            {selectedSubIssues.length === 0 ? (
              <p className="mt-3 rounded border border-dashed border-border-subtle px-3 py-2 text-xs text-ink-muted dark:border-border-subtle">
                하위 이슈가 없습니다.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {selectedSubIssues.map((subIssue) => (
                  <div
                    key={subIssue.id}
                    className="rounded-lg border border-border-subtle bg-surface-1/60 p-2.5 dark:border-border-subtle dark:bg-surface-1/70"
                  >
                    <div className="flex items-start gap-2">
                      {subIssueEditingId === subIssue.id ? (
                        <Input
                          className="h-8 text-xs"
                          value={subIssueEditingTitle}
                          onChange={(event) => onSubIssueEditingTitleChange(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              onSaveSubIssueEdit(subIssue);
                            }
                          }}
                        />
                      ) : (
                          <p className="flex-1 text-sm font-medium text-[hsl(var(--text-main))]">
                            {subIssue.title}
                          </p>
                      )}

                      <Select
                        value={subIssue.status}
                        onValueChange={(value) => onSubIssueStatusChange(subIssue, value as IssueStatus)}
                      >
                        <SelectTrigger className="h-8 w-[136px] bg-white text-xs dark:bg-slate-950">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ISSUE_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {formatIssueStatusLabel(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-ink-muted">
                      <span>{subIssue.key}</span>
                      <div className="flex items-center gap-1.5">
                        {subIssueEditingId === subIssue.id ? (
                          <>
                            <Button className="h-7 text-[11px]" size="sm" variant="outline" onClick={() => onSaveSubIssueEdit(subIssue)}>
                              저장
                            </Button>
                            <Button className="h-7 text-[11px]" size="sm" variant="ghost" onClick={onCancelSubIssueEdit}>
                              취소
                            </Button>
                          </>
                        ) : (
                          <Button className="h-7 text-[11px]" size="sm" variant="ghost" onClick={() => onStartSubIssueEdit(subIssue)}>
                            수정
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[11px] text-red-600 hover:text-red-700"
                          onClick={() => onDeleteSubIssue(subIssue)}
                        >
                          삭제
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border-subtle px-4 py-4 text-xs text-ink-muted dark:border-border-subtle">
            이슈를 먼저 저장하면 하위 이슈 관리와 댓글 활동을 사용할 수 있습니다.
          </div>
        )}
      </div>
    </section>
  );
}
