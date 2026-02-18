import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  AlertCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  GripVertical,
  Plus,
  RefreshCcw,
  X,
} from "lucide-react";
import {
  createInitialCommentMap,
  createInitialIssueMap,
  createTemplateIssuesForProject,
  emptyIssueDraft,
  mockAssignees,
  mockProjects,
} from "../../data/mock";
import {
  apiEnabled,
  createIssueInApi,
  deleteIssueInApi,
  fetchIssuesFromApi,
  reorderIssuesInApi,
  updateIssueInApi,
} from "../../lib/api";
import type {
  Issue,
  IssueComment,
  IssueDraft,
  IssuePriority,
  IssueStatus,
} from "../../types/domain";
import { ISSUE_PRIORITIES, ISSUE_STATUSES } from "../../types/domain";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { SegmentedTabs } from "../ui/segmented-tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";
import { cn } from "../../lib/utils";
import { IssueToolbar } from "./issue-toolbar";
import { IssueDetailRightPanel } from "./issue-detail-right-panel";
import { IssueDetailLeftPanel } from "./issue-detail-left-panel";
import {
  formatIssuePriorityLabel,
  formatIssueStatusLabel,
} from "./issue-labels";
import { IssueRowActionMenu } from "./issue-row-action-menu";
import { issuePriorityBadgeVariant } from "./issue-appearance";
import { BoardPageView } from "./board-page-view";
import {
  ROOT_PARENT_KEY,
  defaultBoardFilters,
  priorityMeta,
  statusMeta,
} from "./board-page.constants";
import type {
  BoardScope,
  BoardPageProps,
  FilterPreset,
  IssueActivityEntry,
  TableDensity,
  IssueTableRow,
  MoveFlashDirection,
  VisualMode,
} from "./board-page.types";
import {
  buildNextIssueKey,
  canTransitionStatus,
  collectIssueSubtreeIds,
  compareIssueOrder,
  formatActivityDayLabel,
  formatDateTime,
  formatFilterPresetSummary,
  formatRelativeTime,
  groupIssuesByParent,
  hasSameParent,
  initials,
  isDescendantCandidate,
  isSameCalendarDay,
  isSameFilterPresetFilters,
  parseBoardFilters,
  parseFilterPresetFilters,
  reindexSiblingOrder,
  renderMarkdownToHtml,
  toFilterPresetFilters,
} from "./board-page.utils";
import {
  useBoardEditorState,
  useBoardFilterState,
  useBoardInteractionState,
} from "./use-board-state";

