using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Domain.Entities
{
    /// <summary>
    /// Represents a feature flag stored in the database for runtime toggling of features.
    /// </summary>
    public class FeatureFlag
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        /// <summary>
        /// Unique key for the feature flag (e.g., "demo_write_enabled")
        /// </summary>
        [Required]
        [StringLength(100)]
        public required string Key { get; set; }

        /// <summary>
        /// Whether the feature is currently enabled
        /// </summary>
        public bool IsEnabled { get; set; } = false;

        /// <summary>
        /// Optional description of what this feature flag controls
        /// </summary>
        [StringLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// When the flag was created
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the flag was last modified
        /// </summary>
        public DateTime? UpdatedAt { get; set; }
    }
}
