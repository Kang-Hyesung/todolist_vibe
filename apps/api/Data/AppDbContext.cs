using Microsoft.EntityFrameworkCore;
using Vibe.Api.Models;

namespace Vibe.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Issue> Issues => Set<Issue>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Project>(entity =>
        {
            entity.ToTable("projects");
            entity.HasKey(project => project.Id);
            entity.Property(project => project.Name).HasMaxLength(120).IsRequired();
            entity.Property(project => project.Type).HasMaxLength(32).IsRequired();
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
