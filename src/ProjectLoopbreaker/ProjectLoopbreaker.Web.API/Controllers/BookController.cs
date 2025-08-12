using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.Web.API.DTOs;
using ProjectLoopbreaker.Infrastructure.Clients;
using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;
using System.Text.Json;
using Amazon.S3;
using Amazon.S3.Model;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;
        private readonly ILogger<BookController> _logger;
        private readonly OpenLibraryApiClient _openLibraryClient;
        private readonly IAmazonS3? _s3Client;
        private readonly IConfiguration _configuration;

        public BookController(
            MediaLibraryDbContext context,
            ILogger<BookController> logger,
            OpenLibraryApiClient openLibraryClient,
            IAmazonS3? s3Client,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _openLibraryClient = openLibraryClient;
            _s3Client = s3Client;
            _configuration = configuration;
        }

        private async Task<string?> UploadImageFromUrlAsync(string? imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl) || _s3Client == null)
            {
                return imageUrl; // Return original URL if S3 not configured or URL is empty
            }

            try
            {
                // Get DigitalOcean Spaces configuration
                var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
                var bucketName = spacesConfig["BucketName"];
                var endpoint = spacesConfig["Endpoint"];

                if (string.IsNullOrEmpty(bucketName) || string.IsNullOrEmpty(endpoint))
                {
                    _logger.LogWarning("DigitalOcean Spaces configuration incomplete, keeping original image URL");
                    return imageUrl;
                }

                // Download the image from the URL
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "ProjectLoopbreaker/1.0");
                
                var response = await httpClient.GetAsync(imageUrl);
                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Failed to download image from URL {ImageUrl}: {StatusCode}", imageUrl, response.StatusCode);
                    return imageUrl;
                }

                var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
                
                // Get file extension from content type
                var extension = contentType.ToLower() switch
                {
                    "image/jpeg" => ".jpg",
                    "image/jpg" => ".jpg", 
                    "image/png" => ".png",
                    "image/gif" => ".gif",
                    "image/webp" => ".webp",
                    _ => ".jpg"
                };

                // Generate a unique file name
                var uniqueFileName = $"thumbnails/books_{Guid.NewGuid()}{extension}";

                // Upload to DigitalOcean Spaces
                using var imageStream = await response.Content.ReadAsStreamAsync();
                
                var uploadRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = uniqueFileName,
                    InputStream = imageStream,
                    ContentType = contentType,
                    CannedACL = S3CannedACL.PublicRead // Make the file publicly accessible
                };

                await _s3Client.PutObjectAsync(uploadRequest);

                // Construct the public URL
                var publicUrl = $"https://{bucketName}.{endpoint}/{uniqueFileName}";

                _logger.LogInformation("Successfully uploaded book cover to DigitalOcean Spaces: {OriginalUrl} -> {PublicUrl}", imageUrl, publicUrl);

                return publicUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading book cover from URL {ImageUrl}, keeping original URL", imageUrl);
                return imageUrl; // Return original URL if upload fails
            }
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

        // GET: api/book/search-openlibrary
        [HttpGet("search-openlibrary")]
        public async Task<ActionResult<IEnumerable<BookSearchResultDto>>> SearchOpenLibrary([FromQuery] SearchBooksDto searchDto)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchDto.Query))
                {
                    return BadRequest("Search query is required");
                }

                string jsonResponse;

                switch (searchDto.SearchType)
                {
                    case BookSearchType.Title:
                        jsonResponse = await _openLibraryClient.SearchBooksByTitleAsync(searchDto.Query, searchDto.Offset, searchDto.Limit);
                        break;
                    case BookSearchType.Author:
                        jsonResponse = await _openLibraryClient.SearchBooksByAuthorAsync(searchDto.Query, searchDto.Offset, searchDto.Limit);
                        break;
                    case BookSearchType.ISBN:
                        jsonResponse = await _openLibraryClient.SearchBooksByISBNAsync(searchDto.Query);
                        break;
                    default:
                        jsonResponse = await _openLibraryClient.SearchBooksAsync(searchDto.Query, searchDto.Offset, searchDto.Limit);
                        break;
                }

                var searchResult = JsonSerializer.Deserialize<OpenLibrarySearchResultDto>(jsonResponse);
                
                if (searchResult?.Docs == null)
                {
                    return Ok(new List<BookSearchResultDto>());
                }

                var results = searchResult.Docs.Select(book => new BookSearchResultDto
                {
                    Key = book.Key,
                    Title = book.Title,
                    Authors = book.AuthorName,
                    FirstPublishYear = book.FirstPublishYear,
                    Isbn = book.Isbn,
                    Subjects = book.Subject,
                    CoverUrl = book.CoverId.HasValue 
                        ? $"https://covers.openlibrary.org/b/id/{book.CoverId}-L.jpg" 
                        : null,
                    Publishers = book.Publisher,
                    Languages = book.Language,
                    PageCount = book.NumberOfPagesMedian,
                    AverageRating = book.RatingAverage,
                    RatingCount = book.RatingCount,
                    HasFulltext = book.HasFulltext,
                    EditionCount = book.EditionCount
                }).ToList();

                return Ok(results);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while searching Open Library for query: {Query}", searchDto.Query);
                return StatusCode(500, new { error = "Failed to search Open Library", details = ex.Message });
            }
        }

        // POST: api/book/import-from-openlibrary
        [HttpPost("import-from-openlibrary")]
        public async Task<IActionResult> ImportFromOpenLibrary([FromBody] ImportBookFromOpenLibraryDto importDto)
        {
            try
            {
                if (importDto == null)
                {
                    return BadRequest("Import data is required");
                }

                OpenLibraryBookDto? bookData = null;
                string? jsonResponse = null;

                // Try to get book data from Open Library
                if (!string.IsNullOrWhiteSpace(importDto.OpenLibraryKey))
                {
                    // Get book by Open Library key
                    try
                    {
                        // Clean the Open Library key by removing the /works/ prefix if present
                        var cleanKey = importDto.OpenLibraryKey.Replace("/works/", "");
                        jsonResponse = await _openLibraryClient.GetBookByOpenLibraryIdAsync(cleanKey);
                        var workData = JsonSerializer.Deserialize<OpenLibraryWorkDto>(jsonResponse);
                        
                        // Convert work data to book format for consistency
                        bookData = new OpenLibraryBookDto
                        {
                            Key = workData?.Key,
                            Title = workData?.Title,
                            AuthorName = workData?.Authors?.Select(a => a.Author?.Key?.Replace("/authors/", "")).ToArray(),
                            Subject = workData?.Subjects,
                            CoverId = workData?.Covers?.FirstOrDefault()
                        };
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to get book by Open Library key: {Key}", importDto.OpenLibraryKey);
                    }
                }
                else if (!string.IsNullOrWhiteSpace(importDto.Isbn))
                {
                    // Search by ISBN
                    jsonResponse = await _openLibraryClient.SearchBooksByISBNAsync(importDto.Isbn);
                    var searchResult = JsonSerializer.Deserialize<OpenLibrarySearchResultDto>(jsonResponse);
                    bookData = searchResult?.Docs?.FirstOrDefault();
                }
                else if (!string.IsNullOrWhiteSpace(importDto.Title) && !string.IsNullOrWhiteSpace(importDto.Author))
                {
                    // Search by title and author
                    var query = $"title:{importDto.Title} author:{importDto.Author}";
                    jsonResponse = await _openLibraryClient.SearchBooksAsync(query, limit: 1);
                    var searchResult = JsonSerializer.Deserialize<OpenLibrarySearchResultDto>(jsonResponse);
                    bookData = searchResult?.Docs?.FirstOrDefault();
                }
                else if (!string.IsNullOrWhiteSpace(importDto.Title))
                {
                    // Search by title only
                    jsonResponse = await _openLibraryClient.SearchBooksByTitleAsync(importDto.Title, limit: 1);
                    var searchResult = JsonSerializer.Deserialize<OpenLibrarySearchResultDto>(jsonResponse);
                    bookData = searchResult?.Docs?.FirstOrDefault();
                }
                else
                {
                    return BadRequest("At least one of OpenLibraryKey, ISBN, or Title must be provided");
                }

                if (bookData == null)
                {
                    return NotFound("Book not found in Open Library");
                }

                // Upload cover image to DigitalOcean Spaces if available
                string? originalCoverUrl = bookData.CoverId.HasValue 
                    ? $"https://covers.openlibrary.org/b/id/{bookData.CoverId}-L.jpg" 
                    : null;
                string? uploadedCoverUrl = await UploadImageFromUrlAsync(originalCoverUrl);

                // Create book entity from Open Library data
                var book = new Book
                {
                    Title = bookData.Title ?? "Unknown Title",
                    Author = bookData.AuthorName?.FirstOrDefault() ?? "Unknown Author",
                    MediaType = MediaType.Book,
                    Status = Status.Uncharted,
                    DateAdded = DateTime.UtcNow,
                    ISBN = bookData.Isbn?.FirstOrDefault(),
                    Format = BookFormat.Digital, // Default to digital since it's from Open Library
                    PartOfSeries = false,
                    Thumbnail = uploadedCoverUrl,
                    Description = ExtractDescription(bookData),
                    Link = !string.IsNullOrWhiteSpace(bookData.Key) 
                        ? $"https://openlibrary.org{bookData.Key}" 
                        : null
                };

                // Handle subjects as genres
                if (bookData.Subject?.Length > 0)
                {
                    foreach (var subjectName in bookData.Subject.Take(5).Where(s => !string.IsNullOrWhiteSpace(s)))
                    {
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == subjectName);
                        if (existingGenre != null)
                        {
                            book.Genres.Add(existingGenre);
                        }
                        else
                        {
                            book.Genres.Add(new Genre { Name = subjectName });
                        }
                    }
                }

                _context.Books.Add(book);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully imported book from Open Library: {Title} by {Author}", book.Title, book.Author);

                return CreatedAtAction(nameof(GetBook), new { id = book.Id }, new BookResponseDto
                {
                    Id = book.Id,
                    Title = book.Title,
                    Author = book.Author,
                    Description = book.Description,
                    MediaType = book.MediaType,
                    Status = book.Status,
                    DateAdded = book.DateAdded,
                    Link = book.Link,
                    Thumbnail = book.Thumbnail,
                    ISBN = book.ISBN,
                    Format = book.Format,
                    PartOfSeries = book.PartOfSeries,
                    Rating = book.Rating,
                    OwnershipStatus = book.OwnershipStatus,
                    DateCompleted = book.DateCompleted,
                    Notes = book.Notes,
                    RelatedNotes = book.RelatedNotes,
                    Genre = book.Genre
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while importing book from Open Library");
                return StatusCode(500, new { error = "Failed to import book from Open Library", details = ex.Message });
            }
        }

        private static string? ExtractDescription(OpenLibraryBookDto bookData)
        {
            // Open Library search results don't typically include descriptions
            // This is a placeholder for future enhancement
            if (bookData.Subject?.Length > 0)
            {
                return $"Subjects: {string.Join(", ", bookData.Subject.Take(3))}";
            }
            return null;
        }
    }
}
