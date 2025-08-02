using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure; // To access the DbContext
using ProjectLoopbreaker.Web.API.DTOs;
using Microsoft.EntityFrameworkCore; // For ToListAsync, etc.

namespace ProjectLoopbreaker.Web.API.Controllers
{
[ApiController]
[Route("api/[controller]")]
    public class MediaController : ControllerBase
    {
        private readonly Infrastructure.Data.MediaLibraryDbContext _context;

        public MediaController(Infrastructure.Data.MediaLibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/media
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BaseMediaItem>>> GetAllMedia()
        {
            var mediaItems = await _context.MediaItems.ToListAsync();
            return Ok(mediaItems);
        }

        // POST: api/media
        [HttpPost]
        public async Task<IActionResult> AddMediaItem([FromBody] CreateMediaItemDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Media item data is null.");
            }

            // Parse the string MediaType to the enum MediaType
            if (!Enum.TryParse<MediaType>(dto.MediaType, true, out var mediaTypeEnum))
            {
                return BadRequest($"Invalid media type: {dto.MediaType}");
            }

            // Parse the string Rating to the enum Rating (if provided)
            Rating? ratingEnum = null;
            if (!string.IsNullOrEmpty(dto.Rating))
            {
                if (!Enum.TryParse<Rating>(dto.Rating, true, out var parsedRating))
                {
                    return BadRequest($"Invalid rating: {dto.Rating}. Valid values are: {string.Join(", ", Enum.GetNames<Rating>())}");
                }
                ratingEnum = parsedRating;
            }

            var mediaItem = new BaseMediaItem
            {
                Title = dto.Title,
                MediaType = mediaTypeEnum,
                Link = dto.Link,
                Notes = dto.Notes,
                Consumed = dto.Consumed,
                DateAdded = DateTime.UtcNow,
                DateConsumed = dto.Consumed ? DateTime.UtcNow : null,
                Rating = ratingEnum,
                RelatedNotes = dto.RelatedNotes,
                Thumbnail = dto.Thumbnail,
                Description = dto.Description
                // Playlists is initialized to new List<Playlist>() by default in the BaseMediaItem class
            };

            _context.MediaItems.Add(mediaItem);
            await _context.SaveChangesAsync();

            // Return the created item, including its new ID
            return CreatedAtAction(nameof(GetMediaItem), new { id = mediaItem.Id }, mediaItem);
        }

        // GET: api/media/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<BaseMediaItem>> GetMediaItem(Guid id)
        {
            var mediaItem = await _context.MediaItems.FindAsync(id);

            if (mediaItem == null)
            {
                return NotFound();
            }

            return Ok(mediaItem);
        }
    }
    public class CreateMediaItemDto
    {
        public string Title { get; set; }
        public string MediaType { get; set; }
        public string? Link { get; set; }
        public string? Notes { get; set; }
        public bool Consumed { get; set; }
        public string? Rating { get; set; }
        public string? RelatedNotes { get; set; }
        public string? Thumbnail { get; set; }

        public string? Description { get; set; }
    }
}