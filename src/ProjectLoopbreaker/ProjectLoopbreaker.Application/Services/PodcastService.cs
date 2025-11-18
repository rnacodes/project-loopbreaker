using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class PodcastService : IPodcastService
    {
        private readonly IApplicationDbContext _context;
        private readonly IListenNotesApiClient _listenNotesApiClient;
        private readonly IPodcastMappingService _podcastMappingService;
        private readonly ILogger<PodcastService> _logger;

        public PodcastService(
            IApplicationDbContext context,
            IListenNotesApiClient listenNotesApiClient,
            IPodcastMappingService podcastMappingService,
            ILogger<PodcastService> logger)
        {
            _context = context;
            _listenNotesApiClient = listenNotesApiClient;
            _podcastMappingService = podcastMappingService;
            _logger = logger;
        }

        public async Task<Podcast> SavePodcastAsync(Podcast podcast, bool updateIfExists = true)
        {
            // Check if a podcast with the same title already exists
            var existingPodcast = await GetPodcastByTitleAsync(podcast.Title);

            if (existingPodcast != null)
            {
                if (updateIfExists)
                {
                    // Update existing podcast properties
                    existingPodcast.Link = podcast.Link ?? existingPodcast.Link;
                    existingPodcast.Notes = podcast.Notes ?? existingPodcast.Notes;
                    existingPodcast.Thumbnail = podcast.Thumbnail ?? existingPodcast.Thumbnail;
                    // Don't overwrite these if they exist
                    existingPodcast.Description = existingPodcast.Description ?? podcast.Description;
                    existingPodcast.RelatedNotes = existingPodcast.RelatedNotes ?? podcast.RelatedNotes;

                    await _context.SaveChangesAsync();
                    return existingPodcast;
                }
                else
                {
                    return existingPodcast; // Return existing without modifications
                }
            }
            else
            {
                // It's a new podcast, add it
                _context.Add(podcast);
                await _context.SaveChangesAsync();
                return podcast;
            }
        }

        // This method is now merged into SavePodcastAsync since episodes are just podcasts with PodcastType.Episode

        public async Task<Podcast> SavePodcastWithEpisodesAsync(Podcast podcastSeries, bool updateIfExists = true)
        {
            // First save or update the podcast series
            var savedSeries = await SavePodcastAsync(podcastSeries, updateIfExists);

            // If there are episodes to save
            if (podcastSeries.Episodes != null && podcastSeries.Episodes.Any())
            {
                foreach (var episode in podcastSeries.Episodes)
                {
                    // Make sure episode is linked to the correct series
                    episode.ParentPodcastId = savedSeries.Id;
                    episode.PodcastType = PodcastType.Episode;

                    // Save the episode (with duplicate checking)
                    await SavePodcastAsync(episode, updateIfExists);
                }

                // Refresh the series with all episodes
                var entry = _context.Entry(savedSeries);
                // Note: Collection loading is not available through the interface
                // This will need to be handled differently or the interface updated
            }

            return savedSeries;
        }

        public async Task<bool> PodcastExistsAsync(string title, string? publisher = null)
        {
            var query = _context.Podcasts.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(p => p.Title.ToLower() == title.ToLower());

            return await query.AnyAsync();
        }

        public async Task<bool> PodcastEpisodeExistsAsync(Guid? parentPodcastId, string episodeTitle)
        {
            return await _context.Podcasts
                .AnyAsync(e =>
                    e.ParentPodcastId == parentPodcastId &&
                    e.PodcastType == PodcastType.Episode &&
                    e.Title.ToLower() == episodeTitle.ToLower());
        }

        public async Task<Podcast> GetPodcastByTitleAsync(string title, string? publisher = null)
        {
            var query = _context.Podcasts.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(p => p.Title.ToLower() == title.ToLower());

            return await query.FirstOrDefaultAsync();
        }

        public async Task<Podcast> GetPodcastEpisodeByTitleAsync(Guid? parentPodcastId, string episodeTitle)
        {
            return await _context.Podcasts
                .FirstOrDefaultAsync(e =>
                    e.ParentPodcastId == parentPodcastId &&
                    e.PodcastType == PodcastType.Episode &&
                    e.Title.ToLower() == episodeTitle.ToLower());
        }

        // New CRUD methods implementation
        public async Task<IEnumerable<Podcast>> GetAllPodcastsAsync()
        {
            return await _context.Podcasts.ToListAsync();
        }

        public async Task<IEnumerable<Podcast>> GetPodcastSeriesAsync()
        {
            return await _context.Podcasts
                .Where(p => p.PodcastType == PodcastType.Series)
                .ToListAsync();
        }

        public async Task<Podcast?> GetPodcastByIdAsync(Guid id)
        {
            return await _context.Podcasts
                .Include(p => p.Topics)
                .Include(p => p.Genres)
                .Include(p => p.Episodes)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Podcast>> GetEpisodesBySeriesIdAsync(Guid seriesId)
        {
            return await _context.Podcasts
                .Where(p => p.ParentPodcastId == seriesId && p.PodcastType == PodcastType.Episode)
                .Include(p => p.Topics)
                .Include(p => p.Genres)
                .ToListAsync();
        }

        public async Task<IEnumerable<Podcast>> SearchPodcastSeriesAsync(string query)
        {
            return await _context.Podcasts
                .Where(p => p.PodcastType == PodcastType.Series && 
                           (p.Title.Contains(query) || p.Publisher.Contains(query)))
                .ToListAsync();
        }

        public async Task<Podcast> CreatePodcastAsync(CreatePodcastDto dto)
        {
            // If creating an episode, verify the parent series exists
            if (dto.PodcastType == PodcastType.Episode && dto.ParentPodcastId.HasValue)
            {
                var parentSeries = await _context.Podcasts
                    .FirstOrDefaultAsync(p => p.Id == dto.ParentPodcastId.Value && p.PodcastType == PodcastType.Series);

                if (parentSeries == null)
                {
                    throw new ArgumentException($"Parent podcast series with ID {dto.ParentPodcastId.Value} not found.");
                }
            }

            var podcast = new Podcast
            {
                Title = dto.Title,
                MediaType = MediaType.Podcast,
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
                PodcastType = dto.PodcastType,
                ParentPodcastId = dto.ParentPodcastId,
                ExternalId = dto.ExternalId,
                Publisher = dto.Publisher,
                AudioLink = dto.AudioLink,
                ReleaseDate = dto.ReleaseDate,
                DurationInSeconds = dto.DurationInSeconds,
                IsSubscribed = dto.IsSubscribed,
                LastSyncDate = dto.LastSyncDate
            };

            // Handle Topics array conversion - check if they exist or create new ones
            if (dto.Topics?.Length > 0)
            {
                foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                {
                    var normalizedTopicName = topicName.ToLower();
                    var existingTopic = await _context.Topics
                        .FirstOrDefaultAsync(t => t.Name.ToLower() == normalizedTopicName);

                    if (existingTopic != null)
                    {
                        podcast.Topics.Add(existingTopic);
                    }
                    else
                    {
                        podcast.Topics.Add(new Topic { Name = normalizedTopicName });
                    }
                }
            }

            // Handle Genres array conversion - check if they exist or create new ones
            if (dto.Genres?.Length > 0)
            {
                foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                {
                    var normalizedGenreName = genreName.ToLower();
                    var existingGenre = await _context.Genres
                        .FirstOrDefaultAsync(g => g.Name.ToLower() == normalizedGenreName);

                    if (existingGenre != null)
                    {
                        podcast.Genres.Add(existingGenre);
                    }
                    else
                    {
                        podcast.Genres.Add(new Genre { Name = normalizedGenreName });
                    }
                }
            }

            _context.Add(podcast);
            await _context.SaveChangesAsync();

            return podcast;
        }

        public async Task<bool> DeletePodcastAsync(Guid id)
        {
            var podcast = await _context.FindAsync<Podcast>(id);
            if (podcast == null)
            {
                return false;
            }

            // If deleting a series, also delete all its episodes
            if (podcast.PodcastType == PodcastType.Series)
            {
                var episodes = await _context.Podcasts
                    .Where(p => p.ParentPodcastId == id)
                    .ToListAsync();
                
                foreach (var episode in episodes)
                {
                    _context.Remove(episode);
                }
            }

            _context.Remove(podcast);
            await _context.SaveChangesAsync();

            return true;
        }

        // Subscription management methods
        public async Task<Podcast?> SubscribeToPodcastSeriesAsync(Guid seriesId)
        {
            var series = await _context.Podcasts
                .FirstOrDefaultAsync(p => p.Id == seriesId && p.PodcastType == PodcastType.Series);

            if (series == null)
            {
                return null;
            }

            series.IsSubscribed = true;
            await _context.SaveChangesAsync();

            return series;
        }

        public async Task<Podcast?> UnsubscribeFromPodcastSeriesAsync(Guid seriesId)
        {
            var series = await _context.Podcasts
                .FirstOrDefaultAsync(p => p.Id == seriesId && p.PodcastType == PodcastType.Series);

            if (series == null)
            {
                return null;
            }

            series.IsSubscribed = false;
            await _context.SaveChangesAsync();

            return series;
        }

        public async Task<IEnumerable<Podcast>> GetSubscribedPodcastSeriesAsync()
        {
            return await _context.Podcasts
                .Where(p => p.PodcastType == PodcastType.Series && p.IsSubscribed)
                .ToListAsync();
        }

        public async Task<PodcastSyncResultDto?> SyncPodcastSeriesEpisodesAsync(Guid seriesId)
        {
            var series = await GetPodcastByIdAsync(seriesId);

            if (series == null || series.PodcastType != PodcastType.Series || string.IsNullOrEmpty(series.ExternalId))
            {
                _logger.LogWarning("Cannot sync series {SeriesId}: series not found, not a series type, or has no external ID", seriesId);
                return null;
            }

            try
            {
                _logger.LogInformation("Syncing episodes for podcast series: {Title} (External ID: {ExternalId})", 
                    series.Title, series.ExternalId);

                // Fetch podcast details from ListenNotes API (includes episodes)
                var podcastDto = await _listenNotesApiClient.GetPodcastByIdAsync(series.ExternalId);

                if (podcastDto?.Episodes == null || !podcastDto.Episodes.Any())
                {
                    _logger.LogInformation("No episodes found for podcast series: {Title}", series.Title);
                    series.LastSyncDate = DateTime.UtcNow;
                    await _context.SaveChangesAsync();

                    return new PodcastSyncResultDto
                    {
                        SeriesTitle = series.Title,
                        NewEpisodesCount = 0,
                        TotalEpisodesCount = 0,
                        LastSyncDate = series.LastSyncDate.Value
                    };
                }

                int newEpisodesCount = 0;

                // Process each episode from the API
                foreach (var episodeDto in podcastDto.Episodes)
                {
                    // Check if episode already exists by external ID
                    var existingEpisode = await _context.Podcasts
                        .FirstOrDefaultAsync(p => 
                            p.ExternalId == episodeDto.Id && 
                            p.PodcastType == PodcastType.Episode);

                    if (existingEpisode == null)
                    {
                        // Map and create new episode
                        var createEpisodeDto = _podcastMappingService.MapFromListenNotesEpisodeDto(episodeDto);
                        createEpisodeDto.ParentPodcastId = seriesId;
                        createEpisodeDto.PodcastType = PodcastType.Episode;

                        var newEpisode = new Podcast
                        {
                            Title = createEpisodeDto.Title,
                            MediaType = MediaType.Podcast,
                            PodcastType = PodcastType.Episode,
                            ParentPodcastId = seriesId,
                            Link = createEpisodeDto.Link,
                            Notes = createEpisodeDto.Notes,
                            Status = Status.Uncharted, // Default status for new episodes
                            AudioLink = createEpisodeDto.AudioLink,
                            ExternalId = createEpisodeDto.ExternalId,
                            Thumbnail = createEpisodeDto.Thumbnail,
                            ReleaseDate = createEpisodeDto.ReleaseDate,
                            DurationInSeconds = createEpisodeDto.DurationInSeconds,
                            Description = createEpisodeDto.Description,
                            DateAdded = DateTime.UtcNow
                        };

                        _context.Add(newEpisode);
                        newEpisodesCount++;

                        _logger.LogInformation("Added new episode: {Title} (External ID: {ExternalId})", 
                            newEpisode.Title, newEpisode.ExternalId);
                    }
                }

                // Update last sync date
                series.LastSyncDate = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                var totalEpisodeCount = await _context.Podcasts
                    .CountAsync(p => p.ParentPodcastId == seriesId && p.PodcastType == PodcastType.Episode);

                _logger.LogInformation("Sync complete for {Title}: {NewCount} new episodes, {TotalCount} total episodes", 
                    series.Title, newEpisodesCount, totalEpisodeCount);

                return new PodcastSyncResultDto
                {
                    SeriesTitle = series.Title,
                    NewEpisodesCount = newEpisodesCount,
                    TotalEpisodesCount = totalEpisodeCount,
                    LastSyncDate = series.LastSyncDate.Value
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing episodes for podcast series {SeriesId}", seriesId);
                throw;
            }
        }
    }
}
