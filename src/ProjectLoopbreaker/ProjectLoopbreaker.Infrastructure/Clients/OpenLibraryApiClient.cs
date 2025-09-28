using System.Text.Json;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Infrastructure.Clients
{
    public class OpenLibraryApiClient : IOpenLibraryApiClient
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<OpenLibraryApiClient> _logger;
        private readonly JsonSerializerOptions _jsonOptions;

        public OpenLibraryApiClient(HttpClient httpClient, ILogger<OpenLibraryApiClient> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        public async Task<OpenLibrarySearchResultDto> SearchBooksAsync(string query, int? offset = null, int? limit = null)
        {
            try
            {
                var queryParams = new List<string> { $"q={Uri.EscapeDataString(query)}" };

                if (offset.HasValue) queryParams.Add($"offset={offset}");
                if (limit.HasValue) queryParams.Add($"limit={limit}");

                var queryString = string.Join("&", queryParams);
                var fullUrl = $"search.json?{queryString}";
                
                _logger.LogInformation("Searching OpenLibrary books with query: {Query}, offset: {Offset}, limit: {Limit}", query, offset, limit);
                
                var response = await _httpClient.GetAsync(fullUrl);
                response.EnsureSuccessStatusCode();
                
                var jsonContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<OpenLibrarySearchResultDto>(jsonContent, _jsonOptions);
                
                return result ?? new OpenLibrarySearchResultDto();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching OpenLibrary books for query: {Query}", query);
                throw;
            }
        }

        public async Task<OpenLibrarySearchResultDto> SearchBooksByTitleAsync(string title, int? offset = null, int? limit = null)
        {
            var query = $"title:{Uri.EscapeDataString(title)}";
            return await SearchBooksAsync(query, offset, limit);
        }

        public async Task<OpenLibrarySearchResultDto> SearchBooksByAuthorAsync(string author, int? offset = null, int? limit = null)
        {
            var query = $"author:{Uri.EscapeDataString(author)}";
            return await SearchBooksAsync(query, offset, limit);
        }

        public async Task<OpenLibrarySearchResultDto> SearchBooksByISBNAsync(string isbn)
        {
            var query = $"isbn:{Uri.EscapeDataString(isbn)}";
            return await SearchBooksAsync(query);
        }

        public async Task<OpenLibraryWorkDto> GetBookByOpenLibraryIdAsync(string openLibraryId)
        {
            try
            {
                _logger.LogInformation("Getting OpenLibrary work details for ID: {OpenLibraryId}", openLibraryId);
                
                var response = await _httpClient.GetAsync($"works/{openLibraryId}.json");
                response.EnsureSuccessStatusCode();
                
                var jsonContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<OpenLibraryWorkDto>(jsonContent, _jsonOptions);
                
                if (result == null)
                {
                    throw new InvalidOperationException($"Work with ID {openLibraryId} not found");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting OpenLibrary work details for ID: {OpenLibraryId}", openLibraryId);
                throw;
            }
        }

        public async Task<OpenLibraryBookDto> GetBookByISBNAsync(string isbn)
        {
            try
            {
                _logger.LogInformation("Getting OpenLibrary book details for ISBN: {ISBN}", isbn);
                
                var response = await _httpClient.GetAsync($"isbn/{isbn}.json");
                response.EnsureSuccessStatusCode();
                
                var jsonContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<OpenLibraryBookDto>(jsonContent, _jsonOptions);
                
                if (result == null)
                {
                    throw new InvalidOperationException($"Book with ISBN {isbn} not found");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting OpenLibrary book details for ISBN: {ISBN}", isbn);
                throw;
            }
        }

        public async Task<OpenLibraryAuthorDto> GetAuthorAsync(string authorId)
        {
            try
            {
                _logger.LogInformation("Getting OpenLibrary author details for ID: {AuthorId}", authorId);
                
                var response = await _httpClient.GetAsync($"authors/{authorId}.json");
                response.EnsureSuccessStatusCode();
                
                var jsonContent = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<OpenLibraryAuthorDto>(jsonContent, _jsonOptions);
                
                if (result == null)
                {
                    throw new InvalidOperationException($"Author with ID {authorId} not found");
                }
                
                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting OpenLibrary author details for ID: {AuthorId}", authorId);
                throw;
            }
        }

        public async Task<string> GetSubjectsAsync()
        {
            try
            {
                _logger.LogInformation("Getting OpenLibrary subjects");
                
                var response = await _httpClient.GetAsync("subjects.json");
                response.EnsureSuccessStatusCode();
                
                return await response.Content.ReadAsStringAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting OpenLibrary subjects");
                throw;
            }
        }

        public string GetCoverImageUrl(int? coverId, string size = "L")
        {
            if (!coverId.HasValue)
                return string.Empty;
                
            return $"https://covers.openlibrary.org/b/id/{coverId}-{size}.jpg";
        }
    }
}
