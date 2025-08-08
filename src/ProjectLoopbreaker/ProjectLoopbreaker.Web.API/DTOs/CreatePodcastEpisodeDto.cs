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

        [Url]
        [StringLength(2000)]
        public string? Link { get; set; }
        
        public string? Notes { get; set; }
        
        [Required]
        public Status Status { get; set; } = Status.Uncharted;
        
        public DateTime? DateCompleted { get; set; }
        
        public Rating? Rating { get; set; }
        
        public OwnershipStatus? OwnershipStatus { get; set; }
        
        public string? Description { get; set; }
        
        public string? RelatedNotes { get; set; }
        
        [Url]
        [StringLength(2000)]
        public string? Thumbnail { get; set; }
        
        [StringLength(200)]
        public string? Genre { get; set; }
        
        // JSON arrays for better query performance
        public string[] Topics { get; set; } = Array.Empty<string>();
        
        public string[] Genres { get; set; } = Array.Empty<string>();

        // PodcastEpisode specific properties
        [Required]
        public Guid PodcastSeriesId { get; set; } // Foreign Key to PodcastSeries

        [Url]
        [StringLength(2000)]
        public string? AudioLink { get; set; } // Link to the audio file
        
        public DateTime? ReleaseDate { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Duration must be a positive number")]
        public int DurationInSeconds { get; set; }
    }
}
