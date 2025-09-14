using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.TMDB;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IMovieMappingService
    {
        Task<Movie> MapFromDtoAsync(CreateMovieDto dto);
        Task<MovieResponseDto> MapToResponseDtoAsync(Movie movie);
        Task<Movie> MapFromTmdbAsync(TmdbMovieDto tmdbMovie);
        Task<MovieSearchResultDto> MapToSearchResultDtoAsync(TmdbMovieDto tmdbMovie);
    }
}
