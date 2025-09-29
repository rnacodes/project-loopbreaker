using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.ListenNotes;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IPodcastMappingService
    {
        // Existing methods (working with JSON strings)
        Task<Podcast> MapToPodcastAsync(string jsonResponse);
        Task<Podcast> MapToPodcastEpisodeAsync(string jsonResponse, Guid? parentPodcastId = null);
        Task<Podcast> MapToPodcastWithEpisodesAsync(string jsonResponse);
        Task<Podcast?> MapSearchResultToPodcastAsync(string searchJsonResponse);

        // New methods (working with DTOs)
        CreatePodcastDto MapFromListenNotesDto(PodcastSeriesDto podcastDto);
        CreatePodcastDto MapFromListenNotesEpisodeDto(PodcastEpisodeDto episodeDto);
    }
}
