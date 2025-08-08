using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Domain.Entities
{
    public class PodcastEpisode: BaseMediaItem
    {
        public Guid PodcastSeriesId { get; set; } // Foreign Key to PodcastSeries
        public PodcastSeries? PodcastSeries { get; set; } // Navigation property to PodcastSeries
        public string? AudioLink { get; set; } // Link to the audio file of the podcast episode
        public DateTime? ReleaseDate { get; set; } // Nullable to allow for episodes that don't have a release date
        public int DurationInSeconds { get; set; } // Duration of the episode in seconds

        /// <summary>
        /// Gets the thumbnail for this episode, inheriting from the series if not set
        /// </summary>
        public string? GetThumbnail()
        {
            // Return episode-specific thumbnail if set, otherwise inherit from series
            return !string.IsNullOrEmpty(Thumbnail) ? Thumbnail : PodcastSeries?.Thumbnail;
        }
    }
}
