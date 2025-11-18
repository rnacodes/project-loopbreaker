using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Shared.Interfaces;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace ProjectLoopbreaker.Application.Services
{
    public class InstapaperService : IInstapaperService
    {
        private readonly IInstapaperApiClient _apiClient;
        private readonly IApplicationDbContext _context;
        private readonly IArticleMappingService _mappingService;
        private readonly ILogger<InstapaperService> _logger;
        
        public InstapaperService(
            IInstapaperApiClient apiClient,
            IApplicationDbContext context,
            IArticleMappingService mappingService,
            ILogger<InstapaperService> logger)
        {
            _apiClient = apiClient;
            _context = context;
            _mappingService = mappingService;
            _logger = logger;
        }
        
        public async Task<(InstapaperUserDto User, string AccessToken, string AccessTokenSecret)> AuthenticateAsync(string username, string password)
        {
            try
            {
                _logger.LogInformation("Authenticating user with Instapaper: {Username}", username);
                
                var (accessToken, accessTokenSecret) = await _apiClient.GetAccessTokenAsync(username, password);
                var user = await _apiClient.VerifyCredentialsAsync(accessToken, accessTokenSecret);
                
                _logger.LogInformation("Successfully authenticated Instapaper user: {Username} (ID: {UserId})", user.Username, user.UserId);
                
                return (user, accessToken, accessTokenSecret);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to authenticate Instapaper user: {Username}", username);
                throw;
            }
        }
        
        public async Task<IEnumerable<Article>> ImportBookmarksAsync(
            string accessToken, 
            string accessTokenSecret, 
            int limit = 25, 
            string folderId = "unread")
        {
            try
            {
                _logger.LogInformation("Importing {Limit} bookmarks from Instapaper folder: {FolderId}", limit, folderId);
                
                var bookmarksResponse = await _apiClient.GetBookmarksAsync(accessToken, accessTokenSecret, limit, folderId);
                var importedArticles = new List<Article>();
                
                foreach (var bookmark in bookmarksResponse.Bookmarks)
                {
                    // Check if this bookmark already exists
                    var existingArticle = await _context.MediaItems
                        .OfType<Article>()
                        .FirstOrDefaultAsync(a => a.InstapaperBookmarkId == bookmark.BookmarkId.ToString());
                    
                    if (existingArticle != null)
                    {
                        _logger.LogDebug("Article already exists, updating: {Title}", bookmark.Title);
                        _mappingService.UpdateArticleFromInstapaper(existingArticle, bookmark);
                        importedArticles.Add(existingArticle);
                    }
                    else
                    {
                        _logger.LogDebug("Creating new article from bookmark: {Title}", bookmark.Title);
                        var newArticle = _mappingService.MapInstapaperBookmarkToArticle(bookmark);
                        
                        // Set archived status based on folder
                        newArticle.IsArchived = folderId == "archive";
                        
                        // Try to extract additional metadata
                        try
                        {
                            var (title, description, author, publication, pubDate) = await ExtractArticleMetadataAsync(bookmark.Url);
                            
                            // Only update if we got better information
                            if (!string.IsNullOrWhiteSpace(title) && (string.IsNullOrWhiteSpace(newArticle.Title) || newArticle.Title == "Untitled Article"))
                                newArticle.Title = title;
                            
                            if (!string.IsNullOrWhiteSpace(description) && string.IsNullOrWhiteSpace(newArticle.Description))
                                newArticle.Description = description;
                            
                            if (!string.IsNullOrWhiteSpace(author))
                                newArticle.Author = author;
                            
                            if (!string.IsNullOrWhiteSpace(publication))
                                newArticle.Publication = publication;
                            
                            if (pubDate.HasValue)
                                newArticle.PublicationDate = pubDate;
                        }
                        catch (Exception metadataEx)
                        {
                            _logger.LogWarning(metadataEx, "Failed to extract metadata for URL: {Url}", bookmark.Url);
                        }
                        
                        _context.Add(newArticle);
                        importedArticles.Add(newArticle);
                    }
                }
                
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Successfully imported {Count} articles from Instapaper", importedArticles.Count);
                return importedArticles;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to import bookmarks from Instapaper");
                throw;
            }
        }
        
        public async Task<int> SyncExistingArticlesAsync(string accessToken, string accessTokenSecret)
        {
            try
            {
                _logger.LogInformation("Syncing existing articles with Instapaper");
                
                var existingArticles = await _context.MediaItems
                    .OfType<Article>()
                    .Where(a => !string.IsNullOrEmpty(a.InstapaperBookmarkId))
                    .ToListAsync();
                
                var updatedCount = 0;
                
                // Get bookmarks from different folders to ensure we catch all statuses
                var folders = new[] { "unread", "archive", "starred" };
                var allBookmarks = new List<InstapaperBookmarkDto>();
                
                foreach (var folder in folders)
                {
                    try
                    {
                        var response = await _apiClient.GetBookmarksAsync(accessToken, accessTokenSecret, 500, folder);
                        allBookmarks.AddRange(response.Bookmarks);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to get bookmarks from folder: {Folder}", folder);
                    }
                }
                
                foreach (var article in existingArticles)
                {
                    var matchingBookmark = allBookmarks.FirstOrDefault(b => b.BookmarkId.ToString() == article.InstapaperBookmarkId);
                    
                    if (matchingBookmark != null)
                    {
                        _mappingService.UpdateArticleFromInstapaper(article, matchingBookmark);
                        updatedCount++;
                    }
                    else
                    {
                        _logger.LogWarning("No matching Instapaper bookmark found for article: {Title} (ID: {BookmarkId})", 
                            article.Title, article.InstapaperBookmarkId);
                    }
                }
                
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Successfully synced {Count} articles with Instapaper", updatedCount);
                return updatedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to sync existing articles with Instapaper");
                throw;
            }
        }
        
        public async Task<Article> SaveToInstapaperAsync(
            string accessToken, 
            string accessTokenSecret, 
            string url, 
            string? title = null, 
            string? selection = null)
        {
            try
            {
                _logger.LogInformation("Saving URL to Instapaper: {Url}", url);
                
                var bookmark = await _apiClient.AddBookmarkAsync(accessToken, accessTokenSecret, url, title, selection);
                var article = _mappingService.MapInstapaperBookmarkToArticle(bookmark);
                
                // Try to extract additional metadata
                try
                {
                    var (extractedTitle, description, author, publication, pubDate) = await ExtractArticleMetadataAsync(url);
                    
                    if (!string.IsNullOrWhiteSpace(extractedTitle) && (string.IsNullOrWhiteSpace(article.Title) || article.Title == "Untitled Article"))
                        article.Title = extractedTitle;
                    
                    if (!string.IsNullOrWhiteSpace(description))
                        article.Description = description;
                    
                    if (!string.IsNullOrWhiteSpace(author))
                        article.Author = author;
                    
                    if (!string.IsNullOrWhiteSpace(publication))
                        article.Publication = publication;
                    
                    if (pubDate.HasValue)
                        article.PublicationDate = pubDate;
                }
                catch (Exception metadataEx)
                {
                    _logger.LogWarning(metadataEx, "Failed to extract metadata for URL: {Url}", url);
                }
                
                _context.Add(article);
                await _context.SaveChangesAsync();
                
                _logger.LogInformation("Successfully saved article to Instapaper and created local copy: {Title}", article.Title);
                return article;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save URL to Instapaper: {Url}", url);
                throw;
            }
        }
        
        public int EstimateReadingTime(int wordCount)
        {
            // Average reading speed is about 200-250 words per minute
            // Using 225 as a middle ground
            const int wordsPerMinute = 225;
            return Math.Max(1, (int)Math.Ceiling((double)wordCount / wordsPerMinute));
        }
        
        public async Task<(string? Title, string? Description, string? Author, string? Publication, DateTime? PublicationDate)> ExtractArticleMetadataAsync(string url)
        {
            try
            {
                // This is a basic implementation - in a production app, you might want to use
                // a proper HTML parser or metadata extraction library like HtmlAgilityPack
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "ProjectLoopbreaker/1.0");
                
                var html = await httpClient.GetStringAsync(url);
                
                // Extract basic metadata using simple string parsing
                // This is a simplified implementation - you'd want more robust parsing
                var title = ExtractMetaContent(html, "og:title") ?? ExtractTitleTag(html);
                var description = ExtractMetaContent(html, "og:description") ?? ExtractMetaContent(html, "description");
                var author = ExtractMetaContent(html, "author") ?? ExtractMetaContent(html, "article:author");
                var publication = ExtractMetaContent(html, "og:site_name") ?? ExtractDomainFromUrl(url);
                var pubDateStr = ExtractMetaContent(html, "article:published_time") ?? ExtractMetaContent(html, "datePublished");
                
                DateTime? publicationDate = null;
                if (!string.IsNullOrEmpty(pubDateStr) && DateTime.TryParse(pubDateStr, out var parsedDate))
                {
                    publicationDate = parsedDate;
                }
                
                return (title, description, author, publication, publicationDate);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to extract metadata from URL: {Url}", url);
                return (null, null, null, null, null);
            }
        }
        
        private string? ExtractMetaContent(string html, string property)
        {
            // Simple regex-based extraction - in production, use proper HTML parser
            var patterns = new[]
            {
                $@"<meta\s+property\s*=\s*[""']og:{property}[""']\s+content\s*=\s*[""']([^""']*)[""']",
                $@"<meta\s+property\s*=\s*[""']{property}[""']\s+content\s*=\s*[""']([^""']*)[""']",
                $@"<meta\s+name\s*=\s*[""']{property}[""']\s+content\s*=\s*[""']([^""']*)[""']",
                $@"<meta\s+content\s*=\s*[""']([^""']*)[""']\s+property\s*=\s*[""']og:{property}[""']",
                $@"<meta\s+content\s*=\s*[""']([^""']*)[""']\s+name\s*=\s*[""']{property}[""']"
            };
            
            foreach (var pattern in patterns)
            {
                var regex = new System.Text.RegularExpressions.Regex(pattern, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                var match = regex.Match(html);
                if (match.Success && !string.IsNullOrWhiteSpace(match.Groups[1].Value))
                {
                    return System.Net.WebUtility.HtmlDecode(match.Groups[1].Value.Trim());
                }
            }
            
            return null;
        }
        
        private string? ExtractTitleTag(string html)
        {
            var regex = new System.Text.RegularExpressions.Regex(@"<title[^>]*>([^<]*)</title>", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
            var match = regex.Match(html);
            if (match.Success && !string.IsNullOrWhiteSpace(match.Groups[1].Value))
            {
                return System.Net.WebUtility.HtmlDecode(match.Groups[1].Value.Trim());
            }
            return null;
        }
        
        private string? ExtractDomainFromUrl(string url)
        {
            try
            {
                var uri = new Uri(url);
                return uri.Host.Replace("www.", "");
            }
            catch
            {
                return null;
            }
        }
    }
}
