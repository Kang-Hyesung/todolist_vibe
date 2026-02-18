import * as React from "react";
import { cn } from "../../lib/utils";

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="relative w-full overflow-auto">
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-10 bg-surface-1/95 backdrop-blur supports-[backdrop-filter]:bg-surface-1/85 [&_tr]:border-b [&_tr]:border-border-subtle dark:bg-surface-1/95 dark:supports-[backdrop-filter]:bg-surface-1/85 dark:[&_tr]:border-border-subtle",
        className,
      )}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-border-subtle/70 transition-all hover:bg-surface-1/70 data-[state=selected]:bg-surface-1 dark:border-border-subtle/70 dark:hover:bg-surface-1/80 dark:data-[state=selected]:bg-surface-1",
        className,
      )}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-[11px] font-semibold text-ink-muted dark:text-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return <td className={cn("px-4 py-2.5 align-middle text-[hsl(var(--text-main))]", className)} {...props} />;
}

export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow };
