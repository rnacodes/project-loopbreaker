using ProjectLoopbreaker.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    public class CreateVideoDto
    {
        // Base media item properties
        [Required]
        [StringLength(500)]
        [JsonPropertyName("title")]
        public required string Title { get; set; }

        [JsonPropertyName("mediaType")]
        public MediaType MediaType { get; set; } = MediaType.Video;

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
        
        [JsonPropertyName("relatedNotes")]
        public string? RelatedNotes { get; set; }
        
        [Url]
        [StringLength(2000)]
        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }
        
        // JSON arrays for better query performance
        [JsonPropertyName("topics")]
        public string[] Topics { get; set; } = Array.Empty<string>();
        
        [JsonPropertyName("genres")]
        public string[] Genres { get; set; } = Array.Empty<string>();

        // Video specific properties
        [Required]
        [JsonPropertyName("videoType")]
        public VideoType VideoType { get; set; } = VideoType.Series;

        // For episodes: Foreign Key to parent series
        [JsonPropertyName("parentVideoId")]
        public Guid? ParentVideoId { get; set; }

        [Required]
        [StringLength(100)]
        [JsonPropertyName("platform")]
        public required string Platform { get; set; }

        [StringLength(200)]
        [JsonPropertyName("channelName")]
        public string? ChannelName { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "Length must be a positive number")]
        [JsonPropertyName("lengthInSeconds")]
        public int LengthInSeconds { get; set; } = 0;

        [StringLength(200)]
        [JsonPropertyName("externalId")]
        public string? ExternalId { get; set; }
    }
}
