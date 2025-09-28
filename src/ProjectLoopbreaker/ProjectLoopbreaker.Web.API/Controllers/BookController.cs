using Microsoft.AspNetCore.Mvc;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;
using ProjectLoopbreaker.DTOs;
using Amazon.S3;
using Amazon.S3.Model;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookController : ControllerBase
    {
        private readonly IBookService _bookService;
        private readonly IBookMappingService _bookMappingService;
        private readonly ILogger<BookController> _logger;
        private readonly IOpenLibraryService _openLibraryService;
        private readonly IAmazonS3? _s3Client;
        private readonly IConfiguration _configuration;

        public BookController(
            IBookService bookService,
            IBookMappingService bookMappingService,
            ILogger<BookController> logger,
            IOpenLibraryService openLibraryService,
            IAmazonS3? s3Client,
            IConfiguration configuration)
        {
            _bookService = bookService;
            _bookMappingService = bookMappingService;
            _logger = logger;
            _openLibraryService = openLibraryService;
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

                OpenLibrarySearchResultDto searchResult;

                switch (searchDto.SearchType)
                {
                    case BookSearchType.Title:
                        searchResult = await _openLibraryService.SearchBooksByTitleAsync(searchDto.Query, searchDto.Offset, searchDto.Limit);
                        break;
                    case BookSearchType.Author:
                        searchResult = await _openLibraryService.SearchBooksByAuthorAsync(searchDto.Query, searchDto.Offset, searchDto.Limit);
                        break;
                    case BookSearchType.ISBN:
                        searchResult = await _openLibraryService.SearchBooksByISBNAsync(searchDto.Query);
                        break;
                    default:
                        searchResult = await _openLibraryService.SearchBooksAsync(searchDto.Query, searchDto.Offset, searchDto.Limit);
                        break;
                }
                
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

                Domain.Entities.Book createdBook;

                // Use the OpenLibrary service to import the book based on available data
                if (!string.IsNullOrWhiteSpace(importDto.OpenLibraryKey))
                {
                    createdBook = await _openLibraryService.ImportBookFromOpenLibraryKeyAsync(importDto.OpenLibraryKey);
                }
                else if (!string.IsNullOrWhiteSpace(importDto.Isbn))
                {
                    createdBook = await _openLibraryService.ImportBookFromISBNAsync(importDto.Isbn);
                }
                else if (!string.IsNullOrWhiteSpace(importDto.Title))
                {
                    createdBook = await _openLibraryService.ImportBookFromTitleAndAuthorAsync(importDto.Title, importDto.Author);
                }
                else
                {
                    return BadRequest("At least one of OpenLibraryKey, ISBN, or Title must be provided");
                }

                // Upload cover image to DigitalOcean Spaces if available and not already uploaded
                if (!string.IsNullOrEmpty(createdBook.Thumbnail) && createdBook.Thumbnail.Contains("covers.openlibrary.org"))
                {
                    string? uploadedCoverUrl = await UploadImageFromUrlAsync(createdBook.Thumbnail);
                    if (!string.IsNullOrEmpty(uploadedCoverUrl))
                    {
                        // Update the book with the uploaded thumbnail
                        await _bookService.UpdateBookAsync(createdBook.Id, new CreateBookDto
                        {
                            Title = createdBook.Title,
                            Author = createdBook.Author,
                            Description = createdBook.Description,
                            Link = createdBook.Link,
                            Thumbnail = uploadedCoverUrl,
                            ISBN = createdBook.ISBN,
                            Format = createdBook.Format,
                            PartOfSeries = createdBook.PartOfSeries,
                            Status = createdBook.Status,
                            Rating = createdBook.Rating,
                            OwnershipStatus = createdBook.OwnershipStatus,
                            Notes = createdBook.Notes,
                            RelatedNotes = createdBook.RelatedNotes,
                            Genres = createdBook.Genres?.Select(g => g.Name).ToArray() ?? Array.Empty<string>()
                        });
                        createdBook.Thumbnail = uploadedCoverUrl;
                    }
                }

                _logger.LogInformation("Successfully imported book from Open Library: {Title} by {Author}", createdBook.Title, createdBook.Author);

                var responseDto = await _bookMappingService.MapToResponseDtoAsync(createdBook);
                return CreatedAtAction(nameof(GetBook), new { id = createdBook.Id }, responseDto);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Book not found in Open Library");
                return NotFound(new { error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while importing book from Open Library");
                return StatusCode(500, new { error = "Failed to import book from Open Library", details = ex.Message });
            }
        }


    }
}
