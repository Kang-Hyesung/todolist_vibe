using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace Vibe.Api.Contracts;

public class UpdateProjectRequest : IValidatableObject
{
    private static readonly HashSet<string> AllowedType = ["Product", "Design", "Marketing"];
    private static readonly HashSet<string> AllowedStatus = ["Backlog", "Active", "Paused", "Completed"];
    private static readonly HashSet<string> AllowedPriority = ["None", "Low", "Medium", "High"];

    [Required]
    public Guid WorkspaceId { get; init; }

    [Required]
    [MaxLength(120)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [MaxLength(32)]
    public string Type { get; init; } = "Product";

    [Required]
    [MaxLength(6)]
    public string KeyPrefix { get; init; } = "PRJ";

    [Required]
    [MaxLength(32)]
    public string Status { get; init; } = "Backlog";

    [Required]
    [MaxLength(32)]
    public string Priority { get; init; } = "None";

    [MaxLength(120)]
    public string? Lead { get; init; }

    [MaxLength(400)]
    public string? Summary { get; init; }

    [MaxLength(4000)]
    public string? Description { get; init; }

    public DateOnly? StartDate { get; init; }
    public DateOnly? TargetDate { get; init; }

    [MaxLength(60)]
    public string? Label { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (WorkspaceId == Guid.Empty)
        {
            yield return new ValidationResult("WorkspaceId is required.", [nameof(WorkspaceId)]);
        }

        if (!AllowedType.Contains(Type))
        {
            yield return new ValidationResult(
                "Type must be one of: Product, Design, Marketing.",
                [nameof(Type)]
            );
        }

        if (!AllowedStatus.Contains(Status))
        {
            yield return new ValidationResult(
                "Status must be one of: Backlog, Active, Paused, Completed.",
                [nameof(Status)]
            );
        }

        if (!AllowedPriority.Contains(Priority))
        {
            yield return new ValidationResult(
                "Priority must be one of: None, Low, Medium, High.",
                [nameof(Priority)]
            );
        }

        if (!Regex.IsMatch(KeyPrefix, "^[A-Z]{2,6}$"))
        {
            yield return new ValidationResult(
                "KeyPrefix must be 2 to 6 uppercase English letters.",
                [nameof(KeyPrefix)]
            );
        }

        if (StartDate.HasValue && TargetDate.HasValue && StartDate.Value > TargetDate.Value)
        {
            yield return new ValidationResult(
                "StartDate cannot be later than TargetDate.",
                [nameof(StartDate), nameof(TargetDate)]
            );
        }
    }
}
