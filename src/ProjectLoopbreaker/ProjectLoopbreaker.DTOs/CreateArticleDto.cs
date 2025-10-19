using ProjectLoopbreaker.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    public class CreateArticleDto
    {
        [Required]
        [StringLength(500)]
        [JsonPropertyName("title")]
        public required string Title { get; set; }
        
        [Url]
        [StringLength(2000)]
        [JsonPropertyName("originalUrl")]
        public string? OriginalUrl { get; set; }
        
        [Url]
        [StringLength(2000)]
        [JsonPropertyName("link")]
        public string? Link { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
        
        [Required]
        [JsonPropertyName("status")]
        public Status Status { get; set; } = Status.Uncharted;
        
        [JsonPropertyName("dateCompleted")]
        public DateTime? DateCompleted { get; set; }
        
        [JsonPropertyName("rating")]
        public Rating? Rating { get; set; }
        
        [JsonPropertyName("ownershipStatus")]
        public OwnershipStatus? OwnershipStatus { get; set; }
        
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        
        [StringLength(300)]
        [JsonPropertyName("author")]
        public string? Author { get; set; }
        
        [StringLength(200)]
        [JsonPropertyName("publication")]
        public string? Publication { get; set; }
        
        [JsonPropertyName("publicationDate")]
        public DateTime? PublicationDate { get; set; }
        
        [Range(0.0, 1.0)]
        [JsonPropertyName("readingProgress")]
        public double ReadingProgress { get; set; } = 0.0;
        
        [Range(0, int.MaxValue)]
        [JsonPropertyName("estimatedReadingTimeMinutes")]
        public int EstimatedReadingTimeMinutes { get; set; } = 0;
        
        [Range(0, int.MaxValue)]
        [JsonPropertyName("wordCount")]
        public int WordCount { get; set; } = 0;
        
        [JsonPropertyName("isStarred")]
        public bool IsStarred { get; set; } = false;
        
        [JsonPropertyName("isArchived")]
        public bool IsArchived { get; set; } = false;
        
        [JsonPropertyName("fullTextContent")]
        public string? FullTextContent { get; set; }
        
        // JSON arrays for better query performance
        [JsonPropertyName("topics")]
        public string[] Topics { get; set; } = Array.Empty<string>();
        
        [JsonPropertyName("genres")]
        public string[] Genres { get; set; } = Array.Empty<string>();
        
        [JsonPropertyName("relatedNotes")]
        public string? RelatedNotes { get; set; }
        
        [Url]
        [StringLength(2000)]
        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }
        
        // Instapaper-specific fields
        [StringLength(50)]
        [JsonPropertyName("instapaperBookmarkId")]
        public string? InstapaperBookmarkId { get; set; }
        
        [JsonPropertyName("savedToInstapaperDate")]
        public DateTime? SavedToInstapaperDate { get; set; }
    }
}
