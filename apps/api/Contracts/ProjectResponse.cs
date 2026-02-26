namespace Vibe.Api.Contracts;

public class ProjectResponse
{
    public Guid Id { get; init; }
    public Guid WorkspaceId { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Type { get; init; } = "Product";
    public string KeyPrefix { get; init; } = "PRJ";
    public string Status { get; init; } = "Backlog";
    public string Priority { get; init; } = "None";
    public string? Lead { get; init; }
    public string Summary { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateOnly? StartDate { get; init; }
    public DateOnly? TargetDate { get; init; }
    public string? Label { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
