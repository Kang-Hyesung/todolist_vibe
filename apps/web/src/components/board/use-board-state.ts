import { useCallback, useState } from "react";
import type { IssueDraft, IssuePriority } from "../../types/domain";
import type { BoardFilters, FilterPreset, TableDensity, VisualMode } from "./board-page.types";
import { defaultBoardFilters } from "./board-page.constants";
import type { FilterStatus } from "./issue-labels";
import type { BulkUndoState, ToastMessage } from "./board-page.types";

export function useBoardFilterState(initialFilters: BoardFilters = defaultBoardFilters) {
  const [filters, setFilters] = useState<BoardFilters>(initialFilters);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>([]);
  const [selectedFilterPresetId, setSelectedFilterPresetId] = useState<string>("__none__");
  const [visualMode, setVisualMode] = useState<VisualMode>("ready");
  const [tableDensity, setTableDensity] = useState<TableDensity>("default");

  const setQuery = useCallback((value: string) => {
    setFilters((current) => ({ ...current, query: value }));
  }, []);

  const setStatusFilter = useCallback((value: FilterStatus) => {
    setFilters((current) => ({ ...current, status: value }));
  }, []);

  const setHideCompleted = useCallback((hide: boolean) => {
    setFilters((current) => ({ ...current, completion: hide ? "hideDone" : "all" }));
  }, []);

  return {
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
  };
}

export function useBoardEditorState(initialDraft: IssueDraft) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [draft, setDraft] = useState<IssueDraft>(initialDraft);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [descriptionEditorMode, setDescriptionEditorMode] = useState<"write" | "preview">(
    "write",
  );

  return {
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
  };
}

export function useBoardInteractionState() {
  const [subIssueDraftTitle, setSubIssueDraftTitle] = useState("");
  const [subIssueEditingId, setSubIssueEditingId] = useState<string | null>(null);
  const [subIssueEditingTitle, setSubIssueEditingTitle] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [parentIssueQuery, setParentIssueQuery] = useState("");
  const [rowActionMenuIssueId, setRowActionMenuIssueId] = useState<string | null>(null);
  const [inlineSubIssueParentId, setInlineSubIssueParentId] = useState<string | null>(null);
  const [inlineSubIssueTitle, setInlineSubIssueTitle] = useState("");
  const [inlineSubIssuePriority, setInlineSubIssuePriority] = useState<IssuePriority>("Medium");
  const [inlineSubIssueAssigneeId, setInlineSubIssueAssigneeId] = useState<string | null>(null);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [lastSelectionAnchorId, setLastSelectionAnchorId] = useState<string | null>(null);
  const [bulkStatusValue, setBulkStatusValue] = useState<string>("__none__");
  const [bulkPriorityValue, setBulkPriorityValue] = useState<string>("__none__");
  const [bulkAssigneeValue, setBulkAssigneeValue] = useState<string>("__none__");
  const [lastBulkUndo, setLastBulkUndo] = useState<BulkUndoState | null>(null);

  return {
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
  };
}
