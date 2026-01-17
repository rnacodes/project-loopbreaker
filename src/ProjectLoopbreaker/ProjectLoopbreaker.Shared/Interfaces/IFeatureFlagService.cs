namespace ProjectLoopbreaker.Shared.Interfaces
{
    /// <summary>
    /// Service for managing database-backed feature flags.
    /// Provides runtime toggling of features without requiring application restarts.
    /// </summary>
    public interface IFeatureFlagService
    {
        /// <summary>
        /// Checks if a feature flag is enabled. Reads directly from database for instant effect.
        /// </summary>
        /// <param name="key">The feature flag key (e.g., "demo_write_enabled")</param>
        /// <returns>True if the flag exists and is enabled, false otherwise</returns>
        Task<bool> IsEnabledAsync(string key);

        /// <summary>
        /// Enables a feature flag. Creates it if it doesn't exist.
        /// </summary>
        /// <param name="key">The feature flag key</param>
        /// <param name="description">Optional description for new flags</param>
        Task EnableAsync(string key, string? description = null);

        /// <summary>
        /// Disables a feature flag. Creates it if it doesn't exist.
        /// </summary>
        /// <param name="key">The feature flag key</param>
        /// <param name="description">Optional description for new flags</param>
        Task DisableAsync(string key, string? description = null);

        /// <summary>
        /// Gets all feature flags with their current status.
        /// </summary>
        /// <returns>List of all feature flags</returns>
        Task<IEnumerable<FeatureFlagDto>> GetAllAsync();

        /// <summary>
        /// Gets a specific feature flag by key.
        /// </summary>
        /// <param name="key">The feature flag key</param>
        /// <returns>The feature flag if found, null otherwise</returns>
        Task<FeatureFlagDto?> GetAsync(string key);
    }

    /// <summary>
    /// DTO for feature flag data
    /// </summary>
    public class FeatureFlagDto
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
