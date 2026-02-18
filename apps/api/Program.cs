using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vibe.Api.Data;
using Vibe.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddProblemDetails();
builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddPolicy("WebClient", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
builder.Services.Configure<ApiBehaviorOptions>((options) =>
{
    options.SuppressModelStateInvalidFilter = false;
});

builder.Services.AddDbContext<AppDbContext>((options) =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Host=localhost;Port=5432;Database=vibe;Username=vibe;Password=vibe";
    options.UseNpgsql(connectionString);
});

var app = builder.Build();

app.UseExceptionHandler();
app.UseCors("WebClient");

app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.EnsureCreated();
    dbContext.Database.ExecuteSqlRaw("""
        ALTER TABLE issues
        ADD COLUMN IF NOT EXISTS "ParentIssueId" uuid NULL;
        """);
    dbContext.Database.ExecuteSqlRaw("""
        CREATE INDEX IF NOT EXISTS "IX_issues_ProjectId_ParentIssueId_Order"
        ON issues ("ProjectId", "ParentIssueId", "Order");
        """);
    dbContext.Database.ExecuteSqlRaw("""
        UPDATE projects
        SET "Name" = CASE "Id"
            WHEN '11111111-1111-1111-1111-111111111111'::uuid THEN '통합 과제관리 웹앱'
            WHEN '22222222-2222-2222-2222-222222222222'::uuid THEN '디자인 시스템 고도화'
            WHEN '33333333-3333-3333-3333-333333333333'::uuid THEN '2026 상반기 리드전환 캠페인'
            ELSE "Name"
        END
        WHERE "Id" IN (
            '11111111-1111-1111-1111-111111111111'::uuid,
            '22222222-2222-2222-2222-222222222222'::uuid,
            '33333333-3333-3333-3333-333333333333'::uuid
        );
        """);
    dbContext.Database.ExecuteSqlRaw("""
        UPDATE issues
        SET
            "Title" = CASE "Title"
                WHEN 'Hierarchy child API test' THEN '계층 자식 이슈 API 검증'
                WHEN 'Hierarchy parent API test' THEN '계층 부모 이슈 API 검증'
                WHEN 'Validate API create from docker' THEN 'Docker 환경 API 생성 검증'
                WHEN 'test' THEN '백로그 정리 요청'
                ELSE "Title"
            END,
            "Description" = CASE "Description"
                WHEN 'child' THEN '부모 이슈 하위 생성/조회 동작을 검증합니다.'
                WHEN 'parent' THEN '부모 이슈 생성 및 상태 변경 동작을 검증합니다.'
                WHEN 'Smoke test for POST /issues' THEN 'POST /issues 기본 동작 스모크 테스트입니다.'
                WHEN 'test' THEN '테스트 데이터 정리용 항목입니다.'
                ELSE "Description"
            END,
            "AssigneeId" = CASE "AssigneeId"
                WHEN 'user-alex' THEN 'user-minjun'
                WHEN 'user-sarah' THEN 'user-seoyeon'
                WHEN 'user-mike' THEN 'user-jihun'
                WHEN 'user-david' THEN 'user-yerin'
                ELSE "AssigneeId"
            END;
        """);

    if (!dbContext.Projects.Any())
    {
        dbContext.Projects.AddRange(
            new Project
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
                Name = "통합 과제관리 웹앱",
                Type = "Product",
            },
            new Project
            {
                Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
                Name = "디자인 시스템 고도화",
                Type = "Design",
            },
            new Project
            {
                Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
                Name = "2026 상반기 리드전환 캠페인",
                Type = "Marketing",
            }
        );
        dbContext.SaveChanges();
    }
}

app.Run();
