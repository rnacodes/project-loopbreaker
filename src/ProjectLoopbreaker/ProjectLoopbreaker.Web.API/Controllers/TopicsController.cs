using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;

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
        public async Task<ActionResult<IEnumerable<Topic>>> GetAllTopics()
        {
            var topics = await _context.Topics
                .OrderBy(t => t.Name)
                .ToListAsync();
            return Ok(topics);
        }

        // GET: api/topics/search?query={query}
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Topic>>> SearchTopics([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAllTopics();
            }

            var topics = await _context.Topics
                .Where(t => t.Name.Contains(query))
                .OrderBy(t => t.Name)
                .ToListAsync();
            
            return Ok(topics);
        }

        // GET: api/topics/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Topic>> GetTopic(Guid id)
        {
            var topic = await _context.Topics
                .Include(t => t.MediaItems)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound($"Topic with ID {id} not found.");
            }

            return Ok(topic);
        }

        // POST: api/topics
        [HttpPost]
        public async Task<ActionResult<Topic>> CreateTopic([FromBody] CreateTopicDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Topic name is required.");
            }

            // Check if topic already exists
            var existingTopic = await _context.Topics
                .FirstOrDefaultAsync(t => t.Name == dto.Name);

            if (existingTopic != null)
            {
                return Ok(existingTopic); // Return existing topic instead of error
            }

            var topic = new Topic { Name = dto.Name };
            _context.Topics.Add(topic);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetTopic), new { id = topic.Id }, topic);
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

    public class CreateTopicDto
    {
        public required string Name { get; set; }
    }
}
