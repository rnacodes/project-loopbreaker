using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.Web.API.DTOs
{
    public class CreateTopicDto
    {
        [Required]
        [JsonPropertyName("name")]
        public required string Name { get; set; }
    }
}
