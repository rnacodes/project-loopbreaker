using ProjectLoopbreaker.Domain.Entities;
using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Web.API.DTOs
{
    public class CreatePodcastEpisodeDto
    {
        // Base media item properties
        [Required]
        public string Title { get; set; }

        public MediaType MediaType { get; set; } = MediaType.Podcast; // Default value for this type

        public string? Link { get; set; }
        public string? Notes { get; set; }
        public bool Consumed { get; set; }
        public string? Rating { get; set; }
        public string? RelatedNotes { get; set; }
        public string? Thumbnail { get; set; }

        // PodcastEpisode specific properties
        [Required]
        public Guid PodcastSeriesId { get; set; } // Foreign Key to PodcastSeries

        public string? AudioLink { get; set; } // Link to the audio file
        public DateTime? ReleaseDate { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Duration must be a positive number")]
        public int DurationInSeconds { get; set; }
    }
}
