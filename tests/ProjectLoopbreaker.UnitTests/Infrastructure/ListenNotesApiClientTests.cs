using System.Net;
using System.Text;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Moq.Protected;
using ProjectLoopbreaker.Infrastructure.Clients;
using ProjectLoopbreaker.Shared.DTOs.ListenNotes;

namespace ProjectLoopbreaker.UnitTests.Infrastructure
{
    public class ListenNotesApiClientTests
    {
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly Mock<ILogger<ListenNotesApiClient>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly HttpClient _httpClient;
        private readonly ListenNotesApiClient _listenNotesApiClient;
        private readonly JsonSerializerOptions _jsonOptions;

        public ListenNotesApiClientTests()
        {
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            _mockLogger = new Mock<ILogger<ListenNotesApiClient>>();
            _mockConfiguration = new Mock<IConfiguration>();
            
            _httpClient = new HttpClient(_mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://listen-api.listennotes.com/api/v2/")
            };

            // Setup configuration to return test API key
            _mockConfiguration.Setup(x => x["ApiKeys:ListenNotes"]).Returns("test-api-key");

            _listenNotesApiClient = new ListenNotesApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };
        }

        #region Search Operations Tests

        [Fact]
        public async Task SearchAsync_ShouldReturnSearchResults_WhenValidResponseReceived()
        {
            // Arrange
            var query = "joe rogan";
            var expectedResult = CreateSearchResultDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.SearchAsync(query);

            // Assert
            result.Should().NotBeNull();
            result.Count.Should().Be(expectedResult.Count);
            result.Total.Should().Be(expectedResult.Total);
            result.Results.Should().HaveCount(expectedResult.Results.Count);
            VerifyHttpRequest("GET", "search?q=joe%20rogan");
        }

        [Fact]
        public async Task SearchAsync_ShouldIncludeAllParameters_WhenAllParametersProvided()
        {
            // Arrange
            var query = "test";
            var type = "podcast";
            var offset = 10;
            var lenMin = 30;
            var lenMax = 60;
            var genreIds = "1,2,3";
            var publishedBefore = "2023-01-01";
            var publishedAfter = "2022-01-01";
            var onlyIn = "title";
            var language = "en";
            var region = "us";
            var sortByDate = "1";
            var safeMode = "1";
            var uniquePodcasts = "1";
            
            var expectedResult = CreateSearchResultDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.SearchAsync(query, type, offset, lenMin, lenMax, genreIds, publishedBefore, publishedAfter, onlyIn, language, region, sortByDate, safeMode, uniquePodcasts);

            // Assert
            result.Should().NotBeNull();
            VerifyHttpRequest("GET", "search?q=test&type=podcast&offset=10&len_min=30&len_max=60&genre_ids=1%2C2%2C3&published_before=2023-01-01&published_after=2022-01-01&only_in=title&language=en&region=us&sort_by_date=1&safe_mode=1&unique_podcasts=1");
        }

        [Fact]
        public async Task SearchAsync_ShouldThrowException_WhenHttpRequestFails()
        {
            // Arrange
            var query = "test";
            SetupHttpResponse(HttpStatusCode.InternalServerError, "Internal Server Error");

            // Act & Assert
            await Assert.ThrowsAsync<HttpRequestException>(() => _listenNotesApiClient.SearchAsync(query));
        }

        #endregion

        #region Podcast Operations Tests

