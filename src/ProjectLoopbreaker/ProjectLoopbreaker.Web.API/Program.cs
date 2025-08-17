using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Infrastructure.Clients;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Services;
using Amazon.S3;

var builder = WebApplication.CreateBuilder(args);

// --- Add CORS Policy ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            // Development: Allow localhost on common frontend ports
            policy.WithOrigins(
                      "http://localhost:3000",    // React default
                      "https://localhost:3000",   // React HTTPS
                      "http://localhost:5173",    // Vite default
                      "https://localhost:5173",   // Vite HTTPS
                      "http://localhost:5174",    // Vite alternate port
                      "https://localhost:5174",   // Vite alternate port HTTPS
                      "http://localhost:4200",    // Angular default
                      "https://localhost:4200"    // Angular HTTPS
                  )
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

// Configure JSON serialization to return enums as strings and handle circular references
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
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
    if (builder.Environment.IsDevelopment())
    {
        Console.WriteLine("WARNING: No database connection string configured for development.");
        Console.WriteLine("Using placeholder connection string. Database operations will fail.");
        connectionString = "Host=localhost;Database=projectloopbreaker;Username=postgres;Password=password";
    }
    else
    {
        throw new InvalidOperationException("Database connection string is required but not configured. Please set DATABASE_URL environment variable or configure DefaultConnection in appsettings.json");
    }
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
builder.Services.AddScoped<IApplicationDbContext>(provider => 
    provider.GetRequiredService<MediaLibraryDbContext>());

// Register Application Services
builder.Services.AddScoped<IPodcastMappingService, PodcastMappingService>();
builder.Services.AddScoped<IPodcastService, PodcastService>();

// In Program.cs

// Register both real and mock Listen Notes API clients
// Configure ListenNotes API client
builder.Services.AddHttpClient<ListenNotesApiClient>(client =>
{
    var apiKey = Environment.GetEnvironmentVariable("LISTENNOTES_API_KEY") ?? 
                 builder.Configuration["ApiKeys:ListenNotes"];
    
    Console.WriteLine($"API Key value: {apiKey}");

    if (string.IsNullOrEmpty(apiKey) || apiKey == "LISTENNOTES_API_KEY")
    {
        Console.WriteLine("WARNING: No valid ListenNotes API key found. ListenNotes functionality will be limited.");
        Console.WriteLine("Please set a valid API key in environment variable LISTENNOTES_API_KEY or configuration.");
        // Don't throw exception, just log warning
    }
    else
    {
        client.DefaultRequestHeaders.Add("X-ListenAPI-Key", apiKey);
    }
});

// Configure Open Library API client
builder.Services.AddHttpClient<OpenLibraryApiClient>(client =>
{
    client.BaseAddress = new Uri("https://openlibrary.org/");
    client.DefaultRequestHeaders.Add("User-Agent", "ProjectLoopbreaker/1.0 (https://github.com/yourrepo/projectloopbreaker)");
});

// Mock Listen Notes API client removed as per requirements to use only real API

// Configure DigitalOcean Spaces S3 Client (optional - won't break app if not configured)
builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    
    // Get DigitalOcean Spaces configuration
    var spacesConfig = configuration.GetSection("DigitalOceanSpaces");
    var accessKey = spacesConfig["AccessKey"];
    var secretKey = spacesConfig["SecretKey"];
    var endpoint = spacesConfig["Endpoint"];
    var region = spacesConfig["Region"];
    var bucketName = spacesConfig["BucketName"];

    // Enhanced debugging
    Console.WriteLine("=== DigitalOcean Spaces Configuration Debug ===");
    Console.WriteLine($"AccessKey: {(string.IsNullOrEmpty(accessKey) ? "MISSING" : "SET")}");
    Console.WriteLine($"SecretKey: {(string.IsNullOrEmpty(secretKey) ? "MISSING" : "SET")}");
    Console.WriteLine($"Endpoint: {(string.IsNullOrEmpty(endpoint) ? "MISSING" : endpoint)}");
    Console.WriteLine($"Region: {(string.IsNullOrEmpty(region) ? "MISSING" : region)}");
    Console.WriteLine($"BucketName: {(string.IsNullOrEmpty(bucketName) ? "MISSING" : bucketName)}");

    // Check if any values are still placeholders or empty
    var hasPlaceholders = accessKey == "SPACES_ACCESS_KEY" || secretKey == "SPACES_SECRET_KEY" || 
                         endpoint == "SPACES_ENDPOINT" || region == "SPACES_REGION" ||
                         bucketName == "SPACES_BUCKET_NAME";

    if (string.IsNullOrEmpty(accessKey) || string.IsNullOrEmpty(secretKey) || 
        string.IsNullOrEmpty(endpoint) || string.IsNullOrEmpty(region) || 
        string.IsNullOrEmpty(bucketName) || hasPlaceholders)
    {
        Console.WriteLine("WARNING: DigitalOcean Spaces configuration is incomplete or contains placeholder values.");
        Console.WriteLine("Thumbnail upload functionality will not be available until properly configured.");
        Console.WriteLine("Expected environment variables:");
        Console.WriteLine("  DIGITALOCEANSPACES__ACCESSKEY");
        Console.WriteLine("  DIGITALOCEANSPACES__SECRETKEY");
        Console.WriteLine("  DIGITALOCEANSPACES__ENDPOINT");
        Console.WriteLine("  DIGITALOCEANSPACES__REGION");
        Console.WriteLine("  DIGITALOCEANSPACES__BUCKETNAME");
        
        // Return a null client - the UploadController will handle this gracefully
        return null!;
    }

    var config = new Amazon.S3.AmazonS3Config
    {
        ServiceURL = $"https://{endpoint}",
        ForcePathStyle = false // DigitalOcean Spaces uses virtual-hosted-style requests
    };

    Console.WriteLine($"Configuring DigitalOcean Spaces client with endpoint: {endpoint}");
    
    return new Amazon.S3.AmazonS3Client(accessKey, secretKey, config);
});

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