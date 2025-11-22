using ProjectLoopbreaker.Domain.Entities;
using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    public class PodcastSeriesResponseDto
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
        
        [JsonPropertyName("dateCompleted")]
        public DateTime? DateCompleted { get; set; }
        
        [JsonPropertyName("rating")]
        public Rating? Rating { get; set; }
        
        [JsonPropertyName("link")]
        public string? Link { get; set; }
        
        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }
        
        [JsonPropertyName("publisher")]
        public string? Publisher { get; set; }
        
        [JsonPropertyName("externalId")]
        public string? ExternalId { get; set; }
        
        [JsonPropertyName("isSubscribed")]
        public bool IsSubscribed { get; set; }
        
        [JsonPropertyName("lastSyncDate")]
        public DateTime? LastSyncDate { get; set; }
        
        [JsonPropertyName("totalEpisodes")]
        public int TotalEpisodes { get; set; }
        
        [JsonPropertyName("episodeCount")]
        public int EpisodeCount { get; set; }
    }
}

