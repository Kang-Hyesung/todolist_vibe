using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Vibe.Api.Models;

namespace Vibe.Api.Data;

public static class AppDataInitializer
{
    private static readonly Guid DefaultWorkspaceId = Guid.Parse("90000000-0000-0000-0000-000000000001");

    private static readonly WorkspaceSeed[] WorkspaceSeeds =
    [
        new(
            Guid.Parse("90000000-0000-0000-0000-000000000001"),
            "Product Development",
            "product-development",
            "Team",
            "Active",
            18,
            "Minjun Kim",
            "Build and operate product platform and backend services.",
            "Core product engineering workspace for roadmap and delivery."
        ),
        new(
            Guid.Parse("90000000-0000-0000-0000-000000000002"),
            "Brand Experience",
            "brand-experience",
            "Scale",
            "Active",
            12,
            "Seoyeon Park",
            "Drive design system and brand consistency.",
            "Owns design quality and reusable UI standards."
        ),
        new(
            Guid.Parse("90000000-0000-0000-0000-000000000003"),
            "Growth Ops",
            "growth-ops",
            "Team",
            "Active",
            10,
            "Jihun Lee",
            "Operate acquisition and conversion campaigns.",
            "Coordinates growth experiments and campaign operations."
        ),
        new(
            Guid.Parse("90000000-0000-0000-0000-000000000004"),
            "Platform Reliability",
            "platform-reliability",
            "Starter",
            "Paused",
            6,
            "Yerin Choi",
            "Maintain platform reliability and release controls.",
            "Handles reliability hardening and incident follow-ups."
        ),
    ];

    private static readonly ProjectSeed[] ProjectSeeds =
    [
        new(
            Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Guid.Parse("90000000-0000-0000-0000-000000000001"),
            "Unified Work Board",
            "Product",
            "TASK",
            "Active",
            "High",
            "Minjun Kim",
            "Issue hierarchy and board workflow foundation.",
            "Core product board experience with hierarchy and drag reorder.",
            new DateOnly(2026, 1, 2),
            new DateOnly(2026, 4, 30),
            "Work"
        ),
        new(
            Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Guid.Parse("90000000-0000-0000-0000-000000000002"),
            "Design System Upgrade",
            "Design",
            "DSGN",
            "Active",
            "Medium",
            "Seoyeon Park",
            "Token and component standardization initiative.",
            "Improve consistency and accessibility in reusable components.",
            new DateOnly(2026, 1, 15),
            new DateOnly(2026, 6, 20),
            "Design"
        ),
        new(
            Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Guid.Parse("90000000-0000-0000-0000-000000000003"),
            "H1 Lead Conversion Campaign",
            "Marketing",
            "MKTG",
            "Backlog",
            "Low",
            "Jihun Lee",
            "Top-of-funnel to SQL conversion improvements.",
            "Campaign delivery and optimization for lead conversion.",
            new DateOnly(2026, 2, 1),
            new DateOnly(2026, 7, 31),
            "Growth"
        ),
        new(
            Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Guid.Parse("90000000-0000-0000-0000-000000000001"),
            "Billing Reliability",
            "Product",
            "BILL",
            "Active",
            "High",
            "Yerin Choi",
            "Stabilize billing retries and reconciliation.",
            "Improve error handling, retriable jobs, and monitoring.",
            new DateOnly(2026, 1, 10),
            new DateOnly(2026, 5, 10),
            "Platform"
        ),
        new(
            Guid.Parse("55555555-5555-5555-5555-555555555555"),
            Guid.Parse("90000000-0000-0000-0000-000000000001"),
            "Search Relevance",
            "Product",
            "SRCH",
            "Backlog",
            "Medium",
            "Minjun Kim",
            "Improve ranking quality in issue search results.",
            "Tune ranking and query parsing for faster issue discovery.",
            null,
            null,
            "Work"
        ),
        new(
            Guid.Parse("66666666-6666-6666-6666-666666666666"),
            Guid.Parse("90000000-0000-0000-0000-000000000002"),
            "Accessibility Compliance",
            "Design",
            "A11Y",
            "Active",
            "High",
            "Seoyeon Park",
            "WCAG alignment across key workflows.",
            "Audit and remediate accessibility issues across major pages.",
            new DateOnly(2026, 2, 3),
            new DateOnly(2026, 8, 1),
            "Design"
        ),
        new(
            Guid.Parse("77777777-7777-7777-7777-777777777777"),
            Guid.Parse("90000000-0000-0000-0000-000000000002"),
            "UI Performance Budget",
            "Design",
            "UXPF",
            "Paused",
            "Low",
            "Seoyeon Park",
            "Control render cost on complex board views.",
            "Define and enforce frontend rendering budgets.",
            null,
            null,
            "Design"
        ),
        new(
            Guid.Parse("88888888-8888-8888-8888-888888888888"),
            Guid.Parse("90000000-0000-0000-0000-000000000003"),
            "Lifecycle Email Automation",
            "Marketing",
            "MAIL",
            "Active",
            "Medium",
            "Jihun Lee",
            "Improve onboarding and retention lifecycle triggers.",
            "Automate messaging based on behavior milestones.",
            new DateOnly(2026, 1, 20),
            new DateOnly(2026, 6, 30),
            "Growth"
        ),
        new(
            Guid.Parse("99999999-9999-9999-9999-999999999999"),
            Guid.Parse("90000000-0000-0000-0000-000000000003"),
            "SEO Landing Expansion",
            "Marketing",
            "SEOX",
            "Backlog",
            "Medium",
            "Jihun Lee",
            "Increase indexed pages and qualified inbound leads.",
            "Create templated landing pages with structured metadata.",
            null,
            new DateOnly(2026, 9, 30),
            "Growth"
        ),
        new(
            Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Guid.Parse("90000000-0000-0000-0000-000000000004"),
            "Incident Playbook Refresh",
            "Product",
            "SREP",
            "Active",
            "High",
            "Yerin Choi",
            "Standardize response and communication flows.",
            "Revise incident severity matrix and runbook structure.",
            new DateOnly(2026, 1, 5),
            new DateOnly(2026, 3, 15),
            "Reliability"
        ),
        new(
            Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Guid.Parse("90000000-0000-0000-0000-000000000004"),
            "Release Safety Gates",
            "Product",
            "SAFE",
            "Backlog",
            "Medium",
            "Yerin Choi",
            "Add pre-release checks for risky changes.",
            "Integrate test and checklist gates into release flow.",
            null,
            null,
            "Reliability"
        ),
        new(
            Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            Guid.Parse("90000000-0000-0000-0000-000000000001"),
            "Admin Audit Trail",
            "Product",
            "AUDT",
            "Completed",
            "Low",
            "Minjun Kim",
            "Audit history view for admin activities.",
            "Capture and expose key admin events for traceability.",
            new DateOnly(2025, 10, 1),
            new DateOnly(2025, 12, 20),
            "Work"
        ),
    ];