export function BoardPage({
  projects = mockProjects,
  activeProjectId: controlledActiveProjectId,
  onActiveProjectChange,
}: BoardPageProps) {
  const activeProjects = projects.length > 0 ? projects : mockProjects;
  const showDevStateToggles = import.meta.env.DEV;
  const [localActiveProjectId, setLocalActiveProjectId] = useState(activeProjects[0].id);
  const [issuesByProject, setIssuesByProject] = useState(() =>
    createInitialIssueMap(activeProjects, mockAssignees),
  );
  const [commentsByIssue, setCommentsByIssue] = useState<Record<string, IssueComment[]>>(() =>
    createInitialCommentMap(createInitialIssueMap(activeProjects, mockAssignees), mockAssignees),
  );
  const [activityByIssue, setActivityByIssue] = useState<Record<string, IssueActivityEntry[]>>({});
  const {
    filters,
    setFilters,
    setQuery,
    setStatusFilter,
    setHideCompleted,
    filterPresets,
    setFilterPresets,
    selectedFilterPresetId,
    setSelectedFilterPresetId,
    visualMode,
    setVisualMode,
    tableDensity,
    setTableDensity,
  } = useBoardFilterState(defaultBoardFilters);
  const [filtersHydrated, setFiltersHydrated] = useState(false);
  const [booting, setBooting] = useState(true);
  const {
    panelOpen,
    setPanelOpen,
    editingIssueId,
    setEditingIssueId,
    draft,
    setDraft,
    toast,
    setToast,
    descriptionEditorMode,
    setDescriptionEditorMode,
  } = useBoardEditorState(emptyIssueDraft);
  const [apiSyncing, setApiSyncing] = useState(false);
  const [expandedByProject, setExpandedByProject] = useState<Record<string, string[]>>({});
  const [dragPreviewParentId, setDragPreviewParentId] = useState<string | null>(null);
  const [draggingIssueId, setDraggingIssueId] = useState<string | null>(null);
  const [dragConstraintNotice, setDragConstraintNotice] = useState<string | null>(null);
  const {
    subIssueDraftTitle,
    setSubIssueDraftTitle,
    subIssueEditingId,
    setSubIssueEditingId,
    subIssueEditingTitle,
    setSubIssueEditingTitle,
    commentDraft,
    setCommentDraft,
    parentIssueQuery,
    setParentIssueQuery,
    rowActionMenuIssueId,
    setRowActionMenuIssueId,
    inlineSubIssueParentId,
    setInlineSubIssueParentId,
    inlineSubIssueTitle,
    setInlineSubIssueTitle,
    inlineSubIssuePriority,
    setInlineSubIssuePriority,
    inlineSubIssueAssigneeId,
    setInlineSubIssueAssigneeId,
    selectedIssueIds,
    setSelectedIssueIds,
    lastSelectionAnchorId,
    setLastSelectionAnchorId,
    bulkStatusValue,
    setBulkStatusValue,
    bulkPriorityValue,
    setBulkPriorityValue,
    bulkAssigneeValue,
    setBulkAssigneeValue,
    lastBulkUndo,
    setLastBulkUndo,
  } = useBoardInteractionState();
  const [recentMoveFlash, setRecentMoveFlash] = useState<{ issueId: string; direction: MoveFlashDirection } | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);
  const inlineSubIssueInputRef = useRef<HTMLInputElement | null>(null);
  const blockedDragToastRef = useRef<string | null>(null);
  const dragHoverRef = useRef<{
    activeId: string | null;
    currentOverId: string | null;
    enteredAtByOverId: Record<string, number>;
    nestParentId: string | null;
  }>({
    activeId: null,
    currentOverId: null,
    enteredAtByOverId: {},
    nestParentId: null,
  });
  const activeProjectId = controlledActiveProjectId ?? localActiveProjectId;

  const setCurrentActiveProjectId = useCallback((projectId: string) => {
    if (onActiveProjectChange) {
      onActiveProjectChange(projectId);
      return;
    }
    setLocalActiveProjectId(projectId);
  }, [onActiveProjectChange]);
  const activeProject = useMemo(
    () => activeProjects.find((project) => project.id === activeProjectId) ?? activeProjects[0],
    [activeProjectId, activeProjects],
  );
  const filtersStorageKey = useMemo(
    () => `board.filters.${activeProject.workspaceId}.${activeProject.id}`,
    [activeProject.workspaceId, activeProject.id],
  );
  const presetsStorageKey = useMemo(
    () => `board.filter-presets.${activeProject.workspaceId}.${activeProject.id}`,
    [activeProject.workspaceId, activeProject.id],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setBooting(false), 700);
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!toast) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setToast(null), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [setToast, toast]);

  useEffect(() => {
    if (!recentMoveFlash) {
      return undefined;
    }
    const timeoutId = window.setTimeout(() => setRecentMoveFlash(null), 1100);
    return () => window.clearTimeout(timeoutId);
  }, [recentMoveFlash]);

  useEffect(() => {
    if (typeof window === "undefined" || !filtersHydrated) {
      return;
    }
    window.localStorage.setItem(filtersStorageKey, JSON.stringify(filters));
  }, [filters, filtersHydrated, filtersStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(presetsStorageKey, JSON.stringify(filterPresets));
  }, [filterPresets, presetsStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setFiltersHydrated(false);
    const raw = window.localStorage.getItem(filtersStorageKey);
    setFilters(parseBoardFilters(raw));
    setFiltersHydrated(true);
  }, [filtersStorageKey, setFilters]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const raw = window.localStorage.getItem(presetsStorageKey);
    if (!raw) {
      setFilterPresets([]);
      setSelectedFilterPresetId("__none__");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as Array<{ id: string; name: string; filters: unknown }>;
      setFilterPresets(
        parsed
          .filter((preset) => preset && typeof preset.id === "string" && typeof preset.name === "string")
          .map((preset) => ({
            id: preset.id,
            name: preset.name,
            filters: parseFilterPresetFilters(preset.filters),
          })),
      );
    } catch {
      setFilterPresets([]);
    }
    setSelectedFilterPresetId("__none__");
  }, [presetsStorageKey, setFilterPresets, setSelectedFilterPresetId]);

  useEffect(() => {
    if (selectedFilterPresetId === "__none__") {
      return;
    }
    const selectedPreset = filterPresets.find((preset) => preset.id === selectedFilterPresetId);
    if (!selectedPreset) {
      setSelectedFilterPresetId("__none__");
      return;
    }
    if (!isSameFilterPresetFilters(selectedPreset.filters, toFilterPresetFilters(filters))) {
      setSelectedFilterPresetId("__none__");
    }
  }, [filters, filterPresets, selectedFilterPresetId, setSelectedFilterPresetId]);

  useEffect(() => {
    if (!rowActionMenuIssueId) {
      return undefined;
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-issue-row-actions]")) {
        setRowActionMenuIssueId(null);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [rowActionMenuIssueId, setRowActionMenuIssueId]);

  useEffect(() => {
    if (!inlineSubIssueParentId) {
      return;
    }
    const rafId = window.requestAnimationFrame(() => {
      inlineSubIssueInputRef.current?.focus();
      inlineSubIssueInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [inlineSubIssueParentId]);

  const query = filters.query;
  const quickScope = filters.scope;
  const statusFilter = filters.status;
  const hideCompleted = filters.completion === "hideDone";
  const applyQuickScope = (scope: BoardScope) => {
    if (scope === "all") {
      setFilters({
        query: "",
        scope: "all",
        status: "All",
        completion: "all",
      });
      return;
    }
    if (scope === "active") {
      setFilters({
        query: "",
        scope: "active",
        status: "InProgress",
        completion: "hideDone",
      });
      return;
    }
    setFilters({
      query: "",
      scope: "backlog",
      status: "All",
      completion: "all",
    });
  };

  const saveCurrentFilterPreset = () => {
    const currentPresetFilters = toFilterPresetFilters(filters);
    const existingSamePreset = filterPresets.find((preset) =>
      isSameFilterPresetFilters(preset.filters, currentPresetFilters),
    );
    if (existingSamePreset) {
      setSelectedFilterPresetId(existingSamePreset.id);
      setToast({ kind: "success", text: `동일한 프리셋 "${existingSamePreset.name}"을 선택했습니다.` });
      return;
    }

    const nextIndex = filterPresets.length + 1;
    const nextName = `프리셋 ${nextIndex}`;
    const nextPreset: FilterPreset = {
      id: `preset-${Date.now()}`,
      name: nextName,
      filters: currentPresetFilters,
    };
    setFilterPresets((current) => {
      const nextList = current.length >= 12 ? current.slice(1) : current;
      return [...nextList, nextPreset];
    });
    setSelectedFilterPresetId(nextPreset.id);
    setToast({
      kind: "success",
      text:
        filterPresets.length >= 12
          ? `프리셋 최대 12개를 유지하기 위해 가장 오래된 항목을 정리하고 "${nextName}"을 저장했습니다.`
          : `필터 프리셋 "${nextName}"을 저장했습니다.`,
    });
  };

  const applyFilterPresetById = (presetId: string) => {
    if (presetId === "__none__") {
      setSelectedFilterPresetId("__none__");
      return;
    }
    const target = filterPresets.find((preset) => preset.id === presetId);
    if (!target) {
      return;
    }
    setFilters((current) => ({
      ...current,
      scope: target.filters.scope,
      status: target.filters.status,
      completion: target.filters.completion,
    }));
    setSelectedFilterPresetId(target.id);
    setToast({ kind: "success", text: `프리셋 "${target.name}"을 적용했습니다.` });
  };

  const deleteCurrentFilterPreset = () => {
    if (selectedFilterPresetId === "__none__") {
      return;
    }
    const target = filterPresets.find((preset) => preset.id === selectedFilterPresetId);
    setFilterPresets((current) => current.filter((preset) => preset.id !== selectedFilterPresetId));
    setSelectedFilterPresetId("__none__");
    if (target) {
      setToast({ kind: "success", text: `프리셋 "${target.name}"을 삭제했습니다.` });
    }
  };

  useEffect(() => {
    if (activeProjects.some((project) => project.id === activeProjectId)) {
      return;
    }
    setCurrentActiveProjectId(activeProjects[0].id);
  }, [activeProjectId, activeProjects, setCurrentActiveProjectId]);

  useEffect(() => {
    setInlineSubIssueParentId(null);
    setInlineSubIssueTitle("");
    setInlineSubIssuePriority("Medium");
    setInlineSubIssueAssigneeId(null);
    setSelectedIssueIds([]);
    setBulkStatusValue("__none__");
    setBulkPriorityValue("__none__");
    setBulkAssigneeValue("__none__");
    setLastSelectionAnchorId(null);
    setLastBulkUndo(null);
  }, [
    activeProjectId,
    setBulkAssigneeValue,
    setBulkPriorityValue,
    setBulkStatusValue,
    setInlineSubIssueAssigneeId,
    setInlineSubIssueParentId,
    setInlineSubIssuePriority,
    setInlineSubIssueTitle,
    setLastBulkUndo,
    setLastSelectionAnchorId,
    setSelectedIssueIds,
  ]);

  useEffect(() => {
    setIssuesByProject((current) => {
      let changed = false;
      const next: Record<string, Issue[]> = { ...current };

      activeProjects.forEach((project) => {
        if (!next[project.id]) {
          next[project.id] = createTemplateIssuesForProject(project, mockAssignees);
          changed = true;
        }
      });

      Object.keys(next).forEach((projectId) => {
        if (!activeProjects.some((project) => project.id === projectId)) {
          delete next[projectId];
          changed = true;
        }
      });

      return changed ? next : current;
    });
  }, [activeProjects]);

  useEffect(() => {
    if (!apiEnabled) {
      return undefined;
    }

    let disposed = false;

    const syncIssues = async () => {
      setApiSyncing(true);
      try {
        const apiIssues = await fetchIssuesFromApi(activeProject.apiId, activeProject.id);
        if (!disposed) {
          setIssuesByProject((current) => ({
            ...current,
            [activeProject.id]: apiIssues.map((apiIssue) => ({
              ...apiIssue,
              isBacklog:
                current[activeProject.id]?.find((existing) => existing.id === apiIssue.id)?.isBacklog ??
                apiIssue.isBacklog,
              parentIssueId:
                apiIssue.parentIssueId ??
                current[activeProject.id]?.find((existing) => existing.id === apiIssue.id)?.parentIssueId ??
                null,
            })),
          }));
        }
      } catch {
        if (!disposed) {
          setToast({
            kind: "error",
            text: "API 동기화에 실패했습니다. 로컬 목업 상태로 전환합니다.",
          });
        }
      } finally {
        if (!disposed) {
          setApiSyncing(false);
        }
      }
    };

    void syncIssues();

    return () => {
      disposed = true;
    };
  }, [activeProject.apiId, activeProject.id, setToast]);

  const assigneeMap = useMemo(
    () => new Map(mockAssignees.map((assignee) => [assignee.id, assignee])),
    [],
  );
  const currentUser = useMemo(() => mockAssignees[0] ?? null, []);

  const appendIssueActivity = useCallback(
    (issueId: string, message: string, actorName?: string) => {
      const createdAt = new Date().toISOString();
      const resolvedActor = actorName ?? currentUser?.name ?? "시스템";
      setActivityByIssue((current) => ({
        ...current,
        [issueId]: [
          ...(current[issueId] ?? []),
          {
            id: `activity-${issueId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            issueId,
            message,
            actorName: resolvedActor,
            createdAt,
          },
        ],
      }));
    },
    [currentUser?.name],
  );

  const rawIssues = useMemo(() => (issuesByProject[activeProjectId] ?? []).slice(), [issuesByProject, activeProjectId]);
  const selectedIssueIdSet = useMemo(() => new Set(selectedIssueIds), [selectedIssueIds]);
  const completedIssueCount = useMemo(
    () => rawIssues.filter((issue) => issue.status === "Done").length,
    [rawIssues],
  );
  const issueById = useMemo(() => new Map(rawIssues.map((issue) => [issue.id, issue])), [rawIssues]);
  useEffect(() => {
    setSelectedIssueIds((current) => current.filter((id) => issueById.has(id)));
  }, [issueById, setSelectedIssueIds]);
  useEffect(() => {
    setActivityByIssue((current) => {
      const next = Object.fromEntries(
        Object.entries(current).filter(([issueId]) => issueById.has(issueId)),
      );
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, [issueById]);
  const groupedByParent = useMemo(() => groupIssuesByParent(rawIssues), [rawIssues]);
  const parentIdsWithChildren = useMemo(
    () =>
      new Set(
        Array.from(groupedByParent.entries())
          .filter(([parentKey, children]) => parentKey !== ROOT_PARENT_KEY && children.length > 0)
          .map(([parentKey]) => parentKey),
      ),
    [groupedByParent],
  );

  const effectiveMode: VisualMode = booting ? "loading" : visualMode;

  useEffect(() => {
    setExpandedByProject((current) => {
      if (current[activeProjectId]) {
        return current;
      }
      const defaults = Array.from(parentIdsWithChildren);
      return { ...current, [activeProjectId]: defaults };
    });
  }, [activeProjectId, parentIdsWithChildren]);

  const expandedIssueIds = useMemo(
    () => new Set(expandedByProject[activeProjectId] ?? []),
    [expandedByProject, activeProjectId],
  );

  const setExpandedIssueIds = (updater: (previous: Set<string>) => Set<string>) => {
    setExpandedByProject((current) => {
      const previous = new Set(current[activeProjectId] ?? []);
      const next = updater(previous);
      return { ...current, [activeProjectId]: Array.from(next) };
    });
  };

  const treeRows = useMemo(() => {
    const rows: IssueTableRow[] = [];
    const visited = new Set<string>();

    const walk = (parentKey: string, depth: number) => {
      const siblings = groupedByParent.get(parentKey) ?? [];
      for (const issue of siblings) {
        if (visited.has(issue.id)) {
          continue;
        }
        visited.add(issue.id);
        const hasChildren = parentIdsWithChildren.has(issue.id);
        const childCount = (groupedByParent.get(issue.id) ?? []).length;
        const isExpanded = expandedIssueIds.has(issue.id);
        const isHiddenCompleted = hideCompleted && issue.status === "Done";
        if (!isHiddenCompleted) {
          rows.push({ issue, depth, hasChildren, childCount, isExpanded });
        }
        if (hasChildren && isExpanded) {
          walk(issue.id, depth + 1);
        }
      }
    };

    walk(ROOT_PARENT_KEY, 0);
    return rows;
  }, [groupedByParent, parentIdsWithChildren, expandedIssueIds, hideCompleted]);

  const issuesForView = useMemo(() => {
    if (effectiveMode === "empty") {
      return [] as IssueTableRow[];
    }

    const queryText = query.trim().toLowerCase();
    const isBacklogIssue = (issue: Issue) => issue.isBacklog;
    const matchesScope = (issue: Issue) => {
      if (quickScope === "backlog") {
        return isBacklogIssue(issue);
      }
      if (quickScope === "active") {
        return !isBacklogIssue(issue) && issue.status !== "Done" && issue.status !== "Cancel";
      }
      return true;
    };
    const hasFilter = queryText.length > 0 || statusFilter !== "All" || quickScope !== "all";

    if (!hasFilter) {
      return treeRows;
    }

    return rawIssues
      .slice()
      .sort(compareIssueOrder)
      .filter((issue) => {
        const matchesText = queryText.length === 0 || issue.title.toLowerCase().includes(queryText);
        const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
        const matchesVisibility = !hideCompleted || issue.status !== "Done";
        return matchesScope(issue) && matchesText && matchesStatus && matchesVisibility;
      })
      .map((issue) => ({
        issue,
        depth: 0,
        hasChildren: parentIdsWithChildren.has(issue.id),
        childCount: (groupedByParent.get(issue.id) ?? []).length,
        isExpanded: expandedIssueIds.has(issue.id),
      }));
  }, [effectiveMode, expandedIssueIds, groupedByParent, hideCompleted, parentIdsWithChildren, query, quickScope, rawIssues, statusFilter, treeRows]);
  const visibleIssueIds = useMemo(
    () => issuesForView.map((row) => row.issue.id),
    [issuesForView],
  );
  const allVisibleSelected = useMemo(
    () =>
      visibleIssueIds.length > 0 &&
      visibleIssueIds.every((id) => selectedIssueIdSet.has(id)),
    [selectedIssueIdSet, visibleIssueIds],
  );

  useEffect(() => {
    if (!inlineSubIssueParentId) {
      return;
    }
    const visibleParent = issuesForView.some((row) => row.issue.id === inlineSubIssueParentId);
    if (!visibleParent) {
      setInlineSubIssueParentId(null);
      setInlineSubIssueTitle("");
      setInlineSubIssuePriority("Medium");
      setInlineSubIssueAssigneeId(null);
    }
  }, [
    inlineSubIssueParentId,
    issuesForView,
    setInlineSubIssueAssigneeId,
    setInlineSubIssueParentId,
    setInlineSubIssuePriority,
    setInlineSubIssueTitle,
  ]);

  const reorderEnabled =
    effectiveMode === "ready" &&
    !apiSyncing &&
    quickScope === "all" &&
    query.trim().length === 0 &&
    statusFilter === "All" &&
    !hideCompleted;

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssueIds((current) => {
      const currentSet = new Set(current);
      const wasChecked = currentSet.has(issueId);
      if (!lastSelectionAnchorId) {
        if (wasChecked) {
          currentSet.delete(issueId);
        } else {
          currentSet.add(issueId);
        }
        return Array.from(currentSet);
      }

      const anchorIndex = visibleIssueIds.indexOf(lastSelectionAnchorId);
      const currentIndex = visibleIssueIds.indexOf(issueId);
      if (anchorIndex < 0 || currentIndex < 0) {
        if (wasChecked) {
          currentSet.delete(issueId);
        } else {
          currentSet.add(issueId);
        }
        return Array.from(currentSet);
      }

      const [start, end] = anchorIndex < currentIndex
        ? [anchorIndex, currentIndex]
        : [currentIndex, anchorIndex];
      const rangeIds = visibleIssueIds.slice(start, end + 1);
      if (wasChecked) {
        rangeIds.forEach((id) => currentSet.delete(id));
      } else {
        rangeIds.forEach((id) => currentSet.add(id));
      }
      return Array.from(currentSet);
    });
    setLastSelectionAnchorId(issueId);
  };

  const toggleIssueSelectionByIntent = (issueId: string, shiftKey: boolean) => {
    if (!shiftKey) {
      setSelectedIssueIds((current) =>
        current.includes(issueId)
          ? current.filter((id) => id !== issueId)
          : [...current, issueId],
      );
      setLastSelectionAnchorId(issueId);
      return;
    }
    toggleIssueSelection(issueId);
  };

  const toggleSelectAllVisible = () => {
    setSelectedIssueIds((current) => {
      if (visibleIssueIds.length === 0) {
        return current;
      }
      const currentSet = new Set(current);
      const alreadyAllSelected = visibleIssueIds.every((id) => currentSet.has(id));
      if (alreadyAllSelected) {
        return current.filter((id) => !visibleIssueIds.includes(id));
      }
      visibleIssueIds.forEach((id) => currentSet.add(id));
      return Array.from(currentSet);
    });
    setLastSelectionAnchorId(visibleIssueIds[0] ?? null);
  };

  const clearIssueSelection = () => {
    setSelectedIssueIds([]);
    setLastSelectionAnchorId(null);
    setBulkStatusValue("__none__");
    setBulkPriorityValue("__none__");
    setBulkAssigneeValue("__none__");
  };

  const pushBulkUndo = (label: string, previousIssues: Issue[]) => {
    if (previousIssues.length === 0) {
      return;
    }
    setLastBulkUndo({
      projectId: activeProjectId,
      label,
      previousIssues: previousIssues.map((issue) => ({ ...issue })),
    });
  };

  const undoLastBulkAction = async () => {
    if (!lastBulkUndo) {
      return;
    }
    if (lastBulkUndo.projectId !== activeProjectId) {
      setToast({
        kind: "error",
        text: "다른 프로젝트에서는 이전 일괄 작업을 되돌릴 수 없습니다.",
      });
      return;
    }

    const previousById = new Map(lastBulkUndo.previousIssues.map((issue) => [issue.id, issue]));

    if (apiEnabled) {
      try {
        const restoredIssues = await Promise.all(
          lastBulkUndo.previousIssues.map(async (issue) => {
            const restored = await updateIssueInApi(
              issue.id,
              {
                parentIssueId: issue.parentIssueId,
                title: issue.title,
                description: issue.description,
                status: issue.status,
                priority: issue.priority,
                assigneeId: issue.assigneeId,
              },
              activeProject.id,
            );
            return {
              ...restored,
              isBacklog: issue.isBacklog,
            };
          }),
        );
        const restoredById = new Map(restoredIssues.map((issue) => [issue.id, issue]));
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
            restoredById.get(candidate.id) ?? candidate,
          ),
        }));
      } catch {
        setToast({ kind: "error", text: "일괄 작업 실행취소에 실패했습니다." });
        return;
      }
    } else {
      setIssuesByProject((current) => ({
        ...current,
        [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
          previousById.get(candidate.id) ?? candidate,
        ),
      }));
    }

    const restoredCount = lastBulkUndo.previousIssues.length;
    lastBulkUndo.previousIssues.forEach((issue) => {
      appendIssueActivity(issue.id, `일괄 작업 실행취소: ${lastBulkUndo.label}`);
    });
    setLastBulkUndo(null);
    setToast({ kind: "success", text: `${restoredCount}건 실행취소를 완료했습니다.` });
  };

  const applyBulkStatusChange = async (nextStatus: IssueStatus) => {
    const selectedIssues = rawIssues.filter((issue) => selectedIssueIdSet.has(issue.id));
    if (selectedIssues.length === 0) {
      return;
    }

    const blocked = selectedIssues.filter((issue) => {
      if (!issue.parentIssueId) {
        return false;
      }
      const parent = issueById.get(issue.parentIssueId) ?? null;
      return Boolean(parent?.isBacklog);
    });
    const blockedIdSet = new Set(blocked.map((issue) => issue.id));
    const statusChangedCandidates = selectedIssues.filter(
      (issue) => !blockedIdSet.has(issue.id) && issue.status !== nextStatus,
    );
    const invalidTransitions = statusChangedCandidates.filter(
      (issue) => !canTransitionStatus(issue.status, nextStatus),
    );
    const invalidTransitionIdSet = new Set(invalidTransitions.map((issue) => issue.id));
    const targets = statusChangedCandidates.filter((issue) => !invalidTransitionIdSet.has(issue.id));
    const excludedCount = selectedIssues.length - targets.length;

    if (targets.length === 0) {
      setToast({
        kind: "error",
        text:
          blocked.length > 0
            ? "상위가 Backlog인 하위 이슈는 상태를 일괄 변경할 수 없습니다."
            : invalidTransitions.length > 0
              ? "허용되지 않는 상태 전이가 포함되어 변경할 대상이 없습니다."
              : "변경할 대상이 없습니다.",
      });
      return;
    }
    const proceed = window.confirm(
      `상태를 "${formatIssueStatusLabel(nextStatus)}"로 일괄 변경합니다.\n대상: ${targets.length}건` +
        (blocked.length > 0 ? `\nBacklog 하위 제외: ${blocked.length}건` : "") +
        (invalidTransitions.length > 0 ? `\n전이 규칙 제외: ${invalidTransitions.length}건` : "") +
        (excludedCount > blocked.length + invalidTransitions.length ? `\n기타 제외: ${excludedCount - blocked.length - invalidTransitions.length}건` : "") +
        "\n계속할까요?",
    );
    if (!proceed) {
      return;
    }
    const beforeSnapshot = targets.map((issue) => ({ ...issue }));

    if (apiEnabled) {
      try {
        const updatedIssues = await Promise.all(
          targets.map(async (target) => {
            const updatedIssue = await updateIssueInApi(
              target.id,
              {
                parentIssueId: target.parentIssueId,
                title: target.title,
                description: target.description,
                status: nextStatus,
                priority: target.priority,
                assigneeId: target.assigneeId,
              },
              activeProject.id,
            );
            return {
              ...updatedIssue,
              isBacklog: nextStatus === "Todo" ? target.isBacklog : false,
            };
          }),
        );
        const updatedById = new Map(updatedIssues.map((issue) => [issue.id, issue]));
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
            updatedById.get(candidate.id) ?? candidate,
          ),
        }));
      } catch {
        setToast({ kind: "error", text: "API 상태 일괄 업데이트에 실패했습니다." });
        return;
      }
    } else {
      const now = new Date().toISOString();
      const targetIds = new Set(targets.map((issue) => issue.id));
      setIssuesByProject((current) => ({
        ...current,
        [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
          targetIds.has(candidate.id)
            ? {
                ...candidate,
                status: nextStatus,
                isBacklog: nextStatus === "Todo" ? candidate.isBacklog : false,
                updatedAt: now,
              }
            : candidate,
        ),
      }));
    }

    pushBulkUndo("상태 일괄 변경", beforeSnapshot);
    beforeSnapshot.forEach((before) => {
      appendIssueActivity(
        before.id,
        `상태 일괄 변경: ${formatIssueStatusLabel(before.status)} → ${formatIssueStatusLabel(nextStatus)}`,
      );
    });

    setToast({
      kind: "success",
      text:
        blocked.length > 0 || invalidTransitions.length > 0
          ? `상태를 ${targets.length}건 변경했습니다. 제외 ${blocked.length + invalidTransitions.length}건`
          : `상태를 ${targets.length}건 변경했습니다.`,
    });
  };

  const applyBulkPriorityChange = async (nextPriority: IssuePriority) => {
    const selectedIssues = rawIssues.filter((issue) => selectedIssueIdSet.has(issue.id) && issue.priority !== nextPriority);
    if (selectedIssues.length === 0) {
      return;
    }
    const proceed = window.confirm(
      `우선순위를 "${formatIssuePriorityLabel(nextPriority)}"로 일괄 변경합니다.\n대상: ${selectedIssues.length}건\n계속할까요?`,
    );
    if (!proceed) {
      return;
    }
    const beforeSnapshot = selectedIssues.map((issue) => ({ ...issue }));

    if (apiEnabled) {
      try {
        const updatedIssues = await Promise.all(
          selectedIssues.map(async (target) => {
            const updatedIssue = await updateIssueInApi(
              target.id,
              {
                parentIssueId: target.parentIssueId,
                title: target.title,
                description: target.description,
                status: target.status,
                priority: nextPriority,
                assigneeId: target.assigneeId,
              },
              activeProject.id,
            );
            return {
              ...updatedIssue,
              isBacklog: target.isBacklog,
            };
          }),
        );
        const updatedById = new Map(updatedIssues.map((issue) => [issue.id, issue]));
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
            updatedById.get(candidate.id) ?? candidate,
          ),
        }));
      } catch {
        setToast({ kind: "error", text: "API 우선순위 일괄 업데이트에 실패했습니다." });
        return;
      }
    } else {
      const now = new Date().toISOString();
      const targetIds = new Set(selectedIssues.map((issue) => issue.id));
      setIssuesByProject((current) => ({
        ...current,
        [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
          targetIds.has(candidate.id)
            ? {
                ...candidate,
                priority: nextPriority,
                updatedAt: now,
              }
            : candidate,
        ),
      }));
    }

    pushBulkUndo("우선순위 일괄 변경", beforeSnapshot);
    beforeSnapshot.forEach((before) => {
      appendIssueActivity(
        before.id,
        `우선순위 일괄 변경: ${formatIssuePriorityLabel(before.priority)} → ${formatIssuePriorityLabel(nextPriority)}`,
      );
    });
    setToast({ kind: "success", text: `우선순위를 ${selectedIssues.length}건 변경했습니다.` });
  };

  const applyBulkAssigneeChange = async (assigneeId: string | null) => {
    const selectedIssues = rawIssues.filter((issue) => selectedIssueIdSet.has(issue.id) && issue.assigneeId !== assigneeId);
    if (selectedIssues.length === 0) {
      return;
    }
    const assigneeLabel =
      assigneeId === null ? "미할당" : assigneeMap.get(assigneeId)?.name ?? "담당자";
    const proceed = window.confirm(
      `담당자를 "${assigneeLabel}"으로 일괄 변경합니다.\n대상: ${selectedIssues.length}건\n계속할까요?`,
    );
    if (!proceed) {
      return;
    }
    const beforeSnapshot = selectedIssues.map((issue) => ({ ...issue }));

    if (apiEnabled) {
      try {
        const updatedIssues = await Promise.all(
          selectedIssues.map(async (target) => {
            const updatedIssue = await updateIssueInApi(
              target.id,
              {
                parentIssueId: target.parentIssueId,
                title: target.title,
                description: target.description,
                status: target.status,
                priority: target.priority,
                assigneeId,
              },
              activeProject.id,
            );
            return {
              ...updatedIssue,
              isBacklog: target.isBacklog,
            };
          }),
        );
        const updatedById = new Map(updatedIssues.map((issue) => [issue.id, issue]));
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
            updatedById.get(candidate.id) ?? candidate,
          ),
        }));
      } catch {
        setToast({ kind: "error", text: "API 담당자 일괄 업데이트에 실패했습니다." });
        return;
      }
    } else {
      const now = new Date().toISOString();
      const targetIds = new Set(selectedIssues.map((issue) => issue.id));
      setIssuesByProject((current) => ({
        ...current,
        [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
          targetIds.has(candidate.id)
            ? {
                ...candidate,
                assigneeId,
                updatedAt: now,
              }
            : candidate,
        ),
      }));
    }

    pushBulkUndo("담당자 일괄 변경", beforeSnapshot);
    beforeSnapshot.forEach((before) => {
      const previousAssigneeLabel =
        before.assigneeId === null
          ? "미할당"
          : assigneeMap.get(before.assigneeId)?.name ?? "담당자";
      appendIssueActivity(before.id, `담당자 일괄 변경: ${previousAssigneeLabel} → ${assigneeLabel}`);
    });
    setToast({ kind: "success", text: `담당자를 ${selectedIssues.length}건 변경했습니다.` });
  };

  const applyBulkScopeMove = async (toBacklog: boolean) => {
    const selectedIssues = rawIssues.filter((issue) => selectedIssueIdSet.has(issue.id));
    if (selectedIssues.length === 0) {
      return;
    }

    const selectedRoots = selectedIssues.filter((issue) => issue.parentIssueId === null);
    const candidateRoots = selectedRoots.filter((issue) => (toBacklog ? !issue.isBacklog : issue.isBacklog));

    if (candidateRoots.length === 0) {
      setToast({
        kind: "error",
        text: "일괄 이동은 상위 이슈 선택이 필요합니다.",
      });
      return;
    }

    const targetIds = new Set<string>();
    candidateRoots.forEach((rootIssue) => {
      collectIssueSubtreeIds(rawIssues, rootIssue.id).forEach((id) => targetIds.add(id));
    });
    const targets = rawIssues.filter((issue) => targetIds.has(issue.id));
    const skippedChildren = selectedIssues.length - selectedRoots.length;
    const proceed = window.confirm(
      `${toBacklog ? "Backlog" : "Active"}로 일괄 이동합니다.\n루트 대상: ${candidateRoots.length}건\n실제 이동: ${targets.length}건` +
        (skippedChildren > 0 ? `\n하위 단독 선택 제외: ${skippedChildren}건` : "") +
        "\n계속할까요?",
    );
    if (!proceed) {
      return;
    }
    const beforeSnapshot = targets.map((issue) => ({ ...issue }));

    if (apiEnabled) {
      try {
        const updatedIssues = await Promise.all(
          targets.map(async (target) => {
            const nextStatus = toBacklog
              ? "Todo"
              : (target.status === "Todo" ? "InProgress" : target.status);
            const updatedIssue = await updateIssueInApi(
              target.id,
              {
                parentIssueId: target.parentIssueId,
                title: target.title,
                description: target.description,
                status: nextStatus,
                priority: target.priority,
                assigneeId: target.assigneeId,
              },
              activeProject.id,
            );
            return {
              ...updatedIssue,
              isBacklog: toBacklog,
            };
          }),
        );
        const updatedById = new Map(updatedIssues.map((issue) => [issue.id, issue]));
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
            updatedById.get(candidate.id) ?? candidate,
          ),
        }));
      } catch {
        setToast({ kind: "error", text: toBacklog ? "Backlog 일괄 이동에 실패했습니다." : "Active 일괄 이동에 실패했습니다." });
        return;
      }
    } else {
      const now = new Date().toISOString();
      setIssuesByProject((current) => ({
        ...current,
        [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
          targetIds.has(candidate.id)
            ? {
                ...candidate,
                isBacklog: toBacklog,
                status: toBacklog ? "Todo" : (candidate.status === "Todo" ? "InProgress" : candidate.status),
                updatedAt: now,
              }
            : candidate,
        ),
      }));
    }

    pushBulkUndo(toBacklog ? "Backlog 일괄 이동" : "Active 일괄 이동", beforeSnapshot);
    targets.forEach((target) => {
      if (toBacklog) {
        appendIssueActivity(target.id, "범위 일괄 이동: Active → Backlog (상태 Todo)");
        return;
      }
      appendIssueActivity(
        target.id,
        target.status === "Todo"
          ? "범위 일괄 이동: Backlog → Active (상태 InProgress)"
          : "범위 일괄 이동: Backlog → Active",
      );
    });
    if (candidateRoots[0]) {
      setRecentMoveFlash({
        issueId: candidateRoots[0].id,
        direction: toBacklog ? "toBacklog" : "toActive",
      });
    }
    setToast({
      kind: "success",
      text:
        skippedChildren > 0
          ? `${targets.length}건을 ${toBacklog ? "Backlog" : "Active"}로 이동했습니다. 하위 단독 선택 ${skippedChildren}건은 제외되었습니다.`
          : `${targets.length}건을 ${toBacklog ? "Backlog" : "Active"}로 이동했습니다.`,
    });
  };

  const toggleIssueExpand = (issueId: string) => {
    setExpandedIssueIds((previous) => {
      const next = new Set(previous);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const expandAllIssues = () => {
    setExpandedIssueIds(() => new Set(parentIdsWithChildren));
  };

  const collapseAllIssues = () => {
    setExpandedIssueIds(() => new Set());
  };

  const resetDetailInputs = () => {
    setSubIssueDraftTitle("");
    setSubIssueEditingId(null);
    setSubIssueEditingTitle("");
    setCommentDraft("");
    setParentIssueQuery("");
    setDescriptionEditorMode("write");
  };

  const openCreatePanel = () => {
    const nextDraft: IssueDraft =
      quickScope === "backlog"
        ? {
            ...emptyIssueDraft,
            isBacklog: true,
            status: "Todo",
            priority: "Low",
          }
        : quickScope === "active"
          ? {
              ...emptyIssueDraft,
              isBacklog: false,
              status: "InProgress",
            }
          : {
              ...emptyIssueDraft,
              isBacklog: false,
            };
    setEditingIssueId(null);
    setDraft(nextDraft);
    setInlineSubIssueParentId(null);
    setInlineSubIssueTitle("");
    setInlineSubIssuePriority("Medium");
    setInlineSubIssueAssigneeId(null);
    resetDetailInputs();
    setPanelOpen(true);
  };

  const openEditPanel = (issue: Issue) => {
    setEditingIssueId(issue.id);
    setDraft({
      title: issue.title,
      description: issue.description,
      status: issue.status,
      isBacklog: issue.isBacklog,
      priority: issue.priority,
      assigneeId: issue.assigneeId,
      parentIssueId: issue.parentIssueId,
    });
    setInlineSubIssueParentId(null);
    setInlineSubIssueTitle("");
    setInlineSubIssuePriority("Medium");
    setInlineSubIssueAssigneeId(null);
    resetDetailInputs();
    setPanelOpen(true);
  };

  const setDraftStatus = (status: IssueStatus) => {
    setDraft((current) => ({
      ...current,
      status,
      isBacklog: status === "Todo" ? current.isBacklog : false,
    }));
  };

  const handleWorkflowStatusKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    let nextIndex = ISSUE_STATUSES.findIndex((status) => status === draft.status);

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (nextIndex + 1) % ISSUE_STATUSES.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (nextIndex - 1 + ISSUE_STATUSES.length) % ISSUE_STATUSES.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = ISSUE_STATUSES.length - 1;
    } else {
      return;
    }

    const nextStatus = ISSUE_STATUSES[nextIndex];
    setDraftStatus(nextStatus);
    const nextButton = event.currentTarget.querySelector<HTMLButtonElement>(
      `button[data-status="${nextStatus}"]`,
    );
    nextButton?.focus();
  };

  const insertDescriptionToken = (prefix: string, suffix = "", placeholder = "") => {
    setDescriptionEditorMode("write");
    const textarea = descriptionInputRef.current;

    if (!textarea) {
      setDraft((current) => ({
        ...current,
        description: `${current.description}${prefix}${placeholder}${suffix}`,
      }));
      return;
    }

    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const selectedText = draft.description.slice(start, end);
    const insertBody = selectedText || placeholder;
    const nextValue =
      draft.description.slice(0, start) + prefix + insertBody + suffix + draft.description.slice(end);
    const selectionStart = start + prefix.length;
    const selectionEnd = selectionStart + insertBody.length;

    setDraft((current) => ({
      ...current,
      description: nextValue,
    }));

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  const handleSaveIssue = async () => {
    const title = draft.title.trim();
    if (!title) {
      setToast({ kind: "error", text: "제목은 필수입니다." });
      return;
    }

    if (editingIssueId && draft.parentIssueId === editingIssueId) {
      setToast({ kind: "error", text: "이슈 자신을 상위 이슈로 설정할 수 없습니다." });
      return;
    }

    if (
      editingIssueId &&
      draft.parentIssueId &&
      isDescendantCandidate(issueById, editingIssueId, draft.parentIssueId)
    ) {
      setToast({ kind: "error", text: "자기 하위 이슈 아래로 이동할 수 없습니다." });
      return;
    }

    const currentIssues = (issuesByProject[activeProjectId] ?? []).slice();
    const previousIssue = editingIssueId
      ? currentIssues.find((issue) => issue.id === editingIssueId) ?? null
      : null;
    let createdIssueIdForActivity: string | null = null;
    const selectedParentIssueId = draft.parentIssueId ?? null;
    const resolvedIsBacklog = draft.status === "Todo" && draft.isBacklog;
    const selectedParentIssue = selectedParentIssueId
      ? issueById.get(selectedParentIssueId) ?? null
      : null;

    if (selectedParentIssue?.isBacklog && !resolvedIsBacklog) {
      setToast({
        kind: "error",
        text: "상위 이슈가 Backlog면 하위 이슈도 Backlog 상태여야 합니다.",
      });
      return;
    }

    if (editingIssueId && resolvedIsBacklog) {
      const subtreeIds = collectIssueSubtreeIds(currentIssues, editingIssueId);
      const hasNonBacklogDescendant = currentIssues.some(
        (issue) => issue.id !== editingIssueId && subtreeIds.has(issue.id) && !issue.isBacklog,
      );
      if (hasNonBacklogDescendant) {
        setToast({
          kind: "error",
          text: "상위 이슈를 Backlog로 바꾸려면 하위 이슈도 함께 이동해야 합니다.",
        });
        return;
      }
    }

    if (apiEnabled && editingIssueId) {
      try {
        const updatedIssue = await updateIssueInApi(
          editingIssueId,
          {
            parentIssueId: selectedParentIssueId,
            title,
            description: draft.description.trim(),
            status: draft.status,
            priority: draft.priority,
            assigneeId: draft.assigneeId,
          },
          activeProject.id,
        );
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((issue) =>
            issue.id === editingIssueId
              ? {
                  ...updatedIssue,
                  isBacklog: resolvedIsBacklog,
                  parentIssueId: selectedParentIssueId,
                }
              : issue,
            ),
        }));
      } catch {
        setToast({ kind: "error", text: "API 업데이트에 실패했습니다. 다시 시도해 주세요." });
        return;
      }
    } else if (apiEnabled && !editingIssueId) {
      try {
        const siblingCount = currentIssues.filter((issue) =>
          hasSameParent(issue, selectedParentIssueId),
        ).length;
        const createdIssue = await createIssueInApi(
          {
            projectId: activeProject.apiId,
            parentIssueId: selectedParentIssueId,
            title,
            description: draft.description.trim(),
            status: draft.status,
            priority: draft.priority,
            assigneeId: draft.assigneeId,
            order: siblingCount + 1,
          },
          activeProject.id,
        );
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: [
            ...(current[activeProjectId] ?? []),
            {
              ...createdIssue,
              isBacklog: resolvedIsBacklog,
              parentIssueId: selectedParentIssueId,
            },
          ],
        }));
        createdIssueIdForActivity = createdIssue.id;
      } catch {
        setToast({ kind: "error", text: "API 생성에 실패했습니다. 다시 시도해 주세요." });
        return;
      }
    } else {
      setIssuesByProject((current) => {
        const localIssues = (current[activeProjectId] ?? []).slice();
        const now = new Date().toISOString();

        if (editingIssueId) {
          const currentIssue = localIssues.find((issue) => issue.id === editingIssueId);
          if (!currentIssue) {
            return current;
          }

          const parentChanged = (currentIssue.parentIssueId ?? null) !== selectedParentIssueId;
          if (!parentChanged) {
            return {
              ...current,
              [activeProjectId]: localIssues.map((issue) =>
                issue.id === editingIssueId
                  ? {
                      ...issue,
                      title,
                      description: draft.description.trim(),
                      status: draft.status,
                      isBacklog: resolvedIsBacklog,
                      priority: draft.priority,
                      assigneeId: draft.assigneeId,
                      parentIssueId: selectedParentIssueId,
                      updatedAt: now,
                    }
                  : issue,
              ),
            };
          }

          const previousParentId = currentIssue.parentIssueId ?? null;
          const normalizedWithoutCurrent = reindexSiblingOrder(
            localIssues.filter((issue) => issue.id !== editingIssueId),
            previousParentId,
          );
          const nextOrder =
            normalizedWithoutCurrent.filter((issue) => hasSameParent(issue, selectedParentIssueId)).length + 1;

          return {
            ...current,
            [activeProjectId]: [
              ...normalizedWithoutCurrent,
              {
                ...currentIssue,
                title,
                description: draft.description.trim(),
                status: draft.status,
                isBacklog: resolvedIsBacklog,
                priority: draft.priority,
                assigneeId: draft.assigneeId,
                parentIssueId: selectedParentIssueId,
                order: nextOrder,
                updatedAt: now,
              },
            ],
          };
        }

        const nextOrder =
          localIssues.filter((issue) => hasSameParent(issue, selectedParentIssueId)).length + 1;
        const nextKey = buildNextIssueKey(activeProject.keyPrefix, localIssues);
        const newIssue: Issue = {
          id: `${activeProject.id}-issue-${Date.now()}`,
          key: nextKey,
          projectId: activeProject.id,
          parentIssueId: selectedParentIssueId,
          title,
          description: draft.description.trim(),
          status: draft.status,
          isBacklog: resolvedIsBacklog,
          priority: draft.priority,
          assigneeId: draft.assigneeId,
          order: nextOrder,
          createdAt: now,
          updatedAt: now,
        };

        return {
          ...current,
          [activeProjectId]: [...localIssues, newIssue],
        };
      });
    }

    let cascadedDescendantsCount = 0;
    let cascadeSyncFailed = false;
    if (editingIssueId && draft.status === "Done") {
      const subtreeIds = collectIssueSubtreeIds(currentIssues, editingIssueId);
      subtreeIds.delete(editingIssueId);
      const descendantsToCascade = currentIssues.filter(
        (issue) => subtreeIds.has(issue.id) && (issue.status !== "Done" || issue.isBacklog),
      );
      if (descendantsToCascade.length > 0) {
        const descendantIds = new Set(descendantsToCascade.map((issue) => issue.id));
        if (apiEnabled) {
          try {
            const updatedDescendants = await Promise.all(
              descendantsToCascade.map(async (target) => {
                const updated = await updateIssueInApi(
                  target.id,
                  {
                    parentIssueId: target.parentIssueId,
                    title: target.title,
                    description: target.description,
                    status: "Done",
                    priority: target.priority,
                    assigneeId: target.assigneeId,
                  },
                  activeProject.id,
                );
                return {
                  ...updated,
                  isBacklog: false,
                };
              }),
            );
            const updatedDescendantById = new Map(updatedDescendants.map((issue) => [issue.id, issue]));
            setIssuesByProject((current) => ({
              ...current,
              [activeProjectId]: (current[activeProjectId] ?? []).map((issue) =>
                updatedDescendantById.get(issue.id) ?? issue,
              ),
            }));
          } catch {
            cascadeSyncFailed = true;
          }
        } else {
          const now = new Date().toISOString();
          setIssuesByProject((current) => ({
            ...current,
            [activeProjectId]: (current[activeProjectId] ?? []).map((issue) =>
              descendantIds.has(issue.id)
                ? {
                    ...issue,
                    status: "Done",
                    isBacklog: false,
                    updatedAt: now,
                  }
                : issue,
            ),
          }));
        }
        if (!cascadeSyncFailed) {
          cascadedDescendantsCount = descendantsToCascade.length;
          descendantsToCascade.forEach((descendant) => {
            appendIssueActivity(descendant.id, "상위 이슈 완료로 자동 완료 처리되었습니다.");
          });
        }
      }
    }

    if (editingIssueId && previousIssue) {
      const toAssigneeLabel = (assigneeId: string | null) =>
        assigneeId === null ? "미할당" : assigneeMap.get(assigneeId)?.name ?? "담당자";
      const toParentLabel = (parentIssueId: string | null) => {
        if (parentIssueId === null) {
          return "루트";
        }
        const parentIssue = issueById.get(parentIssueId) ?? null;
        return parentIssue ? `${parentIssue.key}` : "루트";
      };
      const changeLogs: string[] = [];
      if (previousIssue.title !== title) {
        changeLogs.push(`제목 변경: "${previousIssue.title}" → "${title}"`);
      }
      if (previousIssue.status !== draft.status) {
        changeLogs.push(
          `상태 변경: ${formatIssueStatusLabel(previousIssue.status)} → ${formatIssueStatusLabel(draft.status)}`,
        );
      }
      if (previousIssue.priority !== draft.priority) {
        changeLogs.push(
          `우선순위 변경: ${formatIssuePriorityLabel(previousIssue.priority)} → ${formatIssuePriorityLabel(draft.priority)}`,
        );
      }
      if ((previousIssue.assigneeId ?? null) !== (draft.assigneeId ?? null)) {
        changeLogs.push(
          `담당자 변경: ${toAssigneeLabel(previousIssue.assigneeId)} → ${toAssigneeLabel(draft.assigneeId)}`,
        );
      }
      if ((previousIssue.parentIssueId ?? null) !== selectedParentIssueId) {
        changeLogs.push(
          `상위 이슈 변경: ${toParentLabel(previousIssue.parentIssueId ?? null)} → ${toParentLabel(selectedParentIssueId)}`,
        );
      }
      if (previousIssue.isBacklog !== resolvedIsBacklog) {
        changeLogs.push(
          `범위 변경: ${previousIssue.isBacklog ? "Backlog" : "Active"} → ${resolvedIsBacklog ? "Backlog" : "Active"}`,
        );
      }
      if (previousIssue.description.trim() !== draft.description.trim()) {
        changeLogs.push("설명 변경");
      }
      if (changeLogs.length === 0) {
        changeLogs.push("이슈 정보가 수정되었습니다.");
      }
      changeLogs.forEach((message) => appendIssueActivity(editingIssueId, message));
    } else if (createdIssueIdForActivity) {
      appendIssueActivity(createdIssueIdForActivity, "이슈가 생성되었습니다.");
    }

    setToast({
      kind: cascadeSyncFailed ? "error" : "success",
      text: cascadeSyncFailed
        ? "상위 이슈는 저장됐지만 하위 자동 완료 반영 중 API 오류가 발생했습니다."
        : editingIssueId
          ? cascadedDescendantsCount > 0
            ? `이슈를 수정했고 하위 이슈 ${cascadedDescendantsCount}건을 완료 처리했습니다.`
            : "이슈를 수정했습니다."
          : "이슈를 생성했습니다.",
    });
    setPanelOpen(false);
  };

  const resetDragHoverIntent = () => {
    dragHoverRef.current = {
      activeId: null,
      currentOverId: null,
      enteredAtByOverId: {},
      nestParentId: null,
    };
    setDragPreviewParentId(null);
  };

  const handleIssueStatusChange = async (issue: Issue, nextStatus: IssueStatus) => {
    if (issue.status === nextStatus) {
      return;
    }
    if (!canTransitionStatus(issue.status, nextStatus)) {
      setToast({
        kind: "error",
        text: `${formatIssueStatusLabel(issue.status)}에서 ${formatIssueStatusLabel(nextStatus)}로는 변경할 수 없습니다.`,
      });
      return;
    }
    const parentIssue = issue.parentIssueId ? issueById.get(issue.parentIssueId) ?? null : null;
    if (parentIssue?.isBacklog) {
      setToast({
        kind: "error",
        text: "상위 이슈가 Backlog인 경우 하위 이슈는 개별 변경할 수 없습니다.",
      });
      return;
    }
    const isCascadeDone = nextStatus === "Done";
    const subtreeIds = isCascadeDone ? collectIssueSubtreeIds(rawIssues, issue.id) : new Set([issue.id]);
    const targets = rawIssues.filter((candidate) => subtreeIds.has(candidate.id));
    const changedTargets = targets.filter(
      (target) => target.status !== nextStatus || (nextStatus !== "Todo" && target.isBacklog),
    );
    if (changedTargets.length === 0) {
      return;
    }
    const changedTargetIds = new Set(changedTargets.map((target) => target.id));

    if (apiEnabled) {
      try {
        const updatedIssues = await Promise.all(
          changedTargets.map(async (target) => {
            const updatedIssue = await updateIssueInApi(
              target.id,
              {
                parentIssueId: target.parentIssueId,
                title: target.title,
                description: target.description,
                status: nextStatus,
                priority: target.priority,
                assigneeId: target.assigneeId,
              },
              activeProject.id,
            );
            return {
              ...updatedIssue,
              isBacklog: nextStatus === "Todo" ? target.isBacklog : false,
            };
          }),
        );
        const updatedById = new Map(updatedIssues.map((updated) => [updated.id, updated]));

        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
            updatedById.get(candidate.id) ?? candidate,
          ),
        }));
        changedTargets.forEach((target) => {
          appendIssueActivity(
            target.id,
            target.id === issue.id
              ? `상태 변경: ${formatIssueStatusLabel(target.status)} → ${formatIssueStatusLabel(nextStatus)}`
              : "상위 이슈 완료로 자동 완료 처리되었습니다.",
          );
        });
        setToast({
          kind: "success",
          text: isCascadeDone && changedTargets.length > 1
            ? `${issue.key} 및 하위 이슈 ${changedTargets.length - 1}건을 완료 처리했습니다.`
            : `${issue.key} 상태를 ${formatIssueStatusLabel(nextStatus)}로 변경했습니다.`,
        });
      } catch {
        setToast({ kind: "error", text: "API 상태 업데이트에 실패했습니다. 다시 시도해 주세요." });
      }
      return;
    }

    const now = new Date().toISOString();
    setIssuesByProject((current) => ({
      ...current,
      [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
        changedTargetIds.has(candidate.id)
          ? {
              ...candidate,
              status: nextStatus,
              isBacklog: nextStatus === "Todo" ? candidate.isBacklog : false,
              updatedAt: now,
            }
          : candidate,
      ),
    }));
    changedTargets.forEach((target) => {
      appendIssueActivity(
        target.id,
        target.id === issue.id
          ? `상태 변경: ${formatIssueStatusLabel(target.status)} → ${formatIssueStatusLabel(nextStatus)}`
          : "상위 이슈 완료로 자동 완료 처리되었습니다.",
      );
    });
    setToast({
      kind: "success",
      text: isCascadeDone && changedTargets.length > 1
        ? `${issue.key} 및 하위 이슈 ${changedTargets.length - 1}건을 완료 처리했습니다.`
        : `${issue.key} 상태를 ${formatIssueStatusLabel(nextStatus)}로 변경했습니다.`,
    });
  };

  const handleMoveBacklogIssueToActive = async (issue: Issue) => {
    if (!issue.isBacklog) {
      return;
    }
    if (issue.parentIssueId) {
      setToast({
        kind: "error",
        text: "하위 이슈는 상위 이슈와 함께 이동해야 합니다. 상위 이슈에서 이동해 주세요.",
      });
      return;
    }
    const targetIds = collectIssueSubtreeIds(rawIssues, issue.id);
    const targets = rawIssues.filter((candidate) => targetIds.has(candidate.id));

    if (apiEnabled) {
      try {
        const updatedIssues = await Promise.all(
          targets.map(async (target) => {
            const nextStatus: IssueStatus = target.status === "Todo" ? "InProgress" : target.status;
            const updatedIssue = await updateIssueInApi(
              target.id,
              {
                parentIssueId: target.parentIssueId,
                title: target.title,
                description: target.description,
                status: nextStatus,
                priority: target.priority,
                assigneeId: target.assigneeId,
              },
              activeProject.id,
            );
            return {
              ...updatedIssue,
              isBacklog: false,
            };
          }),
        );
        const updatedById = new Map(updatedIssues.map((updated) => [updated.id, updated]));

        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
            updatedById.get(candidate.id) ?? candidate,
          ),
        }));
        targets.forEach((target) => {
          appendIssueActivity(
            target.id,
            "범위 이동: Backlog → Active",
          );
        });
        setRecentMoveFlash({ issueId: issue.id, direction: "toActive" });
        setToast({
          kind: "success",
          text:
            targets.length > 1
              ? `이슈 ${targets.length}건을 Active로 이동했습니다.`
              : "이슈를 Active로 이동했습니다.",
        });
      } catch {
        setToast({ kind: "error", text: "Active 이동에 실패했습니다. 다시 시도해 주세요." });
      }
      return;
    }

    const now = new Date().toISOString();
    setIssuesByProject((current) => ({
      ...current,
      [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
        targetIds.has(candidate.id)
          ? {
              ...candidate,
              isBacklog: false,
              status: candidate.status === "Todo" ? "InProgress" : candidate.status,
              updatedAt: now,
            }
          : candidate,
      ),
    }));
    targets.forEach((target) => {
      appendIssueActivity(target.id, "범위 이동: Backlog → Active");
    });
    setRecentMoveFlash({ issueId: issue.id, direction: "toActive" });
    setToast({
      kind: "success",
      text:
        targets.length > 1
          ? `이슈 ${targets.length}건을 Active로 이동했습니다.`
          : "이슈를 Active로 이동했습니다.",
    });
  };

  const handleMoveActiveIssueToBacklog = async (issue: Issue) => {
    if (issue.isBacklog) {
      return;
    }
    if (issue.parentIssueId) {
      setToast({
        kind: "error",
        text: "하위 이슈는 상위 이슈와 함께 이동해야 합니다. 상위 이슈에서 이동해 주세요.",
      });
      return;
    }
    const targetIds = collectIssueSubtreeIds(rawIssues, issue.id);
    const targets = rawIssues.filter((candidate) => targetIds.has(candidate.id));

    if (apiEnabled) {
      try {
        const updatedIssues = await Promise.all(
          targets.map(async (target) => {
            const updatedIssue = await updateIssueInApi(
              target.id,
              {
                parentIssueId: target.parentIssueId,
                title: target.title,
                description: target.description,
                status: "Todo",
                priority: target.priority,
                assigneeId: target.assigneeId,
              },
              activeProject.id,
            );
            return {
              ...updatedIssue,
              isBacklog: true,
            };
          }),
        );
        const updatedById = new Map(updatedIssues.map((updated) => [updated.id, updated]));

        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
            updatedById.get(candidate.id) ?? candidate,
          ),
        }));
        targets.forEach((target) => {
          appendIssueActivity(target.id, "범위 이동: Active → Backlog");
        });
        setRecentMoveFlash({ issueId: issue.id, direction: "toBacklog" });
        setToast({
          kind: "success",
          text:
            targets.length > 1
              ? `이슈 ${targets.length}건을 Backlog로 이동했습니다.`
              : "이슈를 Backlog로 이동했습니다.",
        });
      } catch {
        setToast({ kind: "error", text: "Backlog 이동에 실패했습니다. 다시 시도해 주세요." });
      }
      return;
    }

    const now = new Date().toISOString();
    setIssuesByProject((current) => ({
      ...current,
      [activeProjectId]: (current[activeProjectId] ?? []).map((candidate) =>
        targetIds.has(candidate.id)
          ? {
              ...candidate,
              isBacklog: true,
              status: "Todo",
              updatedAt: now,
            }
          : candidate,
      ),
    }));
    targets.forEach((target) => {
      appendIssueActivity(target.id, "범위 이동: Active → Backlog");
    });
    setRecentMoveFlash({ issueId: issue.id, direction: "toBacklog" });
    setToast({
      kind: "success",
      text:
        targets.length > 1
          ? `이슈 ${targets.length}건을 Backlog로 이동했습니다.`
          : "이슈를 Backlog로 이동했습니다.",
    });
  };

  const createSubIssueUnderParent = async (
    parentIssue: Issue,
    rawTitle: string,
    options?: { priority?: IssuePriority; assigneeId?: string | null },
  ) => {
    const title = rawTitle.trim();
    if (!title) {
      setToast({ kind: "error", text: "하위 이슈 제목은 필수입니다." });
      return false;
    }
    const priority = options?.priority ?? "Medium";
    const assigneeId =
      options?.assigneeId === undefined ? parentIssue.assigneeId : options.assigneeId;

    const currentIssues = (issuesByProject[activeProjectId] ?? []).slice();
    const nextOrder =
      currentIssues.filter((issue) => hasSameParent(issue, parentIssue.id)).length + 1;
    let createdIssueForLog: Issue | null = null;

    if (apiEnabled) {
      try {
        const created = await createIssueInApi(
          {
            projectId: activeProject.apiId,
            parentIssueId: parentIssue.id,
            title,
            description: "",
            status: "Todo",
            priority,
            assigneeId,
            order: nextOrder,
          },
          activeProject.id,
        );
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: [...(current[activeProjectId] ?? []), { ...created, isBacklog: parentIssue.isBacklog }],
        }));
        createdIssueForLog = { ...created, isBacklog: parentIssue.isBacklog };
      } catch {
        setToast({ kind: "error", text: "API 하위 이슈 생성에 실패했습니다." });
        return false;
      }
    } else {
      const now = new Date().toISOString();
      const newIssue: Issue = {
        id: `${activeProject.id}-issue-${Date.now()}`,
        key: buildNextIssueKey(activeProject.keyPrefix, currentIssues),
        projectId: activeProject.id,
        parentIssueId: parentIssue.id,
        title,
        description: "",
        status: "Todo",
        isBacklog: parentIssue.isBacklog,
        priority,
        assigneeId,
        order: nextOrder,
        createdAt: now,
        updatedAt: now,
      };
      setIssuesByProject((current) => ({
        ...current,
        [activeProjectId]: [...(current[activeProjectId] ?? []), newIssue],
      }));
      createdIssueForLog = newIssue;
    }

    setExpandedIssueIds((previous) => {
      const next = new Set(previous);
      next.add(parentIssue.id);
      return next;
    });
    if (createdIssueForLog) {
      appendIssueActivity(parentIssue.id, `하위 이슈 추가: ${createdIssueForLog.title}`);
      appendIssueActivity(createdIssueForLog.id, "이슈가 생성되었습니다.");
    }
    setToast({ kind: "success", text: "하위 이슈를 생성했습니다." });
    return true;
  };

  const handleCreateSubIssue = async () => {
    if (!selectedIssue) {
      return;
    }

    const created = await createSubIssueUnderParent(selectedIssue, subIssueDraftTitle);
    if (created) {
      setSubIssueDraftTitle("");
    }
  };

  const openInlineSubIssueComposer = (parentIssue: Issue) => {
    setInlineSubIssueParentId(parentIssue.id);
    setInlineSubIssueTitle("");
    setInlineSubIssuePriority(parentIssue.priority);
    setInlineSubIssueAssigneeId(parentIssue.assigneeId);
    setExpandedIssueIds((previous) => {
      const next = new Set(previous);
      next.add(parentIssue.id);
      return next;
    });
  };

  const closeInlineSubIssueComposer = () => {
    setInlineSubIssueParentId(null);
    setInlineSubIssueTitle("");
    setInlineSubIssuePriority("Medium");
    setInlineSubIssueAssigneeId(null);
  };

  const submitInlineSubIssue = async () => {
    if (!inlineSubIssueParentId) {
      return;
    }
    const parentIssue = issueById.get(inlineSubIssueParentId) ?? null;
    if (!parentIssue) {
      closeInlineSubIssueComposer();
      return;
    }

    const created = await createSubIssueUnderParent(parentIssue, inlineSubIssueTitle, {
      priority: inlineSubIssuePriority,
      assigneeId: inlineSubIssueAssigneeId,
    });
    if (created) {
      closeInlineSubIssueComposer();
    }
  };

  const handleSaveSubIssueEdit = async (subIssue: Issue) => {
    const nextTitle = subIssueEditingTitle.trim();
    if (!nextTitle) {
      setToast({ kind: "error", text: "하위 이슈 제목은 필수입니다." });
      return;
    }

    if (apiEnabled) {
      try {
        const updated = await updateIssueInApi(
          subIssue.id,
          {
            parentIssueId: subIssue.parentIssueId,
            title: nextTitle,
            description: subIssue.description,
            status: subIssue.status,
            priority: subIssue.priority,
            assigneeId: subIssue.assigneeId,
          },
          activeProject.id,
        );
        setIssuesByProject((current) => ({
          ...current,
          [activeProjectId]: (current[activeProjectId] ?? []).map((issue) =>
            issue.id === subIssue.id
              ? {
                  ...updated,
                  isBacklog: issue.isBacklog,
                }
              : issue,
          ),
        }));
      } catch {
        setToast({ kind: "error", text: "API 하위 이슈 수정에 실패했습니다." });
        return;
      }
    } else {
      const now = new Date().toISOString();
      setIssuesByProject((current) => ({
        ...current,
        [activeProjectId]: (current[activeProjectId] ?? []).map((issue) =>
          issue.id === subIssue.id
            ? {
                ...issue,
                title: nextTitle,
                updatedAt: now,
              }
            : issue,
        ),
      }));
    }

    setSubIssueEditingId(null);
    setSubIssueEditingTitle("");
    if (subIssue.title !== nextTitle) {
      appendIssueActivity(subIssue.id, `제목 변경: "${subIssue.title}" → "${nextTitle}"`);
      if (subIssue.parentIssueId) {
        appendIssueActivity(subIssue.parentIssueId, `하위 이슈 수정: ${subIssue.key} 제목 변경`);
      }
    }
    setToast({ kind: "success", text: "하위 이슈를 수정했습니다." });
  };

  const handleDeleteIssue = async (issueToDelete: Issue) => {
    const projectIssues = (issuesByProject[activeProjectId] ?? []).slice();
    const subtreeIds = collectIssueSubtreeIds(projectIssues, issueToDelete.id);
    const parentIssue = issueToDelete.parentIssueId
      ? projectIssues.find((issue) => issue.id === issueToDelete.parentIssueId) ?? null
      : null;

    if (apiEnabled) {
      try {
        await deleteIssueInApi(issueToDelete.id);
      } catch {
        setToast({ kind: "error", text: "API 이슈 삭제에 실패했습니다." });
        return;
      }
    }

    setIssuesByProject((current) => {
      const currentProjectIssues = (current[activeProjectId] ?? []).filter((issue) => !subtreeIds.has(issue.id));
      const normalized = reindexSiblingOrder(currentProjectIssues, issueToDelete.parentIssueId ?? null);
      return {
        ...current,
        [activeProjectId]: normalized,
      };
    });

    setCommentsByIssue((current) => {
      const next = { ...current };
      subtreeIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });
    setActivityByIssue((current) => {
      const next = { ...current };
      subtreeIds.forEach((id) => {
        delete next[id];
      });
      return next;
    });

    if (subIssueEditingId && subtreeIds.has(subIssueEditingId)) {
      setSubIssueEditingId(null);
      setSubIssueEditingTitle("");
    }
    if (editingIssueId && subtreeIds.has(editingIssueId)) {
      setEditingIssueId(null);
      setPanelOpen(false);
      setDraft(emptyIssueDraft);
      resetDetailInputs();
    }
    setRowActionMenuIssueId((current) => {
      if (!current) {
        return null;
      }
      return subtreeIds.has(current) ? null : current;
    });
    if (parentIssue && !subtreeIds.has(parentIssue.id)) {
      appendIssueActivity(parentIssue.id, `하위 이슈 삭제: ${issueToDelete.key} ${issueToDelete.title}`);
    }
    setToast({
      kind: "success",
      text: subtreeIds.size > 1 ? "이슈와 하위 이슈를 삭제했습니다." : "이슈를 삭제했습니다.",
    });
  };

  const handleDeleteSubIssue = async (subIssue: Issue) => {
    await handleDeleteIssue(subIssue);
  };

  const handleAddComment = () => {
    if (!selectedIssue) {
      return;
    }

    const body = commentDraft.trim();
    if (!body) {
      return;
    }

    if (!currentUser) {
      return;
    }

    const newComment: IssueComment = {
      id: `comment-${selectedIssue.id}-${Date.now()}`,
      issueId: selectedIssue.id,
      authorId: currentUser.id,
      body,
      createdAt: new Date().toISOString(),
    };

    setCommentsByIssue((current) => ({
      ...current,
      [selectedIssue.id]: [...(current[selectedIssue.id] ?? []), newComment],
    }));
    setCommentDraft("");
  };

  const onDragOver = (event: DragOverEvent) => {
    if (!reorderEnabled) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (overId && overId !== activeId) {
      const projectIssues = issuesByProject[activeProjectId] ?? [];
      const activeIssue = projectIssues.find((issue) => issue.id === activeId) ?? null;
      const overIssue = projectIssues.find((issue) => issue.id === overId) ?? null;
      if (activeIssue && overIssue) {
        const sourceParentId = activeIssue.parentIssueId ?? null;
        const destinationParentId = overIssue.parentIssueId ?? null;
        if (sourceParentId !== destinationParentId) {
          const feedbackKey = `${activeId}:${overId}`;
          if (blockedDragToastRef.current !== feedbackKey) {
            blockedDragToastRef.current = feedbackKey;
            setDragConstraintNotice("드래그 순서 변경은 동일 상위 레벨에서만 가능합니다.");
            setToast({
              kind: "error",
              text: "드래그 순서 변경은 동일 상위 레벨에서만 가능합니다.",
            });
          }
        }
      }
    }

    dragHoverRef.current = {
      activeId,
      currentOverId: overId,
      enteredAtByOverId: {},
      nestParentId: null,
    };
    setDragPreviewParentId(null);
  };

  const onDragStart = (event: DragStartEvent) => {
    blockedDragToastRef.current = null;
    setDragConstraintNotice(null);
    setDraggingIssueId(String(event.active.id));
  };

  const onDragEnd = (event: DragEndEvent) => {
    const hoverIntent = dragHoverRef.current;
    blockedDragToastRef.current = null;
    resetDragHoverIntent();
    setDraggingIssueId(null);

    if (!reorderEnabled) {
      return;
    }
    const { active, over } = event;
    const resolvedOverId = over ? String(over.id) : hoverIntent.currentOverId;
    if (!resolvedOverId || String(active.id) === resolvedOverId) {
      return;
    }

    const currentIssues = (issuesByProject[activeProjectId] ?? []).slice();
    const activeIssue = currentIssues.find((issue) => issue.id === active.id);
    const overIssue = currentIssues.find((issue) => issue.id === resolvedOverId);
    if (!activeIssue || !overIssue) {
      return;
    }

    const sourceParentId = activeIssue.parentIssueId ?? null;
    const destinationParentId = overIssue.parentIssueId ?? null;
    if (sourceParentId !== destinationParentId) {
      setDragConstraintNotice("드래그 순서 변경은 동일 상위 레벨에서만 가능합니다.");
      setToast({
        kind: "error",
        text: "드래그 순서 변경은 동일 상위 레벨에서만 가능합니다.",
      });
      return;
    }

    setDragConstraintNotice(null);

    const now = new Date().toISOString();
    let destinationOrderedIds: string[] = [];
    let updatedIssues: Issue[] = [];

    const siblings = currentIssues
      .filter((issue) => hasSameParent(issue, sourceParentId))
      .slice()
      .sort(compareIssueOrder);
    const oldIndex = siblings.findIndex((issue) => issue.id === active.id);
    const newIndex = siblings.findIndex((issue) => issue.id === resolvedOverId);
    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const reorderedSiblings = arrayMove(siblings, oldIndex, newIndex).map((issue, index) => ({
      ...issue,
      order: index + 1,
      updatedAt: issue.id === activeIssue.id ? now : issue.updatedAt,
    }));
    destinationOrderedIds = reorderedSiblings.map((issue) => issue.id);
    const byId = new Map(reorderedSiblings.map((issue) => [issue.id, issue]));
    updatedIssues = currentIssues.map((issue) => byId.get(issue.id) ?? issue);

    setIssuesByProject((current) => ({
      ...current,
      [activeProjectId]: updatedIssues,
    }));

    if (apiEnabled) {
      const originalIssues = currentIssues;
      void (async () => {
        try {
          const synced = await reorderIssuesInApi(
            activeProject.apiId,
            destinationOrderedIds,
            activeProject.id,
          );
          const backlogById = new Map(currentIssues.map((issue) => [issue.id, issue.isBacklog]));
          setIssuesByProject((current) => ({
            ...current,
            [activeProjectId]: synced.map((issue) => ({
              ...issue,
              isBacklog: backlogById.get(issue.id) ?? issue.isBacklog,
            })),
          }));
        } catch {
          setIssuesByProject((current) => ({
            ...current,
            [activeProjectId]: originalIssues,
          }));
          setToast({ kind: "error", text: "API 드래그 반영에 실패해 이전 순서로 복원했습니다." });
        }
      })();
    }
  };

  const selectedIssue =
    editingIssueId === null ? null : rawIssues.find((issue) => issue.id === editingIssueId) ?? null;
  const selectedParentIssue =
    selectedIssue?.parentIssueId ? issueById.get(selectedIssue.parentIssueId) ?? null : null;
  const selectedSubIssues = useMemo(
    () =>
      selectedIssue
        ? rawIssues
            .filter((issue) => issue.parentIssueId === selectedIssue.id)
            .slice()
            .sort(compareIssueOrder)
        : [],
    [rawIssues, selectedIssue],
  );
  const selectedComments = useMemo(
    () =>
      selectedIssue
        ? (commentsByIssue[selectedIssue.id] ?? [])
            .slice()
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        : [],
    [commentsByIssue, selectedIssue],
  );
  const selectedActivityEntries = useMemo(
    () =>
      selectedIssue
        ? (activityByIssue[selectedIssue.id] ?? [])
            .slice()
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [],
    [activityByIssue, selectedIssue],
  );
  const parentOptions = useMemo(
    () =>
      rawIssues
        .slice()
        .sort(compareIssueOrder)
        .filter((issue) => {
          if (!editingIssueId) {
            return true;
          }
          if (issue.id === editingIssueId) {
            return false;
          }
          return !isDescendantCandidate(issueById, editingIssueId, issue.id);
        }),
    [editingIssueId, issueById, rawIssues],
  );
  const filteredParentOptions = useMemo(() => {
    const queryText = parentIssueQuery.trim().toLowerCase();
    if (!queryText) {
      return parentOptions;
    }
    return parentOptions.filter((issue) => {
      const haystack = `${issue.key} ${issue.title}`.toLowerCase();
      return haystack.includes(queryText);
    });
  }, [parentIssueQuery, parentOptions]);
  const descriptionPreviewHtml = useMemo(() => renderMarkdownToHtml(draft.description), [draft.description]);

  const isLoadingState = effectiveMode === "loading" || apiSyncing;
  const backlogIssueCount = useMemo(
    () => rawIssues.filter((issue) => issue.isBacklog).length,
    [rawIssues],
  );
  const activeIssueCount = useMemo(
    () => rawIssues.filter((issue) => !issue.isBacklog && issue.status !== "Done" && issue.status !== "Cancel").length,
    [rawIssues],
  );
  const doneIssueCount = useMemo(
    () => rawIssues.filter((issue) => issue.status === "Done").length,
    [rawIssues],
  );
  const selectedFilterPreset = useMemo(
    () => filterPresets.find((preset) => preset.id === selectedFilterPresetId) ?? null,
    [filterPresets, selectedFilterPresetId],
  );
  const isPureBacklogView = quickScope === "backlog" && query.trim().length === 0;
  const hasActiveViewFilters =
    query.trim().length > 0 || statusFilter !== "All" || hideCompleted || quickScope !== "all";
  const draftAssigneeName = draft.assigneeId
    ? assigneeMap.get(draft.assigneeId)?.name ?? "담당자 없음"
    : "담당자 없음";
  const draftScopeLabel = draft.isBacklog ? "Backlog" : "Active";
  const tableHeaderHeightClass =
    tableDensity === "compact" ? "h-9" : tableDensity === "comfortable" ? "h-11" : "h-10";

  const sheet = (
    <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
      <SheetContent className="p-0">
        <SheetHeader className="px-5 py-4 sm:px-6">
          <div className="pr-8">
            {!editingIssueId ? (
              <p className="mb-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {activeProject.keyPrefix} &gt; New issue
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              <SheetTitle className="text-base">{editingIssueId ? "이슈 상세" : "새 이슈"}</SheetTitle>
              {selectedIssue ? <Badge variant="default">{selectedIssue.key}</Badge> : null}
            </div>
            <SheetDescription className="mt-1 text-xs">
              {editingIssueId
                ? "왼쪽에서 핵심 필드를 수정하고, 오른쪽에서 메타데이터와 활동 내역을 확인하세요."
                : `${activeProject.name}에 새 이슈를 생성합니다. 생성 후 댓글과 활동 기능을 사용할 수 있습니다.`}
            </SheetDescription>
            {!editingIssueId ? (
              <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  className="inline-flex h-6 items-center rounded-md border border-slate-300 bg-slate-100 px-2 text-[11px] font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  onClick={() =>
                    setDraft((current) =>
                      current.isBacklog
                        ? { ...current, isBacklog: false, status: "InProgress" }
                        : { ...current, isBacklog: true, status: "Todo" },
                    )
                  }
                >
                  {draftScopeLabel}
                </button>
                <span className="inline-flex h-6 items-center rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Priority {formatIssuePriorityLabel(draft.priority)}
                </span>
                <span className="inline-flex h-6 items-center rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Assignee {draftAssigneeName}
                </span>
                <span className="inline-flex h-6 items-center rounded-md border border-slate-200 bg-white px-2 text-[11px] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Project {activeProject.keyPrefix}
                </span>
              </div>
            ) : null}
          </div>
        </SheetHeader>

        <div className="grid min-h-0 flex-1 grid-cols-1 bg-white dark:bg-[#0b1018] lg:grid-cols-[minmax(0,1fr)_400px]">
          <IssueDetailLeftPanel
            draft={draft}
            onDraftChange={setDraft}
            descriptionEditorMode={descriptionEditorMode}
            onDescriptionModeChange={setDescriptionEditorMode}
            onInsertDescriptionToken={insertDescriptionToken}
            descriptionInputRef={descriptionInputRef}
            descriptionPreviewHtml={descriptionPreviewHtml}
            onWorkflowStatusKeyDown={handleWorkflowStatusKeyDown}
            statusMeta={statusMeta}
            priorityMeta={priorityMeta}
            onSetDraftStatus={setDraftStatus}
            assignees={mockAssignees}
            onSetAssignee={(assigneeId) =>
              setDraft((current) => ({
                ...current,
                assigneeId,
              }))
            }
            onSetRootParent={() =>
              setDraft((current) => ({
                ...current,
                parentIssueId: null,
              }))
            }
            onParentIssueSelect={(parentIssueId) =>
              setDraft((current) => ({
                ...current,
                parentIssueId,
              }))
            }
            parentIssueQuery={parentIssueQuery}
            onParentIssueQueryChange={setParentIssueQuery}
            filteredParentOptions={filteredParentOptions}
            selectedIssue={selectedIssue}
            selectedSubIssues={selectedSubIssues}
            subIssueDraftTitle={subIssueDraftTitle}
            onSubIssueDraftTitleChange={setSubIssueDraftTitle}
            onCreateSubIssue={() => void handleCreateSubIssue()}
            subIssueEditingId={subIssueEditingId}
            subIssueEditingTitle={subIssueEditingTitle}
            onSubIssueEditingTitleChange={setSubIssueEditingTitle}
            onSaveSubIssueEdit={(subIssue) => void handleSaveSubIssueEdit(subIssue)}
            onStartSubIssueEdit={(subIssue) => {
              setSubIssueEditingId(subIssue.id);
              setSubIssueEditingTitle(subIssue.title);
            }}
            onCancelSubIssueEdit={() => {
              setSubIssueEditingId(null);
              setSubIssueEditingTitle("");
            }}
            onDeleteSubIssue={(subIssue) => void handleDeleteSubIssue(subIssue)}
            onSubIssueStatusChange={(subIssue, status) => void handleIssueStatusChange(subIssue, status)}
          />

          <IssueDetailRightPanel
            selectedIssue={selectedIssue}
            selectedParentIssue={selectedParentIssue}
            activeProjectName={activeProject.name}
            selectedComments={selectedComments}
            selectedActivityEntries={selectedActivityEntries}
            commentDraft={commentDraft}
            onCommentDraftChange={setCommentDraft}
            onAddComment={handleAddComment}
            currentUserName={currentUser?.name ?? "현재 사용자"}
            assigneeMap={assigneeMap}
            formatStatusLabel={formatIssueStatusLabel}
            formatDateTime={formatDateTime}
            formatRelativeTime={formatRelativeTime}
            formatActivityDayLabel={formatActivityDayLabel}
            isSameCalendarDay={isSameCalendarDay}
            priorityBadgeVariant={issuePriorityBadgeVariant}
          />
        </div>

        <SheetFooter className="px-5 py-3 sm:px-6">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setPanelOpen(false)}>
              취소
            </Button>
            <Button size="sm" onClick={() => void handleSaveIssue()} disabled={draft.title.trim().length === 0}>
              {editingIssueId ? "변경사항 저장" : "이슈 생성"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );

  return (
    <BoardPageView
        activeProjectKeyPrefix={activeProject.keyPrefix}
        activeProjectName={activeProject.name}
        apiEnabled={apiEnabled}
        apiSyncing={apiSyncing}
        canToggleExpandCollapse={parentIdsWithChildren.size > 0}
        onExpandAll={expandAllIssues}
        onCollapseAll={collapseAllIssues}
        sheet={sheet}
        toast={toast}
      >

          <IssueToolbar
            showDevStateToggles={showDevStateToggles}
            onVisualModeChange={setVisualMode}
            onCreateIssue={openCreatePanel}
            query={query}
            onQueryChange={setQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            hideCompleted={hideCompleted}
            onHideCompletedChange={setHideCompleted}
            completedIssueCount={completedIssueCount}
            visibleIssueCount={issuesForView.length}
            totalIssueCount={rawIssues.length}
            filterPresetOptions={filterPresets.map((preset) => ({
              id: preset.id,
              name: preset.name,
              summary: formatFilterPresetSummary(preset.filters),
            }))}
            selectedFilterPresetId={selectedFilterPresetId}
            selectedFilterPresetSummary={
              selectedFilterPreset ? formatFilterPresetSummary(selectedFilterPreset.filters) : null
            }
            onFilterPresetChange={applyFilterPresetById}
            onSaveFilterPreset={saveCurrentFilterPreset}
            onDeleteFilterPreset={deleteCurrentFilterPreset}
            tableDensity={tableDensity}
            onTableDensityChange={setTableDensity}
          />

          {quickScope === "backlog" ? (
            <div className="border-b border-slate-200 bg-slate-50/60 px-2.5 py-1.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-[#101722] dark:text-slate-300">
              <span className="font-semibold text-slate-800 dark:text-slate-100">Backlog:</span>{" "}
              아직 우선순위가 확정되지 않은 신규 이슈와 아이디어를 모아두는 대기 영역입니다.
            </div>
          ) : null}

          <section className="px-2 pb-2 pt-2 sm:px-3 sm:pb-3 sm:pt-2.5">
            {effectiveMode === "error" ? (
              <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50/70 px-3 py-2 dark:border-rose-900 dark:bg-rose-950/20">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-300" />
                    <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
                      이슈를 불러오지 못했습니다. 네트워크 상태를 확인한 뒤 다시 시도하세요.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-rose-200 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    onClick={() => {
                      setVisualMode("ready");
                      setToast({ kind: "success", text: "오류 상태에서 복구했습니다." });
                    }}
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    다시 시도
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="mb-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <SegmentedTabs
                value={quickScope}
                onChange={applyQuickScope}
                tone="neutral"
                options={[
                  { value: "all", label: `전체 ${rawIssues.length}` },
                  { value: "active", label: `Active ${activeIssueCount}` },
                  { value: "backlog", label: `Backlog ${backlogIssueCount}` },
                ]}
              />
              <button
                type="button"
                onClick={() => setHideCompleted(!hideCompleted)}
                className={cn(
                  "inline-flex h-6 items-center rounded-md border px-2 font-medium transition",
                  hideCompleted
                    ? "border-emerald-300 bg-emerald-600 text-white dark:border-emerald-800 dark:bg-emerald-500 dark:text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                )}
                title={hideCompleted ? "완료 이슈 숨김 해제" : "완료 이슈 숨김"}
              >
                Done {doneIssueCount}
              </button>
              {selectedIssue ? (
                <span className="inline-flex h-6 items-center rounded-md border border-blue-200 bg-blue-50 px-2 font-medium text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                  선택 {selectedIssue.key}
                </span>
              ) : null}
            </div>

            {selectedIssueIds.length > 0 ? (
              <div className="mb-2 flex flex-wrap items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50/70 px-2.5 py-2 text-xs text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-100">
                <span className="font-semibold">{selectedIssueIds.length}건 선택됨</span>
                <Select
                  value={bulkStatusValue}
                  onValueChange={(value) => {
                    setBulkStatusValue(value);
                    if (value === "__none__") {
                      return;
                    }
                    void applyBulkStatusChange(value as IssueStatus);
                    setBulkStatusValue("__none__");
                  }}
                >
                  <SelectTrigger className="h-8 w-[128px] bg-white text-xs dark:bg-slate-950">
                    <SelectValue placeholder="상태 변경" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">상태 변경</SelectItem>
                    {ISSUE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatIssueStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={bulkPriorityValue}
                  onValueChange={(value) => {
                    setBulkPriorityValue(value);
                    if (value === "__none__") {
                      return;
                    }
                    void applyBulkPriorityChange(value as IssuePriority);
                    setBulkPriorityValue("__none__");
                  }}
                >
                  <SelectTrigger className="h-8 w-[128px] bg-white text-xs dark:bg-slate-950">
                    <SelectValue placeholder="우선순위 변경" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">우선순위 변경</SelectItem>
                    {ISSUE_PRIORITIES.map((priority) => (
                      <SelectItem key={priority} value={priority}>
                        {formatIssuePriorityLabel(priority)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={bulkAssigneeValue}
                  onValueChange={(value) => {
                    setBulkAssigneeValue(value);
                    if (value === "__none__") {
                      return;
                    }
                    void applyBulkAssigneeChange(value === "__unassigned__" ? null : value);
                    setBulkAssigneeValue("__none__");
                  }}
                >
                  <SelectTrigger className="h-8 w-[140px] bg-white text-xs dark:bg-slate-950">
                    <SelectValue placeholder="담당자 변경" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">담당자 변경</SelectItem>
                    <SelectItem value="__unassigned__">미할당</SelectItem>
                    {mockAssignees.map((assignee) => (
                      <SelectItem key={assignee.id} value={assignee.id}>
                        {assignee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="h-8 text-xs" size="sm" variant="outline" onClick={() => void applyBulkScopeMove(false)}>
                  Active 이동
                </Button>
                <Button className="h-8 text-xs" size="sm" variant="outline" onClick={() => void applyBulkScopeMove(true)}>
                  Backlog 이동
                </Button>
                <Button className="h-8 text-xs" size="sm" variant="ghost" onClick={clearIssueSelection}>
                  선택 해제
                </Button>
              </div>
            ) : null}

            {lastBulkUndo ? (
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/25 dark:text-amber-100">
                <p className="min-w-0 truncate">
                  최근 일괄 작업: {lastBulkUndo.label} ({lastBulkUndo.previousIssues.length}건)
                </p>
                <Button className="h-8 text-xs" size="sm" variant="outline" onClick={() => void undoLastBulkAction()}>
                  실행취소
                </Button>
              </div>
            ) : null}

            {dragConstraintNotice ? (
              <div className="mb-2 rounded-lg border border-amber-300 bg-amber-50/85 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                {dragConstraintNotice}
              </div>
            ) : null}

            <div className="max-h-[calc(100vh-290px)] overflow-auto rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c1018]">
              {isLoadingState ? (
                <BoardSkeleton />
              ) : issuesForView.length === 0 ? (
                isPureBacklogView ? (
                  <BacklogEmptyState onCreate={openCreatePanel} onViewAll={() => applyQuickScope("all")} />
                ) : hasActiveViewFilters ? (
                  <FilteredEmptyState
                    onResetFilters={() => setFilters(defaultBoardFilters)}
                    onCreate={openCreatePanel}
                  />
                ) : (
                  <EmptyState onCreate={openCreatePanel} />
                )
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={onDragStart}
                  onDragOver={onDragOver}
                  onDragCancel={() => {
                    resetDragHoverIntent();
                    setDraggingIssueId(null);
                  }}
                  onDragEnd={onDragEnd}
                >
                  <Table>
                    <TableHeader className="sticky top-0 z-20 bg-slate-50 dark:bg-[#141925]">
                      <TableRow className={tableHeaderHeightClass}>
                        <TableHead className={cn(tableHeaderHeightClass, "w-9 px-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")}>
                          <input
                            type="checkbox"
                            checked={allVisibleSelected}
                            onChange={toggleSelectAllVisible}
                            aria-label="현재 목록 전체 선택"
                            className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                        </TableHead>
                        <TableHead className={cn(tableHeaderHeightClass, "w-10 px-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")} />
                        <TableHead className={cn(tableHeaderHeightClass, "w-24 px-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")}>키</TableHead>
                        <TableHead className={cn(tableHeaderHeightClass, "px-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")}>제목</TableHead>
                        <TableHead className={cn(tableHeaderHeightClass, "w-[150px] px-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")}>상태</TableHead>
                        <TableHead className={cn(tableHeaderHeightClass, "w-[96px] px-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")}>우선순위</TableHead>
                        <TableHead className={cn(tableHeaderHeightClass, "w-[170px] px-3 text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")}>담당자</TableHead>
                        <TableHead className={cn(tableHeaderHeightClass, "w-[120px] px-3 text-right text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")}>최근 수정</TableHead>
                        <TableHead className={cn(tableHeaderHeightClass, "w-14 px-3 text-right text-[10px] font-semibold uppercase tracking-[0.04em] text-slate-500")}>작업</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <SortableContext
                        items={issuesForView.map((row) => row.issue.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {issuesForView.map((row) => (
                          <Fragment key={row.issue.id}>
                            <IssueRow
                              key={row.issue.id}
                              issue={row.issue}
                              depth={row.depth}
                              hasChildren={row.hasChildren}
                              childCount={row.childCount}
                              isExpanded={row.isExpanded}
                              isNestTarget={dragPreviewParentId === row.issue.id}
                              draggingIssueId={draggingIssueId}
                              onToggleExpand={() => toggleIssueExpand(row.issue.id)}
                              onStatusSet={(status) => void handleIssueStatusChange(row.issue, status)}
                              isStatusLocked={
                                Boolean(
                                  row.issue.parentIssueId &&
                                  (issueById.get(row.issue.parentIssueId)?.isBacklog ?? false),
                                )
                              }
                              assigneeName={assigneeMap.get(row.issue.assigneeId ?? "")?.name ?? "담당자 없음"}
                              isChecked={selectedIssueIdSet.has(row.issue.id)}
                              onToggleChecked={(shiftKey) =>
                                toggleIssueSelectionByIntent(row.issue.id, shiftKey)
                              }
                              isSelected={selectedIssue?.id === row.issue.id}
                              moveFlashDirection={
                                recentMoveFlash?.issueId === row.issue.id ? recentMoveFlash.direction : null
                              }
                              draggable={reorderEnabled}
                              isActionMenuOpen={rowActionMenuIssueId === row.issue.id}
                              rowDensity={tableDensity}
                              onToggleActionMenu={() =>
                                setRowActionMenuIssueId((current) => (current === row.issue.id ? null : row.issue.id))
                              }
                              onQuickAddSubIssue={() => {
                                setRowActionMenuIssueId(null);
                                openInlineSubIssueComposer(row.issue);
                              }}
                              onQuickEdit={() => {
                                setRowActionMenuIssueId(null);
                                openEditPanel(row.issue);
                              }}
                              onQuickDelete={() => {
                                setRowActionMenuIssueId(null);
                                const ok = window.confirm(
                                  "이슈를 삭제할까요? 하위 이슈도 함께 삭제됩니다.",
                                );
                                if (!ok) {
                                  return;
                                }
                                void handleDeleteIssue(row.issue);
                              }}
                              onMoveToActive={() => {
                                setRowActionMenuIssueId(null);
                                void handleMoveBacklogIssueToActive(row.issue);
                              }}
                              onMoveToBacklog={() => {
                                setRowActionMenuIssueId(null);
                                void handleMoveActiveIssueToBacklog(row.issue);
                              }}
                              onClick={() => openEditPanel(row.issue)}
                            />
                            {inlineSubIssueParentId === row.issue.id ? (
                              <TableRow key={`${row.issue.id}-inline-subissue`} className="h-11 bg-blue-50/45 dark:bg-blue-950/20">
                                <TableCell />
                                <TableCell colSpan={8} className="px-3 py-2">
                                  <div
                                    className="flex items-center gap-2"
                                    style={{ paddingLeft: `${row.depth * 18 + 24}px` }}
                                    onPointerDown={(event) => event.stopPropagation()}
                                  >
                                    <Input
                                      ref={inlineSubIssueInputRef}
                                      value={inlineSubIssueTitle}
                                      onChange={(event) => setInlineSubIssueTitle(event.target.value)}
                                      onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                          event.preventDefault();
                                          void submitInlineSubIssue();
                                        }
                                        if (event.key === "Escape") {
                                          event.preventDefault();
                                          closeInlineSubIssueComposer();
                                        }
                                      }}
                                      placeholder="하위 이슈 제목 입력"
                                      className="h-8 max-w-[520px] text-xs"
                                      onPointerDown={(event) => event.stopPropagation()}
                                    />
                                    <Select
                                      value={inlineSubIssuePriority}
                                      onValueChange={(value) => setInlineSubIssuePriority(value as IssuePriority)}
                                    >
                                      <SelectTrigger
                                        className="h-8 w-[108px] text-xs"
                                        onPointerDown={(event) => event.stopPropagation()}
                                      >
                                        <SelectValue placeholder="우선순위" />
                                      </SelectTrigger>
                                      <SelectContent onPointerDown={(event) => event.stopPropagation()}>
                                        {ISSUE_PRIORITIES.map((priority) => (
                                          <SelectItem key={priority} value={priority}>
                                            {formatIssuePriorityLabel(priority)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Select
                                      value={inlineSubIssueAssigneeId ?? "__unassigned__"}
                                      onValueChange={(value) =>
                                        setInlineSubIssueAssigneeId(value === "__unassigned__" ? null : value)
                                      }
                                    >
                                      <SelectTrigger
                                        className="h-8 w-[132px] text-xs"
                                        onPointerDown={(event) => event.stopPropagation()}
                                      >
                                        <SelectValue placeholder="담당자" />
                                      </SelectTrigger>
                                      <SelectContent onPointerDown={(event) => event.stopPropagation()}>
                                        <SelectItem value="__unassigned__">미할당</SelectItem>
                                        {mockAssignees.map((assignee) => (
                                          <SelectItem key={assignee.id} value={assignee.id}>
                                            {assignee.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <Button className="h-8 text-xs" size="sm" onClick={() => void submitInlineSubIssue()}>
                                      추가
                                    </Button>
                                    <Button className="h-8 text-xs" size="sm" variant="outline" onClick={closeInlineSubIssueComposer}>
                                      취소
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ) : null}
                          </Fragment>
                        ))}
                      </SortableContext>
                    </TableBody>
                  </Table>
                </DndContext>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-2.5 py-2 text-xs text-slate-600 dark:border-slate-800 dark:bg-[#101722] dark:text-slate-300">
              <p className="min-w-0 truncate">상위 이슈 이동 시 하위 이슈는 자동 동반 이동, Backlog 이동 시 상태는 Todo로 정규화됩니다.</p>
              <Button className="h-7" onClick={openCreatePanel}>
                <Plus className="h-4 w-4" />
                새 이슈 만들기
              </Button>
            </div>
          </section>
    </BoardPageView>
  );
}

interface IssueRowProps {
  issue: Issue;
  depth: number;
  hasChildren: boolean;
  childCount: number;
  isExpanded: boolean;
  isNestTarget: boolean;
  draggingIssueId: string | null;
  onToggleExpand: () => void;
  onStatusSet: (status: IssueStatus) => void;
  isStatusLocked: boolean;
  assigneeName: string;
  draggable: boolean;
  isChecked: boolean;
  onToggleChecked: (shiftKey: boolean) => void;
  isSelected: boolean;
  moveFlashDirection: MoveFlashDirection | null;
  rowDensity: TableDensity;
  isActionMenuOpen: boolean;
  onToggleActionMenu: () => void;
  onQuickAddSubIssue: () => void;
  onQuickEdit: () => void;
  onQuickDelete: () => void;
  onMoveToActive: () => void;
  onMoveToBacklog: () => void;
  onClick: () => void;
}

function IssueRow({
  issue,
  depth,
  hasChildren,
  childCount,
  isExpanded,
  isNestTarget,
  draggingIssueId,
  onToggleExpand,
  onStatusSet,
  isStatusLocked,
  assigneeName,
  draggable,
  isChecked,
  onToggleChecked,
  isSelected,
  moveFlashDirection,
  rowDensity,
  isActionMenuOpen,
  onToggleActionMenu,
  onQuickAddSubIssue,
  onQuickEdit,
  onQuickDelete,
  onMoveToActive,
  onMoveToBacklog,
  onClick,
}: IssueRowProps) {
  const isCompleted = issue.status === "Done";
  const rowBaseClass =
    rowDensity === "compact"
      ? "h-10 [&>td]:py-1"
      : rowDensity === "comfortable"
        ? "h-14 [&>td]:py-2"
        : "h-12 [&>td]:py-1.5";
  const statusTriggerClass =
    rowDensity === "compact" ? "h-6" : rowDensity === "comfortable" ? "h-8" : "h-7";
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: issue.id, disabled: !draggable });
  const freezeSiblingMotion = draggingIssueId !== null && draggingIssueId !== issue.id;
  const style = {
    transform: freezeSiblingMotion ? undefined : CSS.Transform.toString(transform),
    transition: freezeSiblingMotion ? undefined : transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      data-state={isSelected ? "selected" : undefined}
      className={cn(
        "border-l-2 border-l-transparent [&>td]:align-middle [&>td]:px-3 transition-all",
        rowBaseClass,
        isDragging ? "bg-blue-50/90 border-l-blue-400 dark:bg-blue-950/35 dark:border-l-blue-500" : undefined,
        draggable ? "cursor-grab" : undefined,
        isCompleted
          ? "bg-slate-100/75 text-slate-500 saturate-50 dark:bg-slate-900/60 dark:text-slate-400"
          : undefined,
        moveFlashDirection === "toActive"
          ? "bg-emerald-50/85 border-l-emerald-400 ring-1 ring-inset ring-emerald-300 dark:bg-emerald-950/35 dark:border-l-emerald-600 dark:ring-emerald-800"
          : undefined,
        moveFlashDirection === "toBacklog"
          ? "bg-violet-50/85 border-l-violet-400 ring-1 ring-inset ring-violet-300 dark:bg-violet-950/35 dark:border-l-violet-600 dark:ring-violet-800"
          : undefined,
        isNestTarget ? "bg-blue-50/90 ring-1 ring-inset ring-blue-300 dark:bg-blue-950/40 dark:ring-blue-800" : undefined,
      )}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
    >
      <TableCell className="w-9">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(event) => {
            const native = event.nativeEvent as MouseEvent | KeyboardEvent;
            const shiftKey = "shiftKey" in native ? native.shiftKey : false;
            onToggleChecked(shiftKey);
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          aria-label={`${issue.key} 선택`}
          className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </TableCell>
      <TableCell>
        <button
          type="button"
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center rounded text-slate-400",
            draggable ? "hover:bg-slate-100" : "cursor-not-allowed opacity-40",
          )}
          onClick={(event) => event.preventDefault()}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>
      <TableCell
        className={cn(
          "text-[11px] font-semibold text-slate-500",
          isCompleted ? "text-slate-400 dark:text-slate-500" : undefined,
        )}
      >
        {issue.key}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 18}px` }}>
          <button
            type="button"
            className={cn(
              "inline-flex h-5 w-5 items-center justify-center rounded text-slate-500",
              hasChildren ? "hover:bg-slate-100" : "cursor-default opacity-0",
            )}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              if (hasChildren) {
                onToggleExpand();
              }
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )
            ) : (
              <span className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            className={cn(
              "w-full text-left text-sm font-medium text-slate-800 dark:text-slate-100",
              isCompleted
                ? "text-slate-500 line-through decoration-2 decoration-slate-400/80 blur-[0.2px] dark:text-slate-400 dark:decoration-slate-500"
                : undefined,
            )}
            onClick={onClick}
          >
            {issue.title}
          </button>
          {issue.isBacklog ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  Backlog
                </span>
              </TooltipTrigger>
              <TooltipContent>
                우선순위가 확정되지 않은 대기 이슈
              </TooltipContent>
            </Tooltip>
          ) : null}
          {isNestTarget ? (
            <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/60 dark:text-blue-200">
              하위 이슈로 이동
            </span>
          ) : null}
          {childCount > 0 ? (
            <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
              +{childCount}
            </span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Select
          value={issue.status}
          onValueChange={(value) => onStatusSet(value as IssueStatus)}
          disabled={isStatusLocked}
        >
          <SelectTrigger
            className={cn(
              statusTriggerClass,
              "w-[132px] border-slate-200 bg-slate-50 px-2 text-xs",
              isStatusLocked ? "opacity-70" : undefined,
              isCompleted
                ? "border-slate-200/80 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-400"
                : undefined,
            )}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className={cn("flex items-center gap-2 text-slate-700", isCompleted ? "text-slate-500 dark:text-slate-400" : undefined)}>
              {issue.status === "Todo" ? <Circle className="h-3.5 w-3.5" /> : null}
              {issue.status === "InProgress" ? <RefreshCcw className="h-3.5 w-3.5" /> : null}
              {issue.status === "Done" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : null}
              {issue.status === "Cancel" ? <X className="h-3.5 w-3.5 text-rose-600" /> : null}
              <SelectValue>{formatIssueStatusLabel(issue.status)}</SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent onClick={(event) => event.stopPropagation()}>
            <SelectItem value="Todo" disabled={!canTransitionStatus(issue.status, "Todo")}>
              <div className="flex items-center gap-2">
                <Circle className="h-3.5 w-3.5" />
                {formatIssueStatusLabel("Todo")}
              </div>
            </SelectItem>
            <SelectItem value="InProgress" disabled={!canTransitionStatus(issue.status, "InProgress")}>
              <div className="flex items-center gap-2">
                <RefreshCcw className="h-3.5 w-3.5" />
                {formatIssueStatusLabel("InProgress")}
              </div>
            </SelectItem>
            <SelectItem value="Done" disabled={!canTransitionStatus(issue.status, "Done")}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                {formatIssueStatusLabel("Done")}
              </div>
            </SelectItem>
            <SelectItem value="Cancel" disabled={!canTransitionStatus(issue.status, "Cancel")}>
              <div className="flex items-center gap-2">
                <X className="h-3.5 w-3.5 text-rose-600" />
                {formatIssueStatusLabel("Cancel")}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Badge
          variant={issuePriorityBadgeVariant(issue.priority)}
          className={cn(
            "min-w-[52px] justify-center",
            isCompleted ? "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400" : undefined,
          )}
        >
          {formatIssuePriorityLabel(issue.priority)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback>{initials(assigneeName)}</AvatarFallback>
          </Avatar>
          <span className={cn("text-xs text-slate-600", isCompleted ? "text-slate-500 dark:text-slate-400" : undefined)}>
            {assigneeName}
          </span>
        </div>
      </TableCell>
      <TableCell className={cn("text-right text-xs text-slate-500", isCompleted ? "text-slate-400 dark:text-slate-500" : undefined)}>
        {formatRelativeTime(issue.updatedAt)}
      </TableCell>
      <TableCell className="text-right">
        <IssueRowActionMenu
          open={isActionMenuOpen}
          isCompleted={isCompleted}
          isBacklog={issue.isBacklog}
          canMoveBetweenScopes={issue.parentIssueId === null}
          canMoveToBacklog={!issue.isBacklog}
          onToggle={onToggleActionMenu}
          onPromoteFromBacklog={onMoveToActive}
          onMoveToBacklog={onMoveToBacklog}
          onAddSubIssue={onQuickAddSubIssue}
          onEdit={onQuickEdit}
          onDelete={onQuickDelete}
        />
      </TableCell>
    </TableRow>
  );
}

function BoardSkeleton() {
  return (
    <div className="p-4">
      <Skeleton className="mb-4 h-10 w-full" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[28px_32px_80px_1fr_120px_110px_160px_90px_64px] gap-3">
            <Skeleton className="h-10 w-6" />
            <Skeleton className="h-10 w-8" />
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 px-6 py-8 text-center shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
        <div className="mb-3 rounded-full border border-slate-200 bg-white p-3 text-slate-500 dark:border-slate-700 dark:bg-slate-900">
          <Plus className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">이슈가 아직 없습니다</h3>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
          첫 이슈를 생성해 보드 작업을 시작하세요. 생성 후 상세 패널에서 언제든 수정할 수 있습니다.
        </p>
        <Button className="mt-5" onClick={onCreate}>
          <Plus className="h-4 w-4" />
          이슈 생성
        </Button>
      </div>
    </div>
  );
}

function BacklogEmptyState({
  onCreate,
  onViewAll,
}: {
  onCreate: () => void;
  onViewAll: () => void;
}) {
  return (
    <div className="px-4 py-16">
      <div className="mx-auto flex max-w-xl flex-col rounded-2xl border border-slate-200 bg-white px-7 py-7 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="mb-4 grid w-12 grid-cols-2 gap-1.5 text-slate-400 dark:text-slate-500">
          <Circle className="h-5 w-5" />
          <Circle className="h-5 w-5" />
          <Circle className="h-5 w-5" />
          <Circle className="h-5 w-5" />
        </div>
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Backlog issues</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          Backlog는 아직 우선순위가 확정되지 않은 신규 이슈와 아이디어를 모아두는 영역입니다.
        </p>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          실제 작업을 시작할 때 상태를 진행 중으로 변경하면 Active 영역으로 이동합니다.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button onClick={onCreate}>
            <Plus className="h-4 w-4" />
            새 이슈 생성
          </Button>
          <Button variant="outline" onClick={onViewAll}>
            전체 이슈 보기
          </Button>
        </div>
      </div>
    </div>
  );
}

function FilteredEmptyState({
  onResetFilters,
  onCreate,
}: {
  onResetFilters: () => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <div className="max-w-[520px] space-y-1.5">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">조건에 맞는 이슈가 없습니다.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          검색어/상태/완료 숨김/범위 필터를 조정하거나 초기화하면 다시 확인할 수 있습니다.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onResetFilters}>
          필터 초기화
        </Button>
        <Button size="sm" className="h-8 text-xs" onClick={onCreate}>
          새 이슈 만들기
        </Button>
      </div>
    </div>
  );
}




