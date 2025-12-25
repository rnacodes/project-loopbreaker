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
        private readonly IReaderService? _readerService;
        private readonly IInstapaperService? _instapaperService;
        private readonly ILogger<ArticleController> _logger;

        public ArticleController(
            IArticleService articleService,
            IArticleMappingService articleMappingService,
            ILogger<ArticleController> logger,
            IReaderService? readerService = null,
            IInstapaperService? instapaperService = null)
        {
            _articleService = articleService;
            _articleMappingService = articleMappingService;
            _logger = logger;
            _readerService = readerService;
            _instapaperService = instapaperService;
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

        // POST: api/article/sync-reader
        [HttpPost("sync-reader")]
        public async Task<ActionResult<ReaderSyncResultDto>> SyncFromReader([FromQuery] string? location = null)
        {
            try
            {
                if (_readerService == null)
                {
                    return StatusCode(500, new { error = "Reader service not configured" });
                }

                _logger.LogInformation("Starting Reader document sync (location: {Location})", location ?? "all");
                var result = await _readerService.SyncDocumentsAsync(location);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing from Reader");
                return StatusCode(500, new { error = "Failed to sync from Reader", details = ex.Message });
            }
        }

        // POST: api/article/{id}/fetch-content
        [HttpPost("{id}/fetch-content")]
        public async Task<IActionResult> FetchArticleContent(Guid id)
        {
            try
            {
                if (_readerService == null)
                {
                    return StatusCode(500, new { error = "Reader service not configured" });
                }

                var success = await _readerService.FetchAndStoreArticleContentAsync(id);
                if (!success)
                {
                    return NotFound(new { error = "Article not found or content unavailable" });
                }
                return Ok(new { message = "Content fetched and stored successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching content for article {Id}", id);
                return StatusCode(500, new { error = "Failed to fetch content", details = ex.Message });
            }
        }

        // POST: api/article/bulk-fetch-content
        [HttpPost("bulk-fetch-content")]
        public async Task<IActionResult> BulkFetchContent([FromQuery] int batchSize = 50)
        {
            try
            {
                if (_readerService == null)
                {
                    return StatusCode(500, new { error = "Reader service not configured" });
                }

                var count = await _readerService.BulkFetchArticleContentsAsync(batchSize);
                return Ok(new { fetchedCount = count, message = $"Successfully fetched content for {count} articles" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk content fetch");
                return StatusCode(500, new { error = "Failed to bulk fetch content", details = ex.Message });
            }
        }

        // POST: api/article/instapaper/authenticate
        [HttpPost("instapaper/authenticate")]
        public async Task<IActionResult> AuthenticateInstapaper([FromBody] InstapaperAuthRequestDto request)
        {
            try
            {
                if (_instapaperService == null)
                {
                    return StatusCode(500, new { error = "Instapaper service not configured. Please configure Instapaper API credentials in appsettings." });
                }

                if (string.IsNullOrWhiteSpace(request.Username))
                {
                    return BadRequest(new { error = "Username is required" });
                }

                _logger.LogInformation("Attempting to authenticate Instapaper user: {Username}", request.Username);
                
                var (user, accessToken, accessTokenSecret) = await _instapaperService.AuthenticateAsync(
                    request.Username, 
                    request.Password ?? string.Empty);

                return Ok(new
                {
                    success = true,
                    message = "Authentication successful",
                    accessToken,
                    accessTokenSecret,
                    user = new
                    {
                        userId = user.UserId,
                        username = user.Username,
                        hasActiveSubscription = user.HasActiveSubscription
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error authenticating with Instapaper for user: {Username}", request.Username);
                return StatusCode(500, new { 
                    success = false,
                    message = "Failed to authenticate with Instapaper. Please check your credentials and ensure the backend has valid Instapaper API keys configured.",
                    error = ex.Message 
                });
            }
        }

        // POST: api/article/instapaper/import
        [HttpPost("instapaper/import")]
        public async Task<IActionResult> ImportFromInstapaper([FromBody] InstapaperImportRequestDto request)
        {
            try
            {
                if (_instapaperService == null)
                {
                    return StatusCode(500, new { error = "Instapaper service not configured" });
                }

                if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.AccessTokenSecret))
                {
                    return BadRequest(new { error = "Access token and secret are required" });
                }

                _logger.LogInformation("Importing {Limit} bookmarks from Instapaper folder: {FolderId}", 
                    request.Limit, request.FolderId);

                var articles = await _instapaperService.ImportBookmarksAsync(
                    request.AccessToken,
                    request.AccessTokenSecret,
                    request.Limit,
                    request.FolderId ?? "unread");

                var responseDtos = await _articleMappingService.MapToResponseDtoAsync(articles);

                return Ok(new
                {
                    success = true,
                    message = $"Successfully imported {articles.Count()} articles from Instapaper",
                    count = articles.Count(),
                    articles = responseDtos
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing from Instapaper");
                return StatusCode(500, new { 
                    success = false,
                    error = "Failed to import from Instapaper", 
                    details = ex.Message 
                });
            }
        }

        // POST: api/article/instapaper/sync
        [HttpPost("instapaper/sync")]
        public async Task<IActionResult> SyncWithInstapaper([FromBody] InstapaperSyncRequestDto request)
        {
            try
            {
                if (_instapaperService == null)
                {
                    return StatusCode(500, new { error = "Instapaper service not configured" });
                }

                if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.AccessTokenSecret))
                {
                    return BadRequest(new { error = "Access token and secret are required" });
                }

                _logger.LogInformation("Syncing existing articles with Instapaper");

                var updatedCount = await _instapaperService.SyncExistingArticlesAsync(
                    request.AccessToken,
                    request.AccessTokenSecret);

                return Ok(new
                {
                    success = true,
                    message = $"Successfully synced {updatedCount} articles with Instapaper",
                    updatedCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing with Instapaper");
                return StatusCode(500, new { 
                    success = false,
                    error = "Failed to sync with Instapaper", 
                    details = ex.Message 
                });
            }
        }

        // POST: api/article/instapaper/save
        [HttpPost("instapaper/save")]
        public async Task<IActionResult> SaveToInstapaper([FromBody] InstapaperSaveRequestDto request)
        {
            try
            {
                if (_instapaperService == null)
                {
                    return StatusCode(500, new { error = "Instapaper service not configured" });
                }

                if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.AccessTokenSecret))
                {
                    return BadRequest(new { error = "Access token and secret are required" });
                }

                if (string.IsNullOrWhiteSpace(request.Url))
                {
                    return BadRequest(new { error = "URL is required" });
                }

                _logger.LogInformation("Saving URL to Instapaper: {Url}", request.Url);

                var article = await _instapaperService.SaveToInstapaperAsync(
                    request.AccessToken,
                    request.AccessTokenSecret,
                    request.Url,
                    request.Title,
                    request.Selection);

                var responseDto = await _articleMappingService.MapToResponseDtoAsync(article);

                return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, new
                {
                    success = true,
                    message = "Article saved to Instapaper successfully",
                    article = responseDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving to Instapaper");
                return StatusCode(500, new { 
                    success = false,
                    error = "Failed to save to Instapaper", 
                    details = ex.Message 
                });
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

    public class InstapaperAuthRequestDto
    {
        public required string Username { get; set; }
        public string? Password { get; set; }
    }

    public class InstapaperImportRequestDto
    {
        public required string AccessToken { get; set; }
        public required string AccessTokenSecret { get; set; }
        public int Limit { get; set; } = 50;
        public string? FolderId { get; set; } = "unread";
    }

    public class InstapaperSyncRequestDto
    {
        public required string AccessToken { get; set; }
        public required string AccessTokenSecret { get; set; }
    }

    public class InstapaperSaveRequestDto
    {
        public required string AccessToken { get; set; }
        public required string AccessTokenSecret { get; set; }
        public required string Url { get; set; }
        public string? Title { get; set; }
        public string? Selection { get; set; }
    }
}
