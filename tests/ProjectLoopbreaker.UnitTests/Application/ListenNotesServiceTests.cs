using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Services;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.ListenNotes;
using ProjectLoopbreaker.Shared.Interfaces;

namespace ProjectLoopbreaker.UnitTests.Application
{
    public class ListenNotesServiceTests
    {
        private readonly Mock<IListenNotesApiClient> _mockListenNotesApiClient;
        private readonly Mock<IPodcastService> _mockPodcastService;
        private readonly Mock<IPodcastMappingService> _mockPodcastMappingService;
        private readonly Mock<ILogger<ListenNotesService>> _mockLogger;
        private readonly ListenNotesService _listenNotesService;

        public ListenNotesServiceTests()
        {
            _mockListenNotesApiClient = new Mock<IListenNotesApiClient>();
            _mockPodcastService = new Mock<IPodcastService>();
            _mockPodcastMappingService = new Mock<IPodcastMappingService>();
            _mockLogger = new Mock<ILogger<ListenNotesService>>();
            
            _listenNotesService = new ListenNotesService(
                _mockListenNotesApiClient.Object,
                _mockPodcastService.Object,
                _mockPodcastMappingService.Object,
                _mockLogger.Object);
        }

        #region Search Operations Tests

        [Fact]
        public async Task SearchAsync_ShouldReturnSearchResults_WhenValidQueryProvided()
        {
            // Arrange
            var query = "joe rogan";
            var expectedResult = CreateSearchResultDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.SearchAsync(query, null, null, null, null, null, null, null, null, null, null, null, null, null))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.SearchAsync(query);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.SearchAsync(query, null, null, null, null, null, null, null, null, null, null, null, null, null), Times.Once);
        }

        [Fact]
        public async Task SearchAsync_ShouldPassAllParameters_WhenAllParametersProvided()
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
            
            _mockListenNotesApiClient
                .Setup(x => x.SearchAsync(query, type, offset, lenMin, lenMax, genreIds, publishedBefore, publishedAfter, onlyIn, language, region, sortByDate, safeMode, uniquePodcasts))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.SearchAsync(query, type, offset, lenMin, lenMax, genreIds, publishedBefore, publishedAfter, onlyIn, language, region, sortByDate, safeMode, uniquePodcasts);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.SearchAsync(query, type, offset, lenMin, lenMax, genreIds, publishedBefore, publishedAfter, onlyIn, language, region, sortByDate, safeMode, uniquePodcasts), Times.Once);
        }

        #endregion

        #region Podcast Operations Tests

        [Fact]
        public async Task GetPodcastByIdAsync_ShouldReturnPodcastDetails_WhenValidIdProvided()
        {
            // Arrange
            var podcastId = "test-podcast-id";
            var expectedResult = CreatePodcastSeriesDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetPodcastByIdAsync(podcastId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetPodcastByIdAsync(podcastId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetPodcastByIdAsync(podcastId), Times.Once);
        }

        [Fact]
        public async Task GetBestPodcastsAsync_ShouldReturnBestPodcasts_WhenCalled()
        {
            // Arrange
            var expectedResult = CreateBestPodcastsDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetBestPodcastsAsync(null, null, null, null, null))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetBestPodcastsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetBestPodcastsAsync(null, null, null, null, null), Times.Once);
        }

        [Fact]
        public async Task GetPodcastRecommendationsAsync_ShouldReturnRecommendations_WhenValidIdProvided()
        {
            // Arrange
            var podcastId = "test-podcast-id";
            var expectedResult = CreateRecommendationsDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetPodcastRecommendationsAsync(podcastId, null))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetPodcastRecommendationsAsync(podcastId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetPodcastRecommendationsAsync(podcastId, null), Times.Once);
        }

        #endregion

        #region Episode Operations Tests

        [Fact]
        public async Task GetEpisodeByIdAsync_ShouldReturnEpisodeDetails_WhenValidIdProvided()
        {
            // Arrange
            var episodeId = "test-episode-id";
            var expectedResult = CreatePodcastEpisodeDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetEpisodeByIdAsync(episodeId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetEpisodeByIdAsync(episodeId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetEpisodeByIdAsync(episodeId), Times.Once);
        }

        [Fact]
        public async Task GetEpisodeRecommendationsAsync_ShouldReturnRecommendations_WhenValidIdProvided()
        {
            // Arrange
            var episodeId = "test-episode-id";
            var expectedResult = CreateRecommendationsDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetEpisodeRecommendationsAsync(episodeId, null))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetEpisodeRecommendationsAsync(episodeId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetEpisodeRecommendationsAsync(episodeId, null), Times.Once);
        }

        #endregion

        #region Playlist Operations Tests

        [Fact]
        public async Task GetPlaylistsAsync_ShouldReturnPlaylists_WhenCalled()
        {
            // Arrange
            var expectedResult = CreatePlaylistsDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetPlaylistsAsync())
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetPlaylistsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetPlaylistsAsync(), Times.Once);
        }

        [Fact]
        public async Task GetPlaylistByIdAsync_ShouldReturnPlaylistDetails_WhenValidIdProvided()
        {
            // Arrange
            var playlistId = "test-playlist-id";
            var expectedResult = CreatePlaylistDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetPlaylistByIdAsync(playlistId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetPlaylistByIdAsync(playlistId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetPlaylistByIdAsync(playlistId), Times.Once);
        }

        #endregion

        #region Genre Operations Tests

        [Fact]
        public async Task GetGenresAsync_ShouldReturnGenres_WhenCalled()
        {
            // Arrange
            var expectedResult = CreateGenresDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetGenresAsync())
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetGenresAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetGenresAsync(), Times.Once);
        }

        #endregion

        #region Curated Content Operations Tests

        [Fact]
        public async Task GetCuratedPodcastsAsync_ShouldReturnCuratedPodcasts_WhenCalled()
        {
            // Arrange
            var expectedResult = CreateCuratedPodcastsDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetCuratedPodcastsAsync(null))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetCuratedPodcastsAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetCuratedPodcastsAsync(null), Times.Once);
        }

        [Fact]
        public async Task GetCuratedPodcastByIdAsync_ShouldReturnCuratedPodcastDetails_WhenValidIdProvided()
        {
            // Arrange
            var curatedPodcastId = "test-curated-id";
            var expectedResult = CreateCuratedPodcastDto();
            
            _mockListenNotesApiClient
                .Setup(x => x.GetCuratedPodcastByIdAsync(curatedPodcastId))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _listenNotesService.GetCuratedPodcastByIdAsync(curatedPodcastId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedResult);
            _mockListenNotesApiClient.Verify(x => x.GetCuratedPodcastByIdAsync(curatedPodcastId), Times.Once);
        }

        #endregion

        #region Import Operations Tests

        [Fact]
        public async Task ImportPodcastAsync_ShouldReturnNewPodcast_WhenPodcastDoesNotExist()
        {
            // Arrange
            var podcastId = "test-podcast-id";
            var podcastDto = CreatePodcastSeriesDto();
            var createPodcastDto = CreatePodcastDto();
            var expectedPodcast = CreatePodcast();

            _mockListenNotesApiClient
                .Setup(x => x.GetPodcastByIdAsync(podcastId))
                .ReturnsAsync(podcastDto);

            _mockPodcastService
                .Setup(x => x.GetPodcastByTitleAsync(podcastDto.Title, podcastDto.Publisher))
                .ReturnsAsync((Podcast?)null);

            _mockPodcastMappingService
                .Setup(x => x.MapFromListenNotesDto(podcastDto))
                .Returns(createPodcastDto);

            _mockPodcastService
                .Setup(x => x.CreatePodcastAsync(createPodcastDto))
                .ReturnsAsync(expectedPodcast);

            // Act
            var result = await _listenNotesService.ImportPodcastAsync(podcastId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedPodcast);
            _mockListenNotesApiClient.Verify(x => x.GetPodcastByIdAsync(podcastId), Times.Once);
            _mockPodcastService.Verify(x => x.GetPodcastByTitleAsync(podcastDto.Title, podcastDto.Publisher), Times.Once);
            _mockPodcastMappingService.Verify(x => x.MapFromListenNotesDto(podcastDto), Times.Once);
            _mockPodcastService.Verify(x => x.CreatePodcastAsync(createPodcastDto), Times.Once);
        }

        [Fact]
        public async Task ImportPodcastAsync_ShouldReturnExistingPodcast_WhenPodcastAlreadyExists()
        {
            // Arrange
            var podcastId = "test-podcast-id";
            var podcastDto = CreatePodcastSeriesDto();
            var existingPodcast = CreatePodcast();

            _mockListenNotesApiClient
                .Setup(x => x.GetPodcastByIdAsync(podcastId))
                .ReturnsAsync(podcastDto);

            _mockPodcastService
                .Setup(x => x.GetPodcastByTitleAsync(podcastDto.Title, podcastDto.Publisher))
                .ReturnsAsync(existingPodcast);

            // Act
            var result = await _listenNotesService.ImportPodcastAsync(podcastId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(existingPodcast);
            _mockListenNotesApiClient.Verify(x => x.GetPodcastByIdAsync(podcastId), Times.Once);
            _mockPodcastService.Verify(x => x.GetPodcastByTitleAsync(podcastDto.Title, podcastDto.Publisher), Times.Once);
            _mockPodcastMappingService.Verify(x => x.MapFromListenNotesDto(It.IsAny<PodcastSeriesDto>()), Times.Never);
            _mockPodcastService.Verify(x => x.CreatePodcastAsync(It.IsAny<CreatePodcastDto>()), Times.Never);
        }

        [Fact]
        public async Task ImportPodcastEpisodeAsync_ShouldReturnNewPodcast_WhenEpisodeDoesNotExist()
        {
            // Arrange
            var episodeId = "test-episode-id";
            var episodeDto = CreatePodcastEpisodeDto();
            var createPodcastDto = CreatePodcastDto();
            var expectedPodcast = CreatePodcast();

            _mockListenNotesApiClient
                .Setup(x => x.GetEpisodeByIdAsync(episodeId))
                .ReturnsAsync(episodeDto);

            _mockPodcastMappingService
                .Setup(x => x.MapFromListenNotesEpisodeDto(episodeDto))
                .Returns(createPodcastDto);

            _mockPodcastService
                .Setup(x => x.GetPodcastByTitleAsync(createPodcastDto.Title, null))
                .ReturnsAsync((Podcast?)null);

            _mockPodcastService
                .Setup(x => x.CreatePodcastAsync(createPodcastDto))
                .ReturnsAsync(expectedPodcast);

            // Act
            var result = await _listenNotesService.ImportPodcastEpisodeAsync(episodeId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(expectedPodcast);
            _mockListenNotesApiClient.Verify(x => x.GetEpisodeByIdAsync(episodeId), Times.Once);
            _mockPodcastMappingService.Verify(x => x.MapFromListenNotesEpisodeDto(episodeDto), Times.Once);
            _mockPodcastService.Verify(x => x.GetPodcastByTitleAsync(createPodcastDto.Title, null), Times.Once);
            _mockPodcastService.Verify(x => x.CreatePodcastAsync(createPodcastDto), Times.Once);
        }

        [Fact]
        public async Task ImportPodcastEpisodeAsync_ShouldReturnExistingPodcast_WhenEpisodeAlreadyExists()
        {
            // Arrange
            var episodeId = "test-episode-id";
            var episodeDto = CreatePodcastEpisodeDto();
            var createPodcastDto = CreatePodcastDto();
            var existingPodcast = CreatePodcast();

            _mockListenNotesApiClient
                .Setup(x => x.GetEpisodeByIdAsync(episodeId))
                .ReturnsAsync(episodeDto);

            _mockPodcastMappingService
                .Setup(x => x.MapFromListenNotesEpisodeDto(episodeDto))
                .Returns(createPodcastDto);

            _mockPodcastService
                .Setup(x => x.GetPodcastByTitleAsync(createPodcastDto.Title, null))
                .ReturnsAsync(existingPodcast);

            // Act
            var result = await _listenNotesService.ImportPodcastEpisodeAsync(episodeId);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(existingPodcast);
            _mockListenNotesApiClient.Verify(x => x.GetEpisodeByIdAsync(episodeId), Times.Once);
            _mockPodcastMappingService.Verify(x => x.MapFromListenNotesEpisodeDto(episodeDto), Times.Once);
            _mockPodcastService.Verify(x => x.GetPodcastByTitleAsync(createPodcastDto.Title, null), Times.Once);
            _mockPodcastService.Verify(x => x.CreatePodcastAsync(It.IsAny<CreatePodcastDto>()), Times.Never);
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

        private static CreatePodcastDto CreatePodcastDto()
        {
            return new CreatePodcastDto
            {
                Title = "Test Podcast",
                MediaType = MediaType.Podcast,
                PodcastType = PodcastType.Series,
                Publisher = "Test Publisher",
                Notes = "Test Description",
                Status = Status.Uncharted
            };
        }

        private static Podcast CreatePodcast()
        {
            return new Podcast
            {
                Id = Guid.NewGuid(),
                Title = "Test Podcast",
                MediaType = MediaType.Podcast,
                PodcastType = PodcastType.Series,
                Publisher = "Test Publisher",
                Notes = "Test Description",
                Status = Status.Uncharted,
                DateAdded = DateTime.UtcNow
            };
        }

        #endregion
    }
}
