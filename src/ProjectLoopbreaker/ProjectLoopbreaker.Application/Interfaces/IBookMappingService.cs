using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.OpenLibrary;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IBookMappingService
    {
        Task<Book> MapFromDtoAsync(CreateBookDto dto);
        Task<BookResponseDto> MapToResponseDtoAsync(Book book);
        Task<Book> MapFromOpenLibraryAsync(OpenLibraryBookDto openLibraryBook);
        Task<Book> MapFromOpenLibraryWorkAsync(OpenLibraryWorkDto openLibraryWork);
        Task<BookSearchResultDto> MapToSearchResultDtoAsync(OpenLibraryBookDto openLibraryBook);
    }
}
