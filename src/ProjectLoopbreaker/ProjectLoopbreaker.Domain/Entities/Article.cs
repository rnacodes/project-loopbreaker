using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Domain.Entities
{
    public class Article : BaseMediaItem
    {
        /// <summary>
        /// External identifier from Instapaper (bookmark_id)
        /// </summary>
        [StringLength(50)]
        public string? InstapaperBookmarkId { get; set; }
        
        /// <summary>
        /// The original URL of the article
        /// </summary>
        [Url]
        [StringLength(2000)]
        public string? OriginalUrl { get; set; }
        
        /// <summary>
        /// Author of the article
        /// </summary>
        [StringLength(300)]
        public string? Author { get; set; }
        
        /// <summary>
        /// Publication or website name
        /// </summary>
        [StringLength(200)]
        public string? Publication { get; set; }
        
        /// <summary>
        /// Date the article was originally published
        /// </summary>
        public DateTime? PublicationDate { get; set; }
        
        /// <summary>
        /// Date the article was saved to Instapaper
        /// </summary>
        public DateTime? SavedToInstapaperDate { get; set; }
        
        /// <summary>
        /// Reading progress (0.0 to 1.0)
        /// </summary>
        [Range(0.0, 1.0)]
        public double ReadingProgress { get; set; } = 0.0;
        
        /// <summary>
        /// Timestamp when reading progress was last updated
        /// </summary>
        public DateTime? ProgressTimestamp { get; set; }
        
        /// <summary>
        /// Estimated reading time in minutes
        /// </summary>
        [Range(0, int.MaxValue)]
        public int EstimatedReadingTimeMinutes { get; set; } = 0;
        
        /// <summary>
        /// Word count of the article
        /// </summary>
        [Range(0, int.MaxValue)]
        public int WordCount { get; set; } = 0;
        
        /// <summary>
        /// Whether the article is marked as starred in Instapaper
        /// </summary>
        public bool IsStarred { get; set; } = false;
        
        /// <summary>
        /// Whether the article is archived in Instapaper
        /// </summary>
        public bool IsArchived { get; set; } = false;
        
        /// <summary>
        /// Full text content of the article (if available)
        /// </summary>
        public string? FullTextContent { get; set; }
        
        /// <summary>
        /// Gets the effective URL - returns Link if available, otherwise OriginalUrl
        /// </summary>
        public string? GetEffectiveUrl()
        {
            return !string.IsNullOrEmpty(Link) ? Link : OriginalUrl;
        }
        
        /// <summary>
        /// Gets whether this article has been started (reading progress > 0)
        /// </summary>
        public bool HasBeenStarted => ReadingProgress > 0.0;
        
        /// <summary>
        /// Gets whether this article has been completed (reading progress = 1.0)
        /// </summary>
        public bool IsReadingCompleted => Math.Abs(ReadingProgress - 1.0) < 0.001; // Using small epsilon for floating point comparison
    }
}
