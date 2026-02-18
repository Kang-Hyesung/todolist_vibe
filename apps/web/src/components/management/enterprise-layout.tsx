import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

interface EnterpriseLayoutProps {
  catalog: ReactNode;
  center: ReactNode;
  controls: ReactNode;
}

export function EnterpriseLayout({ catalog, center, controls }: EnterpriseLayoutProps) {
  return (
    <div className="min-h-0 px-1 pb-8 pt-1 sm:px-1">
      <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        {catalog}
        {center}
        {controls}
      </div>
    </div>
  );
}

interface PaneProps {
  children: ReactNode;
  className?: string;
}

export function CatalogPane({ children, className }: PaneProps) {
  return (
    <aside
      className={cn(
        "flex h-[calc(100vh-136px)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-sm dark:border-border-subtle dark:bg-surface-0",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function CommandCenterPane({ children, className }: PaneProps) {
  return (
    <section
      className={cn(
        "h-[calc(100vh-136px)] overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-sm dark:border-border-subtle dark:bg-surface-0",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function ControlsPane({ children, className }: PaneProps) {
  return (
    <aside
      className={cn(
        "h-[calc(100vh-136px)] overflow-y-auto rounded-2xl border border-border-subtle bg-surface-0 p-4 shadow-sm dark:border-border-subtle dark:bg-surface-0",
        className,
      )}
    >
      {children}
    </aside>
  );
}

export function SectionCard({ children, className }: PaneProps) {
  return (
    <article
      className={cn(
        "rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle dark:bg-surface-0",
        className,
      )}
    >
      {children}
    </article>
  );
}
