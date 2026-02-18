using System.ComponentModel.DataAnnotations;

namespace Vibe.Api.Contracts;

public class ReorderIssuesRequest
{
    [Required]
    public Guid ProjectId { get; init; }

    [Required]
    [MinLength(1)]
    public List<Guid> IssueIds { get; init; } = [];
}
