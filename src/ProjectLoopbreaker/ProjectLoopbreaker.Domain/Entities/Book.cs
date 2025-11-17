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
        
        /// <summary>
        /// Goodreads rating from 1-5 scale. This is separate from the PLB Rating enum.
        /// Conversion: 5 = SuperLike, 4 = Like, 3 = Neutral, 1-2 = Dislike
        /// </summary>
        [Range(1, 5)]
        public decimal? GoodreadsRating { get; set; }
    }
    
    public enum BookFormat
    {
        Digital,
        Physical
    }
}


