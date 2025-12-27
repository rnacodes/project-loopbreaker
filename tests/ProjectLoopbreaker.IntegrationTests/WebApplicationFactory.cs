using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Infrastructure.Data;

namespace ProjectLoopbreaker.IntegrationTests
{
    public class WebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        public async Task InitializeAsync()
        {
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MediaLibraryDbContext>();
            
            // CRITICAL SAFETY CHECK #1: Verify we're using in-memory database
            // This prevents accidental pollution of production database during tests
            var isInMemory = context.Database.IsInMemory();
            var providerName = context.Database.ProviderName;
            var databaseName = context.Database.GetDbConnection().Database;
            
            Console.WriteLine("=== INTEGRATION TEST SAFETY CHECK ===");
            Console.WriteLine($"Database Provider: {providerName}");
            Console.WriteLine($"Database Name: {databaseName}");
            Console.WriteLine($"Is InMemory: {isInMemory}");
            Console.WriteLine($"Connection String: {context.Database.GetConnectionString()?.Substring(0, Math.Min(50, context.Database.GetConnectionString()?.Length ?? 0))}...");
            
            // CRITICAL SAFETY CHECK #2: Ensure it's NOT PostgreSQL
            if (providerName?.Contains("Npgsql", StringComparison.OrdinalIgnoreCase) == true ||
                providerName?.Contains("Postgres", StringComparison.OrdinalIgnoreCase) == true)
            {
                throw new InvalidOperationException(
                    "🚨 CRITICAL SAFETY VIOLATION: Integration tests are using PostgreSQL database! 🚨\n" +
                    $"Provider: {providerName}\n" +
                    $"Database: {databaseName}\n" +
                    "This would POLLUTE THE PRODUCTION DATABASE!\n" +
                    "Tests have been ABORTED.\n" +
                    "DO NOT RUN TESTS UNTIL THIS IS FIXED!");
            }
            
            // CRITICAL SAFETY CHECK #3: Ensure it IS InMemory
            if (!isInMemory)
            {
                throw new InvalidOperationException(
                    "🚨 CRITICAL SAFETY VIOLATION: Integration tests are NOT using in-memory database! 🚨\n" +
                    $"Provider: {providerName}\n" +
                    $"Is InMemory: {isInMemory}\n" +
                    "This would pollute a real database. Tests have been ABORTED.\n" +
                    "Check that WebApplicationFactory is properly configured.");
            }
            
            // CRITICAL SAFETY CHECK #4: Ensure database name contains "Test"
            if (!databaseName.Contains("Test", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    $"🚨 SAFETY WARNING: Database name '{databaseName}' doesn't contain 'Test'! 🚨\n" +
                    "This might not be a test database. Tests have been ABORTED.");
            }
            
            Console.WriteLine("✅ ✅ ✅ ALL SAFETY CHECKS PASSED ✅ ✅ ✅");
            Console.WriteLine("Integration tests using IN-MEMORY database (isolated from production)");
            Console.WriteLine("==========================================");
            
            await context.Database.EnsureCreatedAsync();
        }

        public new async Task DisposeAsync()
        {
            using var scope = Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<MediaLibraryDbContext>();
            await context.Database.EnsureDeletedAsync();
            await base.DisposeAsync();
        }

        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // SET ENVIRONMENT FIRST - This is critical for Program.cs conditional registration
            builder.UseEnvironment("Testing");
            
            builder.ConfigureServices(services =>
            {
                // Remove ALL DbContext registrations (must remove all to prevent conflicts)
                var descriptorsToRemove = services.Where(
                    d => d.ServiceType == typeof(DbContextOptions<MediaLibraryDbContext>) ||
                         d.ServiceType == typeof(MediaLibraryDbContext) ||
                         d.ImplementationType == typeof(MediaLibraryDbContext))
                    .ToList();
                
                foreach (var descriptor in descriptorsToRemove)
                {
                    services.Remove(descriptor);
                    Console.WriteLine($"REMOVED DbContext service: {descriptor.ServiceType.Name} (Lifetime: {descriptor.Lifetime})");
                }

                // Add in-memory database for testing (FORCED - no PostgreSQL allowed)
                services.AddDbContext<MediaLibraryDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDatabase_" + Guid.NewGuid().ToString());
                    options.EnableSensitiveDataLogging();
                    Console.WriteLine("✅ CONFIGURED: In-Memory database for integration tests");
                }, ServiceLifetime.Scoped);

                // Register IApplicationDbContext (Testing environment needs this)
                services.AddScoped<ProjectLoopbreaker.Domain.Interfaces.IApplicationDbContext>(provider =>
                {
                    var context = provider.GetRequiredService<MediaLibraryDbContext>();
                    Console.WriteLine($"IApplicationDbContext resolved. Is InMemory: {context.Database.IsInMemory()}");
                    return context;
                });

                // Configure ListenNotes API to use MOCK server for testing
                // See: https://www.listennotes.com/api/docs/?test=1
                var listenNotesDescriptor = services.Where(d => 
                    d.ServiceType == typeof(ProjectLoopbreaker.Shared.Interfaces.IListenNotesApiClient) ||
                    d.ImplementationType?.Name == "ListenNotesApiClient")
                    .ToList();
                    
                foreach (var desc in listenNotesDescriptor)
                {
                    services.Remove(desc);
                }

                // Re-add ListenNotes API client with mock server URL
                services.AddHttpClient<ProjectLoopbreaker.Shared.Interfaces.IListenNotesApiClient, 
                    ProjectLoopbreaker.Infrastructure.Clients.ListenNotesApiClient>(client =>
                {
                    // Mock server returns fake data for testing - no API key required
                    client.BaseAddress = new Uri("https://listen-api-test.listennotes.com/api/v2/");
                    client.Timeout = TimeSpan.FromSeconds(30);
                });
            });
        }
    }
}
