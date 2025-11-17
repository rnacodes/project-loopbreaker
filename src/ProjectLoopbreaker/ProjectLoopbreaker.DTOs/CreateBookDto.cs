using ProjectLoopbreaker.Domain.Entities;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace ProjectLoopbreaker.DTOs
{
    public class CreateBookDto
    {
        // Base media item properties
        [Required]
        [StringLength(500)]
        [JsonPropertyName("title")]
        public required string Title { get; set; }

        [JsonPropertyName("mediaType")]
        public MediaType MediaType { get; set; } = MediaType.Book;

        [Url]
        [StringLength(2000)]
        [JsonPropertyName("link")]
        public string? Link { get; set; }
        
        [JsonPropertyName("notes")]
        public string? Notes { get; set; }
        
        [Required]
        [JsonPropertyName("status")]
        public Status Status { get; set; } = Status.Uncharted;
        
        [JsonPropertyName("dateCompleted")]
        public DateTime? DateCompleted { get; set; }
        
        [JsonPropertyName("rating")]
        public Rating? Rating { get; set; }
        
        [JsonPropertyName("ownershipStatus")]
        public OwnershipStatus? OwnershipStatus { get; set; }
        
        [JsonPropertyName("description")]
        public string? Description { get; set; }
        
        [JsonPropertyName("relatedNotes")]
        public string? RelatedNotes { get; set; }
        
        [Url]
        [StringLength(2000)]
        [JsonPropertyName("thumbnail")]
        public string? Thumbnail { get; set; }
        
        [StringLength(200)]
        [JsonPropertyName("genre")]
        public string? Genre { get; set; }
        
        // JSON arrays for better query performance
        [JsonPropertyName("topics")]
        public string[] Topics { get; set; } = Array.Empty<string>();
        
        [JsonPropertyName("genres")]
        public string[] Genres { get; set; } = Array.Empty<string>();

        // Book-specific properties
        [Required]
        [StringLength(300)]
        [JsonPropertyName("author")]
        public required string Author { get; set; }
        
        [StringLength(17)]
        [JsonPropertyName("isbn")]
        public string? ISBN { get; set; }
        
        [StringLength(20)]
        [JsonPropertyName("asin")]
        public string? ASIN { get; set; }
        
        [Required]
        [JsonPropertyName("format")]
        public BookFormat Format { get; set; } = BookFormat.Digital;
        
        [JsonPropertyName("partOfSeries")]
        public bool PartOfSeries { get; set; } = false;
        
        [Range(1, 5)]
        [JsonPropertyName("goodreadsRating")]
        public decimal? GoodreadsRating { get; set; }
    }
}
