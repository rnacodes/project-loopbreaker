namespace ProjectLoopbreaker.Shared.Interfaces
{
    /// <summary>
    /// Service for enriching book descriptions from external APIs (Open Library).
    /// Designed for background processing with batch support and rate limiting.
    /// </summary>
    public interface IBookDescriptionEnrichmentService
    {
        /// <summary>
        /// Enriches books that are missing descriptions by fetching from Open Library API.
        /// Processes books in batches with delays between API calls to respect rate limits.
        /// </summary>
        /// <param name="batchSize">Number of books to process in this run (default: 50)</param>
        /// <param name="delayBetweenCallsMs">Delay between API calls in milliseconds (default: 1000)</param>
        /// <param name="cancellationToken">Cancellation token for stopping the operation</param>
        /// <returns>Result containing counts of processed, enriched, and failed books</returns>
        Task<BookDescriptionEnrichmentResult> EnrichBooksWithoutDescriptionsAsync(
            int batchSize = 50,
            int delayBetweenCallsMs = 1000,
            CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the count of books that need description enrichment (have ISBN but no description).
        /// </summary>
        Task<int> GetBooksNeedingEnrichmentCountAsync();
    }

    /// <summary>
    /// Result of a book description enrichment run.
    /// </summary>
    public class BookDescriptionEnrichmentResult
    {
        /// <summary>
        /// Total number of books processed in this run.
        /// </summary>
        public int TotalProcessed { get; set; }

        /// <summary>
        /// Number of books successfully enriched with descriptions.
        /// </summary>
        public int EnrichedCount { get; set; }

        /// <summary>
        /// Number of books where enrichment failed (API error, no description found, etc.).
        /// </summary>
        public int FailedCount { get; set; }

        /// <summary>
        /// Number of books skipped (no ISBN available).
        /// </summary>
        public int SkippedCount { get; set; }

        /// <summary>
        /// List of error messages for failed enrichments.
        /// </summary>
        public List<string> Errors { get; set; } = new List<string>();

        /// <summary>
        /// Whether the operation was cancelled before completion.
        /// </summary>
        public bool WasCancelled { get; set; }
    }
}
