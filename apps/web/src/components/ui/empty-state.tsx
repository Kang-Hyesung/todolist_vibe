import type { LucideIcon } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={
        compact
          ? "rounded-xl border border-dashed border-border-strong bg-surface-0/80 px-4 py-6 text-center dark:border-border-strong dark:bg-surface-0/70"
          : "border-t border-border-subtle px-4 py-12 text-center dark:border-border-subtle"
      }
    >
      <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-1 text-ink-muted dark:bg-surface-1 dark:text-ink-muted">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      <p className="mt-1 text-xs text-ink-muted">{description}</p>
      {actionLabel && onAction ? (
        <Button className="mt-4 h-8 px-3 text-xs" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
