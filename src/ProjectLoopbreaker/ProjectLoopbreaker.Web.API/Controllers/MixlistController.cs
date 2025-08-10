using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Web.API.DTOs;
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
        public async Task<ActionResult<IEnumerable<MixlistResponseDto>>> GetAllMixlists()
        {
            try
            {
                var mixlists = await _context.Mixlists
                    .Include(m => m.MediaItems)
                    .ToListAsync();
                    
                var response = mixlists.Select(mixlist => new MixlistResponseDto
                {
                    Id = mixlist.Id,
                    Name = mixlist.Name,
                    Description = mixlist.Description,
                    DateCreated = mixlist.DateCreated,
                    Thumbnail = mixlist.Thumbnail,
                    MediaItemIds = mixlist.MediaItems.Select(mi => mi.Id).ToArray(),
                    MediaItems = mixlist.MediaItems.Select(mi => new MediaItemSummary
                    {
                        Id = mi.Id,
                        Title = mi.Title,
                        MediaType = mi.MediaType,
                        Thumbnail = mi.Thumbnail
                    }).ToArray()
                }).ToList();
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        // GET: api/mixlist/{id}
        [HttpGet("{id:guid}")]
        public async Task<ActionResult<MixlistResponseDto>> GetMixlist(Guid id)
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

                var response = new MixlistResponseDto
                {
                    Id = mixlist.Id,
                    Name = mixlist.Name,
                    Description = mixlist.Description,
                    DateCreated = mixlist.DateCreated,
                    Thumbnail = mixlist.Thumbnail,
                    MediaItemIds = mixlist.MediaItems.Select(mi => mi.Id).ToArray(),
                    MediaItems = mixlist.MediaItems.Select(mi => new MediaItemSummary
                    {
                        Id = mi.Id,
                        Title = mi.Title,
                        MediaType = mi.MediaType,
                        Thumbnail = mi.Thumbnail
                    }).ToArray()
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { error = "Internal server error", details = ex.Message });
            }
        }

        // POST: api/mixlist
        [HttpPost]
        public async Task<ActionResult<MixlistResponseDto>> CreateMixlist([FromBody] CreateMixlistDto dto)
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

            var response = new MixlistResponseDto
            {
                Id = mixlist.Id,
                Name = mixlist.Name,
                Description = mixlist.Description,
                DateCreated = mixlist.DateCreated,
                Thumbnail = mixlist.Thumbnail,
                MediaItemIds = Array.Empty<Guid>(),
                MediaItems = Array.Empty<MediaItemSummary>()
            };

            return CreatedAtAction(nameof(GetMixlist), new { id = mixlist.Id }, response);
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


}
