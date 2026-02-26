using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Vibe.Api.Data;

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
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = false;
});

builder.Services.AddDbContext<AppDbContext>(options =>
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
    await AppDataInitializer.InitializeAsync(dbContext);
}

app.Run();
