using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    /// <summary>
    /// Controller for Readwise and Reader sync operations.
    /// Provides a unified sync endpoint that syncs both Reader documents and Readwise highlights.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class ReadwiseController : ControllerBase
    {
        private readonly IReaderService _readerService;
        private readonly IHighlightService _highlightService;
        private readonly IReadwiseService _readwiseService;
        private readonly ILogger<ReadwiseController> _logger;

        public ReadwiseController(
            IReaderService readerService,
            IHighlightService highlightService,
            IReadwiseService readwiseService,
            ILogger<ReadwiseController> logger)
        {
            _readerService = readerService;
            _highlightService = highlightService;
            _readwiseService = readwiseService;
            _logger = logger;
        }

        /// <summary>
        /// Validates Readwise API connection
        /// </summary>
        [HttpGet("validate")]
        public async Task<ActionResult<object>> ValidateConnection()
        {
            try
            {
                var isValid = await _readwiseService.ValidateConnectionAsync();
                return Ok(new
                {
                    connected = isValid,
                    message = isValid
                        ? "Readwise API connection is valid"
                        : "Readwise API connection failed"
                });
            }
            catch (InvalidOperationException ex)
            {
                return Ok(new
                {
                    connected = false,
                    message = "Readwise API not configured",
                    details = ex.Message
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Ok(new
                {
                    connected = false,
                    message = "Invalid API token",
                    details = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Readwise connection");
                return Ok(new
                {
                    connected = false,
                    message = "Connection validation failed",
                    details = ex.Message
                });
            }
        }

        /// <summary>
        /// Unified sync operation: syncs Reader documents and Readwise highlights.
        /// Auto-links highlights to articles during import.
        /// </summary>
        /// <param name="incremental">If true (default), only syncs items from the last 7 days</param>
        [HttpPost("sync")]
        public async Task<ActionResult<ReadwiseSyncAllResultDto>> SyncAll([FromQuery] bool incremental = true)
        {
            var result = new ReadwiseSyncAllResultDto
            {
                StartedAt = DateTime.UtcNow
            };

            try
            {
                _logger.LogInformation("Starting unified Readwise sync (incremental: {Incremental})", incremental);

                // Calculate the date for incremental sync (7 days ago)
                DateTime? lastSync = incremental ? DateTime.UtcNow.AddDays(-7) : null;

                // Step 1: Sync Reader documents (pass lastSync for incremental filtering)
                _logger.LogInformation("Step 1: Syncing Reader documents...");
                var readerResult = await _readerService.SyncDocumentsAsync(updatedAfter: lastSync);

                if (!readerResult.Success)
                {
                    result.Success = false;
                    result.ErrorMessage = $"Reader sync failed: {readerResult.ErrorMessage}";
                    result.CompletedAt = DateTime.UtcNow;
                    return Ok(result);
                }

                result.ArticlesCreated = readerResult.CreatedCount;
                result.ArticlesUpdated = readerResult.UpdatedCount;

                // Step 2: Sync Readwise highlights
                _logger.LogInformation("Step 2: Syncing Readwise highlights...");
                HighlightSyncResultDto highlightResult;

                if (lastSync.HasValue)
                {
                    highlightResult = await _highlightService.SyncHighlightsIncrementalAsync(lastSync.Value);
                }
                else
                {
                    highlightResult = await _highlightService.SyncHighlightsFromReadwiseAsync();
                }

                if (!highlightResult.Success)
                {
                    result.Success = false;
                    result.ErrorMessage = $"Highlight sync failed: {highlightResult.ErrorMessage}";
                    result.CompletedAt = DateTime.UtcNow;
                    return Ok(result);
                }

                result.HighlightsCreated = highlightResult.CreatedCount;
                result.HighlightsUpdated = highlightResult.UpdatedCount;
                result.HighlightsLinked = highlightResult.LinkedCount;

                result.Success = true;
                result.CompletedAt = DateTime.UtcNow;

                _logger.LogInformation(
                    "Unified sync completed. Articles: {ArticlesCreated} created, {ArticlesUpdated} updated. " +
                    "Highlights: {HighlightsCreated} created, {HighlightsUpdated} updated, {HighlightsLinked} linked.",
                    result.ArticlesCreated, result.ArticlesUpdated,
                    result.HighlightsCreated, result.HighlightsUpdated, result.HighlightsLinked);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in unified Readwise sync");
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.CompletedAt = DateTime.UtcNow;
                return StatusCode(500, result);
            }
        }

        /// <summary>
        /// Fetch full HTML content for archived articles.
        /// Only fetches content for articles with Status = Completed.
        /// </summary>
        /// <param name="batchSize">Number of articles to fetch (default 50)</param>
        /// <param name="recentOnly">If true, only fetch articles synced in the last 7 days</param>
        [HttpPost("fetch-content")]
        public async Task<ActionResult<object>> FetchArticleContent(
            [FromQuery] int batchSize = 50,
            [FromQuery] bool recentOnly = false)
        {
            try
            {
                _logger.LogInformation("Starting article content fetch (batchSize: {BatchSize}, recentOnly: {RecentOnly})",
                    batchSize, recentOnly);

                DateTime? updatedAfter = recentOnly ? DateTime.UtcNow.AddDays(-7) : null;
                var fetchedCount = await _readerService.BulkFetchArticleContentsAsync(batchSize, updatedAfter);

                return Ok(new
                {
                    fetchedCount,
                    message = fetchedCount > 0
                        ? $"Successfully fetched content for {fetchedCount} archived article(s)"
                        : "No archived articles without content found to fetch"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching article content");
                return StatusCode(500, new { error = "Failed to fetch article content", details = ex.Message });
            }
        }
    }
}
