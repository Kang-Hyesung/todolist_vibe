namespace Vibe.Api.Models;

public class Workspace
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Plan { get; set; } = "Team";
    public string Status { get; set; } = "Active";
    public int MemberCount { get; set; } = 1;
    public string? Lead { get; set; }
    public string Summary { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public ICollection<Project> Projects { get; set; } = new List<Project>();
}
