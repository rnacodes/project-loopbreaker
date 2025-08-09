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
        if (builder.Environment.IsDevelopment())
        {
            // Development: Allow localhost
            policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            // Production: Allow your frontend domain and configure based on environment variables
            var allowedOrigins = new List<string>();
            
            // Add frontend URL from environment variable if provided
            var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
            if (!string.IsNullOrEmpty(frontendUrl))
            {
                allowedOrigins.Add(frontendUrl);
            }
            
            // Add any additional allowed origins from configuration
            var configuredOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
            if (configuredOrigins != null)
            {
                allowedOrigins.AddRange(configuredOrigins);
            }
            
            if (allowedOrigins.Any())
            {
                policy.WithOrigins(allowedOrigins.ToArray())
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            }
            else
            {
                // Fallback: Allow any origin (less secure, but prevents CORS errors during deployment testing)
                Console.WriteLine("WARNING: No specific frontend origins configured. Allowing all origins for CORS.");
                policy.AllowAnyOrigin()
                      .AllowAnyHeader()
                      .AllowAnyMethod();
            }
        }
    });
});

// Configure JSON serialization to return enums as strings
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// --- Configure EF Core & PostgreSQL ---
// Try to get connection string from various sources with priority:
// 1. Environment variable DATABASE_URL (Render.com standard)
// 2. Environment variable ConnectionStrings__DefaultConnection
// 3. Configuration DefaultConnection
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL") ??
                      Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") ??
                      builder.Configuration.GetConnectionString("DefaultConnection");

Console.WriteLine($"Connection string source: {(Environment.GetEnvironmentVariable("DATABASE_URL") != null ? "DATABASE_URL env var" : 
                                               Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection") != null ? "ConnectionStrings__DefaultConnection env var" : 
                                               "appsettings.json")}");

// Validate connection string before proceeding
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string is required but not configured. Please set DATABASE_URL environment variable or configure DefaultConnection in appsettings.json");
}

// Debug connection string (safely)
Console.WriteLine($"Connection string length: {connectionString.Length}");
Console.WriteLine($"Connection string starts with: {connectionString.Substring(0, Math.Min(20, connectionString.Length))}...");

// Handle potential connection string format issues
try
{
    // Test if the connection string can be parsed
    var testBuilder = new Npgsql.NpgsqlConnectionStringBuilder(connectionString);
    Console.WriteLine($"Connection string parsed successfully. Host: {testBuilder.Host}, Database: {testBuilder.Database}");
}
catch (Exception ex)
{
    Console.WriteLine($"ERROR: Failed to parse connection string: {ex.Message}");
    Console.WriteLine($"Raw connection string (first 100 chars): {connectionString.Substring(0, Math.Min(100, connectionString.Length))}");
    
    // Check for common issues and try to fix them
    var fixedConnectionString = connectionString;
    
    // Issue 1: Remove any leading/trailing whitespace
    fixedConnectionString = fixedConnectionString.Trim();
    
    // Issue 2: Handle URL-encoded characters that might cause issues
    if (fixedConnectionString.Contains("%"))
    {
        fixedConnectionString = Uri.UnescapeDataString(fixedConnectionString);
        Console.WriteLine("Attempted to URL-decode the connection string");
    }
    
    // Issue 3: Check if it's a postgres:// URL that needs to be converted to postgresql://
    if (fixedConnectionString.StartsWith("postgres://"))
    {
        fixedConnectionString = fixedConnectionString.Replace("postgres://", "postgresql://");
        Console.WriteLine("Converted postgres:// to postgresql://");
    }
    
    // Try parsing the fixed connection string
    try
    {
        var testBuilder2 = new Npgsql.NpgsqlConnectionStringBuilder(fixedConnectionString);
        Console.WriteLine($"Fixed connection string parsed successfully! Host: {testBuilder2.Host}, Database: {testBuilder2.Database}");
        connectionString = fixedConnectionString;
    }
    catch (Exception ex2)
    {
        Console.WriteLine($"ERROR: Even after fixes, connection string still invalid: {ex2.Message}");
        throw new InvalidOperationException($"Database connection string format is invalid. Original error: {ex.Message}. After fixes: {ex2.Message}");
    }
}

// Configure Npgsql for JSON serialization
var dataSourceBuilder = new Npgsql.NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.EnableDynamicJson(); // Enable dynamic JSON serialization for arrays
var dataSource = dataSourceBuilder.Build();

builder.Services.AddDbContext<MediaLibraryDbContext>(options =>
    options.UseNpgsql(dataSource));

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

        Console.WriteLine($"API Key found: {(!string.IsNullOrEmpty(apiKey) ? "YES" : "NO")}");
        Console.WriteLine($"API Key value: {apiKey}");

        if (string.IsNullOrEmpty(apiKey) || apiKey == "LISTENNOTES_API_KEY")
        {
            Console.WriteLine("WARNING: No valid ListenNotes API key found. Please set a valid API key.");
            throw new InvalidOperationException("ListenNotes API key is required but not configured properly.");
        }

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