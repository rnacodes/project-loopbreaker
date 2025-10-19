using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.Instapaper
{
    public class InstapaperBookmarksResponse
    {
        [JsonPropertyName("user")]
        public InstapaperUserDto? User { get; set; }
        
        [JsonPropertyName("bookmarks")]
        public List<InstapaperBookmarkDto> Bookmarks { get; set; } = new List<InstapaperBookmarkDto>();
        
        [JsonPropertyName("highlights")]
        public List<InstapaperHighlightDto> Highlights { get; set; } = new List<InstapaperHighlightDto>();
        
        [JsonPropertyName("delete_ids")]
        public List<int> DeleteIds { get; set; } = new List<int>();
    }
}
