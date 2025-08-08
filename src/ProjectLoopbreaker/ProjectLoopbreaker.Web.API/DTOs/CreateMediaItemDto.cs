using ProjectLoopbreaker.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Web.API.DTOs
{
    public class CreateMediaItemDto
    {
        [Required]
        [StringLength(500)]
        public required string Title { get; set; }
        
        [Required]
        public MediaType MediaType { get; set; }
        
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
        
        [StringLength(200)]
        public string? Genre { get; set; }
        
        // JSON arrays for better query performance
        public string[] Topics { get; set; } = Array.Empty<string>();
        
        public string[] Genres { get; set; } = Array.Empty<string>();
        
        public string? RelatedNotes { get; set; }
        
        [Url]
        [StringLength(2000)]
        public string? Thumbnail { get; set; }
    }
}
