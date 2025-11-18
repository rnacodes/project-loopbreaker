using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    /// <summary>
    /// Represents the full text content response from Instapaper.
    /// </summary>
    public class InstapaperBookmarkTextResponseDto
    {
        [JsonPropertyName("html")]
        public string Html { get; set; } = string.Empty;

        [JsonPropertyName("url")]
        public string Url { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;
    }
}

