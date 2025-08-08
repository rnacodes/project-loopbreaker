using ProjectLoopbreaker.Domain.Entities;
using System;
using System.ComponentModel.DataAnnotations;

//This DTO is for creating Podcast Series or Podcast Episodes
//from user-inputted data in frontend
namespace ProjectLoopbreaker.Web.API.DTOs
{
    public class CreatePodcastSeriesDto
    {
        // Base media item properties
        [Required]
        public string Title { get; set; }

        public MediaType MediaType { get; set; } = MediaType.Podcast;

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

        // Episodes collection as it will be populated later
        // through individual episode creation
    }

}
