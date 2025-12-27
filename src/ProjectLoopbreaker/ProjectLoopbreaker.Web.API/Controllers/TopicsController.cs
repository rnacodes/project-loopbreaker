using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.DTOs;
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;

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
            try
            {
                var topics = await _context.Topics
                    .AsNoTracking()
                    .OrderBy(t => t.Name)
                    .ToListAsync();
                
                // Load media items separately to avoid discriminator issues
                var response = new List<TopicResponseDto>();
                foreach (var topic in topics)
                {
                    // Get media item IDs directly without loading full entities
                    var mediaItemIds = await _context.Database
                        .SqlQueryRaw<Guid>(@"
                            SELECT mi.""Id"" 
                            FROM ""MediaItems"" mi
                            INNER JOIN ""MediaItemTopics"" mit ON mi.""Id"" = mit.""MediaItemId""
                            WHERE mit.""TopicId"" = {0}", topic.Id)
                        .ToListAsync();
                    
                    response.Add(new TopicResponseDto
                    {
                        Id = topic.Id,
                        Name = topic.Name,
                        MediaItemIds = mediaItemIds.ToArray()
                    });
                }
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetAllTopics: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                return StatusCode(500, new { error = "Failed to retrieve topics", details = ex.Message });
            }
        }

        // GET: api/topics/search?query={query}
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<TopicResponseDto>>> SearchTopics([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAllTopics();
            }

            try
            {
                var normalizedQuery = query.ToLowerInvariant();
                var topics = await _context.Topics
                    .AsNoTracking()
                    .Where(t => EF.Functions.ILike(t.Name, $"%{normalizedQuery}%"))
                    .OrderBy(t => t.Name)
                    .ToListAsync();
                
                // Load media items separately to avoid discriminator issues
                var response = new List<TopicResponseDto>();
                foreach (var topic in topics)
                {
                    // Get media item IDs directly without loading full entities
                    var mediaItemIds = await _context.Database
                        .SqlQueryRaw<Guid>(@"
                            SELECT mi.""Id"" 
                            FROM ""MediaItems"" mi
                            INNER JOIN ""MediaItemTopics"" mit ON mi.""Id"" = mit.""MediaItemId""
                            WHERE mit.""TopicId"" = {0}", topic.Id)
                        .ToListAsync();
                    
                    response.Add(new TopicResponseDto
                    {
                        Id = topic.Id,
                        Name = topic.Name,
                        MediaItemIds = mediaItemIds.ToArray()
                    });
                }
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in SearchTopics: {ex.Message}");
                return StatusCode(500, new { error = "Failed to search topics", details = ex.Message });
            }
        }

        // GET: api/topics/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<TopicResponseDto>> GetTopic(Guid id)
        {
            try
            {
                var topic = await _context.Topics
                    .AsNoTracking()
                    .FirstOrDefaultAsync(t => t.Id == id);

                if (topic == null)
                {
                    return NotFound($"Topic with ID {id} not found.");
                }

                    // Get media item IDs directly without loading full entities
                    var mediaItemIds = await _context.Database
                        .SqlQueryRaw<Guid>(@"
                            SELECT mi.""Id"" 
                            FROM ""MediaItems"" mi
                            INNER JOIN ""MediaItemTopics"" mit ON mi.""Id"" = mit.""MediaItemId""
                            WHERE mit.""TopicId"" = {0}", id)
                        .ToListAsync();

                var response = new TopicResponseDto
                {
                    Id = topic.Id,
                    Name = topic.Name,
                    MediaItemIds = mediaItemIds.ToArray()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in GetTopic: {ex.Message}");
                return StatusCode(500, new { error = "Failed to retrieve topic", details = ex.Message });
            }
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
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Name == normalizedTopicName);

            if (existingTopic != null)
            {
                // Get media item IDs directly
                var mediaItemIds = await _context.Database
                    .SqlQueryRaw<Guid>(@"
                        SELECT mi.""Id"" 
                        FROM ""MediaItems"" mi
                        INNER JOIN ""MediaItemTopics"" mit ON mi.""Id"" = mit.""MediaItemId""
                        WHERE mit.""TopicId"" = {0}", existingTopic.Id)
                    .ToListAsync();
                
                var existingResponse = new TopicResponseDto
                {
                    Id = existingTopic.Id,
                    Name = existingTopic.Name,
                    MediaItemIds = mediaItemIds.ToArray()
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
                .FirstOrDefaultAsync(t => t.Id == id);

            if (topic == null)
            {
                return NotFound($"Topic with ID {id} not found.");
            }

            // The database is configured with cascade delete, so removing the topic
            // will automatically remove all associations in the MediaItemTopics join table
            _context.Topics.Remove(topic);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/topics/import/json
        [HttpPost("import/json")]
        public async Task<ActionResult<BulkImportResultDto>> ImportTopicsFromJson([FromBody] List<CreateTopicDto> topics)
        {
            var result = new BulkImportResultDto();

            if (topics == null || !topics.Any())
            {
                return BadRequest("No topics provided for import.");
            }

            foreach (var topicDto in topics)
            {
                result.TotalProcessed++;

                try
                {
                    if (string.IsNullOrWhiteSpace(topicDto.Name))
                    {
                        result.Errors.Add($"Topic at index {result.TotalProcessed - 1}: Name is required");
                        result.ErrorCount++;
                        continue;
                    }

                    var normalizedTopicName = topicDto.Name.Trim().ToLowerInvariant();

                    // Check if topic already exists
                    var existingTopic = await _context.Topics
                        .FirstOrDefaultAsync(t => t.Name == normalizedTopicName);

                    if (existingTopic != null)
                    {
                        result.Skipped.Add($"Topic '{topicDto.Name}' already exists");
                        result.SkippedCount++;
                        continue;
                    }

                    var topic = new Topic { Name = normalizedTopicName };
                    _context.Topics.Add(topic);
                    await _context.SaveChangesAsync();

                    result.Imported.Add(new TopicResponseDto
                    {
                        Id = topic.Id,
                        Name = topic.Name,
                        MediaItemIds = Array.Empty<Guid>()
                    });
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    result.Errors.Add($"Topic '{topicDto.Name}': {ex.Message}");
                    result.ErrorCount++;
                }
            }

            return Ok(result);
        }

        // POST: api/topics/import/csv
        [HttpPost("import/csv")]
        public async Task<ActionResult<BulkImportResultDto>> ImportTopicsFromCsv(IFormFile file)
        {
            var result = new BulkImportResultDto();

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded");
            }

            if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("File must be a CSV");
            }

            try
            {
                using var reader = new StreamReader(file.OpenReadStream());
                using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

                csv.Read();
                csv.ReadHeader();
                var headers = csv.HeaderRecord;

                if (headers == null || !headers.Any(h => h.Equals("Name", StringComparison.OrdinalIgnoreCase)))
                {
                    return BadRequest("CSV file must have a 'Name' column");
                }

                while (csv.Read())
                {
                    result.TotalProcessed++;

                    try
                    {
                        var name = csv.GetField("Name");

                        if (string.IsNullOrWhiteSpace(name))
                        {
                            result.Errors.Add($"Row {csv.CurrentIndex}: Name is required");
                            result.ErrorCount++;
                            continue;
                        }

                        var normalizedTopicName = name.Trim().ToLowerInvariant();

                        // Check if topic already exists
                        var existingTopic = await _context.Topics
                            .FirstOrDefaultAsync(t => t.Name == normalizedTopicName);

                        if (existingTopic != null)
                        {
                            result.Skipped.Add($"Topic '{name}' already exists");
                            result.SkippedCount++;
                            continue;
                        }

                        var topic = new Topic { Name = normalizedTopicName };
                        _context.Topics.Add(topic);
                        await _context.SaveChangesAsync();

                        result.Imported.Add(new TopicResponseDto
                        {
                            Id = topic.Id,
                            Name = topic.Name,
                            MediaItemIds = Array.Empty<Guid>()
                        });
                        result.SuccessCount++;
                    }
                    catch (Exception ex)
                    {
                        result.Errors.Add($"Row {csv.CurrentIndex}: {ex.Message}");
                        result.ErrorCount++;
                    }
                }

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error processing CSV file: {ex.Message}");
            }
        }
    }


}
