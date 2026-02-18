import type { LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

interface ManagementRowActionItem {
  key: string;
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  active?: boolean;
  tone?: "default" | "danger";
  disabled?: boolean;
  title?: string;
}

interface ManagementRowActionsProps {
  actions: ManagementRowActionItem[];
}

export function ManagementRowActions({ actions }: ManagementRowActionsProps) {
  return (
    <div className="inline-flex items-center gap-1 whitespace-nowrap">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.key}
            size="sm"
            variant={action.active ? "secondary" : "ghost"}
            className={cn(
              "h-8 whitespace-nowrap",
              action.tone === "danger"
                ? "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                : undefined,
            )}
            disabled={action.disabled}
            title={action.title}
            onClick={action.onClick}
          >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
