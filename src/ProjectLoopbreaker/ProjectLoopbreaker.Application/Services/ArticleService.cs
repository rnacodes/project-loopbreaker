using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Application.Interfaces;
using Amazon.S3;
using Amazon.S3.Model;
using System.Text;

namespace ProjectLoopbreaker.Application.Services
{
    public class ArticleService : IArticleService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<ArticleService> _logger;
        private readonly IAmazonS3? _s3Client;
        private readonly IConfiguration _configuration;

        public ArticleService(
            IApplicationDbContext context, 
            ILogger<ArticleService> logger,
            IAmazonS3? s3Client,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _s3Client = s3Client;
            _configuration = configuration;
        }

        public async Task<IEnumerable<Article>> GetAllArticlesAsync()
        {
            try
            {
                return await _context.Articles
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving all articles");
                throw;
            }
        }

        public async Task<Article?> GetArticleByIdAsync(Guid id)
        {
            try
            {
                return await _context.Articles
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .FirstOrDefaultAsync(a => a.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving article with ID {Id}", id);
                throw;
            }
        }

        public async Task<IEnumerable<Article>> GetArticlesByAuthorAsync(string author)
        {
            try
            {
                return await _context.Articles
                    .Where(a => a.Author != null && a.Author.ToLower().Contains(author.ToLower()))
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving articles by author: {Author}", author);
                throw;
            }
        }

        public async Task<IEnumerable<Article>> GetArchivedArticlesAsync()
        {
            try
            {
                return await _context.Articles
                    .Where(a => a.IsArchived)
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .OrderByDescending(a => a.DateAdded)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving archived articles");
                throw;
            }
        }

        public async Task<IEnumerable<Article>> GetStarredArticlesAsync()
        {
            try
            {
                return await _context.Articles
                    .Where(a => a.IsStarred)
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .OrderByDescending(a => a.DateAdded)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving starred articles");
                throw;
            }
        }

        public async Task<Article?> GetArticleByInstapaperIdAsync(string instapaperBookmarkId)
        {
            try
            {
                return await _context.Articles
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .FirstOrDefaultAsync(a => a.InstapaperBookmarkId == instapaperBookmarkId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving article with Instapaper ID {InstapaperBookmarkId}", instapaperBookmarkId);
                throw;
            }
        }

        public async Task<Article> CreateArticleAsync(CreateArticleDto dto)
        {
            try
            {
                var article = new Article
                {
                    Title = dto.Title,
                    MediaType = MediaType.Article,
                    Link = dto.Link,
                    Notes = dto.Notes,
                    Status = dto.Status,
                    DateAdded = DateTime.UtcNow,
                    DateCompleted = dto.DateCompleted,
                    Rating = dto.Rating,
                    OwnershipStatus = dto.OwnershipStatus,
                    Description = dto.Description,
                    RelatedNotes = dto.RelatedNotes,
                    Thumbnail = dto.Thumbnail,
                    InstapaperBookmarkId = dto.InstapaperBookmarkId,
                    ContentStoragePath = dto.ContentStoragePath,
                    IsArchived = dto.IsArchived,
                    IsStarred = dto.IsStarred,
                    InstapaperHash = dto.InstapaperHash,
                    Author = dto.Author,
                    Publication = dto.Publication,
                    PublicationDate = dto.PublicationDate,
                    ReadingProgress = dto.ReadingProgress,
                    WordCount = dto.WordCount
                };

                // Handle Topics array conversion
                await HandleTopicsAsync(article, dto.Topics);

                // Handle Genres array conversion
                await HandleGenresAsync(article, dto.Genres);

                _context.Add(article);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully created article: {Title}", article.Title);
                return article;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating article");
                throw;
            }
        }

        public async Task<Article> UpdateArticleAsync(Guid id, CreateArticleDto dto)
        {
            try
            {
                var article = await _context.Articles
                    .Include(a => a.Topics)
                    .Include(a => a.Genres)
                    .FirstOrDefaultAsync(a => a.Id == id);

                if (article == null)
                {
                    throw new InvalidOperationException($"Article with ID {id} not found.");
                }

                // Update article properties
                article.Title = dto.Title;
                article.Link = dto.Link;
                article.Notes = dto.Notes;
                article.Status = dto.Status;
                article.DateCompleted = dto.DateCompleted;
                article.Rating = dto.Rating;
                article.OwnershipStatus = dto.OwnershipStatus;
                article.Description = dto.Description;
                article.RelatedNotes = dto.RelatedNotes;
                article.Thumbnail = dto.Thumbnail;
                article.InstapaperBookmarkId = dto.InstapaperBookmarkId;
                article.ContentStoragePath = dto.ContentStoragePath;
                article.IsArchived = dto.IsArchived;
                article.IsStarred = dto.IsStarred;
                article.InstapaperHash = dto.InstapaperHash;
                article.Author = dto.Author;
                article.Publication = dto.Publication;
                article.PublicationDate = dto.PublicationDate;
                article.ReadingProgress = dto.ReadingProgress;
                article.WordCount = dto.WordCount;

                // Clear existing topics and genres and save immediately to avoid FK conflicts
                article.Topics.Clear();
                article.Genres.Clear();
                await _context.SaveChangesAsync();

                // Handle Topics array conversion
                await HandleTopicsAsync(article, dto.Topics);

                // Handle Genres array conversion
                await HandleGenresAsync(article, dto.Genres);

                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully updated article: {Title}", article.Title);
                return article;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating article with ID {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteArticleAsync(Guid id)
        {
            try
            {
                var article = await _context.FindAsync<Article>(id);
                if (article == null)
                {
                    return false;
                }

                // Delete content from S3 if it exists
                if (!string.IsNullOrEmpty(article.ContentStoragePath) && _s3Client != null)
                {
                    try
                    {
                        var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
                        var bucketName = spacesConfig["BucketName"];
                        
                        if (!string.IsNullOrEmpty(bucketName))
                        {
                            await _s3Client.DeleteObjectAsync(bucketName, article.ContentStoragePath);
                            _logger.LogInformation("Deleted article content from S3: {ContentStoragePath}", article.ContentStoragePath);
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete article content from S3, continuing with database deletion");
                    }
                }

                _context.Remove(article);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully deleted article with ID: {Id}", id);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting article with ID {Id}", id);
                throw;
            }
        }

        public async Task<ArticleSyncResultDto> SyncArticlesFromInstapaperAsync()
        {
            // TODO: This method will be implemented when the Instapaper API client is ready
            // For now, return a placeholder result
            _logger.LogWarning("SyncArticlesFromInstapaperAsync called but not yet fully implemented - awaiting Instapaper API client");
            
            var result = new ArticleSyncResultDto
            {
                Message = "Sync functionality will be available when Instapaper API client and cron job are implemented",
                NewArticlesCount = 0,
                UpdatedArticlesCount = 0,
                TotalArticlesCount = await _context.Articles.CountAsync(),
                LastSyncDate = DateTime.UtcNow,
                Errors = new List<string> { "Instapaper API integration not yet complete" }
            };
            
            return result;
        }

        public async Task<Article> UpdateArticleSyncStatusAsync(Guid id, bool isArchived, bool isStarred, string? hash)
        {
            try
            {
                var article = await _context.FindAsync<Article>(id);
                if (article == null)
                {
                    throw new InvalidOperationException($"Article with ID {id} not found.");
                }

                article.IsArchived = isArchived;
                article.IsStarred = isStarred;
                article.InstapaperHash = hash;
                article.LastSyncDate = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated sync status for article: {Title}", article.Title);
                return article;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating sync status for article with ID {Id}", id);
                throw;
            }
        }

        public async Task<string?> GetArticleContentAsync(Guid id)
        {
            try
            {
                var article = await _context.FindAsync<Article>(id);
                if (article == null || string.IsNullOrEmpty(article.ContentStoragePath))
                {
                    return null;
                }

                if (_s3Client == null)
                {
                    _logger.LogWarning("S3 client not configured, cannot retrieve article content");
                    return null;
                }

                var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
                var bucketName = spacesConfig["BucketName"];

                if (string.IsNullOrEmpty(bucketName))
                {
                    _logger.LogWarning("DigitalOcean Spaces bucket name not configured");
                    return null;
                }

                var request = new GetObjectRequest
                {
                    BucketName = bucketName,
                    Key = article.ContentStoragePath
                };

                using var response = await _s3Client.GetObjectAsync(request);
                using var reader = new StreamReader(response.ResponseStream);
                var content = await reader.ReadToEndAsync();

                _logger.LogInformation("Retrieved article content from S3 for article: {Title}", article.Title);
                return content;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving article content for article with ID {Id}", id);
                throw;
            }
        }

        public async Task<bool> UpdateArticleContentAsync(Guid id, string htmlContent)
        {
            try
            {
                var article = await _context.FindAsync<Article>(id);
                if (article == null)
                {
                    return false;
                }

                if (_s3Client == null)
                {
                    _logger.LogWarning("S3 client not configured, cannot store article content");
                    return false;
                }

                var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
                var bucketName = spacesConfig["BucketName"];
                var endpoint = spacesConfig["Endpoint"];

                if (string.IsNullOrEmpty(bucketName) || string.IsNullOrEmpty(endpoint))
                {
                    _logger.LogWarning("DigitalOcean Spaces configuration incomplete");
                    return false;
                }

                // Generate storage path if not exists
                if (string.IsNullOrEmpty(article.ContentStoragePath))
                {
                    article.ContentStoragePath = $"articles/content_{article.Id}.html";
                }

                // Upload content to S3
                using var memoryStream = new MemoryStream(Encoding.UTF8.GetBytes(htmlContent));
                var request = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = article.ContentStoragePath,
                    InputStream = memoryStream,
                    ContentType = "text/html",
                    CannedACL = S3CannedACL.Private // Keep article content private
                };

                await _s3Client.PutObjectAsync(request);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Uploaded article content to S3 for article: {Title}", article.Title);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating article content for article with ID {Id}", id);
                throw;
            }
        }

        private async Task HandleTopicsAsync(Article article, string[] topics)
        {
            if (topics?.Length > 0)
            {
                foreach (var topicName in topics.Where(t => !string.IsNullOrWhiteSpace(t)))
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
        }

        private async Task HandleGenresAsync(Article article, string[] genres)
        {
            if (genres?.Length > 0)
            {
                foreach (var genreName in genres.Where(g => !string.IsNullOrWhiteSpace(g)))
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
        }
    }
}

