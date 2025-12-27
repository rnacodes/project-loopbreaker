using System.Net;
using FluentAssertions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using ProjectLoopbreaker.Infrastructure.Clients;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;

namespace ProjectLoopbreaker.UnitTests.Infrastructure
{
    public class InstapaperApiClientTests
    {
        private readonly Mock<HttpMessageHandler> _mockHttpMessageHandler;
        private readonly Mock<ILogger<InstapaperApiClient>> _mockLogger;
        private readonly Mock<IConfiguration> _mockConfiguration;
        private readonly Mock<IConfigurationSection> _mockConfigSection;
        private readonly Mock<IConfigurationSection> _mockApiKeysSection;
        private readonly HttpClient _httpClient;

        public InstapaperApiClientTests()
        {
            _mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            _mockLogger = new Mock<ILogger<InstapaperApiClient>>();
            _mockConfiguration = new Mock<IConfiguration>();
            _mockConfigSection = new Mock<IConfigurationSection>();
            _mockApiKeysSection = new Mock<IConfigurationSection>();

            _httpClient = new HttpClient(_mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://www.instapaper.com/api/1/")
            };

            // Setup configuration - mock both config sections
            _mockConfiguration.Setup(x => x.GetSection("InstapaperApiSettings")).Returns(_mockConfigSection.Object);
            _mockConfiguration.Setup(x => x.GetSection("ApiKeys:Instapaper")).Returns(_mockApiKeysSection.Object);
        }

        #region GetAccessTokenAsync Tests

        [Fact]
        public async Task GetAccessTokenAsync_ShouldThrowInvalidOperationException_WhenNotConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["AccessToken"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["AccessTokenSecret"]).Returns((string?)null);

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act & Assert
            await client.Invoking(c => c.GetAccessTokenAsync("user", "pass"))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Instapaper API credentials not configured*");
        }

        [Fact]
        public async Task GetAccessTokenAsync_ShouldReturnPlaceholderTokens_WhenConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns("test-key");
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns("test-secret");
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["AccessToken"]).Returns("test-access-token");
            _mockConfigSection.Setup(x => x["AccessTokenSecret"]).Returns("test-access-secret");

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act
            var result = await client.GetAccessTokenAsync("user", "pass");

            // Assert
            result.AccessToken.Should().Be("test-access-token");
            result.AccessTokenSecret.Should().Be("test-access-secret");
        }

        #endregion

        #region VerifyCredentialsAsync Tests

        [Fact]
        public async Task VerifyCredentialsAsync_ShouldThrowInvalidOperationException_WhenNotConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act & Assert
            await client.Invoking(c => c.VerifyCredentialsAsync("token", "secret"))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Instapaper API credentials not configured*");
        }

        [Fact]
        public async Task VerifyCredentialsAsync_ShouldReturnPlaceholderUser_WhenConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns("test-key");
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns("test-secret");
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["AccessToken"]).Returns("test-access-token");
            _mockConfigSection.Setup(x => x["AccessTokenSecret"]).Returns("test-access-secret");

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act
            var result = await client.VerifyCredentialsAsync("token", "secret");

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be("placeholder");
            result.Username.Should().Be("placeholder");
        }

        #endregion

        #region GetBookmarksAsync Tests

        [Fact]
        public async Task GetBookmarksAsync_ShouldReturnEmptyResponse_WhenNotConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act
            var result = await client.GetBookmarksAsync("token", "secret", 25, "unread");

            // Assert
            result.Should().NotBeNull();
            result.Bookmarks.Should().BeEmpty();
            result.User.Should().BeNull();
        }

        [Fact]
        public async Task GetBookmarksAsync_ShouldReturnEmptyResponse_WhenConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns("test-key");
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns("test-secret");
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["AccessToken"]).Returns("test-access-token");
            _mockConfigSection.Setup(x => x["AccessTokenSecret"]).Returns("test-access-secret");

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act
            var result = await client.GetBookmarksAsync("token", "secret", 25, "unread");

            // Assert
            result.Should().NotBeNull();
            result.Bookmarks.Should().BeEmpty();
        }

        #endregion

        #region GetBookmarkTextAsync Tests

        [Fact]
        public async Task GetBookmarkTextAsync_ShouldThrowInvalidOperationException_WhenNotConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act & Assert
            await client.Invoking(c => c.GetBookmarkTextAsync("bookmark-id"))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Instapaper API credentials not configured*");
        }

        [Fact]
        public async Task GetBookmarkTextAsync_ShouldReturnEmptyResponse_WhenConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns("test-key");
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns("test-secret");
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["AccessToken"]).Returns("test-access-token");
            _mockConfigSection.Setup(x => x["AccessTokenSecret"]).Returns("test-access-secret");

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act
            var result = await client.GetBookmarkTextAsync("bookmark-id");

            // Assert
            result.Should().NotBeNull();
            result.Html.Should().BeEmpty();
            result.Url.Should().BeEmpty();
            result.Title.Should().BeEmpty();
        }

        #endregion

        #region AddBookmarkAsync Tests

        [Fact]
        public async Task AddBookmarkAsync_ShouldThrowInvalidOperationException_WhenNotConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);

            // Act & Assert
            await client.Invoking(c => c.AddBookmarkAsync("token", "secret", "https://example.com"))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage("Instapaper API credentials not configured*");
        }

        [Fact]
        public async Task AddBookmarkAsync_ShouldReturnPlaceholderBookmark_WhenConfigured()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns("test-key");
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns("test-secret");
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["AccessToken"]).Returns("test-access-token");
            _mockConfigSection.Setup(x => x["AccessTokenSecret"]).Returns("test-access-secret");

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);
            var testUrl = "https://example.com";
            var testTitle = "Test Title";

            // Act
            var result = await client.AddBookmarkAsync("token", "secret", testUrl, testTitle);

            // Assert
            result.Should().NotBeNull();
            result.BookmarkId.Should().Be("placeholder");
            result.Url.Should().Be(testUrl);
            result.Title.Should().Be(testTitle);
        }

        [Fact]
        public async Task AddBookmarkAsync_ShouldUseUrlAsTitle_WhenTitleIsNull()
        {
            // Arrange
            _mockApiKeysSection.Setup(x => x["ConsumerKey"]).Returns("test-key");
            _mockApiKeysSection.Setup(x => x["ConsumerSecret"]).Returns("test-secret");
            _mockConfigSection.Setup(x => x["ConsumerKey"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["ConsumerSecret"]).Returns((string?)null);
            _mockConfigSection.Setup(x => x["AccessToken"]).Returns("test-access-token");
            _mockConfigSection.Setup(x => x["AccessTokenSecret"]).Returns("test-access-secret");

            var client = new InstapaperApiClient(_httpClient, _mockLogger.Object, _mockConfiguration.Object);
            var testUrl = "https://example.com";

            // Act
            var result = await client.AddBookmarkAsync("token", "secret", testUrl);

            // Assert
            result.Should().NotBeNull();
            result.Url.Should().Be(testUrl);
            result.Title.Should().BeEmpty();
        }

        #endregion
    }
}


