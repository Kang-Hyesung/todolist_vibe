import { FolderKanban, LayoutGrid, ListChecks, Moon, Sun } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BoardPage } from "./components/board/board-page";
import {
  ProjectManagementPage,
  type ProjectMutationInput,
} from "./components/management/project-management-page";
import {
  WorkspaceManagementPage,
  type WorkspaceMutationInput,
} from "./components/management/workspace-management-page";
import { Button } from "./components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import { mockProjects, mockWorkspaces } from "./data/mock";
import { cn } from "./lib/utils";
import type { Project, Workspace } from "./types/domain";

type AppRoute = "issues" | "projects" | "workspaces";
interface ContextSelection {
  workspaceId: string;
  projectId: string;
}

const CONTEXT_STORAGE_KEY = "vibe-active-context";

const routeConfig: Record<
  AppRoute,
  {
    label: string;
    path: string;
    icon: typeof ListChecks;
  }
> = {
  issues: {
    label: "이슈",
    path: "/issues",
    icon: ListChecks,
  },
  projects: {
    label: "프로젝트",
    path: "/projects",
    icon: FolderKanban,
  },
  workspaces: {
    label: "워크스페이스",
    path: "/workspaces",
    icon: LayoutGrid,
  },
};

function resolveRoute(pathname: string): AppRoute {
  if (pathname.startsWith("/projects")) {
    return "projects";
  }
  if (pathname.startsWith("/workspaces")) {
    return "workspaces";
  }
  return "issues";
}

function readContextFromUrl(search: string) {
  const params = new URLSearchParams(search);
  return {
    workspaceId: params.get("workspace") ?? "",
    projectId: params.get("project") ?? "",
  };
}

