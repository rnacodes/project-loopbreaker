using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Infrastructure.Clients;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PodcastSeriesController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;
        private readonly IPodcastMappingService _podcastMappingService;
        private readonly ListenNotesApiClient _listenNotesClient;
        private readonly MockListenNotesApiClient _mockClient;
        private readonly ILogger<PodcastSeriesController> _logger;

        public PodcastSeriesController(
            MediaLibraryDbContext context,
            IPodcastMappingService podcastMappingService,
            ListenNotesApiClient listenNotesClient,
            MockListenNotesApiClient mockClient,
            ILogger<PodcastSeriesController> logger)
        {
            _context = context;
            _podcastMappingService = podcastMappingService;
            _listenNotesClient = listenNotesClient;
            _mockClient = mockClient;
            _logger = logger;
        }

        // GET: api/podcastseries
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PodcastSeries>>> GetAllSeries()
        {
            var series = await _context.Set<PodcastSeries>().ToListAsync();
            return Ok(series);
        }

        // GET: api/podcastseries/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PodcastSeries>> GetSeries(Guid id)
        {
            var series = await _context.Set<PodcastSeries>()
                .Include(s => s.Episodes)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (series == null)
            {
                return NotFound($"Podcast series with ID {id} not found.");
            }

            return Ok(series);
        }

        // POST: api/podcastseries/from-api/{podcastId}
        [HttpPost("from-api/{podcastId}")]
        public async Task<IActionResult> ImportSeriesFromApi(string podcastId, [FromQuery] bool useMock = false)
        {
            try
            {
                // Choose the appropriate client
                var apiResponse = useMock
                    ? await _mockClient.GetPodcastByIdAsync(podcastId)
                    : await _listenNotesClient.GetPodcastByIdAsync(podcastId);

                // Map API response to domain entity
                var series = _podcastMappingService.MapToPodcastSeries(apiResponse);

                // Check if series already exists
                var existingSeries = await _context.Set<PodcastSeries>()
                    .FirstOrDefaultAsync(s => s.Title == series.Title);

                if (existingSeries != null)
                {
                    return BadRequest($"Podcast series '{series.Title}' already exists with ID {existingSeries.Id}");
                }

                _context.Set<PodcastSeries>().Add(series);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetSeries), new { id = series.Id }, series);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing podcast series from API with ID {PodcastId}", podcastId);
                return StatusCode(500, "An error occurred while importing the podcast series");
            }
        }

        // POST: api/podcastseries/from-api/by-name
        [HttpPost("from-api/by-name")]
        public async Task<IActionResult> ImportSeriesByName([FromBody] ImportByNameRequest request)
        {
            try
            {
                // First search for the podcast
                var searchResponse = request.UseMock
                    ? await _mockClient.SearchAsync(request.PodcastName, "podcast")
                    : await _listenNotesClient.SearchAsync(request.PodcastName, "podcast");

                // Parse search results and find exact match
                var searchData = System.Text.Json.JsonSerializer.Deserialize<SearchResponse>(searchResponse);
                var exactMatch = searchData?.Results?.FirstOrDefault(p =>
                    string.Equals(p.Title, request.PodcastName, StringComparison.OrdinalIgnoreCase));

                if (exactMatch == null)
                {
                    return NotFound($"No podcast found with exact name: {request.PodcastName}");
                }

                // Import using the found ID
                return await ImportSeriesFromApi(exactMatch.Id, request.UseMock);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing podcast series by name {PodcastName}", request.PodcastName);
                return StatusCode(500, "An error occurred while importing the podcast series");
            }
        }

        // DELETE: api/podcastseries/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSeries(Guid id)
        {
            var series = await _context.Set<PodcastSeries>()
                .Include(s => s.Episodes)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (series == null)
            {
                return NotFound($"Podcast series with ID {id} not found.");
            }

            // Check if series has episodes
            if (series.Episodes?.Any() == true)
            {
                return BadRequest($"Cannot delete podcast series '{series.Title}' because it contains {series.Episodes.Count} episodes. Delete episodes first or use force delete.");
            }

            _context.Set<PodcastSeries>().Remove(series);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }

    // DTOs
    public class ImportByNameRequest
    {
        public string PodcastName { get; set; } = string.Empty;
        public bool UseMock { get; set; } = false;
    }

    public class SearchResponse
    {
        public List<SearchResult>? Results { get; set; }
    }

    public class SearchResult
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
    }
}