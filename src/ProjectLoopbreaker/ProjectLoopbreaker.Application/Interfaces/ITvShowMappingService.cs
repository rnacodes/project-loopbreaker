using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.TMDB;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface ITvShowMappingService
    {
        Task<TvShow> MapFromDtoAsync(CreateTvShowDto dto);
        Task<TvShowResponseDto> MapToResponseDtoAsync(TvShow tvShow);
        Task<TvShow> MapFromTmdbAsync(TmdbTvShowDto tmdbTvShow);
        Task<TvShowSearchResultDto> MapToSearchResultDtoAsync(TmdbTvShowDto tmdbTvShow);
    }
}
