using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IHighlightService
    {
        Task<IEnumerable<Highlight>> GetAllHighlightsAsync();
        Task<Highlight?> GetHighlightByIdAsync(Guid id);
        Task<IEnumerable<Highlight>> GetHighlightsByArticleIdAsync(Guid articleId);
        Task<IEnumerable<Highlight>> GetHighlightsByBookIdAsync(Guid bookId);
        Task<IEnumerable<Highlight>> GetHighlightsByTagAsync(string tag);
        Task<Highlight> CreateHighlightAsync(CreateHighlightDto dto);
        Task<Highlight> UpdateHighlightAsync(Guid id, CreateHighlightDto dto);
        Task<bool> DeleteHighlightAsync(Guid id);
        
        /// <summary>
        /// Syncs all highlights from Readwise API
        /// </summary>
        Task<HighlightSyncResultDto> SyncHighlightsFromReadwiseAsync();
        
        /// <summary>
        /// Syncs only highlights updated after a specific date
        /// </summary>
        Task<HighlightSyncResultDto> SyncHighlightsIncrementalAsync(DateTime lastSyncDate);
    }
}

