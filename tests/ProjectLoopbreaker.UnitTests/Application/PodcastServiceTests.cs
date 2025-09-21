using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;
using ProjectLoopbreaker.Application.Services;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.UnitTests.TestData;

namespace ProjectLoopbreaker.UnitTests.Application
{
    public class PodcastServiceTests
    {
        private readonly Mock<IApplicationDbContext> _mockContext;
        private readonly PodcastService _podcastService;
        private readonly Mock<DbSet<Podcast>> _mockPodcasts;

        public PodcastServiceTests()
        {
            _mockContext = new Mock<IApplicationDbContext>();
            _podcastService = new PodcastService(_mockContext.Object);

            _mockPodcasts = new Mock<DbSet<Podcast>>();
            _mockContext.Setup(c => c.Podcasts).Returns(_mockPodcasts.Object);
        }

        [Fact]
        public async Task SavePodcastAsync_ShouldCreateNewPodcast_WhenPodcastDoesNotExist()
        {
            // Arrange
            var podcast = TestDataFactory.CreatePodcastSeries("New Podcast");
            var queryablePodcasts = new List<Podcast>().AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            _mockContext.Setup(c => c.Add(It.IsAny<Podcast>()));
            _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _podcastService.SavePodcastAsync(podcast);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(podcast);
            _mockContext.Verify(c => c.Add(podcast), Times.Once);
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task SavePodcastAsync_ShouldUpdateExistingPodcast_WhenPodcastExists()
        {
            // Arrange
            var existingPodcast = TestDataFactory.CreatePodcastSeries("Existing Podcast");
            var updatedPodcast = TestDataFactory.CreatePodcastSeries("Existing Podcast");
            updatedPodcast.Link = "https://updated-link.com";
            updatedPodcast.Notes = "Updated notes";
            
            var queryablePodcasts = new[] { existingPodcast }.AsQueryable();
            
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
            var result = await _podcastService.SavePodcastAsync(updatedPodcast, updateIfExists: true);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Existing Podcast");
            result.Link.Should().Be("https://updated-link.com");
            result.Notes.Should().Be("Updated notes");
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task SavePodcastAsync_ShouldReturnExistingPodcast_WhenPodcastExistsAndUpdateIfExistsIsFalse()
        {
            // Arrange
            var existingPodcast = TestDataFactory.CreatePodcastSeries("Existing Podcast");
            var newPodcast = TestDataFactory.CreatePodcastSeries("Existing Podcast");
            newPodcast.Link = "https://new-link.com";
            
            var queryablePodcasts = new[] { existingPodcast }.AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            // Act
            var result = await _podcastService.SavePodcastAsync(newPodcast, updateIfExists: false);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(existingPodcast);
            result.Link.Should().NotBe("https://new-link.com"); // Should not be updated
            _mockContext.Verify(c => c.Add(It.IsAny<Podcast>()), Times.Never);
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task PodcastExistsAsync_ShouldReturnTrue_WhenPodcastExists()
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
            var result = await _podcastService.PodcastExistsAsync("Test Podcast");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task PodcastExistsAsync_ShouldReturnFalse_WhenPodcastDoesNotExist()
        {
            // Arrange
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
            var result = await _podcastService.PodcastExistsAsync("Non-existent Podcast");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetPodcastByTitleAsync_ShouldReturnPodcast_WhenPodcastExists()
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
            var result = await _podcastService.GetPodcastByTitleAsync("Test Podcast");

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(podcast);
        }

        [Fact]
        public async Task GetPodcastByTitleAsync_ShouldReturnNull_WhenPodcastDoesNotExist()
        {
            // Arrange
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
            var result = await _podcastService.GetPodcastByTitleAsync("Non-existent Podcast");

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task PodcastEpisodeExistsAsync_ShouldReturnTrue_WhenEpisodeExists()
        {
            // Arrange
            var seriesId = Guid.NewGuid();
            var episode = TestDataFactory.CreatePodcastEpisode("Test Episode", seriesId);
            var queryablePodcasts = new[] { episode }.AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            // Act
            var result = await _podcastService.PodcastEpisodeExistsAsync(seriesId, "Test Episode");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task PodcastEpisodeExistsAsync_ShouldReturnFalse_WhenEpisodeDoesNotExist()
        {
            // Arrange
            var seriesId = Guid.NewGuid();
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
            var result = await _podcastService.PodcastEpisodeExistsAsync(seriesId, "Non-existent Episode");

            // Assert
            result.Should().BeFalse();
        }

        [Fact]
        public async Task GetPodcastEpisodeByTitleAsync_ShouldReturnEpisode_WhenEpisodeExists()
        {
            // Arrange
            var seriesId = Guid.NewGuid();
            var episode = TestDataFactory.CreatePodcastEpisode("Test Episode", seriesId);
            var queryablePodcasts = new[] { episode }.AsQueryable();
            
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Provider).Returns(queryablePodcasts.Provider);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.Expression).Returns(queryablePodcasts.Expression);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.ElementType).Returns(queryablePodcasts.ElementType);
            _mockPodcasts.As<IQueryable<Podcast>>()
                .Setup(m => m.GetEnumerator()).Returns(queryablePodcasts.GetEnumerator());

            // Act
            var result = await _podcastService.GetPodcastEpisodeByTitleAsync(seriesId, "Test Episode");

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(episode);
        }

        [Fact]
        public async Task GetPodcastEpisodeByTitleAsync_ShouldReturnNull_WhenEpisodeDoesNotExist()
        {
            // Arrange
            var seriesId = Guid.NewGuid();
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
            var result = await _podcastService.GetPodcastEpisodeByTitleAsync(seriesId, "Non-existent Episode");

            // Assert
            result.Should().BeNull();
        }
    }
}