using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    /// <summary>
    /// Represents the response from the Instapaper bookmarks list API.
    /// </summary>
    public class InstapaperBookmarkListResponseDto
    {
        [JsonPropertyName("bookmarks")]
        public List<InstapaperBookmarkDto> Bookmarks { get; set; } = new List<InstapaperBookmarkDto>();

        [JsonPropertyName("user")]
        public InstapaperUserDto? User { get; set; }

        [JsonPropertyName("delete_ids")]
        public List<string> DeleteIds { get; set; } = new List<string>();
    }
}

