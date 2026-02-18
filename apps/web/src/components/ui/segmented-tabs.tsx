import { cn } from "../../lib/utils";

interface SegmentedTabOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedTabsProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentedTabOption<T>>;
  onChange: (value: T) => void;
  tone?: "neutral" | "violet" | "emerald";
  className?: string;
}

const toneClass = {
  neutral:
    "border-border-subtle bg-surface-1 text-ink-muted hover:bg-surface-2 dark:border-border-subtle dark:bg-surface-1 dark:text-ink-muted dark:hover:bg-surface-2",
  violet:
    "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300",
  emerald:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
} as const;

export function SegmentedTabs<T extends string>({
  value,
  options,
  onChange,
  tone = "neutral",
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex h-7 items-center rounded-md border px-2.5 text-xs transition",
            value === option.value
              ? toneClass[tone]
              : "border-border-subtle bg-surface-0 text-ink-muted hover:bg-surface-1 dark:border-border-subtle dark:bg-surface-0 dark:text-ink-muted dark:hover:bg-surface-1",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