    public static async Task InitializeAsync(AppDbContext dbContext, CancellationToken cancellationToken = default)
    {
        await dbContext.Database.EnsureCreatedAsync(cancellationToken);
        await EnsureSchemaCompatibilityAsync(dbContext, cancellationToken);
        await SeedWorkspacesAsync(dbContext, cancellationToken);
        await SeedProjectsAsync(dbContext, cancellationToken);
        await SeedIssuesAsync(dbContext, cancellationToken);
    }

    private static async Task EnsureSchemaCompatibilityAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        await dbContext.Database.ExecuteSqlRawAsync(
            """
            CREATE TABLE IF NOT EXISTS workspaces (
                "Id" uuid PRIMARY KEY,
                "Name" character varying(120) NOT NULL,
                "Slug" character varying(120) NOT NULL,
                "Plan" character varying(32) NOT NULL,
                "Status" character varying(32) NOT NULL,
                "MemberCount" integer NOT NULL DEFAULT 1,
                "Lead" character varying(120) NULL,
                "Summary" character varying(400) NOT NULL DEFAULT '',
                "Description" character varying(4000) NOT NULL DEFAULT '',
                "CreatedAt" timestamp with time zone NOT NULL,
                "UpdatedAt" timestamp with time zone NOT NULL
            );
            """,
            cancellationToken
        );

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "WorkspaceId" uuid NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "KeyPrefix" character varying(6) NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "Status" character varying(32) NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "Priority" character varying(32) NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "Lead" character varying(120) NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "Summary" character varying(400) NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "Description" character varying(4000) NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "StartDate" date NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "TargetDate" date NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "Label" character varying(60) NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "CreatedAt" timestamp with time zone NULL;
            ALTER TABLE projects ADD COLUMN IF NOT EXISTS "UpdatedAt" timestamp with time zone NULL;
            """,
            cancellationToken
        );

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            INSERT INTO workspaces ("Id", "Name", "Slug", "Plan", "Status", "MemberCount", "Lead", "Summary", "Description", "CreatedAt", "UpdatedAt")
            VALUES ({0}, 'Product Development', 'product-development', 'Team', 'Active', 1, NULL, '', '', NOW(), NOW())
            ON CONFLICT ("Id") DO NOTHING;
            """,
            [DefaultWorkspaceId],
            cancellationToken
        );

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            UPDATE projects
            SET "WorkspaceId" = {0}
            WHERE "WorkspaceId" IS NULL;

            UPDATE projects
            SET "KeyPrefix" = CASE
                WHEN "Id" = '11111111-1111-1111-1111-111111111111' THEN 'TASK'
                WHEN "Id" = '22222222-2222-2222-2222-222222222222' THEN 'DSGN'
                WHEN "Id" = '33333333-3333-3333-3333-333333333333' THEN 'MKTG'
                ELSE 'PRJ'
            END
            WHERE "KeyPrefix" IS NULL OR BTRIM("KeyPrefix") = '';

            UPDATE projects
            SET "Status" = 'Backlog'
            WHERE "Status" IS NULL OR BTRIM("Status") = '';

            UPDATE projects
            SET "Priority" = 'None'
            WHERE "Priority" IS NULL OR BTRIM("Priority") = '';

            UPDATE projects
            SET "Summary" = ''
            WHERE "Summary" IS NULL;

            UPDATE projects
            SET "Description" = ''
            WHERE "Description" IS NULL;

            UPDATE projects
            SET "CreatedAt" = NOW()
            WHERE "CreatedAt" IS NULL;

            UPDATE projects
            SET "UpdatedAt" = NOW()
            WHERE "UpdatedAt" IS NULL;

            ALTER TABLE projects ALTER COLUMN "WorkspaceId" SET NOT NULL;
            ALTER TABLE projects ALTER COLUMN "KeyPrefix" SET NOT NULL;
            ALTER TABLE projects ALTER COLUMN "Status" SET NOT NULL;
            ALTER TABLE projects ALTER COLUMN "Priority" SET NOT NULL;
            ALTER TABLE projects ALTER COLUMN "Summary" SET NOT NULL;
            ALTER TABLE projects ALTER COLUMN "Description" SET NOT NULL;
            ALTER TABLE projects ALTER COLUMN "CreatedAt" SET NOT NULL;
            ALTER TABLE projects ALTER COLUMN "UpdatedAt" SET NOT NULL;
            """,
            [DefaultWorkspaceId],
            cancellationToken
        );

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'FK_projects_workspaces_WorkspaceId'
                ) THEN
                    ALTER TABLE projects
                    ADD CONSTRAINT "FK_projects_workspaces_WorkspaceId"
                    FOREIGN KEY ("WorkspaceId") REFERENCES workspaces("Id")
                    ON DELETE RESTRICT;
                END IF;
            END $$;
            """,
            cancellationToken
        );

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            CREATE INDEX IF NOT EXISTS "IX_projects_WorkspaceId" ON projects ("WorkspaceId");
            CREATE INDEX IF NOT EXISTS "IX_projects_WorkspaceId_UpdatedAt" ON projects ("WorkspaceId", "UpdatedAt");
            """,
            cancellationToken
        );

        await dbContext.Database.ExecuteSqlRawAsync(
            """
            ALTER TABLE issues
            ADD COLUMN IF NOT EXISTS "ParentIssueId" uuid NULL;
            CREATE INDEX IF NOT EXISTS "IX_issues_ProjectId_ParentIssueId_Order"
            ON issues ("ProjectId", "ParentIssueId", "Order");
            """,
            cancellationToken
        );
    }

    private static async Task SeedWorkspacesAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var existingById = await dbContext.Workspaces
            .ToDictionaryAsync(workspace => workspace.Id, cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var seed in WorkspaceSeeds)
        {
            if (!existingById.TryGetValue(seed.Id, out var workspace))
            {
                dbContext.Workspaces.Add(new Workspace
                {
                    Id = seed.Id,
                    Name = seed.Name,
                    Slug = seed.Slug,
                    Plan = seed.Plan,
                    Status = seed.Status,
                    MemberCount = seed.MemberCount,
                    Lead = seed.Lead,
                    Summary = seed.Summary,
                    Description = seed.Description,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
                continue;
            }

            workspace.Name = seed.Name;
            workspace.Slug = seed.Slug;
            workspace.Plan = seed.Plan;
            workspace.Status = seed.Status;
            workspace.MemberCount = seed.MemberCount;
            workspace.Lead = seed.Lead;
            workspace.Summary = seed.Summary;
            workspace.Description = seed.Description;
            workspace.UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedProjectsAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        var existingById = await dbContext.Projects
            .ToDictionaryAsync(project => project.Id, cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var seed in ProjectSeeds)
        {
            if (!existingById.TryGetValue(seed.Id, out var project))
            {
                dbContext.Projects.Add(new Project
                {
                    Id = seed.Id,
                    WorkspaceId = seed.WorkspaceId,
                    Name = seed.Name,
                    Type = seed.Type,
                    KeyPrefix = seed.KeyPrefix,
                    Status = seed.Status,
                    Priority = seed.Priority,
                    Lead = seed.Lead,
                    Summary = seed.Summary,
                    Description = seed.Description,
                    StartDate = seed.StartDate,
                    TargetDate = seed.TargetDate,
                    Label = seed.Label,
                    CreatedAt = now,
                    UpdatedAt = now,
                });
                continue;
            }

            project.WorkspaceId = seed.WorkspaceId;
            project.Name = seed.Name;
            project.Type = seed.Type;
            project.KeyPrefix = seed.KeyPrefix;
            project.Status = seed.Status;
            project.Priority = seed.Priority;
            project.Lead = seed.Lead;
            project.Summary = seed.Summary;
            project.Description = seed.Description;
            project.StartDate = seed.StartDate;
            project.TargetDate = seed.TargetDate;
            project.Label = seed.Label;
            project.UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static async Task SeedIssuesAsync(AppDbContext dbContext, CancellationToken cancellationToken)
    {
        if (await dbContext.Issues.AnyAsync(cancellationToken))
        {
            return;
        }

        var projects = await dbContext.Projects
            .AsNoTracking()
            .OrderBy(project => project.Name)
            .ToListAsync(cancellationToken);

        if (projects.Count == 0)
        {
            return;
        }

        var statuses = new[] { "Todo", "InProgress", "Done", "Cancel" };
        var priorities = new[] { "Low", "Medium", "High" };
        var assignees = new[] { "user-minjun", "user-seoyeon", "user-jihun", "user-yerin" };
        var now = DateTime.UtcNow;
        var issues = new List<Issue>(projects.Count * 9);

        foreach (var project in projects)
        {
            var parentIssueIds = new List<Guid>(6);
            var sequence = 1;

            for (var index = 0; index < 6; index++)
            {
                var issueId = Guid.NewGuid();
                parentIssueIds.Add(issueId);

                issues.Add(new Issue
                {
                    Id = issueId,
                    Key = BuildIssueKey(project.KeyPrefix, sequence),
                    ProjectId = project.Id,
                    ParentIssueId = null,
                    Title = $"{project.Name} task {index + 1}",
                    Description = "Operational backlog item seeded for realistic board testing.",
                    Status = statuses[index % statuses.Length],
                    Priority = priorities[index % priorities.Length],
                    AssigneeId = assignees[index % assignees.Length],
                    Order = index + 1,
                    CreatedAt = now.AddMinutes(-(index + 1) * 12),
                    UpdatedAt = now.AddMinutes(-(index + 1) * 7),
                });

                sequence += 1;
            }

            for (var index = 0; index < 3; index++)
            {
                issues.Add(new Issue
                {
                    Id = Guid.NewGuid(),
                    Key = BuildIssueKey(project.KeyPrefix, sequence),
                    ProjectId = project.Id,
                    ParentIssueId = parentIssueIds[index],
                    Title = $"{project.Name} subtask {index + 1}",
                    Description = "Child issue seeded under a parent issue for hierarchy validation.",
                    Status = statuses[(index + 1) % statuses.Length],
                    Priority = priorities[(index + 1) % priorities.Length],
                    AssigneeId = assignees[(index + 1) % assignees.Length],
                    Order = 1,
                    CreatedAt = now.AddMinutes(-(index + 1) * 9),
                    UpdatedAt = now.AddMinutes(-(index + 1) * 4),
                });

                sequence += 1;
            }
        }

        dbContext.Issues.AddRange(issues);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static string BuildIssueKey(string keyPrefix, int sequence)
    {
        var compact = Regex.Replace(keyPrefix.ToUpperInvariant(), "[^A-Z]", string.Empty);
        var safePrefix = compact.Length >= 2 ? compact[..Math.Min(6, compact.Length)] : "PRJ";
        return $"{safePrefix}-{sequence:000}";
    }

    private sealed record WorkspaceSeed(
        Guid Id,
        string Name,
        string Slug,
        string Plan,
        string Status,
        int MemberCount,
        string? Lead,
        string Summary,
        string Description
    );

    private sealed record ProjectSeed(
        Guid Id,
        Guid WorkspaceId,
        string Name,
        string Type,
        string KeyPrefix,
        string Status,
        string Priority,
        string? Lead,
        string Summary,
        string Description,
        DateOnly? StartDate,
        DateOnly? TargetDate,
        string? Label
    );
}
