using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Web.API.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GenresController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;

        public GenresController(MediaLibraryDbContext context)
        {
            _context = context;
        }

        // GET: api/genres
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GenreResponseDto>>> GetAllGenres()
        {
            var genres = await _context.Genres
                .Include(g => g.MediaItems)
                .OrderBy(g => g.Name)
                .ToListAsync();
                
            var response = genres.Select(g => new GenreResponseDto
            {
                Id = g.Id,
                Name = g.Name,
                MediaItemIds = g.MediaItems.Select(m => m.Id).ToArray()
            }).ToList();
            
            return Ok(response);
        }

        // GET: api/genres/search?query={query}
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<GenreResponseDto>>> SearchGenres([FromQuery] string query)
        {
            if (string.IsNullOrWhiteSpace(query))
            {
                return await GetAllGenres();
            }

            var genres = await _context.Genres
                .Include(g => g.MediaItems)
                .Where(g => g.Name.Contains(query))
                .OrderBy(g => g.Name)
                .ToListAsync();
                
            var response = genres.Select(g => new GenreResponseDto
            {
                Id = g.Id,
                Name = g.Name,
                MediaItemIds = g.MediaItems.Select(m => m.Id).ToArray()
            }).ToList();
            
            return Ok(response);
        }

        // GET: api/genres/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<GenreResponseDto>> GetGenre(Guid id)
        {
            var genre = await _context.Genres
                .Include(g => g.MediaItems)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (genre == null)
            {
                return NotFound($"Genre with ID {id} not found.");
            }

            var response = new GenreResponseDto
            {
                Id = genre.Id,
                Name = genre.Name,
                MediaItemIds = genre.MediaItems.Select(m => m.Id).ToArray()
            };

            return Ok(response);
        }

        // POST: api/genres
        [HttpPost]
        public async Task<ActionResult<GenreResponseDto>> CreateGenre([FromBody] CreateGenreDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest("Genre name is required.");
            }

            // Check if genre already exists
            var existingGenre = await _context.Genres
                .Include(g => g.MediaItems)
                .FirstOrDefaultAsync(g => g.Name == dto.Name);

            if (existingGenre != null)
            {
                var existingResponse = new GenreResponseDto
                {
                    Id = existingGenre.Id,
                    Name = existingGenre.Name,
                    MediaItemIds = existingGenre.MediaItems.Select(m => m.Id).ToArray()
                };
                return Ok(existingResponse);
            }

            var genre = new Genre { Name = dto.Name };
            _context.Genres.Add(genre);
            await _context.SaveChangesAsync();

            var response = new GenreResponseDto
            {
                Id = genre.Id,
                Name = genre.Name,
                MediaItemIds = Array.Empty<Guid>()
            };

            return CreatedAtAction(nameof(GetGenre), new { id = genre.Id }, response);
        }

        // DELETE: api/genres/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGenre(Guid id)
        {
            var genre = await _context.Genres
                .Include(g => g.MediaItems)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (genre == null)
            {
                return NotFound($"Genre with ID {id} not found.");
            }

            if (genre.MediaItems?.Any() == true)
            {
                return BadRequest($"Cannot delete genre '{genre.Name}' because it is associated with {genre.MediaItems.Count} media items.");
            }

            _context.Genres.Remove(genre);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }


}
