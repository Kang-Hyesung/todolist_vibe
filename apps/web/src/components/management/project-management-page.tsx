import {
  CalendarClock,
  FolderKanban,
  PencilLine,
  Plus,
  RefreshCcw,
  Rocket,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import type {
  Project,
  ProjectPriority,
  ProjectStatus,
  ProjectType,
  Workspace,
} from "../../types/domain";
import { PROJECT_PRIORITIES, PROJECT_STATUSES, PROJECT_TYPES } from "../../types/domain";
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
import { projectStatusBadgeTone } from "./management-status-tone";

export interface ProjectMutationInput {
  name: string;
  workspaceId: string;
  type: ProjectType;
  keyPrefix: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  lead: string | null;
  summary: string;
  description: string;
  startDate: string | null;
  targetDate: string | null;
  label: string | null;
}

interface ProjectManagementPageProps {
  projects: Project[];
  workspaces: Workspace[];
  activeWorkspaceId: string;
  activeProjectId: string;
  onSelectWorkspace: (workspaceId: string) => void;
  onSelectProject: (workspaceId: string, projectId: string) => void;
  onCreateProject: (input: ProjectMutationInput) => void;
  onUpdateProject: (projectId: string, input: ProjectMutationInput) => void;
  onDeleteProject: (projectId: string) => void;
  onNavigateIssues: () => void;
  onNavigateWorkspaces: () => void;
}

const statusLabelByStatus: Record<ProjectStatus, string> = {
  Backlog: "Backlog",
  Active: "진행",
  Paused: "보류",
  Completed: "완료",
};

const priorityLabelByPriority: Record<ProjectPriority, string> = {
  None: "없음",
  Low: "낮음",
  Medium: "중간",
  High: "높음",
};

const typeLabelByType: Record<ProjectType, string> = {
  Product: "제품",
  Design: "디자인",
  Marketing: "마케팅",
};
type ProjectCanvasTab = "overview" | "activity" | "docs";
type ManagementVisualMode = "ready" | "loading" | "error";

const typeBadgeVariant: Record<ProjectType, "progress" | "default" | "medium"> = {
  Product: "progress",
  Design: "default",
  Marketing: "medium",
};

const emptyDraft = (workspaceId: string): ProjectMutationInput => ({
  name: "",
  workspaceId,
  type: "Product",
  keyPrefix: "",
  status: "Backlog",
  priority: "None",
  lead: null,
  summary: "",
  description: "",
  startDate: null,
  targetDate: null,
  label: "Work",
});

function normalizeKeyPrefix(name: string) {
  const lettersOnly = name.replace(/[^A-Za-z]/g, "").toUpperCase();
  return lettersOnly.slice(0, 4) || "PRJ";
}

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

export function ProjectManagementPage({
  projects,
  workspaces,
  activeWorkspaceId,
  activeProjectId,
  onSelectWorkspace,
  onSelectProject,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onNavigateIssues,
  onNavigateWorkspaces,
}: ProjectManagementPageProps) {
  const [query, setQuery] = useState("");
  const [workspaceFilter, setWorkspaceFilter] = useState<string>(activeWorkspaceId || "all");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProjectMutationInput>(() =>
    emptyDraft(activeWorkspaceId || workspaces[0]?.id || ""),
  );
  const [quickNotice, setQuickNotice] = useState<string | null>(null);
  const [quickDraft, setQuickDraft] = useState<{
    status: ProjectStatus;
    priority: ProjectPriority;
    type: ProjectType;
    lead: string;
    label: string;
    startDate: string;
    targetDate: string;
  }>({
    status: "Backlog",
    priority: "None",
    type: "Product",
    lead: "",
    label: "",
    startDate: "",
    targetDate: "",
  });
  const [canvasTab, setCanvasTab] = useState<ProjectCanvasTab>("overview");
  const [projectDocs, setProjectDocs] = useState<Record<string, string>>({});
  const [visualMode, setVisualMode] = useState<ManagementVisualMode>("ready");
  const [booting, setBooting] = useState(true);
  const showDevStateToggles = import.meta.env.DEV;

  const workspaceNameById = useMemo(
    () => Object.fromEntries(workspaces.map((workspace) => [workspace.id, workspace.name])),
    [workspaces],
  );

  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesQuery =
        normalized.length === 0 ||
        project.name.toLowerCase().includes(normalized) ||
        project.keyPrefix.toLowerCase().includes(normalized) ||
        project.summary.toLowerCase().includes(normalized);
      const matchesWorkspace = workspaceFilter === "all" || project.workspaceId === workspaceFilter;
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      return matchesQuery && matchesWorkspace && matchesStatus;
    });
  }, [projects, query, workspaceFilter, statusFilter]);
  const projectFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; onRemove: () => void; tone?: "accent" }> = [];
    if (workspaceFilter !== "all") {
      chips.push({
        id: "workspace",
        label: `워크스페이스 ${workspaceNameById[workspaceFilter] ?? "선택"}`,
        onRemove: () => setWorkspaceFilter("all"),
      });
    }
    if (statusFilter !== "all") {
      chips.push({
        id: "status",
        label: `상태 ${statusLabelByStatus[statusFilter]}`,
        onRemove: () => setStatusFilter("all"),
        tone: "accent",
      });
    }
    return chips;
  }, [statusFilter, workspaceFilter, workspaceNameById]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? filteredProjects[0] ?? projects[0] ?? null,
    [activeProjectId, filteredProjects, projects],
  );

  const metrics = useMemo(
    () => ({
      total: projects.length,
      active: projects.filter((project) => project.status === "Active").length,
      backlog: projects.filter((project) => project.status === "Backlog").length,
      completed: projects.filter((project) => project.status === "Completed").length,
    }),
    [projects],
  );
  const activeProjectDoc = activeProject ? (projectDocs[activeProject.id] ?? "") : "";
  const effectiveMode: ManagementVisualMode = booting ? "loading" : visualMode;
  const quickDateInvalid =
    quickDraft.startDate.length > 0 &&
    quickDraft.targetDate.length > 0 &&
    quickDraft.startDate > quickDraft.targetDate;
  const quickDirty = useMemo(() => {
    if (!activeProject) {
      return false;
    }
    return (
      quickDraft.status !== activeProject.status ||
      quickDraft.priority !== activeProject.priority ||
      quickDraft.type !== activeProject.type ||
      (quickDraft.lead.trim() || null) !== (activeProject.lead ?? null) ||
      (quickDraft.label.trim() || null) !== (activeProject.label ?? null) ||
      (quickDraft.startDate || null) !== (activeProject.startDate ?? null) ||
      (quickDraft.targetDate || null) !== (activeProject.targetDate ?? null)
    );
  }, [activeProject, quickDraft]);
  const projectActivity = useMemo(() => {
    if (!activeProject) {
      return [];
    }
    const items = [
      {
        id: "created",
        title: "프로젝트 생성",
        detail: "실행 단위가 생성되었습니다.",
        timestamp: activeProject.createdAt,
      },
      {
        id: "state",
        title: "현재 운영 상태",
        detail: `상태 ${statusLabelByStatus[activeProject.status]} / 우선순위 ${priorityLabelByPriority[activeProject.priority]}`,
        timestamp: activeProject.updatedAt,
      },
      {
        id: "owner",
        title: "오너 및 라벨",
        detail: `리드 ${activeProject.lead ?? "미지정"} / 라벨 ${activeProject.label ?? "미지정"}`,
        timestamp: activeProject.updatedAt,
      },
    ];
    if (activeProject.targetDate) {
      items.push({
        id: "target",
        title: "목표일 확인",
        detail: `목표일 ${formatDate(activeProject.targetDate)}`,
        timestamp: activeProject.updatedAt,
      });
    }
    return items;
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) {
      return;
    }
    // Intentional state sync: refresh inspector draft when selected project changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuickDraft({
      status: activeProject.status,
      priority: activeProject.priority,
      type: activeProject.type,
      lead: activeProject.lead ?? "",
      label: activeProject.label ?? "",
      startDate: activeProject.startDate ?? "",
      targetDate: activeProject.targetDate ?? "",
    });
    setQuickNotice(null);
  }, [activeProject]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setBooting(false), 450);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const openCreate = () => {
    setEditingProjectId(null);
    setDraft(emptyDraft(activeWorkspaceId || workspaces[0]?.id || ""));
    setFormError(null);
    setSheetOpen(true);
  };

  const openEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setDraft({
      name: project.name,
      workspaceId: project.workspaceId,
      type: project.type,
      keyPrefix: project.keyPrefix,
      status: project.status,
      priority: project.priority,
      lead: project.lead,
      summary: project.summary,
      description: project.description,
      startDate: project.startDate,
      targetDate: project.targetDate,
      label: project.label,
    });
    setFormError(null);
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    const name = draft.name.trim();
    const keyPrefix = draft.keyPrefix.trim().toUpperCase();

    if (name.length < 2) {
      setFormError("프로젝트 이름은 2자 이상이어야 합니다.");
      return;
    }
    if (!draft.workspaceId) {
      setFormError("워크스페이스를 선택해 주세요.");
      return;
    }
    if (!/^[A-Z]{2,6}$/.test(keyPrefix)) {
      setFormError("키 프리픽스는 영문 대문자 2~6자로 입력해 주세요.");
      return;
    }
    if (draft.startDate && draft.targetDate && draft.startDate > draft.targetDate) {
      setFormError("시작일은 목표일보다 늦을 수 없습니다.");
      return;
    }

    const payload: ProjectMutationInput = {
      ...draft,
      name,
      keyPrefix,
      summary: draft.summary.trim(),
      description: draft.description.trim(),
      label: draft.label?.trim() ? draft.label.trim() : null,
      lead: draft.lead?.trim() ? draft.lead.trim() : null,
    };

    if (editingProjectId) {
      onUpdateProject(editingProjectId, payload);
    } else {
      onCreateProject(payload);
    }

    setSheetOpen(false);
  };

  const handleQuickSave = () => {
    if (!activeProject) {
      return;
    }
    if (quickDateInvalid) {
      setQuickNotice("시작일은 목표일보다 늦을 수 없습니다.");
      return;
    }
    onUpdateProject(activeProject.id, {
      name: activeProject.name,
      workspaceId: activeProject.workspaceId,
      type: quickDraft.type,
      keyPrefix: activeProject.keyPrefix,
      status: quickDraft.status,
      priority: quickDraft.priority,
      lead: quickDraft.lead.trim() ? quickDraft.lead.trim() : null,
      summary: activeProject.summary,
      description: activeProject.description,
      startDate: quickDraft.startDate || null,
      targetDate: quickDraft.targetDate || null,
      label: quickDraft.label.trim() ? quickDraft.label.trim() : null,
    });
    setQuickNotice("운영 속성을 저장했습니다.");
  };

  const handleProjectDocChange = (value: string) => {
    if (!activeProject) {
      return;
    }
    setProjectDocs((current) => ({
      ...current,
      [activeProject.id]: value,
    }));
  };

  return (
    <div className="min-h-0 px-1 pb-8 pt-1 sm:px-1">
      <div className="grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="flex h-[calc(100vh-136px)] flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-sm dark:border-border-subtle dark:bg-surface-0">
          <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-700 dark:text-violet-300">Delivery Portfolio</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">프로젝트 카탈로그</h2>
              <span className="text-[11px] tabular-nums text-ink-muted">총 {projects.length}</span>
            </div>
          </div>

          <ManagementFilterBar
            query={query}
            onQueryChange={setQuery}
            queryPlaceholder="프로젝트명/키/요약 검색"
            resultCount={filteredProjects.length}
            resultLabel="결과"
            chips={projectFilterChips}
            onClearAll={() => {
              setWorkspaceFilter("all");
              setStatusFilter("all");
              setQuery("");
            }}
            rightControl={
              <div className="grid gap-2">
                <Select value={workspaceFilter} onValueChange={setWorkspaceFilter}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="워크스페이스" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 워크스페이스</SelectItem>
                    {workspaces.map((workspace) => <SelectItem key={workspace.id} value={workspace.id}>{workspace.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "all" | ProjectStatus)}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="상태" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체 상태</SelectItem>
                    {PROJECT_STATUSES.map((status) => <SelectItem key={status} value={status}>{statusLabelByStatus[status]}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button className="h-9 w-full" onClick={openCreate}><Plus className="h-4 w-4" />프로젝트 생성</Button>
              </div>
            }
          />

          <div className="min-h-0 flex-1 space-y-1 overflow-auto p-2">
            {filteredProjects.length === 0 ? (
              <EmptyState icon={FolderKanban} title="프로젝트 없음" description="검색 조건을 바꾸거나 새 프로젝트를 생성하세요." />
            ) : (
              filteredProjects.map((project) => {
                const isActive = activeProject?.id === project.id;
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onSelectProject(project.workspaceId, project.id)}
                    className={cn(
                      "w-full rounded-lg border px-2.5 py-2 text-left transition",
                      isActive
                        ? "border-violet-300 bg-violet-50/80 dark:border-violet-800 dark:bg-violet-950/25"
                        : "border-transparent bg-transparent hover:border-slate-200 hover:bg-slate-100 dark:hover:border-slate-800 dark:hover:bg-slate-900/70",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="inline-flex h-5 items-center rounded-md border border-violet-300 bg-white px-1.5 text-[10px] font-semibold text-violet-700 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-200">{project.keyPrefix}</span>
                        <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-slate-100">{project.name}</p>
                      </div>
                          <span className={cn("whitespace-nowrap rounded-full border px-1.5 py-0.5 text-[10px] font-medium", projectStatusBadgeTone(project.status))}>
                        {statusLabelByStatus[project.status]}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11px] text-ink-muted">{project.summary || "요약 없음"}</p>
                    <p className="mt-0.5 text-[11px] text-ink-muted">{workspaceNameById[project.workspaceId] ?? "미지정"}</p>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-auto border-t border-border-subtle px-3 py-2 dark:border-border-subtle">
            <div className="grid grid-cols-3 gap-1.5">
              <MetricCard label="진행" value={metrics.active} compact />
              <MetricCard label="Backlog" value={metrics.backlog} compact />
              <MetricCard label="완료" value={metrics.completed} compact />
            </div>
          </div>
        </aside>

        <section className="h-[calc(100vh-136px)] overflow-hidden rounded-2xl border border-border-subtle bg-surface-0 shadow-sm dark:border-border-subtle dark:bg-surface-0">
          {!activeProject ? (
            <div className="p-6">
              <EmptyState icon={FolderKanban} title="선택된 프로젝트가 없습니다" description="좌측 목록에서 선택해 주세요." />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-violet-700 dark:text-violet-300">Project Command Center</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex h-6 items-center rounded-md border border-violet-300 bg-white px-2 text-xs font-semibold text-violet-700 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-200">{activeProject.keyPrefix}</span>
                      <h1 className="truncate text-[26px] font-semibold tracking-[-0.02em] text-slate-900 dark:text-slate-100">{activeProject.name}</h1>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{activeProject.summary || "요약이 없습니다."}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={() => { onSelectProject(activeProject.workspaceId, activeProject.id); onNavigateIssues(); }}>
                      <Rocket className="h-3.5 w-3.5" />이슈 보드
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 px-2.5 text-xs" onClick={() => { onSelectWorkspace(activeProject.workspaceId); onNavigateWorkspaces(); }}>
                      <FolderKanban className="h-3.5 w-3.5" />상위 워크스페이스
                    </Button>
                    <Button size="sm" className="h-8 px-2.5 text-xs" onClick={() => openEdit(activeProject)}><PencilLine className="h-3.5 w-3.5" />수정</Button>
                    {showDevStateToggles ? (
                      <div className="inline-flex h-8 items-center gap-1 rounded-md border border-border-subtle bg-surface-1 px-1 dark:border-border-subtle dark:bg-surface-1">
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setVisualMode("ready")}>기본</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setVisualMode("loading")}>로딩</Button>
                        <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setVisualMode("error")}>오류</Button>
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className={cn("whitespace-nowrap rounded-full border px-2 py-0.5 font-semibold", projectStatusBadgeTone(activeProject.status))}>상태 {statusLabelByStatus[activeProject.status]}</span>
                  <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 font-medium text-ink-muted dark:border-border-subtle dark:bg-surface-1 dark:text-ink-muted">우선순위 {priorityLabelByPriority[activeProject.priority]}</span>
                  <Badge variant={typeBadgeVariant[activeProject.type]}>유형 {typeLabelByType[activeProject.type]}</Badge>
                  <span className="truncate text-ink-muted">{workspaceNameById[activeProject.workspaceId] ?? "미지정"}</span>
                </div>
              </div>

              <div className="border-b border-border-subtle px-5 py-2 dark:border-border-subtle">
                <SegmentedTabs
                  value={canvasTab}
                  onChange={setCanvasTab}
                  tone="violet"
                  options={[
                    { value: "overview", label: "프로젝트 개요" },
                    { value: "activity", label: "실행 로그" },
                    { value: "docs", label: "운영 문서" },
                  ]}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-auto p-4">
                {effectiveMode === "loading" ? (
                  <ProjectCommandCenterLoadingState />
                ) : effectiveMode === "error" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900 dark:bg-rose-950/20">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
                        프로젝트 데이터를 불러오지 못했습니다. 다시 시도해 주세요.
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
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Delivery Brief</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600 dark:text-slate-300">{activeProject.description || "설명이 없습니다."}</p>
                    </article>

                    <article className="rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Delivery Timeline</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3 dark:border-border-subtle dark:bg-surface-1"><p className="text-[11px] text-ink-muted">시작일</p><p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatDate(activeProject.startDate)}</p></div>
                        <div className="rounded-lg border border-border-subtle bg-surface-1 p-3 dark:border-border-subtle dark:bg-surface-1"><p className="text-[11px] text-ink-muted">목표일</p><p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">{formatDate(activeProject.targetDate)}</p></div>
                      </div>
                    </article>

                    <article className="rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">Governance Signals</p>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <span className={cn("whitespace-nowrap rounded-full border px-2 py-0.5 font-semibold", projectStatusBadgeTone(activeProject.status))}>상태 {statusLabelByStatus[activeProject.status]}</span>
                        <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 font-medium text-ink-muted">우선순위 {priorityLabelByPriority[activeProject.priority]}</span>
                        <span className="rounded-full border border-border-subtle bg-surface-1 px-2 py-0.5 font-medium text-ink-muted">리드 {activeProject.lead ?? "미지정"}</span>
                      </div>
                      <dl className="mt-2 space-y-1.5 text-xs">
                        <div className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2"><dt className="text-ink-muted">생성일:</dt><dd className="text-right font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatDate(activeProject.createdAt)}</dd></div>
                        <div className="grid grid-cols-[90px_minmax(0,1fr)] items-center gap-2"><dt className="text-ink-muted">수정일:</dt><dd className="text-right font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatDate(activeProject.updatedAt)}</dd></div>
                      </dl>
                    </article>
                  </div>
                ) : null}

                {canvasTab === "activity" ? (
                  <article className="rounded-xl border border-border-subtle bg-surface-0 p-4 dark:border-border-subtle dark:bg-surface-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">최근 활동</p>
                    <div className="mt-2 space-y-2">
                      {projectActivity.map((item) => (
                        <div key={item.id} className="grid grid-cols-[12px_minmax(0,1fr)] gap-2">
                          <div className="mt-1.5 h-2 w-2 rounded-full bg-violet-500/70" />
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
                      실행 기준, 의사결정 배경, 릴리즈 체크리스트를 정리합니다.
                    </p>
                    <Textarea
                      className="mt-3 min-h-[320px] resize-y"
                      value={activeProjectDoc}
                      onChange={(event) => handleProjectDocChange(event.target.value)}
                      placeholder="프로젝트 운영 문서를 작성해 주세요."
                    />
                    <p className="mt-2 text-[11px] text-ink-muted">
                      {activeProjectDoc.length.toLocaleString("ko-KR")}자
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-violet-700 dark:text-violet-300">Execution Controls</p>
          {!activeProject ? (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">좌측에서 프로젝트를 선택해 주세요.</p>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="rounded-xl border border-border-subtle bg-surface-0 p-3 dark:border-border-subtle dark:bg-surface-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-5 items-center rounded-md border border-violet-300 bg-white px-1.5 text-[10px] font-semibold text-violet-700 dark:border-violet-700 dark:bg-violet-950/60 dark:text-violet-200">
                    {activeProject.keyPrefix}
                  </span>
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{activeProject.name}</p>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{workspaceNameById[activeProject.workspaceId] ?? "미지정"}</p>
              </div>

              <div className="space-y-2 rounded-xl border border-border-subtle bg-surface-0 p-3 dark:border-border-subtle dark:bg-surface-0">
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">상태</span>
                  <Select
                    value={quickDraft.status}
                    onValueChange={(value) => setQuickDraft((current) => ({ ...current, status: value as ProjectStatus }))}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>{statusLabelByStatus[status]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">우선순위</span>
                  <Select
                    value={quickDraft.priority}
                    onValueChange={(value) => setQuickDraft((current) => ({ ...current, priority: value as ProjectPriority }))}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>{priorityLabelByPriority[priority]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">유형</span>
                  <Select
                    value={quickDraft.type}
                    onValueChange={(value) => setQuickDraft((current) => ({ ...current, type: value as ProjectType }))}
                  >
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{typeLabelByType[type]}</SelectItem>
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
                  <span className="text-[11px] text-slate-500">라벨</span>
                  <Input
                    className="h-8"
                    value={quickDraft.label}
                    onChange={(event) => setQuickDraft((current) => ({ ...current, label: event.target.value }))}
                    placeholder="라벨"
                  />
                </div>
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">시작일</span>
                  <Input
                    className={cn("h-8", quickDateInvalid ? "border-rose-300 focus-visible:ring-rose-200 dark:border-rose-800" : "")}
                    type="date"
                    value={quickDraft.startDate}
                    onChange={(event) => setQuickDraft((current) => ({ ...current, startDate: event.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-[74px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[11px] text-slate-500">목표일</span>
                  <Input
                    className={cn("h-8", quickDateInvalid ? "border-rose-300 focus-visible:ring-rose-200 dark:border-rose-800" : "")}
                    type="date"
                    value={quickDraft.targetDate}
                    onChange={(event) => setQuickDraft((current) => ({ ...current, targetDate: event.target.value }))}
                  />
                </div>
                <Button className="h-8 w-full" size="sm" disabled={!quickDirty || quickDateInvalid} onClick={handleQuickSave}>
                  <CalendarClock className="h-3.5 w-3.5" />
                  운영 속성 저장
                </Button>
                <Button
                  className="h-8 w-full"
                  size="sm"
                  variant="outline"
                  disabled={projects.length <= 1}
                  onClick={() => {
                    if (!activeProject) {
                      return;
                    }
                    const ok = window.confirm("프로젝트를 삭제할까요?");
                    if (!ok) {
                      return;
                    }
                    onDeleteProject(activeProject.id);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  프로젝트 삭제
                </Button>
                <p
                  className={cn(
                    "text-[11px]",
                    quickNotice
                      ? "text-emerald-700 dark:text-emerald-300"
                      : quickDateInvalid
                        ? "text-rose-600 dark:text-rose-300"
                        : quickDirty
                          ? "text-amber-600 dark:text-amber-300"
                          : "text-ink-muted",
                  )}
                >
                  {quickNotice ??
                    (quickDateInvalid
                      ? "시작일은 목표일보다 늦을 수 없습니다."
                      : quickDirty
                        ? "저장되지 않은 변경 사항이 있습니다."
                        : "변경 사항이 없습니다.")}
                </p>
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface-0 p-3 text-xs dark:border-border-subtle dark:bg-surface-0">
                <p className="font-medium text-slate-700 dark:text-slate-200">현재 구조</p>
                <p className="mt-1 text-ink-muted">
                  프로젝트 {projects.length}개 / 선택 워크스페이스 {activeWorkspaceId ? "연결됨" : "미지정"}
                </p>
              </div>
            </div>
          )}
        </aside>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:w-[min(1120px,calc(100vw-28px))]">
          <SheetHeader>
            <SheetTitle>{editingProjectId ? "프로젝트 수정" : "새 프로젝트"}</SheetTitle>
            <SheetDescription>실행 정보(왼쪽)와 운영 속성(오른쪽)을 분리해 입력합니다.</SheetDescription>
          </SheetHeader>

          <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-h-0 overflow-y-auto p-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-violet-200 bg-white p-4 dark:border-violet-900/70 dark:bg-[#0f141d]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-violet-700 dark:text-violet-300">프로젝트 본문</p>
                  <Input className="mt-2 h-11 border-0 px-0 text-2xl font-semibold tracking-tight shadow-none focus-visible:ring-0" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value, keyPrefix: current.keyPrefix || normalizeKeyPrefix(event.target.value) }))} placeholder="프로젝트 이름" />
                  <Input className="mt-2 border-0 px-0 text-sm shadow-none focus-visible:ring-0" value={draft.summary} onChange={(event) => setDraft((current) => ({ ...current, summary: event.target.value }))} placeholder="프로젝트 한 줄 요약" />
                  <Textarea className="mt-3 min-h-[220px] resize-none" value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} placeholder="프로젝트 목적, 범위, 운영 기준을 작성해 주세요." />
                </div>
              </div>
            </div>

          <aside className="min-h-0 overflow-y-auto border-t border-border-subtle bg-surface-1/80 p-4 dark:border-border-subtle dark:bg-surface-1/90 lg:border-l lg:border-t-0">
              <div className="space-y-2.5 text-xs">
                <Select value={draft.status} onValueChange={(value) => setDraft((current) => ({ ...current, status: value as ProjectStatus }))}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="상태" /></SelectTrigger>
                  <SelectContent>{PROJECT_STATUSES.map((status) => <SelectItem key={status} value={status}>{statusLabelByStatus[status]}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={draft.priority} onValueChange={(value) => setDraft((current) => ({ ...current, priority: value as ProjectPriority }))}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="우선순위" /></SelectTrigger>
                  <SelectContent>{PROJECT_PRIORITIES.map((priority) => <SelectItem key={priority} value={priority}>{priorityLabelByPriority[priority]}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={draft.workspaceId} onValueChange={(value) => setDraft((current) => ({ ...current, workspaceId: value }))}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="워크스페이스" /></SelectTrigger>
                  <SelectContent>{workspaces.map((workspace) => <SelectItem key={workspace.id} value={workspace.id}>{workspace.name}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={draft.type} onValueChange={(value) => setDraft((current) => ({ ...current, type: value as ProjectType }))}>
                  <SelectTrigger className="h-8"><SelectValue placeholder="유형" /></SelectTrigger>
                  <SelectContent>{PROJECT_TYPES.map((type) => <SelectItem key={type} value={type}>{typeLabelByType[type]}</SelectItem>)}</SelectContent>
                </Select>
                <Input className="h-8" value={draft.keyPrefix} onChange={(event) => setDraft((current) => ({ ...current, keyPrefix: event.target.value.toUpperCase() }))} placeholder="KEY" maxLength={6} />
                <Input className="h-8" value={draft.lead ?? ""} onChange={(event) => setDraft((current) => ({ ...current, lead: event.target.value || null }))} placeholder="리드" />
                <Input className="h-8" value={draft.label ?? ""} onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value || null }))} placeholder="라벨" />
                <Input className="h-8" type="date" value={draft.startDate ?? ""} onChange={(event) => setDraft((current) => ({ ...current, startDate: event.target.value || null }))} />
                <Input className="h-8" type="date" value={draft.targetDate ?? ""} onChange={(event) => setDraft((current) => ({ ...current, targetDate: event.target.value || null }))} />
              </div>

              {formError ? (
                <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">{formError}</p>
              ) : null}
            </aside>
          </div>

          <SheetFooter>
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSheetOpen(false)}>취소</Button>
              <Button onClick={handleSubmit}><CalendarClock className="h-4 w-4" />{editingProjectId ? "저장" : "생성"}</Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function ProjectCommandCenterLoadingState() {
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

