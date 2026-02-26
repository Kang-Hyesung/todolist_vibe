using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Vibe.Api.Contracts;
using Vibe.Api.Data;
using Vibe.Api.Models;

namespace Vibe.Api.Controllers;

[ApiController]
[Route("workspaces")]
public class WorkspacesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<WorkspaceResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<WorkspaceResponse>>> GetWorkspaces(CancellationToken cancellationToken)
    {
        var workspaces = await dbContext.Workspaces
            .AsNoTracking()
            .OrderBy(workspace => workspace.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(workspaces.Select(Map).ToList());
    }

    [HttpPost]
    [ProducesResponseType<WorkspaceResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WorkspaceResponse>> CreateWorkspace(
        [FromBody] CreateWorkspaceRequest request,
        CancellationToken cancellationToken
    )
    {
        var now = DateTime.UtcNow;
        var workspace = new Workspace
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Slug = BuildSlug(request.Name),
            Plan = request.Plan,
            Status = request.Status,
            MemberCount = request.MemberCount,
            Lead = NormalizeNullable(request.Lead),
            Summary = NormalizeRequired(request.Summary),
            Description = NormalizeRequired(request.Description),
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.Workspaces.Add(workspace);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Created($"workspaces/{workspace.Id}", Map(workspace));
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType<WorkspaceResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WorkspaceResponse>> UpdateWorkspace(
        [FromRoute] Guid id,
        [FromBody] UpdateWorkspaceRequest request,
        CancellationToken cancellationToken
    )
    {
        var workspace = await dbContext.Workspaces.FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (workspace is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Workspace not found",
                Detail = "Cannot update workspace because it does not exist.",
            });
        }

        workspace.Name = request.Name.Trim();
        workspace.Slug = BuildSlug(request.Name);
        workspace.Plan = request.Plan;
        workspace.Status = request.Status;
        workspace.MemberCount = request.MemberCount;
        workspace.Lead = NormalizeNullable(request.Lead);
        workspace.Summary = NormalizeRequired(request.Summary);
        workspace.Description = NormalizeRequired(request.Description);
        workspace.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(Map(workspace));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> DeleteWorkspace([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var workspace = await dbContext.Workspaces.FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (workspace is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Workspace not found",
                Detail = "Cannot delete workspace because it does not exist.",
            });
        }

        var projectExists = await dbContext.Projects.AnyAsync(project => project.WorkspaceId == id, cancellationToken);
        if (projectExists)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Workspace has projects",
                Detail = "Cannot delete workspace while projects still exist.",
            });
        }

        dbContext.Workspaces.Remove(workspace);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static WorkspaceResponse Map(Workspace workspace)
    {
        return new WorkspaceResponse
        {
            Id = workspace.Id,
            Name = workspace.Name,
            Slug = workspace.Slug,
            Plan = workspace.Plan,
            Status = workspace.Status,
            MemberCount = workspace.MemberCount,
            Lead = workspace.Lead,
            Summary = workspace.Summary,
            Description = workspace.Description,
            CreatedAt = workspace.CreatedAt,
            UpdatedAt = workspace.UpdatedAt,
        };
    }

    private static string BuildSlug(string name)
    {
        var normalized = Regex.Replace(name.Trim().ToLowerInvariant(), "[^a-z0-9]+", "-").Trim('-');
        return string.IsNullOrWhiteSpace(normalized) ? "workspace" : normalized;
    }

    private static string NormalizeRequired(string? value)
    {
        return value?.Trim() ?? string.Empty;
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
