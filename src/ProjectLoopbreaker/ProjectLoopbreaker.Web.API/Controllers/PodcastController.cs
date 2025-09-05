using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Infrastructure.Clients;
using ProjectLoopbreaker.Web.API.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PodcastController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;
        private readonly IPodcastMappingService _podcastMappingService;
        private readonly ListenNotesApiClient _listenNotesClient;
        private readonly ILogger<PodcastController> _logger;

        public PodcastController(
            MediaLibraryDbContext context,
            IPodcastMappingService podcastMappingService,
            ListenNotesApiClient listenNotesClient,
            ILogger<PodcastController> logger)
        {
            _context = context;
            _podcastMappingService = podcastMappingService;
            _listenNotesClient = listenNotesClient;
            _logger = logger;
        }

        // GET: api/podcast
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PodcastResponseDto>>> GetAllPodcasts()
        {
            try
            {
                var podcasts = await _context.Podcasts.ToListAsync();
                
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
                var series = await _context.Podcasts
                    .Where(p => p.PodcastType == PodcastType.Series)
                    .Select(p => new {
                        p.Id,
                        p.Title,
                        p.Description,
                        p.Publisher,
                        p.Thumbnail,
                        p.ExternalId
                    })
                    .ToListAsync();

                return Ok(series);
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

                var series = await _context.Podcasts
                    .Where(p => p.PodcastType == PodcastType.Series && 
                               p.Title.ToLower().Contains(query.ToLower()))
                    .Select(p => new {
                        p.Id,
                        p.Title,
                        p.Description,
                        p.Publisher,
                        p.Thumbnail,
                        p.ExternalId
                    })
                    .ToListAsync();

                return Ok(series);
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
                var podcast = await _context.Podcasts
                    .Include(p => p.Topics)
                    .Include(p => p.Genres)
                    .Include(p => p.Episodes)
                    .FirstOrDefaultAsync(p => p.Id == id);

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
        public async Task<ActionResult<IEnumerable<Podcast>>> GetEpisodesBySeriesId(Guid seriesId)
        {
            try
            {
                var episodes = await _context.Podcasts
                    .Where(p => p.ParentPodcastId == seriesId && p.PodcastType == PodcastType.Episode)
                    .Include(p => p.Topics)
                    .Include(p => p.Genres)
                    .ToListAsync();

                return Ok(episodes);
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

                // If creating an episode, verify the parent series exists
                if (dto.PodcastType == PodcastType.Episode && dto.ParentPodcastId.HasValue)
                {
                    var parentSeries = await _context.Podcasts
                        .FirstOrDefaultAsync(p => p.Id == dto.ParentPodcastId.Value && p.PodcastType == PodcastType.Series);

                    if (parentSeries == null)
                    {
                        return BadRequest($"Parent podcast series with ID {dto.ParentPodcastId.Value} not found.");
                    }
                }

                var podcast = new Podcast
                {
                    Title = dto.Title,
                    MediaType = MediaType.Podcast,
                    Link = dto.Link,
                    Notes = dto.Notes,
                    Status = dto.Status,
                    DateAdded = DateTime.UtcNow,
                    DateCompleted = dto.DateCompleted,
                    Rating = dto.Rating,
                    OwnershipStatus = dto.OwnershipStatus,
                    Description = dto.Description,
                    RelatedNotes = dto.RelatedNotes,
                    Thumbnail = dto.Thumbnail,
                    PodcastType = dto.PodcastType,
                    ParentPodcastId = dto.ParentPodcastId,
                    ExternalId = dto.ExternalId,
                    Publisher = dto.Publisher,
                    AudioLink = dto.AudioLink,
                    ReleaseDate = dto.ReleaseDate,
                    DurationInSeconds = dto.DurationInSeconds
                };

                // Handle Topics array conversion - check if they exist or create new ones
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == topicName);
                        if (existingTopic != null)
                        {
                            podcast.Topics.Add(existingTopic);
                        }
                        else
                        {
                            podcast.Topics.Add(new Topic { Name = topicName });
                        }
                    }
                }

                // Handle Genres array conversion - check if they exist or create new ones
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == genreName);
                        if (existingGenre != null)
                        {
                            podcast.Genres.Add(existingGenre);
                        }
                        else
                        {
                            podcast.Genres.Add(new Genre { Name = genreName });
                        }
                    }
                }

                _context.Podcasts.Add(podcast);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetPodcast), new { id = podcast.Id }, podcast);
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

                // Get podcast data from Listen Notes API
                var podcastJsonData = await _listenNotesClient.GetPodcastByIdAsync(podcastId);
                _logger.LogInformation("Retrieved podcast data from API for ID: {PodcastId}", podcastId);

                // Map API data to domain entity
                var podcast = await _podcastMappingService.MapToPodcastAsync(podcastJsonData);
                _logger.LogInformation("Mapped podcast data for: {Title}", podcast.Title);

                // Save to database
                _context.Podcasts.Add(podcast);
                await _context.SaveChangesAsync();
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

                // Search for podcast by name
                var searchResults = await _listenNotesClient.SearchAsync(dto.PodcastName, "podcast");
                _logger.LogInformation("Retrieved search results for: {PodcastName}", dto.PodcastName);

                // Map search results and get the first podcast
                var podcast = await _podcastMappingService.MapToPodcastWithEpisodesAsync(searchResults);
                if (podcast == null)
                {
                    return NotFound($"No podcast found with name: {dto.PodcastName}");
                }

                _logger.LogInformation("Mapped podcast data for: {Title}", podcast.Title);

                // Save to database
                _context.Podcasts.Add(podcast);
                await _context.SaveChangesAsync();
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
                var podcast = await _context.Podcasts.FindAsync(id);
                if (podcast == null)
                {
                    return NotFound($"Podcast with ID {id} not found.");
                }

                // If deleting a series, also delete all its episodes
                if (podcast.PodcastType == PodcastType.Series)
                {
                    var episodes = await _context.Podcasts
                        .Where(p => p.ParentPodcastId == id)
                        .ToListAsync();
                    
                    _context.Podcasts.RemoveRange(episodes);
                }

                _context.Podcasts.Remove(podcast);
                await _context.SaveChangesAsync();

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