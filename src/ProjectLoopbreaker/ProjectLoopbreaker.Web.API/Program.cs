using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Infrastructure.Clients;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Services;

var builder = WebApplication.CreateBuilder(args);

// --- Add CORS Policy ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();

// --- Configure EF Core & PostgreSQL ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<MediaLibraryDbContext>(options =>
    options.UseNpgsql(connectionString));

// Register IApplicationDbContext
builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetService<MediaLibraryDbContext>());

// Register Application Services
builder.Services.AddScoped<IPodcastMappingService, PodcastMappingService>();
builder.Services.AddScoped<IPodcastService, PodcastService>();

// In Program.cs

// Register ListenNotesApiClient based on environment
if (builder.Environment.IsDevelopment() && builder.Configuration.GetValue<bool>("UseMockListenNotesApi", false))
{
    builder.Services.AddHttpClient<MockListenNotesApiClient>(client =>
    {
        // No API key needed for mock client, base URL is set in the constructor
    });

    // Register the mock client as the implementation for ListenNotesApiClient
    builder.Services.AddScoped<ListenNotesApiClient>(sp =>
    {
        var httpClientFactory = sp.GetRequiredService<IHttpClientFactory>();
        return new ListenNotesApiClient(httpClientFactory.CreateClient(nameof(MockListenNotesApiClient)));
    });
}
else
{
    // Register real Listen Notes API client
    builder.Services.AddHttpClient<ListenNotesApiClient>(client =>
    {
        client.BaseAddress = new Uri("https://listen-api.listennotes.com/api/v2/");

        // Try to get API key from various sources with priority:
        // 1. Environment variable (Render.com)
        // 2. Configuration (appsettings.json)
        // 3. User secrets
        var apiKey = builder.Configuration["LISTENNOTES_API_KEY"] ??
                     builder.Configuration["ApiKeys:ListenNotes"] ??
                     builder.Configuration["ListenNotes_ApiKey"];

        client.DefaultRequestHeaders.Add("X-ListenAPI-Key", apiKey);
    });
}


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

//app.UseHttpsRedirection();
app.UseRouting(); // Ensure routing is enabled

// --- Use CORS Policy ---
app.UseCors("AllowFrontend");

app.UseAuthorization();
app.MapControllers();

Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");
Console.WriteLine($"Connection string: {connectionString}");

app.Run();