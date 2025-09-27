using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Helpers;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Shared.DTOs.YouTube;

namespace ProjectLoopbreaker.Application.Services
{
    public class YouTubeMappingService : IYouTubeMappingService
    {
        public Video MapVideoToEntity(YouTubeVideoDto videoDto)
        {
            if (videoDto?.Snippet == null)
                throw new ArgumentException("Video DTO or snippet cannot be null", nameof(videoDto));

            var video = new Video
            {
                Title = videoDto.Snippet.Title ?? "Unknown Title",
                Description = videoDto.Snippet.Description,
                Link = $"https://www.youtube.com/watch?v={videoDto.Id}",
                Platform = "YouTube",
                ChannelName = videoDto.Snippet.ChannelTitle,
                ExternalId = videoDto.Id,
                MediaType = MediaType.Video,
                VideoType = VideoType.Episode, // Individual videos are episodes
                Thumbnail = GetBestThumbnailUrl(videoDto.Snippet.Thumbnails),
                LengthInSeconds = YouTubeHelper.ParseDurationToSeconds(videoDto.ContentDetails?.Duration),
                DateAdded = DateTime.UtcNow
            };

            return video;
        }

        public Video MapPlaylistToEntity(YouTubePlaylistDto playlistDto)
        {
            if (playlistDto?.Snippet == null)
                throw new ArgumentException("Playlist DTO or snippet cannot be null", nameof(playlistDto));

            var playlist = new Video
            {
                Title = playlistDto.Snippet.Title ?? "Unknown Playlist",
                Description = playlistDto.Snippet.Description,
                Link = $"https://www.youtube.com/playlist?list={playlistDto.Id}",
                Platform = "YouTube",
                ChannelName = playlistDto.Snippet.ChannelTitle,
                ExternalId = playlistDto.Id,
                MediaType = MediaType.Video,
                VideoType = VideoType.Series, // Playlists are series
                Thumbnail = GetBestThumbnailUrl(playlistDto.Snippet.Thumbnails),
                DateAdded = DateTime.UtcNow
            };

            return playlist;
        }

        public Video MapChannelToEntity(YouTubeChannelDto channelDto)
        {
            if (channelDto?.Snippet == null)
                throw new ArgumentException("Channel DTO or snippet cannot be null", nameof(channelDto));

            var channel = new Video
            {
                Title = channelDto.Snippet.Title ?? "Unknown Channel",
                Description = channelDto.Snippet.Description,
                Link = $"https://www.youtube.com/channel/{channelDto.Id}",
                Platform = "YouTube",
                ChannelName = channelDto.Snippet.Title,
                ExternalId = channelDto.Id,
                MediaType = MediaType.Video,
                VideoType = VideoType.Channel, // Channels are channels
                Thumbnail = GetBestThumbnailUrl(channelDto.Snippet.Thumbnails),
                DateAdded = DateTime.UtcNow
            };

            return channel;
        }

        public Video MapPlaylistItemToVideoEntity(YouTubePlaylistItemDto playlistItemDto, YouTubeVideoDto? videoDetails = null)
        {
            if (playlistItemDto?.Snippet == null)
                throw new ArgumentException("Playlist item DTO or snippet cannot be null", nameof(playlistItemDto));

            var videoId = playlistItemDto.Snippet.ResourceId?.VideoId ?? playlistItemDto.ContentDetails?.VideoId;
            
            var video = new Video
            {
                Title = playlistItemDto.Snippet.Title ?? "Unknown Video",
                Description = playlistItemDto.Snippet.Description,
                Link = $"https://www.youtube.com/watch?v={videoId}",
                Platform = "YouTube",
                ChannelName = playlistItemDto.Snippet.ChannelTitle,
                ExternalId = videoId,
                MediaType = MediaType.Video,
                VideoType = VideoType.Episode, // Playlist items are episodes
                Thumbnail = GetBestThumbnailUrl(playlistItemDto.Snippet.Thumbnails),
                DateAdded = DateTime.UtcNow
            };

            // If we have detailed video information, use it to enhance the entity
            if (videoDetails?.ContentDetails != null)
            {
                video.LengthInSeconds = YouTubeHelper.ParseDurationToSeconds(videoDetails.ContentDetails.Duration);
            }

            if (videoDetails?.Snippet != null)
            {
                // Use more detailed information from video details if available
                video.Description = videoDetails.Snippet.Description ?? video.Description;
                video.Thumbnail = GetBestThumbnailUrl(videoDetails.Snippet.Thumbnails) ?? video.Thumbnail;
            }

            return video;
        }

        public List<Video> MapPlaylistItemsToVideoEntities(List<YouTubePlaylistItemDto> playlistItems, List<YouTubeVideoDto>? videoDetails = null)
        {
            var videos = new List<Video>();
            
            foreach (var item in playlistItems)
            {
                var videoId = item.Snippet?.ResourceId?.VideoId ?? item.ContentDetails?.VideoId;
                var details = videoDetails?.FirstOrDefault(v => v.Id == videoId);
                
                try
                {
                    var video = MapPlaylistItemToVideoEntity(item, details);
                    videos.Add(video);
                }
                catch (Exception)
                {
                    // Skip items that can't be mapped (e.g., deleted videos)
                    continue;
                }
            }

            return videos;
        }

        private static string? GetBestThumbnailUrl(YouTubeThumbnailsDto? thumbnails)
        {
            if (thumbnails == null)
                return null;

            // Prefer higher quality thumbnails
            return thumbnails.Maxres?.Url ??
                   thumbnails.Standard?.Url ??
                   thumbnails.High?.Url ??
                   thumbnails.Medium?.Url ??
                   thumbnails.Default?.Url;
        }
    }
}
