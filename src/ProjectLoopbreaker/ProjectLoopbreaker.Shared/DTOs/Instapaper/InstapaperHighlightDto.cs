using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    public class InstapaperHighlightDto
    {
        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;
        
        [JsonPropertyName("highlight_id")]
        public int HighlightId { get; set; }
        
        [JsonPropertyName("bookmark_id")]
        public int BookmarkId { get; set; }
        
        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
        
        [JsonPropertyName("note")]
        public string Note { get; set; } = string.Empty;
        
        [JsonPropertyName("position")]
        public int Position { get; set; }
        
        [JsonPropertyName("time")]
        public long Time { get; set; } // Unix timestamp
        
        /// <summary>
        /// Converts Unix timestamp to DateTime (UTC)
        /// </summary>
        public DateTime GetDateCreated()
        {
            return DateTimeOffset.FromUnixTimeSeconds(Time).UtcDateTime;
        }
    }
}
