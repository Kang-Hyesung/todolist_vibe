using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vibe.Api.Contracts;
using Vibe.Api.Data;
using Vibe.Api.Models;

namespace Vibe.Api.Controllers;

[ApiController]
[Route("projects")]
public class ProjectsController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<ProjectResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<ProjectResponse>>> GetProjects(
        [FromQuery] Guid? workspaceId,
        CancellationToken cancellationToken
    )
    {
        var query = dbContext.Projects
            .AsNoTracking()
            .AsQueryable();

        if (workspaceId.HasValue)
        {
            query = query.Where(project => project.WorkspaceId == workspaceId.Value);
        }

        var projects = await query
            .OrderByDescending(project => project.UpdatedAt)
            .ThenBy(project => project.Name)
            .ToListAsync(cancellationToken);

        return Ok(projects.Select(Map).ToList());
    }

    [HttpPost]
    [ProducesResponseType<ProjectResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectResponse>> CreateProject(
        [FromBody] CreateProjectRequest request,
        CancellationToken cancellationToken
    )
    {
        var workspaceExists = await dbContext.Workspaces.AnyAsync(
            workspace => workspace.Id == request.WorkspaceId,
            cancellationToken
        );

        if (!workspaceExists)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Workspace not found",
                Detail = "Cannot create project because the target workspace does not exist.",
            });
        }

        var now = DateTime.UtcNow;
        var project = new Project
        {
            Id = Guid.NewGuid(),
            WorkspaceId = request.WorkspaceId,
            Name = request.Name.Trim(),
            Type = request.Type,
            KeyPrefix = request.KeyPrefix.Trim().ToUpperInvariant(),
            Status = request.Status,
            Priority = request.Priority,
            Lead = NormalizeNullable(request.Lead),
            Summary = NormalizeRequired(request.Summary),
            Description = NormalizeRequired(request.Description),
            StartDate = request.StartDate,
            TargetDate = request.TargetDate,
            Label = NormalizeNullable(request.Label),
            CreatedAt = now,
            UpdatedAt = now,
        };

        dbContext.Projects.Add(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Created($"projects/{project.Id}", Map(project));
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType<ProjectResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ProjectResponse>> UpdateProject(
        [FromRoute] Guid id,
        [FromBody] UpdateProjectRequest request,
        CancellationToken cancellationToken
    )
    {
        var project = await dbContext.Projects.FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Project not found",
                Detail = "Cannot update project because it does not exist.",
            });
        }

        var workspaceExists = await dbContext.Workspaces.AnyAsync(
            workspace => workspace.Id == request.WorkspaceId,
            cancellationToken
        );

        if (!workspaceExists)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Workspace not found",
                Detail = "Cannot update project because the target workspace does not exist.",
            });
        }

        project.WorkspaceId = request.WorkspaceId;
        project.Name = request.Name.Trim();
        project.Type = request.Type;
        project.KeyPrefix = request.KeyPrefix.Trim().ToUpperInvariant();
        project.Status = request.Status;
        project.Priority = request.Priority;
        project.Lead = NormalizeNullable(request.Lead);
        project.Summary = NormalizeRequired(request.Summary);
        project.Description = NormalizeRequired(request.Description);
        project.StartDate = request.StartDate;
        project.TargetDate = request.TargetDate;
        project.Label = NormalizeNullable(request.Label);
        project.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(Map(project));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteProject([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects.FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);
        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Project not found",
                Detail = "Cannot delete project because it does not exist.",
            });
        }

        var issues = await dbContext.Issues.Where(issue => issue.ProjectId == id).ToListAsync(cancellationToken);
        if (issues.Count > 0)
        {
            dbContext.Issues.RemoveRange(issues);
        }

        dbContext.Projects.Remove(project);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static ProjectResponse Map(Project project)
    {
        return new ProjectResponse
        {
            Id = project.Id,
            WorkspaceId = project.WorkspaceId,
            Name = project.Name,
            Type = project.Type,
            KeyPrefix = project.KeyPrefix,
            Status = project.Status,
            Priority = project.Priority,
            Lead = project.Lead,
            Summary = project.Summary,
            Description = project.Description,
            StartDate = project.StartDate,
            TargetDate = project.TargetDate,
            Label = project.Label,
            CreatedAt = project.CreatedAt,
            UpdatedAt = project.UpdatedAt,
        };
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
