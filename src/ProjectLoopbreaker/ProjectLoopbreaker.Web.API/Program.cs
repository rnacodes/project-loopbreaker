using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Infrastructure.Data;

var builder = WebApplication.CreateBuilder(args);

// --- Add CORS Policy ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:3000") // Your React dev server
                   .AllowAnyHeader()
                   .AllowAnyMethod();
        });
});

builder.Services.AddControllers();

// --- Configure EF Core & PostgreSQL ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<MediaLibraryDbContext>(options =>
    options.UseNpgsql(connectionString));

// Add other services like Swagger if needed
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseRouting(); // Ensure routing is enabled

// --- Use CORS Policy ---
app.UseCors("AllowReactApp");

app.UseAuthorization();
app.MapControllers();
app.Run();