namespace Vibe.Api.Models;

public class Project
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Workspace? Workspace { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Product";
    public string KeyPrefix { get; set; } = "PRJ";
    public string Status { get; set; } = "Backlog";
    public string Priority { get; set; } = "None";
    public string? Lead { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateOnly? StartDate { get; set; }
    public DateOnly? TargetDate { get; set; }
    public string? Label { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}
