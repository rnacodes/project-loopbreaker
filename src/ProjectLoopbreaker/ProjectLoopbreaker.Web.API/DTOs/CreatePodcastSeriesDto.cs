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

        public string? Link { get; set; }
        public string? Notes { get; set; }
        public bool Consumed { get; set; }
        public string? Rating { get; set; }
        public string? RelatedNotes { get; set; }
        public string? Thumbnail { get; set; }
        public string? Genre { get; set; }
        public string? Topics { get; set; }

        // Episodes collection as it will be populated later
        // through individual episode creation
    }

}
