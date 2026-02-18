import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

interface FilterChip {
  id: string;
  label: string;
  onRemove: () => void;
  tone?: "default" | "accent";
}

interface ManagementFilterBarProps {
  query: string;
  onQueryChange: (value: string) => void;
  queryPlaceholder: string;
  resultCount: number;
  resultLabel: string;
  chips?: FilterChip[];
  rightControl?: ReactNode;
  onClearAll?: () => void;
}

export function ManagementFilterBar({
  query,
  onQueryChange,
  queryPlaceholder,
  resultCount,
  resultLabel,
  chips = [],
  rightControl,
  onClearAll,
}: ManagementFilterBarProps) {
  const hasActiveFilters = chips.length > 0;

  return (
    <div className="border-b border-border-subtle p-4 dark:border-border-subtle">
      <div className={cn("grid gap-2", rightControl ? "sm:grid-cols-[minmax(0,1fr)_220px]" : undefined)}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="h-10 pl-8"
            placeholder={queryPlaceholder}
            aria-label={queryPlaceholder}
          />
        </div>
        {rightControl ? <div>{rightControl}</div> : null}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted">
          {resultLabel} {resultCount.toLocaleString("ko-KR")}개
        </p>
        {hasActiveFilters ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] transition",
                  chip.tone === "accent"
                    ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200"
                    : "border-border-subtle bg-surface-1 text-ink-muted hover:bg-surface-2 dark:border-border-subtle dark:bg-surface-1 dark:text-ink-muted dark:hover:bg-surface-2",
                )}
                onClick={chip.onRemove}
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
            {onClearAll ? (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={onClearAll}>
                필터 초기화
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
