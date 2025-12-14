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
                .AsNoTracking()
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

            var normalizedQuery = query.ToLowerInvariant();
            var genres = await _context.Genres
                .Include(g => g.MediaItems)
                .Where(g => g.Name.Contains(normalizedQuery))
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
                .AsNoTracking()
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

            var normalizedGenreName = dto.Name.Trim().ToLowerInvariant();

            // Check if genre already exists
            var existingGenre = await _context.Genres
                .Include(g => g.MediaItems)
                .FirstOrDefaultAsync(g => g.Name == normalizedGenreName);

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

            var genre = new Genre { Name = normalizedGenreName };
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

        // POST: api/genres/import/json
        [HttpPost("import/json")]
        public async Task<ActionResult<BulkImportResultDto>> ImportGenresFromJson([FromBody] List<CreateGenreDto> genres)
        {
            var result = new BulkImportResultDto();

            if (genres == null || !genres.Any())
            {
                return BadRequest("No genres provided for import.");
            }

            foreach (var genreDto in genres)
            {
                result.TotalProcessed++;

                try
                {
                    if (string.IsNullOrWhiteSpace(genreDto.Name))
                    {
                        result.Errors.Add($"Genre at index {result.TotalProcessed - 1}: Name is required");
                        result.ErrorCount++;
                        continue;
                    }

                    var normalizedGenreName = genreDto.Name.Trim().ToLowerInvariant();

                    // Check if genre already exists
                    var existingGenre = await _context.Genres
                        .FirstOrDefaultAsync(g => g.Name == normalizedGenreName);

                    if (existingGenre != null)
                    {
                        result.Skipped.Add($"Genre '{genreDto.Name}' already exists");
                        result.SkippedCount++;
                        continue;
                    }

                    var genre = new Genre { Name = normalizedGenreName };
                    _context.Genres.Add(genre);
                    await _context.SaveChangesAsync();

                    result.Imported.Add(new GenreResponseDto
                    {
                        Id = genre.Id,
                        Name = genre.Name,
                        MediaItemIds = Array.Empty<Guid>()
                    });
                    result.SuccessCount++;
                }
                catch (Exception ex)
                {
                    result.Errors.Add($"Genre '{genreDto.Name}': {ex.Message}");
                    result.ErrorCount++;
                }
            }

            return Ok(result);
        }

        // POST: api/genres/import/csv
        [HttpPost("import/csv")]
        public async Task<ActionResult<BulkImportResultDto>> ImportGenresFromCsv(IFormFile file)
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

                        var normalizedGenreName = name.Trim().ToLowerInvariant();

                        // Check if genre already exists
                        var existingGenre = await _context.Genres
                            .FirstOrDefaultAsync(g => g.Name == normalizedGenreName);

                        if (existingGenre != null)
                        {
                            result.Skipped.Add($"Genre '{name}' already exists");
                            result.SkippedCount++;
                            continue;
                        }

                        var genre = new Genre { Name = normalizedGenreName };
                        _context.Genres.Add(genre);
                        await _context.SaveChangesAsync();

                        result.Imported.Add(new GenreResponseDto
                        {
                            Id = genre.Id,
                            Name = genre.Name,
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
