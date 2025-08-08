using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MixlistController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;

        public MixlistController(MediaLibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/mixlist
        [HttpGet]
        public async Task<IActionResult> GetAllMixlists()
        {
            try
            {
                var mixlists = await _context.Mixlists
                    .Include(m => m.MediaItems)
                    .ToListAsync();
                return Ok(mixlists);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        // GET: api/mixlist/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetMixlist(Guid id)
        {
            try
            {
                var mixlist = await _context.Mixlists
                    .Include(m => m.MediaItems)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (mixlist == null)
                {
                    return NotFound($"Mixlist with ID {id} not found.");
                }

                return Ok(mixlist);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        // POST: api/mixlist
        [HttpPost]
        public async Task<IActionResult> CreateMixlist([FromBody] CreateMixlistDto dto)
        {
            if (dto == null)
            {
                return BadRequest("Mixlist data is null.");
            }

            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Mixlist name is required.");
            }

            var mixlist = new Mixlist
            {
                Name = dto.Name,
                Description = dto.Description,
                Thumbnail = dto.Thumbnail,
                DateCreated = DateTime.UtcNow
            };

            _context.Mixlists.Add(mixlist);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetMixlist), new { id = mixlist.Id }, mixlist);
        }

        // POST: api/mixlist/{mixlistId}/items/{mediaItemId}
        [HttpPost("{mixlistId:guid}/items/{mediaItemId:guid}")]
        public async Task<IActionResult> AddMediaItemToMixlist(Guid mixlistId, Guid mediaItemId)
        {
            try
            {
                var mixlist = await _context.Mixlists
                    .Include(m => m.MediaItems)
                    .FirstOrDefaultAsync(m => m.Id == mixlistId);

                if (mixlist == null)
                {
                    return NotFound($"Mixlist with ID {mixlistId} not found.");
                }

                var mediaItem = await _context.MediaItems
                    .Include(m => m.Mixlists)
                    .FirstOrDefaultAsync(m => m.Id == mediaItemId);

                if (mediaItem == null)
                {
                    return NotFound($"Media item with ID {mediaItemId} not found.");
                }

                // Check if the media item is already in the mixlist
                if (mixlist.MediaItems.Any(m => m.Id == mediaItemId))
                {
                    return BadRequest($"Media item with ID {mediaItemId} is already in the mixlist.");
                }

                // Add media item to mixlist
                mixlist.MediaItems.Add(mediaItem);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Media item '{mediaItem.Title}' added to mixlist '{mixlist.Name}'" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to add media item to mixlist", details = ex.Message });
            }
        }

        // DELETE: api/mixlist/{mixlistId}/items/{mediaItemId}
        [HttpDelete("{mixlistId:guid}/items/{mediaItemId:guid}")]
        public async Task<IActionResult> RemoveMediaItemFromMixlist(Guid mixlistId, Guid mediaItemId)
        {
            try
            {
                var mixlist = await _context.Mixlists
                    .Include(m => m.MediaItems)
                    .FirstOrDefaultAsync(m => m.Id == mixlistId);

                if (mixlist == null)
                {
                    return NotFound($"Mixlist with ID {mixlistId} not found.");
                }

                var mediaItem = mixlist.MediaItems.FirstOrDefault(m => m.Id == mediaItemId);
                if (mediaItem == null)
                {
                    return NotFound($"Media item with ID {mediaItemId} not found in the mixlist.");
                }

                // Remove the media item from the mixlist
                mixlist.MediaItems.Remove(mediaItem);
                await _context.SaveChangesAsync();

                return Ok(new { message = $"Media item removed from mixlist '{mixlist.Name}'" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to remove media item from mixlist", details = ex.Message });
            }
        }

        // PUT: api/mixlist/{id}
        [HttpPut("{id:guid}")]
        public async Task<IActionResult> UpdateMixlist(Guid id, [FromBody] UpdateMixlistDto dto)
        {
            try
            {
                var mixlist = await _context.Mixlists.FindAsync(id);
                if (mixlist == null)
                {
                    return NotFound($"Mixlist with ID {id} not found.");
                }

                // Update properties
                if (!string.IsNullOrWhiteSpace(dto.Name))
                    mixlist.Name = dto.Name;
                
                if (dto.Description != null)
                    mixlist.Description = dto.Description;
                
                if (dto.Thumbnail != null)
                    mixlist.Thumbnail = dto.Thumbnail;

                await _context.SaveChangesAsync();
                return Ok(mixlist);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to update mixlist", details = ex.Message });
            }
        }

        // DELETE: api/mixlist/{id}
        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> DeleteMixlist(Guid id)
        {
            try
            {
                var mixlist = await _context.Mixlists.FindAsync(id);
                if (mixlist == null)
                {
                    return NotFound($"Mixlist with ID {id} not found.");
                }

                _context.Mixlists.Remove(mixlist);
                await _context.SaveChangesAsync();
                
                return Ok(new { message = $"Mixlist '{mixlist.Name}' deleted successfully." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Failed to delete mixlist", details = ex.Message });
            }
        }
    }

    // DTO classes for Mixlist operations
    public class CreateMixlistDto
    {
        public required string Name { get; set; }
        public string? Description { get; set; }
        public string? Thumbnail { get; set; }
    }

    public class UpdateMixlistDto
    {
        public string? Name { get; set; }
        public string? Description { get; set; }
        public string? Thumbnail { get; set; }
    }
}
