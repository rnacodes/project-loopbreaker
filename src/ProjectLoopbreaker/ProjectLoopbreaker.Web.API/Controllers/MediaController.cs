using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure; // To access the DbContext
using ProjectLoopbreaker.DTOs;
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
        private readonly IHttpClientFactory _httpClientFactory;

        public MediaController(Infrastructure.Data.MediaLibraryDbContext context, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
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
                MediaType.Article => await CreateArticleAsync(dto),
                MediaType.Podcast => await CreatePodcastAsync(dto),
                MediaType.Video => await CreateVideoAsync(dto),
                MediaType.Movie => await CreateMovieAsync(dto),
                MediaType.TVShow => await CreateTvShowAsync(dto),
                MediaType.Book => await CreateBookAsync(dto),
                // For any other types, return an error
                _ => throw new NotSupportedException($"Media type '{dto.MediaType}' is not yet supported. Please implement a concrete class for this media type.")
            };

            _context.Add(mediaItem);
            await _context.SaveChangesAsync();

            // Reload the entity with includes to properly serialize topics and genres
            var createdMediaItem = await _context.MediaItems
                .Include(m => m.Topics)
                .Include(m => m.Genres)
                .Include(m => m.Mixlists)
                .FirstOrDefaultAsync(m => m.Id == mediaItem.Id);

            var response = new MediaItemResponseDto
            {
                Id = createdMediaItem!.Id,
                Title = createdMediaItem.Title,
                MediaType = createdMediaItem.MediaType,
                Link = createdMediaItem.Link,
                Notes = createdMediaItem.Notes,
                DateAdded = createdMediaItem.DateAdded,
                Status = createdMediaItem.Status,
                DateCompleted = createdMediaItem.DateCompleted,
                Rating = createdMediaItem.Rating,
                OwnershipStatus = createdMediaItem.OwnershipStatus,
                Description = createdMediaItem.Description,
                RelatedNotes = createdMediaItem.RelatedNotes,
                Thumbnail = createdMediaItem.Thumbnail,
                Topics = createdMediaItem.Topics.Select(t => t.Name).ToArray(),
                Genres = createdMediaItem.Genres.Select(g => g.Name).ToArray(),
                MixlistIds = createdMediaItem.Mixlists.Select(m => m.Id).ToArray()
            };

            // Return the created item, including its new ID
            return CreatedAtAction(nameof(GetMediaItem), new { id = mediaItem.Id }, response);
        }

        /// <summary>
        /// Helper method to add Topics to a media item ensuring proper EF Core change tracking
        /// </summary>
        private async Task AddTopicsToMediaItemAsync(BaseMediaItem mediaItem, string[] topicNames)
        {
            if (topicNames == null || topicNames.Length == 0)
                return;

            foreach (var topicName in topicNames.Where(t => !string.IsNullOrWhiteSpace(t)))
            {
                var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                
                // Check if topic exists using AsNoTracking to avoid tracking conflicts
                var existingTopic = await _context.Topics
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                
                if (existingTopic == null)
                {
                    // Create new topic
                    existingTopic = new Topic { Name = normalizedTopicName };
                    _context.Topics.Add(existingTopic);
                    await _context.SaveChangesAsync();
                }
                
                // Get tracked version and add to media item
                var trackedTopic = await _context.Topics.FindAsync(existingTopic.Id);
                if (trackedTopic != null && !mediaItem.Topics.Any(t => t.Id == trackedTopic.Id))
                {
                    mediaItem.Topics.Add(trackedTopic);
                }
            }
        }

        /// <summary>
        /// Helper method to add Genres to a media item ensuring proper EF Core change tracking
        /// </summary>
        private async Task AddGenresToMediaItemAsync(BaseMediaItem mediaItem, string[] genreNames)
        {
            if (genreNames == null || genreNames.Length == 0)
                return;

            foreach (var genreName in genreNames.Where(g => !string.IsNullOrWhiteSpace(g)))
            {
                var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                
                // Check if genre exists using AsNoTracking to avoid tracking conflicts
                var existingGenre = await _context.Genres
                    .AsNoTracking()
                    .FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                
                if (existingGenre == null)
                {
                    // Create new genre
                    existingGenre = new Genre { Name = normalizedGenreName };
                    _context.Genres.Add(existingGenre);
                    await _context.SaveChangesAsync();
                }
                
                // Get tracked version and add to media item
                var trackedGenre = await _context.Genres.FindAsync(existingGenre.Id);
                if (trackedGenre != null && !mediaItem.Genres.Any(g => g.Id == trackedGenre.Id))
                {
                    mediaItem.Genres.Add(trackedGenre);
                }
            }
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

            // Use helper methods to add Topics and Genres with proper change tracking
            await AddTopicsToMediaItemAsync(podcast, dto.Topics);
            await AddGenresToMediaItemAsync(podcast, dto.Genres);

            return podcast;
        }

        private async Task<Video> CreateVideoAsync(CreateMediaItemDto dto)
        {
            var video = new Video
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
                Platform = "YouTube", // Default platform for videos created via MediaController
                ChannelName = null, // Will be set by frontend or YouTube import
                VideoType = VideoType.Series // Default to Series for now
            };

            // Use helper methods to add Topics and Genres with proper change tracking
            await AddTopicsToMediaItemAsync(video, dto.Topics);
            await AddGenresToMediaItemAsync(video, dto.Genres);

            return video;
        }

        private async Task<Article> CreateArticleAsync(CreateMediaItemDto dto)
        {
            var article = new Article
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
                OriginalUrl = dto.Link, // Use Link as OriginalUrl for basic articles
                ReadingProgress = 0.0,
                IsStarred = false,
                IsArchived = false
            };

            // Use helper methods to add Topics and Genres with proper change tracking
            await AddTopicsToMediaItemAsync(article, dto.Topics);
            await AddGenresToMediaItemAsync(article, dto.Genres);

            return article;
        }

        private async Task<Movie> CreateMovieAsync(CreateMediaItemDto dto)
        {
            var movie = new Movie
            {
                Title = dto.Title,
                MediaType = MediaType.Movie,
                Link = dto.Link,
                Notes = dto.Notes,
                Status = dto.Status,
                DateAdded = DateTime.UtcNow,
                DateCompleted = dto.DateCompleted?.ToUniversalTime(),
                Rating = dto.Rating,
                OwnershipStatus = dto.OwnershipStatus,
                Description = dto.Description,
                RelatedNotes = dto.RelatedNotes,
                Thumbnail = dto.Thumbnail
            };

            // Use helper methods to add Topics and Genres with proper change tracking
            await AddTopicsToMediaItemAsync(movie, dto.Topics);
            await AddGenresToMediaItemAsync(movie, dto.Genres);

            return movie;
        }

        private async Task<TvShow> CreateTvShowAsync(CreateMediaItemDto dto)
        {
            var tvShow = new TvShow
            {
                Title = dto.Title,
                MediaType = MediaType.TVShow,
                Link = dto.Link,
                Notes = dto.Notes,
                Status = dto.Status,
                DateAdded = DateTime.UtcNow,
                DateCompleted = dto.DateCompleted?.ToUniversalTime(),
                Rating = dto.Rating,
                OwnershipStatus = dto.OwnershipStatus,
                Description = dto.Description,
                RelatedNotes = dto.RelatedNotes,
                Thumbnail = dto.Thumbnail
            };

            // Use helper methods to add Topics and Genres with proper change tracking
            await AddTopicsToMediaItemAsync(tvShow, dto.Topics);
            await AddGenresToMediaItemAsync(tvShow, dto.Genres);

            return tvShow;
        }

        private async Task<Book> CreateBookAsync(CreateMediaItemDto dto)
        {
            var book = new Book
            {
                Title = dto.Title,
                Author = "", // Will be set by frontend or book import
                MediaType = MediaType.Book,
                Link = dto.Link,
                Notes = dto.Notes,
                Status = dto.Status,
                DateAdded = DateTime.UtcNow,
                DateCompleted = dto.DateCompleted?.ToUniversalTime(),
                Rating = dto.Rating,
                OwnershipStatus = dto.OwnershipStatus,
                Description = dto.Description,
                RelatedNotes = dto.RelatedNotes,
                Thumbnail = dto.Thumbnail
            };

            // Use helper methods to add Topics and Genres with proper change tracking
            await AddTopicsToMediaItemAsync(book, dto.Topics);
            await AddGenresToMediaItemAsync(book, dto.Genres);

            return book;
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

                // Clear existing topics and genres and save immediately
                existingItem.Topics.Clear();
                existingItem.Genres.Clear();
                await _context.SaveChangesAsync();

                // Process topics: ensure they exist first, then create associations
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                        
                        // Check if topic exists using AsNoTracking to avoid tracking conflicts
                        var topic = await _context.Topics
                            .AsNoTracking()
                            .FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                        
                        if (topic == null)
                        {
                            // Create new topic and save immediately
                            topic = new Topic { Name = normalizedTopicName };
                            _context.Topics.Add(topic);
                            await _context.SaveChangesAsync();
                        }
                        
                        // Now attach the topic to the media item using a fresh query
                        var trackedTopic = await _context.Topics.FindAsync(topic.Id);
                        if (trackedTopic != null && !existingItem.Topics.Any(t => t.Id == trackedTopic.Id))
                        {
                            existingItem.Topics.Add(trackedTopic);
                        }
                    }
                }

                // Process genres: ensure they exist first, then create associations
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                        
                        // Check if genre exists using AsNoTracking to avoid tracking conflicts
                        var genre = await _context.Genres
                            .AsNoTracking()
                            .FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                        
                        if (genre == null)
                        {
                            // Create new genre and save immediately
                            genre = new Genre { Name = normalizedGenreName };
                            _context.Genres.Add(genre);
                            await _context.SaveChangesAsync();
                        }
                        
                        // Now attach the genre to the media item using a fresh query
                        var trackedGenre = await _context.Genres.FindAsync(genre.Id);
                        if (trackedGenre != null && !existingItem.Genres.Any(g => g.Id == trackedGenre.Id))
                        {
                            existingItem.Genres.Add(trackedGenre);
                        }
                    }
                }

                await _context.SaveChangesAsync();

                // Reload with mixlists to return complete DTO
                var updatedItem = await _context.MediaItems
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .Include(m => m.Mixlists)
                    .FirstOrDefaultAsync(m => m.Id == id);

                var response = new MediaItemResponseDto
                {
                    Id = updatedItem!.Id,
                    Title = updatedItem.Title,
                    MediaType = updatedItem.MediaType,
                    Link = updatedItem.Link,
                    Notes = updatedItem.Notes,
                    DateAdded = updatedItem.DateAdded,
                    Status = updatedItem.Status,
                    DateCompleted = updatedItem.DateCompleted,
                    Rating = updatedItem.Rating,
                    OwnershipStatus = updatedItem.OwnershipStatus,
                    Description = updatedItem.Description,
                    RelatedNotes = updatedItem.RelatedNotes,
                    Thumbnail = updatedItem.Thumbnail,
                    Topics = updatedItem.Topics.Select(t => t.Name).ToArray(),
                    Genres = updatedItem.Genres.Select(g => g.Name).ToArray(),
                    MixlistIds = updatedItem.Mixlists.Select(m => m.Id).ToArray()
                };

                return Ok(response);
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
                var mediaItem = await _context.MediaItems
                    .Include(m => m.Mixlists)
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (mediaItem == null)
                {
                    return NotFound($"Media item with ID {id} not found.");
                }

                // Delete thumbnail from S3 if it exists
                if (!string.IsNullOrEmpty(mediaItem.Thumbnail))
                {
                    await DeleteThumbnailFromS3(mediaItem.Thumbnail);
                }

                // Remove from all mixlists
                mediaItem.Mixlists.Clear();
                mediaItem.Topics.Clear();
                mediaItem.Genres.Clear();

                _context.MediaItems.Remove(mediaItem);
                await _context.SaveChangesAsync();
                
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete media item", details = ex.Message });
            }
        }

        // DELETE: api/media/bulk
        [HttpDelete("bulk")]
        public async Task<IActionResult> BulkDeleteMediaItems([FromBody] BulkDeleteRequest request)
        {
            try
            {
                if (request.Ids == null || !request.Ids.Any())
                {
                    return BadRequest("No media IDs provided for deletion.");
                }

                var mediaItems = await _context.MediaItems
                    .Include(m => m.Mixlists)
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .Where(m => request.Ids.Contains(m.Id))
                    .ToListAsync();

                if (!mediaItems.Any())
                {
                    return NotFound("No media items found with the provided IDs.");
                }

                var deletedCount = 0;
                var thumbnailsDeletionErrors = new List<string>();

                foreach (var mediaItem in mediaItems)
                {
                    // Delete thumbnail from S3 if it exists
                    if (!string.IsNullOrEmpty(mediaItem.Thumbnail))
                    {
                        try
                        {
                            await DeleteThumbnailFromS3(mediaItem.Thumbnail);
                        }
                        catch (Exception ex)
                        {
                            thumbnailsDeletionErrors.Add($"Failed to delete thumbnail for '{mediaItem.Title}': {ex.Message}");
                        }
                    }

                    // Remove from all mixlists
                    mediaItem.Mixlists.Clear();
                    mediaItem.Topics.Clear();
                    mediaItem.Genres.Clear();

                    _context.MediaItems.Remove(mediaItem);
                    deletedCount++;
                }

                await _context.SaveChangesAsync();

                var response = new
                {
                    message = $"Successfully deleted {deletedCount} media item{(deletedCount != 1 ? "s" : "")}",
                    deletedCount = deletedCount,
                    thumbnailsDeletionErrors = thumbnailsDeletionErrors.Any() ? thumbnailsDeletionErrors : null
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to bulk delete media items", details = ex.Message });
            }
        }

        private async Task DeleteThumbnailFromS3(string thumbnailUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(thumbnailUrl))
                    return;

                // Call the UploadController's delete endpoint
                var httpClient = _httpClientFactory.CreateClient();
                httpClient.BaseAddress = new Uri(Request.Scheme + "://" + Request.Host);
                
                var response = await httpClient.DeleteAsync($"/api/upload/thumbnail?url={Uri.EscapeDataString(thumbnailUrl)}");
                
                if (!response.IsSuccessStatusCode)
                {
                    Console.WriteLine($"Failed to delete thumbnail: {thumbnailUrl}. Status: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                // Log but don't fail the entire operation if thumbnail deletion fails
                Console.WriteLine($"Error deleting thumbnail {thumbnailUrl}: {ex.Message}");
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

    public class BulkDeleteRequest
    {
        public List<Guid> Ids { get; set; } = new List<Guid>();
    }
}