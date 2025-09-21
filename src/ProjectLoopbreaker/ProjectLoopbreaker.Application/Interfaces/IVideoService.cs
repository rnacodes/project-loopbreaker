using ProjectLoopbreaker.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IVideoService
    {
        Task<Video> SaveVideoAsync(Video video, bool updateIfExists = true);
        Task<Video> SaveVideoWithEpisodesAsync(Video videoSeries, bool updateIfExists = true);
        Task<bool> VideoExistsAsync(string title, string channelName = null);
        Task<bool> VideoEpisodeExistsAsync(Guid? parentVideoId, string episodeTitle);
        Task<Video> GetVideoByTitleAsync(string title, string channelName = null);
        Task<Video> GetVideoEpisodeByTitleAsync(Guid? parentVideoId, string episodeTitle);
    }
}
