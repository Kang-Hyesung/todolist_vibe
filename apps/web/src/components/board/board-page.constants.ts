import { CheckCircle2, Circle, RefreshCcw, X } from "lucide-react";
import type { IssuePriority, IssueStatus } from "../../types/domain";
import type {
  BoardFilters,
  PriorityMetaItem,
  StatusMetaItem,
} from "./board-page.types";

export const ROOT_PARENT_KEY = "__root__";
export const HOVER_NEST_DELAY_MS = 350;
export const HORIZONTAL_NEST_THRESHOLD_PX = 44;

export const defaultBoardFilters: BoardFilters = {
  query: "",
  scope: "all",
  status: "All",
  completion: "all",
};

export const statusMeta: Record<IssueStatus, StatusMetaItem> = {
  Todo: {
    label: "할 일",
    icon: Circle,
    activeClass:
      "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
    idleClass:
      "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900",
    iconClass: "text-slate-500 dark:text-slate-400",
  },
  InProgress: {
    label: "진행 중",
    icon: RefreshCcw,
    activeClass:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
    idleClass:
      "border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:bg-blue-50/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-blue-900 dark:hover:bg-blue-950/20",
    iconClass: "text-blue-600 dark:text-blue-300",
  },
  Done: {
    label: "완료",
    icon: CheckCircle2,
    activeClass:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
    idleClass:
      "border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-emerald-900 dark:hover:bg-emerald-950/20",
    iconClass: "text-emerald-600 dark:text-emerald-300",
  },
  Cancel: {
    label: "취소",
    icon: X,
    activeClass:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    idleClass:
      "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/20",
    iconClass: "text-rose-600 dark:text-rose-300",
  },
};

export const priorityMeta: Record<IssuePriority, PriorityMetaItem> = {
  Low: {
    description: "일반",
    activeClass:
      "border-slate-300 bg-slate-100 text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100",
    idleClass:
      "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-900",
    dotClass: "bg-slate-500 dark:bg-slate-300",
  },
  Medium: {
    description: "중요",
    activeClass:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200",
    idleClass:
      "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:bg-amber-50/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-amber-900 dark:hover:bg-amber-950/20",
    dotClass: "bg-amber-500 dark:bg-amber-300",
  },
  High: {
    description: "긴급",
    activeClass:
      "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200",
    idleClass:
      "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50/60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400 dark:hover:border-rose-900 dark:hover:bg-rose-950/20",
    dotClass: "bg-rose-500 dark:bg-rose-300",
  },
};
