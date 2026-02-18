namespace Vibe.Api.Contracts;

public class IssueResponse
{
    public Guid Id { get; init; }
    public string Key { get; init; } = string.Empty;
    public Guid ProjectId { get; init; }
    public Guid? ParentIssueId { get; init; }
    public string Title { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string Priority { get; init; } = string.Empty;
    public string? AssigneeId { get; init; }
    public int Order { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
