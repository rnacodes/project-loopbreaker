using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Helpers;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Shared.DTOs.YouTube;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.Application.Services
{
    public class YouTubeService : IYouTubeService
    {
        private readonly IYouTubeApiClient _youTubeApiClient;
        private readonly IYouTubeMappingService _mappingService;
        private readonly IVideoService _videoService;
        private readonly ILogger<YouTubeService> _logger;

        public YouTubeService(
            IYouTubeApiClient youTubeApiClient,
            IYouTubeMappingService mappingService,
            IVideoService videoService,
            ILogger<YouTubeService> logger)
        {
            _youTubeApiClient = youTubeApiClient;
            _mappingService = mappingService;
            _videoService = videoService;
            _logger = logger;
        }

        public async Task<YouTubeSearchResultDto> SearchAsync(string query, string type = "video", int maxResults = 25, string? pageToken = null, string? channelId = null)
        {
            return await _youTubeApiClient.SearchAsync(query, type, maxResults, pageToken, channelId);
        }

        public async Task<YouTubeVideoDto?> GetVideoDetailsAsync(string videoId)
        {
            return await _youTubeApiClient.GetVideoDetailsAsync(videoId);
        }

        public async Task<List<YouTubeVideoDto>> GetVideosAsync(List<string> videoIds)
        {
            return await _youTubeApiClient.GetVideosAsync(videoIds);
        }

        public async Task<YouTubePlaylistDto?> GetPlaylistDetailsAsync(string playlistId)
        {
            return await _youTubeApiClient.GetPlaylistDetailsAsync(playlistId);
        }

        public async Task<List<YouTubePlaylistItemDto>> GetPlaylistItemsAsync(string playlistId, int maxResults = 50, string? pageToken = null)
        {
            return await _youTubeApiClient.GetPlaylistItemsAsync(playlistId, maxResults, pageToken);
        }

        public async Task<List<YouTubePlaylistItemDto>> GetAllPlaylistItemsAsync(string playlistId)
        {
            return await _youTubeApiClient.GetAllPlaylistItemsAsync(playlistId);
        }

        public async Task<YouTubeChannelDto?> GetChannelDetailsAsync(string channelId)
        {
            return await _youTubeApiClient.GetChannelDetailsAsync(channelId);
        }

        public async Task<YouTubeChannelDto?> GetChannelByUsernameAsync(string username)
        {
            return await _youTubeApiClient.GetChannelByUsernameAsync(username);
        }

        public async Task<List<YouTubePlaylistItemDto>> GetChannelUploadsAsync(string channelId, int maxResults = 25, string? pageToken = null)
        {
            return await _youTubeApiClient.GetChannelUploadsAsync(channelId, maxResults, pageToken);
        }

        public async Task<Video> ImportVideoAsync(string videoId)
        {
            try
            {
                _logger.LogInformation($"Importing YouTube video: {videoId}");

                var videoDto = await _youTubeApiClient.GetVideoDetailsAsync(videoId);
                if (videoDto == null)
                {
                    throw new InvalidOperationException($"Video with ID {videoId} not found");
                }

                var video = _mappingService.MapVideoToEntity(videoDto);
                var savedVideo = await _videoService.SaveVideoAsync(video, updateIfExists: true);

                _logger.LogInformation($"Successfully imported YouTube video: {video.Title}");
                return savedVideo;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error importing YouTube video: {videoId}");
                throw;
            }
        }

        public async Task<List<Video>> ImportPlaylistAsync(string playlistId, bool importAsChannel = false)
        {
            try
            {
                _logger.LogInformation($"Importing YouTube playlist: {playlistId}");

                var playlistDto = await _youTubeApiClient.GetPlaylistDetailsAsync(playlistId);
                if (playlistDto == null)
                {
                    throw new InvalidOperationException($"Playlist with ID {playlistId} not found");
                }

                var playlistItems = await _youTubeApiClient.GetAllPlaylistItemsAsync(playlistId);
                var videoIds = playlistItems
                    .Select(item => item.Snippet?.ResourceId?.VideoId ?? item.ContentDetails?.VideoId)
                    .Where(id => !string.IsNullOrEmpty(id))
                    .Cast<string>()
                    .ToList();

                // Get detailed video information for better mapping
                var videoDetails = new List<YouTubeVideoDto>();
                if (videoIds.Any())
                {
                    // YouTube API allows up to 50 video IDs per request
                    for (int i = 0; i < videoIds.Count; i += 50)
                    {
                        var batch = videoIds.Skip(i).Take(50).ToList();
                        var batchDetails = await _youTubeApiClient.GetVideosAsync(batch);
                        videoDetails.AddRange(batchDetails);
                    }
                }

                var videos = new List<Video>();

                if (importAsChannel)
                {
                    // Create a channel/series entity for the playlist
                    var playlistEntity = _mappingService.MapPlaylistToEntity(playlistDto);
                    var savedPlaylist = await _videoService.SaveVideoAsync(playlistEntity, updateIfExists: true);
                    videos.Add(savedPlaylist);

                    // Import individual videos as episodes of the playlist
                    var episodeVideos = _mappingService.MapPlaylistItemsToVideoEntities(playlistItems, videoDetails);
                    foreach (var episode in episodeVideos)
                    {
                        episode.ParentVideoId = savedPlaylist.Id;
                        episode.VideoType = VideoType.Episode;
                        var savedEpisode = await _videoService.SaveVideoAsync(episode, updateIfExists: true);
                        videos.Add(savedEpisode);
                    }
                }
                else
                {
                    // Import each video individually without creating a series
                    var individualVideos = _mappingService.MapPlaylistItemsToVideoEntities(playlistItems, videoDetails);
                    foreach (var video in individualVideos)
                    {
                        var savedVideo = await _videoService.SaveVideoAsync(video, updateIfExists: true);
                        videos.Add(savedVideo);
                    }
                }

                _logger.LogInformation($"Successfully imported {videos.Count} videos from YouTube playlist: {playlistDto.Snippet?.Title}");
                return videos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error importing YouTube playlist: {playlistId}");
                throw;
            }
        }

        public async Task<Video> ImportChannelAsync(string channelId)
        {
            try
            {
                _logger.LogInformation($"Importing YouTube channel: {channelId}");

                var channelDto = await _youTubeApiClient.GetChannelDetailsAsync(channelId);
                if (channelDto == null)
                {
                    throw new InvalidOperationException($"Channel with ID {channelId} not found");
                }

                var channel = _mappingService.MapChannelToEntity(channelDto);
                var savedChannel = await _videoService.SaveVideoAsync(channel, updateIfExists: true);

                _logger.LogInformation($"Successfully imported YouTube channel: {channel.Title}");
                return savedChannel;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error importing YouTube channel: {channelId}");
                throw;
            }
        }

        public async Task<Video> ImportFromUrlAsync(string url)
        {
            try
            {
                _logger.LogInformation($"Importing from YouTube URL: {url}");

                // Try to extract video ID first
                var videoId = YouTubeHelper.ExtractVideoIdFromUrl(url);
                if (!string.IsNullOrEmpty(videoId))
                {
                    return await ImportVideoAsync(videoId);
                }

                // Try to extract playlist ID
                var playlistId = YouTubeHelper.ExtractPlaylistIdFromUrl(url);
                if (!string.IsNullOrEmpty(playlistId))
                {
                    var videos = await ImportPlaylistAsync(playlistId, importAsChannel: true);
                    return videos.FirstOrDefault() ?? throw new InvalidOperationException("No videos imported from playlist");
                }

                // Try to extract channel ID
                var channelId = YouTubeHelper.ExtractChannelIdFromUrl(url);
                if (!string.IsNullOrEmpty(channelId))
                {
                    return await ImportChannelAsync(channelId);
                }

                throw new ArgumentException($"Unable to extract valid YouTube ID from URL: {url}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error importing from YouTube URL: {url}");
                throw;
            }
        }
    }
}
