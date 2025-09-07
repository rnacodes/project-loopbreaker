using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    public class TopicResponseDto
    {
        [JsonPropertyName("id")]
        public Guid Id { get; set; }
        
        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;
        
        [JsonPropertyName("mediaItemIds")]
        public Guid[] MediaItemIds { get; set; } = Array.Empty<Guid>();
    }
}
