using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    /// <summary>
    /// Service for managing database-backed feature flags.
    /// Reads directly from database on each call for instant effect (no caching).
    /// </summary>
    public class FeatureFlagService : IFeatureFlagService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<FeatureFlagService> _logger;

        public FeatureFlagService(IApplicationDbContext context, ILogger<FeatureFlagService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> IsEnabledAsync(string key)
        {
            _logger.LogDebug("Querying database for feature flag '{Key}'", key);

            var flag = await _context.FeatureFlags
                .FirstOrDefaultAsync(f => f.Key == key);

            var isEnabled = flag?.IsEnabled ?? false;
            _logger.LogDebug("Feature flag '{Key}' query result: Found={Found}, IsEnabled={IsEnabled}",
                key, flag != null, isEnabled);
            return isEnabled;
        }

        public async Task EnableAsync(string key, string? description = null)
        {
            var flag = await _context.FeatureFlags
                .FirstOrDefaultAsync(f => f.Key == key);

            if (flag == null)
            {
                flag = new FeatureFlag
                {
                    Key = key,
                    IsEnabled = true,
                    Description = description,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Add(flag);
                _logger.LogInformation("Created and enabled new feature flag: {Key}", key);
            }
            else
            {
                flag.IsEnabled = true;
                flag.UpdatedAt = DateTime.UtcNow;
                if (description != null)
                {
                    flag.Description = description;
                }
                _context.Update(flag);
                _logger.LogInformation("Enabled existing feature flag: {Key}", key);
            }

            await _context.SaveChangesAsync();
        }

        public async Task DisableAsync(string key, string? description = null)
        {
            var flag = await _context.FeatureFlags
                .FirstOrDefaultAsync(f => f.Key == key);

            if (flag == null)
            {
                flag = new FeatureFlag
                {
                    Key = key,
                    IsEnabled = false,
                    Description = description,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Add(flag);
                _logger.LogInformation("Created new feature flag (disabled): {Key}", key);
            }
            else
            {
                flag.IsEnabled = false;
                flag.UpdatedAt = DateTime.UtcNow;
                if (description != null)
                {
                    flag.Description = description;
                }
                _context.Update(flag);
                _logger.LogInformation("Disabled existing feature flag: {Key}", key);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<IEnumerable<FeatureFlagDto>> GetAllAsync()
        {
            var flags = await _context.FeatureFlags
                .OrderBy(f => f.Key)
                .ToListAsync();

            return flags.Select(f => new FeatureFlagDto
            {
                Id = f.Id,
                Key = f.Key,
                IsEnabled = f.IsEnabled,
                Description = f.Description,
                CreatedAt = f.CreatedAt,
                UpdatedAt = f.UpdatedAt
            });
        }

        public async Task<FeatureFlagDto?> GetAsync(string key)
        {
            var flag = await _context.FeatureFlags
                .FirstOrDefaultAsync(f => f.Key == key);

            if (flag == null)
            {
                return null;
            }

            return new FeatureFlagDto
            {
                Id = flag.Id,
                Key = flag.Key,
                IsEnabled = flag.IsEnabled,
                Description = flag.Description,
                CreatedAt = flag.CreatedAt,
                UpdatedAt = flag.UpdatedAt
            };
        }
    }
}
