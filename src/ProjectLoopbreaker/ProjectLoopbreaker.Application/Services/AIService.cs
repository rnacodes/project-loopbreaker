using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pgvector;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    /// <summary>
    /// Service for AI-powered operations including note description generation
    /// and embedding generation for semantic search and recommendations.
    /// </summary>
    public class AIService : IAIService
    {
        private readonly IApplicationDbContext _context;
        private readonly IGradientAIClient _gradientClient;
        private readonly ITypeSenseService _typeSenseService;
        private readonly ILogger<AIService> _logger;

        // Prompt templates
        private const string NoteDescriptionSystemPrompt = @"You are a helpful assistant that creates concise, informative descriptions for notes in a personal knowledge management system.
Your descriptions should:
- Be 2-3 sentences long
- Capture the main topic and purpose of the note
- Be written in third person
- Focus on what the note is about, not how it's written
- Avoid phrases like 'This note discusses...' - just describe the content directly";

        private const string NoteDescriptionUserPromptTemplate = @"Generate a description for this note:

Title: {0}
Tags: {1}
Content (excerpt):
{2}";

        public AIService(
            IApplicationDbContext context,
            IGradientAIClient gradientClient,
            ITypeSenseService typeSenseService,
            ILogger<AIService> logger)
        {
            _context = context;
            _gradientClient = gradientClient;
            _typeSenseService = typeSenseService;
            _logger = logger;
        }

        #region Note Description Generation

        public async Task<string?> GenerateNoteDescriptionAsync(Guid noteId, CancellationToken cancellationToken = default)
        {
            try
            {
                var note = await _context.Notes
                    .FirstOrDefaultAsync(n => n.Id == noteId, cancellationToken);

                if (note == null)
                {
                    _logger.LogWarning("Note {NoteId} not found for description generation", noteId);
                    return null;
                }

                if (string.IsNullOrWhiteSpace(note.Content))
                {
                    _logger.LogWarning("Note {NoteId} has no content for description generation", noteId);
                    return null;
                }

                // Prepare the prompt
                var contentExcerpt = TruncateContent(note.Content, 2000);
                var tagsString = note.Tags?.Count > 0 ? string.Join(", ", note.Tags) : "none";
                var userPrompt = string.Format(NoteDescriptionUserPromptTemplate, note.Title, tagsString, contentExcerpt);

                // Generate description
                var description = await _gradientClient.GenerateTextAsync(
                    userPrompt,
                    NoteDescriptionSystemPrompt,
                    maxTokens: 200,
                    cancellationToken);

                if (string.IsNullOrWhiteSpace(description))
                {
                    _logger.LogWarning("Empty description generated for note {NoteId}", noteId);
                    return null;
                }

                // Update the note
                note.AiDescription = description;
                note.AiDescriptionGeneratedAt = DateTime.UtcNow;

                // If there's no manual description, also update the main Description field
                if (!note.IsDescriptionManual && string.IsNullOrWhiteSpace(note.Description))
                {
                    note.Description = description;
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Re-index in Typesense
                try
                {
                    // Get linked media count for Typesense indexing
                    var linkedMediaCount = await _context.MediaItemNotes
                        .CountAsync(min => min.NoteId == note.Id, cancellationToken);

                    await _typeSenseService.IndexNoteAsync(
                        note.Id,
                        note.Slug,
                        note.Title,
                        note.Content,
                        note.AiDescription ?? note.Description,
                        note.VaultName,
                        note.SourceUrl,
                        note.Tags ?? new List<string>(),
                        note.DateImported,
                        note.NoteDate,
                        linkedMediaCount);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to re-index note {NoteId} in Typesense after description generation", noteId);
                }

                _logger.LogInformation("Generated AI description for note {NoteId} ({Title})", noteId, note.Title);
                return description;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating description for note {NoteId}", noteId);
                throw;
            }
        }

        public async Task<AIBatchResultDto> GenerateNoteDescriptionsBatchAsync(int batchSize = 20, CancellationToken cancellationToken = default)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new AIBatchResultDto();

            try
            {
                // Get notes that need descriptions
                var notes = await _context.Notes
                    .Where(n => n.AiDescription == null
                             && n.Content != null
                             && !n.IsDescriptionManual)
                    .OrderBy(n => n.DateImported)
                    .Take(batchSize)
                    .ToListAsync(cancellationToken);

                result.TotalProcessed = notes.Count;

                if (notes.Count == 0)
                {
                    _logger.LogInformation("No notes need description generation");
                    stopwatch.Stop();
                    result.DurationMs = stopwatch.ElapsedMilliseconds;
                    return result;
                }

                _logger.LogInformation("Starting batch description generation for {Count} notes", notes.Count);

                foreach (var note in notes)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        _logger.LogWarning("Batch description generation cancelled");
                        break;
                    }

                    try
                    {
                        var description = await GenerateNoteDescriptionAsync(note.Id, cancellationToken);
                        if (!string.IsNullOrWhiteSpace(description))
                        {
                            result.SuccessCount++;
                        }
                        else
                        {
                            result.SkippedCount++;
                        }

                        // Add delay to avoid rate limiting
                        await Task.Delay(1000, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        result.FailedCount++;
                        result.Errors.Add($"Note {note.Id} ({note.Title}): {ex.Message}");
                        _logger.LogWarning(ex, "Failed to generate description for note {NoteId}", note.Id);
                    }
                }

                stopwatch.Stop();
                result.DurationMs = stopwatch.ElapsedMilliseconds;

                _logger.LogInformation("Batch description generation completed: {Success} succeeded, {Failed} failed, {Skipped} skipped in {Duration}ms",
                    result.SuccessCount, result.FailedCount, result.SkippedCount, result.DurationMs);

                return result;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                result.DurationMs = stopwatch.ElapsedMilliseconds;
                _logger.LogError(ex, "Error in batch description generation");
                throw;
            }
        }

        public async Task<int> GetNotesNeedingDescriptionCountAsync()
        {
            return await _context.Notes
                .CountAsync(n => n.AiDescription == null
                              && n.Content != null
                              && !n.IsDescriptionManual);
        }

        #endregion

        #region Embedding Generation

        public async Task<bool> GenerateMediaItemEmbeddingAsync(Guid mediaItemId, CancellationToken cancellationToken = default)
        {
            try
            {
                var mediaItem = await _context.MediaItems
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .FirstOrDefaultAsync(m => m.Id == mediaItemId, cancellationToken);

                if (mediaItem == null)
                {
                    _logger.LogWarning("Media item {MediaItemId} not found for embedding generation", mediaItemId);
                    return false;
                }

                // Compose text for embedding
                var embeddingText = ComposeMediaItemEmbeddingText(mediaItem);

                if (string.IsNullOrWhiteSpace(embeddingText))
                {
                    _logger.LogWarning("Empty embedding text for media item {MediaItemId}", mediaItemId);
                    return false;
                }

                // Generate embedding
                var embeddingArray = await _gradientClient.GenerateEmbeddingAsync(embeddingText, cancellationToken);

                // Update the media item (convert float[] to Vector)
                mediaItem.Embedding = new Vector(embeddingArray);
                mediaItem.EmbeddingGeneratedAt = DateTime.UtcNow;
                mediaItem.EmbeddingModel = _gradientClient.EmbeddingModelName;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Generated embedding for media item {MediaItemId} ({Title})", mediaItemId, mediaItem.Title);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating embedding for media item {MediaItemId}", mediaItemId);
                throw;
            }
        }

        public async Task<bool> GenerateNoteEmbeddingAsync(Guid noteId, CancellationToken cancellationToken = default)
        {
            try
            {
                var note = await _context.Notes
                    .FirstOrDefaultAsync(n => n.Id == noteId, cancellationToken);

                if (note == null)
                {
                    _logger.LogWarning("Note {NoteId} not found for embedding generation", noteId);
                    return false;
                }

                // Compose text for embedding
                var embeddingText = ComposeNoteEmbeddingText(note);

                if (string.IsNullOrWhiteSpace(embeddingText))
                {
                    _logger.LogWarning("Empty embedding text for note {NoteId}", noteId);
                    return false;
                }

                // Generate embedding
                var embeddingArray = await _gradientClient.GenerateEmbeddingAsync(embeddingText, cancellationToken);

                // Update the note (convert float[] to Vector)
                note.Embedding = new Vector(embeddingArray);
                note.EmbeddingGeneratedAt = DateTime.UtcNow;
                note.EmbeddingModel = _gradientClient.EmbeddingModelName;

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Generated embedding for note {NoteId} ({Title})", noteId, note.Title);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating embedding for note {NoteId}", noteId);
                throw;
            }
        }

        public async Task<AIBatchResultDto> GenerateMediaItemEmbeddingsBatchAsync(int batchSize = 50, CancellationToken cancellationToken = default)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new AIBatchResultDto();

            try
            {
                // Get media items that need embeddings
                var mediaItems = await _context.MediaItems
                    .Where(m => m.Embedding == null)
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .OrderBy(m => m.DateAdded)
                    .Take(batchSize)
                    .ToListAsync(cancellationToken);

                result.TotalProcessed = mediaItems.Count;

                if (mediaItems.Count == 0)
                {
                    _logger.LogInformation("No media items need embedding generation");
                    stopwatch.Stop();
                    result.DurationMs = stopwatch.ElapsedMilliseconds;
                    return result;
                }

                _logger.LogInformation("Starting batch embedding generation for {Count} media items", mediaItems.Count);

                foreach (var mediaItem in mediaItems)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        _logger.LogWarning("Batch embedding generation cancelled");
                        break;
                    }

                    try
                    {
                        var success = await GenerateMediaItemEmbeddingAsync(mediaItem.Id, cancellationToken);
                        if (success)
                        {
                            result.SuccessCount++;
                        }
                        else
                        {
                            result.SkippedCount++;
                        }

                        // Add delay to avoid rate limiting
                        await Task.Delay(200, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        result.FailedCount++;
                        result.Errors.Add($"Media item {mediaItem.Id} ({mediaItem.Title}): {ex.Message}");
                        _logger.LogWarning(ex, "Failed to generate embedding for media item {MediaItemId}", mediaItem.Id);
                    }
                }

                stopwatch.Stop();
                result.DurationMs = stopwatch.ElapsedMilliseconds;

                _logger.LogInformation("Batch media item embedding generation completed: {Success} succeeded, {Failed} failed, {Skipped} skipped in {Duration}ms",
                    result.SuccessCount, result.FailedCount, result.SkippedCount, result.DurationMs);

                return result;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                result.DurationMs = stopwatch.ElapsedMilliseconds;
                _logger.LogError(ex, "Error in batch media item embedding generation");
                throw;
            }
        }

        public async Task<AIBatchResultDto> GenerateNoteEmbeddingsBatchAsync(int batchSize = 50, CancellationToken cancellationToken = default)
        {
            var stopwatch = Stopwatch.StartNew();
            var result = new AIBatchResultDto();

            try
            {
                // Get notes that need embeddings
                var notes = await _context.Notes
                    .Where(n => n.Embedding == null)
                    .OrderBy(n => n.DateImported)
                    .Take(batchSize)
                    .ToListAsync(cancellationToken);

                result.TotalProcessed = notes.Count;

                if (notes.Count == 0)
                {
                    _logger.LogInformation("No notes need embedding generation");
                    stopwatch.Stop();
                    result.DurationMs = stopwatch.ElapsedMilliseconds;
                    return result;
                }

                _logger.LogInformation("Starting batch embedding generation for {Count} notes", notes.Count);

                foreach (var note in notes)
                {
                    if (cancellationToken.IsCancellationRequested)
                    {
                        _logger.LogWarning("Batch note embedding generation cancelled");
                        break;
                    }

                    try
                    {
                        var success = await GenerateNoteEmbeddingAsync(note.Id, cancellationToken);
                        if (success)
                        {
                            result.SuccessCount++;
                        }
                        else
                        {
                            result.SkippedCount++;
                        }

                        // Add delay to avoid rate limiting
                        await Task.Delay(200, cancellationToken);
                    }
                    catch (Exception ex)
                    {
                        result.FailedCount++;
                        result.Errors.Add($"Note {note.Id} ({note.Title}): {ex.Message}");
                        _logger.LogWarning(ex, "Failed to generate embedding for note {NoteId}", note.Id);
                    }
                }

                stopwatch.Stop();
                result.DurationMs = stopwatch.ElapsedMilliseconds;

                _logger.LogInformation("Batch note embedding generation completed: {Success} succeeded, {Failed} failed, {Skipped} skipped in {Duration}ms",
                    result.SuccessCount, result.FailedCount, result.SkippedCount, result.DurationMs);

                return result;
            }
            catch (Exception ex)
            {
                stopwatch.Stop();
                result.DurationMs = stopwatch.ElapsedMilliseconds;
                _logger.LogError(ex, "Error in batch note embedding generation");
                throw;
            }
        }

        public async Task<int> GetMediaItemsNeedingEmbeddingCountAsync()
        {
            return await _context.MediaItems
                .CountAsync(m => m.Embedding == null);
        }

        public async Task<int> GetNotesNeedingEmbeddingCountAsync()
        {
            return await _context.Notes
                .CountAsync(n => n.Embedding == null);
        }

        #endregion

        #region Status

        public async Task<AIStatusDto> GetStatusAsync()
        {
            var isAvailable = await IsAvailableAsync();

            return new AIStatusDto
            {
                IsAvailable = isAvailable,
                EmbeddingModel = _gradientClient.EmbeddingModelName,
                GenerationModel = _gradientClient.GenerationModelName,
                PendingNoteDescriptions = await GetNotesNeedingDescriptionCountAsync(),
                PendingMediaEmbeddings = await GetMediaItemsNeedingEmbeddingCountAsync(),
                PendingNoteEmbeddings = await GetNotesNeedingEmbeddingCountAsync(),
                StatusMessage = isAvailable ? "AI services are available and ready" : "AI services are not configured or unavailable"
            };
        }

        public async Task<bool> IsAvailableAsync()
        {
            return await _gradientClient.IsAvailableAsync();
        }

        #endregion

        #region Helper Methods

        private string ComposeMediaItemEmbeddingText(BaseMediaItem mediaItem)
        {
            var parts = new List<string>();

            // Title is essential
            if (!string.IsNullOrWhiteSpace(mediaItem.Title))
            {
                parts.Add(mediaItem.Title);
            }

            // Description
            if (!string.IsNullOrWhiteSpace(mediaItem.Description))
            {
                parts.Add(mediaItem.Description);
            }

            // Topics
            if (mediaItem.Topics?.Count > 0)
            {
                parts.Add($"Topics: {string.Join(", ", mediaItem.Topics.Select(t => t.Name))}");
            }

            // Genres
            if (mediaItem.Genres?.Count > 0)
            {
                parts.Add($"Genres: {string.Join(", ", mediaItem.Genres.Select(g => g.Name))}");
            }

            // Media type
            parts.Add($"Type: {mediaItem.MediaType}");

            // Type-specific fields (would need to cast to specific types)
            // This is a simplified version - can be extended based on media type

            return string.Join("\n", parts);
        }

        private string ComposeNoteEmbeddingText(Note note)
        {
            var parts = new List<string>();

            // Title
            if (!string.IsNullOrWhiteSpace(note.Title))
            {
                parts.Add(note.Title);
            }

            // Description (prefer AI description if available)
            if (!string.IsNullOrWhiteSpace(note.AiDescription))
            {
                parts.Add(note.AiDescription);
            }
            else if (!string.IsNullOrWhiteSpace(note.Description))
            {
                parts.Add(note.Description);
            }

            // Tags
            if (note.Tags?.Count > 0)
            {
                parts.Add($"Tags: {string.Join(", ", note.Tags)}");
            }

            // Content (truncated)
            if (!string.IsNullOrWhiteSpace(note.Content))
            {
                parts.Add(TruncateContent(note.Content, 4000));
            }

            return string.Join("\n", parts);
        }

        private static string TruncateContent(string content, int maxLength)
        {
            if (string.IsNullOrWhiteSpace(content))
                return string.Empty;

            // Remove excessive whitespace
            content = System.Text.RegularExpressions.Regex.Replace(content, @"\s+", " ").Trim();

            if (content.Length <= maxLength)
                return content;

            // Try to truncate at a word boundary
            var truncated = content.Substring(0, maxLength);
            var lastSpace = truncated.LastIndexOf(' ');

            if (lastSpace > maxLength * 0.8) // Don't go back too far
            {
                truncated = truncated.Substring(0, lastSpace);
            }

            return truncated + "...";
        }

        #endregion
    }
}
