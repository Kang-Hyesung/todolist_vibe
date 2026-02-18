import {
  ArrowRight,
  Building2,
  CalendarClock,
  FolderKanban,
  PencilLine,
  Plus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import type { Project, Workspace, WorkspacePlan, WorkspaceStatus } from "../../types/domain";
import { WORKSPACE_PLANS, WORKSPACE_STATUSES } from "../../types/domain";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { EmptyState } from "../ui/empty-state";
import { Input } from "../ui/input";
import { ManagementFilterBar } from "./management-filter-bar";
import { MetricCard } from "../ui/metric-card";
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
import { SegmentedTabs } from "../ui/segmented-tabs";
import { Skeleton } from "../ui/skeleton";
import { Textarea } from "../ui/textarea";
import { workspaceStatusBadgeTone } from "./management-status-tone";

export interface WorkspaceMutationInput {
  name: string;
  plan: WorkspacePlan;
  status: WorkspaceStatus;
  memberCount: number;
  lead: string | null;
  summary: string;
  description: string;
}

interface WorkspaceManagementPageProps {
  workspaces: Workspace[];
  projects: Project[];
  activeWorkspaceId: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onCreateWorkspace: (input: WorkspaceMutationInput) => void;
  onUpdateWorkspace: (workspaceId: string, input: WorkspaceMutationInput) => void;
  onDeleteWorkspace: (workspaceId: string) => void;
  onNavigateIssues: () => void;
  onNavigateProjects: () => void;
}

const emptyWorkspaceDraft: WorkspaceMutationInput = {
  name: "",
  plan: "Team",
  status: "Active",
  memberCount: 6,
  lead: null,
  summary: "",
  description: "",
};

const statusLabelByStatus: Record<WorkspaceStatus, string> = {
  Active: "운영 중",
  Paused: "보류",
  Archived: "보관",
};
type WorkspaceCanvasTab = "overview" | "activity" | "docs";
type ManagementVisualMode = "ready" | "loading" | "error";

function formatDate(value: string | null) {
  if (!value) {
    return "미설정";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "미설정";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "시간 정보 없음";
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function WorkspaceManagementPage({
  workspaces,
  projects,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onUpdateWorkspace,
  onDeleteWorkspace,
  onNavigateIssues,
  onNavigateProjects,
}: WorkspaceManagementPageProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | WorkspaceStatus>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [draft, setDraft] = useState<WorkspaceMutationInput>(emptyWorkspaceDraft);
  const [formError, setFormError] = useState<string | null>(null);
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [quickDraft, setQuickDraft] = useState<{
    status: WorkspaceStatus;
    plan: WorkspacePlan;
    lead: string;
    memberCount: string;
  }>({
    status: "Active",
    plan: "Team",
    lead: "",
    memberCount: "1",
  });
  const [canvasTab, setCanvasTab] = useState<WorkspaceCanvasTab>("overview");
  const [workspaceDocs, setWorkspaceDocs] = useState<Record<string, string>>({});
  const [visualMode, setVisualMode] = useState<ManagementVisualMode>("ready");
  const [booting, setBooting] = useState(true);
  const showDevStateToggles = import.meta.env.DEV;

  const projectsByWorkspace = useMemo(() => {
    return projects.reduce<Record<string, Project[]>>((acc, project) => {
      if (!acc[project.workspaceId]) {
        acc[project.workspaceId] = [];
      }
      acc[project.workspaceId].push(project);
      return acc;
    }, {});
  }, [projects]);

  const filteredWorkspaces = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return workspaces.filter((workspace) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        workspace.name.toLowerCase().includes(normalizedQuery) ||
        workspace.slug.toLowerCase().includes(normalizedQuery) ||
        workspace.summary.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "all" || workspace.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [query, statusFilter, workspaces]);
  const workspaceFilterChips = useMemo(() => {
    if (statusFilter === "all") {
      return [];
    }
    return [
      {
        id: "status",
        label: `상태 ${statusLabelByStatus[statusFilter]}`,
        onRemove: () => setStatusFilter("all"),
        tone: "accent" as const,
      },
    ];
  }, [statusFilter]);

  const activeWorkspace = useMemo(
    () =>
      workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
      filteredWorkspaces[0] ??
      workspaces[0] ??
      null,
    [activeWorkspaceId, filteredWorkspaces, workspaces],
  );

  const activeCount = useMemo(
    () => workspaces.filter((workspace) => workspace.status === "Active").length,
    [workspaces],
  );
  const totalMembers = useMemo(
    () => workspaces.reduce((sum, workspace) => sum + workspace.memberCount, 0),
    [workspaces],
  );

  const activeLinkedProjects = activeWorkspace ? projectsByWorkspace[activeWorkspace.id] ?? [] : [];
  const activeDeleteBlocked = !activeWorkspace || activeLinkedProjects.length > 0 || workspaces.length <= 1;
  const activeWorkspaceDoc = activeWorkspace ? (workspaceDocs[activeWorkspace.id] ?? "") : "";
  const effectiveMode: ManagementVisualMode = booting ? "loading" : visualMode;
  const quickMemberCount = Number.parseInt(quickDraft.memberCount || "0", 10);
  const quickMemberCountValid = Number.isFinite(quickMemberCount) && quickMemberCount >= 1;
  const quickDirty = useMemo(() => {
    if (!activeWorkspace) {
      return false;
    }
    return (
      quickDraft.status !== activeWorkspace.status ||
      quickDraft.plan !== activeWorkspace.plan ||
      (quickDraft.lead.trim() || null) !== (activeWorkspace.lead ?? null) ||
      quickMemberCount !== activeWorkspace.memberCount
    );
  }, [activeWorkspace, quickDraft, quickMemberCount]);
  const workspaceActivity = useMemo(() => {
    if (!activeWorkspace) {
      return [];
    }
    const items = [
      {
        id: "created",
        title: "워크스페이스 생성",
        detail: "조직 컨테이너가 생성되었습니다.",
        timestamp: activeWorkspace.createdAt,
      },
      {
        id: "updated",
        title: "운영 속성 업데이트",
        detail: `상태 ${statusLabelByStatus[activeWorkspace.status]} / 멤버 ${activeWorkspace.memberCount.toLocaleString("ko-KR")}명`,
        timestamp: activeWorkspace.updatedAt,
      },
      {
        id: "projects",
        title: "연결 프로젝트 집계",
        detail: `현재 ${activeLinkedProjects.length}개 프로젝트가 연결되어 있습니다.`,
        timestamp: activeWorkspace.updatedAt,
      },
    ];
    return items;
  }, [activeLinkedProjects.length, activeWorkspace]);

  useEffect(() => {
    if (!activeWorkspace) {
      return;
    }
    // Intentional state sync: refresh inspector draft when selected workspace changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuickDraft({
      status: activeWorkspace.status,
      plan: activeWorkspace.plan,
      lead: activeWorkspace.lead ?? "",
      memberCount: String(activeWorkspace.memberCount),
    });
    setQuickNotice(null);
  }, [activeWorkspace]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setBooting(false), 450);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const openCreate = () => {
    setEditingWorkspaceId(null);
    setDraft(emptyWorkspaceDraft);
    setFormError(null);
    setSheetOpen(true);
  };

  const openEdit = (workspace: Workspace) => {
    setEditingWorkspaceId(workspace.id);
    setDraft({
      name: workspace.name,
      plan: workspace.plan,
      status: workspace.status,
      memberCount: workspace.memberCount,
      lead: workspace.lead,
      summary: workspace.summary,
      description: workspace.description,
    });
    setFormError(null);
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    const name = draft.name.trim();
    if (name.length < 2) {
      setFormError("워크스페이스 이름은 2자 이상이어야 합니다.");
      return;
    }
    if (draft.memberCount < 1) {
      setFormError("멤버 수는 1명 이상이어야 합니다.");
      return;
    }

    const payload: WorkspaceMutationInput = {
      ...draft,
      name,
      summary: draft.summary.trim(),
      description: draft.description.trim(),
      lead: draft.lead?.trim() ? draft.lead.trim() : null,
    };

    if (editingWorkspaceId) {
      onUpdateWorkspace(editingWorkspaceId, payload);
    } else {
      onCreateWorkspace(payload);
    }
    setSheetOpen(false);
  };

  const handleQuickSave = () => {
    if (!activeWorkspace) {
      return;
    }
    if (!quickMemberCountValid) {
      setQuickNotice("멤버 수는 1명 이상이어야 합니다.");
      return;
    }
    onUpdateWorkspace(activeWorkspace.id, {
      name: activeWorkspace.name,
      plan: quickDraft.plan,
      status: quickDraft.status,
      memberCount: quickMemberCount,
      lead: quickDraft.lead.trim() ? quickDraft.lead.trim() : null,
      summary: activeWorkspace.summary,
      description: activeWorkspace.description,
    });
    setQuickNotice("운영 속성을 저장했습니다.");
  };

  const handleWorkspaceDocChange = (value: string) => {
    if (!activeWorkspace) {
      return;
    }
    setWorkspaceDocs((current) => ({
      ...current,
      [activeWorkspace.id]: value,
    }));
  };

  return (
    <div className="min-h-0 px-1 pb-8 pt-1 sm:px-1">
      <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="flex h-[calc(100vh-136px)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-sm dark:border-border-subtle dark:bg-surface-0">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
              Organization Hub
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">워크스페이스 디렉터리</h2>
              <span className="text-[11px] tabular-nums text-ink-muted">
                총 {workspaces.length}
              </span>
            </div>
          </div>

          <ManagementFilterBar
            query={query}
            onQueryChange={setQuery}
            queryPlaceholder="워크스페이스명/슬러그/요약 검색"
            resultCount={filteredWorkspaces.length}
            resultLabel="결과"
            chips={workspaceFilterChips}
            onClearAll={() => {
              setStatusFilter("all");
              setQuery("");
            }}
            rightControl={
              <div className="grid gap-2">
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | WorkspaceStatus)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="상태" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    {WORKSPACE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>{statusLabelByStatus[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="h-9 w-full" onClick={openCreate}>
                  <Plus className="h-4 w-4" />
                  워크스페이스 생성
                </Button>
              </div>
            }
          />

          <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
            {filteredWorkspaces.length === 0 ? (
              <EmptyState
                icon={Building2}
                title="워크스페이스 없음"
                description="검색 조건을 바꾸거나 새 워크스페이스를 생성하세요."
              />
            ) : (
              filteredWorkspaces.map((workspace) => {
                const isActive = activeWorkspace?.id === workspace.id;
                const linkedProjects = projectsByWorkspace[workspace.id] ?? [];
                return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => onSelectWorkspace(workspace.id)}
                    className={cn(
                      "w-full rounded-lg border px-2.5 py-2 text-left transition",
                      isActive
                        ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/25"
                        : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-100 dark:hover:border-slate-800 dark:hover:bg-slate-900/70",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{workspace.name}</p>
                          <span className={cn("whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[10px] font-medium", workspaceStatusBadgeTone(workspace.status))}>
                        {statusLabelByStatus[workspace.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-ink-muted">{workspace.slug}</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">프로젝트 {linkedProjects.length}개</p>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-auto border-t border-border-subtle px-3 py-2 dark:border-border-subtle">
            <div className="grid grid-cols-2 gap-1.5">
              <MetricCard label="운영 중" value={activeCount} compact />
              <MetricCard label="총 멤버" value={totalMembers} compact />
            </div>
          </div>
        </aside>

        <section className="h-[calc(100vh-136px)] overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-sm dark:border-border-subtle dark:bg-surface-0">
          {!activeWorkspace ? (
            <div className="p-6">
              <EmptyState icon={Building2} title="선택된 워크스페이스가 없습니다" description="좌측 목록에서 선택해 주세요." />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">
                      Workspace Control Plane
                    </p>
                    <h1 className="mt-1 truncate text-[26px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-100">
                      {activeWorkspace.name}
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {activeWorkspace.summary || "요약이 없습니다."}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className={cn("whitespace-nowrap rounded-full border px-2 py-0.5 font-semibold", workspaceStatusBadgeTone(activeWorkspace.status))}>
                        {statusLabelByStatus[activeWorkspace.status]}
                      </span>
                      <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 font-medium text-ink-muted dark:border-border-subtle dark:bg-surface-1 dark:text-ink-muted">
                        플랜 {activeWorkspace.plan}
                      </span>
                      <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 font-medium text-ink-muted dark:border-border-subtle dark:bg-surface-1 dark:text-ink-muted">
                        멤버 {activeWorkspace.memberCount.toLocaleString("ko-KR")}명
                      </span>
                      <span className="truncate text-ink-muted">{activeWorkspace.slug}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={onNavigateProjects}>
                      <FolderKanban className="h-3.5 w-3.5" />
                      프로젝트
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={onNavigateIssues}>
                      이슈 보드
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" className="h-8 px-2.5 text-xs" onClick={() => openEdit(activeWorkspace)}>
                      <PencilLine className="h-3.5 w-3.5" />
                      수정
                    </Button>
                    {showDevStateToggles ? (
                      <div className="inline-flex h-8 items-center gap-1 rounded-md border border-border-subtle bg-surface-1 px-1 dark:border-border-subtle dark:bg-surface-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setVisualMode("ready")}>기본</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setVisualMode("loading")}>로딩</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setVisualMode("error")}>오류</Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-2 border-b border-border-subtle px-5 py-2.5 sm:grid-cols-3 dark:border-border-subtle">
                <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 dark:border-border-subtle dark:bg-surface-1">
                  <p className="text-[11px] text-ink-muted">플랜</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activeWorkspace.plan}</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 dark:border-border-subtle dark:bg-surface-1">
                  <p className="text-[11px] text-ink-muted">멤버 수</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activeWorkspace.memberCount.toLocaleString("ko-KR")}명</p>
                </div>
                <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 dark:border-border-subtle dark:bg-surface-1">
                  <p className="text-[11px] text-ink-muted">연결 프로젝트</p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{activeLinkedProjects.length}개</p>
                </div>
              </div>

              <div className="border-b border-border-subtle px-5 py-2 dark:border-border-subtle">
                <SegmentedTabs
                  value={canvasTab}
                  onChange={setCanvasTab}
                  tone="emerald"
                  options={[
                    { value: "overview", label: "조직 개요" },
                    { value: "activity", label: "운영 로그" },
                    { value: "docs", label: "운영 문서" },
                  ]}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-auto p-4">
                {effectiveMode === "loading" ? (
                  <WorkspaceCommandCenterLoadingState />
                ) : effectiveMode === "error" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900 dark:bg-rose-950/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                        워크스페이스 데이터를 불러오지 못했습니다. 다시 시도해 주세요.
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 border-rose-200 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/40"
                        onClick={() => setVisualMode("ready")}
                      >
                        <RefreshCcw className="h-3.5 w-3.5" />
                        다시 시도
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                {canvasTab === "overview" ? (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <article className="rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle lg:col-span-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Organization Charter</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {activeWorkspace.description || "설명이 없습니다."}
                      </p>
                    </article>

                    <article className="rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Portfolio Snapshot</p>
                      {activeLinkedProjects.length === 0 ? (
                        <p className="mt-2 text-sm text-ink-muted">연결된 프로젝트가 없습니다.</p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {activeLinkedProjects.map((project) => (
                            <div key={project.id} className="flex items-center justify-between rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 text-sm dark:border-border-subtle dark:bg-surface-1">
                              <span className="truncate text-slate-700 dark:text-slate-200">{project.keyPrefix} · {project.name}</span>
                              <Badge variant="progress">{project.type}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>

                    <article className="rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Operational Baseline</p>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <span className={cn("whitespace-nowrap rounded-full border px-2 py-0.5 font-semibold", workspaceStatusBadgeTone(activeWorkspace.status))}>{statusLabelByStatus[activeWorkspace.status]}</span>
                        <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 font-medium text-ink-muted">플랜 {activeWorkspace.plan}</span>
                        <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 font-medium text-ink-muted">멤버 {activeWorkspace.memberCount.toLocaleString("ko-KR")}명</span>
                      </div>
                      <dl className="mt-2 space-y-1.5 text-xs">
                        <div className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2">
                          <dt className="text-ink-muted">생성일:</dt>
                          <dd className="text-right font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatDate(activeWorkspace.createdAt)}</dd>
                        </div>
                        <div className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2">
                          <dt className="text-ink-muted">수정일:</dt>
                          <dd className="text-right font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatDate(activeWorkspace.updatedAt)}</dd>
                        </div>
                      </dl>
                    </article>
                  </div>
                ) : null}

                {canvasTab === "activity" ? (
                  <article className="rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle dark:bg-surface-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">최근 활동</p>
                    <div className="mt-2 space-y-2">
                      {workspaceActivity.map((item) => (
                        <div key={item.id} className="grid grid-cols-[12px_minmax(0,1fr)] gap-2">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500/70" />
                          <div className="rounded-lg border border-border-subtle bg-surface-1 px-3 py-2 dark:border-border-subtle dark:bg-surface-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{item.title}</p>
                              <p className="text-[11px] tabular-nums text-ink-muted">
                                {formatDateTime(item.timestamp)}
                              </p>
                            </div>
                            <p className="mt-1 text-xs text-ink-muted">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </article>
                ) : null}

                {canvasTab === "docs" ? (
                  <article className="rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle dark:bg-surface-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">운영 문서</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      워크스페이스 운영 원칙, 의사결정 로그, 협업 규칙을 기록합니다.
                    </p>
                    <Textarea
                      className="mt-3 min-h-[320px] resize-y"
                      value={activeWorkspaceDoc}
                      onChange={(event) => handleWorkspaceDocChange(event.target.value)}
                      placeholder="운영 문서를 작성해 주세요."
                    />
                    <p className="mt-2 text-[11px] text-ink-muted">
                      {activeWorkspaceDoc.length.toLocaleString("ko-KR")}자
                    </p>
                  </article>
                ) : null}
                  </>
                )}
              </div>
            </div>
          )}
        </section>

        <aside className="h-[calc(100vh-136px)] overflow-y-auto rounded-2xl border border-border-subtle bg-surface-0 p-4 shadow-sm dark:border-border-subtle dark:bg-surface-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">Operations Controls</p>
          {!activeWorkspace ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">좌측에서 워크스페이스를 선택해 주세요.</p>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="rounded-xl border border-border-subtle bg-surface-0 p-3 dark:border-border-subtle dark:bg-surface-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{activeWorkspace.name}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{activeWorkspace.slug}</p>
              </div>

              <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-0 p-3 dark:border-border-subtle dark:bg-surface-0">
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">상태</span>
                  <Select
                    value={quickDraft.status}
                    onValueChange={(value) =>
                      setQuickDraft((current) => ({ ...current, status: value as WorkspaceStatus }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKSPACE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {statusLabelByStatus[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">플랜</span>
                  <Select
                    value={quickDraft.plan}
                    onValueChange={(value) =>
                      setQuickDraft((current) => ({ ...current, plan: value as WorkspacePlan }))
                    }
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORKSPACE_PLANS.map((plan) => (
                        <SelectItem key={plan} value={plan}>
                          {plan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">리드</span>
                  <Input
                    className="h-8"
                    value={quickDraft.lead}
                    onChange={(event) => setQuickDraft((current) => ({ ...current, lead: event.target.value }))}
                    placeholder="리드"
                  />
                </div>
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">멤버 수</span>
                  <Input
                    className={cn("h-8", !quickMemberCountValid ? "border-rose-300 focus-visible:ring-rose-200 dark:border-rose-800" : "")}
                    type="number"
                    min={1}
                    value={quickDraft.memberCount}
                    onChange={(event) =>
                      setQuickDraft((current) => ({ ...current, memberCount: event.target.value }))
                    }
                  />
                </div>
                <Button className="h-8 w-full" size="sm" disabled={!quickDirty || !quickMemberCountValid} onClick={handleQuickSave}>
                  <CalendarClock className="h-3.5 w-3.5" />
                  운영 속성 저장
                </Button>
                <Button
                  className="h-8 w-full"
                  size="sm"
                  variant="outline"
                  disabled={activeDeleteBlocked}
                  onClick={() => {
                    if (!activeWorkspace) {
                      return;
                    }
                    const ok = window.confirm("워크스페이스를 삭제할까요?");
                    if (!ok) {
                      return;
                    }
                    onDeleteWorkspace(activeWorkspace.id);
                  }}
                  title={activeLinkedProjects.length > 0 ? "연결된 프로젝트가 있으면 삭제할 수 없습니다." : undefined}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  워크스페이스 삭제
                </Button>
                <p
                  className={cn(
                    "text-[11px]",
                    quickNotice
                      ? "text-emerald-700 dark:text-emerald-300"
                      : quickDirty
                        ? "text-amber-600 dark:text-amber-300"
                          : "text-ink-muted",
                  )}
                >
                  {quickNotice ?? (quickDirty ? "저장되지 않은 변경 사항이 있습니다." : "변경 사항이 없습니다.")}
                </p>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-0 p-3 text-xs dark:border-border-subtle dark:bg-surface-0">
                <p className="font-medium text-slate-700 dark:text-slate-200">현재 구조</p>
                <p className="mt-1 text-ink-muted">
                  워크스페이스 {workspaces.length}개 / 프로젝트 {projects.length}개
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:w-[min(1120px,calc(100vw-28px))]">
          <SheetHeader>
            <SheetTitle>{editingWorkspaceId ? "워크스페이스 수정" : "새 워크스페이스"}</SheetTitle>
            <SheetDescription>조직 정보(왼쪽)와 운영 속성(오른쪽)을 분리해 입력합니다.</SheetDescription>
          </SheetHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-h-0 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-emerald-200 bg-white p-4 dark:border-emerald-900/70 dark:bg-[#0f141d]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">조직 본문</p>
                  <Input
                    className="mt-2 h-11 border-0 px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="워크스페이스 이름"
                  />
                  <Input
                    className="mt-2 border-0 px-0 text-sm text-slate-600 shadow-none focus-visible:ring-0 dark:text-slate-300"
                    value={draft.summary}
                    onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))}
                    placeholder="조직/도메인 요약"
                  />
                </div>

                <div className="rounded-xl border border-emerald-200 bg-white p-4 dark:border-emerald-900/70 dark:bg-[#0f141d]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-300">조직 설명</p>
                  <Textarea
                    className="mt-2 min-h-[210px] resize-none border-slate-200 dark:border-slate-700"
                    value={draft.description}
                    onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                    placeholder="워크스페이스 운영 목적과 기본 규칙을 작성해 주세요."
                  />
                </div>
              </div>
            </div>

          <aside className="min-h-0 overflow-y-auto border-t border-border-subtle bg-surface-1/80 p-4 dark:border-border-subtle dark:bg-surface-1/90 lg:border-l lg:border-t-0">
              <div className="space-y-3">
                <div className="rounded-lg border border-emerald-200 bg-white p-3 dark:border-emerald-900/70 dark:bg-[#0d121b]">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-emerald-700 dark:text-emerald-300">운영 속성</p>
                  <div className="space-y-2.5 text-xs">
                    <div className="grid gap-1">
                      <span className="text-slate-500">상태</span>
                      <Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as WorkspaceStatus }))}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WORKSPACE_STATUSES.map((status) => <SelectItem key={status} value={status}>{statusLabelByStatus[status]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-slate-500">플랜</span>
                      <Select value={draft.plan} onValueChange={(value) => setDraft((current) => ({ ...current, plan: value as WorkspacePlan }))}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {WORKSPACE_PLANS.map((plan) => <SelectItem key={plan} value={plan}>{plan}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1">
                      <span className="text-slate-500">리드</span>
                      <Input className="h-8" value={draft.lead ?? ""} onChange={(event) => setDraft((current) => ({ ...current, lead: event.target.value.trim().length > 0 ? event.target.value : null }))} placeholder="워크스페이스 리드" />
                    </div>
                    <div className="grid gap-1">
                      <span className="text-slate-500">멤버 수</span>
                      <Input className="h-8" type="number" min={1} value={draft.memberCount} onChange={(event) => setDraft((current) => ({ ...current, memberCount: Number.parseInt(event.target.value || "1", 10) }))} />
                    </div>
                  </div>
                </div>

                {formError ? (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{formError}</p>
                ) : null}
              </div>
            </aside>
          </div>

          <SheetFooter>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>취소</Button>
              <Button onClick={handleSubmit}><CalendarClock className="h-4 w-4" />{editingWorkspaceId ? "저장" : "생성"}</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function WorkspaceCommandCenterLoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-28 w-full rounded-xl" />
      <div className="grid gap-3 lg:grid-cols-2">
        <Skeleton className="h-44 w-full rounded-xl lg:col-span-2" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    </div>
  );
}

