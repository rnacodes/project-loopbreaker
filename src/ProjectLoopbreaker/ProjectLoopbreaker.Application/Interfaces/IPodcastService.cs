using ProjectLoopbreaker.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IPodcastService
    {
        Task<Podcast> SavePodcastAsync(Podcast podcast, bool updateIfExists = true);
        Task<Podcast> SavePodcastWithEpisodesAsync(Podcast podcastSeries, bool updateIfExists = true);
        Task<bool> PodcastExistsAsync(string title, string publisher = null);
        Task<bool> PodcastEpisodeExistsAsync(Guid? parentPodcastId, string episodeTitle);
        Task<Podcast> GetPodcastByTitleAsync(string title, string publisher = null);
        Task<Podcast> GetPodcastEpisodeByTitleAsync(Guid? parentPodcastId, string episodeTitle);
    }
}