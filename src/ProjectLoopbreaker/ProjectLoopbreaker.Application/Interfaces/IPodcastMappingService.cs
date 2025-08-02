using ProjectLoopbreaker.Domain.Entities;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IPodcastMappingService
    {
        PodcastSeries MapToPodcastSeries(string jsonResponse);
        PodcastEpisode MapToPodcastEpisode(string jsonResponse, Guid podcastSeriesId);
        PodcastSeries MapToPodcastSeriesWithEpisodes(string jsonResponse);
    }
}
