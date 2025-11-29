using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Shared.DTOs.YouTube;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class YouTubePlaylistService : IYouTubePlaylistService
    {
        private readonly IApplicationDbContext _context;
        private readonly IYouTubeApiClient _youTubeApiClient;
        private readonly IYouTubeMappingService _mappingService;
        private readonly IVideoService _videoService;
        private readonly ILogger<YouTubePlaylistService> _logger;

        public YouTubePlaylistService(
            IApplicationDbContext context,
            IYouTubeApiClient youTubeApiClient,
            IYouTubeMappingService mappingService,
            IVideoService videoService,
            ILogger<YouTubePlaylistService> logger)
        {
            _context = context;
            _youTubeApiClient = youTubeApiClient;
            _mappingService = mappingService;
            _videoService = videoService;
            _logger = logger;
        }

        public async Task<YouTubePlaylist?> GetPlaylistByIdAsync(Guid id, bool includeVideos = false)
        {
            var query = _context.YouTubePlaylists.AsQueryable();

            if (includeVideos)
            {
                query = query
                    .Include(p => p.PlaylistVideos)
                    .ThenInclude(pv => pv.Video);
            }

            return await query.FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<YouTubePlaylist?> GetPlaylistByExternalIdAsync(string externalId, bool includeVideos = false)
        {
            var query = _context.YouTubePlaylists.AsQueryable();

            if (includeVideos)
            {
                query = query
                    .Include(p => p.PlaylistVideos)
                    .ThenInclude(pv => pv.Video);
            }

            return await query.FirstOrDefaultAsync(p => p.PlaylistExternalId == externalId);
        }

        public async Task<List<YouTubePlaylist>> GetAllPlaylistsAsync()
        {
            return await _context.YouTubePlaylists
                .Include(p => p.Topics)
                .Include(p => p.Genres)
                .ToListAsync();
        }

        public async Task<List<Video>> GetPlaylistVideosAsync(Guid playlistId)
        {
            var playlist = await _context.YouTubePlaylists
                .Include(p => p.PlaylistVideos)
                .ThenInclude(pv => pv.Video)
                .FirstOrDefaultAsync(p => p.Id == playlistId);

            if (playlist == null)
                return new List<Video>();

            return playlist.PlaylistVideos
                .OrderBy(pv => pv.Position)
                .Select(pv => pv.Video)
                .ToList();
        }

        public async Task<YouTubePlaylist> ImportPlaylistFromYouTubeAsync(string playlistExternalId)
        {
            try
            {
                _logger.LogInformation($"Importing YouTube playlist: {playlistExternalId}");

                // Check if playlist already exists
                var existingPlaylist = await GetPlaylistByExternalIdAsync(playlistExternalId, includeVideos: true);
                if (existingPlaylist != null)
                {
                    _logger.LogInformation($"Playlist {playlistExternalId} already exists, syncing videos...");
                    return await SyncPlaylistVideosAsync(existingPlaylist.Id);
                }

                // Get playlist details from YouTube API
                var playlistDto = await _youTubeApiClient.GetPlaylistDetailsAsync(playlistExternalId);
                if (playlistDto == null)
                {
                    throw new InvalidOperationException($"Playlist with ID {playlistExternalId} not found on YouTube");
                }

                // Create playlist entity
                var playlist = _mappingService.MapPlaylistToYouTubePlaylistEntity(playlistDto);

                // Try to link to YouTubeChannel if it exists
                if (!string.IsNullOrEmpty(playlist.ChannelExternalId))
                {
                    var linkedChannel = await _context.YouTubeChannels
                        .FirstOrDefaultAsync(c => c.ChannelExternalId == playlist.ChannelExternalId);
                    
                    if (linkedChannel != null)
                    {
                        playlist.LinkedYouTubeChannelId = linkedChannel.Id;
                        _logger.LogInformation($"Linked playlist to existing channel: {linkedChannel.Title}");
                    }
                }

                // Save playlist
                var savedPlaylist = await SavePlaylistAsync(playlist, updateIfExists: false);

                // Get all playlist items (videos)
                var playlistItems = await _youTubeApiClient.GetAllPlaylistItemsAsync(playlistExternalId);
                var videoIds = playlistItems
                    .Select(item => item.Snippet?.ResourceId?.VideoId ?? item.ContentDetails?.VideoId)
                    .Where(id => !string.IsNullOrEmpty(id))
                    .Cast<string>()
                    .ToList();

                _logger.LogInformation($"Found {videoIds.Count} videos in playlist");

                // Get detailed video information
                var videoDetails = new List<YouTubeVideoDto>();
                if (videoIds.Any())
                {
                    for (int i = 0; i < videoIds.Count; i += 50)
                    {
                        var batch = videoIds.Skip(i).Take(50).ToList();
                        var batchDetails = await _youTubeApiClient.GetVideosAsync(batch);
                        videoDetails.AddRange(batchDetails);
                    }
                }

                // Import videos and link to playlist
                for (int i = 0; i < playlistItems.Count; i++)
                {
                    var item = playlistItems[i];
                    var videoId = item.Snippet?.ResourceId?.VideoId ?? item.ContentDetails?.VideoId;
                    
                    if (string.IsNullOrEmpty(videoId))
                        continue;

                    try
                    {
                        var videoDto = videoDetails.FirstOrDefault(v => v.Id == videoId);
                        var video = _mappingService.MapPlaylistItemToVideoEntity(item, videoDto);

                        // Try to link video to channel if available
                        await AutoLinkChannelToVideo(video, videoDetails);

                        var savedVideo = await _videoService.SaveVideoAsync(video, updateIfExists: true);

                        // Create playlist-video association
                        var playlistVideo = new YouTubePlaylistVideo
                        {
                            YouTubePlaylistId = savedPlaylist.Id,
                            VideoId = savedVideo.Id,
                            Position = item.Snippet?.Position,
                            VideoPublishedAt = item.ContentDetails?.VideoPublishedAt
                        };

                        _context.Add(playlistVideo);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Failed to import video {videoId} for playlist {playlistExternalId}");
                        continue;
                    }
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation($"Successfully imported playlist {savedPlaylist.Title} with {playlistItems.Count} videos");

                // Return playlist with videos
                return await GetPlaylistByIdAsync(savedPlaylist.Id, includeVideos: true) 
                    ?? savedPlaylist;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error importing YouTube playlist: {playlistExternalId}");
                throw;
            }
        }

        public async Task<YouTubePlaylist> SyncPlaylistVideosAsync(Guid playlistId)
        {
            var playlist = await GetPlaylistByIdAsync(playlistId, includeVideos: true);
            if (playlist == null)
                throw new InvalidOperationException($"Playlist with ID {playlistId} not found");

            _logger.LogInformation($"Syncing playlist: {playlist.Title}");

            // Get current videos from YouTube
            var playlistItems = await _youTubeApiClient.GetAllPlaylistItemsAsync(playlist.PlaylistExternalId);
            var currentVideoExternalIds = playlistItems
                .Select(item => item.Snippet?.ResourceId?.VideoId ?? item.ContentDetails?.VideoId)
                .Where(id => !string.IsNullOrEmpty(id))
                .ToHashSet();

            // Get existing videos in our database
            var existingPlaylistVideos = playlist.PlaylistVideos.ToList();

            // Remove videos no longer in the playlist
            var videosToRemove = existingPlaylistVideos
                .Where(pv => !currentVideoExternalIds.Contains(pv.Video.ExternalId))
                .ToList();

            foreach (var pv in videosToRemove)
            {
                _context.Remove(pv);
            }

            // Add new videos
            var existingVideoExternalIds = existingPlaylistVideos
                .Select(pv => pv.Video.ExternalId)
                .ToHashSet();

            var newVideoExternalIds = currentVideoExternalIds
                .Where(id => !existingVideoExternalIds.Contains(id))
                .ToList();

            if (newVideoExternalIds.Any())
            {
                // Get detailed video information
                var videoDetails = new List<YouTubeVideoDto>();
                for (int i = 0; i < newVideoExternalIds.Count; i += 50)
                {
                    var batch = newVideoExternalIds.Skip(i).Take(50).ToList();
                    var batchDetails = await _youTubeApiClient.GetVideosAsync(batch);
                    videoDetails.AddRange(batchDetails);
                }

                foreach (var item in playlistItems.Where(item => newVideoExternalIds.Contains(item.Snippet?.ResourceId?.VideoId)))
                {
                    var videoId = item.Snippet?.ResourceId?.VideoId ?? item.ContentDetails?.VideoId;
                    if (string.IsNullOrEmpty(videoId))
                        continue;

                    try
                    {
                        var videoDto = videoDetails.FirstOrDefault(v => v.Id == videoId);
                        var video = _mappingService.MapPlaylistItemToVideoEntity(item, videoDto);

                        await AutoLinkChannelToVideo(video, videoDetails);

                        var savedVideo = await _videoService.SaveVideoAsync(video, updateIfExists: true);

                        var playlistVideo = new YouTubePlaylistVideo
                        {
                            YouTubePlaylistId = playlist.Id,
                            VideoId = savedVideo.Id,
                            Position = item.Snippet?.Position,
                            VideoPublishedAt = item.ContentDetails?.VideoPublishedAt
                        };

                        _context.Add(playlistVideo);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, $"Failed to import video {videoId} during sync");
                        continue;
                    }
                }
            }

            // Update playlist metadata
            playlist.LastSyncedAt = DateTime.UtcNow;
            playlist.VideoCount = playlistItems.Count;
            _context.Update(playlist);

            await _context.SaveChangesAsync();

            _logger.LogInformation($"Synced playlist {playlist.Title}: Added {newVideoExternalIds.Count}, Removed {videosToRemove.Count}");

            return await GetPlaylistByIdAsync(playlistId, includeVideos: true) ?? playlist;
        }

        public async Task<bool> AddVideoToPlaylistAsync(Guid playlistId, Guid videoId, int? position = null)
        {
            var playlist = await GetPlaylistByIdAsync(playlistId);
            if (playlist == null)
                return false;

            var video = await _context.Videos.FirstOrDefaultAsync(v => v.Id == videoId);
            if (video == null)
                return false;

            // Check if already exists - we need to query through the playlist's navigation property
            var playlistWithVideos = await _context.YouTubePlaylists
                .Include(p => p.PlaylistVideos)
                .FirstOrDefaultAsync(p => p.Id == playlistId);
            
            if (playlistWithVideos == null)
                return false;

            var existing = playlistWithVideos.PlaylistVideos
                .FirstOrDefault(pv => pv.VideoId == videoId);

            if (existing != null)
                return true; // Already exists

            var playlistVideo = new YouTubePlaylistVideo
            {
                YouTubePlaylistId = playlistId,
                VideoId = videoId,
                Position = position
            };

            _context.Add(playlistVideo);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> RemoveVideoFromPlaylistAsync(Guid playlistId, Guid videoId)
        {
            var playlistWithVideos = await _context.YouTubePlaylists
                .Include(p => p.PlaylistVideos)
                .FirstOrDefaultAsync(p => p.Id == playlistId);
            
            if (playlistWithVideos == null)
                return false;

            var playlistVideo = playlistWithVideos.PlaylistVideos
                .FirstOrDefault(pv => pv.VideoId == videoId);

            if (playlistVideo == null)
                return false;

            _context.Remove(playlistVideo);
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<YouTubePlaylist> SavePlaylistAsync(YouTubePlaylist playlist, bool updateIfExists = false)
        {
            var existingPlaylist = await _context.YouTubePlaylists
                .Include(p => p.Topics)
                .Include(p => p.Genres)
                .FirstOrDefaultAsync(p => p.PlaylistExternalId == playlist.PlaylistExternalId);

            if (existingPlaylist != null)
            {
                if (updateIfExists)
                {
                    // Update existing playlist
                    existingPlaylist.Title = playlist.Title;
                    existingPlaylist.Description = playlist.Description;
                    existingPlaylist.Link = playlist.Link;
                    existingPlaylist.Thumbnail = playlist.Thumbnail;
                    existingPlaylist.VideoCount = playlist.VideoCount;
                    existingPlaylist.PrivacyStatus = playlist.PrivacyStatus;
                    existingPlaylist.LastSyncedAt = DateTime.UtcNow;

                    _context.Update(existingPlaylist);
                    await _context.SaveChangesAsync();

                    return existingPlaylist;
                }
                else
                {
                    return existingPlaylist;
                }
            }

            // Topics and Genres will be handled via the navigation properties
            // EF Core will automatically track and manage these relationships
            _context.Add(playlist);
            await _context.SaveChangesAsync();

            return playlist;
        }

        public async Task<bool> DeletePlaylistAsync(Guid id)
        {
            var playlist = await _context.YouTubePlaylists.FirstOrDefaultAsync(p => p.Id == id);
            if (playlist == null)
                return false;

            _context.Remove(playlist);
            await _context.SaveChangesAsync();

            return true;
        }

        private async Task AutoLinkChannelToVideo(Video video, List<YouTubeVideoDto> videoDetails)
        {
            var videoDto = videoDetails.FirstOrDefault(v => v.Id == video.ExternalId);
            if (videoDto?.Snippet?.ChannelId == null)
                return;

            var channelExternalId = videoDto.Snippet.ChannelId;
            var linkedChannel = await _context.YouTubeChannels
                .FirstOrDefaultAsync(c => c.ChannelExternalId == channelExternalId);

            if (linkedChannel != null)
            {
                video.ChannelId = linkedChannel.Id;
                _logger.LogDebug($"Linked video '{video.Title}' to channel '{linkedChannel.Title}'");
            }
        }
    }
}

