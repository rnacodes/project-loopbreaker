using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.DTOs;
using Microsoft.EntityFrameworkCore;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArticleController : ControllerBase
    {
        private readonly IInstapaperService _instapaperService;
        private readonly IArticleMappingService _mappingService;
        private readonly IApplicationDbContext _context;
        private readonly ILogger<ArticleController> _logger;
        
        public ArticleController(
            IInstapaperService instapaperService,
            IArticleMappingService mappingService,
            IApplicationDbContext context,
            ILogger<ArticleController> logger)
        {
            _instapaperService = instapaperService;
            _mappingService = mappingService;
            _context = context;
            _logger = logger;
        }
        
        /// <summary>
        /// Authenticates with Instapaper using username and password
        /// </summary>
        [HttpPost("instapaper/authenticate")]
        public async Task<IActionResult> AuthenticateWithInstapaper([FromBody] InstapaperAuthRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.Username))
                {
                    return BadRequest("Username is required");
                }
                
                var (user, accessToken, accessTokenSecret) = await _instapaperService.AuthenticateAsync(request.Username, request.Password ?? "");
                
                return Ok(new InstapaperAuthResponse
                {
                    User = user,
                    AccessToken = accessToken,
                    AccessTokenSecret = accessTokenSecret,
                    Success = true,
                    Message = "Successfully authenticated with Instapaper"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to authenticate with Instapaper for user: {Username}", request.Username);
                return BadRequest(new InstapaperAuthResponse
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }
        
        /// <summary>
        /// Imports bookmarks from Instapaper
        /// </summary>
        [HttpPost("instapaper/import")]
        public async Task<IActionResult> ImportFromInstapaper([FromBody] InstapaperImportRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.AccessTokenSecret))
                {
                    return BadRequest("Access token and secret are required");
                }
                
                var articles = await _instapaperService.ImportBookmarksAsync(
                    request.AccessToken, 
                    request.AccessTokenSecret, 
                    request.Limit ?? 25, 
                    request.FolderId ?? "unread");
                
                var responseDto = articles.Select(a => _mappingService.MapArticleToResponseDto(a)).ToList();
                
                return Ok(new InstapaperImportResponse
                {
                    Success = true,
                    Message = $"Successfully imported {articles.Count()} articles from Instapaper",
                    Articles = responseDto,
                    ImportedCount = articles.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to import articles from Instapaper");
                return BadRequest(new InstapaperImportResponse
                {
                    Success = false,
                    Message = ex.Message,
                    Articles = new List<ArticleResponseDto>(),
                    ImportedCount = 0
                });
            }
        }
        
        /// <summary>
        /// Syncs existing articles with Instapaper
        /// </summary>
        [HttpPost("instapaper/sync")]
        public async Task<IActionResult> SyncWithInstapaper([FromBody] InstapaperSyncRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.AccessTokenSecret))
                {
                    return BadRequest("Access token and secret are required");
                }
                
                var updatedCount = await _instapaperService.SyncExistingArticlesAsync(request.AccessToken, request.AccessTokenSecret);
                
                return Ok(new
                {
                    Success = true,
                    Message = $"Successfully synced {updatedCount} articles with Instapaper",
                    UpdatedCount = updatedCount
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync articles with Instapaper");
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message,
                    UpdatedCount = 0
                });
            }
        }
        
        /// <summary>
        /// Saves a URL to Instapaper and creates a local article
        /// </summary>
        [HttpPost("instapaper/save")]
        public async Task<IActionResult> SaveToInstapaper([FromBody] InstapaperSaveRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.AccessToken) || string.IsNullOrWhiteSpace(request.AccessTokenSecret))
                {
                    return BadRequest("Access token and secret are required");
                }
                
                if (string.IsNullOrWhiteSpace(request.Url))
                {
                    return BadRequest("URL is required");
                }
                
                var article = await _instapaperService.SaveToInstapaperAsync(
                    request.AccessToken, 
                    request.AccessTokenSecret, 
                    request.Url, 
                    request.Title, 
                    request.Selection);
                
                var responseDto = _mappingService.MapArticleToResponseDto(article);
                
                return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, new
                {
                    Success = true,
                    Message = "Successfully saved article to Instapaper",
                    Article = responseDto
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save URL to Instapaper: {Url}", request.Url);
                return BadRequest(new
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }
        
        /// <summary>
        /// Gets all articles
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ArticleResponseDto>>> GetAllArticles()
        {
            try
            {
                var articles = await _context.MediaItems
                    .OfType<Article>()
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .Include(a => a.Mixlists)
                    .OrderByDescending(a => a.DateAdded)
                    .ToListAsync();
                
                var responseDto = articles.Select(a => _mappingService.MapArticleToResponseDto(a)).ToList();
                
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get all articles");
                return StatusCode(500, new { error = "Failed to retrieve articles", details = ex.Message });
            }
        }
        
        /// <summary>
        /// Gets a specific article by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<ArticleResponseDto>> GetArticle(Guid id)
        {
            try
            {
                var article = await _context.MediaItems
                    .OfType<Article>()
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .Include(a => a.Mixlists)
                    .FirstOrDefaultAsync(a => a.Id == id);
                
                if (article == null)
                {
                    return NotFound($"Article with ID {id} not found");
                }
                
                var responseDto = _mappingService.MapArticleToResponseDto(article);
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get article: {ArticleId}", id);
                return StatusCode(500, new { error = "Failed to retrieve article", details = ex.Message });
            }
        }
        
        /// <summary>
        /// Creates a new article
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateArticle([FromBody] CreateArticleDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Article data is required");
                }
                
                var article = _mappingService.MapCreateDtoToArticle(dto);
                
                // Handle Topics - check if they exist or create new ones
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                        var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                        if (existingTopic != null)
                        {
                            article.Topics.Add(existingTopic);
                        }
                        else
                        {
                            article.Topics.Add(new Topic { Name = normalizedTopicName });
                        }
                    }
                }
                
                // Handle Genres - check if they exist or create new ones
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                        if (existingGenre != null)
                        {
                            article.Genres.Add(existingGenre);
                        }
                        else
                        {
                            article.Genres.Add(new Genre { Name = normalizedGenreName });
                        }
                    }
                }
                
                _context.Add(article);
                await _context.SaveChangesAsync();
                
                var responseDto = _mappingService.MapArticleToResponseDto(article);
                return CreatedAtAction(nameof(GetArticle), new { id = article.Id }, responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create article");
                return StatusCode(500, new { error = "Failed to create article", details = ex.Message });
            }
        }
        
        /// <summary>
        /// Updates an existing article
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateArticle(Guid id, [FromBody] CreateArticleDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Article data is required");
                }
                
                var existingArticle = await _context.MediaItems
                    .OfType<Article>()
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .FirstOrDefaultAsync(a => a.Id == id);
                
                if (existingArticle == null)
                {
                    return NotFound($"Article with ID {id} not found");
                }
                
                _mappingService.UpdateArticleFromDto(existingArticle, dto);
                
                // Clear existing topics and genres
                existingArticle.Topics.Clear();
                existingArticle.Genres.Clear();
                
                // Add new topics
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                        var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                        if (existingTopic != null)
                        {
                            existingArticle.Topics.Add(existingTopic);
                        }
                        else
                        {
                            existingArticle.Topics.Add(new Topic { Name = normalizedTopicName });
                        }
                    }
                }
                
                // Add new genres
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                        if (existingGenre != null)
                        {
                            existingArticle.Genres.Add(existingGenre);
                        }
                        else
                        {
                            existingArticle.Genres.Add(new Genre { Name = normalizedGenreName });
                        }
                    }
                }
                
                await _context.SaveChangesAsync();
                
                var responseDto = _mappingService.MapArticleToResponseDto(existingArticle);
                return Ok(responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update article: {ArticleId}", id);
                return StatusCode(500, new { error = "Failed to update article", details = ex.Message });
            }
        }
        
        /// <summary>
        /// Deletes an article
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteArticle(Guid id)
        {
            try
            {
                var article = await _context.MediaItems
                    .OfType<Article>()
                    .FirstOrDefaultAsync(a => a.Id == id);
                
                if (article == null)
                {
                    return NotFound($"Article with ID {id} not found");
                }
                
                _context.Remove(article);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = $"Article '{article.Title}' deleted successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete article: {ArticleId}", id);
                return StatusCode(500, new { error = "Failed to delete article", details = ex.Message });
            }
        }
    }
    
    // Request/Response DTOs for Instapaper endpoints
    public class InstapaperAuthRequest
    {
        public required string Username { get; set; }
        public string? Password { get; set; }
    }
    
    public class InstapaperAuthResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public ProjectLoopbreaker.Shared.DTOs.Instapaper.InstapaperUserDto? User { get; set; }
        public string? AccessToken { get; set; }
        public string? AccessTokenSecret { get; set; }
    }
    
    public class InstapaperImportRequest
    {
        public required string AccessToken { get; set; }
        public required string AccessTokenSecret { get; set; }
        public int? Limit { get; set; } = 25;
        public string? FolderId { get; set; } = "unread";
    }
    
    public class InstapaperImportResponse
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public List<ArticleResponseDto> Articles { get; set; } = new();
        public int ImportedCount { get; set; }
    }
    
    public class InstapaperSyncRequest
    {
        public required string AccessToken { get; set; }
        public required string AccessTokenSecret { get; set; }
    }
    
    public class InstapaperSaveRequest
    {
        public required string AccessToken { get; set; }
        public required string AccessTokenSecret { get; set; }
        public required string Url { get; set; }
        public string? Title { get; set; }
        public string? Selection { get; set; }
    }
}
