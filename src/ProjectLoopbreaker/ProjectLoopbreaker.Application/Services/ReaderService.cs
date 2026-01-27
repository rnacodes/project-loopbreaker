using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Utilities;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Enums;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class ReaderService : IReaderService
    {
        private readonly IApplicationDbContext _context;
        private readonly IReaderApiClient _readerClient;
        private readonly ILogger<ReaderService> _logger;

        public ReaderService(
            IApplicationDbContext context,
            IReaderApiClient readerClient,
            ILogger<ReaderService> logger)
        {
            _context = context;
            _readerClient = readerClient;
            _logger = logger;
        }

        public async Task<ReaderSyncResultDto> SyncDocumentsAsync(string? location = null, DateTime? updatedAfter = null)
        {
            var result = new ReaderSyncResultDto
            {
                StartedAt = DateTime.UtcNow
            };

            try
            {
                // Format updatedAfter for the API (ISO 8601 format)
                string? updatedAfterStr = updatedAfter?.ToString("yyyy-MM-ddTHH:mm:ssZ");

                _logger.LogInformation("Starting Reader document sync (location: {Location}, updatedAfter: {UpdatedAfter})",
                    location ?? "all", updatedAfterStr ?? "none");

                string? pageCursor = null;
                var hasMore = true;
                var iteration = 0;

                while (hasMore && iteration < 100) // Safety limit
                {
                    var response = await _readerClient.GetDocumentsAsync(
                        updatedAfter: updatedAfterStr,
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

                // Store content directly in database
                article.FullTextContent = document.html;
                article.WordCount = document.word_count;
                article.LastReaderSync = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully stored content for article {ArticleId} in database ({Size} chars)",
                    articleId, document.html.Length);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching and storing content for article {ArticleId}", articleId);
                return false;
            }
        }

        public async Task<int> BulkFetchArticleContentsAsync(int batchSize = 50, DateTime? updatedAfter = null)
        {
            try
            {
                // Get archived articles with Reader document ID but no content
                // Only fetch content for Completed (archived) articles - for archival purposes
                var baseQuery = _context.Articles
                    .Where(a => a.ReadwiseDocumentId != null
                             && a.FullTextContent == null
                             && a.Status == Status.Completed);  // Only archived articles

                if (updatedAfter.HasValue)
                {
                    // Include articles with null LastReaderSync (never synced) or synced after the date
                    baseQuery = baseQuery.Where(a =>
                        a.LastReaderSync == null || a.LastReaderSync >= updatedAfter.Value);
                }

                var articles = await baseQuery
                    .OrderBy(a => a.DateAdded)  // Consistent ordering for pagination
                    .Take(batchSize)
                    .ToListAsync();

                _logger.LogInformation("Starting bulk content fetch for {Count} archived articles", articles.Count);

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
            // Normalize URL for consistent comparison
            var normalizedUrl = UrlNormalizer.Normalize(dto.url);
            
            // Check if article exists by Reader document ID OR normalized URL
            var existing = await _context.Articles
                .FirstOrDefaultAsync(a => 
                    a.ReadwiseDocumentId == dto.id ||
                    (a.Link != null && EF.Functions.ILike(a.Link, normalizedUrl)));

            // Map ReaderLocation to Status - Readwise is source of truth
            var newStatus = dto.location.ToLowerInvariant() switch
            {
                "archive" => Status.Completed,
                _ => Status.Uncharted  // new, later, feed all map to Uncharted
            };

            if (existing != null)
            {
                // Update existing article with Reader data
                existing.ReadwiseDocumentId = dto.id;
                existing.ReaderLocation = dto.location.ToLowerInvariant();
                existing.IsArchived = dto.location.Equals("archive", StringComparison.OrdinalIgnoreCase);
                existing.IsStarred = dto.favorite ?? false;
                existing.ReadingProgress = dto.reading_progress.HasValue
                    ? (int)(dto.reading_progress.Value * 100)
                    : null;
                existing.LastReaderSync = DateTime.UtcNow;

                // Readwise is source of truth for status
                existing.Status = newStatus;

                // Mark as synced with Reader
                existing.SyncStatus |= SyncStatus.ReaderSynced;

                // Update metadata fields (prefer Reader's data if more complete)
                if (!string.IsNullOrEmpty(dto.title) && 
                    (string.IsNullOrEmpty(existing.Title) || existing.Title == "Untitled"))
                    existing.Title = dto.title;
                    
                if (!string.IsNullOrEmpty(dto.summary) && string.IsNullOrEmpty(existing.Description))
                    existing.Description = dto.summary;
                    
                if (!string.IsNullOrEmpty(dto.author) && string.IsNullOrEmpty(existing.Author))
                    existing.Author = dto.author;
                    
                if (!string.IsNullOrEmpty(dto.site_name) && string.IsNullOrEmpty(existing.Publication))
                    existing.Publication = dto.site_name;
                    
                if (!string.IsNullOrEmpty(dto.image_url) && string.IsNullOrEmpty(existing.Thumbnail))
                    existing.Thumbnail = dto.image_url;
                    
                if (dto.word_count.HasValue && (!existing.WordCount.HasValue || existing.WordCount == 0))
                    existing.WordCount = dto.word_count;

                result.UpdatedCount++;

                _logger.LogDebug("Updated article {ArticleId} from Reader document {DocumentId}",
                    existing.Id, dto.id);
            }
            else
            {
                // Create new article with normalized URL
                var article = new Article
                {
                    Id = Guid.NewGuid(),
                    Title = dto.title ?? "Untitled",
                    Description = dto.summary,
                    Author = dto.author,
                    Publication = dto.site_name,
                    Link = normalizedUrl,  // Store normalized URL
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
                        ? DateTime.Parse(dto.published_date, null, System.Globalization.DateTimeStyles.RoundtripKind).ToUniversalTime()
                        : null,
                    LastReaderSync = DateTime.UtcNow,
                    DateAdded = DateTime.UtcNow,
                    MediaType = Domain.Entities.MediaType.Article,
                    Status = newStatus,  // Map ReaderLocation to Status
                    SyncStatus = SyncStatus.ReaderSynced  // Mark as synced from Reader
                };

                _context.Add(article);
                result.CreatedCount++;

                _logger.LogDebug("Created article {ArticleId} from Reader document {DocumentId}",
                    article.Id, dto.id);
            }

            await _context.SaveChangesAsync();
        }

    }
}

