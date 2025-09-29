using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.DTOs;
using System.Text.Json;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PodcastController : ControllerBase
    {
        private readonly IPodcastService _podcastService;
        private readonly IPodcastMappingService _podcastMappingService;
        private readonly IListenNotesService _listenNotesService;
        private readonly ILogger<PodcastController> _logger;

        public PodcastController(
            IPodcastService podcastService,
            IPodcastMappingService podcastMappingService,
            IListenNotesService listenNotesService,
            ILogger<PodcastController> logger)
        {
            _podcastService = podcastService;
            _podcastMappingService = podcastMappingService;
            _listenNotesService = listenNotesService;
            _logger = logger;
        }

        // GET: api/podcast
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PodcastResponseDto>>> GetAllPodcasts()
        {
            try
            {
                var podcasts = await _podcastService.GetAllPodcastsAsync();
                
                var response = podcasts.Select(p => new PodcastResponseDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    MediaType = p.MediaType,
                    Status = p.Status,
                    DateAdded = p.DateAdded,
                    Link = p.Link,
                    Thumbnail = p.Thumbnail,
                    PodcastType = p.PodcastType,
                    ParentPodcastId = p.ParentPodcastId,
                    Publisher = p.Publisher,
                    ExternalId = p.ExternalId,
                    AudioLink = p.AudioLink,
                    ReleaseDate = p.ReleaseDate,
                    DurationInSeconds = p.DurationInSeconds
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving all podcasts");
                return StatusCode(500, new { error = "Failed to retrieve podcasts", details = ex.Message });
            }
        }

        // GET: api/podcast/series
        [HttpGet("series")]
        public async Task<ActionResult<IEnumerable<object>>> GetPodcastSeries()
        {
            try
            {
                var series = await _podcastService.GetPodcastSeriesAsync();
                
                var response = series.Select(p => new {
                        p.Id,
                        p.Title,
                        p.Description,
                        p.Publisher,
                        p.Thumbnail,
                        p.ExternalId
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving podcast series");
                return StatusCode(500, new { error = "Failed to retrieve podcast series", details = ex.Message });
            }
        }

        // GET: api/podcast/series/search
        [HttpGet("series/search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchPodcastSeries([FromQuery] string query)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(query))
                {
                    return BadRequest("Query parameter is required");
                }

                var series = await _podcastService.SearchPodcastSeriesAsync(query);
                
                var response = series.Select(p => new {
                        p.Id,
                        p.Title,
                        p.Description,
                        p.Publisher,
                        p.Thumbnail,
                        p.ExternalId
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching podcast series with query: {Query}", query);
                return StatusCode(500, new { error = "Failed to search podcast series", details = ex.Message });
            }
        }

        // GET: api/podcast/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PodcastResponseDto>> GetPodcast(Guid id)
        {
            try
            {
                var podcast = await _podcastService.GetPodcastByIdAsync(id);

                if (podcast == null)
                {
                    return NotFound($"Podcast with ID {id} not found.");
                }

                var response = new PodcastResponseDto
                {
                    Id = podcast.Id,
                    Title = podcast.Title,
                    Description = podcast.Description,
                    MediaType = podcast.MediaType,
                    Status = podcast.Status,
                    DateAdded = podcast.DateAdded,
                    Link = podcast.Link,
                    Thumbnail = podcast.Thumbnail,
                    PodcastType = podcast.PodcastType,
                    ParentPodcastId = podcast.ParentPodcastId,
                    Publisher = podcast.Publisher,
                    ExternalId = podcast.ExternalId,
                    AudioLink = podcast.AudioLink,
                    ReleaseDate = podcast.ReleaseDate,
                    DurationInSeconds = podcast.DurationInSeconds
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving podcast with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve podcast", details = ex.Message });
            }
        }

        // GET: api/podcast/series/{seriesId}/episodes
        [HttpGet("series/{seriesId}/episodes")]
        public async Task<ActionResult<IEnumerable<PodcastResponseDto>>> GetEpisodesBySeriesId(Guid seriesId)
        {
            try
            {
                var episodes = await _podcastService.GetEpisodesBySeriesIdAsync(seriesId);

                var response = episodes.Select(p => new PodcastResponseDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    MediaType = p.MediaType,
                    Status = p.Status,
                    DateAdded = p.DateAdded,
                    Link = p.Link,
                    Thumbnail = p.Thumbnail,
                    PodcastType = p.PodcastType,
                    ParentPodcastId = p.ParentPodcastId,
                    Publisher = p.Publisher,
                    ExternalId = p.ExternalId,
                    AudioLink = p.AudioLink,
                    ReleaseDate = p.ReleaseDate,
                    DurationInSeconds = p.DurationInSeconds
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving episodes for series {SeriesId}", seriesId);
                return StatusCode(500, new { error = "Failed to retrieve episodes", details = ex.Message });
            }
        }

        // POST: api/podcast
        [HttpPost]
        public async Task<IActionResult> CreatePodcast([FromBody] CreatePodcastDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Podcast data is required");
                }

                var podcast = await _podcastService.CreatePodcastAsync(dto);

                var response = new PodcastResponseDto
                {
                    Id = podcast.Id,
                    Title = podcast.Title,
                    Description = podcast.Description,
                    MediaType = podcast.MediaType,
                    Status = podcast.Status,
                    DateAdded = podcast.DateAdded,
                    Link = podcast.Link,
                    Thumbnail = podcast.Thumbnail,
                    PodcastType = podcast.PodcastType,
                    ParentPodcastId = podcast.ParentPodcastId,
                    Publisher = podcast.Publisher,
                    ExternalId = podcast.ExternalId,
                    AudioLink = podcast.AudioLink,
                    ReleaseDate = podcast.ReleaseDate,
                    DurationInSeconds = podcast.DurationInSeconds
                };

                return CreatedAtAction(nameof(GetPodcast), new { id = podcast.Id }, response);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid argument while creating podcast");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating podcast");
                return StatusCode(500, new { error = "Failed to create podcast", details = ex.Message });
            }
        }

        // POST: api/podcast/episode
        [HttpPost("episode")]
        public async Task<IActionResult> CreatePodcastEpisode([FromBody] CreatePodcastDto dto)
        {
            try
            {
                // Force episode type for this endpoint
                dto.PodcastType = PodcastType.Episode;
                
                return await CreatePodcast(dto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating podcast episode");
                return StatusCode(500, new { error = "Failed to create podcast episode", details = ex.Message });
            }
        }

        // POST: api/podcast/from-api/{podcastId}
        [HttpPost("from-api/{podcastId}")]
        public async Task<IActionResult> ImportPodcastFromApi(string podcastId)
        {
            try
            {
                _logger.LogInformation("Starting podcast import from API for ID: {PodcastId}", podcastId);

                var podcast = await _listenNotesService.ImportPodcastAsync(podcastId);
                
                _logger.LogInformation("Successfully imported podcast: {Title} with ID: {Id}", podcast.Title, podcast.Id);

                return CreatedAtAction(nameof(GetPodcast), new { id = podcast.Id }, podcast);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing podcast from API with ID: {PodcastId}", podcastId);
                return StatusCode(500, new { error = "Failed to import podcast from API", details = ex.Message });
            }
        }

        // POST: api/podcast/from-api/by-name
        [HttpPost("from-api/by-name")]
        public async Task<IActionResult> ImportPodcastByName([FromBody] ImportPodcastByNameDto dto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(dto?.PodcastName))
                {
                    return BadRequest("Podcast name is required");
                }

                _logger.LogInformation("Searching for podcast by name: {PodcastName}", dto.PodcastName);

                var podcast = await _listenNotesService.ImportPodcastByNameAsync(dto.PodcastName);
                if (podcast == null)
                {
                    return NotFound($"No podcast found with name: {dto.PodcastName}");
                }

                _logger.LogInformation("Successfully imported podcast: {Title} with ID: {Id}", podcast.Title, podcast.Id);

                return CreatedAtAction(nameof(GetPodcast), new { id = podcast.Id }, podcast);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing podcast by name: {PodcastName}", dto?.PodcastName);
                return StatusCode(500, new { error = "Failed to import podcast by name", details = ex.Message });
            }
        }

        // DELETE: api/podcast/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePodcast(Guid id)
        {
            try
            {
                var deleted = await _podcastService.DeletePodcastAsync(id);
                
                if (!deleted)
                {
                    return NotFound($"Podcast with ID {id} not found.");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting podcast with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to delete podcast", details = ex.Message });
            }
        }
    }


}