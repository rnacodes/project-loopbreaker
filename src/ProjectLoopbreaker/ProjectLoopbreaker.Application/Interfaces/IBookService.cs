using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IBookService
    {
        Task<IEnumerable<Book>> GetAllBooksAsync();
        Task<Book?> GetBookByIdAsync(Guid id);
        Task<IEnumerable<Book>> GetBooksByAuthorAsync(string author);
        Task<IEnumerable<Book>> GetBookSeriesAsync();
        Task<Book> CreateBookAsync(CreateBookDto dto);
        Task<Book> UpdateBookAsync(Guid id, CreateBookDto dto);
        Task<bool> DeleteBookAsync(Guid id);
        Task<bool> BookExistsAsync(string title, string author);
        Task<Book?> GetBookByTitleAndAuthorAsync(string title, string author);
    }
}
