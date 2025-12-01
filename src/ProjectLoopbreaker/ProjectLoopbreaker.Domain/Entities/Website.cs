using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Domain.Entities
{
    /// <summary>
    /// Represents a website that has been saved to the media library.
    /// Websites can be scraped for metadata and may include RSS feed tracking.
    /// </summary>
    public class Website : BaseMediaItem
    {
        /// <summary>
        /// URL of the RSS feed associated with this website, if discovered during scraping.
        /// </summary>
        [Url]
        [StringLength(2000)]
        public string? RssFeedUrl { get; set; }
        
        /// <summary>
        /// The last time the website was checked or scraped for updates.
        /// Useful for tracking freshness of metadata.
        /// </summary>
        public DateTime? LastCheckedDate { get; set; }
        
        /// <summary>
        /// The domain name extracted from the URL (e.g., "theverge.com").
        /// Useful for grouping and filtering websites by source.
        /// </summary>
        [StringLength(200)]
        public string? Domain { get; set; }
        
        /// <summary>
        /// The author or creator of the website content, if available from metadata.
        /// </summary>
        [StringLength(200)]
        public string? Author { get; set; }
        
        /// <summary>
        /// The publication or website name (e.g., "The Verge", "TechCrunch").
        /// Extracted from metadata during scraping.
        /// </summary>
        [StringLength(200)]
        public string? Publication { get; set; }
    }
}


