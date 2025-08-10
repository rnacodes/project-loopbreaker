using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Web.API.DTOs;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;
        private readonly ILogger<BookController> _logger;

        public BookController(
            MediaLibraryDbContext context,
            ILogger<BookController> logger)
        {
            _context = context;
            _logger = logger;
        }

        // GET: api/book
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BookResponseDto>>> GetAllBooks()
        {
            try
            {
                var books = await _context.Books.ToListAsync();
                
                var response = books.Select(b => new BookResponseDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    MediaType = b.MediaType,
                    Status = b.Status,
                    DateAdded = b.DateAdded,
                    Link = b.Link,
                    Thumbnail = b.Thumbnail,
                    Author = b.Author,
                    ISBN = b.ISBN,
                    ASIN = b.ASIN,
                    Format = b.Format,
                    PartOfSeries = b.PartOfSeries,
                    Rating = b.Rating,
                    OwnershipStatus = b.OwnershipStatus,
                    DateCompleted = b.DateCompleted,
                    Notes = b.Notes,
                    RelatedNotes = b.RelatedNotes,
                    Genre = b.Genre
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving all books");
                return StatusCode(500, new { error = "Failed to retrieve books", details = ex.Message });
            }
        }

        // GET: api/book/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<BookResponseDto>> GetBook(Guid id)
        {
            try
            {
                var book = await _context.Books
                    .Include(b => b.Topics)
                    .Include(b => b.Genres)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (book == null)
                {
                    return NotFound($"Book with ID {id} not found.");
                }

                var response = new BookResponseDto
                {
                    Id = book.Id,
                    Title = book.Title,
                    Description = book.Description,
                    MediaType = book.MediaType,
                    Status = book.Status,
                    DateAdded = book.DateAdded,
                    Link = book.Link,
                    Thumbnail = book.Thumbnail,
                    Author = book.Author,
                    ISBN = book.ISBN,
                    ASIN = book.ASIN,
                    Format = book.Format,
                    PartOfSeries = book.PartOfSeries,
                    Rating = book.Rating,
                    OwnershipStatus = book.OwnershipStatus,
                    DateCompleted = book.DateCompleted,
                    Notes = book.Notes,
                    RelatedNotes = book.RelatedNotes,
                    Genre = book.Genre
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving book with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to retrieve book", details = ex.Message });
            }
        }

        // GET: api/book/by-author/{author}
        [HttpGet("by-author/{author}")]
        public async Task<ActionResult<IEnumerable<BookResponseDto>>> GetBooksByAuthor(string author)
        {
            try
            {
                var books = await _context.Books
                    .Where(b => b.Author.ToLower().Contains(author.ToLower()))
                    .ToListAsync();

                var response = books.Select(b => new BookResponseDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    MediaType = b.MediaType,
                    Status = b.Status,
                    DateAdded = b.DateAdded,
                    Link = b.Link,
                    Thumbnail = b.Thumbnail,
                    Author = b.Author,
                    ISBN = b.ISBN,
                    ASIN = b.ASIN,
                    Format = b.Format,
                    PartOfSeries = b.PartOfSeries,
                    Rating = b.Rating,
                    OwnershipStatus = b.OwnershipStatus,
                    DateCompleted = b.DateCompleted,
                    Notes = b.Notes,
                    RelatedNotes = b.RelatedNotes,
                    Genre = b.Genre
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving books by author: {Author}", author);
                return StatusCode(500, new { error = "Failed to retrieve books by author", details = ex.Message });
            }
        }

        // GET: api/book/series
        [HttpGet("series")]
        public async Task<ActionResult<IEnumerable<BookResponseDto>>> GetBookSeries()
        {
            try
            {
                var seriesBooks = await _context.Books
                    .Where(b => b.PartOfSeries == true)
                    .ToListAsync();

                var response = seriesBooks.Select(b => new BookResponseDto
                {
                    Id = b.Id,
                    Title = b.Title,
                    Description = b.Description,
                    MediaType = b.MediaType,
                    Status = b.Status,
                    DateAdded = b.DateAdded,
                    Link = b.Link,
                    Thumbnail = b.Thumbnail,
                    Author = b.Author,
                    ISBN = b.ISBN,
                    ASIN = b.ASIN,
                    Format = b.Format,
                    PartOfSeries = b.PartOfSeries,
                    Rating = b.Rating,
                    OwnershipStatus = b.OwnershipStatus,
                    DateCompleted = b.DateCompleted,
                    Notes = b.Notes,
                    RelatedNotes = b.RelatedNotes,
                    Genre = b.Genre
                }).ToList();

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving book series");
                return StatusCode(500, new { error = "Failed to retrieve book series", details = ex.Message });
            }
        }

        // POST: api/book
        [HttpPost]
        public async Task<IActionResult> CreateBook([FromBody] CreateBookDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest("Book data is required");
                }

                var book = new Book
                {
                    Title = dto.Title,
                    MediaType = MediaType.Book,
                    Link = dto.Link,
                    Notes = dto.Notes,
                    Status = dto.Status,
                    DateAdded = DateTime.UtcNow,
                    DateCompleted = dto.DateCompleted,
                    Rating = dto.Rating,
                    OwnershipStatus = dto.OwnershipStatus,
                    Description = dto.Description,
                    Genre = dto.Genre,
                    RelatedNotes = dto.RelatedNotes,
                    Thumbnail = dto.Thumbnail,
                    Author = dto.Author,
                    ISBN = dto.ISBN,
                    ASIN = dto.ASIN,
                    Format = dto.Format,
                    PartOfSeries = dto.PartOfSeries
                };

                // Handle Topics array conversion - check if they exist or create new ones
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == topicName);
                        if (existingTopic != null)
                        {
                            book.Topics.Add(existingTopic);
                        }
                        else
                        {
                            book.Topics.Add(new Topic { Name = topicName });
                        }
                    }
                }

                // Handle Genres array conversion - check if they exist or create new ones
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == genreName);
                        if (existingGenre != null)
                        {
                            book.Genres.Add(existingGenre);
                        }
                        else
                        {
                            book.Genres.Add(new Genre { Name = genreName });
                        }
                    }
                }

                _context.Books.Add(book);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetBook), new { id = book.Id }, book);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating book");
                return StatusCode(500, new { error = "Failed to create book", details = ex.Message });
            }
        }

        // PUT: api/book/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBook(Guid id, [FromBody] CreateBookDto dto)
        {
            try
            {
                var book = await _context.Books
                    .Include(b => b.Topics)
                    .Include(b => b.Genres)
                    .FirstOrDefaultAsync(b => b.Id == id);

                if (book == null)
                {
                    return NotFound($"Book with ID {id} not found.");
                }

                // Update book properties
                book.Title = dto.Title;
                book.Link = dto.Link;
                book.Notes = dto.Notes;
                book.Status = dto.Status;
                book.DateCompleted = dto.DateCompleted;
                book.Rating = dto.Rating;
                book.OwnershipStatus = dto.OwnershipStatus;
                book.Description = dto.Description;
                book.Genre = dto.Genre;
                book.RelatedNotes = dto.RelatedNotes;
                book.Thumbnail = dto.Thumbnail;
                book.Author = dto.Author;
                book.ISBN = dto.ISBN;
                book.ASIN = dto.ASIN;
                book.Format = dto.Format;
                book.PartOfSeries = dto.PartOfSeries;

                // Clear existing topics and genres
                book.Topics.Clear();
                book.Genres.Clear();

                // Handle Topics array conversion
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == topicName);
                        if (existingTopic != null)
                        {
                            book.Topics.Add(existingTopic);
                        }
                        else
                        {
                            book.Topics.Add(new Topic { Name = topicName });
                        }
                    }
                }

                // Handle Genres array conversion
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == genreName);
                        if (existingGenre != null)
                        {
                            book.Genres.Add(existingGenre);
                        }
                        else
                        {
                            book.Genres.Add(new Genre { Name = genreName });
                        }
                    }
                }

                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating book with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to update book", details = ex.Message });
            }
        }

        // DELETE: api/book/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBook(Guid id)
        {
            try
            {
                var book = await _context.Books.FindAsync(id);
                if (book == null)
                {
                    return NotFound($"Book with ID {id} not found.");
                }

                _context.Books.Remove(book);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting book with ID {Id}", id);
                return StatusCode(500, new { error = "Failed to delete book", details = ex.Message });
            }
        }
    }
}
