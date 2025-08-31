using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Infrastructure.Clients;
using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;
using ProjectLoopbreaker.DTOs;
using System.Text.Json;
using Amazon.S3;
using Amazon.S3.Model;
using System.Linq;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly IBookMappingService _bookMappingService;
        private readonly ILogger<BookController> _logger;
        private readonly OpenLibraryApiClient _openLibraryClient;
        private readonly IAmazonS3? _s3Client;
        private readonly IConfiguration _configuration;

        public BookController(
            IBookService bookService,
            IBookMappingService bookMappingService,
            ILogger<BookController> logger,
            OpenLibraryApiClient openLibraryClient,
            IAmazonS3? s3Client,
            IConfiguration configuration)
        {
            _bookService = bookService;
            _bookMappingService = bookMappingService;
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
                var books = await _bookService.GetAllBooksAsync();
                var response = await Task.WhenAll(books.Select(b => _bookMappingService.MapToResponseDtoAsync(b)));
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
                var book = await _bookService.GetBookByIdAsync(id);
                if (book == null)
                {
                    return NotFound($"Book with ID {id} not found.");
                }

                var response = await _bookMappingService.MapToResponseDtoAsync(book);
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
                var books = await _bookService.GetBooksByAuthorAsync(author);
                var response = await Task.WhenAll(books.Select(b => _bookMappingService.MapToResponseDtoAsync(b)));
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
                var seriesBooks = await _bookService.GetBookSeriesAsync();
                var response = await Task.WhenAll(seriesBooks.Select(b => _bookMappingService.MapToResponseDtoAsync(b)));
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

                var book = await _bookService.CreateBookAsync(dto);
                var response = await _bookMappingService.MapToResponseDtoAsync(book);

                return CreatedAtAction(nameof(GetBook), new { id = book.Id }, response);
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
                var book = await _bookService.UpdateBookAsync(id, dto);
                return NoContent();
            }
            catch (InvalidOperationException ex) when (ex.Message.Contains("not found"))
            {
                return NotFound($"Book with ID {id} not found.");
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
                var deleted = await _bookService.DeleteBookAsync(id);
                if (!deleted)
                {
                    return NotFound($"Book with ID {id} not found.");
                }

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

                var results = await Task.WhenAll(searchResult.Docs.Select(book => _bookMappingService.MapToSearchResultDtoAsync(book)));

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

                // Create book entity from Open Library data using mapping service
                var book = await _bookMappingService.MapFromOpenLibraryAsync(bookData);
                
                // Update thumbnail with uploaded version if available
                if (!string.IsNullOrEmpty(uploadedCoverUrl))
                {
                    book.Thumbnail = uploadedCoverUrl;
                }

                // Use the book service to create the book
                var createdBook = await _bookService.CreateBookAsync(new CreateBookDto
                {
                    Title = book.Title,
                    Author = book.Author,
                    Description = book.Description,
                    Link = book.Link,
                    Thumbnail = book.Thumbnail,
                    ISBN = book.ISBN,
                    Format = book.Format,
                    PartOfSeries = book.PartOfSeries,
                    Status = book.Status,
                    Rating = book.Rating,
                    OwnershipStatus = book.OwnershipStatus,
                    Notes = book.Notes,
                    RelatedNotes = book.RelatedNotes,
                    Genres = book.Genres?.Select(g => g.Name).ToArray() ?? Array.Empty<string>()
                });

                _logger.LogInformation("Successfully imported book from Open Library: {Title} by {Author}", book.Title, book.Author);

                var responseDto = await _bookMappingService.MapToResponseDtoAsync(createdBook);
                return CreatedAtAction(nameof(GetBook), new { id = createdBook.Id }, responseDto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while importing book from Open Library");
                return StatusCode(500, new { error = "Failed to import book from Open Library", details = ex.Message });
            }
        }


    }
}
