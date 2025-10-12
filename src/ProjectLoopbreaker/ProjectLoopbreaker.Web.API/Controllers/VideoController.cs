using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VideoController : ControllerBase
    {
        private readonly IVideoService _videoService;
        private readonly ILogger<VideoController> _logger;

        public VideoController(IVideoService videoService, ILogger<VideoController> logger)
        {
            _videoService = videoService;
            _logger = logger;
        }

        // GET: api/video
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VideoResponseDto>>> GetAllVideos()
        {
            try
            {
                var videos = await _videoService.GetAllVideosAsync();
                
                var response = videos.Select(v => new VideoResponseDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description,
                    MediaType = v.MediaType,
                    Status = v.Status,
                    DateAdded = v.DateAdded,
                    Link = v.Link,
                    Thumbnail = v.Thumbnail,
                    VideoType = v.VideoType,
                    ParentVideoId = v.ParentVideoId,
                    Platform = v.Platform,
                    ChannelName = v.ChannelName,
                    LengthInSeconds = v.LengthInSeconds,
                    ExternalId = v.ExternalId,
                    Rating = v.Rating,
                    OwnershipStatus = v.OwnershipStatus,
                    DateCompleted = v.DateCompleted,
                    Notes = v.Notes,
                    RelatedNotes = v.RelatedNotes,
                    Topics = v.Topics.Select(t => t.Name).ToArray(),
                    Genres = v.Genres.Select(g => g.Name).ToArray()
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving all videos");
                return StatusCode(500, new { error = "Failed to retrieve videos", details = ex.Message });
            }
        }

        // GET: api/video/series
        [HttpGet("series")]
        public async Task<ActionResult<IEnumerable<VideoResponseDto>>> GetVideoSeries()
        {
            try
            {
                var series = await _videoService.GetVideoSeriesAsync();
                
                var response = series.Select(v => new VideoResponseDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description,
                    MediaType = v.MediaType,
                    Status = v.Status,
                    DateAdded = v.DateAdded,
                    Link = v.Link,
                    Thumbnail = v.Thumbnail,
                    VideoType = v.VideoType,
                    ParentVideoId = v.ParentVideoId,
                    Platform = v.Platform,
                    ChannelName = v.ChannelName,
                    LengthInSeconds = v.LengthInSeconds,
                    ExternalId = v.ExternalId,
                    Rating = v.Rating,
                    OwnershipStatus = v.OwnershipStatus,
                    DateCompleted = v.DateCompleted,
                    Notes = v.Notes,
                    RelatedNotes = v.RelatedNotes,
                    Topics = v.Topics.Select(t => t.Name).ToArray(),
                    Genres = v.Genres.Select(g => g.Name).ToArray()
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving video series");
                return StatusCode(500, new { error = "Failed to retrieve video series", details = ex.Message });
            }
        }

        // GET: api/video/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<VideoResponseDto>> GetVideo(Guid id)
        {
            try
            {
                var video = await _videoService.GetVideoByIdAsync(id);

                if (video == null)
                {
                    return NotFound($"Video with ID {id} not found.");
                }

                var response = new VideoResponseDto
                {
                    Id = video.Id,
                    Title = video.Title,
                    Description = video.Description,
                    MediaType = video.MediaType,
                    Status = video.Status,
                    DateAdded = video.DateAdded,
                    Link = video.Link,
                    Thumbnail = video.Thumbnail,
                    VideoType = video.VideoType,
                    ParentVideoId = video.ParentVideoId,
                    Platform = video.Platform,
                    ChannelName = video.ChannelName,
                    LengthInSeconds = video.LengthInSeconds,
                    ExternalId = video.ExternalId,
                    Rating = video.Rating,
                    OwnershipStatus = video.OwnershipStatus,
                    DateCompleted = video.DateCompleted,
                    Notes = video.Notes,
                    RelatedNotes = video.RelatedNotes,
                    Topics = video.Topics.Select(t => t.Name).ToArray(),
                    Genres = video.Genres.Select(g => g.Name).ToArray()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving video with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve video", details = ex.Message });
            }
        }

        // GET: api/video/channel/{channelName}
        [HttpGet("channel/{channelName}")]
        public async Task<ActionResult<IEnumerable<VideoResponseDto>>> GetVideosByChannel(string channelName)
        {
            try
            {
                var videos = await _videoService.GetVideosByChannelAsync(channelName);
                
                var response = videos.Select(v => new VideoResponseDto
                {
                    Id = v.Id,
                    Title = v.Title,
                    Description = v.Description,
                    MediaType = v.MediaType,
                    Status = v.Status,
                    DateAdded = v.DateAdded,
                    Link = v.Link,
                    Thumbnail = v.Thumbnail,
                    VideoType = v.VideoType,
                    ParentVideoId = v.ParentVideoId,
                    Platform = v.Platform,
                    ChannelName = v.ChannelName,
                    LengthInSeconds = v.LengthInSeconds,
                    ExternalId = v.ExternalId,
                    Rating = v.Rating,
                    OwnershipStatus = v.OwnershipStatus,
                    DateCompleted = v.DateCompleted,
                    Notes = v.Notes,
                    RelatedNotes = v.RelatedNotes,
                    Topics = v.Topics.Select(t => t.Name).ToArray(),
                    Genres = v.Genres.Select(g => g.Name).ToArray()
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving videos by channel {ChannelName}", channelName);
                return StatusCode(500, new { error = "Failed to retrieve videos by channel", details = ex.Message });
            }
        }

        // POST: api/video
        [HttpPost]
        public async Task<ActionResult<VideoResponseDto>> CreateVideo([FromBody] CreateVideoDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var video = await _videoService.CreateVideoAsync(dto);

                var response = new VideoResponseDto
                {
                    Id = video.Id,
                    Title = video.Title,
                    Description = video.Description,
                    MediaType = video.MediaType,
                    Status = video.Status,
                    DateAdded = video.DateAdded,
                    Link = video.Link,
                    Thumbnail = video.Thumbnail,
                    VideoType = video.VideoType,
                    ParentVideoId = video.ParentVideoId,
                    Platform = video.Platform,
                    ChannelName = video.ChannelName,
                    LengthInSeconds = video.LengthInSeconds,
                    ExternalId = video.ExternalId,
                    Rating = video.Rating,
                    OwnershipStatus = video.OwnershipStatus,
                    DateCompleted = video.DateCompleted,
                    Notes = video.Notes,
                    RelatedNotes = video.RelatedNotes,
                    Topics = video.Topics.Select(t => t.Name).ToArray(),
                    Genres = video.Genres.Select(g => g.Name).ToArray()
                };

                return CreatedAtAction(nameof(GetVideo), new { id = video.Id }, response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating video");
                return StatusCode(500, new { error = "Failed to create video", details = ex.Message });
            }
        }

        // PUT: api/video/{id}
        [HttpPut("{id}")]
        public async Task<ActionResult<VideoResponseDto>> UpdateVideo(Guid id, [FromBody] CreateVideoDto dto)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var video = await _videoService.UpdateVideoAsync(id, dto);

                var response = new VideoResponseDto
                {
                    Id = video.Id,
                    Title = video.Title,
                    Description = video.Description,
                    MediaType = video.MediaType,
                    Status = video.Status,
                    DateAdded = video.DateAdded,
                    Link = video.Link,
                    Thumbnail = video.Thumbnail,
                    VideoType = video.VideoType,
                    ParentVideoId = video.ParentVideoId,
                    Platform = video.Platform,
                    ChannelName = video.ChannelName,
                    LengthInSeconds = video.LengthInSeconds,
                    ExternalId = video.ExternalId,
                    Rating = video.Rating,
                    OwnershipStatus = video.OwnershipStatus,
                    DateCompleted = video.DateCompleted,
                    Notes = video.Notes,
                    RelatedNotes = video.RelatedNotes,
                    Topics = video.Topics.Select(t => t.Name).ToArray(),
                    Genres = video.Genres.Select(g => g.Name).ToArray()
                };

                return Ok(response);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Video not found for update: {Id}", id);
                return NotFound($"Video with ID {id} not found");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating video with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to update video", details = ex.Message });
            }
        }

        // DELETE: api/video/{id}
        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteVideo(Guid id)
        {
            try
            {
                var result = await _videoService.DeleteVideoAsync(id);
                
                if (!result)
                {
                    return NotFound($"Video with ID {id} not found");
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting video with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to delete video", details = ex.Message });
            }
        }
    }
}
