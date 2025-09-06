using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure; // To access the DbContext
using ProjectLoopbreaker.Web.API.DTOs;
using Microsoft.EntityFrameworkCore; // For ToListAsync, etc.
using System.Globalization; // For CultureInfo
using System.Text; // For Encoding
using System.IO; // For StringWriter
using CsvHelper; // For CsvHelper

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
        public async Task<ActionResult<IEnumerable<MediaItemResponseDto>>> GetAllMedia()
        {
            var mediaItems = await _context.MediaItems
                .Include(m => m.Mixlists)
                .Include(m => m.Topics)
                .Include(m => m.Genres)
                .ToListAsync();
                
            var response = mediaItems.Select(item => new MediaItemResponseDto
            {
                Id = item.Id,
                Title = item.Title,
                MediaType = item.MediaType,
                Link = item.Link,
                Notes = item.Notes,
                DateAdded = item.DateAdded,
                Status = item.Status,
                DateCompleted = item.DateCompleted,
                Rating = item.Rating,
                OwnershipStatus = item.OwnershipStatus,
                Description = item.Description,
                RelatedNotes = item.RelatedNotes,
                Thumbnail = item.Thumbnail,
                Topics = item.Topics.Select(t => t.Name).ToArray(),
                Genres = item.Genres.Select(g => g.Name).ToArray(),
                MixlistIds = item.Mixlists.Select(m => m.Id).ToArray()
            }).ToList();
            
            return Ok(response);
        }

        // POST: api/media
        [HttpPost]
        public async Task<IActionResult> AddMediaItem([FromBody] CreateMediaItemDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Media item data is null.");
            }

            // Create the appropriate concrete type based on MediaType
            BaseMediaItem mediaItem = dto.MediaType switch
            {
                MediaType.Podcast => await CreatePodcastAsync(dto),
                // TODO: Add concrete types for other media types as they're implemented
                // For now, return an error for unsupported types
                _ => throw new NotSupportedException($"Media type '{dto.MediaType}' is not yet supported. Please implement a concrete class for this media type.")
            };

            _context.MediaItems.Add(mediaItem);
            await _context.SaveChangesAsync();

            // Return the created item, including its new ID
            return CreatedAtAction(nameof(GetMediaItem), new { id = mediaItem.Id }, mediaItem);
        }

        private async Task<Podcast> CreatePodcastAsync(CreateMediaItemDto dto)
        {
            var podcast = new Podcast
            {
                Title = dto.Title,
                MediaType = dto.MediaType,
                Link = dto.Link,
                Notes = dto.Notes,
                Status = dto.Status,
                DateAdded = DateTime.UtcNow,
                DateCompleted = dto.DateCompleted?.ToUniversalTime(),
                Rating = dto.Rating,
                OwnershipStatus = dto.OwnershipStatus,
                Description = dto.Description,
                RelatedNotes = dto.RelatedNotes,
                Thumbnail = dto.Thumbnail,
                PodcastType = PodcastType.Series // Default to Series for now
            };

            // Handle Topics - check if they exist or create new ones
            if (dto.Topics?.Length > 0)
            {
                foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                {
                    var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                    var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                    if (existingTopic != null)
                    {
                        podcast.Topics.Add(existingTopic);
                    }
                    else
                    {
                        podcast.Topics.Add(new Topic { Name = normalizedTopicName });
                    }
                }
            }

            // Handle Genres - check if they exist or create new ones
            if (dto.Genres?.Length > 0)
            {
                foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                {
                    var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                    var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                    if (existingGenre != null)
                    {
                        podcast.Genres.Add(existingGenre);
                    }
                    else
                    {
                        podcast.Genres.Add(new Genre { Name = normalizedGenreName });
                    }
                }
            }

            return podcast;
        }

        // GET: api/media/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<MediaItemResponseDto>> GetMediaItem(Guid id)
        {
            try
            {
                var mediaItem = await _context.MediaItems
                    .Include(m => m.Mixlists)
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (mediaItem == null)
                {
                    return NotFound($"Media item with ID {id} not found.");
                }

                var response = new MediaItemResponseDto
                {
                    Id = mediaItem.Id,
                    Title = mediaItem.Title,
                    MediaType = mediaItem.MediaType,
                    Link = mediaItem.Link,
                    Notes = mediaItem.Notes,
                    DateAdded = mediaItem.DateAdded,
                    Status = mediaItem.Status,
                    DateCompleted = mediaItem.DateCompleted,
                    Rating = mediaItem.Rating,
                    OwnershipStatus = mediaItem.OwnershipStatus,
                    Description = mediaItem.Description,
                    RelatedNotes = mediaItem.RelatedNotes,
                    Thumbnail = mediaItem.Thumbnail,
                    Topics = mediaItem.Topics.Select(t => t.Name).ToArray(),
                    Genres = mediaItem.Genres.Select(g => g.Name).ToArray(),
                    MixlistIds = mediaItem.Mixlists.Select(m => m.Id).ToArray()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve media item", details = ex.Message, stackTrace = ex.StackTrace });
            }
        }

        // PUT: api/media/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMediaItem(Guid id, [FromBody] CreateMediaItemDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Media item data is null.");
            }

            var existingItem = await _context.MediaItems
                .Include(m => m.Topics)
                .Include(m => m.Genres)
                .FirstOrDefaultAsync(m => m.Id == id);
            if (existingItem == null)
            {
                return NotFound($"Media item with ID {id} not found.");
            }

            try
            {
                // Update basic properties
                existingItem.Title = dto.Title;
                existingItem.MediaType = dto.MediaType;
                existingItem.Link = dto.Link;
                existingItem.Notes = dto.Notes;
                existingItem.Status = dto.Status;
                existingItem.DateCompleted = dto.DateCompleted;
                existingItem.Rating = dto.Rating;
                existingItem.OwnershipStatus = dto.OwnershipStatus;
                existingItem.Description = dto.Description;
                existingItem.RelatedNotes = dto.RelatedNotes;
                existingItem.Thumbnail = dto.Thumbnail;

                // Clear existing topics and genres
                existingItem.Topics.Clear();
                existingItem.Genres.Clear();

                // Add new topics - check if they exist or create new ones
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                        var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                        if (existingTopic != null)
                        {
                            existingItem.Topics.Add(existingTopic);
                        }
                        else
                        {
                            existingItem.Topics.Add(new Topic { Name = normalizedTopicName });
                        }
                    }
                }

                // Add new genres - check if they exist or create new ones
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                        if (existingGenre != null)
                        {
                            existingItem.Genres.Add(existingGenre);
                        }
                        else
                        {
                            existingItem.Genres.Add(new Genre { Name = normalizedGenreName });
                        }
                    }
                }

                await _context.SaveChangesAsync();
                return Ok(existingItem);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update media item", details = ex.Message });
            }
        }

        // DELETE: api/media/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMediaItem(Guid id)
        {
            try
            {
                var mediaItem = await _context.MediaItems.FindAsync(id);
                if (mediaItem == null)
                {
                    return NotFound($"Media item with ID {id} not found.");
                }

                _context.MediaItems.Remove(mediaItem);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = $"Media item '{mediaItem.Title}' deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete media item", details = ex.Message });
            }
        }

        // GET: api/media/search?query={query}
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<BaseMediaItem>>> SearchMedia([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return BadRequest("Search query cannot be empty.");
            }

            try
            {
                var searchQuery = query.ToLower();
                var results = await _context.MediaItems
                    .Where(m => m.Title.ToLower().Contains(searchQuery) || 
                               (m.Description != null && m.Description.ToLower().Contains(searchQuery)) ||
                               (m.Topics.Any(t => t.Name.ToLower().Contains(searchQuery))) ||
                               (m.Genres.Any(g => g.Name.ToLower().Contains(searchQuery))) ||
                               m.MediaType.ToString().ToLower().Contains(searchQuery))
                    .Include(m => m.Mixlists)
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .ToListAsync();

                return Ok(results);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Search failed", details = ex.Message });
            }
        }

        // GET: api/media/by-topic/{topicId}
        [HttpGet("by-topic/{topicId}")]
        public async Task<ActionResult<IEnumerable<MediaItemResponseDto>>> GetMediaByTopic(Guid topicId)
        {
            try
            {
                var mediaItems = await _context.MediaItems
                    .Where(m => m.Topics.Any(t => t.Id == topicId))
                    .Include(m => m.Mixlists)
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .ToListAsync();

                var response = mediaItems.Select(item => new MediaItemResponseDto
                {
                    Id = item.Id,
                    Title = item.Title,
                    MediaType = item.MediaType,
                    Link = item.Link,
                    Notes = item.Notes,
                    DateAdded = item.DateAdded,
                    Status = item.Status,
                    DateCompleted = item.DateCompleted,
                    Rating = item.Rating,
                    OwnershipStatus = item.OwnershipStatus,
                    Description = item.Description,
                    RelatedNotes = item.RelatedNotes,
                    Thumbnail = item.Thumbnail,
                    Topics = item.Topics.Select(t => t.Name).ToArray(),
                    Genres = item.Genres.Select(g => g.Name).ToArray(),
                    MixlistIds = item.Mixlists.Select(m => m.Id).ToArray()
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve media by topic", details = ex.Message });
            }
        }

        // GET: api/media/by-genre/{genreId}
        [HttpGet("by-genre/{genreId}")]
        public async Task<ActionResult<IEnumerable<MediaItemResponseDto>>> GetMediaByGenre(Guid genreId)
        {
            try
            {
                var mediaItems = await _context.MediaItems
                    .Where(m => m.Genres.Any(g => g.Id == genreId))
                    .Include(m => m.Mixlists)
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .ToListAsync();

                var response = mediaItems.Select(item => new MediaItemResponseDto
                {
                    Id = item.Id,
                    Title = item.Title,
                    MediaType = item.MediaType,
                    Link = item.Link,
                    Notes = item.Notes,
                    DateAdded = item.DateAdded,
                    Status = item.Status,
                    DateCompleted = item.DateCompleted,
                    Rating = item.Rating,
                    OwnershipStatus = item.OwnershipStatus,
                    Description = item.Description,
                    RelatedNotes = item.RelatedNotes,
                    Thumbnail = item.Thumbnail,
                    Topics = item.Topics.Select(t => t.Name).ToArray(),
                    Genres = item.Genres.Select(g => g.Name).ToArray(),
                    MixlistIds = item.Mixlists.Select(m => m.Id).ToArray()
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve media by genre", details = ex.Message });
            }
        }

        // GET: api/media/by-type/{mediaType}
        [HttpGet("by-type/{mediaType}")]
        public async Task<ActionResult<IEnumerable<MediaItemResponseDto>>> GetMediaByType(string mediaType)
        {
            try
            {
                if (!Enum.TryParse<MediaType>(mediaType, true, out var parsedMediaType))
                {
                    return BadRequest($"Invalid media type: {mediaType}");
                }

                var mediaItems = await _context.MediaItems
                    .Where(m => m.MediaType == parsedMediaType)
                    .Include(m => m.Mixlists)
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .ToListAsync();

                var response = mediaItems.Select(item => new MediaItemResponseDto
                {
                    Id = item.Id,
                    Title = item.Title,
                    MediaType = item.MediaType,
                    Link = item.Link,
                    Notes = item.Notes,
                    DateAdded = item.DateAdded,
                    Status = item.Status,
                    DateCompleted = item.DateCompleted,
                    Rating = item.Rating,
                    OwnershipStatus = item.OwnershipStatus,
                    Description = item.Description,
                    RelatedNotes = item.RelatedNotes,
                    Thumbnail = item.Thumbnail,
                    Topics = item.Topics.Select(t => t.Name).ToArray(),
                    Genres = item.Genres.Select(g => g.Name).ToArray(),
                    MixlistIds = item.Mixlists.Select(m => m.Id).ToArray()
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to retrieve media by type", details = ex.Message });
            }
        }

        // GET: api/media/{id}/export
        [HttpGet("{id:guid}/export")]
        public async Task<IActionResult> ExportMediaItem(Guid id)
        {
            try
            {
                var mediaItem = await _context.MediaItems
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .Include(m => m.Mixlists)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (mediaItem == null)
                {
                    return NotFound($"Media item with ID {id} not found.");
                }

                var csvData = new List<object>
                {
                    new
                    {
                        Id = mediaItem.Id,
                        Title = mediaItem.Title,
                        MediaType = mediaItem.MediaType.ToString(),
                        Link = mediaItem.Link ?? "",
                        Notes = mediaItem.Notes ?? "",
                        DateAdded = mediaItem.DateAdded.ToString("yyyy-MM-dd"),
                        Status = mediaItem.Status.ToString(),
                        DateCompleted = mediaItem.DateCompleted?.ToString("yyyy-MM-dd") ?? "",
                        Rating = mediaItem.Rating?.ToString() ?? "",
                        OwnershipStatus = mediaItem.OwnershipStatus?.ToString() ?? "",
                        Description = mediaItem.Description ?? "",
                        RelatedNotes = mediaItem.RelatedNotes ?? "",
                        Thumbnail = mediaItem.Thumbnail ?? "",
                        Topics = string.Join(";", mediaItem.Topics.Select(t => t.Name)),
                        Genres = string.Join(";", mediaItem.Genres.Select(g => g.Name)),
                        MixlistIds = string.Join(";", mediaItem.Mixlists.Select(m => m.Id))
                    }
                };

                using var writer = new StringWriter();
                using var csv = new CsvHelper.CsvWriter(writer, CultureInfo.InvariantCulture);
                
                csv.WriteRecords(csvData);
                
                var csvContent = writer.ToString();
                var fileName = $"media-item-{mediaItem.Title.Replace(" ", "-")}-{DateTime.Now:yyyyMMdd}.csv";
                
                return File(Encoding.UTF8.GetBytes(csvContent), "text/csv", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to export media item", details = ex.Message });
            }
        }

        // GET: api/media/export
        [HttpGet("export")]
        public async Task<IActionResult> ExportAllMedia()
        {
            try
            {
                var mediaItems = await _context.MediaItems
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .Include(m => m.Mixlists)
                    .ToListAsync();

                var csvData = mediaItems.Select(item => new
                {
                    Id = item.Id,
                    Title = item.Title,
                    MediaType = item.MediaType.ToString(),
                    Link = item.Link ?? "",
                    Notes = item.Notes ?? "",
                    DateAdded = item.DateAdded.ToString("yyyy-MM-dd"),
                    Status = item.Status.ToString(),
                    DateCompleted = item.DateCompleted?.ToString("yyyy-MM-dd") ?? "",
                    Rating = item.Rating?.ToString() ?? "",
                    OwnershipStatus = item.OwnershipStatus?.ToString() ?? "",
                    Description = item.Description ?? "",
                    RelatedNotes = item.RelatedNotes ?? "",
                    Thumbnail = item.Thumbnail ?? "",
                    Topics = string.Join(";", item.Topics.Select(t => t.Name)),
                    Genres = string.Join(";", item.Genres.Select(g => g.Name)),
                    MixlistIds = string.Join(";", item.Mixlists.Select(m => m.Id))
                }).ToList();

                using var writer = new StringWriter();
                using var csv = new CsvHelper.CsvWriter(writer, CultureInfo.InvariantCulture);
                
                csv.WriteRecords(csvData);
                
                var csvContent = writer.ToString();
                var fileName = $"all-media-{DateTime.Now:yyyyMMdd}.csv";
                
                return File(Encoding.UTF8.GetBytes(csvContent), "text/csv", fileName);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to export media items", details = ex.Message });
            }
        }
    }
}