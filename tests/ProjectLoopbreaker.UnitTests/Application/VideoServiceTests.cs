using Xunit;
using Moq;
using FluentAssertions;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Application.Services;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Linq.Expressions;

namespace ProjectLoopbreaker.UnitTests.Application
{
    public class VideoServiceTests
    {
        private readonly Mock<IApplicationDbContext> _mockContext;
        private readonly Mock<ILogger<VideoService>> _mockLogger;
        private readonly Mock<DbSet<Video>> _mockVideoSet;
        private readonly Mock<DbSet<Topic>> _mockTopicSet;
        private readonly Mock<DbSet<Genre>> _mockGenreSet;
        private readonly VideoService _service;

        public VideoServiceTests()
        {
            _mockContext = new Mock<IApplicationDbContext>();
            _mockLogger = new Mock<ILogger<VideoService>>();
            _mockVideoSet = new Mock<DbSet<Video>>();
            _mockTopicSet = new Mock<DbSet<Topic>>();
            _mockGenreSet = new Mock<DbSet<Genre>>();

            _mockContext.Setup(c => c.Videos).Returns(_mockVideoSet.Object);
            _mockContext.Setup(c => c.Topics).Returns(_mockTopicSet.Object);
            _mockContext.Setup(c => c.Genres).Returns(_mockGenreSet.Object);

            _service = new VideoService(_mockContext.Object, _mockLogger.Object);
        }

        #region GetAllVideosAsync Tests

        [Fact]
        public async Task GetAllVideosAsync_ShouldReturnAllVideos()
        {
            // Arrange
            var videos = new List<Video>
            {
                new Video { Id = Guid.NewGuid(), Title = "Video 1", Platform = "YouTube", Topics = new List<Topic>(), Genres = new List<Genre>() },
                new Video { Id = Guid.NewGuid(), Title = "Video 2", Platform = "Vimeo", Topics = new List<Topic>(), Genres = new List<Genre>() }
            }.AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.GetAllVideosAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result.First().Title.Should().Be("Video 1");
        }

        [Fact]
        public async Task GetAllVideosAsync_WhenExceptionOccurs_ShouldLogErrorAndThrow()
        {
            // Arrange
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Throws(new Exception("Database error"));

            // Act & Assert
            var exception = await Assert.ThrowsAsync<Exception>(() => _service.GetAllVideosAsync());
            exception.Message.Should().Be("Database error");
        }

        #endregion

        #region GetVideoByIdAsync Tests

