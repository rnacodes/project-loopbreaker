using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Utilities;

namespace ProjectLoopbreaker.Application.Services
{
    public class BookMappingService : IBookMappingService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<BookMappingService> _logger;

        public BookMappingService(IApplicationDbContext context, ILogger<BookMappingService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<Book> MapFromDtoAsync(CreateBookDto dto)
        {
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
                RelatedNotes = dto.RelatedNotes,
                Thumbnail = dto.Thumbnail,
                Author = dto.Author,
                ISBN = dto.ISBN,
                ASIN = dto.ASIN,
                Format = dto.Format,
                PartOfSeries = dto.PartOfSeries,
                GoodreadsRating = dto.GoodreadsRating
            };
            
            // If GoodreadsRating is provided but Rating is not, auto-convert
            if (dto.GoodreadsRating.HasValue && !dto.Rating.HasValue)
            {
                book.Rating = RatingConverter.ConvertGoodreadsRatingToPLBRating(dto.GoodreadsRating);
            }

            // Handle Topics array conversion
            if (dto.Topics?.Length > 0)
            {
                foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                {
                    var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                    var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                    if (existingTopic != null)
                    {
                        book.Topics.Add(existingTopic);
                    }
                    else
                    {
                        book.Topics.Add(new Topic { Name = normalizedTopicName });
                    }
                }
            }

            // Handle Genres array conversion
            if (dto.Genres?.Length > 0)
            {
                foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                {
                    var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                    var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                    if (existingGenre != null)
                    {
                        book.Genres.Add(existingGenre);
                    }
                    else
                    {
                        book.Genres.Add(new Genre { Name = normalizedGenreName });
                    }
                }
            }

            return book;
        }

        public async Task<BookResponseDto> MapToResponseDtoAsync(Book book)
        {
            return new BookResponseDto
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
                Topics = book.Topics.Select(t => t.Name).ToArray(),
                Genres = book.Genres.Select(g => g.Name).ToArray(),
                GoodreadsRating = book.GoodreadsRating
            };
        }

        public async Task<Book> MapFromOpenLibraryAsync(OpenLibraryBookDto openLibraryBook)
        {
            var book = new Book
            {
                Title = openLibraryBook.Title ?? "Unknown Title",
                Author = openLibraryBook.AuthorName?.FirstOrDefault() ?? "Unknown Author",
                MediaType = MediaType.Book,
                Status = Status.Uncharted,
                DateAdded = DateTime.UtcNow,
                ISBN = openLibraryBook.Isbn?.FirstOrDefault(),
                Format = BookFormat.Digital, // Default to digital since it's from Open Library
                PartOfSeries = false,
                Thumbnail = openLibraryBook.CoverId.HasValue 
                    ? $"https://covers.openlibrary.org/b/id/{openLibraryBook.CoverId}-L.jpg" 
                    : null,
                Description = ExtractDescription(openLibraryBook),
                Link = !string.IsNullOrWhiteSpace(openLibraryBook.Key) 
                    ? $"https://openlibrary.org{openLibraryBook.Key}" 
                    : null
            };

            // Handle subjects as genres
            if (openLibraryBook.Subject?.Length > 0)
            {
                foreach (var subjectName in openLibraryBook.Subject.Take(5).Where(s => !string.IsNullOrWhiteSpace(s)))
                {
                    var normalizedSubjectName = subjectName.Trim().ToLowerInvariant();
                    var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedSubjectName);
                    if (existingGenre != null)
                    {
                        book.Genres.Add(existingGenre);
                    }
                    else
                    {
                        book.Genres.Add(new Genre { Name = normalizedSubjectName });
                    }
                }
            }

            return book;
        }

        public async Task<Book> MapFromOpenLibraryWorkAsync(OpenLibraryWorkDto openLibraryWork)
        {
            // Convert work data to book format for consistency
            var bookData = new OpenLibraryBookDto
            {
                Key = openLibraryWork.Key,
                Title = openLibraryWork.Title,
                AuthorName = openLibraryWork.Authors?.Select(a => a.Author?.Key?.Replace("/authors/", "")).ToArray(),
                Subject = openLibraryWork.Subjects,
                CoverId = openLibraryWork.Covers?.FirstOrDefault()
            };

            return await MapFromOpenLibraryAsync(bookData);
        }

        public async Task<BookSearchResultDto> MapToSearchResultDtoAsync(OpenLibraryBookDto openLibraryBook)
        {
            return new BookSearchResultDto
            {
                Key = openLibraryBook.Key,
                Title = openLibraryBook.Title,
                Authors = openLibraryBook.AuthorName,
                FirstPublishYear = openLibraryBook.FirstPublishYear,
                Isbn = openLibraryBook.Isbn,
                Subjects = openLibraryBook.Subject,
                CoverUrl = openLibraryBook.CoverId.HasValue 
                    ? $"https://covers.openlibrary.org/b/id/{openLibraryBook.CoverId}-L.jpg" 
                    : null,
                Publishers = openLibraryBook.Publisher,
                Languages = openLibraryBook.Language,
                PageCount = openLibraryBook.NumberOfPagesMedian,
                AverageRating = openLibraryBook.RatingAverage,
                RatingCount = openLibraryBook.RatingCount,
                HasFulltext = openLibraryBook.HasFulltext,
                EditionCount = openLibraryBook.EditionCount
            };
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
