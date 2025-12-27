using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Enums;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Helpers;
using ProjectLoopbreaker.Application.Utilities;
using ProjectLoopbreaker.Shared.Interfaces;
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
        private readonly ITypeSenseService? _typeSenseService;

        public ArticleService(
            IApplicationDbContext context, 
            ILogger<ArticleService> logger,
            IAmazonS3? s3Client,
            IConfiguration configuration,
            ITypeSenseService? typeSenseService = null)
        {
            _context = context;
            _logger = logger;
            _s3Client = s3Client;
            _configuration = configuration;
            _typeSenseService = typeSenseService;
        }

        public async Task<IEnumerable<Article>> GetAllArticlesAsync()
        {
            try
            {
                return await _context.Articles
                    .AsNoTracking()
                    .AsSplitQuery()
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
                    .AsNoTracking()
                    .AsSplitQuery()
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
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Where(a => a.Author != null && EF.Functions.ILike(a.Author, $"%{author}%"))
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
                    .AsNoTracking()
                    .AsSplitQuery()
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
                    .AsNoTracking()
                    .AsSplitQuery()
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
                    .AsNoTracking()
                    .AsSplitQuery()
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
                // Normalize URL before saving to prevent duplicates
                var normalizedUrl = !string.IsNullOrWhiteSpace(dto.Link) 
                    ? UrlNormalizer.Normalize(dto.Link) 
                    : null;

                // Check for existing article with same normalized URL
                if (!string.IsNullOrWhiteSpace(normalizedUrl))
                {
                    var existingArticle = await _context.Articles
                        .FirstOrDefaultAsync(a => a.Link != null && EF.Functions.ILike(a.Link, normalizedUrl));
                        
                    if (existingArticle != null)
                    {
                        _logger.LogWarning("Article with URL already exists: {Url} (ID: {Id})", 
                            normalizedUrl, existingArticle.Id);
                        throw new InvalidOperationException(
                            $"An article with this URL already exists (ID: {existingArticle.Id}). " +
                            "Use the deduplication feature to merge duplicate articles.");
                    }
                }

                // Determine initial sync status based on external IDs
                var syncStatus = SyncStatus.LocalOnly;
                if (!string.IsNullOrEmpty(dto.InstapaperBookmarkId))
                    syncStatus |= SyncStatus.InstapaperSynced;
                    
                var article = new Article
                {
                    Title = dto.Title,
                    MediaType = MediaType.Article,
                    Link = normalizedUrl,  // Store normalized URL
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
                    WordCount = dto.WordCount,
                    SyncStatus = syncStatus
                };

                // Handle Topics array conversion
                await HandleTopicsAsync(article, dto.Topics);

                // Handle Genres array conversion
                await HandleGenresAsync(article, dto.Genres);

                _context.Add(article);
                await _context.SaveChangesAsync();

                // Index in Typesense after successful creation
                await TypesenseIndexingHelper.IndexMediaItemAsync(
                    article,
                    _typeSenseService,
                    TypesenseIndexingHelper.GetArticleFields(article));

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

                // Re-index in Typesense after successful update
                await TypesenseIndexingHelper.IndexMediaItemAsync(
                    article,
                    _typeSenseService,
                    TypesenseIndexingHelper.GetArticleFields(article));

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

                var articleId = article.Id;
                var articleTitle = article.Title;

                // Content is stored in database, so just delete the article record
                _context.Remove(article);
                await _context.SaveChangesAsync();

                // Delete from Typesense after successful deletion
                await TypesenseIndexingHelper.DeleteMediaItemAsync(articleId, _typeSenseService);

                _logger.LogInformation("Successfully deleted article: {Title}", articleTitle);
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

                // Re-index in Typesense after sync status update
                await TypesenseIndexingHelper.IndexMediaItemAsync(
                    article,
                    _typeSenseService,
                    TypesenseIndexingHelper.GetArticleFields(article));

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
                if (article == null)
                {
                    return null;
                }

                _logger.LogInformation("Retrieved article content from database for article: {Title}", article.Title);
                return article.FullTextContent;
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

                // Store content directly in database
                article.FullTextContent = htmlContent;
                await _context.SaveChangesAsync();

                _logger.LogInformation("Updated article content in database for article: {Title}", article.Title);
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

