using ProjectLoopbreaker.Shared.DTOs.Readwise;

namespace ProjectLoopbreaker.Shared.Interfaces
{
    /// <summary>
    /// Interface for Readwise API client
    /// API Documentation: https://readwise.io/api_deets
    /// </summary>
    public interface IReadwiseApiClient
    {
        /// <summary>
        /// Validates the Readwise API token
        /// GET https://readwise.io/api/v2/auth/
        /// </summary>
        Task<bool> ValidateTokenAsync();
        
        /// <summary>
        /// Retrieves highlights from Readwise API with pagination
        /// GET https://readwise.io/api/v2/highlights/
        /// </summary>
        /// <param name="updatedAfter">ISO 8601 timestamp to get only highlights updated after this date</param>
        /// <param name="page">Page number for pagination</param>
        /// <param name="pageSize">Number of results per page (max 1000)</param>
        Task<ReadwiseHighlightsResponse> GetHighlightsAsync(
            string? updatedAfter = null,
            int page = 1,
            int pageSize = 1000);
        
        /// <summary>
        /// Retrieves books/sources from Readwise API with pagination
        /// GET https://readwise.io/api/v2/books/
        /// </summary>
        /// <param name="updatedAfter">ISO 8601 timestamp</param>
        /// <param name="category">Filter by category: books, articles, tweets, podcasts</param>
        /// <param name="page">Page number</param>
        /// <param name="pageSize">Results per page (max 1000)</param>
        Task<ReadwiseBooksResponse> GetBooksAsync(
            string? updatedAfter = null,
            string? category = null,
            int page = 1,
            int pageSize = 1000);
        
        /// <summary>
        /// Gets details for a specific book/source
        /// GET https://readwise.io/api/v2/books/{id}/
        /// </summary>
        Task<ReadwiseBookDto?> GetBookByIdAsync(int bookId);
        
        /// <summary>
        /// Creates or updates highlights in Readwise
        /// POST https://readwise.io/api/v2/highlights/
        /// </summary>
        Task<bool> CreateHighlightsAsync(List<CreateReadwiseHighlightDto> highlights);
    }
}

