using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Infrastructure.Clients;
using System.Text.Json;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MockListenNotesController : ControllerBase
    {
        private readonly MockListenNotesApiClient _mockClient;
        private readonly ILogger<MockListenNotesController> _logger;

        public MockListenNotesController(MockListenNotesApiClient mockClient, ILogger<MockListenNotesController> logger)
        {
            _mockClient = mockClient;
            _logger = logger;
        }

        // GET: api/MockListenNotes/search
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string query,
            [FromQuery] string? type = null)
        {
            try
            {
                var result = await _mockClient.SearchAsync(query, type);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching with query {Query}", query);
                return StatusCode(500, "An error occurred while performing the search");
            }
        }

        // GET: api/MockListenNotes/search-episode-titles
        [HttpGet("search-episode-titles")]
        public async Task<IActionResult> SearchEpisodeTitles([FromQuery] string query)
        {
            try
            {
                var result = await _mockClient.SearchEpisodeTitlesAsync(query);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching episode titles with query {Query}", query);
                return StatusCode(500, "An error occurred while searching episode titles");
            }
        }

        // GET: api/MockListenNotes/best-podcasts
        [HttpGet("best-podcasts")]
        public async Task<IActionResult> GetBestPodcasts(
            [FromQuery] int? genreId = null,
            [FromQuery] string? region = null)
        {
            try
            {
                var result = await _mockClient.GetBestPodcastsAsync(genreId, region);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving best podcasts");
                return StatusCode(500, "An error occurred while retrieving best podcasts");
            }
        }

        // GET: api/MockListenNotes/podcasts/{id}
        [HttpGet("podcasts/{id}")]
        public async Task<IActionResult> GetPodcast(string id)
        {
            try
            {
                var result = await _mockClient.GetPodcastByIdAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving podcast with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the podcast");
            }
        }

        // GET: api/MockListenNotes/episodes/{id}
        [HttpGet("episodes/{id}")]
        public async Task<IActionResult> GetEpisode(string id)
        {
            try
            {
                var result = await _mockClient.GetEpisodeByIdAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving episode with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the episode");
            }
        }

        // GET: api/MockListenNotes/curated-podcasts/{id}
        [HttpGet("curated-podcasts/{id}")]
        public async Task<IActionResult> GetCuratedPodcasts(string id)
        {
            try
            {
                var result = await _mockClient.GetCuratedPodcastsAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving curated podcasts with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving curated podcasts");
            }
        }

        // GET: api/MockListenNotes/genres
        [HttpGet("genres")]
        public async Task<IActionResult> GetGenres()
        {
            try
            {
                var result = await _mockClient.GetGenresAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving genres");
                return StatusCode(500, "An error occurred while retrieving genres");
            }
        }

        // GET: api/MockListenNotes/playlists
        [HttpGet("playlists")]
        public async Task<IActionResult> GetPlaylists()
        {
            try
            {
                var result = await _mockClient.GetPlaylistsAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving playlists");
                return StatusCode(500, "An error occurred while retrieving playlists");
            }
        }

        // GET: api/MockListenNotes/playlists/{id}
        [HttpGet("playlists/{id}")]
        public async Task<IActionResult> GetPlaylist(string id)
        {
            try
            {
                var result = await _mockClient.GetPlaylistByIdAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving playlist with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the playlist");
            }
        }
    }
}
