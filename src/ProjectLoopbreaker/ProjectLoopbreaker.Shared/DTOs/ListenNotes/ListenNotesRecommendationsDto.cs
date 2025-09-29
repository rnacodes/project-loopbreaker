using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.ListenNotes
{
    public class ListenNotesRecommendationsDto
    {
        [JsonPropertyName("recommendations")]
        public List<PodcastSearchDto> Recommendations { get; set; } = new List<PodcastSearchDto>();
    }
}
