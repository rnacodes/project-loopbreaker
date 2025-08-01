using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Infrastructure.Clients;
using System.Text.Json;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ListenNotesController : ControllerBase
    {
        private readonly ListenNotesApiClient _listenNotesClient;
        private readonly ILogger<ListenNotesController> _logger;

        public ListenNotesController(ListenNotesApiClient listenNotesClient, ILogger<ListenNotesController> logger)
        {
            _listenNotesClient = listenNotesClient;
            _logger = logger;
        }

        // GET: api/ListenNotes/podcasts/{id}
        [HttpGet("podcasts/{id}")]
        public async Task<IActionResult> GetPodcast(string id)
        {
            try
            {
                var result = await _listenNotesClient.GetPodcastByIdAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving podcast with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the podcast");
            }
        }

        // GET: api/ListenNotes/playlists
        [HttpGet("playlists")]
        public async Task<IActionResult> GetPlaylists()
        {
            try
            {
                var result = await _listenNotesClient.GetPlaylistsAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving playlists");
                return StatusCode(500, "An error occurred while retrieving playlists");
            }
        }

        // GET: api/ListenNotes/playlists/{id}
        [HttpGet("playlists/{id}")]
        public async Task<IActionResult> GetPlaylist(string id)
        {
            try
            {
                var result = await _listenNotesClient.GetPlaylistByIdAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving playlist with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the playlist");
            }
        }

        // GET: api/ListenNotes/search
        [HttpGet("search")]
        public async Task<IActionResult> Search(
            [FromQuery] string query,
            [FromQuery] string? type = null,
            [FromQuery] int? offset = null,
            [FromQuery] int? len_min = null,
            [FromQuery] int? len_max = null,
            [FromQuery] string? genre_ids = null,
            [FromQuery] string? published_before = null,
            [FromQuery] string? published_after = null,
            [FromQuery] string? only_in = null,
            [FromQuery] string? language = null,
            [FromQuery] string? region = null,
            [FromQuery] string? sort_by_date = null,
            [FromQuery] string? safe_mode = null,
            [FromQuery] string? unique_podcasts = null)
        {
            try
            {
                var result = await _listenNotesClient.SearchAsync(
                    query, type, offset, len_min, len_max, genre_ids,
                    published_before, published_after, only_in, language,
                    region, sort_by_date, safe_mode, unique_podcasts);

                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching with query {Query}", query);
                return StatusCode(500, "An error occurred while performing the search");
            }
        }

        // GET: api/ListenNotes/genres
        [HttpGet("genres")]
        public async Task<IActionResult> GetGenres()
        {
            try
            {
                var result = await _listenNotesClient.GetGenresAsync();
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving genres");
                return StatusCode(500, "An error occurred while retrieving genres");
            }
        }

        // GET: api/ListenNotes/episodes/{id}
        [HttpGet("episodes/{id}")]
        public async Task<IActionResult> GetEpisode(string id)
        {
            try
            {
                var result = await _listenNotesClient.GetEpisodeByIdAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving episode with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the episode");
            }
        }

        // GET: api/ListenNotes/best-podcasts
        [HttpGet("best-podcasts")]
        public async Task<IActionResult> GetBestPodcasts(
            [FromQuery] int? genreId = null,
            [FromQuery] int? page = null,
            [FromQuery] string? region = null,
            [FromQuery] string? sortByDate = null,
            [FromQuery] bool? safe_mode = null)
        {
            try
            {
                var result = await _listenNotesClient.GetBestPodcastsAsync(genreId, page, region, sortByDate, safe_mode);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving best podcasts");
                return StatusCode(500, "An error occurred while retrieving best podcasts");
            }
        }

        // GET: api/ListenNotes/curated-podcasts
        [HttpGet("curated-podcasts")]
        public async Task<IActionResult> GetCuratedPodcasts([FromQuery] int? page = null)
        {
            try
            {
                var result = await _listenNotesClient.GetCuratedPodcastsAsync(page);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving curated podcasts");
                return StatusCode(500, "An error occurred while retrieving curated podcasts");
            }
        }

        // GET: api/ListenNotes/curated-podcasts/{id}
        [HttpGet("curated-podcasts/{id}")]
        public async Task<IActionResult> GetCuratedPodcast(string id)
        {
            try
            {
                var result = await _listenNotesClient.GetCuratedPodcastByIdAsync(id);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving curated podcast with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving the curated podcast");
            }
        }

        // GET: api/ListenNotes/podcasts/{id}/recommendations
        [HttpGet("podcasts/{id}/recommendations")]
        public async Task<IActionResult> GetPodcastRecommendations(string id, [FromQuery] bool? safe_mode = null)
        {
            try
            {
                var result = await _listenNotesClient.GetPodcastRecommendationsAsync(id, safe_mode);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recommendations for podcast with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving podcast recommendations");
            }
        }

        // GET: api/ListenNotes/episodes/{id}/recommendations
        [HttpGet("episodes/{id}/recommendations")]
        public async Task<IActionResult> GetEpisodeRecommendations(string id, [FromQuery] bool? safe_mode = null)
        {
            try
            {
                var result = await _listenNotesClient.GetEpisodeRecommendationsAsync(id, safe_mode);
                return Content(result, "application/json");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving recommendations for episode with ID {Id}", id);
                return StatusCode(500, "An error occurred while retrieving episode recommendations");
            }
        }
    }
}
