using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.OpenLibrary
{
    public class OpenLibraryTimestamp
    {
        [JsonPropertyName("type")]
        public string? Type { get; set; }

        [JsonPropertyName("value")]
        public DateTime? Value { get; set; }
    }
}