        [Fact]
        public async Task GetPodcastByIdAsync_ShouldReturnPodcastDetails_WhenValidResponseReceived()
        {
            // Arrange
            var podcastId = "test-podcast-id";
            var expectedResult = CreatePodcastSeriesDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetPodcastByIdAsync(podcastId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(expectedResult.Id);
            result.Title.Should().Be(expectedResult.Title);
            result.Publisher.Should().Be(expectedResult.Publisher);
            VerifyHttpRequest("GET", $"podcasts/{podcastId}");
        }

        [Fact]
        public async Task GetBestPodcastsAsync_ShouldReturnBestPodcasts_WhenValidResponseReceived()
        {
            // Arrange
            var expectedResult = CreateBestPodcastsDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetBestPodcastsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(expectedResult.Id);
            result.Name.Should().Be(expectedResult.Name);
            result.Total.Should().Be(expectedResult.Total);
            VerifyHttpRequest("GET", "best_podcasts");
        }

        [Fact]
        public async Task GetBestPodcastsAsync_ShouldIncludeParameters_WhenParametersProvided()
        {
            // Arrange
            var genreId = 1;
            var page = 2;
            var region = "us";
            var sortByDate = "1";
            var safeMode = true;
            
            var expectedResult = CreateBestPodcastsDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetBestPodcastsAsync(genreId, page, region, sortByDate, safeMode);

            // Assert
            result.Should().NotBeNull();
            VerifyHttpRequest("GET", "best_podcasts?genre_id=1&page=2&region=us&sort_by_date=1&safe_mode=true");
        }

        [Fact]
        public async Task GetPodcastRecommendationsAsync_ShouldReturnRecommendations_WhenValidResponseReceived()
        {
            // Arrange
            var podcastId = "test-podcast-id";
            var expectedResult = CreateRecommendationsDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetPodcastRecommendationsAsync(podcastId);

            // Assert
            result.Should().NotBeNull();
            result.Recommendations.Should().HaveCount(expectedResult.Recommendations.Count);
            VerifyHttpRequest("GET", $"podcasts/{podcastId}/recommendations");
        }

        #endregion

        #region Episode Operations Tests

        [Fact]
        public async Task GetEpisodeByIdAsync_ShouldReturnEpisodeDetails_WhenValidResponseReceived()
        {
            // Arrange
            var episodeId = "test-episode-id";
            var expectedResult = CreatePodcastEpisodeDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetEpisodeByIdAsync(episodeId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(expectedResult.Id);
            result.Title.Should().Be(expectedResult.Title);
            result.DurationInSeconds.Should().Be(expectedResult.DurationInSeconds);
            VerifyHttpRequest("GET", $"episodes/{episodeId}");
        }

        [Fact]
        public async Task GetEpisodeRecommendationsAsync_ShouldReturnRecommendations_WhenValidResponseReceived()
        {
            // Arrange
            var episodeId = "test-episode-id";
            var expectedResult = CreateRecommendationsDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetEpisodeRecommendationsAsync(episodeId);

            // Assert
            result.Should().NotBeNull();
            result.Recommendations.Should().HaveCount(expectedResult.Recommendations.Count);
            VerifyHttpRequest("GET", $"episodes/{episodeId}/recommendations");
        }

        #endregion

        #region Playlist Operations Tests

        [Fact]
        public async Task GetPlaylistsAsync_ShouldReturnPlaylists_WhenValidResponseReceived()
        {
            // Arrange
            var expectedResult = CreatePlaylistsDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetPlaylistsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Total.Should().Be(expectedResult.Total);
            result.Playlists.Should().HaveCount(expectedResult.Playlists.Count);
            VerifyHttpRequest("GET", "playlists");
        }

        [Fact]
        public async Task GetPlaylistByIdAsync_ShouldReturnPlaylistDetails_WhenValidResponseReceived()
        {
            // Arrange
            var playlistId = "test-playlist-id";
            var expectedResult = CreatePlaylistDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetPlaylistByIdAsync(playlistId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(expectedResult.Id);
            result.Name.Should().Be(expectedResult.Name);
            VerifyHttpRequest("GET", $"playlists/{playlistId}");
        }

        #endregion

        #region Genre Operations Tests

        [Fact]
        public async Task GetGenresAsync_ShouldReturnGenres_WhenValidResponseReceived()
        {
            // Arrange
            var expectedResult = CreateGenresDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetGenresAsync();

            // Assert
            result.Should().NotBeNull();
            result.Genres.Should().HaveCount(expectedResult.Genres.Count);
            VerifyHttpRequest("GET", "genres");
        }

        #endregion

        #region Curated Content Operations Tests

        [Fact]
        public async Task GetCuratedPodcastsAsync_ShouldReturnCuratedPodcasts_WhenValidResponseReceived()
        {
            // Arrange
            var expectedResult = CreateCuratedPodcastsDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetCuratedPodcastsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Total.Should().Be(expectedResult.Total);
            result.CuratedLists.Should().HaveCount(expectedResult.CuratedLists.Count);
            VerifyHttpRequest("GET", "curated_podcasts");
        }

        [Fact]
        public async Task GetCuratedPodcastByIdAsync_ShouldReturnCuratedPodcastDetails_WhenValidResponseReceived()
        {
            // Arrange
            var curatedPodcastId = "test-curated-id";
            var expectedResult = CreateCuratedPodcastDto();
            var jsonResponse = JsonSerializer.Serialize(expectedResult, _jsonOptions);
            
            SetupHttpResponse(HttpStatusCode.OK, jsonResponse);

            // Act
            var result = await _listenNotesApiClient.GetCuratedPodcastByIdAsync(curatedPodcastId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(expectedResult.Id);
            result.Title.Should().Be(expectedResult.Title);
            VerifyHttpRequest("GET", $"curated_podcasts/{curatedPodcastId}");
        }

        #endregion

        #region Helper Methods

        private void SetupHttpResponse(HttpStatusCode statusCode, string content)
        {
            var response = new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(content, Encoding.UTF8, "application/json")
            };

            _mockHttpMessageHandler
                .Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.IsAny<HttpRequestMessage>(),
                    ItExpr.IsAny<CancellationToken>())
                .ReturnsAsync(response);
        }

        private void VerifyHttpRequest(string method, string expectedUri)
        {
            _mockHttpMessageHandler
                .Protected()
                .Verify(
                    "SendAsync",
                    Times.Once(),
                    ItExpr.Is<HttpRequestMessage>(req =>
                        req.Method == HttpMethod.Parse(method) &&
                        req.RequestUri!.ToString().Contains(expectedUri)),
                    ItExpr.IsAny<CancellationToken>());
        }

        #endregion

        #region Test Data Factory Methods

        private static SearchResultDto CreateSearchResultDto()
        {
            return new SearchResultDto
            {
                Count = 10,
                Total = 100,
                NextOffset = 10,
                Results = new List<PodcastSearchDto>
                {
                    new PodcastSearchDto
                    {
                        Id = "test-id",
                        TitleOriginal = "Test Podcast",
                        PublisherOriginal = "Test Publisher",
                        DescriptionOriginal = "Test Description"
                    }
                }
            };
        }

        private static PodcastSeriesDto CreatePodcastSeriesDto()
        {
            return new PodcastSeriesDto
            {
                Id = "test-podcast-id",
                Title = "Test Podcast",
                Publisher = "Test Publisher",
                Description = "Test Description",
                Image = "https://example.com/image.jpg",
                Website = "https://example.com",
                Episodes = new List<PodcastEpisodeDto>()
            };
        }

        private static PodcastEpisodeDto CreatePodcastEpisodeDto()
        {
            return new PodcastEpisodeDto
            {
                Id = "test-episode-id",
                Title = "Test Episode",
                Description = "Test Episode Description",
                AudioUrl = "https://example.com/audio.mp3",
                PublishDateMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                DurationInSeconds = 3600
            };
        }

        private static ListenNotesBestPodcastsDto CreateBestPodcastsDto()
        {
            return new ListenNotesBestPodcastsDto
            {
                Id = 1,
                Name = "Best Podcasts",
                Total = 50,
                Podcasts = new List<PodcastSearchDto>()
            };
        }

        private static ListenNotesRecommendationsDto CreateRecommendationsDto()
        {
            return new ListenNotesRecommendationsDto
            {
                Recommendations = new List<PodcastSearchDto>()
            };
        }

        private static ListenNotesPlaylistsDto CreatePlaylistsDto()
        {
            return new ListenNotesPlaylistsDto
            {
                Playlists = new List<ListenNotesPlaylistDto>(),
                Total = 10
            };
        }

        private static ListenNotesPlaylistDto CreatePlaylistDto()
        {
            return new ListenNotesPlaylistDto
            {
                Id = "test-playlist-id",
                Name = "Test Playlist",
                Description = "Test Playlist Description"
            };
        }

        private static ListenNotesGenresDto CreateGenresDto()
        {
            return new ListenNotesGenresDto
            {
                Genres = new List<GenreDto>
                {
                    new GenreDto { Id = 1, Name = "Comedy" },
                    new GenreDto { Id = 2, Name = "News" }
                }
            };
        }

        private static ListenNotesCuratedPodcastsDto CreateCuratedPodcastsDto()
        {
            return new ListenNotesCuratedPodcastsDto
            {
                CuratedLists = new List<ListenNotesCuratedPodcastDto>(),
                Total = 5
            };
        }

        private static ListenNotesCuratedPodcastDto CreateCuratedPodcastDto()
        {
            return new ListenNotesCuratedPodcastDto
            {
                Id = "test-curated-id",
                Title = "Test Curated Podcast",
                Description = "Test Curated Description"
            };
        }

        #endregion
    }
}
