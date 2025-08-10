using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.ListenNotes
{
    public class SearchResultDto
    {
        [JsonPropertyName("count")]
        public int Count { get; set; }

        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("results")]
        public List<PodcastSearchDto> Results { get; set; } = new List<PodcastSearchDto>();

        [JsonPropertyName("next_offset")]
        public int? NextOffset { get; set; }
    }

    public class PodcastSearchDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("title_original")]
        public string? TitleOriginal { get; set; }

        [JsonPropertyName("title_highlighted")]
        public string? TitleHighlighted { get; set; }

        [JsonPropertyName("publisher_original")]
        public string? PublisherOriginal { get; set; }

        [JsonPropertyName("publisher_highlighted")]
        public string? PublisherHighlighted { get; set; }

        [JsonPropertyName("description_original")]
        public string? DescriptionOriginal { get; set; }

        [JsonPropertyName("description_highlighted")]
        public string? DescriptionHighlighted { get; set; }

        [JsonPropertyName("image")]
        public string? Image { get; set; }

        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }

        [JsonPropertyName("total_episodes")]
        public int? TotalEpisodes { get; set; }

        [JsonPropertyName("website")]
        public string? Website { get; set; }

        [JsonPropertyName("rss")]
        public string? Rss { get; set; }

        [JsonPropertyName("earliest_pub_date_ms")]
        public long? EarliestPubDateMs { get; set; }

        [JsonPropertyName("latest_pub_date_ms")]
        public long? LatestPubDateMs { get; set; }

        [JsonPropertyName("language")]
        public string? Language { get; set; }

        [JsonPropertyName("country")]
        public string? Country { get; set; }

        [JsonPropertyName("genres")]
        public List<GenreDto>? Genres { get; set; }

        [JsonPropertyName("itunes_id")]
        public int? ItunesId { get; set; }

        [JsonPropertyName("is_claimed")]
        public bool? IsClaimed { get; set; }

        [JsonPropertyName("update_frequency_hours")]
        public int? UpdateFrequencyHours { get; set; }

        [JsonPropertyName("listen_score")]
        public int? ListenScore { get; set; }

        [JsonPropertyName("listen_score_global_rank")]
        public string? ListenScoreGlobalRank { get; set; }
    }

    public class GenreDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("parent_id")]
        public int? ParentId { get; set; }
    }
}

