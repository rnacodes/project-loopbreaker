using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Shared.DTOs.ListenNotes;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IListenNotesService
    {
        // Search operations (return DTOs for API consumption)
        Task<SearchResultDto> SearchAsync(string query, string? type = null, int? offset = null, 
            int? lenMin = null, int? lenMax = null, string? genreIds = null, 
            string? publishedBefore = null, string? publishedAfter = null, 
            string? onlyIn = null, string? language = null, string? region = null, 
            string? sortByDate = null, string? safeMode = null, string? uniquePodcasts = null);

        // Podcast operations (return DTOs for API consumption)
        Task<PodcastSeriesDto> GetPodcastByIdAsync(string id);
        Task<ListenNotesBestPodcastsDto> GetBestPodcastsAsync(int? genreId = null, int? page = null, 
            string? region = null, string? sortByDate = null, bool? safeMode = null);
        Task<ListenNotesRecommendationsDto> GetPodcastRecommendationsAsync(string id, bool? safeMode = null);

        // Episode operations (return DTOs for API consumption)
        Task<PodcastEpisodeDto> GetEpisodeByIdAsync(string id);
        Task<ListenNotesRecommendationsDto> GetEpisodeRecommendationsAsync(string id, bool? safeMode = null);

        // Playlist operations (return DTOs for API consumption)
        Task<ListenNotesPlaylistsDto> GetPlaylistsAsync();
        Task<ListenNotesPlaylistDto> GetPlaylistByIdAsync(string id);

        // Genre operations (return DTOs for API consumption)
        Task<ListenNotesGenresDto> GetGenresAsync();

        // Curated content operations (return DTOs for API consumption)
        Task<ListenNotesCuratedPodcastsDto> GetCuratedPodcastsAsync(int? page = null);
        Task<ListenNotesCuratedPodcastDto> GetCuratedPodcastByIdAsync(string id);

        // Import operations (business logic - convert DTOs to Domain Entities)
        Task<Podcast> ImportPodcastAsync(string podcastId);
        Task<Podcast> ImportPodcastEpisodeAsync(string episodeId);
        Task<Podcast?> ImportPodcastByNameAsync(string podcastName);
    }
}
