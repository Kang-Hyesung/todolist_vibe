import { CalendarDays, CircleDot, PanelRightOpen, UserRound } from "lucide-react";
import type { Issue } from "../../types/domain";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { cn } from "../../lib/utils";
import { formatIssuePriorityLabel } from "./issue-labels";
import { issueStatusToneClass } from "./issue-appearance";

interface IssueInspectorPanelProps {
  issue: Issue | null;
  assigneeName: string;
  onOpenDetail: () => void;
  formatStatusLabel: (status: Issue["status"]) => string;
  formatDateTime: (timestamp: string) => string;
}

export function IssueInspectorPanel({
  issue,
  assigneeName,
  onOpenDetail,
  formatStatusLabel,
  formatDateTime,
}: IssueInspectorPanelProps) {
  return (
    <aside className="hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900 xl:flex xl:flex-col xl:sticky xl:top-4 xl:h-[calc(100vh-32px)] xl:overflow-y-auto">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">이슈 인스펙터</p>
        <span className="inline-flex items-center rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          오른쪽 패널
        </span>
      </div>

      {issue ? (
        <div className="mt-3 space-y-3">
          <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">{issue.key}</p>
                <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-900 dark:text-slate-100">
                  {issue.title}
                </h3>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                  issueStatusToneClass(issue.status),
                )}
              >
                {formatStatusLabel(issue.status)}
              </span>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-2">
            <article className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">우선순위</p>
              <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">
                {formatIssuePriorityLabel(issue.priority)}
              </p>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-[10px] uppercase tracking-[0.1em] text-slate-400">담당자</p>
              <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200">
                <UserRound className="h-3.5 w-3.5" />
                {assigneeName}
              </p>
            </article>
          </section>

          <section className="space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" />
                생성일
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(issue.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-500">
              <span className="inline-flex items-center gap-1">
                <CircleDot className="h-3.5 w-3.5" />
                수정일
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-200">{formatDateTime(issue.updatedAt)}</span>
            </div>
          </section>

          <Button className="h-9 w-full" variant="outline" onClick={onOpenDetail}>
            <PanelRightOpen className="h-4 w-4" />
            상세 패널 열기
          </Button>
        </div>
      ) : (
        <div className="mt-4">
          <EmptyState
            compact
            icon={PanelRightOpen}
            title="이슈를 선택해 주세요."
            description="선택한 이슈의 핵심 요약 정보가 여기에 표시됩니다."
          />
        </div>
      )}
    </aside>
  );
}
