using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.OpenLibrary
{
    public class OpenLibraryTypeReference
    {
        [JsonPropertyName("key")]
        public string? Key { get; set; }
    }
}
