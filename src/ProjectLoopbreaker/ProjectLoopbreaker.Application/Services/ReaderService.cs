using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.Interfaces;
using Amazon.S3;
using Amazon.S3.Model;
using System.Text;

namespace ProjectLoopbreaker.Application.Services
{
    public class ReaderService : IReaderService
    {
        private readonly IApplicationDbContext _context;
        private readonly IReaderApiClient _readerClient;
        private readonly IAmazonS3? _s3Client;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ReaderService> _logger;

        public ReaderService(
            IApplicationDbContext context,
            IReaderApiClient readerClient,
            IAmazonS3? s3Client,
            IConfiguration configuration,
            ILogger<ReaderService> logger)
        {
            _context = context;
            _readerClient = readerClient;
            _s3Client = s3Client;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<ReaderSyncResultDto> SyncDocumentsAsync(string? location = null)
        {
            var result = new ReaderSyncResultDto
            {
                StartedAt = DateTime.UtcNow
            };

            try
            {
                _logger.LogInformation("Starting Reader document sync (location: {Location})", 
                    location ?? "all");

                string? pageCursor = null;
                var hasMore = true;
                var iteration = 0;

                while (hasMore && iteration < 100) // Safety limit
                {
                    var response = await _readerClient.GetDocumentsAsync(
                        location: location,
                        category: "article",
                        pageCursor: pageCursor);

                    if (response.results.Count == 0)
                    {
                        break;
                    }

                    _logger.LogInformation("Processing {Count} documents (iteration {Iteration})", 
                        response.results.Count, iteration + 1);

                    foreach (var docDto in response.results)
                    {
                        await ProcessReaderDocument(docDto, result);
                    }

                    hasMore = !string.IsNullOrEmpty(response.nextPageCursor);
                    pageCursor = response.nextPageCursor;
                    iteration++;

                    // Small delay to respect rate limits
                    await Task.Delay(250);
                }

                result.CompletedAt = DateTime.UtcNow;
                result.Success = true;

                _logger.LogInformation("Completed Reader sync. Created: {Created}, Updated: {Updated}",
                    result.CreatedCount, result.UpdatedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing documents from Reader");
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.CompletedAt = DateTime.UtcNow;
            }

            return result;
        }

        public async Task<bool> FetchAndStoreArticleContentAsync(Guid articleId)
        {
            try
            {
                var article = await _context.Articles
                    .FirstOrDefaultAsync(a => a.Id == articleId);
                if (article == null || string.IsNullOrEmpty(article.ReadwiseDocumentId))
                {
                    _logger.LogWarning("Article {ArticleId} not found or missing Reader document ID", articleId);
                    return false;
                }

                _logger.LogInformation("Fetching content for article {ArticleId} (Reader doc: {DocId})",
                    articleId, article.ReadwiseDocumentId);

                // Fetch document with HTML content
                var document = await _readerClient.GetDocumentByIdAsync(article.ReadwiseDocumentId, includeHtml: true);
                if (document == null || string.IsNullOrEmpty(document.html))
                {
                    _logger.LogWarning("No HTML content available for document {DocumentId}", article.ReadwiseDocumentId);
                    return false;
                }

                // Upload to S3
                var s3Key = await UploadContentToS3Async(article.Id, document.html);
                if (s3Key == null)
                {
                    return false;
                }

                // Update article
                article.ContentStoragePath = s3Key;
                article.WordCount = document.word_count;
                article.LastReaderSync = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully stored content for article {ArticleId} at {S3Key}",
                    articleId, s3Key);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching and storing content for article {ArticleId}", articleId);
                return false;
            }
        }

        public async Task<int> BulkFetchArticleContentsAsync(int batchSize = 50)
        {
            try
            {
                // Get articles with Reader document ID but no content
                var articles = await _context.Articles
                    .Where(a => a.ReadwiseDocumentId != null && a.ContentStoragePath == null)
                    .Take(batchSize)
                    .ToListAsync();

                _logger.LogInformation("Starting bulk content fetch for {Count} articles", articles.Count);

                var successCount = 0;

                foreach (var article in articles)
                {
                    var success = await FetchAndStoreArticleContentAsync(article.Id);
                    if (success)
                    {
                        successCount++;
                    }

                    // Rate limiting: wait 300ms between requests (respects 20 req/min limit)
                    await Task.Delay(300);
                }

                _logger.LogInformation("Bulk fetch completed. Successfully fetched {Count} of {Total}",
                    successCount, articles.Count);

                return successCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk fetch of article contents");
                return 0;
            }
        }

        private async Task ProcessReaderDocument(
            ProjectLoopbreaker.Shared.DTOs.ReadwiseReader.ReaderDocumentDto dto,
            ReaderSyncResultDto result)
        {
            // Check if article exists by Reader document ID
            var existing = await _context.Articles
                .FirstOrDefaultAsync(a => a.ReadwiseDocumentId == dto.id);

            if (existing != null)
            {
                // Update existing article
                existing.ReaderLocation = dto.location.ToLowerInvariant();
                existing.IsArchived = dto.location.Equals("archive", StringComparison.OrdinalIgnoreCase);
                existing.IsStarred = dto.favorite ?? false;
                existing.ReadingProgress = dto.reading_progress.HasValue 
                    ? (int)(dto.reading_progress.Value * 100) 
                    : null;
                existing.LastReaderSync = DateTime.UtcNow;

                // Update other fields if they've changed
                if (!string.IsNullOrEmpty(dto.title))
                    existing.Title = dto.title;
                if (!string.IsNullOrEmpty(dto.summary))
                    existing.Description = dto.summary;

                result.UpdatedCount++;

                _logger.LogDebug("Updated article {ArticleId} from Reader document {DocumentId}",
                    existing.Id, dto.id);
            }
            else
            {
                // Create new article
                var article = new Article
                {
                    Id = Guid.NewGuid(),
                    Title = dto.title ?? "Untitled",
                    Description = dto.summary,
                    Author = dto.author,
                    Publication = dto.site_name,
                    Link = dto.url,
                    Thumbnail = dto.image_url,
                    ReadwiseDocumentId = dto.id,
                    ReaderLocation = dto.location.ToLowerInvariant(),
                    IsArchived = dto.location.Equals("archive", StringComparison.OrdinalIgnoreCase),
                    IsStarred = dto.favorite ?? false,
                    WordCount = dto.word_count,
                    ReadingProgress = dto.reading_progress.HasValue 
                        ? (int)(dto.reading_progress.Value * 100) 
                        : null,
                    PublicationDate = !string.IsNullOrEmpty(dto.published_date) 
                        ? DateTime.Parse(dto.published_date) 
                        : null,
                    LastReaderSync = DateTime.UtcNow,
                    DateAdded = DateTime.UtcNow,
                    MediaType = Domain.Entities.MediaType.Article,
                    Status = Domain.Entities.Status.Uncharted
                };

                _context.Add(article);
                result.CreatedCount++;

                _logger.LogDebug("Created article {ArticleId} from Reader document {DocumentId}",
                    article.Id, dto.id);
            }

            await _context.SaveChangesAsync();
        }

        private async Task<string?> UploadContentToS3Async(Guid articleId, string htmlContent)
        {
            if (_s3Client == null)
            {
                _logger.LogWarning("S3 client not configured");
                return null;
            }

            try
            {
                var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
                var bucketName = spacesConfig["BucketName"];

                if (string.IsNullOrEmpty(bucketName))
                {
                    _logger.LogWarning("DigitalOcean Spaces bucket name not configured");
                    return null;
                }

                var s3Key = $"articles/{articleId}.html";
                var bytes = Encoding.UTF8.GetBytes(htmlContent);

                using var stream = new MemoryStream(bytes);
                var uploadRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = s3Key,
                    InputStream = stream,
                    ContentType = "text/html",
                    CannedACL = S3CannedACL.Private // Content is private, not public
                };

                await _s3Client.PutObjectAsync(uploadRequest);
                _logger.LogInformation("Uploaded article content to S3: {S3Key}", s3Key);

                return s3Key;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading article {ArticleId} content to S3", articleId);
                return null;
            }
        }
    }
}

