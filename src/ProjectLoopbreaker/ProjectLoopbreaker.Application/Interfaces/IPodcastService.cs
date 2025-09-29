using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IPodcastService
    {
        // Existing methods
        Task<Podcast> SavePodcastAsync(Podcast podcast, bool updateIfExists = true);
        Task<Podcast> SavePodcastWithEpisodesAsync(Podcast podcastSeries, bool updateIfExists = true);
        Task<bool> PodcastExistsAsync(string title, string? publisher = null);
        Task<bool> PodcastEpisodeExistsAsync(Guid? parentPodcastId, string episodeTitle);
        Task<Podcast> GetPodcastByTitleAsync(string title, string? publisher = null);
        Task<Podcast> GetPodcastEpisodeByTitleAsync(Guid? parentPodcastId, string episodeTitle);

        // New CRUD methods needed by PodcastController
        Task<IEnumerable<Podcast>> GetAllPodcastsAsync();
        Task<IEnumerable<Podcast>> GetPodcastSeriesAsync();
        Task<Podcast?> GetPodcastByIdAsync(Guid id);
        Task<IEnumerable<Podcast>> GetEpisodesBySeriesIdAsync(Guid seriesId);
        Task<IEnumerable<Podcast>> SearchPodcastSeriesAsync(string query);
        Task<Podcast> CreatePodcastAsync(CreatePodcastDto dto);
        Task<bool> DeletePodcastAsync(Guid id);
    }
}