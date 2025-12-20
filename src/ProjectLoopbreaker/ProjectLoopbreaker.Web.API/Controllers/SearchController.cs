using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    /// <summary>
    /// Controller for handling search operations using Typesense.
    /// Provides a secure proxy between the frontend and Typesense server.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Require authentication for search
    public class SearchController : ControllerBase
    {
        private readonly ITypeSenseService _typeSenseService;
        private readonly ILogger<SearchController> _logger;

        public SearchController(ITypeSenseService typeSenseService, ILogger<SearchController> logger)
        {
            _typeSenseService = typeSenseService;
            _logger = logger;
        }

        /// <summary>
        /// Searches media items using Typesense full-text search.
        /// GET /api/search?q=searchterm&filter=media_type:=Book&page=1&per_page=20
        /// </summary>
        /// <param name="q">Search query text</param>
        /// <param name="filter">Optional filter string (e.g., "media_type:=Book" or "status:=Completed")</param>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="per_page">Results per page (default: 20, max: 100)</param>
        /// <returns>Search results from Typesense</returns>
        [HttpGet]
        public async Task<IActionResult> Search(
            [FromQuery] string q,
            [FromQuery] string? filter = null,
            [FromQuery] int page = 1,
            [FromQuery] int per_page = 20)
        {
            try
            {
                // Validate query parameter
                if (string.IsNullOrWhiteSpace(q))
                {
                    return BadRequest(new { error = "Search query 'q' parameter is required." });
                }

                // Limit per_page to prevent abuse
                if (per_page > 100)
                {
                    per_page = 100;
                }

                if (per_page < 1)
                {
                    per_page = 20;
                }

                if (page < 1)
                {
                    page = 1;
                }

                _logger.LogInformation("Search request: query='{Query}', filter='{Filter}', page={Page}, per_page={PerPage}", 
                    q, filter, page, per_page);

                var results = await _typeSenseService.SearchAsync(q, filter, per_page, page);

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing search for query '{Query}'", q);
                return StatusCode(500, new { error = "An error occurred while searching. Please try again." });
            }
        }

        /// <summary>
        /// Searches media items by media type.
        /// GET /api/search/by-type/Book?q=searchterm
        /// </summary>
        /// <param name="mediaType">The media type to filter by (Article, Book, Movie, TVShow, Video, Podcast, Website, Channel, Playlist)</param>
        /// <param name="q">Search query text</param>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="per_page">Results per page (default: 20)</param>
        [HttpGet("by-type/{mediaType}")]
        public async Task<IActionResult> SearchByType(
            string mediaType,
            [FromQuery] string q,
            [FromQuery] int page = 1,
            [FromQuery] int per_page = 20)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(q))
                {
                    return BadRequest(new { error = "Search query 'q' parameter is required." });
                }

                // Validate media type (basic validation - Typesense will handle invalid values gracefully)
                var validMediaTypes = new[] { "Article", "Book", "Movie", "TVShow", "Video", "Podcast", "Website", "Channel", "Playlist" };
                if (!validMediaTypes.Contains(mediaType, StringComparer.OrdinalIgnoreCase))
                {
                    return BadRequest(new { error = $"Invalid media type. Valid types: {string.Join(", ", validMediaTypes)}" });
                }

                // Create filter for media type
                var filter = $"media_type:={mediaType}";

                var results = await _typeSenseService.SearchAsync(q, filter, per_page, page);

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing search by type '{MediaType}' for query '{Query}'", mediaType, q);
                return StatusCode(500, new { error = "An error occurred while searching. Please try again." });
            }
        }

        /// <summary>
        /// Searches mixlists using Typesense full-text search.
        /// GET /api/search/mixlists?q=searchterm&filter=topics:=productivity&page=1&per_page=20
        /// </summary>
        /// <param name="q">Search query text</param>
        /// <param name="filter">Optional filter string (e.g., "topics:=productivity" or "genres:=fiction")</param>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="per_page">Results per page (default: 20, max: 100)</param>
        /// <returns>Search results from Typesense</returns>
        [HttpGet("mixlists")]
        public async Task<IActionResult> SearchMixlists(
            [FromQuery] string q,
            [FromQuery] string? filter = null,
            [FromQuery] int page = 1,
            [FromQuery] int per_page = 20)
        {
            try
            {
                // Validate query parameter
                if (string.IsNullOrWhiteSpace(q))
                {
                    return BadRequest(new { error = "Search query 'q' parameter is required." });
                }

                // Limit per_page to prevent abuse
                if (per_page > 100)
                {
                    per_page = 100;
                }

                if (per_page < 1)
                {
                    per_page = 20;
                }

                if (page < 1)
                {
                    page = 1;
                }

                _logger.LogInformation("Mixlist search request: query='{Query}', filter='{Filter}', page={Page}, per_page={PerPage}", 
                    q, filter, page, per_page);

                var results = await _typeSenseService.SearchMixlistsAsync(q, filter, per_page, page);

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error performing mixlist search for query '{Query}'", q);
                return StatusCode(500, new { error = "An error occurred while searching mixlists. Please try again." });
            }
        }

        /// <summary>
        /// Triggers a full re-index of all media items from PostgreSQL to Typesense.
        /// POST /api/search/reindex
        /// This is an admin operation and should be used sparingly.
        /// </summary>
        [HttpPost("reindex")]
        public async Task<IActionResult> ReindexAll()
        {
            try
            {
                _logger.LogInformation("Starting full re-index of all media items...");

                var count = await _typeSenseService.BulkReindexAllMediaItemsAsync();

                _logger.LogInformation("Re-index complete. Indexed {Count} media items.", count);

                return Ok(new 
                { 
                    message = "Re-index completed successfully.", 
                    indexed_count = count 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during re-index operation.");
                return StatusCode(500, new { error = "An error occurred during re-index. Please check logs." });
            }
        }

        /// <summary>
        /// Triggers a full re-index of all mixlists from PostgreSQL to Typesense.
        /// POST /api/search/reindex-mixlists
        /// This is an admin operation and should be used sparingly.
        /// </summary>
        [HttpPost("reindex-mixlists")]
        public async Task<IActionResult> ReindexAllMixlists()
        {
            try
            {
                _logger.LogInformation("Starting full re-index of all mixlists...");

                var count = await _typeSenseService.BulkReindexAllMixlistsAsync();

                _logger.LogInformation("Re-index of mixlists complete. Indexed {Count} mixlists.", count);

                return Ok(new 
                { 
                    message = "Mixlist re-index completed successfully.", 
                    indexed_count = count 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during mixlist re-index operation.");
                return StatusCode(500, new { error = "An error occurred during mixlist re-index. Please check logs." });
            }
        }

        /// <summary>
        /// Health check endpoint for Typesense integration.
        /// GET /api/search/health
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous] // Allow anonymous access for health checks
        public IActionResult Health()
        {
            try
            {
                // Simple check - if the service is injected, it's configured
                if (_typeSenseService == null)
                {
                    return StatusCode(503, new { status = "unavailable", message = "Typesense service not configured." });
                }

                return Ok(new { status = "healthy", message = "Typesense integration is operational." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking Typesense health.");
                return StatusCode(503, new { status = "unhealthy", message = ex.Message });
            }
        }

        /// <summary>
        /// Completely resets the media_items collection by deleting and recreating it.
        /// POST /api/search/reset
        /// WARNING: This will delete all indexed media items from Typesense!
        /// </summary>
        [HttpPost("reset")]
        public async Task<IActionResult> ResetMediaItemsCollection()
        {
            try
            {
                _logger.LogInformation("Resetting media_items collection...");

                await _typeSenseService.ResetMediaItemsCollectionAsync();

                _logger.LogInformation("Media_items collection reset complete.");

                return Ok(new 
                { 
                    message = "Media items collection reset successfully. All old data has been cleared.",
                    collection = "media_items"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting media_items collection.");
                return StatusCode(500, new { error = "An error occurred while resetting the collection. Please check logs." });
            }
        }

        /// <summary>
        /// Completely resets the mixlists collection by deleting and recreating it.
        /// POST /api/search/reset-mixlists
        /// WARNING: This will delete all indexed mixlists from Typesense!
        /// </summary>
        [HttpPost("reset-mixlists")]
        public async Task<IActionResult> ResetMixlistsCollection()
        {
            try
            {
                _logger.LogInformation("Resetting mixlists collection...");

                await _typeSenseService.ResetMixlistsCollectionAsync();

                _logger.LogInformation("Mixlists collection reset complete.");

                return Ok(new 
                { 
                    message = "Mixlists collection reset successfully. All old data has been cleared.",
                    collection = "mixlists"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting mixlists collection.");
                return StatusCode(500, new { error = "An error occurred while resetting the collection. Please check logs." });
            }
        }
    }
}
