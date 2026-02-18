import { ISSUE_STATUSES, type Issue, type IssueStatus } from "../../types/domain";
import { defaultBoardFilters, ROOT_PARENT_KEY } from "./board-page.constants";
import { formatIssueStatusLabel, type FilterStatus } from "./issue-labels";
import type {
  BoardFilters,
  FilterPresetFilters,
} from "./board-page.types";

export function parseBoardFilters(raw: string | null): BoardFilters {
  if (!raw) {
    return defaultBoardFilters;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<BoardFilters>;
    const scope =
      parsed.scope === "all" || parsed.scope === "active" || parsed.scope === "backlog"
        ? parsed.scope
        : "all";
    const status =
      parsed.status === "All" || ISSUE_STATUSES.includes(parsed.status as IssueStatus)
        ? parsed.status
        : "All";
    const completion = parsed.completion === "hideDone" ? "hideDone" : "all";
    return {
      query: typeof parsed.query === "string" ? parsed.query : "",
      scope,
      status: status ?? "All",
      completion,
    };
  } catch {
    return defaultBoardFilters;
  }
}

export function toFilterPresetFilters(filters: BoardFilters): FilterPresetFilters {
  return {
    scope: filters.scope,
    status: filters.status,
    completion: filters.completion,
  };
}

export function parseFilterPresetFilters(raw: unknown): FilterPresetFilters {
  const parsed = (raw ?? {}) as Partial<BoardFilters>;
  const scope =
    parsed.scope === "all" || parsed.scope === "active" || parsed.scope === "backlog"
      ? parsed.scope
      : "all";
  const status =
    parsed.status === "All" || ISSUE_STATUSES.includes(parsed.status as IssueStatus)
      ? parsed.status
      : "All";
  const completion = parsed.completion === "hideDone" ? "hideDone" : "all";
  return {
    scope,
    status: status ?? "All",
    completion,
  };
}

export function isSameFilterPresetFilters(
  left: FilterPresetFilters,
  right: FilterPresetFilters,
) {
  return (
    left.scope === right.scope &&
    left.status === right.status &&
    left.completion === right.completion
  );
}

export function formatFilterPresetSummary(filters: FilterPresetFilters) {
  const scopeLabel =
    filters.scope === "all" ? "전체" : filters.scope === "active" ? "Active" : "Backlog";
  const statusLabel =
    filters.status === "All" ? "상태 전체" : `상태 ${formatIssueStatusLabel(filters.status)}`;
  const completedLabel = filters.completion === "hideDone" ? "완료 숨김" : "완료 표시";
  return `${scopeLabel} · ${statusLabel} · ${completedLabel}`;
}

export function formatRelativeTime(timestamp: string) {
  const then = new Date(timestamp).getTime();
  const diff = Date.now() - then;
  const hour = 1000 * 60 * 60;
  const day = hour * 24;
  if (diff < hour) {
    return `${Math.max(1, Math.floor(diff / (1000 * 60)))}분 전`;
  }
  if (diff < day) {
    return `${Math.floor(diff / hour)}시간 전`;
  }
  return `${Math.floor(diff / day)}일 전`;
}

