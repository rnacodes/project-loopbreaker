using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Utilities;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class HighlightService : IHighlightService
    {
        private readonly IApplicationDbContext _context;
        private readonly IReadwiseApiClient _readwiseClient;
        private readonly ILogger<HighlightService> _logger;

        public HighlightService(
            IApplicationDbContext context,
            IReadwiseApiClient readwiseClient,
            ILogger<HighlightService> logger)
        {
            _context = context;
            _readwiseClient = readwiseClient;
            _logger = logger;
        }

        public async Task<IEnumerable<Highlight>> GetAllHighlightsAsync()
        {
            return await _context.Highlights
                .AsNoTracking()
                .AsSplitQuery()
                .Include(h => h.Article)
                .Include(h => h.Book)
                .OrderByDescending(h => h.HighlightedAt ?? h.CreatedAt)
                .ToListAsync();
        }

        public async Task<Highlight?> GetHighlightByIdAsync(Guid id)
        {
            return await _context.Highlights
                .AsNoTracking()
                .AsSplitQuery()
                .Include(h => h.Article)
                .Include(h => h.Book)
                .FirstOrDefaultAsync(h => h.Id == id);
        }

        public async Task<IEnumerable<Highlight>> GetHighlightsByArticleIdAsync(Guid articleId)
        {
            return await _context.Highlights
                .AsNoTracking()
                .Where(h => h.ArticleId == articleId)
                .OrderBy(h => h.Location ?? 0)
                .ToListAsync();
        }

        public async Task<IEnumerable<Highlight>> GetHighlightsByBookIdAsync(Guid bookId)
        {
            return await _context.Highlights
                .AsNoTracking()
                .Where(h => h.BookId == bookId)
                .OrderBy(h => h.Location ?? 0)
                .ToListAsync();
        }

        public async Task<IEnumerable<Highlight>> GetHighlightsByTagAsync(string tag)
        {
            var normalizedTag = tag.ToLowerInvariant();
            return await _context.Highlights
                .AsNoTracking()
                .Where(h => h.Tags != null && h.Tags.Contains(normalizedTag))
                .OrderByDescending(h => h.HighlightedAt ?? h.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Highlight>> GetUnlinkedHighlightsAsync()
        {
            return await _context.Highlights
                .AsNoTracking()
                .Where(h => h.ArticleId == null && h.BookId == null)
                .OrderByDescending(h => h.HighlightedAt ?? h.CreatedAt)
                .ToListAsync();
        }

        public async Task<Highlight> CreateHighlightAsync(CreateHighlightDto dto)
        {
            var highlight = new Highlight
            {
                Id = Guid.NewGuid(),
                Text = dto.Text,
                Note = dto.Note,
                Title = dto.Title,
                Author = dto.Author,
                Category = dto.Category?.ToLowerInvariant(),
                SourceUrl = dto.SourceUrl,
                ArticleId = dto.ArticleId,
                BookId = dto.BookId,
                Tags = dto.Tags != null ? string.Join(",", dto.Tags.Select(t => t.ToLowerInvariant())) : null,
                Location = dto.Location,
                LocationType = dto.LocationType,
                HighlightedAt = dto.HighlightedAt,
                CreatedAt = DateTime.UtcNow
            };

            _context.Add(highlight);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Created highlight {HighlightId}", highlight.Id);

            return highlight;
        }

        public async Task<Highlight> UpdateHighlightAsync(Guid id, CreateHighlightDto dto)
        {
            var highlight = await _context.Highlights
                .FirstOrDefaultAsync(h => h.Id == id);
            if (highlight == null)
            {
                throw new InvalidOperationException($"Highlight with ID {id} not found");
            }

            highlight.Text = dto.Text;
            highlight.Note = dto.Note;
            highlight.Tags = dto.Tags != null ? string.Join(",", dto.Tags.Select(t => t.ToLowerInvariant())) : null;
            highlight.ArticleId = dto.ArticleId;
            highlight.BookId = dto.BookId;
            highlight.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Updated highlight {HighlightId}", highlight.Id);

            return highlight;
        }

        public async Task<bool> DeleteHighlightAsync(Guid id)
        {
            var highlight = await _context.Highlights
                .FirstOrDefaultAsync(h => h.Id == id);
            if (highlight == null)
            {
                return false;
            }

            _context.Remove(highlight);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Deleted highlight {HighlightId}", id);

            return true;
        }

        public async Task<HighlightSyncResultDto> SyncHighlightsFromReadwiseAsync()
        {
            return await SyncHighlightsUsingExportAsync(null);
        }

        public async Task<HighlightSyncResultDto> SyncHighlightsIncrementalAsync(DateTime lastSyncDate)
        {
            var updatedAfter = lastSyncDate.ToString("yyyy-MM-ddTHH:mm:ssZ");
            return await SyncHighlightsUsingExportAsync(updatedAfter);
        }

        /// <summary>
        /// Uses the /export/ endpoint which returns books with nested highlights.
        /// This is more efficient than fetching highlights and books separately.
        /// Also auto-links highlights to articles during import.
        /// </summary>
        private async Task<HighlightSyncResultDto> SyncHighlightsUsingExportAsync(string? updatedAfter)
        {
            var result = new HighlightSyncResultDto
            {
                StartedAt = DateTime.UtcNow
            };

            try
            {
                _logger.LogInformation("Starting highlight sync from Readwise using export endpoint (updatedAfter: {UpdatedAfter})",
                    updatedAfter ?? "full sync");

                string? pageCursor = null;
                var hasMore = true;
                var iteration = 0;

                while (hasMore && iteration < 100) // Safety limit
                {
                    _logger.LogInformation("Fetching export page {Iteration}", iteration + 1);

                    var response = await _readwiseClient.GetExportAsync(
                        updatedAfter: updatedAfter,
                        pageCursor: pageCursor);

                    if (response.results.Count == 0)
                    {
                        break;
                    }

                    // Process each book with its nested highlights
                    foreach (var bookDto in response.results)
                    {
                        await ProcessExportBookWithHighlightsAsync(bookDto, result);
                    }

                    hasMore = !string.IsNullOrEmpty(response.nextPageCursor);
                    pageCursor = response.nextPageCursor;
                    iteration++;

                    // Small delay to respect rate limits (20 req/min for list endpoints)
                    await Task.Delay(3000);
                }

                result.CompletedAt = DateTime.UtcNow;
                result.Success = true;

                _logger.LogInformation("Completed highlight sync. Created: {Created}, Updated: {Updated}, Linked: {Linked}",
                    result.CreatedCount, result.UpdatedCount, result.LinkedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing highlights from Readwise");
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.CompletedAt = DateTime.UtcNow;
            }

            return result;
        }

        /// <summary>
        /// Process a book with nested highlights from the export endpoint.
        /// Book data is already included, no separate API call needed.
        /// </summary>
        private async Task ProcessExportBookWithHighlightsAsync(
            Shared.DTOs.Readwise.ReadwiseExportBookDto bookDto,
            HighlightSyncResultDto result)
        {
            foreach (var highlightDto in bookDto.highlights)
            {
                // Check if highlight already exists by ReadwiseId
                var existing = await _context.Highlights
                    .FirstOrDefaultAsync(h => h.ReadwiseId == highlightDto.id);

                if (existing != null)
                {
                    // Update existing highlight
                    existing.Text = highlightDto.text;
                    existing.Note = highlightDto.note;
                    existing.Location = highlightDto.location;
                    existing.LocationType = highlightDto.location_type;
                    existing.Color = highlightDto.color;
                    existing.IsFavorite = highlightDto.is_favorite;
                    existing.Tags = highlightDto.tags != null
                        ? string.Join(",", highlightDto.tags.Select(t => t.name.ToLowerInvariant()))
                        : null;
                    existing.UpdatedAt = DateTime.UtcNow;

                    result.UpdatedCount++;
                }
                else
                {
                    // Create new highlight with book data already available (no extra API call)
                    var highlight = new Highlight
                    {
                        Id = Guid.NewGuid(),
                        ReadwiseId = highlightDto.id,
                        Text = highlightDto.text,
                        Note = highlightDto.note,
                        Title = bookDto.title,
                        Author = bookDto.author,
                        Category = bookDto.category?.ToLowerInvariant(),
                        SourceUrl = bookDto.source_url,
                        ImageUrl = bookDto.cover_image_url,
                        HighlightUrl = highlightDto.url,
                        Location = highlightDto.location,
                        LocationType = highlightDto.location_type,
                        HighlightedAt = !string.IsNullOrEmpty(highlightDto.highlighted_at)
                            ? DateTime.Parse(highlightDto.highlighted_at, null, System.Globalization.DateTimeStyles.RoundtripKind).ToUniversalTime()
                            : null,
                        ReadwiseBookId = bookDto.user_book_id,
                        Tags = highlightDto.tags != null
                            ? string.Join(",", highlightDto.tags.Select(t => t.name.ToLowerInvariant()))
                            : null,
                        Color = highlightDto.color,
                        IsFavorite = highlightDto.is_favorite,
                        SourceType = bookDto.source,
                        CreatedAt = DateTime.UtcNow
                    };

                    // Auto-link to article by source URL (using normalized URL matching)
                    if (!string.IsNullOrEmpty(bookDto.source_url))
                    {
                        var normalizedSourceUrl = UrlNormalizer.Normalize(bookDto.source_url);
                        var article = await _context.Articles
                            .FirstOrDefaultAsync(a =>
                                a.Link != null &&
                                EF.Functions.ILike(a.Link, normalizedSourceUrl));
                        if (article != null)
                        {
                            highlight.ArticleId = article.Id;
                            result.LinkedCount++;
                            _logger.LogDebug("Auto-linked highlight {HighlightId} to article {ArticleId}",
                                highlight.Id, article.Id);
                        }
                    }

                    // Auto-link to book by title and author if category is "books"
                    if (highlight.ArticleId == null &&
                        bookDto.category?.ToLowerInvariant() == "books" &&
                        !string.IsNullOrEmpty(bookDto.title) &&
                        !string.IsNullOrEmpty(bookDto.author))
                    {
                        var book = await _context.Books
                            .FirstOrDefaultAsync(b =>
                                b.Title.ToLower() == bookDto.title.ToLower() &&
                                b.Author != null && b.Author.ToLower() == bookDto.author.ToLower());
                        if (book != null)
                        {
                            highlight.BookId = book.Id;
                            result.LinkedCount++;
                            _logger.LogDebug("Auto-linked highlight {HighlightId} to book {BookId}",
                                highlight.Id, book.Id);
                        }
                    }

                    _context.Add(highlight);
                    result.CreatedCount++;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}

