namespace Vibe.Api.Models;

public class Issue
{
    public Guid Id { get; set; }
    public string Key { get; set; } = string.Empty;
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid? ParentIssueId { get; set; }
    public Issue? ParentIssue { get; set; }
    public ICollection<Issue> ChildIssues { get; set; } = new List<Issue>();

    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "Todo";
    public string Priority { get; set; } = "Medium";
    public string? AssigneeId { get; set; }

    public int Order { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
