using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;

namespace ProjectLoopbreaker.Application.Services
{
    public class ArticleMappingService : IArticleMappingService
    {
        private readonly ILogger<ArticleMappingService> _logger;
        private readonly IConfiguration _configuration;

        public ArticleMappingService(ILogger<ArticleMappingService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<ArticleResponseDto> MapToResponseDtoAsync(Article article)
        {
            // Get DigitalOcean Spaces configuration for content URL construction
            var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
            var bucketName = spacesConfig["BucketName"];
            var endpoint = spacesConfig["Endpoint"];
            
            string? contentUrl = null;
            if (!string.IsNullOrEmpty(article.ContentStoragePath) && 
                !string.IsNullOrEmpty(bucketName) && 
                !string.IsNullOrEmpty(endpoint))
            {
                contentUrl = article.GetContentUrl(bucketName, endpoint);
            }

            return await Task.FromResult(new ArticleResponseDto
            {
                Id = article.Id,
                Title = article.Title,
                Description = article.Description,
                MediaType = article.MediaType,
                Status = article.Status,
                DateAdded = article.DateAdded,
                Link = article.Link,
                Thumbnail = article.Thumbnail,
                Rating = article.Rating,
                OwnershipStatus = article.OwnershipStatus,
                DateCompleted = article.DateCompleted,
                Notes = article.Notes,
                RelatedNotes = article.RelatedNotes,
                Topics = article.Topics.Select(t => t.Name).ToArray(),
                Genres = article.Genres.Select(g => g.Name).ToArray(),
                InstapaperBookmarkId = article.InstapaperBookmarkId,
                ContentStoragePath = article.ContentStoragePath,
                ContentUrl = contentUrl,
                IsArchived = article.IsArchived,
                IsStarred = article.IsStarred,
                LastSyncDate = article.LastSyncDate,
                InstapaperHash = article.InstapaperHash,
                Author = article.Author,
                Publication = article.Publication,
                PublicationDate = article.PublicationDate,
                ReadingProgress = article.ReadingProgress,
                WordCount = article.WordCount,
                EstimatedReadingTime = article.GetEstimatedReadingTime()
            });
        }

        public async Task<IEnumerable<ArticleResponseDto>> MapToResponseDtoAsync(IEnumerable<Article> articles)
        {
            var tasks = articles.Select(a => MapToResponseDtoAsync(a));
            return await Task.WhenAll(tasks);
        }

        public Article MapInstapaperBookmarkToArticle(InstapaperBookmarkDto bookmark)
        {
            var article = new Article
            {
                Title = bookmark.Title ?? "Untitled Article",
                Link = bookmark.Url,
                Description = bookmark.Description,
                MediaType = MediaType.Article,
                Status = Status.Uncharted,
                DateAdded = bookmark.DateAdded,
                InstapaperBookmarkId = bookmark.BookmarkId,
                InstapaperHash = bookmark.Hash,
                IsStarred = bookmark.IsStarred,
                ReadingProgress = (int)(bookmark.Progress * 100) // Convert 0.0-1.0 to 0-100
            };

            return article;
        }

        public async Task UpdateArticleFromInstapaper(Article article, InstapaperBookmarkDto bookmark)
        {
            // Update only Instapaper-specific fields, preserve PLB-specific data
            article.InstapaperHash = bookmark.Hash;
            article.IsStarred = bookmark.IsStarred;
            article.ReadingProgress = (int)(bookmark.Progress * 100);
            article.LastSyncDate = DateTime.UtcNow;

            // Only update title/description if they're empty (PLB data takes precedence)
            if (string.IsNullOrEmpty(article.Title) || article.Title == "Untitled Article")
            {
                article.Title = bookmark.Title ?? "Untitled Article";
            }

            if (string.IsNullOrEmpty(article.Description))
            {
                article.Description = bookmark.Description;
            }

            await Task.CompletedTask; // Make it async for consistency
        }
    }
}
