using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface ITvShowService
    {
        Task<IEnumerable<TvShow>> GetAllTvShowsAsync();
        Task<TvShow?> GetTvShowByIdAsync(Guid id);
        Task<IEnumerable<TvShow>> GetTvShowsByCreatorAsync(string creator);
        Task<IEnumerable<TvShow>> GetTvShowsByYearAsync(int year);
        Task<TvShow> CreateTvShowAsync(CreateTvShowDto dto);
        Task<TvShow> UpdateTvShowAsync(Guid id, CreateTvShowDto dto);
        Task<bool> DeleteTvShowAsync(Guid id);
        Task<bool> TvShowExistsAsync(string title, int? firstAirYear = null);
        Task<TvShow?> GetTvShowByTitleAndYearAsync(string title, int? firstAirYear = null);
    }
}
