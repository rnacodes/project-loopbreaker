using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Application.Interfaces;
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
            var result = new HighlightSyncResultDto
            {
                StartedAt = DateTime.UtcNow
            };

            try
            {
                _logger.LogInformation("Starting full highlight sync from Readwise");

                var page = 1;
                var hasMore = true;
                var processedHighlights = new List<int>();

                while (hasMore)
                {
                    _logger.LogInformation("Fetching highlights page {Page}", page);

                    var response = await _readwiseClient.GetHighlightsAsync(page: page);
                    
                    if (response.results.Count == 0)
                    {
                        hasMore = false;
                        break;
                    }

                    foreach (var highlightDto in response.results)
                    {
                        await ProcessHighlightDto(highlightDto, result);
                        processedHighlights.Add(highlightDto.id);
                    }

                    hasMore = !string.IsNullOrEmpty(response.next);
                    page++;

                    // Safety check to prevent infinite loops
                    if (page > 1000)
                    {
                        _logger.LogWarning("Stopped sync after 1000 pages");
                        break;
                    }

                    // Small delay to respect rate limits
                    await Task.Delay(250);
                }

                result.CompletedAt = DateTime.UtcNow;
                result.Success = true;

                _logger.LogInformation("Completed highlight sync. Created: {Created}, Updated: {Updated}, Total: {Total}",
                    result.CreatedCount, result.UpdatedCount, result.TotalProcessed);
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

        public async Task<HighlightSyncResultDto> SyncHighlightsIncrementalAsync(DateTime lastSyncDate)
        {
            var result = new HighlightSyncResultDto
            {
                StartedAt = DateTime.UtcNow
            };

            try
            {
                var updatedAfter = lastSyncDate.ToString("yyyy-MM-ddTHH:mm:ssZ");
                _logger.LogInformation("Starting incremental highlight sync from Readwise (after {Date})", updatedAfter);

                var page = 1;
                var hasMore = true;

                while (hasMore)
                {
                    var response = await _readwiseClient.GetHighlightsAsync(
                        updatedAfter: updatedAfter,
                        page: page);
                    
                    if (response.results.Count == 0)
                    {
                        hasMore = false;
                        break;
                    }

                    foreach (var highlightDto in response.results)
                    {
                        await ProcessHighlightDto(highlightDto, result);
                    }

                    hasMore = !string.IsNullOrEmpty(response.next);
                    page++;

                    // Small delay to respect rate limits
                    await Task.Delay(250);
                }

                result.CompletedAt = DateTime.UtcNow;
                result.Success = true;

                _logger.LogInformation("Completed incremental sync. Created: {Created}, Updated: {Updated}",
                    result.CreatedCount, result.UpdatedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in incremental highlight sync");
                result.Success = false;
                result.ErrorMessage = ex.Message;
                result.CompletedAt = DateTime.UtcNow;
            }

            return result;
        }

        private async Task ProcessHighlightDto(
            ProjectLoopbreaker.Shared.DTOs.Readwise.ReadwiseHighlightDto dto,
            HighlightSyncResultDto result)
        {
            // Check if highlight already exists by ReadwiseId
            var existing = await _context.Highlights
                .FirstOrDefaultAsync(h => h.ReadwiseId == dto.id);

            if (existing != null)
            {
                // Update existing highlight
                existing.Text = dto.text;
                existing.Note = dto.note;
                existing.Location = dto.location;
                existing.LocationType = dto.location_type;
                existing.Color = dto.color;
                existing.IsFavorite = dto.is_favorite;
                existing.Tags = dto.tags != null ? string.Join(",", dto.tags.Select(t => t.ToLowerInvariant())) : null;
                existing.UpdatedAt = DateTime.UtcNow;
                
                result.UpdatedCount++;
            }
            else
            {
                // Fetch book details to get title, author, etc.
                var book = await _readwiseClient.GetBookByIdAsync(dto.book_id);
                
                var highlight = new Highlight
                {
                    Id = Guid.NewGuid(),
                    ReadwiseId = dto.id,
                    Text = dto.text,
                    Note = dto.note,
                    Title = book?.title,
                    Author = book?.author,
                    Category = book?.category?.ToLowerInvariant(),
                    SourceUrl = book?.source_url,
                    ImageUrl = book?.cover_image_url,
                    HighlightUrl = dto.url,
                    Location = dto.location,
                    LocationType = dto.location_type,
                    HighlightedAt = !string.IsNullOrEmpty(dto.highlighted_at) 
                        ? DateTime.Parse(dto.highlighted_at) 
                        : null,
                    ReadwiseBookId = dto.book_id,
                    Tags = dto.tags != null ? string.Join(",", dto.tags.Select(t => t.ToLowerInvariant())) : null,
                    Color = dto.color,
                    IsFavorite = dto.is_favorite,
                    SourceType = book?.source,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Add(highlight);
                result.CreatedCount++;
            }

            await _context.SaveChangesAsync();
        }
    }
}

