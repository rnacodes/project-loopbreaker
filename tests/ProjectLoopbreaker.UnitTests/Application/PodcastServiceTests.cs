using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using ProjectLoopbreaker.Application.Services;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.UnitTests.TestData;

namespace ProjectLoopbreaker.UnitTests.Application
{
    public class PodcastServiceTests
    {
        private readonly Mock<IApplicationDbContext> _mockContext;
        private readonly Mock<ILogger<PodcastService>> _mockLogger;
        private readonly PodcastService _podcastService;
        private readonly Mock<DbSet<Podcast>> _mockPodcasts;

        public PodcastServiceTests()
        {
            _mockContext = new Mock<IApplicationDbContext>();
            _mockLogger = new Mock<ILogger<PodcastService>>();
            _podcastService = new PodcastService(_mockContext.Object, _mockLogger.Object);

            _mockPodcasts = new Mock<DbSet<Podcast>>();
            _mockContext.Setup(c => c.Podcasts).Returns(_mockPodcasts.Object);
        }

        [Fact]
        public async Task GetAllPodcasts_ShouldReturnAllPodcasts()
        {
            // Arrange
            var podcasts = new[]
            {
                TestDataFactory.CreatePodcastSeries("Series 1"),
                TestDataFactory.CreatePodcastEpisode("Episode 1"),
                TestDataFactory.CreatePodcastSeries("Series 2")
            };
            var queryablePodcasts = podcasts.AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            // Act
            var result = await _podcastService.GetAllPodcastsAsync();

            // Assert
            result.Should().HaveCount(3);
            result.Should().BeEquivalentTo(podcasts);
        }

        [Fact]
        public async Task GetPodcastById_ShouldReturnPodcast_WhenPodcastExists()
        {
            // Arrange
            var podcast = TestDataFactory.CreatePodcastSeries("Test Podcast");
            var queryablePodcasts = new[] { podcast }.AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            // Act
            var result = await _podcastService.GetPodcastByIdAsync(podcast.Id);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(podcast);
        }

        [Fact]
        public async Task GetPodcastById_ShouldReturnNull_WhenPodcastDoesNotExist()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();
            var queryablePodcasts = new List<Podcast>().AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            // Act
            var result = await _podcastService.GetPodcastByIdAsync(nonExistentId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetPodcastSeries_ShouldReturnOnlySeries()
        {
            // Arrange
            var podcasts = new[]
            {
                TestDataFactory.CreatePodcastSeries("Series 1"),
                TestDataFactory.CreatePodcastEpisode("Episode 1"),
                TestDataFactory.CreatePodcastSeries("Series 2")
            };
            var queryablePodcasts = podcasts.AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            // Act
            var result = await _podcastService.GetPodcastSeriesAsync();

            // Assert
            result.Should().HaveCount(2);
            result.Should().OnlyContain(p => p.PodcastType == PodcastType.Series);
        }

        [Fact]
        public async Task GetEpisodesBySeriesId_ShouldReturnEpisodesForSeries()
        {
            // Arrange
            var seriesId = Guid.NewGuid();
            var episodes = new[]
            {
                TestDataFactory.CreatePodcastEpisode("Episode 1", seriesId),
                TestDataFactory.CreatePodcastEpisode("Episode 2", seriesId),
                TestDataFactory.CreatePodcastEpisode("Episode 3", Guid.NewGuid()) // Different series
            };
            var queryablePodcasts = episodes.AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            // Act
            var result = await _podcastService.GetEpisodesBySeriesIdAsync(seriesId);

            // Assert
            result.Should().HaveCount(2);
            result.Should().OnlyContain(p => p.ParentPodcastId == seriesId);
        }

        [Fact]
        public async Task CreatePodcast_ShouldCreateNewPodcast()
        {
            // Arrange
            var dto = TestDataFactory.CreatePodcastDto("Test Podcast", PodcastType.Series);
            var queryablePodcasts = new List<Podcast>().AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _podcastService.CreatePodcastAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be(dto.Title);
            result.PodcastType.Should().Be(dto.PodcastType);
            result.MediaType.Should().Be(MediaType.Podcast);
            _mockContext.Verify(c => c.Add(It.IsAny<Podcast>()), Times.Once);
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreatePodcast_ShouldThrowArgumentNullException_WhenDtoIsNull()
        {
            // Arrange
            CreatePodcastDto? dto = null;

            // Act & Assert
            await _podcastService.Invoking(s => s.CreatePodcastAsync(dto!))
                .Should().ThrowAsync<ArgumentNullException>()
                .WithMessage("Podcast data is required (Parameter 'dto')");
        }

        [Fact]
        public async Task DeletePodcast_ShouldReturnTrue_WhenPodcastExists()
        {
            // Arrange
            var podcast = TestDataFactory.CreatePodcastSeries("Podcast to Delete");
            _mockContext.Setup(c => c.FindAsync<Podcast>(podcast.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(podcast);
            _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _podcastService.DeletePodcastAsync(podcast.Id);

            // Assert
            result.Should().BeTrue();
            _mockContext.Verify(c => c.Remove(podcast), Times.Once);
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task DeletePodcast_ShouldReturnFalse_WhenPodcastDoesNotExist()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();
            _mockContext.Setup(c => c.FindAsync<Podcast>(nonExistentId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Podcast?)null);

            // Act
            var result = await _podcastService.DeletePodcastAsync(nonExistentId);

            // Assert
            result.Should().BeFalse();
            _mockContext.Verify(c => c.Remove(It.IsAny<Podcast>()), Times.Never);
        }
    }
}
