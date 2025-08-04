//This DTO is for processing info coming in via API

using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.ListenNotes
{
    public class PodcastSeriesDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("publisher")]
        public string Publisher { get; set; }

        [JsonPropertyName("image")]
        public string Image { get; set; }

        [JsonPropertyName("thumbnail")]
        public string Thumbnail { get; set; }

        [JsonPropertyName("description")]
        public string Description { get; set; }

        [JsonPropertyName("episodes")]
        public List<PodcastEpisodeDto> Episodes { get; set; }

        // Add this property to capture genres information
        [JsonPropertyName("genres")]
        public List<string>? Genres { get; set; }
    }

    public class PodcastEpisodeDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("audio")]
        public string? AudioUrl { get; set; }

        [JsonPropertyName("image")]
        public string? Image { get; set; }

        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }

        [JsonPropertyName("pub_date_ms")]
        public long PublishDateMs { get; set; }

        [JsonPropertyName("audio_length_sec")]
        public int DurationInSeconds { get; set; }

        [JsonPropertyName("link")]
        public string? Link { get; set; }

        // Add this property to capture topics information
        [JsonPropertyName("topics")]
        public List<string>? Topics { get; set; }
    }
}
