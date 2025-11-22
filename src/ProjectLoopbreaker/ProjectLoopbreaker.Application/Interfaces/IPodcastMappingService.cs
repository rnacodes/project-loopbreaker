using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.ListenNotes;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IPodcastMappingService
    {
        // Map ListenNotes DTOs to Create DTOs
        CreatePodcastSeriesDto MapFromListenNotesSeriesDto(PodcastSeriesDto podcastDto);
        CreatePodcastEpisodeDto MapFromListenNotesEpisodeDto(PodcastEpisodeDto episodeDto);
    }
}
