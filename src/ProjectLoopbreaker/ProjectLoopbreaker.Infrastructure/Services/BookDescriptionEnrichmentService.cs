using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Infrastructure.Services
{
    /// <summary>
    /// Service for enriching book descriptions from Open Library API.
    /// Processes books in batches with rate limiting to respect API guidelines.
    /// </summary>
    public class BookDescriptionEnrichmentService : IBookDescriptionEnrichmentService
    {
        private readonly IApplicationDbContext _context;
        private readonly IOpenLibraryApiClient _openLibraryClient;
        private readonly ILogger<BookDescriptionEnrichmentService> _logger;

        public BookDescriptionEnrichmentService(
            IApplicationDbContext context,
            IOpenLibraryApiClient openLibraryClient,
            ILogger<BookDescriptionEnrichmentService> logger)
        {
            _context = context;
            _openLibraryClient = openLibraryClient;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<int> GetBooksNeedingEnrichmentCountAsync()
        {
            return await _context.Books
                .Where(b => b.ISBN != null && b.ISBN != "" && b.Description == null)
                .CountAsync();
        }

        /// <inheritdoc />
        public async Task<BookDescriptionEnrichmentResult> EnrichBooksWithoutDescriptionsAsync(
            int batchSize = 50,
            int delayBetweenCallsMs = 1000,
            CancellationToken cancellationToken = default)
        {
            var result = new BookDescriptionEnrichmentResult();

            try
            {
                // Get books that need enrichment: have ISBN but no description
                var booksToEnrich = await _context.Books
                    .Where(b => b.ISBN != null && b.ISBN != "" && b.Description == null)
                    .OrderBy(b => b.DateAdded) // Process oldest first
                    .Take(batchSize)
                    .ToListAsync(cancellationToken);

                result.TotalProcessed = booksToEnrich.Count;

                if (booksToEnrich.Count == 0)
                {
                    _logger.LogInformation("No books found needing description enrichment");
                    return result;
                }

                _logger.LogInformation("Starting book description enrichment for {Count} books", booksToEnrich.Count);

                foreach (var book in booksToEnrich)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        _logger.LogInformation("Book description enrichment cancelled");
                        result.WasCancelled = true;
                        break;
                    }

                    try
                    {
                        if (string.IsNullOrWhiteSpace(book.ISBN))
                        {
                            result.SkippedCount++;
                            continue;
                        }

                        // Clean ISBN for API call
                        var cleanIsbn = book.ISBN.Replace("-", "").Replace(" ", "").Trim();

                        _logger.LogDebug("Fetching description for book: {Title} (ISBN: {ISBN})", book.Title, cleanIsbn);

                        var description = await _openLibraryClient.GetBookDescriptionByISBNAsync(cleanIsbn);

                        if (!string.IsNullOrWhiteSpace(description))
                        {
                            book.Description = description;
                            _context.Update(book);
                            result.EnrichedCount++;
                            _logger.LogDebug("Successfully enriched description for: {Title}", book.Title);
                        }
                        else
                        {
                            // Mark as attempted by setting empty description to avoid re-processing
                            // Note: We don't set an empty string here - we leave it null
                            // so it can potentially be enriched later if Open Library gets updated
                            result.FailedCount++;
                            _logger.LogDebug("No description found for: {Title} (ISBN: {ISBN})", book.Title, cleanIsbn);
                        }
                    }
                    catch (Exception ex)
                    {
                        result.FailedCount++;
                        result.Errors.Add($"Failed to enrich '{book.Title}': {ex.Message}");
                        _logger.LogWarning(ex, "Failed to enrich description for book: {Title}", book.Title);
                    }

                    // Rate limiting: delay between API calls
                    if (delayBetweenCallsMs > 0)
                    {
                        await Task.Delay(delayBetweenCallsMs, cancellationToken);
                    }
                }

                // Save all changes
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Book description enrichment complete. Enriched: {Enriched}, Failed: {Failed}, Skipped: {Skipped}",
                    result.EnrichedCount, result.FailedCount, result.SkippedCount);
            }
            catch (OperationCanceledException)
            {
                result.WasCancelled = true;
                _logger.LogInformation("Book description enrichment was cancelled");
            }
            catch (Exception ex)
            {
                result.Errors.Add($"Enrichment run failed: {ex.Message}");
                _logger.LogError(ex, "Book description enrichment run failed");
            }

            return result;
        }
    }
}
