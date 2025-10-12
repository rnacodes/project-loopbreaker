using ProjectLoopbreaker.Domain.Entities;
using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    public class VideoResponseDto
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        
        [JsonPropertyName("mediaType")]
        public MediaType MediaType { get; set; }
        
        [JsonPropertyName("status")]
        public Status Status { get; set; }
        
        [JsonPropertyName("dateAdded")]
        public DateTime DateAdded { get; set; }
        
        [JsonPropertyName("link")]
        public string? Link { get; set; }
        
        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }
        
        [JsonPropertyName("videoType")]
        public VideoType VideoType { get; set; }
        
        [JsonPropertyName("parentVideoId")]
        public Guid? ParentVideoId { get; set; }
        
        [JsonPropertyName("platform")]
        public string Platform { get; set; } = string.Empty;
        
        [JsonPropertyName("channelName")]
        public string? ChannelName { get; set; }
        
        [JsonPropertyName("lengthInSeconds")]
        public int LengthInSeconds { get; set; }
        
        [JsonPropertyName("externalId")]
        public string? ExternalId { get; set; }
        
        [JsonPropertyName("rating")]
        public Rating? Rating { get; set; }
        
        [JsonPropertyName("ownershipStatus")]
        public OwnershipStatus? OwnershipStatus { get; set; }
        
        [JsonPropertyName("dateCompleted")]
        public DateTime? DateCompleted { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
        
        [JsonPropertyName("relatedNotes")]
        public string? RelatedNotes { get; set; }
        
        [JsonPropertyName("topics")]
        public string[] Topics { get; set; } = Array.Empty<string>();
        
        [JsonPropertyName("genres")]
        public string[] Genres { get; set; } = Array.Empty<string>();
    }
}
