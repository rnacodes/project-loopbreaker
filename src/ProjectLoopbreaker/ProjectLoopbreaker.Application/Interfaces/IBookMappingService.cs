using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.GoogleBooks;
using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IBookMappingService
    {
        Task<Book> MapFromDtoAsync(CreateBookDto dto);
        Task<BookResponseDto> MapToResponseDtoAsync(Book book);

        // OpenLibrary mapping (kept for potential future use)
        Task<Book> MapFromOpenLibraryAsync(OpenLibraryBookDto openLibraryBook);
        Task<Book> MapFromOpenLibraryWorkAsync(OpenLibraryWorkDto openLibraryWork);
        Task<BookSearchResultDto> MapToSearchResultDtoAsync(OpenLibraryBookDto openLibraryBook);

        // Google Books mapping
        Task<Book> MapFromGoogleBooksAsync(GoogleBooksVolumeDto volume);
        Task<BookSearchResultDto> MapGoogleBooksToSearchResultDtoAsync(GoogleBooksVolumeDto volume);
    }
}
