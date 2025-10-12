using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IVideoService
    {
        // Standard CRUD operations
        Task<IEnumerable<Video>> GetAllVideosAsync();
        Task<Video?> GetVideoByIdAsync(Guid id);
        Task<IEnumerable<Video>> GetVideosByChannelAsync(string channelName);
        Task<IEnumerable<Video>> GetVideoSeriesAsync();
        Task<Video> CreateVideoAsync(CreateVideoDto dto);
        Task<Video> UpdateVideoAsync(Guid id, CreateVideoDto dto);
        Task<bool> DeleteVideoAsync(Guid id);
        
        // Existing methods
        Task<Video> SaveVideoAsync(Video video, bool updateIfExists = true);
        Task<Video> SaveVideoWithEpisodesAsync(Video videoSeries, bool updateIfExists = true);
        Task<bool> VideoExistsAsync(string title, string? channelName = null);
        Task<bool> VideoEpisodeExistsAsync(Guid? parentVideoId, string episodeTitle);
        Task<Video> GetVideoByTitleAsync(string title, string? channelName = null);
        Task<Video> GetVideoEpisodeByTitleAsync(Guid? parentVideoId, string episodeTitle);
    }
}
