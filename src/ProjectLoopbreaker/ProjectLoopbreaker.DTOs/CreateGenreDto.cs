using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    public class CreateGenreDto
    {
        [Required]
        [JsonPropertyName("name")]
        public required string Name { get; set; }
    }
}

