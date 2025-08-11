using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Infrastructure.Clients
{
    public class OpenLibraryApiClient
    {
        private readonly HttpClient _httpClient;

        public OpenLibraryApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> SearchBooksAsync(string query, int? offset = null, int? limit = null)
        {
            // Makes a GET request to https://openlibrary.org/search.json
            var queryParams = new List<string> { $"q={Uri.EscapeDataString(query)}" };

            if (offset.HasValue) queryParams.Add($"offset={offset}");
            if (limit.HasValue) queryParams.Add($"limit={limit}");

            var queryString = string.Join("&", queryParams);
            var fullUrl = $"search.json?{queryString}";
            
            Console.WriteLine($"Making request to: {_httpClient.BaseAddress}{fullUrl}");
            
            var response = await _httpClient.GetAsync(fullUrl);
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"HTTP Error: {response.StatusCode} - {errorContent}");
                Console.WriteLine($"Request URL: {_httpClient.BaseAddress}{fullUrl}");
                throw new HttpRequestException($"HTTP {response.StatusCode}: {errorContent}");
            }
            
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> SearchBooksByTitleAsync(string title, int? offset = null, int? limit = null)
        {
            // Search specifically by title
            var query = $"title:{Uri.EscapeDataString(title)}";
            return await SearchBooksAsync(query, offset, limit);
        }

        public async Task<string> SearchBooksByAuthorAsync(string author, int? offset = null, int? limit = null)
        {
            // Search specifically by author
            var query = $"author:{Uri.EscapeDataString(author)}";
            return await SearchBooksAsync(query, offset, limit);
        }

        public async Task<string> SearchBooksByISBNAsync(string isbn)
        {
            // Search by ISBN
            var query = $"isbn:{Uri.EscapeDataString(isbn)}";
            return await SearchBooksAsync(query);
        }

        public async Task<string> GetBookByOpenLibraryIdAsync(string openLibraryId)
        {
            // Makes a GET request to https://openlibrary.org/works/{id}.json
            var response = await _httpClient.GetAsync($"works/{openLibraryId}.json");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"HTTP Error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"HTTP {response.StatusCode}: {errorContent}");
            }
            
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetBookByISBNAsync(string isbn)
        {
            // Makes a GET request to https://openlibrary.org/isbn/{isbn}.json
            var response = await _httpClient.GetAsync($"isbn/{isbn}.json");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"HTTP Error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"HTTP {response.StatusCode}: {errorContent}");
            }
            
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetAuthorAsync(string authorId)
        {
            // Makes a GET request to https://openlibrary.org/authors/{id}.json
            var response = await _httpClient.GetAsync($"authors/{authorId}.json");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"HTTP Error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"HTTP {response.StatusCode}: {errorContent}");
            }
            
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetSubjectsAsync()
        {
            // Makes a GET request to https://openlibrary.org/subjects.json
            var response = await _httpClient.GetAsync("subjects.json");
            
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"HTTP Error: {response.StatusCode} - {errorContent}");
                throw new HttpRequestException($"HTTP {response.StatusCode}: {errorContent}");
            }
            
            return await response.Content.ReadAsStringAsync();
        }
    }
}
