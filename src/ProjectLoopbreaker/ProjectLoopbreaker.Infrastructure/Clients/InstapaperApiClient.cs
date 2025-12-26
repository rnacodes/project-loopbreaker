using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Shared.Interfaces;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;
using System.Text.Json;
using System.Security.Cryptography;
using System.Text;
using System.Web;

namespace ProjectLoopbreaker.Infrastructure.Clients
{
    /// <summary>
    /// Implementation of IInstapaperApiClient for interacting with the Instapaper API.
    /// Uses OAuth 1.0a (xAuth) for authentication.
    /// </summary>
    public class InstapaperApiClient : IInstapaperApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<InstapaperApiClient> _logger;
        private readonly IConfiguration _configuration;
        private readonly string? _consumerKey;
        private readonly string? _consumerSecret;

        public InstapaperApiClient(
            HttpClient httpClient,
            ILogger<InstapaperApiClient> logger,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _configuration = configuration;

            // Load Instapaper API credentials from configuration
            // Try ApiKeys:Instapaper first, then fall back to InstapaperApiSettings
            var apiKeysConfig = _configuration.GetSection("ApiKeys:Instapaper");
            var instapaperConfig = _configuration.GetSection("InstapaperApiSettings");
            
            _consumerKey = apiKeysConfig["ConsumerKey"] ?? instapaperConfig["ConsumerKey"];
            _consumerSecret = apiKeysConfig["ConsumerSecret"] ?? instapaperConfig["ConsumerSecret"];

            _httpClient.BaseAddress = new Uri("https://www.instapaper.com/api/1/");
        }

