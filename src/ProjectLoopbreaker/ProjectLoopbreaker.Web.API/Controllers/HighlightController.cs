using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HighlightController : ControllerBase
    {
        private readonly IHighlightService _highlightService;
        private readonly IReadwiseService _readwiseService;
        private readonly ILogger<HighlightController> _logger;

        public HighlightController(
            IHighlightService highlightService,
            IReadwiseService readwiseService,
            ILogger<HighlightController> logger)
        {
            _highlightService = highlightService;
            _readwiseService = readwiseService;
            _logger = logger;
        }

        // GET: api/highlight
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HighlightResponseDto>>> GetAllHighlights()
        {
            try
            {
                var highlights = await _highlightService.GetAllHighlightsAsync();
                var response = highlights.Select(MapToResponseDto);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving highlights");
                return StatusCode(500, new { error = "Failed to retrieve highlights", details = ex.Message });
            }
        }

        // GET: api/highlight/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<HighlightResponseDto>> GetHighlight(Guid id)
        {
            try
            {
                var highlight = await _highlightService.GetHighlightByIdAsync(id);
                if (highlight == null)
                {
                    return NotFound(new { error = $"Highlight with ID {id} not found" });
                }
                return Ok(MapToResponseDto(highlight));
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving highlight {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve highlight", details = ex.Message });
            }
        }

        // GET: api/highlight/article/{articleId}
        [HttpGet("article/{articleId}")]
        public async Task<ActionResult<IEnumerable<HighlightResponseDto>>> GetHighlightsByArticle(Guid articleId)
        {
            try
            {
                var highlights = await _highlightService.GetHighlightsByArticleIdAsync(articleId);
                var response = highlights.Select(MapToResponseDto);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving highlights for article {ArticleId}", articleId);
                return StatusCode(500, new { error = "Failed to retrieve highlights", details = ex.Message });
            }
        }

        // GET: api/highlight/book/{bookId}
        [HttpGet("book/{bookId}")]
        public async Task<ActionResult<IEnumerable<HighlightResponseDto>>> GetHighlightsByBook(Guid bookId)
        {
            try
            {
                var highlights = await _highlightService.GetHighlightsByBookIdAsync(bookId);
                var response = highlights.Select(MapToResponseDto);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving highlights for book {BookId}", bookId);
                return StatusCode(500, new { error = "Failed to retrieve highlights", details = ex.Message });
            }
        }

        // GET: api/highlight/unlinked
        [HttpGet("unlinked")]
        public async Task<ActionResult<IEnumerable<HighlightResponseDto>>> GetUnlinkedHighlights()
        {
            try
            {
                var highlights = await _highlightService.GetUnlinkedHighlightsAsync();
                var response = highlights.Select(MapToResponseDto);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving unlinked highlights");
                return StatusCode(500, new { error = "Failed to retrieve unlinked highlights", details = ex.Message });
            }
        }

        // GET: api/highlight/tag/{tag}
        [HttpGet("tag/{tag}")]
        public async Task<ActionResult<IEnumerable<HighlightResponseDto>>> GetHighlightsByTag(string tag)
        {
            try
            {
                var highlights = await _highlightService.GetHighlightsByTagAsync(tag);
                var response = highlights.Select(MapToResponseDto);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving highlights for tag {Tag}", tag);
                return StatusCode(500, new { error = "Failed to retrieve highlights", details = ex.Message });
            }
        }

        // POST: api/highlight
        [HttpPost]
        public async Task<ActionResult<HighlightResponseDto>> CreateHighlight([FromBody] CreateHighlightDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { error = "Highlight data is required" });
                }

                var highlight = await _highlightService.CreateHighlightAsync(dto);
                var response = MapToResponseDto(highlight);
                return CreatedAtAction(nameof(GetHighlight), new { id = highlight.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating highlight");
                return StatusCode(500, new { error = "Failed to create highlight", details = ex.Message });
            }
        }

        // POST: api/highlight/sync
        [HttpPost("sync")]
        public async Task<ActionResult<HighlightSyncResultDto>> SyncHighlights([FromQuery] DateTime? lastSync = null)
        {
            try
            {
                _logger.LogInformation("Starting highlight sync from Readwise (lastSync: {LastSync})", 
                    lastSync?.ToString() ?? "full");
                
                HighlightSyncResultDto result;
                if (lastSync.HasValue)
                {
                    result = await _highlightService.SyncHighlightsIncrementalAsync(lastSync.Value);
                }
                else
                {
                    result = await _highlightService.SyncHighlightsFromReadwiseAsync();
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing highlights");
                return StatusCode(500, new { error = "Failed to sync highlights", details = ex.Message });
            }
        }

        // POST: api/highlight/link
        [HttpPost("link")]
        public async Task<ActionResult<object>> LinkHighlightsToMedia()
        {
            try
            {
                _logger.LogInformation("Starting to link highlights to media items");
                var linkedCount = await _readwiseService.LinkHighlightsToMediaAsync();
                return Ok(new { linkedCount, message = $"Successfully linked {linkedCount} highlights" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error linking highlights");
                return StatusCode(500, new { error = "Failed to link highlights", details = ex.Message });
            }
        }

        // POST: api/highlight/{id}/export
        [HttpPost("{id}/export")]
        public async Task<ActionResult<object>> ExportHighlight(Guid id)
        {
            try
            {
                var success = await _readwiseService.ExportHighlightToReadwiseAsync(id);
                if (!success)
                {
                    return NotFound(new { error = "Highlight not found or export failed" });
                }
                return Ok(new { message = "Highlight exported to Readwise successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error exporting highlight {Id}", id);
                return StatusCode(500, new { error = "Failed to export highlight", details = ex.Message });
            }
        }

        // PUT: api/highlight/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<HighlightResponseDto>> UpdateHighlight(Guid id, [FromBody] CreateHighlightDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { error = "Highlight data is required" });
                }

                var highlight = await _highlightService.UpdateHighlightAsync(id, dto);
                return Ok(MapToResponseDto(highlight));
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Highlight {Id} not found for update", id);
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating highlight {Id}", id);
                return StatusCode(500, new { error = "Failed to update highlight", details = ex.Message });
            }
        }

        // DELETE: api/highlight/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHighlight(Guid id)
        {
            try
            {
                var deleted = await _highlightService.DeleteHighlightAsync(id);
                if (!deleted)
                {
                    return NotFound(new { error = $"Highlight with ID {id} not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting highlight {Id}", id);
                return StatusCode(500, new { error = "Failed to delete highlight", details = ex.Message });
            }
        }

        // GET: api/highlight/validate-connection
        [HttpGet("validate-connection")]
        public async Task<ActionResult<object>> ValidateConnection()
        {
            try
            {
                var isValid = await _readwiseService.ValidateConnectionAsync();
                return Ok(new { 
                    connected = isValid,
                    message = isValid 
                        ? "Readwise API connection is valid ✓" 
                        : "Readwise API connection failed"
                });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Readwise API not configured");
                return Ok(new { 
                    connected = false,
                    message = "Readwise API not configured",
                    details = ex.Message 
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogWarning(ex, "Readwise API token invalid");
                return Ok(new { 
                    connected = false,
                    message = "Invalid API token",
                    details = ex.Message 
                });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Network error validating Readwise connection");
                return Ok(new { 
                    connected = false,
                    message = "Network error",
                    details = ex.Message 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating Readwise connection");
                return Ok(new { 
                    connected = false,
                    message = "Connection validation failed",
                    details = ex.Message 
                });
            }
        }

        private static HighlightResponseDto MapToResponseDto(Domain.Entities.Highlight highlight)
        {
            return new HighlightResponseDto
            {
                id = highlight.Id,
                text = highlight.Text,
                note = highlight.Note,
                title = highlight.Title,
                author = highlight.Author,
                category = highlight.Category,
                sourceUrl = highlight.SourceUrl,
                imageUrl = highlight.ImageUrl,
                articleId = highlight.ArticleId,
                articleTitle = highlight.Article?.Title,
                bookId = highlight.BookId,
                bookTitle = highlight.Book?.Title,
                tags = highlight.Tags?.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList(),
                location = highlight.Location,
                locationType = highlight.LocationType,
                highlightedAt = highlight.HighlightedAt,
                createdAt = highlight.CreatedAt,
                updatedAt = highlight.UpdatedAt,
                color = highlight.Color,
                isFavorite = highlight.IsFavorite
            };
        }
    }
}

