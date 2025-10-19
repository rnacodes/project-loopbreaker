using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    public class InstapaperBookmarkDto
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;
        
        [JsonPropertyName("bookmark_id")]
        public int BookmarkId { get; set; }
        
        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;
        
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
        
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        
        [JsonPropertyName("time")]
        public long Time { get; set; } // Unix timestamp
        
        [JsonPropertyName("progress")]
        public double? Progress { get; set; }
        
        [JsonPropertyName("progress_timestamp")]
        public long? ProgressTimestamp { get; set; } // Unix timestamp
        
        [JsonPropertyName("starred")]
        public string? Starred { get; set; } // "1" if starred, otherwise null or empty
        
        [JsonPropertyName("private_source")]
        public string? PrivateSource { get; set; }
        
        [JsonPropertyName("hash")]
        public string? Hash { get; set; }
        
        /// <summary>
        /// Converts Unix timestamp to DateTime
        /// </summary>
        public DateTime GetDateAdded()
        {
            return DateTimeOffset.FromUnixTimeSeconds(Time).DateTime;
        }
        
        /// <summary>
        /// Converts progress timestamp to DateTime if available
        /// </summary>
        public DateTime? GetProgressDateTime()
        {
            return ProgressTimestamp.HasValue 
                ? DateTimeOffset.FromUnixTimeSeconds(ProgressTimestamp.Value).DateTime 
                : null;
        }
        
        /// <summary>
        /// Gets whether the bookmark is starred
        /// </summary>
        public bool IsStarred => Starred == "1";
        
        /// <summary>
        /// Gets reading progress as a double between 0.0 and 1.0
        /// </summary>
        public double GetNormalizedProgress()
        {
            return Progress ?? 0.0;
        }
    }
}
