using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;

namespace ProjectLoopbreaker.Shared.Interfaces
{
    public interface IOpenLibraryApiClient
    {
        // Search operations
        Task<OpenLibrarySearchResultDto> SearchBooksAsync(string query, int? offset = null, int? limit = null);
        Task<OpenLibrarySearchResultDto> SearchBooksByTitleAsync(string title, int? offset = null, int? limit = null);
        Task<OpenLibrarySearchResultDto> SearchBooksByAuthorAsync(string author, int? offset = null, int? limit = null);
        Task<OpenLibrarySearchResultDto> SearchBooksByISBNAsync(string isbn);
        
        // Detail operations
        Task<OpenLibraryWorkDto> GetBookByOpenLibraryIdAsync(string openLibraryId);
        Task<OpenLibraryBookDto> GetBookByISBNAsync(string isbn);
        Task<OpenLibraryAuthorDto> GetAuthorAsync(string authorId);
        
        // Utility operations
        Task<string> GetSubjectsAsync(); // Returns raw JSON for subjects - can be enhanced later
        string GetCoverImageUrl(int? coverId, string size = "L");
    }
}
