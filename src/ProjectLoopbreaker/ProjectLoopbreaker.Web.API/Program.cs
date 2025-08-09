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

// Show the connection string pattern without exposing credentials
var pattern = System.Text.RegularExpressions.Regex.Replace(connectionString, @"://([^:]+):([^@]+)@", "://[USER]:[PASSWORD]@");
Console.WriteLine($"Connection string pattern: {pattern}");

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
    
    // Issue 4: Check if the connection string is complete (has all required parts)
    var uriMatch = System.Text.RegularExpressions.Regex.Match(fixedConnectionString, @"^postgresql://([^:]+):([^@]+)@([^/]+)/(.+)$");
    if (!uriMatch.Success)
    {
        Console.WriteLine("ERROR: Connection string doesn't match expected PostgreSQL URL format: postgresql://user:password@host/database");
        Console.WriteLine($"Full connection string length: {fixedConnectionString.Length}");
        Console.WriteLine($"Connection string ends with: ...{fixedConnectionString.Substring(Math.Max(0, fixedConnectionString.Length - 20))}");
        
        // Check if it's just missing the database name or has other issues
        if (fixedConnectionString.EndsWith("/"))
        {
            Console.WriteLine("ERROR: Connection string ends with '/' but has no database name");
        }
        else if (!fixedConnectionString.Contains("/") || fixedConnectionString.LastIndexOf("/") == fixedConnectionString.IndexOf("//") + 1)
        {
            Console.WriteLine("ERROR: Connection string is missing database name part");
        }
        
        throw new InvalidOperationException($"Connection string format is invalid. Expected format: postgresql://user:password@host/database. Got: {pattern}");
    }
    
    Console.WriteLine($"Connection string appears to have correct format: user={uriMatch.Groups[1].Value}, host={uriMatch.Groups[3].Value}, database={uriMatch.Groups[4].Value}");
    
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
        
        // Try alternative: parse manually and rebuild
        try
        {
            Console.WriteLine("Attempting to manually parse and rebuild connection string...");
            var user = uriMatch.Groups[1].Value;
            var password = uriMatch.Groups[2].Value;
            var host = uriMatch.Groups[3].Value;
            var database = uriMatch.Groups[4].Value;
            
            // Rebuild as key-value format instead of URL format
            var rebuiltConnectionString = $"Host={host};Database={database};Username={user};Password={password};SSL Mode=Require;Trust Server Certificate=true";
            Console.WriteLine($"Rebuilt connection string format: Host={host};Database={database};Username={user};Password=[HIDDEN];SSL Mode=Require;Trust Server Certificate=true");
            
            var testBuilder3 = new Npgsql.NpgsqlConnectionStringBuilder(rebuiltConnectionString);
            Console.WriteLine($"Rebuilt connection string parsed successfully! Host: {testBuilder3.Host}, Database: {testBuilder3.Database}");
            connectionString = rebuiltConnectionString;
        }
        catch (Exception ex3)
        {
            Console.WriteLine($"ERROR: Manual rebuild also failed: {ex3.Message}");
            throw new InvalidOperationException($"Database connection string format is invalid and cannot be fixed. Original error: {ex.Message}. After fixes: {ex2.Message}. After rebuild: {ex3.Message}");
        }
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