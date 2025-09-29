using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Shared.DTOs.ListenNotes
{
    public class ListenNotesGenresDto
    {
        [JsonPropertyName("genres")]
        public List<GenreDto> Genres { get; set; } = new List<GenreDto>();
    }
}