function readContextFromStorage(): ContextSelection | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CONTEXT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<ContextSelection>;
    return {
      workspaceId: typeof parsed.workspaceId === "string" ? parsed.workspaceId : "",
      projectId: typeof parsed.projectId === "string" ? parsed.projectId : "",
    };
  } catch {
    return null;
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueValue(base: string, existing: Set<string>) {
  if (!existing.has(base)) {
    return base;
  }
  let index = 2;
  while (existing.has(`${base}-${index}`)) {
    index += 1;
  }
  return `${base}-${index}`;
}

function pseudoGuid(seed: string) {
  const clean = seed.replace(/[^a-z0-9]/gi, "").padEnd(32, "0").slice(0, 32);
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
}

function App() {
  const urlContext = readContextFromUrl(window.location.search);
  const storageContext = readContextFromStorage();
  const initialWorkspaceId =
    urlContext.workspaceId || storageContext?.workspaceId || mockWorkspaces[0]?.id || "";
  const initialProjectId =
    urlContext.projectId || storageContext?.projectId || mockProjects[0]?.id || "";
  const [route, setRoute] = useState<AppRoute>(() => resolveRoute(window.location.pathname));
  const [workspaces, setWorkspaces] = useState<Workspace[]>(mockWorkspaces);
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>(initialWorkspaceId);
  const [activeProjectId, setActiveProjectId] = useState<string>(initialProjectId);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    const saved = window.localStorage.getItem("vibe-theme");
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    const onPopState = () => {
      setRoute(resolveRoute(window.location.pathname));
      const context = readContextFromUrl(window.location.search);
      if (context.workspaceId) {
        setActiveWorkspaceId(context.workspaceId);
      }
      if (context.projectId) {
        setActiveProjectId(context.projectId);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("vibe-theme", theme);
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (activeWorkspaceId) {
      params.set("workspace", activeWorkspaceId);
    } else {
      params.delete("workspace");
    }
    if (activeProjectId) {
      params.set("project", activeProjectId);
    } else {
      params.delete("project");
    }

    const expectedPath = routeConfig[route].path;
    const nextQuery = params.toString();
    const nextUrl = nextQuery ? `${expectedPath}?${nextQuery}` : expectedPath;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      window.history.replaceState(null, "", nextUrl);
    }
  }, [route, activeWorkspaceId, activeProjectId]);

  const navigate = useCallback((nextRoute: AppRoute) => {
    if (nextRoute === route) {
      return;
    }
    const params = new URLSearchParams();
    if (activeWorkspaceId) {
      params.set("workspace", activeWorkspaceId);
    }
    if (activeProjectId) {
      params.set("project", activeProjectId);
    }
    const nextPath = routeConfig[nextRoute].path;
    const nextUrl = params.toString() ? `${nextPath}?${params.toString()}` : nextPath;
    window.history.pushState(null, "", nextUrl);
    setRoute(nextRoute);
  }, [route, activeWorkspaceId, activeProjectId]);

  const projectsByWorkspace = useMemo(() => {
    return projects.reduce<Record<string, Project[]>>((acc, project) => {
      if (!acc[project.workspaceId]) {
        acc[project.workspaceId] = [];
      }
      acc[project.workspaceId].push(project);
      return acc;
    }, {});
  }, [projects]);

  const activeWorkspaceProjects = useMemo(
    () => projectsByWorkspace[activeWorkspaceId] ?? [],
    [activeWorkspaceId, projectsByWorkspace],
  );

  useEffect(() => {
    if (!activeWorkspaceId || workspaces.some((workspace) => workspace.id === activeWorkspaceId)) {
      return;
    }
    // Intentional state sync: fallback to first workspace when selected workspace is removed.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveWorkspaceId(workspaces[0]?.id ?? "");
  }, [activeWorkspaceId, workspaces]);

  useEffect(() => {
    if (activeWorkspaceProjects.some((project) => project.id === activeProjectId)) {
      return;
    }
    // Intentional state sync: keep project selection valid for the active workspace.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveProjectId(activeWorkspaceProjects[0]?.id ?? "");
  }, [activeProjectId, activeWorkspaceProjects]);

  useEffect(() => {
    if (!activeProjectId) {
      return;
    }
    const activeProject = projects.find((project) => project.id === activeProjectId);
    if (!activeProject) {
      return;
    }
    if (activeProject.workspaceId !== activeWorkspaceId) {
      // Intentional state sync: align workspace selection with explicitly selected project.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveWorkspaceId(activeProject.workspaceId);
    }
  }, [activeProjectId, activeWorkspaceId, projects]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(
      CONTEXT_STORAGE_KEY,
      JSON.stringify({
        workspaceId: activeWorkspaceId,
        projectId: activeProjectId,
      }),
    );
  }, [activeWorkspaceId, activeProjectId]);

  const handleCreateWorkspace = useCallback((input: WorkspaceMutationInput) => {
    setWorkspaces((current) => {
      const existingSlugs = new Set(current.map((workspace) => workspace.slug));
      const baseSlug = slugify(input.name) || "workspace";
      const slug = uniqueValue(baseSlug, existingSlugs);
      const now = new Date().toISOString();

      return [
        ...current,
        {
          id: `workspace-${slug}`,
          name: input.name,
          slug,
          plan: input.plan,
          status: input.status,
          memberCount: input.memberCount,
          lead: input.lead,
          summary: input.summary,
          description: input.description,
          createdAt: now,
          updatedAt: now,
        },
      ];
    });
  }, []);

  const handleUpdateWorkspace = useCallback((workspaceId: string, input: WorkspaceMutationInput) => {
    setWorkspaces((current) => {
      const existingSlugs = new Set(
        current.filter((workspace) => workspace.id !== workspaceId).map((workspace) => workspace.slug),
      );
      const baseSlug = slugify(input.name) || "workspace";
      const slug = uniqueValue(baseSlug, existingSlugs);

      return current.map((workspace) => {
        if (workspace.id !== workspaceId) {
          return workspace;
        }
        return {
          ...workspace,
          name: input.name,
          plan: input.plan,
          status: input.status,
          memberCount: input.memberCount,
          lead: input.lead,
          summary: input.summary,
          description: input.description,
          slug,
          updatedAt: new Date().toISOString(),
        };
      });
    });
  }, []);

  const handleDeleteWorkspace = useCallback((workspaceId: string) => {
    setWorkspaces((current) => current.filter((workspace) => workspace.id !== workspaceId));
  }, []);

  const handleCreateProject = useCallback((input: ProjectMutationInput) => {
    setProjects((current) => {
      const now = new Date().toISOString();
      const projectSeed = `${input.name}-${Date.now()}`;
      const idSlugBase = slugify(input.name) || "project";
      const existingProjectIds = new Set(current.map((project) => project.id));
      const idSlug = uniqueValue(idSlugBase, existingProjectIds);

      return [
        ...current,
        {
          id: `project-${idSlug}`,
          apiId: pseudoGuid(projectSeed),
          workspaceId: input.workspaceId,
          name: input.name,
          type: input.type,
          keyPrefix: input.keyPrefix,
          status: input.status,
          priority: input.priority,
          lead: input.lead,
          summary: input.summary,
          description: input.description,
          startDate: input.startDate,
          targetDate: input.targetDate,
          label: input.label,
          createdAt: now,
          updatedAt: now,
        },
      ];
    });
  }, []);

  const handleUpdateProject = useCallback((projectId: string, input: ProjectMutationInput) => {
    setProjects((current) =>
      current.map((project) => {
        if (project.id !== projectId) {
          return project;
        }
        return {
          ...project,
          ...input,
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
  }, []);

  const activeWorkspace = workspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? null;
  const activeWorkspaceName = activeWorkspace?.name ?? "워크스페이스";
  const activeProjectName = activeProject?.name ?? "프로젝트";

  return (
    <div className="min-h-screen bg-app text-main">
      <div className="grid min-h-screen lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="hidden border-r border-border-subtle bg-surface-1 lg:flex lg:flex-col">
          <div className="flex h-14 items-center border-b border-border-subtle px-4">
            <div className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border-subtle bg-surface-2 text-[11px] font-bold text-main">
              WO
            </div>
            <span className="ml-2 text-sm font-semibold tracking-tight">Work</span>
          </div>

          <div className="px-3 py-4">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-ink-soft">
              Workspace
            </p>
            <nav className="mt-2 space-y-1">
              {(Object.keys(routeConfig) as AppRoute[]).map((routeKey) => {
                const item = routeConfig[routeKey];
                const Icon = item.icon;
                const isActive = routeKey === route;
                return (
                  <button
                    key={routeKey}
                    type="button"
                    onClick={() => navigate(routeKey)}
                    className={cn(
                      "flex h-9 w-full items-center gap-2 rounded-md px-2.5 text-left text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-surface-2 text-main ring-1 ring-border-subtle"
                        : "text-ink-muted hover:bg-surface-2 hover:text-main",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="mx-3 mt-1 border-t border-border-subtle pt-4 text-xs">
            <p className="text-[10px] uppercase tracking-[0.08em] text-ink-soft">Current</p>
            <p className="mt-2 text-[11px] text-ink-soft">워크스페이스</p>
            <p className="mt-0.5 truncate text-[13px] font-medium text-main">{activeWorkspaceName}</p>
            <p className="mt-3 text-[11px] text-ink-soft">프로젝트</p>
            <p className="mt-0.5 truncate text-[13px] font-medium text-main">{activeProjectName}</p>
          </div>

          <div className="mx-3 mb-3 mt-auto grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg border border-border-subtle bg-surface-0 px-2.5 py-2">
              <p className="text-[10px] text-ink-soft">워크스페이스</p>
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums">{workspaces.length}</p>
            </div>
            <div className="rounded-lg border border-border-subtle bg-surface-0 px-2.5 py-2">
              <p className="text-[10px] text-ink-soft">프로젝트</p>
              <p className="mt-0.5 text-[13px] font-semibold tabular-nums">{projects.length}</p>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border-subtle bg-surface-0/95 px-2.5 backdrop-blur sm:px-4">
            <div className="flex items-center gap-1 rounded-md border border-border-subtle bg-surface-1 p-1 lg:hidden">
              {(Object.keys(routeConfig) as AppRoute[]).map((routeKey) => {
                const item = routeConfig[routeKey];
                const isActive = routeKey === route;
                return (
                  <Button
                    key={routeKey}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-8 px-2.5 text-xs",
                      isActive
                        ? "bg-surface-2 text-main shadow-none"
                        : "text-ink-muted hover:bg-surface-2 hover:text-main",
                    )}
                    onClick={() => navigate(routeKey)}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </div>

            <div className="hidden min-w-0 items-center gap-1 text-xs text-ink-muted md:flex">
              <button
                type="button"
                className="truncate rounded px-1.5 py-0.5 hover:bg-surface-2 hover:text-main"
                onClick={() => navigate("workspaces")}
                title={activeWorkspaceName}
              >
                {activeWorkspaceName}
              </button>
              <span>/</span>
              <button
                type="button"
                className="truncate rounded px-1.5 py-0.5 font-medium text-main hover:bg-surface-2"
                onClick={() => navigate("projects")}
                title={activeProjectName}
              >
                {activeProjectName}
              </button>
              <span>/</span>
              <button
                type="button"
                className="rounded px-1.5 py-0.5 font-medium text-main hover:bg-surface-2"
                onClick={() => navigate(route)}
              >
                {routeConfig[route].label}
              </button>
            </div>

            <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
              <Select
                value={activeWorkspaceId}
                onValueChange={(workspaceId) => {
                  setActiveWorkspaceId(workspaceId);
                  const firstProjectId = (projectsByWorkspace[workspaceId] ?? [])[0]?.id ?? "";
                  setActiveProjectId(firstProjectId);
                }}
              >
                <SelectTrigger className="h-8 w-[124px] border-border-subtle bg-surface-0 text-xs text-main sm:w-[160px]">
                  <SelectValue placeholder="워크스페이스" />
                </SelectTrigger>
                <SelectContent>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activeProjectId} onValueChange={setActiveProjectId}>
                <SelectTrigger className="h-8 w-[124px] border-border-subtle bg-surface-0 text-xs text-main sm:w-[160px]">
                  <SelectValue placeholder="프로젝트" />
                </SelectTrigger>
                <SelectContent>
                  {activeWorkspaceProjects.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      프로젝트 없음
                    </SelectItem>
                  ) : (
                    activeWorkspaceProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-border-subtle bg-surface-0 px-2 text-main hover:bg-surface-2"
                aria-label={theme === "dark" ? "라이트 테마로 전환" : "다크 테마로 전환"}
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>

          <main className="min-h-[calc(100vh-56px)] p-2 sm:p-3">
            {route === "issues" ? (
              activeWorkspaceProjects.length === 0 ? (
                <div className="rounded-xl border border-border-subtle bg-surface-0 p-8 shadow-panel">
                  <h2 className="text-lg font-semibold">선택한 워크스페이스에 프로젝트가 없습니다</h2>
                  <p className="mt-2 text-sm text-ink-muted">
                    먼저 프로젝트를 생성한 뒤 이슈 보드로 돌아오세요.
                  </p>
                  <Button className="mt-5" onClick={() => navigate("projects")}>
                    프로젝트 생성하러 가기
                  </Button>
                </div>
              ) : (
                <BoardPage
                  projects={activeWorkspaceProjects}
                  activeProjectId={activeProjectId}
                  onActiveProjectChange={setActiveProjectId}
                />
              )
            ) : null}

            {route === "projects" ? (
              <ProjectManagementPage
                projects={projects}
                workspaces={workspaces}
                activeWorkspaceId={activeWorkspaceId}
                activeProjectId={activeProjectId}
                onSelectWorkspace={setActiveWorkspaceId}
                onSelectProject={(workspaceId, projectId) => {
                  setActiveWorkspaceId(workspaceId);
                  setActiveProjectId(projectId);
                }}
                onCreateProject={handleCreateProject}
                onUpdateProject={handleUpdateProject}
                onDeleteProject={handleDeleteProject}
                onNavigateIssues={() => navigate("issues")}
                onNavigateWorkspaces={() => navigate("workspaces")}
              />
            ) : null}

            {route === "workspaces" ? (
              <WorkspaceManagementPage
                workspaces={workspaces}
                projects={projects}
                activeWorkspaceId={activeWorkspaceId}
                onSelectWorkspace={(workspaceId) => {
                  setActiveWorkspaceId(workspaceId);
                  const firstProjectId = (projectsByWorkspace[workspaceId] ?? [])[0]?.id ?? "";
                  setActiveProjectId(firstProjectId);
                }}
                onNavigateIssues={() => navigate("issues")}
                onCreateWorkspace={handleCreateWorkspace}
                onUpdateWorkspace={handleUpdateWorkspace}
                onDeleteWorkspace={handleDeleteWorkspace}
                onNavigateProjects={() => navigate("projects")}
              />
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;





