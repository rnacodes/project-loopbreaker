using ProjectLoopbreaker.Domain.Entities;

namespace ProjectLoopbreaker.Web.API.DTOs
{
    public class MixlistResponseDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime DateCreated { get; set; }
        public string? Thumbnail { get; set; }
        
        // Simple array of media item IDs instead of full media objects to avoid circular references
        public Guid[] MediaItemIds { get; set; } = Array.Empty<Guid>();
        
        // Optionally include basic media info for display
        public MediaItemSummary[] MediaItems { get; set; } = Array.Empty<MediaItemSummary>();
    }
    
    public class MediaItemSummary
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public MediaType MediaType { get; set; }
        public string? Thumbnail { get; set; }
    }
}
