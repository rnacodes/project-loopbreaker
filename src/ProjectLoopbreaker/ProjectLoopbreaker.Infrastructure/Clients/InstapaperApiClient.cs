using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;
using System.Text.Json;
using System.Text;
using System.Security.Cryptography;
using System.Web;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ProjectLoopbreaker.Infrastructure.Clients
{
    public class InstapaperApiClient : IInstapaperApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly string _consumerKey;
        private readonly string _consumerSecret;
        private readonly ILogger<InstapaperApiClient> _logger;
        
        public InstapaperApiClient(HttpClient httpClient, IConfiguration configuration, ILogger<InstapaperApiClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            
            // Get consumer key and secret from configuration
            _consumerKey = Environment.GetEnvironmentVariable("INSTAPAPER_CONSUMER_KEY") ?? 
                          configuration["ApiKeys:Instapaper:ConsumerKey"] ?? 
                          throw new InvalidOperationException("Instapaper Consumer Key is required");
            
            _consumerSecret = Environment.GetEnvironmentVariable("INSTAPAPER_CONSUMER_SECRET") ?? 
                             configuration["ApiKeys:Instapaper:ConsumerSecret"] ?? 
                             throw new InvalidOperationException("Instapaper Consumer Secret is required");
        }
        
        public async Task<(string AccessToken, string AccessTokenSecret)> GetAccessTokenAsync(string username, string password)
        {
            try
            {
                var parameters = new Dictionary<string, string>
                {
                    ["x_auth_username"] = username,
                    ["x_auth_password"] = password,
                    ["x_auth_mode"] = "client_auth"
                };
                
                var authHeader = GenerateOAuthHeader("POST", "https://www.instapaper.com/api/1/oauth/access_token", parameters);
                
                var request = new HttpRequestMessage(HttpMethod.Post, "https://www.instapaper.com/api/1/oauth/access_token");
                request.Headers.Add("Authorization", authHeader);
                request.Content = new FormUrlEncodedContent(parameters);
                
                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to get Instapaper access token: {StatusCode} - {Content}", response.StatusCode, content);
                    throw new HttpRequestException($"Failed to get access token: {response.StatusCode}");
                }
                
                // Parse the response (format: oauth_token=xxx&oauth_token_secret=yyy)
                var tokenData = HttpUtility.ParseQueryString(content);
                var accessToken = tokenData["oauth_token"] ?? throw new InvalidOperationException("Access token not found in response");
                var accessTokenSecret = tokenData["oauth_token_secret"] ?? throw new InvalidOperationException("Access token secret not found in response");
                
                return (accessToken, accessTokenSecret);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Instapaper access token for user {Username}", username);
                throw;
            }
        }
        
        public async Task<InstapaperUserDto> VerifyCredentialsAsync(string accessToken, string accessTokenSecret)
        {
            try
            {
                var parameters = new Dictionary<string, string>();
                var authHeader = GenerateOAuthHeader("POST", "https://www.instapaper.com/api/1/account/verify_credentials", parameters, accessToken, accessTokenSecret);
                
                var request = new HttpRequestMessage(HttpMethod.Post, "https://www.instapaper.com/api/1/account/verify_credentials");
                request.Headers.Add("Authorization", authHeader);
                request.Content = new FormUrlEncodedContent(parameters);
                
                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to verify Instapaper credentials: {StatusCode} - {Content}", response.StatusCode, content);
                    throw new HttpRequestException($"Failed to verify credentials: {response.StatusCode}");
                }
                
                var userArray = JsonSerializer.Deserialize<InstapaperUserDto[]>(content);
                return userArray?.FirstOrDefault() ?? throw new InvalidOperationException("No user data in response");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying Instapaper credentials");
                throw;
            }
        }
        
        public async Task<InstapaperBookmarksResponse> GetBookmarksAsync(
            string accessToken, 
            string accessTokenSecret, 
            int limit = 25, 
            string folderId = "unread")
        {
            try
            {
                var parameters = new Dictionary<string, string>
                {
                    ["limit"] = Math.Clamp(limit, 1, 500).ToString(),
                    ["folder_id"] = folderId
                };
                
                var authHeader = GenerateOAuthHeader("POST", "https://www.instapaper.com/api/1/bookmarks/list", parameters, accessToken, accessTokenSecret);
                
                var request = new HttpRequestMessage(HttpMethod.Post, "https://www.instapaper.com/api/1/bookmarks/list");
                request.Headers.Add("Authorization", authHeader);
                request.Content = new FormUrlEncodedContent(parameters);
                
                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to get Instapaper bookmarks: {StatusCode} - {Content}", response.StatusCode, content);
                    throw new HttpRequestException($"Failed to get bookmarks: {response.StatusCode}");
                }
                
                var bookmarksResponse = JsonSerializer.Deserialize<InstapaperBookmarksResponse>(content);
                return bookmarksResponse ?? new InstapaperBookmarksResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting Instapaper bookmarks");
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
            try
            {
                var parameters = new Dictionary<string, string>
                {
                    ["url"] = url
                };
                
                if (!string.IsNullOrEmpty(title))
                    parameters["title"] = title;
                    
                if (!string.IsNullOrEmpty(selection))
                    parameters["selection"] = selection;
                
                var authHeader = GenerateOAuthHeader("POST", "https://www.instapaper.com/api/1/bookmarks/add", parameters, accessToken, accessTokenSecret);
                
                var request = new HttpRequestMessage(HttpMethod.Post, "https://www.instapaper.com/api/1/bookmarks/add");
                request.Headers.Add("Authorization", authHeader);
                request.Content = new FormUrlEncodedContent(parameters);
                
                var response = await _httpClient.SendAsync(request);
                var content = await response.Content.ReadAsStringAsync();
                
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("Failed to add Instapaper bookmark: {StatusCode} - {Content}", response.StatusCode, content);
                    throw new HttpRequestException($"Failed to add bookmark: {response.StatusCode}");
                }
                
                var bookmarkArray = JsonSerializer.Deserialize<InstapaperBookmarkDto[]>(content);
                return bookmarkArray?.FirstOrDefault(b => b.Type == "bookmark") ?? 
                       throw new InvalidOperationException("No bookmark data in response");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding Instapaper bookmark for URL {Url}", url);
                throw;
            }
        }
        
        private string GenerateOAuthHeader(string httpMethod, string url, Dictionary<string, string> parameters, string? accessToken = null, string? accessTokenSecret = null)
        {
            var oauthParameters = new Dictionary<string, string>
            {
                ["oauth_consumer_key"] = _consumerKey,
                ["oauth_signature_method"] = "HMAC-SHA1",
                ["oauth_timestamp"] = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ["oauth_nonce"] = Guid.NewGuid().ToString().Replace("-", ""),
                ["oauth_version"] = "1.0"
            };
            
            if (!string.IsNullOrEmpty(accessToken))
                oauthParameters["oauth_token"] = accessToken;
            
            // Combine OAuth and request parameters for signature
            var allParameters = new Dictionary<string, string>(oauthParameters);
            foreach (var param in parameters)
                allParameters[param.Key] = param.Value;
            
            // Generate signature
            var signature = GenerateSignature(httpMethod, url, allParameters, accessTokenSecret);
            oauthParameters["oauth_signature"] = signature;
            
            // Build authorization header
            var headerParams = oauthParameters
                .OrderBy(p => p.Key)
                .Select(p => $"{Uri.EscapeDataString(p.Key)}=\"{Uri.EscapeDataString(p.Value)}\"");
            
            return "OAuth " + string.Join(", ", headerParams);
        }
        
        private string GenerateSignature(string httpMethod, string url, Dictionary<string, string> parameters, string? accessTokenSecret = null)
        {
            // Create parameter string
            var sortedParams = parameters
                .OrderBy(p => p.Key)
                .Select(p => $"{Uri.EscapeDataString(p.Key)}={Uri.EscapeDataString(p.Value)}");
            var parameterString = string.Join("&", sortedParams);
            
            // Create signature base string
            var signatureBaseString = $"{httpMethod.ToUpper()}&{Uri.EscapeDataString(url)}&{Uri.EscapeDataString(parameterString)}";
            
            // Create signing key
            var signingKey = $"{Uri.EscapeDataString(_consumerSecret)}&{Uri.EscapeDataString(accessTokenSecret ?? "")}";
            
            // Generate HMAC-SHA1 signature
            using var hmac = new HMACSHA1(Encoding.UTF8.GetBytes(signingKey));
            var signatureBytes = hmac.ComputeHash(Encoding.UTF8.GetBytes(signatureBaseString));
            return Convert.ToBase64String(signatureBytes);
        }
    }
}
