using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Domain.Entities;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArticleController : ControllerBase
    {
        private readonly IArticleService _articleService;
        private readonly IArticleMappingService _articleMappingService;
        private readonly ILogger<ArticleController> _logger;

        public ArticleController(
            IArticleService articleService,
            IArticleMappingService articleMappingService,
            ILogger<ArticleController> logger)
        {
            _articleService = articleService;
            _articleMappingService = articleMappingService;
            _logger = logger;
        }

        // GET: api/article
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ArticleResponseDto>>> GetAllArticles()
        {
            try
            {
                var articles = await _articleService.GetAllArticlesAsync();
                var response = await _articleMappingService.MapToResponseDtoAsync(articles);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving all articles");
                return StatusCode(500, new { error = "Failed to retrieve articles", details = ex.Message });
            }
        }

        // GET: api/article/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<ArticleResponseDto>> GetArticle(Guid id)
        {
            try
            {
                var article = await _articleService.GetArticleByIdAsync(id);
                if (article == null)
                {
                    return NotFound($"Article with ID {id} not found.");
                }

                var response = await _articleMappingService.MapToResponseDtoAsync(article);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving article with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve article", details = ex.Message });
            }
        }

        // GET: api/article/by-author/{author}
        [HttpGet("by-author/{author}")]
        public async Task<ActionResult<IEnumerable<ArticleResponseDto>>> GetArticlesByAuthor(string author)
        {
            try
            {
                var articles = await _articleService.GetArticlesByAuthorAsync(author);
                var response = await _articleMappingService.MapToResponseDtoAsync(articles);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving articles by author: {Author}", author);
                return StatusCode(500, new { error = "Failed to retrieve articles by author", details = ex.Message });
            }
        }

        // GET: api/article/archived
        [HttpGet("archived")]
        public async Task<ActionResult<IEnumerable<ArticleResponseDto>>> GetArchivedArticles()
        {
            try
            {
                var articles = await _articleService.GetArchivedArticlesAsync();
                var response = await _articleMappingService.MapToResponseDtoAsync(articles);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving archived articles");
                return StatusCode(500, new { error = "Failed to retrieve archived articles", details = ex.Message });
            }
        }

        // GET: api/article/starred
        [HttpGet("starred")]
        public async Task<ActionResult<IEnumerable<ArticleResponseDto>>> GetStarredArticles()
        {
            try
            {
                var articles = await _articleService.GetStarredArticlesAsync();
                var response = await _articleMappingService.MapToResponseDtoAsync(articles);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving starred articles");
                return StatusCode(500, new { error = "Failed to retrieve starred articles", details = ex.Message });
            }
        }

        // POST: api/article
        [HttpPost]
        public async Task<IActionResult> CreateArticle([FromBody] CreateArticleDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Article data is required");
                }

                var article = await _articleService.CreateArticleAsync(dto);
                var response = await _articleMappingService.MapToResponseDtoAsync(article);

                return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating article");
                return StatusCode(500, new { error = "Failed to create article", details = ex.Message });
            }
        }

        // PUT: api/article/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArticle(Guid id, [FromBody] CreateArticleDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Article data is required");
                }

                var article = await _articleService.UpdateArticleAsync(id, dto);
                var response = await _articleMappingService.MapToResponseDtoAsync(article);

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Article with ID {Id} not found for update", id);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating article with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to update article", details = ex.Message });
            }
        }

        // DELETE: api/article/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArticle(Guid id)
        {
            try
            {
                var deleted = await _articleService.DeleteArticleAsync(id);
                if (!deleted)
                {
                    return NotFound($"Article with ID {id} not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting article with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to delete article", details = ex.Message });
            }
        }

        // GET: api/article/{id}/content
        [HttpGet("{id}/content")]
        public async Task<IActionResult> GetArticleContent(Guid id)
        {
            try
            {
                var content = await _articleService.GetArticleContentAsync(id);
                if (content == null)
                {
                    return NotFound($"Content for article with ID {id} not found.");
                }

                return Ok(new { content });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving content for article with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve article content", details = ex.Message });
            }
        }

        // POST: api/article/{id}/content
        [HttpPost("{id}/content")]
        public async Task<IActionResult> UpdateArticleContent(Guid id, [FromBody] ArticleContentUpdateDto dto)
        {
            try
            {
                if (dto == null || string.IsNullOrEmpty(dto.HtmlContent))
                {
                    return BadRequest("HTML content is required");
                }

                var success = await _articleService.UpdateArticleContentAsync(id, dto.HtmlContent);
                if (!success)
                {
                    return NotFound($"Article with ID {id} not found or S3 storage not configured.");
                }

                return Ok(new { message = "Article content updated successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating content for article with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to update article content", details = ex.Message });
            }
        }

        // POST: api/article/sync
        [HttpPost("sync")]
        public async Task<ActionResult<ArticleSyncResultDto>> SyncArticlesFromInstapaper()
        {
            try
            {
                _logger.LogInformation("Starting article sync from Instapaper");
                var result = await _articleService.SyncArticlesFromInstapaperAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while syncing articles from Instapaper");
                return StatusCode(500, new { error = "Failed to sync articles from Instapaper", details = ex.Message });
            }
        }

        // PUT: api/article/{id}/sync-status
        [HttpPut("{id}/sync-status")]
        public async Task<IActionResult> UpdateArticleSyncStatus(Guid id, [FromBody] ArticleSyncStatusUpdateDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Sync status data is required");
                }

                var article = await _articleService.UpdateArticleSyncStatusAsync(id, dto.IsArchived, dto.IsStarred, dto.Hash);
                var response = await _articleMappingService.MapToResponseDtoAsync(article);

                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Article with ID {Id} not found for sync status update", id);
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating sync status for article with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to update article sync status", details = ex.Message });
            }
        }
    }

    // Helper DTOs for specific endpoints
    public class ArticleContentUpdateDto
    {
        public required string HtmlContent { get; set; }
    }

    public class ArticleSyncStatusUpdateDto
    {
        public bool IsArchived { get; set; }
        public bool IsStarred { get; set; }
        public string? Hash { get; set; }
    }
}
