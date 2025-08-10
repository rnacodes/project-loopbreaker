using ProjectLoopbreaker.Domain.Entities;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IPodcastMappingService
    {
        Task<Podcast> MapToPodcastAsync(string jsonResponse);
        Task<Podcast> MapToPodcastEpisodeAsync(string jsonResponse, Guid? parentPodcastId = null);
        Task<Podcast> MapToPodcastWithEpisodesAsync(string jsonResponse);
    }
}