export function canTransitionStatus(current: IssueStatus, next: IssueStatus) {
  if (current === next) {
    return true;
  }
  const allowed: Record<IssueStatus, IssueStatus[]> = {
    Todo: ["InProgress", "Done", "Cancel"],
    InProgress: ["Todo", "Done", "Cancel"],
    Done: ["Todo", "InProgress", "Cancel"],
    Cancel: ["Todo", "InProgress", "Done"],
  };
  return allowed[current].includes(next);
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function extractIssueNumber(issueKey: string) {
  const match = issueKey.match(/(\d+)$/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function formatDateTime(timestamp: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function isSameCalendarDay(a: string | Date, b: string | Date) {
  const first = typeof a === "string" ? new Date(a) : a;
  const second = typeof b === "string" ? new Date(b) : b;
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

export function formatActivityDayLabel(timestamp: string) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (isSameCalendarDay(date, today)) {
    return "오늘";
  }
  if (isSameCalendarDay(date, yesterday)) {
    return "어제";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderInlineMarkdown(value: string) {
  let html = escapeHtml(value);
  html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-600 underline underline-offset-2 dark:text-blue-300">$1</a>');
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-slate-100 px-1 py-0.5 text-[12px] dark:bg-slate-800">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");
  return html;
}

export function renderMarkdownToHtml(markdown: string) {
  const source = markdown.replace(/\r\n/g, "\n").trim();
  if (!source) {
    return '<p class="text-sm text-slate-500 dark:text-slate-400">설명이 없습니다.</p>';
  }

  const lines = source.split("\n");
  let html = "";
  let inUnorderedList = false;
  let inOrderedList = false;
  let inCodeBlock = false;

  const closeLists = () => {
    if (inUnorderedList) {
      html += "</ul>";
      inUnorderedList = false;
    }
    if (inOrderedList) {
      html += "</ol>";
      inOrderedList = false;
    }
  };

  lines.forEach((rawLine) => {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      closeLists();
      if (!inCodeBlock) {
        inCodeBlock = true;
        html += '<pre class="my-2 overflow-x-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"><code>';
      } else {
        inCodeBlock = false;
        html += "</code></pre>";
      }
      return;
    }

    if (inCodeBlock) {
      html += `${escapeHtml(line)}\n`;
      return;
    }

    if (trimmed.length === 0) {
      closeLists();
      html += '<div class="h-2"></div>';
      return;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      closeLists();
      const level = Math.min(6, headingMatch[1].length);
      const body = renderInlineMarkdown(headingMatch[2]);
      const className =
        level <= 2
          ? "mt-3 text-base font-semibold text-slate-900 dark:text-slate-100"
          : "mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200";
      html += `<h${level} class="${className}">${body}</h${level}>`;
      return;
    }

    const unorderedListMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (unorderedListMatch) {
      if (inOrderedList) {
        html += "</ol>";
        inOrderedList = false;
      }
      if (!inUnorderedList) {
        inUnorderedList = true;
        html += '<ul class="my-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">';
      }
      html += `<li>${renderInlineMarkdown(unorderedListMatch[1])}</li>`;
      return;
    }

    const orderedListMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedListMatch) {
      if (inUnorderedList) {
        html += "</ul>";
        inUnorderedList = false;
      }
      if (!inOrderedList) {
        inOrderedList = true;
        html += '<ol class="my-2 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">';
      }
      html += `<li>${renderInlineMarkdown(orderedListMatch[1])}</li>`;
      return;
    }

    closeLists();
    html += `<p class="my-1.5 text-sm leading-6 text-slate-700 dark:text-slate-200">${renderInlineMarkdown(trimmed)}</p>`;
  });

  closeLists();
  if (inCodeBlock) {
    html += "</code></pre>";
  }
  return html;
}

export function buildNextIssueKey(keyPrefix: string, issues: Issue[]) {
  const maxNumber = Math.max(0, ...issues.map((issue) => extractIssueNumber(issue.key)));
  return `${keyPrefix}-${maxNumber + 1}`;
}

export function collectIssueSubtreeIds(issues: Issue[], rootId: string) {
  const byParent = issues.reduce<Record<string, string[]>>((acc, issue) => {
    if (!issue.parentIssueId) {
      return acc;
    }
    acc[issue.parentIssueId] = [...(acc[issue.parentIssueId] ?? []), issue.id];
    return acc;
  }, {});

  const visited = new Set<string>([rootId]);
  const queue: string[] = [rootId];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }
    const children = byParent[current] ?? [];
    children.forEach((childId) => {
      if (!visited.has(childId)) {
        visited.add(childId);
        queue.push(childId);
      }
    });
  }

  return visited;
}

export function compareIssueOrder(a: Issue, b: Issue) {
  if (a.order !== b.order) {
    return a.order - b.order;
  }
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function groupIssuesByParent(issues: Issue[]) {
  const issueById = new Map(issues.map((issue) => [issue.id, issue]));
  const grouped = new Map<string, Issue[]>();

  issues.forEach((issue) => {
    const parentExists = issue.parentIssueId ? issueById.has(issue.parentIssueId) : false;
    const key = parentExists && issue.parentIssueId ? issue.parentIssueId : ROOT_PARENT_KEY;
    const bucket = grouped.get(key) ?? [];
    bucket.push(issue);
    grouped.set(key, bucket);
  });

  for (const bucket of grouped.values()) {
    bucket.sort(compareIssueOrder);
  }

  return grouped;
}

export function isDescendantCandidate(
  issueById: Map<string, Issue>,
  rootIssueId: string,
  parentCandidateId: string,
) {
  let cursor: string | null = parentCandidateId;
  const visited = new Set<string>();

  while (cursor) {
    if (cursor === rootIssueId) {
      return true;
    }
    if (visited.has(cursor)) {
      return false;
    }
    visited.add(cursor);
    cursor = issueById.get(cursor)?.parentIssueId ?? null;
  }

  return false;
}

export function hasSameParent(issue: Issue, parentIssueId: string | null) {
  return (issue.parentIssueId ?? null) === parentIssueId;
}

export function reindexSiblingOrder(issues: Issue[], parentIssueId: string | null) {
  const siblings = issues
    .filter((issue) => hasSameParent(issue, parentIssueId))
    .slice()
    .sort(compareIssueOrder);
  const orderById = new Map(siblings.map((issue, index) => [issue.id, index + 1]));

  return issues.map((issue) => {
    if (!hasSameParent(issue, parentIssueId)) {
      return issue;
    }
    return {
      ...issue,
      order: orderById.get(issue.id) ?? issue.order,
    };
  });
}

export function normalizeFilterStatus(value: string): FilterStatus {
  if (value === "All" || ISSUE_STATUSES.includes(value as IssueStatus)) {
    return value as FilterStatus;
  }
  return "All";
}
