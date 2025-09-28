using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class OpenLibraryService : IOpenLibraryService
    {
        private readonly IOpenLibraryApiClient _openLibraryApiClient;
        private readonly IBookService _bookService;
        private readonly IBookMappingService _bookMappingService;
        private readonly ILogger<OpenLibraryService> _logger;

        public OpenLibraryService(
            IOpenLibraryApiClient openLibraryApiClient,
            IBookService bookService,
            IBookMappingService bookMappingService,
            ILogger<OpenLibraryService> logger)
        {
            _openLibraryApiClient = openLibraryApiClient;
            _bookService = bookService;
            _bookMappingService = bookMappingService;
            _logger = logger;
        }

        // Search operations (return DTOs for API consumption)
        public async Task<OpenLibrarySearchResultDto> SearchBooksAsync(string query, int? offset = null, int? limit = null)
        {
            _logger.LogInformation("Searching OpenLibrary books with query: {Query}, offset: {Offset}, limit: {Limit}", query, offset, limit);
            return await _openLibraryApiClient.SearchBooksAsync(query, offset, limit);
        }

        public async Task<OpenLibrarySearchResultDto> SearchBooksByTitleAsync(string title, int? offset = null, int? limit = null)
        {
            _logger.LogInformation("Searching OpenLibrary books by title: {Title}, offset: {Offset}, limit: {Limit}", title, offset, limit);
            return await _openLibraryApiClient.SearchBooksByTitleAsync(title, offset, limit);
        }

        public async Task<OpenLibrarySearchResultDto> SearchBooksByAuthorAsync(string author, int? offset = null, int? limit = null)
        {
            _logger.LogInformation("Searching OpenLibrary books by author: {Author}, offset: {Offset}, limit: {Limit}", author, offset, limit);
            return await _openLibraryApiClient.SearchBooksByAuthorAsync(author, offset, limit);
        }

        public async Task<OpenLibrarySearchResultDto> SearchBooksByISBNAsync(string isbn)
        {
            _logger.LogInformation("Searching OpenLibrary books by ISBN: {ISBN}", isbn);
            return await _openLibraryApiClient.SearchBooksByISBNAsync(isbn);
        }

        // Detail operations (return DTOs for API consumption)
        public async Task<OpenLibraryWorkDto> GetBookByOpenLibraryIdAsync(string openLibraryId)
        {
            _logger.LogInformation("Getting OpenLibrary work details for ID: {OpenLibraryId}", openLibraryId);
            return await _openLibraryApiClient.GetBookByOpenLibraryIdAsync(openLibraryId);
        }

        public async Task<OpenLibraryBookDto> GetBookByISBNAsync(string isbn)
        {
            _logger.LogInformation("Getting OpenLibrary book details for ISBN: {ISBN}", isbn);
            return await _openLibraryApiClient.GetBookByISBNAsync(isbn);
        }

        public async Task<OpenLibraryAuthorDto> GetAuthorAsync(string authorId)
        {
            _logger.LogInformation("Getting OpenLibrary author details for ID: {AuthorId}", authorId);
            return await _openLibraryApiClient.GetAuthorAsync(authorId);
        }

        // Utility operations
        public string GetCoverImageUrl(int? coverId, string size = "L")
        {
            return _openLibraryApiClient.GetCoverImageUrl(coverId, size);
        }

        // Import operations (business logic - convert DTOs to Domain Entities)
        public async Task<Book> ImportBookFromOpenLibraryKeyAsync(string openLibraryKey)
        {
            try
            {
                _logger.LogInformation("Importing book from OpenLibrary key: {OpenLibraryKey}", openLibraryKey);

                // Clean the Open Library key by removing the /works/ prefix if present
                var cleanKey = openLibraryKey.Replace("/works/", "");
                var workData = await _openLibraryApiClient.GetBookByOpenLibraryIdAsync(cleanKey);

                // Check if book already exists by title and author
                var authorName = workData.Authors?.FirstOrDefault()?.Author?.Key?.Replace("/authors/", "") ?? "Unknown Author";
                var existingBook = await _bookService.GetBookByTitleAndAuthorAsync(workData.Title ?? "Unknown Title", authorName);
                if (existingBook != null)
                {
                    _logger.LogInformation("Book {Title} by {Author} already exists", workData.Title, authorName);
                    return existingBook;
                }

                // Convert work data to book format for consistency
                var bookData = new OpenLibraryBookDto
                {
                    Key = workData.Key,
                    Title = workData.Title,
                    AuthorName = workData.Authors?.Select(a => a.Author?.Key?.Replace("/authors/", "")).ToArray() ?? new[] { authorName },
                    Subject = workData.Subjects,
                    CoverId = workData.Covers?.FirstOrDefault()
                };

                // Create book entity from OpenLibrary data using mapping service
                var book = await _bookMappingService.MapFromOpenLibraryAsync(bookData);

                // Create DTO for the service
                var createBookDto = new CreateBookDto
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
                };

                // Save to database through domain service
                var savedBook = await _bookService.CreateBookAsync(createBookDto);
                
                _logger.LogInformation("Successfully imported book from OpenLibrary: {Title} (Key: {OpenLibraryKey})", 
                    workData.Title, openLibraryKey);
                
                return savedBook;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing book from OpenLibrary key: {OpenLibraryKey}", openLibraryKey);
                throw;
            }
        }

        public async Task<Book> ImportBookFromISBNAsync(string isbn)
        {
            try
            {
                _logger.LogInformation("Importing book from ISBN: {ISBN}", isbn);

                // Search by ISBN to get book data
                var searchResult = await _openLibraryApiClient.SearchBooksByISBNAsync(isbn);
                var bookData = searchResult.Docs?.FirstOrDefault();

                if (bookData == null)
                {
                    throw new InvalidOperationException($"Book with ISBN {isbn} not found in OpenLibrary");
                }

                // Check if book already exists by title and author
                var authorName = bookData.AuthorName?.FirstOrDefault() ?? "Unknown Author";
                var existingBook = await _bookService.GetBookByTitleAndAuthorAsync(bookData.Title ?? "Unknown Title", authorName);
                if (existingBook != null)
                {
                    _logger.LogInformation("Book {Title} by {Author} already exists", bookData.Title, authorName);
                    return existingBook;
                }

                // Create book entity from OpenLibrary data using mapping service
                var book = await _bookMappingService.MapFromOpenLibraryAsync(bookData);

                // Create DTO for the service
                var createBookDto = new CreateBookDto
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
                };

                // Save to database through domain service
                var savedBook = await _bookService.CreateBookAsync(createBookDto);
                
                _logger.LogInformation("Successfully imported book from ISBN: {Title} (ISBN: {ISBN})", 
                    bookData.Title, isbn);
                
                return savedBook;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing book from ISBN: {ISBN}", isbn);
                throw;
            }
        }

        public async Task<Book> ImportBookFromTitleAndAuthorAsync(string title, string? author = null)
        {
            try
            {
                _logger.LogInformation("Importing book from title: {Title}, author: {Author}", title, author);

                OpenLibrarySearchResultDto searchResult;
                
                if (!string.IsNullOrWhiteSpace(author))
                {
                    // Search by title and author
                    var query = $"title:{title} author:{author}";
                    searchResult = await _openLibraryApiClient.SearchBooksAsync(query, limit: 1);
                }
                else
                {
                    // Search by title only
                    searchResult = await _openLibraryApiClient.SearchBooksByTitleAsync(title, limit: 1);
                }

                var bookData = searchResult.Docs?.FirstOrDefault();
                if (bookData == null)
                {
                    throw new InvalidOperationException($"Book with title '{title}' and author '{author}' not found in OpenLibrary");
                }

                // Check if book already exists by title and author
                var authorName = bookData.AuthorName?.FirstOrDefault() ?? "Unknown Author";
                var existingBook = await _bookService.GetBookByTitleAndAuthorAsync(bookData.Title ?? "Unknown Title", authorName);
                if (existingBook != null)
                {
                    _logger.LogInformation("Book {Title} by {Author} already exists", bookData.Title, authorName);
                    return existingBook;
                }

                // Create book entity from OpenLibrary data using mapping service
                var book = await _bookMappingService.MapFromOpenLibraryAsync(bookData);

                // Create DTO for the service
                var createBookDto = new CreateBookDto
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
                };

                // Save to database through domain service
                var savedBook = await _bookService.CreateBookAsync(createBookDto);
                
                _logger.LogInformation("Successfully imported book from title and author: {Title} by {Author}", 
                    bookData.Title, bookData.AuthorName?.FirstOrDefault());
                
                return savedBook;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing book from title: {Title}, author: {Author}", title, author);
                throw;
            }
        }
    }
}
