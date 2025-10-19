using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IInstapaperService
    {
        /// <summary>
        /// Authenticates user with Instapaper and returns user information
        /// </summary>
        /// <param name="username">Instapaper username (usually email)</param>
        /// <param name="password">Instapaper password (can be empty if user has no password)</param>
        /// <returns>User information and OAuth tokens</returns>
        Task<(InstapaperUserDto User, string AccessToken, string AccessTokenSecret)> AuthenticateAsync(string username, string password);
        
        /// <summary>
        /// Imports bookmarks from Instapaper and creates Article entities
        /// </summary>
        /// <param name="accessToken">OAuth access token</param>
        /// <param name="accessTokenSecret">OAuth access token secret</param>
        /// <param name="limit">Number of bookmarks to import (1-500)</param>
        /// <param name="folderId">Folder to import from (unread, starred, archive)</param>
        /// <returns>List of created Article entities</returns>
        Task<IEnumerable<Article>> ImportBookmarksAsync(
            string accessToken, 
            string accessTokenSecret, 
            int limit = 25, 
            string folderId = "unread");
        
        /// <summary>
        /// Syncs existing articles with their Instapaper counterparts
        /// </summary>
        /// <param name="accessToken">OAuth access token</param>
        /// <param name="accessTokenSecret">OAuth access token secret</param>
        /// <returns>Number of articles updated</returns>
        Task<int> SyncExistingArticlesAsync(string accessToken, string accessTokenSecret);
        
        /// <summary>
        /// Saves an article URL to Instapaper
        /// </summary>
        /// <param name="accessToken">OAuth access token</param>
        /// <param name="accessTokenSecret">OAuth access token secret</param>
        /// <param name="url">URL to save</param>
        /// <param name="title">Optional title</param>
        /// <param name="selection">Optional text selection</param>
        /// <returns>Created Article entity</returns>
        Task<Article> SaveToInstapaperAsync(
            string accessToken, 
            string accessTokenSecret, 
            string url, 
            string? title = null, 
            string? selection = null);
        
        /// <summary>
        /// Estimates reading time based on word count
        /// </summary>
        /// <param name="wordCount">Number of words in the article</param>
        /// <returns>Estimated reading time in minutes</returns>
        int EstimateReadingTime(int wordCount);
        
        /// <summary>
        /// Extracts article metadata from URL (title, description, etc.)
        /// </summary>
        /// <param name="url">Article URL</param>
        /// <returns>Article metadata</returns>
        Task<(string? Title, string? Description, string? Author, string? Publication, DateTime? PublicationDate)> ExtractArticleMetadataAsync(string url);
    }
}
