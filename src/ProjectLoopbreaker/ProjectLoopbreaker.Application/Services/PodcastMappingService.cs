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

        public async Task<Podcast> MapToPodcastAsync(string jsonResponse)
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

                var podcast = new Podcast
                {
                    Title = podcastDto?.Title ?? string.Empty,
                    MediaType = MediaType.Podcast,
                    PodcastType = PodcastType.Series, // Default to Series for API imports
                    //Link = podcastDto.Website,
                    Notes = podcastDto.Description,
                    Thumbnail = podcastDto.Image ?? podcastDto.Thumbnail,
                    DateAdded = DateTime.UtcNow,
                    Status = Status.Uncharted,
                    Genre = genreInfo, // Keep the old Genre property for backward compatibility
                    ExternalId = podcastDto.Id,
                    Publisher = podcastDto.Publisher
                };

                // Add genres to the new Genres collection
                if (!string.IsNullOrEmpty(genreInfo))
                {
                    var genreNames = genreInfo.Split(',').Select(g => g.Trim()).Where(g => !string.IsNullOrEmpty(g));
                    foreach (var genreName in genreNames)
                    {
                        podcast.Genres.Add(new Genre { Name = genreName });
                    }
                }

                return await Task.FromResult(podcast);
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Failed to map podcast series from ListenNotes API response", ex);
            }
        }

        public async Task<Podcast> MapToPodcastEpisodeAsync(string jsonResponse, Guid? parentPodcastId = null)
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

                var podcastEpisode = new Podcast
                {
                    Title = episodeDto.Title ?? string.Empty,
                    MediaType = MediaType.Podcast,
                    PodcastType = PodcastType.Episode,
                    Link = episodeDto.Link,
                    Notes = episodeDto.Description,
                    Thumbnail = episodeDto.Image ?? episodeDto.Thumbnail,
                    DateAdded = DateTime.UtcNow,
                    Status = Status.Uncharted,
                    ParentPodcastId = parentPodcastId,
                    AudioLink = episodeDto.AudioUrl,
                    ReleaseDate = DateTimeOffset.FromUnixTimeMilliseconds(episodeDto.PublishDateMs).DateTime,
                    DurationInSeconds = episodeDto.DurationInSeconds,
                    ExternalId = episodeDto.Id
                };

                // Add topics to the new Topics collection
                if (!string.IsNullOrEmpty(topicsInfo))
                {
                    var topicNames = topicsInfo.Split(',').Select(t => t.Trim()).Where(t => !string.IsNullOrEmpty(t));
                    foreach (var topicName in topicNames)
                    {
                        podcastEpisode.Topics.Add(new Topic { Name = topicName });
                    }
                }

                return await Task.FromResult(podcastEpisode);
            }
            catch (Exception ex)
            {
                throw new ApplicationException("Failed to map podcast episode from ListenNotes API response", ex);
            }
        }

        public async Task<Podcast> MapToPodcastWithEpisodesAsync(string jsonResponse)
        {
            try
            {
                var podcastDto = JsonSerializer.Deserialize<PodcastSeriesDto>(jsonResponse, _jsonOptions);

                var series = await MapToPodcastAsync(jsonResponse);

                if (podcastDto.Episodes != null && podcastDto.Episodes.Any())
                {
                    foreach (var episodeDto in podcastDto.Episodes)
                    {
                        // Convert episodeDto to JSON to reuse the MapToPodcastEpisode method
                        string episodeJson = JsonSerializer.Serialize(episodeDto, _jsonOptions);
                        var episode = await MapToPodcastEpisodeAsync(episodeJson, series.Id);
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
