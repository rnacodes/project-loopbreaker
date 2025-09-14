using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Application.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class TvShowService : ITvShowService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<TvShowService> _logger;

        public TvShowService(IApplicationDbContext context, ILogger<TvShowService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<IEnumerable<TvShow>> GetAllTvShowsAsync()
        {
            try
            {
                return await _context.TvShows
                    .Include(t => t.Topics)
                    .Include(t => t.Genres)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving all TV shows");
                throw;
            }
        }

        public async Task<TvShow?> GetTvShowByIdAsync(Guid id)
        {
            try
            {
                return await _context.TvShows
                    .Include(t => t.Topics)
                    .Include(t => t.Genres)
                    .FirstOrDefaultAsync(t => t.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving TV show with ID {Id}", id);
                throw;
            }
        }

        public async Task<IEnumerable<TvShow>> GetTvShowsByCreatorAsync(string creator)
        {
            try
            {
                return await _context.TvShows
                    .Where(t => t.Creator != null && t.Creator.ToLower().Contains(creator.ToLower()))
                    .Include(t => t.Topics)
                    .Include(t => t.Genres)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving TV shows by creator: {Creator}", creator);
                throw;
            }
        }

        public async Task<IEnumerable<TvShow>> GetTvShowsByYearAsync(int year)
        {
            try
            {
                return await _context.TvShows
                    .Where(t => t.FirstAirYear == year)
                    .Include(t => t.Topics)
                    .Include(t => t.Genres)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving TV shows by year: {Year}", year);
                throw;
            }
        }

        public async Task<TvShow> CreateTvShowAsync(CreateTvShowDto dto)
        {
            try
            {
                if (dto == null)
                {
                    throw new ArgumentNullException(nameof(dto), "TV show data is required");
                }

                // Check if TV show already exists
                if (await TvShowExistsAsync(dto.Title, dto.FirstAirYear))
                {
                    _logger.LogWarning("TV show already exists: {Title} ({Year})", dto.Title, dto.FirstAirYear);
                    var existingTvShow = await GetTvShowByTitleAndYearAsync(dto.Title, dto.FirstAirYear);
                    if (existingTvShow != null)
                    {
                        return existingTvShow;
                    }
                }

                var tvShow = new TvShow
                {
                    Title = dto.Title,
                    MediaType = MediaType.TVShow,
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
                    Creator = dto.Creator,
                    Cast = dto.Cast,
                    FirstAirYear = dto.FirstAirYear,
                    LastAirYear = dto.LastAirYear,
                    NumberOfSeasons = dto.NumberOfSeasons,
                    NumberOfEpisodes = dto.NumberOfEpisodes,
                    ContentRating = dto.ContentRating,
                    Network = dto.Network,
                    TmdbId = dto.TmdbId,
                    TmdbRating = dto.TmdbRating,
                    TmdbPosterPath = dto.TmdbPosterPath,
                    Tagline = dto.Tagline,
                    Homepage = dto.Homepage,
                    OriginalLanguage = dto.OriginalLanguage,
                    OriginalName = dto.OriginalName
                };

                // Handle Topics array conversion
                await HandleTopicsAsync(tvShow, dto.Topics);

                // Handle Genres array conversion
                await HandleGenresAsync(tvShow, dto.Genres);

                _context.Add(tvShow);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully created TV show: {Title} ({Year})", tvShow.Title, tvShow.FirstAirYear);
                return tvShow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating TV show");
                throw;
            }
        }

        public async Task<TvShow> UpdateTvShowAsync(Guid id, CreateTvShowDto dto)
        {
            try
            {
                var tvShow = await GetTvShowByIdAsync(id);
                if (tvShow == null)
                {
                    throw new InvalidOperationException($"TV show with ID {id} not found.");
                }

                // Update TV show properties
                tvShow.Title = dto.Title;
                tvShow.Link = dto.Link;
                tvShow.Notes = dto.Notes;
                tvShow.Status = dto.Status;
                tvShow.DateCompleted = dto.DateCompleted;
                tvShow.Rating = dto.Rating;
                tvShow.OwnershipStatus = dto.OwnershipStatus;
                tvShow.Description = dto.Description;
                tvShow.RelatedNotes = dto.RelatedNotes;
                tvShow.Thumbnail = dto.Thumbnail;
                tvShow.Creator = dto.Creator;
                tvShow.Cast = dto.Cast;
                tvShow.FirstAirYear = dto.FirstAirYear;
                tvShow.LastAirYear = dto.LastAirYear;
                tvShow.NumberOfSeasons = dto.NumberOfSeasons;
                tvShow.NumberOfEpisodes = dto.NumberOfEpisodes;
                tvShow.ContentRating = dto.ContentRating;
                tvShow.Network = dto.Network;
                tvShow.TmdbId = dto.TmdbId;
                tvShow.TmdbRating = dto.TmdbRating;
                tvShow.TmdbPosterPath = dto.TmdbPosterPath;
                tvShow.Tagline = dto.Tagline;
                tvShow.Homepage = dto.Homepage;
                tvShow.OriginalLanguage = dto.OriginalLanguage;
                tvShow.OriginalName = dto.OriginalName;

                // Clear existing topics and genres
                tvShow.Topics.Clear();
                tvShow.Genres.Clear();

                // Handle Topics array conversion
                await HandleTopicsAsync(tvShow, dto.Topics);

                // Handle Genres array conversion
                await HandleGenresAsync(tvShow, dto.Genres);

                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully updated TV show: {Title} ({Year})", tvShow.Title, tvShow.FirstAirYear);
                return tvShow;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating TV show with ID {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteTvShowAsync(Guid id)
        {
            try
            {
                var tvShow = await _context.FindAsync<TvShow>(id);
                if (tvShow == null)
                {
                    return false;
                }

                _context.Remove(tvShow);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Successfully deleted TV show: {Title} ({Year})", tvShow.Title, tvShow.FirstAirYear);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting TV show with ID {Id}", id);
                throw;
            }
        }

        public async Task<bool> TvShowExistsAsync(string title, int? firstAirYear = null)
        {
            try
            {
                var query = _context.TvShows.Where(t => t.Title.ToLower() == title.ToLower());
                
                if (firstAirYear.HasValue)
                {
                    query = query.Where(t => t.FirstAirYear == firstAirYear.Value);
                }
                
                return await query.AnyAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking if TV show exists: {Title} ({Year})", title, firstAirYear);
                throw;
            }
        }

        public async Task<TvShow?> GetTvShowByTitleAndYearAsync(string title, int? firstAirYear = null)
        {
            try
            {
                var query = _context.TvShows
                    .Include(t => t.Topics)
                    .Include(t => t.Genres)
                    .Where(t => t.Title.ToLower() == title.ToLower());
                
                if (firstAirYear.HasValue)
                {
                    query = query.Where(t => t.FirstAirYear == firstAirYear.Value);
                }
                
                return await query.FirstOrDefaultAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving TV show by title and year: {Title} ({Year})", title, firstAirYear);
                throw;
            }
        }

        private async Task HandleTopicsAsync(TvShow tvShow, string[]? topics)
        {
            if (topics?.Length > 0)
            {
                foreach (var topicName in topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                {
                    var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                    var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                    if (existingTopic != null)
                    {
                        tvShow.Topics.Add(existingTopic);
                    }
                    else
                    {
                        tvShow.Topics.Add(new Topic { Name = normalizedTopicName });
                    }
                }
            }
        }

        private async Task HandleGenresAsync(TvShow tvShow, string[]? genres)
        {
            if (genres?.Length > 0)
            {
                foreach (var genreName in genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                {
                    var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                    var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                    if (existingGenre != null)
                    {
                        tvShow.Genres.Add(existingGenre);
                    }
                    else
                    {
                        tvShow.Genres.Add(new Genre { Name = normalizedGenreName });
                    }
                }
            }
        }
    }
}
