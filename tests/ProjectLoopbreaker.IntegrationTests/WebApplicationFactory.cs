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
                // Remove the existing DbContext registration
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
                });

                // Remove any external service registrations that might cause issues
                // This is where you would mock external APIs, file storage, etc.
            });

            builder.UseEnvironment("Testing");
        }
    }
}
