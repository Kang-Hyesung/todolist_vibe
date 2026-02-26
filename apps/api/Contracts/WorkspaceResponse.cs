namespace Vibe.Api.Contracts;

public class WorkspaceResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public string Slug { get; init; } = string.Empty;
    public string Plan { get; init; } = "Team";
    public string Status { get; init; } = "Active";
    public int MemberCount { get; init; }
    public string? Lead { get; init; }
    public string Summary { get; init; } = string.Empty;
    public string Description { get; init; } = string.Empty;
    public DateTime CreatedAt { get; init; }
    public DateTime UpdatedAt { get; init; }
}
