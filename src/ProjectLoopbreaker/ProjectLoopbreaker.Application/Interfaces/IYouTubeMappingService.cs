using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Shared.DTOs.YouTube;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IYouTubeMappingService
    {
        Video MapVideoToEntity(YouTubeVideoDto videoDto);
        Video MapPlaylistToEntity(YouTubePlaylistDto playlistDto);
        Video MapChannelToEntity(YouTubeChannelDto channelDto); // Deprecated - use MapChannelToYouTubeChannelEntity
        YouTubeChannel MapChannelToYouTubeChannelEntity(YouTubeChannelDto channelDto);
        Video MapPlaylistItemToVideoEntity(YouTubePlaylistItemDto playlistItemDto, YouTubeVideoDto? videoDetails = null);
        List<Video> MapPlaylistItemsToVideoEntities(List<YouTubePlaylistItemDto> playlistItems, List<YouTubeVideoDto>? videoDetails = null);
    }
}
