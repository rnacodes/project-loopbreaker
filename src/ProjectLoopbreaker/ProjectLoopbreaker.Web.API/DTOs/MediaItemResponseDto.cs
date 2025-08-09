using ProjectLoopbreaker.Domain.Entities;

namespace ProjectLoopbreaker.Web.API.DTOs
{
    public class MediaItemResponseDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public MediaType MediaType { get; set; }
        public string? Link { get; set; }
        public string? Notes { get; set; }
        public DateTime DateAdded { get; set; }
        public Status Status { get; set; }
        public DateTime? DateCompleted { get; set; }
        public Rating? Rating { get; set; }
        public OwnershipStatus? OwnershipStatus { get; set; }
        public string? Description { get; set; }
        public string? Genre { get; set; }
        public string? RelatedNotes { get; set; }
        public string? Thumbnail { get; set; }
        
        // Simple string arrays instead of navigation properties to avoid circular references
        public string[] Topics { get; set; } = Array.Empty<string>();
        public string[] Genres { get; set; } = Array.Empty<string>();
        
        // Simple list of mixlist names/IDs instead of full mixlist objects
        public Guid[] MixlistIds { get; set; } = Array.Empty<Guid>();
    }
}
