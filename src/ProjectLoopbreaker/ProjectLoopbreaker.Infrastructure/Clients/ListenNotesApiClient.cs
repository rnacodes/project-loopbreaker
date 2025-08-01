using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Infrastructure.Clients
{
    public class ListenNotesApiClient
    {
        private readonly HttpClient _httpClient;

        public ListenNotesApiClient(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> GetPodcastByIdAsync(string id)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/podcasts/{id}
            var response = await _httpClient.GetAsync($"podcasts/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetPlaylistsAsync()
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/playlists
            var response = await _httpClient.GetAsync("playlists");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetPlaylistByIdAsync(string id)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/playlists/{id}
            var response = await _httpClient.GetAsync($"playlists/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> SearchAsync(string query, string type = null, int? offset = null, int? len_min = null,
            int? len_max = null, string genre_ids = null, string published_before = null, string published_after = null,
            string only_in = null, string language = null, string region = null, string sort_by_date = null,
            string safe_mode = null, string unique_podcasts = null)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/search
            var queryParams = new List<string> { $"q={Uri.EscapeDataString(query)}" };

            if (type != null) queryParams.Add($"type={Uri.EscapeDataString(type)}");
            if (offset.HasValue) queryParams.Add($"offset={offset}");
            if (len_min.HasValue) queryParams.Add($"len_min={len_min}");
            if (len_max.HasValue) queryParams.Add($"len_max={len_max}");
            if (genre_ids != null) queryParams.Add($"genre_ids={Uri.EscapeDataString(genre_ids)}");
            if (published_before != null) queryParams.Add($"published_before={Uri.EscapeDataString(published_before)}");
            if (published_after != null) queryParams.Add($"published_after={Uri.EscapeDataString(published_after)}");
            if (only_in != null) queryParams.Add($"only_in={Uri.EscapeDataString(only_in)}");
            if (language != null) queryParams.Add($"language={Uri.EscapeDataString(language)}");
            if (region != null) queryParams.Add($"region={Uri.EscapeDataString(region)}");
            if (sort_by_date != null) queryParams.Add($"sort_by_date={Uri.EscapeDataString(sort_by_date)}");
            if (safe_mode != null) queryParams.Add($"safe_mode={Uri.EscapeDataString(safe_mode)}");
            if (unique_podcasts != null) queryParams.Add($"unique_podcasts={Uri.EscapeDataString(unique_podcasts)}");

            var queryString = string.Join("&", queryParams);
            var response = await _httpClient.GetAsync($"search?{queryString}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetGenresAsync()
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/genres
            var response = await _httpClient.GetAsync("genres");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetEpisodeByIdAsync(string id)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/episodes/{id}
            var response = await _httpClient.GetAsync($"episodes/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetBestPodcastsAsync(int? genreId = null, int? page = null, string region = null,
            string sortByDate = null, bool? safe_mode = null)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/best_podcasts
            var queryParams = new List<string>();

            if (genreId.HasValue) queryParams.Add($"genre_id={genreId}");
            if (page.HasValue) queryParams.Add($"page={page}");
            if (region != null) queryParams.Add($"region={Uri.EscapeDataString(region)}");
            if (sortByDate != null) queryParams.Add($"sort_by_date={Uri.EscapeDataString(sortByDate)}");
            if (safe_mode.HasValue) queryParams.Add($"safe_mode={safe_mode.Value.ToString().ToLower()}");

            var queryString = queryParams.Count > 0 ? $"?{string.Join("&", queryParams)}" : "";
            var response = await _httpClient.GetAsync($"best_podcasts{queryString}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetCuratedPodcastsAsync(int? page = null)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/curated_podcasts
            var queryString = page.HasValue ? $"?page={page}" : "";
            var response = await _httpClient.GetAsync($"curated_podcasts{queryString}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetCuratedPodcastByIdAsync(string id)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/curated_podcasts/{id}
            var response = await _httpClient.GetAsync($"curated_podcasts/{id}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetPodcastRecommendationsAsync(string id, bool? safeMod = null)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/podcasts/{id}/recommendations
            var queryString = safeMod.HasValue ? $"?safe_mode={safeMod.Value.ToString().ToLower()}" : "";
            var response = await _httpClient.GetAsync($"podcasts/{id}/recommendations{queryString}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string> GetEpisodeRecommendationsAsync(string id, bool? safeMod = null)
        {
            // Makes a GET request to https://listen-api.listennotes.com/api/v2/episodes/{id}/recommendations
            var queryString = safeMod.HasValue ? $"?safe_mode={safeMod.Value.ToString().ToLower()}" : "";
            var response = await _httpClient.GetAsync($"episodes/{id}/recommendations{queryString}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }
    }
}
