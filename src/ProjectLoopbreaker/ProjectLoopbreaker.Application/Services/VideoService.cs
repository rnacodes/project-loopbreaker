using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Helpers;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class VideoService : IVideoService
    {
        private readonly IApplicationDbContext _context;
        private readonly ILogger<VideoService> _logger;
        private readonly ITypeSenseService? _typeSenseService;

        public VideoService(
            IApplicationDbContext context, 
            ILogger<VideoService> logger,
            ITypeSenseService? typeSenseService = null)
        {
            _context = context;
            _logger = logger;
            _typeSenseService = typeSenseService;
        }

        // Standard CRUD operations
        public async Task<IEnumerable<Video>> GetAllVideosAsync()
        {
            try
            {
                return await _context.Videos
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(v => v.Topics)
                    .Include(v => v.Genres)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving all videos");
                throw;
            }
        }

        public async Task<Video?> GetVideoByIdAsync(Guid id)
        {
            try
            {
                return await _context.Videos
                    .AsNoTracking()
                    .AsSplitQuery()
                    .Include(v => v.Topics)
                    .Include(v => v.Genres)
                    .FirstOrDefaultAsync(v => v.Id == id);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving video with ID {Id}", id);
                throw;
            }
        }

        public async Task<IEnumerable<Video>> GetVideosByChannelAsync(Guid channelId)
        {
            try
            {
                return await _context.Videos
                    .Include(v => v.Topics)
                    .Include(v => v.Genres)
                    .Include(v => v.Channel)
                    .Where(v => v.ChannelId == channelId)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving videos by channel {ChannelId}", channelId);
                throw;
            }
        }

        public async Task<IEnumerable<Video>> GetVideoSeriesAsync()
        {
            try
            {
                return await _context.Videos
                    .Include(v => v.Topics)
                    .Include(v => v.Genres)
                    .Where(v => v.VideoType == VideoType.Series)
                    .ToListAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving video series");
                throw;
            }
        }

        public async Task<Video> CreateVideoAsync(CreateVideoDto dto)
        {
            try
            {
                var video = new Video
                {
                    Title = dto.Title,
                    MediaType = MediaType.Video,
                    Link = dto.Link,
                    Notes = dto.Notes,
                    Status = dto.Status,
                    DateAdded = DateTime.UtcNow,
                    DateCompleted = dto.DateCompleted,
                    Rating = dto.Rating,
                    OwnershipStatus = dto.OwnershipStatus,
                    Description = dto.Description,
                    RelatedNotes = dto.RelatedNotes,
                    Thumbnail = dto.Thumbnail,
                    VideoType = dto.VideoType,
                    ParentVideoId = dto.ParentVideoId,
                    Platform = dto.Platform,
                    ChannelId = dto.ChannelId,
                    LengthInSeconds = dto.LengthInSeconds,
                    ExternalId = dto.ExternalId
                };

                // Handle Topics
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                        var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                        if (existingTopic != null)
                        {
                            video.Topics.Add(existingTopic);
                        }
                        else
                        {
                            video.Topics.Add(new Topic { Name = normalizedTopicName });
                        }
                    }
                }

                // Handle Genres
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                        if (existingGenre != null)
                        {
                            video.Genres.Add(existingGenre);
                        }
                        else
                        {
                            video.Genres.Add(new Genre { Name = normalizedGenreName });
                        }
                    }
                }

                _context.Add(video);
                await _context.SaveChangesAsync();
                return video;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating video");
                throw;
            }
        }

        public async Task<Video> UpdateVideoAsync(Guid id, CreateVideoDto dto)
        {
            try
            {
                var video = await GetVideoByIdAsync(id);
                if (video == null)
                {
                    throw new ArgumentException($"Video with ID {id} not found");
                }

                // Update properties
                video.Title = dto.Title;
                video.Link = dto.Link;
                video.Notes = dto.Notes;
                video.Status = dto.Status;
                video.DateCompleted = dto.DateCompleted;
                video.Rating = dto.Rating;
                video.OwnershipStatus = dto.OwnershipStatus;
                video.Description = dto.Description;
                video.RelatedNotes = dto.RelatedNotes;
                video.Thumbnail = dto.Thumbnail;
                video.VideoType = dto.VideoType;
                video.ParentVideoId = dto.ParentVideoId;
                video.Platform = dto.Platform;
                video.ChannelId = dto.ChannelId;
                video.LengthInSeconds = dto.LengthInSeconds;
                video.ExternalId = dto.ExternalId;

                // Update Topics
                video.Topics.Clear();
                if (dto.Topics?.Length > 0)
                {
                    foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                    {
                        var normalizedTopicName = topicName.Trim().ToLowerInvariant();
                        var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
                        if (existingTopic != null)
                        {
                            video.Topics.Add(existingTopic);
                        }
                        else
                        {
                            video.Topics.Add(new Topic { Name = normalizedTopicName });
                        }
                    }
                }

                // Update Genres
                video.Genres.Clear();
                if (dto.Genres?.Length > 0)
                {
                    foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                    {
                        var normalizedGenreName = genreName.Trim().ToLowerInvariant();
                        var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == normalizedGenreName);
                        if (existingGenre != null)
                        {
                            video.Genres.Add(existingGenre);
                        }
                        else
                        {
                            video.Genres.Add(new Genre { Name = normalizedGenreName });
                        }
                    }
                }

                // Clear change tracker and explicitly update the entity since it was retrieved with AsNoTracking
                _context.ClearChangeTracker();
                _context.Update(video);
                await _context.SaveChangesAsync();

                // Re-index in Typesense after successful update
                await TypesenseIndexingHelper.IndexMediaItemAsync(
                    video,
                    _typeSenseService,
                    TypesenseIndexingHelper.GetVideoFields(video));

                return video;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while updating video with ID {Id}", id);
                throw;
            }
        }

        public async Task<bool> DeleteVideoAsync(Guid id)
        {
            try
            {
                var video = await GetVideoByIdAsync(id);
                if (video == null)
                {
                    return false;
                }

                var videoId = video.Id;

                _context.Remove(video);
                await _context.SaveChangesAsync();

                // Delete from Typesense after successful deletion
                await TypesenseIndexingHelper.DeleteMediaItemAsync(videoId, _typeSenseService);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while deleting video with ID {Id}", id);
                throw;
            }
        }

        public async Task<Video> SaveVideoAsync(Video video, bool updateIfExists = true)
        {
            // Check if a video with the same title already exists
            var existingVideo = await GetVideoByTitleAsync(video.Title, video.ChannelId);

            if (existingVideo != null)
            {
                if (updateIfExists)
                {
                    // Update existing video properties
                    existingVideo.Link = video.Link ?? existingVideo.Link;
                    existingVideo.Notes = video.Notes ?? existingVideo.Notes;
                    existingVideo.Thumbnail = video.Thumbnail ?? existingVideo.Thumbnail;
                    existingVideo.Platform = video.Platform ?? existingVideo.Platform;
                    existingVideo.ChannelId = video.ChannelId ?? existingVideo.ChannelId;
                    existingVideo.LengthInSeconds = video.LengthInSeconds > 0 ? video.LengthInSeconds : existingVideo.LengthInSeconds;
                    // Don't overwrite these if they exist
                    existingVideo.Description = existingVideo.Description ?? video.Description;
                    existingVideo.RelatedNotes = existingVideo.RelatedNotes ?? video.RelatedNotes;

                    await _context.SaveChangesAsync();

                    // Re-index in Typesense after update
                    await TypesenseIndexingHelper.IndexMediaItemAsync(
                        existingVideo,
                        _typeSenseService,
                        TypesenseIndexingHelper.GetVideoFields(existingVideo));

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

                // Index in Typesense after creation
                await TypesenseIndexingHelper.IndexMediaItemAsync(
                    video,
                    _typeSenseService,
                    TypesenseIndexingHelper.GetVideoFields(video));

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

        public async Task<bool> VideoExistsAsync(string title, Guid? channelId = null)
        {
            var query = _context.Videos.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(v => v.Title.ToLower() == title.ToLower());

            // If channel ID is provided, also check that
            if (channelId.HasValue)
            {
                query = query.Where(v => v.ChannelId == channelId.Value);
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

        public async Task<Video> GetVideoByTitleAsync(string title, Guid? channelId = null)
        {
            var query = _context.Videos.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(v => v.Title.ToLower() == title.ToLower());

            // If channel ID is provided, also check that
            if (channelId.HasValue)
            {
                query = query.Where(v => v.ChannelId == channelId.Value);
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
