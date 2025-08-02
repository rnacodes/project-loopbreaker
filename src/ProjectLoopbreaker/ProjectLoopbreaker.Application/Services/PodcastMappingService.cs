using System.Text.Json;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Web.API.DTOs.ListenNotes;

namespace ProjectLoopbreaker.Application.Services
{
    public class PodcastMappingService : IPodcastMappingService
    {
        private readonly JsonSerializerOptions _jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        public PodcastSeries MapToPodcastSeries(string jsonResponse)
        {
            try
            {
                var podcastDto = JsonSerializer.Deserialize<PodcastDto>(jsonResponse, _jsonOptions);

                return new PodcastSeries
                {
                    Title = podcastDto.Title,
                    MediaType = MediaType.Podcast,
                    Link = podcastDto.Website,
                    Notes = podcastDto.Description,
                    Thumbnail = podcastDto.Image ?? podcastDto.Thumbnail,
                    DateAdded = DateTime.UtcNow,
                    Consumed = false,
                };
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Failed to map podcast series from ListenNotes API response", ex);
            }
        }

        public PodcastEpisode MapToPodcastEpisode(string jsonResponse, Guid podcastSeriesId)
        {
            try
            {
                var episodeDto = JsonSerializer.Deserialize<EpisodeDto>(jsonResponse, _jsonOptions);

                return new PodcastEpisode
                {
                    Title = episodeDto.Title,
                    MediaType = MediaType.Podcast,
                    Link = episodeDto.Link,
                    Notes = episodeDto.Description,
                    Thumbnail = episodeDto.Image ?? episodeDto.Thumbnail,
                    DateAdded = DateTime.UtcNow,
                    Consumed = false,
                    PodcastSeriesId = podcastSeriesId,
                    AudioLink = episodeDto.AudioUrl,
                    ReleaseDate = DateTimeOffset.FromUnixTimeMilliseconds(episodeDto.PublishDateMs).DateTime,
                    DurationInSeconds = episodeDto.DurationInSeconds
                };
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Failed to map podcast episode from ListenNotes API response", ex);
            }
        }

        public PodcastSeries MapToPodcastSeriesWithEpisodes(string jsonResponse)
        {
            try
            {
                var podcastDto = JsonSerializer.Deserialize<PodcastDto>(jsonResponse, _jsonOptions);

                var series = MapToPodcastSeries(jsonResponse);

                if (podcastDto.Episodes != null && podcastDto.Episodes.Any())
                {
                    foreach (var episodeDto in podcastDto.Episodes)
                    {
                        var episode = new PodcastEpisode
                        {
                            Title = episodeDto.Title,
                            MediaType = MediaType.Podcast,
                            Link = episodeDto.Link,
                            Notes = episodeDto.Description,
                            Thumbnail = episodeDto.Image ?? episodeDto.Thumbnail,
                            DateAdded = DateTime.UtcNow,
                            Consumed = false,
                            PodcastSeriesId = series.Id, // Link to the series
                            AudioLink = episodeDto.AudioUrl,
                            ReleaseDate = DateTimeOffset.FromUnixTimeMilliseconds(episodeDto.PublishDateMs).DateTime,
                            DurationInSeconds = episodeDto.DurationInSeconds
                        };

                        series.Episodes.Add(episode);
                    }
                }

                return series;
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Failed to map podcast series with episodes from ListenNotes API response", ex);
            }
        }
    }
}
