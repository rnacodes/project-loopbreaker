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

    // POST: api/media
    [HttpPost]
    public async Task<IActionResult> AddMediaItem([FromBody] CreateMediaItemDto dto)
    {
        if (dto == null)
        {
            return BadRequest("Media item data is null.");
        }

        var mediaItem = new BaseMediaItem
        {
            Title = dto.Title,
            MediaType = dto.MediaType,
            Link = dto.Link,
            Notes = dto.Notes,
            Consumed = dto.Consumed,
            Rating = dto.Rating
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
}