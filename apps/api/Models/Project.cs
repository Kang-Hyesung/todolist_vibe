namespace Vibe.Api.Models;

public class Project
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Product";
    public ICollection<Issue> Issues { get; set; } = new List<Issue>();
}
