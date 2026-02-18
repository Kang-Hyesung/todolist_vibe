import { CheckCircle2, Plus, Search } from "lucide-react";
import { ISSUE_STATUSES } from "../../types/domain";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { formatIssueFilterStatusLabel, type FilterStatus } from "./issue-labels";
import type { TableDensity } from "./board-page.types";

type VisualMode = "ready" | "loading" | "empty" | "error";

interface IssueToolbarProps {
  showDevStateToggles: boolean;
  onVisualModeChange: (mode: VisualMode) => void;
  onCreateIssue: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (value: FilterStatus) => void;
  hideCompleted: boolean;
  onHideCompletedChange: (hide: boolean) => void;
  completedIssueCount: number;
  visibleIssueCount: number;
  totalIssueCount: number;
  filterPresetOptions: Array<{ id: string; name: string; summary: string }>;
  selectedFilterPresetId: string;
  selectedFilterPresetSummary: string | null;
  onFilterPresetChange: (presetId: string) => void;
  onSaveFilterPreset: () => void;
  onDeleteFilterPreset: () => void;
  tableDensity: TableDensity;
  onTableDensityChange: (density: TableDensity) => void;
}

export function IssueToolbar({
  showDevStateToggles,
  onVisualModeChange,
  onCreateIssue,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  hideCompleted,
  onHideCompletedChange,
  completedIssueCount,
  visibleIssueCount,
  totalIssueCount,
  filterPresetOptions,
  selectedFilterPresetId,
  selectedFilterPresetSummary,
  onFilterPresetChange,
  onSaveFilterPreset,
  onDeleteFilterPreset,
  tableDensity,
  onTableDensityChange,
}: IssueToolbarProps) {
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== "All" || hideCompleted;

  const clearAllFilters = () => {
    onQueryChange("");
    onStatusFilterChange("All");
    onHideCompletedChange(false);
  };

  return (
    <div className="border-b border-border-subtle bg-surface-1/70 px-2.5 py-2 dark:border-border-subtle dark:bg-surface-1/80">
      <div className="flex flex-wrap items-center gap-1.5 xl:flex-nowrap">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input
            className="h-8 border-border-subtle bg-surface-0 pl-8 text-sm text-[hsl(var(--text-main))] placeholder:text-ink-soft"
            aria-label="이슈 제목 검색"
            placeholder="이슈 제목 검색"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>

        <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as FilterStatus)}>
          <SelectTrigger className="h-8 w-[128px] shrink-0 whitespace-nowrap border-border-subtle bg-surface-0 text-xs text-[hsl(var(--text-main))]">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">전체</SelectItem>
            {ISSUE_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {formatIssueFilterStatusLabel(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={tableDensity} onValueChange={(value) => onTableDensityChange(value as TableDensity)}>
          <SelectTrigger className="h-8 w-[124px] shrink-0 whitespace-nowrap border-border-subtle bg-surface-0 text-xs text-[hsl(var(--text-main))]">
            <SelectValue placeholder="밀도" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="compact">촘촘</SelectItem>
            <SelectItem value="default">기본</SelectItem>
            <SelectItem value="comfortable">여유</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex h-8 shrink-0 items-center gap-2 rounded-md border border-border-subtle bg-surface-0 px-2 text-xs dark:border-border-subtle dark:bg-surface-0">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink-muted dark:text-ink-muted">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>완료</span>
            <span className="inline-flex min-w-6 items-center justify-center rounded-full border border-border-subtle bg-surface-1 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-ink-muted dark:border-border-subtle dark:bg-surface-1 dark:text-ink-muted">
              {completedIssueCount}
            </span>
          </span>
          <button
            type="button"
            aria-pressed={hideCompleted}
            aria-label={hideCompleted ? "완료 이슈 숨김 해제" : "완료 이슈 숨김 활성화"}
            className={cn(
              "ml-auto inline-flex h-6 min-w-[100px] shrink-0 items-center justify-between gap-1 whitespace-nowrap rounded-md border px-2 text-[10px] font-semibold transition",
              hideCompleted
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border-border-subtle bg-surface-1 text-ink-muted hover:bg-surface-2 dark:border-border-subtle dark:bg-surface-1 dark:text-ink-muted dark:hover:bg-surface-2",
            )}
            onClick={() => onHideCompletedChange(!hideCompleted)}
          >
            <span className="whitespace-nowrap">숨김</span>
            <span className="rounded-sm bg-black/5 px-1 py-0.5 text-[10px] font-semibold leading-none dark:bg-white/10">
              {hideCompleted ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <p className="hidden text-xs text-ink-muted dark:text-ink-muted sm:block">
            결과 {visibleIssueCount.toLocaleString("ko-KR")} / 전체 {totalIssueCount.toLocaleString("ko-KR")}
          </p>

          <Button
            size="sm"
            variant="ghost"
            className={cn(
              "h-8 w-[88px] text-xs",
              hasActiveFilters ? "opacity-100" : "pointer-events-none opacity-0",
            )}
            onClick={clearAllFilters}
            disabled={!hasActiveFilters}
            aria-hidden={!hasActiveFilters}
            tabIndex={hasActiveFilters ? 0 : -1}
          >
            필터 초기화
          </Button>

          {showDevStateToggles ? (
            <div className="hidden items-center gap-1 2xl:flex">
              <Button variant="ghost" size="sm" onClick={() => onVisualModeChange("ready")}>
                기본
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onVisualModeChange("loading")}>
                로딩
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onVisualModeChange("empty")}>
                비어 있음
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onVisualModeChange("error")}>
                오류
              </Button>
            </div>
          ) : null}

          <Button className="h-8" onClick={onCreateIssue}>
            <Plus className="h-4 w-4" />
            이슈 생성
          </Button>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-border-subtle/80 pt-2 dark:border-border-subtle/80">
        <span className="inline-flex h-7 items-center rounded-md border border-border-subtle bg-surface-0 px-2 text-[10px] font-semibold text-ink-muted dark:border-border-subtle dark:bg-surface-0 dark:text-ink-muted">
          필터 프리셋
        </span>
        <Select value={selectedFilterPresetId} onValueChange={onFilterPresetChange}>
          <SelectTrigger className="h-7 w-[280px] shrink-0 border-border-subtle bg-surface-0 text-xs text-[hsl(var(--text-main))]">
            <SelectValue placeholder="프리셋 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">프리셋 없음</SelectItem>
            {filterPresetOptions.map((preset) => (
              <SelectItem key={preset.id} value={preset.id}>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium">{preset.name}</p>
                  <p className="truncate text-[10px] text-ink-muted">{preset.summary}</p>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onSaveFilterPreset}>
          현재 조건 저장
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          disabled={selectedFilterPresetId === "__none__"}
          onClick={onDeleteFilterPreset}
        >
          선택 삭제
        </Button>
        {selectedFilterPresetSummary ? (
          <p className="min-w-0 truncate text-[10px] text-ink-muted">
            {selectedFilterPresetSummary}
          </p>
        ) : (
          <p className="text-[10px] text-ink-muted">
            프리셋은 범위/상태/완료 숨김 조건만 저장합니다.
          </p>
        )}
      </div>
    </div>
  );
}
