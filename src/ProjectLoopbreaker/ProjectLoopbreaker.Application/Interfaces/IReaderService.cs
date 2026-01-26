using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IReaderService
    {
        /// <summary>
        /// Syncs documents from Readwise Reader
        /// </summary>
        /// <param name="location">Filter by location (archive, new, later, feed)</param>
        /// <param name="updatedAfter">Only sync documents updated after this date (for incremental sync)</param>
        Task<ReaderSyncResultDto> SyncDocumentsAsync(string? location = null, DateTime? updatedAfter = null);
        
        /// <summary>
        /// Fetches and stores full HTML content for an article
        /// </summary>
        Task<bool> FetchAndStoreArticleContentAsync(Guid articleId);
        
        /// <summary>
        /// Bulk fetch content for archived articles missing FullTextContent.
        /// Only fetches Completed (archived) articles for archival purposes.
        /// </summary>
        /// <param name="batchSize">Number of articles to fetch</param>
        /// <param name="updatedAfter">Only fetch articles synced after this date (for 7-day incremental)</param>
        Task<int> BulkFetchArticleContentsAsync(int batchSize = 50, DateTime? updatedAfter = null);
    }
}

