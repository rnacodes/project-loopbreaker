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
            builder.ConfigureServices(services =>
            {
                // Remove the existing DbContext registration (if any)
                var descriptor = services.SingleOrDefault(
                    d => d.ServiceType == typeof(DbContextOptions<MediaLibraryDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                // Add in-memory database for testing
                services.AddDbContext<MediaLibraryDbContext>(options =>
                {
                    options.UseInMemoryDatabase("TestDatabase");
                    options.EnableSensitiveDataLogging();
                });

                // Register IApplicationDbContext (Testing environment needs this)
                services.AddScoped<ProjectLoopbreaker.Domain.Interfaces.IApplicationDbContext>(provider =>
                    provider.GetRequiredService<MediaLibraryDbContext>());

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

            builder.UseEnvironment("Testing");
        }
    }
}
