using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;
using Vibe.Api.Contracts;
using Vibe.Api.Data;
using Vibe.Api.Models;

namespace Vibe.Api.Controllers;

[ApiController]
[Route("issues")]
public class IssuesController(AppDbContext dbContext) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<List<IssueResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<IssueResponse>>> GetIssues([FromQuery] Guid projectId, CancellationToken cancellationToken)
    {
        if (projectId == Guid.Empty)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["projectId"] = ["projectId is required."]
            }));
        }

        var issues = await dbContext.Issues
            .AsNoTracking()
            .Where(issue => issue.ProjectId == projectId)
            .OrderBy(issue => issue.Order)
            .ThenBy(issue => issue.CreatedAt)
            .Select(issue => Map(issue))
            .ToListAsync(cancellationToken);

        return Ok(issues);
    }

    [HttpPost]
    [ProducesResponseType<IssueResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IssueResponse>> CreateIssue([FromBody] CreateIssueRequest request, CancellationToken cancellationToken)
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(project => project.Id == request.ProjectId, cancellationToken);

        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Project not found",
                Detail = "Cannot create issue because the target project does not exist.",
            });
        }

        if (request.ParentIssueId.HasValue)
        {
            var parentExists = await dbContext.Issues.AnyAsync(
                issue => issue.ProjectId == request.ProjectId && issue.Id == request.ParentIssueId.Value,
                cancellationToken
            );

            if (!parentExists)
            {
                return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
                {
                    ["parentIssueId"] = ["parentIssueId must reference an issue in the same project."]
                }));
            }
        }

        var maxOrder = await dbContext.Issues
            .Where(issue => issue.ProjectId == request.ProjectId && issue.ParentIssueId == request.ParentIssueId)
            .MaxAsync(issue => (int?)issue.Order, cancellationToken);

        var nextOrder = request.Order ?? (maxOrder ?? 0) + 1;

        var issue = new Issue
        {
            Id = Guid.NewGuid(),
            Key = BuildIssueKey(project, nextOrder),
            ProjectId = request.ProjectId,
            ParentIssueId = request.ParentIssueId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Status = request.Status,
            Priority = request.Priority,
            AssigneeId = string.IsNullOrWhiteSpace(request.AssigneeId) ? null : request.AssigneeId.Trim(),
            Order = nextOrder,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        dbContext.Issues.Add(issue);
        await dbContext.SaveChangesAsync(cancellationToken);

        var response = Map(issue);
        return CreatedAtAction(nameof(GetIssues), new { projectId = issue.ProjectId }, response);
    }

    [HttpPatch("{id:guid}")]
    [ProducesResponseType<IssueResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IssueResponse>> UpdateIssue(
        [FromRoute] Guid id,
        [FromBody] UpdateIssueRequest request,
        CancellationToken cancellationToken
    )
    {
        var issue = await dbContext.Issues.FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);

        if (issue is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Issue not found",
                Detail = "Cannot update issue because it does not exist.",
            });
        }

        if (request.ParentIssueId == issue.Id)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["parentIssueId"] = ["An issue cannot be its own parent."]
            }));
        }

        if (request.ParentIssueId.HasValue)
        {
            var parentExists = await dbContext.Issues.AnyAsync(
                candidate => candidate.ProjectId == issue.ProjectId && candidate.Id == request.ParentIssueId.Value,
                cancellationToken
            );

            if (!parentExists)
            {
                return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
                {
                    ["parentIssueId"] = ["parentIssueId must reference an issue in the same project."]
                }));
            }

            var cycleDetected = await CreatesHierarchyCycle(
                issue.ProjectId,
                issue.Id,
                request.ParentIssueId.Value,
                cancellationToken
            );

            if (cycleDetected)
            {
                return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
                {
                    ["parentIssueId"] = ["Cannot move an issue under its own descendant."]
                }));
            }
        }

        var previousParentIssueId = issue.ParentIssueId;
        var parentChanged = previousParentIssueId != request.ParentIssueId;

        if (parentChanged)
        {
            var oldSiblings = await dbContext.Issues
                .Where(candidate =>
                    candidate.ProjectId == issue.ProjectId &&
                    candidate.ParentIssueId == previousParentIssueId &&
                    candidate.Id != issue.Id
                )
                .OrderBy(candidate => candidate.Order)
                .ThenBy(candidate => candidate.CreatedAt)
                .ToListAsync(cancellationToken);

            for (var index = 0; index < oldSiblings.Count; index++)
            {
                oldSiblings[index].Order = index + 1;
            }

            var nextMaxOrder = await dbContext.Issues
                .Where(candidate =>
                    candidate.ProjectId == issue.ProjectId &&
                    candidate.ParentIssueId == request.ParentIssueId &&
                    candidate.Id != issue.Id
                )
                .MaxAsync(candidate => (int?)candidate.Order, cancellationToken);

            issue.ParentIssueId = request.ParentIssueId;
            issue.Order = (nextMaxOrder ?? 0) + 1;
        }

        issue.Title = request.Title.Trim();
        issue.Description = request.Description?.Trim() ?? string.Empty;
        issue.Status = request.Status;
        issue.Priority = request.Priority;
        issue.AssigneeId = string.IsNullOrWhiteSpace(request.AssigneeId) ? null : request.AssigneeId.Trim();
        issue.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(Map(issue));
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteIssue([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var issue = await dbContext.Issues
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.Id == id, cancellationToken);

        if (issue is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Issue not found",
                Detail = "Cannot delete issue because it does not exist.",
            });
        }

        var deleteIds = await CollectIssueSubtreeIds(issue.ProjectId, issue.Id, cancellationToken);
        var issuesToDelete = await dbContext.Issues
            .Where(candidate => deleteIds.Contains(candidate.Id))
            .ToListAsync(cancellationToken);

        if (issuesToDelete.Count > 0)
        {
            dbContext.Issues.RemoveRange(issuesToDelete);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        await ReindexSiblingOrders(issue.ProjectId, issue.ParentIssueId, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPut("reorder")]
    [ProducesResponseType<List<IssueResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<List<IssueResponse>>> ReorderIssues(
        [FromBody] ReorderIssuesRequest request,
        CancellationToken cancellationToken
    )
    {
        var project = await dbContext.Projects
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.Id == request.ProjectId, cancellationToken);

        if (project is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Project not found",
                Detail = "Cannot reorder because the target project does not exist.",
            });
        }

        var issues = await dbContext.Issues
            .Where(issue => issue.ProjectId == request.ProjectId)
            .OrderBy(issue => issue.Order)
            .ThenBy(issue => issue.CreatedAt)
            .ToListAsync(cancellationToken);

        if (issues.Count == 0)
        {
            return Ok(new List<IssueResponse>());
        }

        var requestedIds = request.IssueIds.Distinct().ToList();
        var issueById = issues.ToDictionary(issue => issue.Id);
        var invalidIds = requestedIds.Where(id => !issueById.ContainsKey(id)).ToList();

        if (invalidIds.Count > 0)
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["issueIds"] = ["One or more issueIds do not belong to the project."]
            }));
        }

        var targetParentIssueId = issueById[requestedIds[0]].ParentIssueId;
        if (requestedIds.Any(id => issueById[id].ParentIssueId != targetParentIssueId))
        {
            return BadRequest(new ValidationProblemDetails(new Dictionary<string, string[]>
            {
                ["issueIds"] = ["Reorder payload must only include issues from the same parent level."]
            }));
        }

        var requestedSet = requestedIds.ToHashSet();
        var siblings = issues
            .Where(issue => issue.ParentIssueId == targetParentIssueId)
            .OrderBy(issue => issue.Order)
            .ThenBy(issue => issue.CreatedAt)
            .ToList();

        var orderedSiblings = new List<Issue>(siblings.Count);
        orderedSiblings.AddRange(requestedIds.Select(id => issueById[id]));
        orderedSiblings.AddRange(siblings.Where(issue => !requestedSet.Contains(issue.Id)));

        var now = DateTime.UtcNow;
        for (var index = 0; index < orderedSiblings.Count; index++)
        {
            orderedSiblings[index].Order = index + 1;
            orderedSiblings[index].UpdatedAt = now;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var response = issues
            .OrderBy(issue => issue.Order)
            .ThenBy(issue => issue.CreatedAt)
            .Select(Map)
            .ToList();

        return Ok(response);
    }

    private static string BuildIssueKey(Project project, int sequence)
    {
        var compact = Regex.Replace(project.Name.ToUpperInvariant(), "[^A-Z0-9]", string.Empty);
        var prefix = compact.Length >= 4 ? compact[..4] : compact.PadRight(4, 'X');
        return $"{prefix}-{sequence:000}";
    }

    private async Task<HashSet<Guid>> CollectIssueSubtreeIds(
        Guid projectId,
        Guid rootIssueId,
        CancellationToken cancellationToken
    )
    {
        var links = await dbContext.Issues
            .AsNoTracking()
            .Where(issue => issue.ProjectId == projectId)
            .Select(issue => new { issue.Id, issue.ParentIssueId })
            .ToListAsync(cancellationToken);

        var childrenByParent = links
            .Where(link => link.ParentIssueId.HasValue)
            .GroupBy(link => link.ParentIssueId!.Value)
            .ToDictionary(group => group.Key, group => group.Select(link => link.Id).ToList());

        var visited = new HashSet<Guid> { rootIssueId };
        var queue = new Queue<Guid>();
        queue.Enqueue(rootIssueId);

        while (queue.Count > 0)
        {
            var current = queue.Dequeue();
            if (!childrenByParent.TryGetValue(current, out var children))
            {
                continue;
            }

            foreach (var childId in children)
            {
                if (visited.Add(childId))
                {
                    queue.Enqueue(childId);
                }
            }
        }

        return visited;
    }

    private async Task ReindexSiblingOrders(Guid projectId, Guid? parentIssueId, CancellationToken cancellationToken)
    {
        var siblings = await dbContext.Issues
            .Where(issue => issue.ProjectId == projectId && issue.ParentIssueId == parentIssueId)
            .OrderBy(issue => issue.Order)
            .ThenBy(issue => issue.CreatedAt)
            .ToListAsync(cancellationToken);

        for (var index = 0; index < siblings.Count; index++)
        {
            siblings[index].Order = index + 1;
            siblings[index].UpdatedAt = DateTime.UtcNow;
        }
    }

    private async Task<bool> CreatesHierarchyCycle(
        Guid projectId,
        Guid issueId,
        Guid parentIssueId,
        CancellationToken cancellationToken
    )
    {
        var cursor = parentIssueId;
        var visited = new HashSet<Guid>();

        while (true)
        {
            if (cursor == issueId)
            {
                return true;
            }

            if (!visited.Add(cursor))
            {
                return false;
            }

            var nextParent = await dbContext.Issues
                .AsNoTracking()
                .Where(candidate => candidate.ProjectId == projectId && candidate.Id == cursor)
                .Select(candidate => candidate.ParentIssueId)
                .FirstOrDefaultAsync(cancellationToken);

            if (!nextParent.HasValue)
            {
                return false;
            }

            cursor = nextParent.Value;
        }
    }

    private static IssueResponse Map(Issue issue)
    {
        return new IssueResponse
        {
            Id = issue.Id,
            Key = issue.Key,
            ProjectId = issue.ProjectId,
            ParentIssueId = issue.ParentIssueId,
            Title = issue.Title,
            Description = issue.Description,
            Status = issue.Status,
            Priority = issue.Priority,
            AssigneeId = issue.AssigneeId,
            Order = issue.Order,
            CreatedAt = issue.CreatedAt,
            UpdatedAt = issue.UpdatedAt,
        };
    }
}