        public async Task<(string AccessToken, string AccessTokenSecret)> GetAccessTokenAsync(string username, string password)
        {
            if (!IsConfigured())
            {
                throw new InvalidOperationException("Instapaper API credentials not configured. Please set ApiKeys:Instapaper:ConsumerKey and ApiKeys:Instapaper:ConsumerSecret in appsettings.json");
            }

            try
            {
                _logger.LogInformation("Attempting to get access token for user: {Username}", username);

                // Instapaper uses xAuth (a variant of OAuth 1.0a)
                var endpoint = "oauth/access_token";
                var url = $"{_httpClient.BaseAddress}{endpoint}";
                
                // Prepare OAuth parameters
                var oauthParams = new Dictionary<string, string>
                {
                    { "oauth_consumer_key", _consumerKey! },
                    { "oauth_signature_method", "HMAC-SHA1" },
                    { "oauth_timestamp", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString() },
                    { "oauth_nonce", Guid.NewGuid().ToString("N") },
                    { "oauth_version", "1.0" },
                    { "x_auth_username", username },
                    { "x_auth_password", password },
                    { "x_auth_mode", "client_auth" }
                };

                // Generate signature
                var signature = GenerateSignature("POST", url, oauthParams, _consumerSecret!, "");
                oauthParams["oauth_signature"] = signature;

                // Create form content
                var formContent = new FormUrlEncodedContent(oauthParams);

                // Make request
                var response = await _httpClient.PostAsync(endpoint, formContent);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Instapaper authentication failed. Status: {Status}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    throw new InvalidOperationException($"Instapaper authentication failed: {responseContent}");
                }

                // Parse response (format: oauth_token=xxx&oauth_token_secret=yyy)
                var responseParams = HttpUtility.ParseQueryString(responseContent);
                var accessToken = responseParams["oauth_token"] ?? throw new InvalidOperationException("Access token not found in response");
                var accessTokenSecret = responseParams["oauth_token_secret"] ?? throw new InvalidOperationException("Access token secret not found in response");

                _logger.LogInformation("Successfully obtained access token for user: {Username}", username);
                return (accessToken, accessTokenSecret);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting access token for user: {Username}", username);
                throw;
            }
        }

        public async Task<InstapaperUserDto> VerifyCredentialsAsync(string accessToken, string accessTokenSecret)
        {
            if (!IsConfigured())
            {
                throw new InvalidOperationException("Instapaper API credentials not configured");
            }

            try
            {
                _logger.LogInformation("Verifying credentials with access token");

                var endpoint = "account/verify_credentials";
                var url = $"{_httpClient.BaseAddress}{endpoint}";
                
                // Prepare OAuth parameters
                var oauthParams = new Dictionary<string, string>
                {
                    { "oauth_consumer_key", _consumerKey! },
                    { "oauth_token", accessToken },
                    { "oauth_signature_method", "HMAC-SHA1" },
                    { "oauth_timestamp", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString() },
                    { "oauth_nonce", Guid.NewGuid().ToString("N") },
                    { "oauth_version", "1.0" }
                };

                // Generate signature
                var signature = GenerateSignature("POST", url, oauthParams, _consumerSecret!, accessTokenSecret);
                oauthParams["oauth_signature"] = signature;

                // Create form content
                var formContent = new FormUrlEncodedContent(oauthParams);

                // Make request
                var response = await _httpClient.PostAsync(endpoint, formContent);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Credentials verification failed. Status: {Status}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    throw new InvalidOperationException($"Credentials verification failed: {responseContent}");
                }

                // Parse response - Instapaper returns an array with user object as first element
                var responseArray = JsonSerializer.Deserialize<List<InstapaperUserDto>>(responseContent);
                
                if (responseArray == null || responseArray.Count == 0)
                {
                    throw new InvalidOperationException("Invalid response format from Instapaper API");
                }

                var user = responseArray[0];
                _logger.LogInformation("Successfully verified credentials for user: {Username}", user.Username);
                return user;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying credentials");
                throw;
            }
        }

        public async Task<InstapaperBookmarksResponse> GetBookmarksAsync(
            string accessToken,
            string accessTokenSecret,
            int limit = 25, 
            string folderId = "unread")
        {
            if (!IsConfigured())
            {
                _logger.LogWarning("Instapaper API credentials not configured");
                throw new InvalidOperationException("Instapaper API credentials not configured");
            }

            try
            {
                _logger.LogInformation("Fetching {Limit} bookmarks from folder: {FolderId}", limit, folderId);

                var endpoint = "bookmarks/list";
                var url = $"{_httpClient.BaseAddress}{endpoint}";
                
                // Prepare OAuth parameters
                var oauthParams = new Dictionary<string, string>
                {
                    { "oauth_consumer_key", _consumerKey! },
                    { "oauth_token", accessToken },
                    { "oauth_signature_method", "HMAC-SHA1" },
                    { "oauth_timestamp", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString() },
                    { "oauth_nonce", Guid.NewGuid().ToString("N") },
                    { "oauth_version", "1.0" },
                    { "limit", limit.ToString() },
                    { "folder", folderId }
                };

                // Generate signature
                var signature = GenerateSignature("POST", url, oauthParams, _consumerSecret!, accessTokenSecret);
                oauthParams["oauth_signature"] = signature;

                // Create form content
                var formContent = new FormUrlEncodedContent(oauthParams);

                // Make request
                var response = await _httpClient.PostAsync(endpoint, formContent);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to fetch bookmarks. Status: {Status}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    throw new InvalidOperationException($"Failed to fetch bookmarks: {responseContent}");
                }

                // Parse response - Instapaper returns an array of items
                var responseArray = JsonSerializer.Deserialize<List<InstapaperResponseItem>>(responseContent);
                
                if (responseArray == null)
                {
                    throw new InvalidOperationException("Invalid response format from Instapaper API");
                }

                // Parse user and bookmarks from response array
                var user = responseArray.FirstOrDefault(x => x.Type == "user");
                var bookmarks = responseArray.Where(x => x.Type == "bookmark").ToList();

                var result = new InstapaperBookmarksResponse
                {
                    User = user != null ? new InstapaperUserDto
                    {
                        UserId = user.UserId?.ToString() ?? "",
                        Username = user.Username ?? "",
                        SubscriptionIsActive = user.SubscriptionIsActive ?? "0"
                    } : null,
                    Bookmarks = bookmarks.Select(b => new InstapaperBookmarkDto
                    {
                        BookmarkId = b.BookmarkId?.ToString() ?? "",
                        Url = b.Url ?? "",
                        Title = b.Title ?? "",
                        Description = b.Description,
                        Time = b.Time ?? 0,
                        Starred = b.Starred ?? "0",
                        Hash = b.Hash ?? "",
                        Progress = b.Progress ?? 0,
                        ProgressTimestamp = b.ProgressTimestamp ?? 0
                    }).ToList()
                };

                _logger.LogInformation("Successfully fetched {Count} bookmarks", result.Bookmarks.Count);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching bookmarks");
                throw;
            }
        }

        public async Task<InstapaperBookmarkTextResponseDto> GetBookmarkTextAsync(string bookmarkId)
        {
            if (!IsConfigured())
            {
                throw new InvalidOperationException("Instapaper API credentials not configured");
            }

            try
            {
                _logger.LogInformation("Fetching text for bookmark: {BookmarkId}", bookmarkId);

                var endpoint = "bookmarks/get_text";
                var url = $"{_httpClient.BaseAddress}{endpoint}";
                
                // Note: This endpoint requires a paid Instapaper subscription
                // Prepare OAuth parameters (would need access token for actual implementation)
                _logger.LogWarning("GetBookmarkTextAsync requires paid Instapaper subscription and is not fully implemented");
                
                // Placeholder for now - full implementation would be similar to other methods
                return new InstapaperBookmarkTextResponseDto
                {
                    Html = string.Empty,
                    Url = string.Empty,
                    Title = string.Empty
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching bookmark text for: {BookmarkId}", bookmarkId);
                throw;
            }
        }

        public async Task<InstapaperBookmarkDto> AddBookmarkAsync(
            string accessToken,
            string accessTokenSecret,
            string url, 
            string? title = null, 
            string? selection = null)
        {
            if (!IsConfigured())
            {
                throw new InvalidOperationException("Instapaper API credentials not configured");
            }

            try
            {
                _logger.LogInformation("Adding bookmark for URL: {Url}", url);

                var endpoint = "bookmarks/add";
                var apiUrl = $"{_httpClient.BaseAddress}{endpoint}";
                
                // Prepare OAuth parameters
                var oauthParams = new Dictionary<string, string>
                {
                    { "oauth_consumer_key", _consumerKey! },
                    { "oauth_token", accessToken },
                    { "oauth_signature_method", "HMAC-SHA1" },
                    { "oauth_timestamp", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString() },
                    { "oauth_nonce", Guid.NewGuid().ToString("N") },
                    { "oauth_version", "1.0" },
                    { "url", url }
                };

                if (!string.IsNullOrEmpty(title))
                    oauthParams["title"] = title;
                
                if (!string.IsNullOrEmpty(selection))
                    oauthParams["selection"] = selection;

                // Generate signature
                var signature = GenerateSignature("POST", apiUrl, oauthParams, _consumerSecret!, accessTokenSecret);
                oauthParams["oauth_signature"] = signature;

                // Create form content
                var formContent = new FormUrlEncodedContent(oauthParams);

                // Make request
                var response = await _httpClient.PostAsync(endpoint, formContent);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to add bookmark. Status: {Status}, Response: {Response}", 
                        response.StatusCode, responseContent);
                    throw new InvalidOperationException($"Failed to add bookmark: {responseContent}");
                }

                // Parse response - Instapaper returns an array with bookmark as first element
                var responseArray = JsonSerializer.Deserialize<List<InstapaperResponseItem>>(responseContent);
                
                if (responseArray == null || responseArray.Count == 0)
                {
                    throw new InvalidOperationException("Invalid response format from Instapaper API");
                }

                var bookmark = responseArray[0];
                var result = new InstapaperBookmarkDto
                {
                    BookmarkId = bookmark.BookmarkId?.ToString() ?? "",
                    Url = bookmark.Url ?? url,
                    Title = bookmark.Title ?? title ?? "",
                    Description = bookmark.Description,
                    Time = bookmark.Time ?? DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                    Starred = bookmark.Starred ?? "0",
                    Hash = bookmark.Hash ?? "",
                    Progress = bookmark.Progress ?? 0,
                    ProgressTimestamp = bookmark.ProgressTimestamp ?? 0
                };

                _logger.LogInformation("Successfully added bookmark: {Title}", result.Title);
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding bookmark for URL: {Url}", url);
                throw;
            }
        }

        private bool IsConfigured()
        {
            return !string.IsNullOrEmpty(_consumerKey) &&
                   !string.IsNullOrEmpty(_consumerSecret);
        }

        /// <summary>
        /// Generates OAuth 1.0a signature for Instapaper API requests
        /// </summary>
        private string GenerateSignature(string httpMethod, string url, Dictionary<string, string> parameters, 
            string consumerSecret, string tokenSecret)
        {
            // Sort parameters alphabetically
            var sortedParams = parameters.OrderBy(p => p.Key)
                .Select(p => $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value)}");
            
            var paramString = string.Join("&", sortedParams);
            
            // Build signature base string
            var signatureBaseString = $"{httpMethod.ToUpper()}&{Uri.EscapeDataString(url)}&{Uri.EscapeDataString(paramString)}";
            
            // Build signing key
            var signingKey = $"{Uri.EscapeDataString(consumerSecret)}&{Uri.EscapeDataString(tokenSecret)}";
            
            // Generate HMAC-SHA1 signature
            using var hmac = new HMACSHA1(Encoding.ASCII.GetBytes(signingKey));
            var hash = hmac.ComputeHash(Encoding.ASCII.GetBytes(signatureBaseString));
            return Convert.ToBase64String(hash);
        }
    }
}
