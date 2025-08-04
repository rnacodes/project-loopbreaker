using System.Text.Json;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Shared.DTOs.ListenNotes;

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
                var podcastDto = JsonSerializer.Deserialize<PodcastSeriesDto>(jsonResponse, _jsonOptions);

                // Try to extract genre information from the raw JSON if not in the DTO
                string? genreInfo = null;
                var jsonDocument = JsonDocument.Parse(jsonResponse);
                if (jsonDocument.RootElement.TryGetProperty("genres", out var genresElement))
                {
                    // If genres is available, extract it as a comma-separated list
                    if (genresElement.ValueKind == JsonValueKind.Array)
                    {
                        var genres = new List<string>();
                        foreach (var genre in genresElement.EnumerateArray())
                        {
                            if (genre.TryGetProperty("name", out var nameElement))
                            {
                                genres.Add(nameElement.GetString() ?? string.Empty);
                            }
                        }
                        genreInfo = string.Join(", ", genres);
                    }
                }

                return new PodcastSeries
                {
                    Title = podcastDto.Title,
                    MediaType = MediaType.Podcast,
                    //Link = podcastDto.Website,
                    Notes = podcastDto.Description,
                    Thumbnail = podcastDto.Image ?? podcastDto.Thumbnail,
                    DateAdded = DateTime.UtcNow,
                    Consumed = false,
                    Genre = genreInfo, // Add the extracted genre information
                                       // Topics can be populated later if available
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
                var episodeDto = JsonSerializer.Deserialize<PodcastEpisodeDto>(jsonResponse, _jsonOptions);

                // Try to extract topics from the raw JSON if available
                string? topicsInfo = null;
                var jsonDocument = JsonDocument.Parse(jsonResponse);
                if (jsonDocument.RootElement.TryGetProperty("topics", out var topicsElement))
                {
                    // If topics is available, extract it as a comma-separated list
                    if (topicsElement.ValueKind == JsonValueKind.Array)
                    {
                        var topics = new List<string>();
                        foreach (var topic in topicsElement.EnumerateArray())
                        {
                            topics.Add(topic.GetString() ?? string.Empty);
                        }
                        topicsInfo = string.Join(", ", topics);
                    }
                }

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
                    DurationInSeconds = episodeDto.DurationInSeconds,
                    Topics = topicsInfo // Add topics information if available
                                        // Genre is typically associated with the series, not individual episodes
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
                var podcastDto = JsonSerializer.Deserialize<PodcastSeriesDto>(jsonResponse, _jsonOptions);

                var series = MapToPodcastSeries(jsonResponse);

                if (podcastDto.Episodes != null && podcastDto.Episodes.Any())
                {
                    foreach (var episodeDto in podcastDto.Episodes)
                    {
                        // Convert episodeDto to JSON to reuse the MapToPodcastEpisode method
                        string episodeJson = JsonSerializer.Serialize(episodeDto, _jsonOptions);
                        var episode = MapToPodcastEpisode(episodeJson, series.Id);
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