        [Fact]
        public async Task GetVideoByIdAsync_WithValidId_ShouldReturnVideo()
        {
            // Arrange
            var videoId = Guid.NewGuid();
            var video = new Video { Id = videoId, Title = "Test Video", Platform = "YouTube", Topics = new List<Topic>(), Genres = new List<Genre>() };
            var videos = new List<Video> { video }.AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.GetVideoByIdAsync(videoId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(videoId);
            result.Title.Should().Be("Test Video");
        }

        [Fact]
        public async Task GetVideoByIdAsync_WithInvalidId_ShouldReturnNull()
        {
            // Arrange
            var videoId = Guid.NewGuid();
            var videos = new List<Video>().AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.GetVideoByIdAsync(videoId);

            // Assert
            result.Should().BeNull();
        }

        #endregion

        #region CreateVideoAsync Tests

        [Fact]
        public async Task CreateVideoAsync_WithValidDto_ShouldCreateVideo()
        {
            // Arrange
            var dto = new CreateVideoDto
            {
                Title = "Test Video",
                Platform = "YouTube",
                VideoType = VideoType.Series,
                Status = Status.Uncharted,
                Topics = new[] { "technology", "programming" },
                Genres = new[] { "educational", "tutorial" }
            };

            var existingTopic = new Topic { Name = "technology" };
            var existingGenre = new Genre { Name = "educational" };

            var topics = new List<Topic> { existingTopic }.AsQueryable();
            var genres = new List<Genre> { existingGenre }.AsQueryable();

            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.Provider).Returns(topics.Provider);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.Expression).Returns(topics.Expression);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.ElementType).Returns(topics.ElementType);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.GetEnumerator()).Returns(topics.GetEnumerator());

            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.Provider).Returns(genres.Provider);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.Expression).Returns(genres.Expression);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.ElementType).Returns(genres.ElementType);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.GetEnumerator()).Returns(genres.GetEnumerator());

            // Act
            var result = await _service.CreateVideoAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Test Video");
            result.Platform.Should().Be("YouTube");
            result.VideoType.Should().Be(VideoType.Series);
            result.MediaType.Should().Be(MediaType.Video);
            result.Topics.Should().HaveCount(2);
            result.Genres.Should().HaveCount(2);
            
            _mockContext.Verify(c => c.Add(It.IsAny<Video>()), Times.Once);
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
        }

        [Fact]
        public async Task CreateVideoAsync_WithExistingTopicsAndGenres_ShouldReuseExisting()
        {
            // Arrange
            var dto = new CreateVideoDto
            {
                Title = "Test Video",
                Platform = "YouTube",
                VideoType = VideoType.Series,
                Status = Status.Uncharted,
                Topics = new[] { "technology" },
                Genres = new[] { "educational" }
            };

            var existingTopic = new Topic { Name = "technology" };
            var existingGenre = new Genre { Name = "educational" };

            var topics = new List<Topic> { existingTopic }.AsQueryable();
            var genres = new List<Genre> { existingGenre }.AsQueryable();

            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.Provider).Returns(topics.Provider);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.Expression).Returns(topics.Expression);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.ElementType).Returns(topics.ElementType);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.GetEnumerator()).Returns(topics.GetEnumerator());

            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.Provider).Returns(genres.Provider);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.Expression).Returns(genres.Expression);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.ElementType).Returns(genres.ElementType);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.GetEnumerator()).Returns(genres.GetEnumerator());

            // Act
            var result = await _service.CreateVideoAsync(dto);

            // Assert
            result.Topics.Should().HaveCount(1);
            result.Genres.Should().HaveCount(1);
            result.Topics.First().Name.Should().Be("technology");
            result.Genres.First().Name.Should().Be("educational");
        }

        #endregion

        #region UpdateVideoAsync Tests

        [Fact]
        public async Task UpdateVideoAsync_WithValidId_ShouldUpdateVideo()
        {
            // Arrange
            var videoId = Guid.NewGuid();
            var existingVideo = new Video 
            { 
                Id = videoId, 
                Title = "Old Title", 
                Platform = "YouTube",
                Topics = new List<Topic>(),
                Genres = new List<Genre>()
            };

            var dto = new CreateVideoDto
            {
                Title = "Updated Title",
                Platform = "Vimeo",
                VideoType = VideoType.Episode,
                Status = Status.ActivelyExploring
            };

            var videos = new List<Video> { existingVideo }.AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            var emptyTopics = new List<Topic>().AsQueryable();
            var emptyGenres = new List<Genre>().AsQueryable();

            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.Provider).Returns(emptyTopics.Provider);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.Expression).Returns(emptyTopics.Expression);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.ElementType).Returns(emptyTopics.ElementType);
            _mockTopicSet.As<IQueryable<Topic>>().Setup(m => m.GetEnumerator()).Returns(emptyTopics.GetEnumerator());

            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.Provider).Returns(emptyGenres.Provider);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.Expression).Returns(emptyGenres.Expression);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.ElementType).Returns(emptyGenres.ElementType);
            _mockGenreSet.As<IQueryable<Genre>>().Setup(m => m.GetEnumerator()).Returns(emptyGenres.GetEnumerator());

            // Act
            var result = await _service.UpdateVideoAsync(videoId, dto);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Updated Title");
            result.Platform.Should().Be("Vimeo");
            result.VideoType.Should().Be(VideoType.Episode);
            result.Status.Should().Be(Status.ActivelyExploring);
            
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
        }

        [Fact]
        public async Task UpdateVideoAsync_WithInvalidId_ShouldThrowArgumentException()
        {
            // Arrange
            var videoId = Guid.NewGuid();
            var dto = new CreateVideoDto { Title = "Test", Platform = "YouTube", VideoType = VideoType.Series, Status = Status.Uncharted };
            var videos = new List<Video>().AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act & Assert
            var exception = await Assert.ThrowsAsync<ArgumentException>(() => _service.UpdateVideoAsync(videoId, dto));
            exception.Message.Should().Contain($"Video with ID {videoId} not found");
        }

        #endregion

        #region DeleteVideoAsync Tests

        [Fact]
        public async Task DeleteVideoAsync_WithValidId_ShouldDeleteVideo()
        {
            // Arrange
            var videoId = Guid.NewGuid();
            var video = new Video { Id = videoId, Title = "Test Video", Platform = "YouTube", Topics = new List<Topic>(), Genres = new List<Genre>() };
            var videos = new List<Video> { video }.AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.DeleteVideoAsync(videoId);

            // Assert
            result.Should().BeTrue();
            _mockContext.Verify(c => c.Remove(video), Times.Once);
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
        }

        [Fact]
        public async Task DeleteVideoAsync_WithInvalidId_ShouldReturnFalse()
        {
            // Arrange
            var videoId = Guid.NewGuid();
            var videos = new List<Video>().AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.DeleteVideoAsync(videoId);

            // Assert
            result.Should().BeFalse();
            _mockContext.Verify(c => c.Remove(It.IsAny<Video>()), Times.Never);
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Never);
        }

        #endregion

        #region GetVideosByChannelAsync Tests

        [Fact]
        public async Task GetVideosByChannelAsync_WithValidChannel_ShouldReturnVideos()
        {
            // Arrange
            var channelName = "TestChannel";
            var videos = new List<Video>
            {
                new Video { Id = Guid.NewGuid(), Title = "Video 1", Platform = "YouTube", ChannelName = "TestChannel", Topics = new List<Topic>(), Genres = new List<Genre>() },
                new Video { Id = Guid.NewGuid(), Title = "Video 2", Platform = "YouTube", ChannelName = "OtherChannel", Topics = new List<Topic>(), Genres = new List<Genre>() },
                new Video { Id = Guid.NewGuid(), Title = "Video 3", Platform = "YouTube", ChannelName = "testchannel", Topics = new List<Topic>(), Genres = new List<Genre>() }
            }.AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.GetVideosByChannelAsync(channelName);

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2); // Case-insensitive match
            result.All(v => v.ChannelName.ToLower() == channelName.ToLower()).Should().BeTrue();
        }

        #endregion

        #region GetVideoSeriesAsync Tests

        [Fact]
        public async Task GetVideoSeriesAsync_ShouldReturnOnlySeriesVideos()
        {
            // Arrange
            var videos = new List<Video>
            {
                new Video { Id = Guid.NewGuid(), Title = "Series 1", Platform = "YouTube", VideoType = VideoType.Series, Topics = new List<Topic>(), Genres = new List<Genre>() },
                new Video { Id = Guid.NewGuid(), Title = "Episode 1", Platform = "YouTube", VideoType = VideoType.Episode, Topics = new List<Topic>(), Genres = new List<Genre>() },
                new Video { Id = Guid.NewGuid(), Title = "Series 2", Platform = "YouTube", VideoType = VideoType.Series, Topics = new List<Topic>(), Genres = new List<Genre>() }
            }.AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.GetVideoSeriesAsync();

            // Assert
            result.Should().NotBeNull();
            result.Should().HaveCount(2);
            result.All(v => v.VideoType == VideoType.Series).Should().BeTrue();
        }

        #endregion

        #region VideoExistsAsync Tests

        [Fact]
        public async Task VideoExistsAsync_WithExistingVideo_ShouldReturnTrue()
        {
            // Arrange
            var title = "Test Video";
            var channelName = "Test Channel";
            var videos = new List<Video>
            {
                new Video { Id = Guid.NewGuid(), Title = "Test Video", Platform = "YouTube", ChannelName = "Test Channel", Topics = new List<Topic>(), Genres = new List<Genre>() }
            }.AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.VideoExistsAsync(title, channelName);

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task VideoExistsAsync_WithNonExistingVideo_ShouldReturnFalse()
        {
            // Arrange
            var title = "Non-existing Video";
            var channelName = "Test Channel";
            var videos = new List<Video>().AsQueryable();

            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Provider).Returns(videos.Provider);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.Expression).Returns(videos.Expression);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.ElementType).Returns(videos.ElementType);
            _mockVideoSet.As<IQueryable<Video>>().Setup(m => m.GetEnumerator()).Returns(videos.GetEnumerator());

            // Act
            var result = await _service.VideoExistsAsync(title, channelName);

            // Assert
            result.Should().BeFalse();
        }

        #endregion
    }
}
