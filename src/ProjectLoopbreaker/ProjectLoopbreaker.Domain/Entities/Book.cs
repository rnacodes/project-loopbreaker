using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Domain.Entities
{
    public class Book : BaseMediaItem
    {
        [Required]
        [StringLength(300)]
        public required string Author { get; set; }
        
        [StringLength(17)]
        public string? ISBN { get; set; }
        
        [StringLength(20)]
        public string? ASIN { get; set; }
        
        [Required]
        public BookFormat Format { get; set; } = BookFormat.Digital;
        
        public bool PartOfSeries { get; set; } = false;
    }
    
    public enum BookFormat
    {
        Digital,
        Physical
    }
}


