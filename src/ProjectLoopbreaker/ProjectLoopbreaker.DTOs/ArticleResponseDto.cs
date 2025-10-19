using ProjectLoopbreaker.Domain.Entities;
using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    public class ArticleResponseDto
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("mediaType")]
        public MediaType MediaType { get; set; }
        
        [JsonPropertyName("originalUrl")]
        public string? OriginalUrl { get; set; }
        
        [JsonPropertyName("link")]
        public string? Link { get; set; }
        
        [JsonPropertyName("effectiveUrl")]
        public string? EffectiveUrl { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
        
        [JsonPropertyName("dateAdded")]
        public DateTime DateAdded { get; set; }
        
        [JsonPropertyName("status")]
        public Status Status { get; set; }
        
        [JsonPropertyName("dateCompleted")]
        public DateTime? DateCompleted { get; set; }
        
        [JsonPropertyName("rating")]
        public Rating? Rating { get; set; }
        
        [JsonPropertyName("ownershipStatus")]
        public OwnershipStatus? OwnershipStatus { get; set; }
        
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        
        [JsonPropertyName("author")]
        public string? Author { get; set; }
        
        [JsonPropertyName("publication")]
        public string? Publication { get; set; }
        
        [JsonPropertyName("publicationDate")]
        public DateTime? PublicationDate { get; set; }
        
        [JsonPropertyName("savedToInstapaperDate")]
        public DateTime? SavedToInstapaperDate { get; set; }
        
        [JsonPropertyName("readingProgress")]
        public double ReadingProgress { get; set; }
        
        [JsonPropertyName("progressTimestamp")]
        public DateTime? ProgressTimestamp { get; set; }
        
        [JsonPropertyName("estimatedReadingTimeMinutes")]
        public int EstimatedReadingTimeMinutes { get; set; }
        
        [JsonPropertyName("wordCount")]
        public int WordCount { get; set; }
        
        [JsonPropertyName("isStarred")]
        public bool IsStarred { get; set; }
        
        [JsonPropertyName("isArchived")]
        public bool IsArchived { get; set; }
        
        [JsonPropertyName("hasBeenStarted")]
        public bool HasBeenStarted { get; set; }
        
        [JsonPropertyName("isReadingCompleted")]
        public bool IsReadingCompleted { get; set; }
        
        [JsonPropertyName("relatedNotes")]
        public string? RelatedNotes { get; set; }
        
        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }
        
        [JsonPropertyName("topics")]
        public string[] Topics { get; set; } = Array.Empty<string>();
        
        [JsonPropertyName("genres")]
        public string[] Genres { get; set; } = Array.Empty<string>();
        
        [JsonPropertyName("mixlistIds")]
        public Guid[] MixlistIds { get; set; } = Array.Empty<Guid>();
        
        [JsonPropertyName("instapaperBookmarkId")]
        public string? InstapaperBookmarkId { get; set; }
    }
}
