using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;
using ProjectLoopbreaker.Application.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class VideoService : IVideoService
    {
        private readonly IApplicationDbContext _context;

        public VideoService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Video> SaveVideoAsync(Video video, bool updateIfExists = true)
        {
            // Check if a video with the same title already exists
            var existingVideo = await GetVideoByTitleAsync(video.Title, video.ChannelName);

            if (existingVideo != null)
            {
                if (updateIfExists)
                {
                    // Update existing video properties
                    existingVideo.Link = video.Link ?? existingVideo.Link;
                    existingVideo.Notes = video.Notes ?? existingVideo.Notes;
                    existingVideo.Thumbnail = video.Thumbnail ?? existingVideo.Thumbnail;
                    existingVideo.Platform = video.Platform ?? existingVideo.Platform;
                    existingVideo.ChannelName = video.ChannelName ?? existingVideo.ChannelName;
                    existingVideo.LengthInSeconds = video.LengthInSeconds > 0 ? video.LengthInSeconds : existingVideo.LengthInSeconds;
                    // Don't overwrite these if they exist
                    existingVideo.Description = existingVideo.Description ?? video.Description;
                    existingVideo.RelatedNotes = existingVideo.RelatedNotes ?? video.RelatedNotes;

                    await _context.SaveChangesAsync();
                    return existingVideo;
                }
                else
                {
                    return existingVideo; // Return existing without modifications
                }
            }
            else
            {
                // It's a new video, add it
                _context.Add(video);
                await _context.SaveChangesAsync();
                return video;
            }
        }

        public async Task<Video> SaveVideoWithEpisodesAsync(Video videoSeries, bool updateIfExists = true)
        {
            // First save or update the video series
            var savedSeries = await SaveVideoAsync(videoSeries, updateIfExists);

            // If there are episodes to save
            if (videoSeries.Episodes != null && videoSeries.Episodes.Any())
            {
                foreach (var episode in videoSeries.Episodes)
                {
                    // Make sure episode is linked to the correct series
                    episode.ParentVideoId = savedSeries.Id;
                    episode.VideoType = VideoType.Episode;

                    // Save the episode (with duplicate checking)
                    await SaveVideoAsync(episode, updateIfExists);
                }

                // Refresh the series with all episodes
                var entry = _context.Entry(savedSeries);
                // Note: Collection loading is not available through the interface
                // This will need to be handled differently or the interface updated
            }

            return savedSeries;
        }

        public async Task<bool> VideoExistsAsync(string title, string channelName = null)
        {
            var query = _context.Videos.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(v => v.Title.ToLower() == title.ToLower());

            // If channel name is provided, also check that
            if (!string.IsNullOrEmpty(channelName))
            {
                query = query.Where(v => v.ChannelName.ToLower() == channelName.ToLower());
            }

            return await query.AnyAsync();
        }

        public async Task<bool> VideoEpisodeExistsAsync(Guid? parentVideoId, string episodeTitle)
        {
            return await _context.Videos
                .AnyAsync(e =>
                    e.ParentVideoId == parentVideoId &&
                    e.VideoType == VideoType.Episode &&
                    e.Title.ToLower() == episodeTitle.ToLower());
        }

        public async Task<Video> GetVideoByTitleAsync(string title, string channelName = null)
        {
            var query = _context.Videos.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(v => v.Title.ToLower() == title.ToLower());

            // If channel name is provided, also check that
            if (!string.IsNullOrEmpty(channelName))
            {
                query = query.Where(v => v.ChannelName.ToLower() == channelName.ToLower());
            }

            return await query.FirstOrDefaultAsync();
        }

        public async Task<Video> GetVideoEpisodeByTitleAsync(Guid? parentVideoId, string episodeTitle)
        {
            return await _context.Videos
                .FirstOrDefaultAsync(e =>
                    e.ParentVideoId == parentVideoId &&
                    e.VideoType == VideoType.Episode &&
                    e.Title.ToLower() == episodeTitle.ToLower());
        }
    }
}
