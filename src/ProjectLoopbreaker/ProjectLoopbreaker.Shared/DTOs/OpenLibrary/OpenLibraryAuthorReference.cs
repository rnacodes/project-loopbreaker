using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.OpenLibrary
{
    public class OpenLibraryAuthorReference
    {
        [JsonPropertyName("author")]
        public OpenLibraryTypeReference? Author { get; set; }

        [JsonPropertyName("type")]
        public OpenLibraryTypeReference? Type { get; set; }
    }
}
