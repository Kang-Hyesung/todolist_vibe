using System.ComponentModel.DataAnnotations;

namespace Vibe.Api.Contracts;

public class UpdateIssueRequest : IValidatableObject
{
    private static readonly HashSet<string> AllowedStatus = ["Todo", "InProgress", "Done", "Cancel"];
    private static readonly HashSet<string> AllowedPriority = ["Low", "Medium", "High"];

    public Guid? ParentIssueId { get; init; }

    [Required]
    [MaxLength(160)]
    public string Title { get; init; } = string.Empty;

    [MaxLength(4000)]
    public string? Description { get; init; }

    [Required]
    [MaxLength(32)]
    public string Status { get; init; } = "Todo";

    [Required]
    [MaxLength(32)]
    public string Priority { get; init; } = "Medium";

    [MaxLength(120)]
    public string? AssigneeId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!AllowedStatus.Contains(Status))
        {
            yield return new ValidationResult(
                "Status must be one of: Todo, InProgress, Done, Cancel.",
                [nameof(Status)]
            );
        }

        if (!AllowedPriority.Contains(Priority))
        {
            yield return new ValidationResult(
                "Priority must be one of: Low, Medium, High.",
                [nameof(Priority)]
            );
        }
    }
}
