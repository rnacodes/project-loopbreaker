using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IReaderService
    {
        /// <summary>
        /// Syncs documents from Readwise Reader
        /// </summary>
        Task<ReaderSyncResultDto> SyncDocumentsAsync(string? location = null);
        
        /// <summary>
        /// Fetches and stores full HTML content for an article
        /// </summary>
        Task<bool> FetchAndStoreArticleContentAsync(Guid articleId);
        
        /// <summary>
        /// Bulk fetch content for articles missing ContentStoragePath
        /// </summary>
        Task<int> BulkFetchArticleContentsAsync(int batchSize = 50);
    }
}

