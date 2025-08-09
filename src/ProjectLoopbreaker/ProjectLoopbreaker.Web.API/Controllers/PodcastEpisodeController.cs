using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Services;
using ProjectLoopbreaker.Infrastructure.Clients;
using ProjectLoopbreaker.Web.API.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PodcastEpisodeController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;
        private readonly IPodcastMappingService _podcastMappingService;
        private readonly ListenNotesApiClient _listenNotesClient;
        private readonly ILogger<PodcastEpisodeController> _logger;

        public PodcastEpisodeController(
            MediaLibraryDbContext context,
            IPodcastMappingService podcastMappingService,
            ListenNotesApiClient listenNotesClient,
            ILogger<PodcastEpisodeController> logger)
        {
            _context = context;
            _podcastMappingService = podcastMappingService;
            _listenNotesClient = listenNotesClient;
            _logger = logger;
        }

        // GET: api/podcastepisode
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PodcastEpisode>>> GetAllEpisodes()
        {
            var episodes = await _context.Set<PodcastEpisode>()
                .Include(e => e.PodcastSeries)
                .ToListAsync();
            return Ok(episodes);
        }

        // GET: api/podcastepisode/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<PodcastEpisode>> GetEpisode(Guid id)
        {
            var episode = await _context.Set<PodcastEpisode>()
                .Include(e => e.PodcastSeries)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
            {
                return NotFound($"Podcast episode with ID {id} not found.");
            }

            return Ok(episode);
        }

        // GET: api/podcastepisode/series/{seriesId}
        [HttpGet("series/{seriesId}")]
        public async Task<ActionResult<IEnumerable<PodcastEpisode>>> GetEpisodesBySeriesId(Guid seriesId)
        {
            var episodes = await _context.Set<PodcastEpisode>()
                .Where(e => e.PodcastSeriesId == seriesId)
                .Include(e => e.PodcastSeries)
                .ToListAsync();

            return Ok(episodes);
        }

        // POST: api/podcastepisode
        [HttpPost]
        public async Task<IActionResult> CreateEpisode([FromBody] CreatePodcastEpisodeDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Episode data is null.");
            }

            // Verify the podcast series exists
            var series = await _context.Set<PodcastSeries>()
                .FirstOrDefaultAsync(s => s.Id == dto.PodcastSeriesId);

            if (series == null)
            {
                return BadRequest($"Podcast series with ID {dto.PodcastSeriesId} not found.");
            }

            var episode = new PodcastEpisode
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
                Genre = dto.Genre,
                RelatedNotes = dto.RelatedNotes,
                Thumbnail = dto.Thumbnail,
                PodcastSeriesId = dto.PodcastSeriesId,
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
                        episode.Topics.Add(existingTopic);
                    }
                    else
                    {
                        episode.Topics.Add(new Topic { Name = topicName });
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
                        episode.Genres.Add(existingGenre);
                    }
                    else
                    {
                        episode.Genres.Add(new Genre { Name = genreName });
                    }
                }
            }

            _context.Set<PodcastEpisode>().Add(episode);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEpisode), new { id = episode.Id }, episode);
        }

        // POST: api/podcastepisode/from-api/{episodeId}/series/{seriesId}
        [HttpPost("from-api/{episodeId}/series/{seriesId}")]
        public async Task<IActionResult> CreateEpisodeFromApi(string episodeId, Guid seriesId)
        {
            try
            {
                // Verify the podcast series exists
                var series = await _context.Set<PodcastSeries>()
                    .FirstOrDefaultAsync(s => s.Id == seriesId);

                if (series == null)
                {
                    return BadRequest($"Podcast series with ID {seriesId} not found.");
                }

                // Get episode data from ListenNotes API
                var apiResponse = await _listenNotesClient.GetEpisodeByIdAsync(episodeId);

                // Map API response to domain entity
                var episode = _podcastMappingService.MapToPodcastEpisode(apiResponse, seriesId);

                _context.Set<PodcastEpisode>().Add(episode);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetEpisode), new { id = episode.Id }, episode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating episode from API with ID {EpisodeId} for series {SeriesId}", episodeId, seriesId);
                return StatusCode(500, "An error occurred while creating the episode from API data");
            }
        }

        // PUT: api/podcastepisode/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEpisode(Guid id, [FromBody] UpdatePodcastEpisodeDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Episode data is null.");
            }

            var episode = await _context.Set<PodcastEpisode>()
                .FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
            {
                return NotFound($"Podcast episode with ID {id} not found.");
            }

            // Update properties
            episode.Title = dto.Title ?? episode.Title;
            episode.Link = dto.Link ?? episode.Link;
            episode.Notes = dto.Notes ?? episode.Notes;
            episode.Description = dto.Description ?? episode.Description;
            episode.Genre = dto.Genre ?? episode.Genre;
            episode.RelatedNotes = dto.RelatedNotes ?? episode.RelatedNotes;
            episode.Thumbnail = dto.Thumbnail ?? episode.Thumbnail;

            // Handle Topics update
            if (dto.Topics != null)
            {
                episode.Topics.Clear();
                foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                {
                    var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == topicName);
                    if (existingTopic != null)
                    {
                        episode.Topics.Add(existingTopic);
                    }
                    else
                    {
                        episode.Topics.Add(new Topic { Name = topicName });
                    }
                }
            }

            // Handle Genres update
            if (dto.Genres != null)
            {
                episode.Genres.Clear();
                foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                {
                    var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == genreName);
                    if (existingGenre != null)
                    {
                        episode.Genres.Add(existingGenre);
                    }
                    else
                    {
                        episode.Genres.Add(new Genre { Name = genreName });
                    }
                }
            }
            if (dto.Status.HasValue)
                episode.Status = dto.Status.Value;
            if (dto.DateCompleted.HasValue)
                episode.DateCompleted = dto.DateCompleted;
            if (dto.Rating.HasValue)
                episode.Rating = dto.Rating;
            if (dto.OwnershipStatus.HasValue)
                episode.OwnershipStatus = dto.OwnershipStatus;
            episode.AudioLink = dto.AudioLink ?? episode.AudioLink;
            episode.ReleaseDate = dto.ReleaseDate ?? episode.ReleaseDate;
            episode.DurationInSeconds = dto.DurationInSeconds ?? episode.DurationInSeconds;

            await _context.SaveChangesAsync();

            return Ok(episode);
        }

        // DELETE: api/podcastepisode/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEpisode(Guid id)
        {
            var episode = await _context.Set<PodcastEpisode>()
                .FirstOrDefaultAsync(e => e.Id == id);

            if (episode == null)
            {
                return NotFound($"Podcast episode with ID {id} not found.");
            }

            _context.Set<PodcastEpisode>().Remove(episode);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }



    public class UpdatePodcastEpisodeDto
    {
        public string? Title { get; set; }
        public string? Link { get; set; }
        public string? Notes { get; set; }
        public string? Description { get; set; }
        public string? Genre { get; set; }
        public string[]? Topics { get; set; }
        public string[]? Genres { get; set; }
        public string? RelatedNotes { get; set; }
        public string? Thumbnail { get; set; }
        public Status? Status { get; set; }
        public DateTime? DateCompleted { get; set; }
        public Rating? Rating { get; set; }
        public OwnershipStatus? OwnershipStatus { get; set; }
        public string? AudioLink { get; set; }
        public DateTime? ReleaseDate { get; set; }
        public int? DurationInSeconds { get; set; }
    }
}
