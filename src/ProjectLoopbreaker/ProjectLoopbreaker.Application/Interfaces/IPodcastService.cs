using ProjectLoopbreaker.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IPodcastService
    {
        Task<PodcastSeries> SavePodcastSeriesAsync(PodcastSeries podcastSeries, bool updateIfExists = true);
        Task<PodcastEpisode> SavePodcastEpisodeAsync(PodcastEpisode episode, bool updateIfExists = true);
        Task<PodcastSeries> SavePodcastWithEpisodesAsync(PodcastSeries podcastSeries, bool updateIfExists = true);
        Task<bool> PodcastSeriesExistsAsync(string title, string publisher = null);
        Task<bool> PodcastEpisodeExistsAsync(Guid seriesId, string episodeTitle);
        Task<PodcastSeries> GetPodcastSeriesByTitleAsync(string title, string publisher = null);
        Task<PodcastEpisode> GetPodcastEpisodeByTitleAsync(Guid seriesId, string episodeTitle);
    }
}