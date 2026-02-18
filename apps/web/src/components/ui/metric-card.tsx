import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface MetricCardProps {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "accent";
  onClick?: () => void;
  active?: boolean;
  compact?: boolean;
}

export function MetricCard({
  label,
  value,
  hint,
  tone = "default",
  onClick,
  active = false,
  compact = false,
}: MetricCardProps) {
  const clickable = typeof onClick === "function";

  return (
    <article
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      className={cn(
        "flex min-h-[112px] flex-col justify-between rounded-xl border p-4 shadow-sm",
        compact ? "min-h-[74px] p-3" : undefined,
        tone === "accent"
          ? "border-blue-200 bg-blue-50/70 dark:border-slate-700 dark:bg-slate-900/70"
          : "border-border-subtle bg-surface-0 dark:border-border-subtle dark:bg-surface-0",
        clickable
          ? "cursor-pointer transition-colors hover:border-blue-300 hover:bg-blue-50/70 dark:hover:border-slate-700 dark:hover:bg-slate-900/80"
          : undefined,
        active ? "ring-1 ring-blue-300 dark:ring-blue-800" : undefined,
      )}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100", compact ? "text-lg" : undefined)}>{value}</p>
      {hint ? <p className="text-xs text-ink-muted">{hint}</p> : <span />}
    </article>
  );
}
