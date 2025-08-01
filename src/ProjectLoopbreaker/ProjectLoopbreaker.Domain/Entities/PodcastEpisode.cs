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
    }
}
