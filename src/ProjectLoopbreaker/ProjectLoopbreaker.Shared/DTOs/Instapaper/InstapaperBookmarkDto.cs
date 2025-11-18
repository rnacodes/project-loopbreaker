using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    /// <summary>
    /// Represents a single bookmark from the Instapaper API.
    /// </summary>
    public class InstapaperBookmarkDto
    {
        [JsonPropertyName("bookmark_id")]
        public string BookmarkId { get; set; } = string.Empty;

        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("time")]
        public long Time { get; set; }

        [JsonPropertyName("starred")]
        public string Starred { get; set; } = "0";

        [JsonPropertyName("type")]
        public string Type { get; set; } = string.Empty;

        [JsonPropertyName("hash")]
        public string Hash { get; set; } = string.Empty;

        [JsonPropertyName("progress")]
        public double Progress { get; set; }

        [JsonPropertyName("progress_timestamp")]
        public long ProgressTimestamp { get; set; }

        public bool IsStarred => Starred == "1";

        public DateTime DateAdded => DateTimeOffset.FromUnixTimeSeconds(Time).UtcDateTime;
    }
}
