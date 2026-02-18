import { ArrowLeft, ArrowRight, MoreHorizontal, PencilLine, Plus, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

interface IssueRowActionMenuProps {
  open: boolean;
  isCompleted: boolean;
  isBacklog: boolean;
  canMoveBetweenScopes: boolean;
  canMoveToBacklog: boolean;
  onToggle: () => void;
  onPromoteFromBacklog: () => void;
  onMoveToBacklog: () => void;
  onAddSubIssue: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function IssueRowActionMenu({
  open,
  isCompleted,
  isBacklog,
  canMoveBetweenScopes,
  canMoveToBacklog,
  onToggle,
  onPromoteFromBacklog,
  onMoveToBacklog,
  onAddSubIssue,
  onEdit,
  onDelete,
}: IssueRowActionMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={() => onToggle()}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
            isCompleted ? "opacity-70 hover:opacity-100" : undefined,
          )}
          data-issue-row-actions
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          aria-label="이슈 작업 메뉴"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className={cn(isCompleted ? "border-slate-200/80 bg-slate-50/95 dark:bg-slate-900/95" : undefined)}
      >
        {isBacklog && canMoveBetweenScopes ? (
          <DropdownMenuItem
            className="text-blue-700 focus:bg-blue-50 dark:text-blue-300 dark:focus:bg-blue-950/40"
            onSelect={(event) => {
              event.preventDefault();
              onPromoteFromBacklog();
            }}
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Active로 이동
          </DropdownMenuItem>
        ) : null}

        {canMoveBetweenScopes && canMoveToBacklog ? (
          <DropdownMenuItem
            className="text-violet-700 focus:bg-violet-50 dark:text-violet-300 dark:focus:bg-violet-950/40"
            onSelect={(event) => {
              event.preventDefault();
              onMoveToBacklog();
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Backlog로 이동
          </DropdownMenuItem>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            onAddSubIssue();
          }}
        >
          <Plus className="h-3.5 w-3.5" />
          하위 이슈 추가
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            onEdit();
          }}
        >
          <PencilLine className="h-3.5 w-3.5" />
          이슈 수정
        </DropdownMenuItem>

        <DropdownMenuItem
          className="text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/40"
          onSelect={(event) => {
            event.preventDefault();
            onDelete();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          이슈 삭제
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
