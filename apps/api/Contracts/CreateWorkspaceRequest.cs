using System.ComponentModel.DataAnnotations;

namespace Vibe.Api.Contracts;

public class CreateWorkspaceRequest : IValidatableObject
{
    private static readonly HashSet<string> AllowedPlan = ["Starter", "Team", "Scale"];
    private static readonly HashSet<string> AllowedStatus = ["Active", "Paused", "Archived"];

    [Required]
    [MaxLength(120)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string Plan { get; init; } = "Team";

    [Required]
    [MaxLength(32)]
    public string Status { get; init; } = "Active";

    [Range(1, 100000)]
    public int MemberCount { get; init; } = 1;

    [MaxLength(120)]
    public string? Lead { get; init; }

    [MaxLength(400)]
    public string? Summary { get; init; }

    [MaxLength(4000)]
    public string? Description { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (!AllowedPlan.Contains(Plan))
        {
            yield return new ValidationResult(
                "Plan must be one of: Starter, Team, Scale.",
                [nameof(Plan)]
            );
        }

        if (!AllowedStatus.Contains(Status))
        {
            yield return new ValidationResult(
                "Status must be one of: Active, Paused, Archived.",
                [nameof(Status)]
            );
        }
    }
}
