using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.ListenNotes;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class ListenNotesService : IListenNotesService
    {
        private readonly IListenNotesApiClient _listenNotesApiClient;
        private readonly IPodcastService _podcastService;
        private readonly IPodcastMappingService _podcastMappingService;
        private readonly ILogger<ListenNotesService> _logger;

        public ListenNotesService(
            IListenNotesApiClient listenNotesApiClient,
            IPodcastService podcastService,
            IPodcastMappingService podcastMappingService,
            ILogger<ListenNotesService> logger)
        {
            _listenNotesApiClient = listenNotesApiClient;
            _podcastService = podcastService;
            _podcastMappingService = podcastMappingService;
            _logger = logger;
        }

        // Search operations (return DTOs for API consumption)
        public async Task<SearchResultDto> SearchAsync(string query, string? type = null, int? offset = null, 
            int? lenMin = null, int? lenMax = null, string? genreIds = null, 
            string? publishedBefore = null, string? publishedAfter = null, 
            string? onlyIn = null, string? language = null, string? region = null, 
            string? sortByDate = null, string? safeMode = null, string? uniquePodcasts = null)
        {
            _logger.LogInformation("Searching podcasts with query: {Query}", query);
            return await _listenNotesApiClient.SearchAsync(query, type, offset, lenMin, lenMax, genreIds,
                publishedBefore, publishedAfter, onlyIn, language, region, sortByDate, safeMode, uniquePodcasts);
        }

        // Podcast operations (return DTOs for API consumption)
        public async Task<PodcastSeriesDto> GetPodcastByIdAsync(string id)
        {
            _logger.LogInformation("Getting podcast details for ID: {PodcastId}", id);
            return await _listenNotesApiClient.GetPodcastByIdAsync(id);
        }

        public async Task<ListenNotesBestPodcastsDto> GetBestPodcastsAsync(int? genreId = null, int? page = null, 
            string? region = null, string? sortByDate = null, bool? safeMode = null)
        {
            _logger.LogInformation("Getting best podcasts");
            return await _listenNotesApiClient.GetBestPodcastsAsync(genreId, page, region, sortByDate, safeMode);
        }

        public async Task<ListenNotesRecommendationsDto> GetPodcastRecommendationsAsync(string id, bool? safeMode = null)
        {
            _logger.LogInformation("Getting podcast recommendations for ID: {PodcastId}", id);
            return await _listenNotesApiClient.GetPodcastRecommendationsAsync(id, safeMode);
        }

        // Episode operations (return DTOs for API consumption)
        public async Task<PodcastEpisodeDto> GetEpisodeByIdAsync(string id)
        {
            _logger.LogInformation("Getting episode details for ID: {EpisodeId}", id);
            return await _listenNotesApiClient.GetEpisodeByIdAsync(id);
        }

        public async Task<ListenNotesRecommendationsDto> GetEpisodeRecommendationsAsync(string id, bool? safeMode = null)
        {
            _logger.LogInformation("Getting episode recommendations for ID: {EpisodeId}", id);
            return await _listenNotesApiClient.GetEpisodeRecommendationsAsync(id, safeMode);
        }

        // Playlist operations (return DTOs for API consumption)
        public async Task<ListenNotesPlaylistsDto> GetPlaylistsAsync()
        {
            _logger.LogInformation("Getting playlists");
            return await _listenNotesApiClient.GetPlaylistsAsync();
        }

        public async Task<ListenNotesPlaylistDto> GetPlaylistByIdAsync(string id)
        {
            _logger.LogInformation("Getting playlist details for ID: {PlaylistId}", id);
            return await _listenNotesApiClient.GetPlaylistByIdAsync(id);
        }

        // Genre operations (return DTOs for API consumption)
        public async Task<ListenNotesGenresDto> GetGenresAsync()
        {
            _logger.LogInformation("Getting genres");
            return await _listenNotesApiClient.GetGenresAsync();
        }

        // Curated content operations (return DTOs for API consumption)
        public async Task<ListenNotesCuratedPodcastsDto> GetCuratedPodcastsAsync(int? page = null)
        {
            _logger.LogInformation("Getting curated podcasts");
            return await _listenNotesApiClient.GetCuratedPodcastsAsync(page);
        }

        public async Task<ListenNotesCuratedPodcastDto> GetCuratedPodcastByIdAsync(string id)
        {
            _logger.LogInformation("Getting curated podcast details for ID: {CuratedPodcastId}", id);
            return await _listenNotesApiClient.GetCuratedPodcastByIdAsync(id);
        }

        // Import operations (business logic - convert DTOs to Domain Entities)
        public async Task<Podcast> ImportPodcastAsync(string podcastId)
        {
            try
            {
                _logger.LogInformation("Importing podcast with ID: {PodcastId}", podcastId);

                // Get podcast details from ListenNotes API
                var podcastDto = await _listenNotesApiClient.GetPodcastByIdAsync(podcastId);

                // Check if podcast already exists by title and publisher
                var existingPodcast = await _podcastService.GetPodcastByTitleAsync(
                    podcastDto.Title, podcastDto.Publisher);
                if (existingPodcast != null)
                {
                    _logger.LogInformation("Podcast {Title} by {Publisher} already exists", 
                        podcastDto.Title, podcastDto.Publisher);
                    return existingPodcast;
                }

                // Map ListenNotes DTO to CreatePodcastDto and convert to Podcast entity
                var createPodcastDto = _podcastMappingService.MapFromListenNotesDto(podcastDto);
                
                // Convert CreatePodcastDto to Podcast entity
                var podcast = new Podcast
                {
                    Title = createPodcastDto.Title,
                    MediaType = createPodcastDto.MediaType,
                    PodcastType = createPodcastDto.PodcastType,
                    Link = createPodcastDto.Link,
                    Notes = createPodcastDto.Notes,
                    Status = createPodcastDto.Status,
                    Publisher = createPodcastDto.Publisher,
                    ExternalId = createPodcastDto.ExternalId,
                    Thumbnail = createPodcastDto.Thumbnail,
                    DateAdded = DateTime.UtcNow,
                    IsSubscribed = true // Automatically subscribe when importing a series
                };

                // Save to database through domain service
                var savedPodcast = await _podcastService.SavePodcastAsync(podcast);
                
                _logger.LogInformation("Successfully imported podcast: {Title} (ListenNotes ID: {PodcastId})", 
                    podcastDto.Title, podcastId);
                
                return savedPodcast;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing podcast with ID: {PodcastId}", podcastId);
                throw;
            }
        }

        public async Task<Podcast> ImportPodcastEpisodeAsync(string episodeId)
        {
            try
            {
                _logger.LogInformation("Importing podcast episode with ID: {EpisodeId}", episodeId);

                // Get episode details from ListenNotes API
                var episodeDto = await _listenNotesApiClient.GetEpisodeByIdAsync(episodeId);

                // Map ListenNotes episode DTO to CreatePodcastDto (treating episode as individual podcast)
                var createPodcastDto = _podcastMappingService.MapFromListenNotesEpisodeDto(episodeDto);

                // Check if episode already exists by title
                var existingPodcast = await _podcastService.GetPodcastByTitleAsync(createPodcastDto.Title);
                if (existingPodcast != null)
                {
                    _logger.LogInformation("Episode {Title} already exists", createPodcastDto.Title);
                    return existingPodcast;
                }

                // Convert CreatePodcastDto to Podcast entity
                var podcast = new Podcast
                {
                    Title = createPodcastDto.Title,
                    MediaType = createPodcastDto.MediaType,
                    PodcastType = createPodcastDto.PodcastType,
                    Link = createPodcastDto.Link,
                    Notes = createPodcastDto.Notes,
                    Status = createPodcastDto.Status,
                    AudioLink = createPodcastDto.AudioLink,
                    ExternalId = createPodcastDto.ExternalId,
                    Thumbnail = createPodcastDto.Thumbnail,
                    ReleaseDate = createPodcastDto.ReleaseDate,
                    DurationInSeconds = createPodcastDto.DurationInSeconds,
                    DateAdded = DateTime.UtcNow
                };

                // Save to database through domain service
                var savedPodcast = await _podcastService.SavePodcastAsync(podcast);
                
                _logger.LogInformation("Successfully imported episode: {Title} (ListenNotes ID: {EpisodeId})", 
                    episodeDto.Title, episodeId);
                
                return savedPodcast;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing episode with ID: {EpisodeId}", episodeId);
                throw;
            }
        }

        public async Task<Podcast?> ImportPodcastByNameAsync(string podcastName)
        {
            try
            {
                _logger.LogInformation("Searching and importing podcast by name: {PodcastName}", podcastName);

                // Search for podcast by name
                var searchResults = await _listenNotesApiClient.SearchAsync(podcastName, "podcast");
                
                if (searchResults?.Results == null || !searchResults.Results.Any())
                {
                    _logger.LogInformation("No podcast found with name: {PodcastName}", podcastName);
                    return null;
                }

                // Get the first result and import it
                var firstResult = searchResults.Results.First();
                if (string.IsNullOrEmpty(firstResult.Id))
                {
                    _logger.LogWarning("First search result has no ID for podcast name: {PodcastName}", podcastName);
                    return null;
                }

                // Import the podcast using its ID
                var podcast = await ImportPodcastAsync(firstResult.Id);
                
                _logger.LogInformation("Successfully imported podcast by name: {PodcastName} -> {Title}", 
                    podcastName, podcast.Title);
                
                return podcast;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error importing podcast by name: {PodcastName}", podcastName);
                throw;
            }
        }
    }
}
