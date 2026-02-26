using Microsoft.EntityFrameworkCore;
using Vibe.Api.Models;

namespace Vibe.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Issue> Issues => Set<Issue>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Workspace>(entity =>
        {
            entity.ToTable("workspaces");
            entity.HasKey(workspace => workspace.Id);
            entity.Property(workspace => workspace.Name).HasMaxLength(120).IsRequired();
            entity.Property(workspace => workspace.Slug).HasMaxLength(120).IsRequired();
            entity.Property(workspace => workspace.Plan).HasMaxLength(32).IsRequired();
            entity.Property(workspace => workspace.Status).HasMaxLength(32).IsRequired();
            entity.Property(workspace => workspace.MemberCount).IsRequired();
            entity.Property(workspace => workspace.Lead).HasMaxLength(120);
            entity.Property(workspace => workspace.Summary).HasMaxLength(400).IsRequired();
            entity.Property(workspace => workspace.Description).HasMaxLength(4000).IsRequired();
            entity.Property(workspace => workspace.CreatedAt).IsRequired();
            entity.Property(workspace => workspace.UpdatedAt).IsRequired();
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("projects");
            entity.HasKey(project => project.Id);
            entity.Property(project => project.WorkspaceId).IsRequired();
            entity.Property(project => project.Name).HasMaxLength(120).IsRequired();
            entity.Property(project => project.Type).HasMaxLength(32).IsRequired();
            entity.Property(project => project.KeyPrefix).HasMaxLength(6).IsRequired();
            entity.Property(project => project.Status).HasMaxLength(32).IsRequired();
            entity.Property(project => project.Priority).HasMaxLength(32).IsRequired();
            entity.Property(project => project.Lead).HasMaxLength(120);
            entity.Property(project => project.Summary).HasMaxLength(400).IsRequired();
            entity.Property(project => project.Description).HasMaxLength(4000).IsRequired();
            entity.Property(project => project.Label).HasMaxLength(60);
            entity.Property(project => project.CreatedAt).IsRequired();
            entity.Property(project => project.UpdatedAt).IsRequired();

            entity.HasOne(project => project.Workspace)
                .WithMany(workspace => workspace.Projects)
                .HasForeignKey(project => project.WorkspaceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(project => project.WorkspaceId);
            entity.HasIndex(project => new { project.WorkspaceId, project.UpdatedAt });
        });

        modelBuilder.Entity<Issue>(entity =>
        {
            entity.ToTable("issues");
            entity.HasKey(issue => issue.Id);

            entity.Property(issue => issue.Key).HasMaxLength(40).IsRequired();
            entity.Property(issue => issue.Title).HasMaxLength(160).IsRequired();
            entity.Property(issue => issue.Description).HasMaxLength(4000);
            entity.Property(issue => issue.Status).HasMaxLength(32).IsRequired();
            entity.Property(issue => issue.Priority).HasMaxLength(32).IsRequired();
            entity.Property(issue => issue.AssigneeId).HasMaxLength(120);
            entity.Property(issue => issue.ParentIssueId);
            entity.Property(issue => issue.Order).IsRequired();
            entity.Property(issue => issue.CreatedAt).IsRequired();
            entity.Property(issue => issue.UpdatedAt).IsRequired();

            entity.HasOne(issue => issue.Project)
                .WithMany(project => project.Issues)
                .HasForeignKey(issue => issue.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(issue => issue.ParentIssue)
                .WithMany(issue => issue.ChildIssues)
                .HasForeignKey(issue => issue.ParentIssueId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(issue => new { issue.ProjectId, issue.Order });
            entity.HasIndex(issue => new { issue.ProjectId, issue.ParentIssueId, issue.Order });
        });
    }
}
