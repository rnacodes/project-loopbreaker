using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Web.API.DTOs
{
    public class UpdateMixlistDto
    {
        [JsonPropertyName("name")]
        public string? Name { get; set; }
        
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        
        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }
    }
}
