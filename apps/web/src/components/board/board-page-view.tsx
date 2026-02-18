import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { TooltipProvider } from "../ui/tooltip";

interface BoardToast {
  kind: "success" | "error";
  text: string;
}

interface BoardPageViewProps {
  activeProjectKeyPrefix: string;
  activeProjectName: string;
  apiEnabled: boolean;
  apiSyncing: boolean;
  canToggleExpandCollapse: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  sheet: ReactNode;
  toast: BoardToast | null;
  children: ReactNode;
}

export function BoardPageView({
  activeProjectKeyPrefix,
  activeProjectName,
  apiEnabled,
  apiSyncing,
  canToggleExpandCollapse,
  onExpandAll,
  onCollapseAll,
  sheet,
  toast,
  children,
}: BoardPageViewProps) {
  return (
    <TooltipProvider>
      <div className="min-h-0 text-[hsl(var(--text-main))]">
        <main className="min-w-0 overflow-hidden rounded-xl border border-border-subtle bg-surface-0 dark:border-border-subtle dark:bg-surface-0">
          <div className="flex h-11 items-center justify-between gap-2 border-b border-border-subtle bg-surface-1/80 px-2.5 dark:border-border-subtle dark:bg-surface-1/90">
            <div className="flex min-w-0 items-center gap-2 overflow-hidden">
              <Badge
                variant="default"
                className="h-6 shrink-0 border-border-subtle bg-surface-0 px-2 text-[10px] font-semibold text-ink-muted dark:border-border-subtle dark:bg-surface-0 dark:text-ink-muted"
              >
                {activeProjectKeyPrefix}
              </Badge>
              <p className="truncate text-xs font-semibold text-[hsl(var(--text-main))]">
                {activeProjectName}
              </p>
              <span
                className={cn(
                  "hidden h-5 items-center rounded border px-1.5 text-[10px] font-medium md:inline-flex",
                  apiEnabled
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/35 dark:text-emerald-300"
                    : "border-border-subtle bg-surface-1 text-ink-muted dark:border-border-subtle dark:bg-surface-1 dark:text-ink-muted",
                )}
              >
                {apiEnabled ? (apiSyncing ? "API Syncing" : "API Connected") : "Mock Data"}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={onExpandAll}
                disabled={!canToggleExpandCollapse}
              >
                전체 펼침
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-[11px]"
                onClick={onCollapseAll}
                disabled={!canToggleExpandCollapse}
              >
                전체 접기
              </Button>
            </div>
          </div>

          {children}
        </main>

        {sheet}

        {toast ? (
          <div
            className={cn(
              "fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-md border px-4 py-2 text-sm shadow-lg",
              toast.kind === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {toast.kind === "success" ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {toast.text}
          </div>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
