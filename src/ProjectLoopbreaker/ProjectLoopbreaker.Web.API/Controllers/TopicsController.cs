using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Web.API.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TopicsController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;

        public TopicsController(MediaLibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/topics
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TopicResponseDto>>> GetAllTopics()
        {
            var topics = await _context.Topics
                .Include(t => t.MediaItems)
                .OrderBy(t => t.Name)
                .ToListAsync();
                
            var response = topics.Select(t => new TopicResponseDto
            {
                Id = t.Id,
                Name = t.Name,
                MediaItemIds = t.MediaItems.Select(m => m.Id).ToArray()
            }).ToList();
            
            return Ok(response);
        }

        // GET: api/topics/search?query={query}
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<TopicResponseDto>>> SearchTopics([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAllTopics();
            }

            var topics = await _context.Topics
                .Include(t => t.MediaItems)
                .Where(t => t.Name.Contains(query))
                .OrderBy(t => t.Name)
                .ToListAsync();
                
            var response = topics.Select(t => new TopicResponseDto
            {
                Id = t.Id,
                Name = t.Name,
                MediaItemIds = t.MediaItems.Select(m => m.Id).ToArray()
            }).ToList();
            
            return Ok(response);
        }

        // GET: api/topics/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<TopicResponseDto>> GetTopic(Guid id)
        {
            var topic = await _context.Topics
                .Include(t => t.MediaItems)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound($"Topic with ID {id} not found.");
            }

            var response = new TopicResponseDto
            {
                Id = topic.Id,
                Name = topic.Name,
                MediaItemIds = topic.MediaItems.Select(m => m.Id).ToArray()
            };

            return Ok(response);
        }

        // POST: api/topics
        [HttpPost]
        public async Task<ActionResult<TopicResponseDto>> CreateTopic([FromBody] CreateTopicDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Topic name is required.");
            }

            var normalizedTopicName = dto.Name.Trim().ToLowerInvariant();

            // Check if topic already exists
            var existingTopic = await _context.Topics
                .Include(t => t.MediaItems)
                .FirstOrDefaultAsync(t => t.Name == normalizedTopicName);

            if (existingTopic != null)
            {
                var existingResponse = new TopicResponseDto
                {
                    Id = existingTopic.Id,
                    Name = existingTopic.Name,
                    MediaItemIds = existingTopic.MediaItems.Select(m => m.Id).ToArray()
                };
                return Ok(existingResponse);
            }

            var topic = new Topic { Name = normalizedTopicName };
            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();

            var response = new TopicResponseDto
            {
                Id = topic.Id,
                Name = topic.Name,
                MediaItemIds = Array.Empty<Guid>()
            };

            return CreatedAtAction(nameof(GetTopic), new { id = topic.Id }, response);
        }

        // DELETE: api/topics/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTopic(Guid id)
        {
            var topic = await _context.Topics
                .Include(t => t.MediaItems)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound($"Topic with ID {id} not found.");
            }

            if (topic.MediaItems?.Any() == true)
            {
                return BadRequest($"Cannot delete topic '{topic.Name}' because it is associated with {topic.MediaItems.Count} media items.");
            }

            _context.Topics.Remove(topic);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }


}
