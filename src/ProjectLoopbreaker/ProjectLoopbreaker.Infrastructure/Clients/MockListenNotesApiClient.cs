using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Infrastructure.Clients
{
    /// <summary>
    /// Mock implementation of the Listen Notes API client that uses the public testing endpoints
    /// which don't require an API key. Documentation: https://www.listennotes.help/article/48-how-to-test-the-podcast-api-without-an-api-key
    /// </summary>
    public class MockListenNotesApiClient
    {
        private readonly HttpClient _httpClient;
        private const string MockBaseUrl = "https://listen-api-test.listennotes.com/api/v2/";

        public MockListenNotesApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
            // Override the base address to use the mock server
            _httpClient.BaseAddress = new Uri(MockBaseUrl);

            // No API key is required for the mock server
            if (_httpClient.DefaultRequestHeaders.Contains("X-ListenAPI-Key"))
            {
                _httpClient.DefaultRequestHeaders.Remove("X-ListenAPI-Key");
            }
        }

        /// <summary>
        /// Search for podcasts or episodes
        /// </summary>
        /// <param name="query">Search term</param>
        /// <param name="type">The type of search which could be "episode" or "podcast"</param>
        public async Task<string> SearchAsync(string query, string type = null)
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/search
            var queryParams = new List<string> { $"q={Uri.EscapeDataString(query)}" };

            if (!string.IsNullOrEmpty(type))
            {
                queryParams.Add($"type={Uri.EscapeDataString(type)}");
            }

            var queryString = string.Join("&", queryParams);
            var response = await _httpClient.GetAsync($"search?{queryString}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Search for podcast episode titles
        /// </summary>
        /// <param name="query">Search term</param>
        public async Task<string> SearchEpisodeTitlesAsync(string query)
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/search_episode_titles
            var response = await _httpClient.GetAsync($"search_episode_titles?q={Uri.EscapeDataString(query)}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Get best podcasts by genre
        /// </summary>
        /// <param name="genreId">Podcast genre id</param>
        /// <param name="region">Region to filter</param>
        public async Task<string> GetBestPodcastsAsync(int? genreId = null, string region = null)
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/best_podcasts
            var queryParams = new List<string>();

            if (genreId.HasValue)
            {
                queryParams.Add($"genre_id={genreId}");
            }

            if (!string.IsNullOrEmpty(region))
            {
                queryParams.Add($"region={Uri.EscapeDataString(region)}");
            }

            var queryString = queryParams.Count > 0 ? "?" + string.Join("&", queryParams) : "";
            var response = await _httpClient.GetAsync($"best_podcasts{queryString}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Fetch detailed information about a podcast
        /// </summary>
        /// <param name="id">Podcast ID</param>
        public async Task<string> GetPodcastByIdAsync(string id)
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/podcasts/{id}
            var response = await _httpClient.GetAsync($"podcasts/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Fetch detailed information about an episode
        /// </summary>
        /// <param name="id">Episode ID</param>
        public async Task<string> GetEpisodeByIdAsync(string id)
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/episodes/{id}
            var response = await _httpClient.GetAsync($"episodes/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Fetch curated podcasts list by ID
        /// </summary>
        /// <param name="id">Curated podcasts list ID</param>
        public async Task<string> GetCuratedPodcastsAsync(string id)
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/curated_podcasts/{id}
            var response = await _httpClient.GetAsync($"curated_podcasts/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Get list of podcast genres
        /// </summary>
        public async Task<string> GetGenresAsync()
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/genres
            var response = await _httpClient.GetAsync("genres");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Get user's playlists (mock data)
        /// </summary>
        public async Task<string> GetPlaylistsAsync()
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/playlists
            var response = await _httpClient.GetAsync("playlists");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        /// <summary>
        /// Get a playlist by ID (mock data)
        /// </summary>
        /// <param name="id">Playlist ID</param>
        public async Task<string> GetPlaylistByIdAsync(string id)
        {
            // Makes a GET request to https://listen-api-test.listennotes.com/api/v2/playlists/{id}
            var response = await _httpClient.GetAsync($"playlists/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
    }
}
