using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    public class InstapaperResponseItem
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;
        
        // User fields (when type = "user")
        [JsonPropertyName("user_id")]
        public int? UserId { get; set; }
        
        [JsonPropertyName("username")]
        public string? Username { get; set; }
        
        [JsonPropertyName("subscription_is_active")]
        public string? SubscriptionIsActive { get; set; }
        
        // Bookmark fields (when type = "bookmark")
        [JsonPropertyName("bookmark_id")]
        public long? BookmarkId { get; set; }
        
        [JsonPropertyName("url")]
        public string? Url { get; set; }
        
        [JsonPropertyName("title")]
        public string? Title { get; set; }
        
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        
        [JsonPropertyName("time")]
        public long? Time { get; set; }
        
        [JsonPropertyName("starred")]
        public string? Starred { get; set; }
        
        [JsonPropertyName("private_source")]
        public string? PrivateSource { get; set; }
        
        [JsonPropertyName("hash")]
        public string? Hash { get; set; }
        
        [JsonPropertyName("progress")]
        public double? Progress { get; set; }
        
        [JsonPropertyName("progress_timestamp")]
        public long? ProgressTimestamp { get; set; }
        
        // Highlight fields (when type = "highlight")
        [JsonPropertyName("highlight_id")]
        public long? HighlightId { get; set; }
        
        [JsonPropertyName("text")]
        public string? Text { get; set; }
        
        [JsonPropertyName("note")]
        public string? Note { get; set; }
        
        [JsonPropertyName("position")]
        public int? Position { get; set; }
    }
}

