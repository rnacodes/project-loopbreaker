using ProjectLoopbreaker.Shared.DTOs.Instapaper;

namespace ProjectLoopbreaker.Shared.Interfaces
{
    /// <summary>
    /// Interface for Instapaper API client.
    /// Provides methods for interacting with the Instapaper API for article synchronization.
    /// </summary>
    public interface IInstapaperApiClient
    {
        /// <summary>
        /// Exchanges user credentials for OAuth access token using xAuth
        /// </summary>
        /// <param name="username">Instapaper username (usually email)</param>
        /// <param name="password">Instapaper password (can be empty if user has no password)</param>
        /// <returns>Tuple containing access token and token secret</returns>
        Task<(string AccessToken, string AccessTokenSecret)> GetAccessTokenAsync(string username, string password);
        
        /// <summary>
        /// Verifies the OAuth credentials and returns user information
        /// </summary>
        /// <param name="accessToken">OAuth access token</param>
        /// <param name="accessTokenSecret">OAuth access token secret</param>
        /// <returns>User information</returns>
        Task<InstapaperUserDto> VerifyCredentialsAsync(string accessToken, string accessTokenSecret);
        
        /// <summary>
        /// Lists user's bookmarks from Instapaper
        /// </summary>
        /// <param name="accessToken">OAuth access token</param>
        /// <param name="accessTokenSecret">OAuth access token secret</param>
        /// <param name="limit">Number of bookmarks to retrieve (1-500, default 25)</param>
        /// <param name="folderId">Folder ID (unread, starred, archive, or folder ID)</param>
        /// <returns>List of bookmarks with user and highlight information</returns>
        Task<InstapaperBookmarksResponse> GetBookmarksAsync(
            string accessToken, 
            string accessTokenSecret, 
            int limit = 25, 
            string folderId = "unread");
        
        /// <summary>
        /// Adds a new bookmark to Instapaper (for saving articles TO Instapaper)
        /// </summary>
        /// <param name="accessToken">OAuth access token</param>
        /// <param name="accessTokenSecret">OAuth access token secret</param>
        /// <param name="url">URL to bookmark</param>
        /// <param name="title">Optional title for the bookmark</param>
        /// <param name="selection">Optional text selection from the page</param>
        /// <returns>The created bookmark</returns>
        Task<InstapaperBookmarkDto> AddBookmarkAsync(
            string accessToken, 
            string accessTokenSecret, 
            string url, 
            string? title = null, 
            string? selection = null);

        /// <summary>
        /// Gets the full text content of a bookmark from Instapaper.
        /// Returns parsed HTML content of the article.
        /// </summary>
        /// <param name="bookmarkId">The Instapaper bookmark ID</param>
        /// <returns>Full parsed HTML content of the article</returns>
        Task<InstapaperBookmarkTextResponseDto> GetBookmarkTextAsync(string bookmarkId);
    }
}

