using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Application.Services;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.TMDB;
using ProjectLoopbreaker.Shared.Interfaces;
using ProjectLoopbreaker.UnitTests.TestData;

namespace ProjectLoopbreaker.UnitTests.Application
{
    public class TmdbServiceTests
    {
        private readonly Mock<ITmdbApiClient> _mockTmdbApiClient;
        private readonly Mock<IMovieService> _mockMovieService;
        private readonly Mock<ITvShowService> _mockTvShowService;
        private readonly Mock<ILogger<TmdbService>> _mockLogger;
        private readonly TmdbService _tmdbService;

        public TmdbServiceTests()
        {
            _mockTmdbApiClient = new Mock<ITmdbApiClient>();
            _mockMovieService = new Mock<IMovieService>();
            _mockTvShowService = new Mock<ITvShowService>();
            _mockLogger = new Mock<ILogger<TmdbService>>();
            
            _tmdbService = new TmdbService(
                _mockTmdbApiClient.Object,
                _mockMovieService.Object,
                _mockTvShowService.Object,
                _mockLogger.Object);
        }

        #region Search Operations Tests

        [Fact]
        public async Task SearchMoviesAsync_ShouldReturnSearchResults_WhenValidQueryProvided()
        {
            // Arrange
            var query = "inception";
            var expectedResult = TestDataFactory.CreateTmdbMovieSearchResultDto(
                TestDataFactory.CreateTmdbMovieDto(27205, "Inception"));
            
            _mockTmdbApiClient
                .Setup(x => x.SearchMoviesAsync(query, 1, "en-US"))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _tmdbService.SearchMoviesAsync(query);

            // Assert
            result.Should().NotBeNull();
            result.Results.Should().HaveCount(1);
            result.Results[0].Title.Should().Be("Inception");
            _mockTmdbApiClient.Verify(x => x.SearchMoviesAsync(query, 1, "en-US"), Times.Once);
        }

        [Fact]
        public async Task SearchTvShowsAsync_ShouldReturnSearchResults_WhenValidQueryProvided()
        {
            // Arrange
            var query = "game of thrones";
            var expectedResult = TestDataFactory.CreateTmdbTvSearchResultDto(
                TestDataFactory.CreateTmdbTvShowDto(1399, "Game of Thrones"));
            
            _mockTmdbApiClient
                .Setup(x => x.SearchTvShowsAsync(query, 1, "en-US"))
                .ReturnsAsync(expectedResult);

            // Act
            var result = await _tmdbService.SearchTvShowsAsync(query);

            // Assert
            result.Should().NotBeNull();
            result.Results.Should().HaveCount(1);
            result.Results[0].Name.Should().Be("Game of Thrones");
            _mockTmdbApiClient.Verify(x => x.SearchTvShowsAsync(query, 1, "en-US"), Times.Once);
        }

        [Fact]
        public async Task GetMovieDetailsAsync_ShouldReturnMovieDetails_WhenValidIdProvided()
        {
            // Arrange
            var movieId = 27205;
            var expectedMovie = TestDataFactory.CreateTmdbMovieDto(movieId, "Inception");
            
            _mockTmdbApiClient
                .Setup(x => x.GetMovieDetailsAsync(movieId, "en-US"))
                .ReturnsAsync(expectedMovie);

            // Act
            var result = await _tmdbService.GetMovieDetailsAsync(movieId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(movieId);
            result.Title.Should().Be("Inception");
            _mockTmdbApiClient.Verify(x => x.GetMovieDetailsAsync(movieId, "en-US"), Times.Once);
        }

        [Fact]
        public async Task GetTvShowDetailsAsync_ShouldReturnTvShowDetails_WhenValidIdProvided()
        {
            // Arrange
            var tvShowId = 1399;
            var expectedTvShow = TestDataFactory.CreateTmdbTvShowDto(tvShowId, "Game of Thrones");
            
            _mockTmdbApiClient
                .Setup(x => x.GetTvShowDetailsAsync(tvShowId, "en-US"))
                .ReturnsAsync(expectedTvShow);

            // Act
            var result = await _tmdbService.GetTvShowDetailsAsync(tvShowId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(tvShowId);
            result.Name.Should().Be("Game of Thrones");
            _mockTmdbApiClient.Verify(x => x.GetTvShowDetailsAsync(tvShowId, "en-US"), Times.Once);
        }

        #endregion

        #region Import Operations Tests

        [Fact]
        public async Task ImportMovieAsync_ShouldCreateNewMovie_WhenMovieDoesNotExist()
        {
            // Arrange
            var movieId = 27205;
            var tmdbMovieDto = TestDataFactory.CreateTmdbMovieDto(movieId, "Inception");
            var expectedMovie = TestDataFactory.CreateMovie("Inception", 2010, movieId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetMovieDetailsAsync(movieId, "en-US"))
                .ReturnsAsync(tmdbMovieDto);
            
            _mockMovieService
                .Setup(x => x.GetMovieByTitleAndYearAsync("Inception", 2010))
                .ReturnsAsync((Movie?)null);
            
            _mockMovieService
                .Setup(x => x.CreateMovieAsync(It.IsAny<CreateMovieDto>()))
                .ReturnsAsync(expectedMovie);

            // Act
            var result = await _tmdbService.ImportMovieAsync(movieId);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Inception");
            result.ReleaseYear.Should().Be(2010);
            result.TmdbId.Should().Be(movieId.ToString());
            
            _mockTmdbApiClient.Verify(x => x.GetMovieDetailsAsync(movieId, "en-US"), Times.Once);
            _mockMovieService.Verify(x => x.GetMovieByTitleAndYearAsync("Inception", 2010), Times.Once);
            _mockMovieService.Verify(x => x.CreateMovieAsync(It.Is<CreateMovieDto>(dto => 
                dto.Title == "Inception" && 
                dto.ReleaseYear == 2010 &&
                dto.TmdbId == movieId.ToString() &&
                dto.MediaType == MediaType.Movie &&
                dto.Status == Status.Uncharted)), Times.Once);
        }

        [Fact]
        public async Task ImportMovieAsync_ShouldReturnExistingMovie_WhenMovieAlreadyExists()
        {
            // Arrange
            var movieId = 27205;
            var tmdbMovieDto = TestDataFactory.CreateTmdbMovieDto(movieId, "Inception");
            var existingMovie = TestDataFactory.CreateMovie("Inception", 2010, movieId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetMovieDetailsAsync(movieId, "en-US"))
                .ReturnsAsync(tmdbMovieDto);
            
            _mockMovieService
                .Setup(x => x.GetMovieByTitleAndYearAsync("Inception", 2010))
                .ReturnsAsync(existingMovie);

            // Act
            var result = await _tmdbService.ImportMovieAsync(movieId);

            // Assert
            result.Should().NotBeNull();
            result.Should().Be(existingMovie);
            result.Title.Should().Be("Inception");
            
            _mockTmdbApiClient.Verify(x => x.GetMovieDetailsAsync(movieId, "en-US"), Times.Once);
            _mockMovieService.Verify(x => x.GetMovieByTitleAndYearAsync("Inception", 2010), Times.Once);
            _mockMovieService.Verify(x => x.CreateMovieAsync(It.IsAny<CreateMovieDto>()), Times.Never);
        }

        [Fact]
        public async Task ImportTvShowAsync_ShouldCreateNewTvShow_WhenTvShowDoesNotExist()
        {
            // Arrange
            var tvShowId = 1399;
            var tmdbTvShowDto = TestDataFactory.CreateTmdbTvShowDto(tvShowId, "Game of Thrones");
            var expectedTvShow = TestDataFactory.CreateTvShow("Game of Thrones", 2011, tvShowId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetTvShowDetailsAsync(tvShowId, "en-US"))
                .ReturnsAsync(tmdbTvShowDto);
            
            _mockTvShowService
                .Setup(x => x.GetTvShowByTitleAndYearAsync("Game of Thrones", 2011))
                .ReturnsAsync((TvShow?)null);
            
            _mockTvShowService
                .Setup(x => x.CreateTvShowAsync(It.IsAny<CreateTvShowDto>()))
                .ReturnsAsync(expectedTvShow);

            // Act
            var result = await _tmdbService.ImportTvShowAsync(tvShowId);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Game of Thrones");
            result.FirstAirYear.Should().Be(2011);
            result.TmdbId.Should().Be(tvShowId.ToString());
            
            _mockTmdbApiClient.Verify(x => x.GetTvShowDetailsAsync(tvShowId, "en-US"), Times.Once);
            _mockTvShowService.Verify(x => x.GetTvShowByTitleAndYearAsync("Game of Thrones", 2011), Times.Once);
            _mockTvShowService.Verify(x => x.CreateTvShowAsync(It.Is<CreateTvShowDto>(dto => 
                dto.Title == "Game of Thrones" && 
                dto.FirstAirYear == 2011 &&
                dto.TmdbId == tvShowId.ToString() &&
                dto.MediaType == MediaType.TVShow &&
                dto.Status == Status.Uncharted)), Times.Once);
        }

        [Fact]
        public async Task ImportTvShowAsync_ShouldReturnExistingTvShow_WhenTvShowAlreadyExists()
        {
            // Arrange
            var tvShowId = 1399;
            var tmdbTvShowDto = TestDataFactory.CreateTmdbTvShowDto(tvShowId, "Game of Thrones");
            var existingTvShow = TestDataFactory.CreateTvShow("Game of Thrones", 2011, tvShowId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetTvShowDetailsAsync(tvShowId, "en-US"))
                .ReturnsAsync(tmdbTvShowDto);
            
            _mockTvShowService
                .Setup(x => x.GetTvShowByTitleAndYearAsync("Game of Thrones", 2011))
                .ReturnsAsync(existingTvShow);

            // Act
            var result = await _tmdbService.ImportTvShowAsync(tvShowId);

            // Assert
            result.Should().NotBeNull();
            result.Should().Be(existingTvShow);
            result.Title.Should().Be("Game of Thrones");
            
            _mockTmdbApiClient.Verify(x => x.GetTvShowDetailsAsync(tvShowId, "en-US"), Times.Once);
            _mockTvShowService.Verify(x => x.GetTvShowByTitleAndYearAsync("Game of Thrones", 2011), Times.Once);
            _mockTvShowService.Verify(x => x.CreateTvShowAsync(It.IsAny<CreateTvShowDto>()), Times.Never);
        }

        [Fact]
        public async Task ImportMovieAsync_ShouldHandleMovieWithoutReleaseDate()
        {
            // Arrange
            var movieId = 12345;
            var tmdbMovieDto = TestDataFactory.CreateTmdbMovieDto(movieId, "Test Movie");
            tmdbMovieDto.ReleaseDate = null; // No release date
            var expectedMovie = TestDataFactory.CreateMovie("Test Movie", null, movieId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetMovieDetailsAsync(movieId, "en-US"))
                .ReturnsAsync(tmdbMovieDto);
            
            _mockMovieService
                .Setup(x => x.GetMovieByTitleAndYearAsync("Test Movie", null))
                .ReturnsAsync((Movie?)null);
            
            _mockMovieService
                .Setup(x => x.CreateMovieAsync(It.IsAny<CreateMovieDto>()))
                .ReturnsAsync(expectedMovie);

            // Act
            var result = await _tmdbService.ImportMovieAsync(movieId);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Test Movie");
            
            _mockMovieService.Verify(x => x.CreateMovieAsync(It.Is<CreateMovieDto>(dto => 
                dto.Title == "Test Movie" && 
                dto.ReleaseYear == null)), Times.Once);
        }

        [Fact]
        public async Task ImportMovieAsync_ShouldStoreTmdbRatingCorrectly()
        {
            // Arrange
            var movieId = 12345;
            var tmdbMovieDto = TestDataFactory.CreateTmdbMovieDto(movieId, "Test Movie");
            tmdbMovieDto.VoteAverage = 8.4; // Should store as TmdbRating, not convert to personal Rating
            var expectedMovie = TestDataFactory.CreateMovie("Test Movie", 2010, movieId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetMovieDetailsAsync(movieId, "en-US"))
                .ReturnsAsync(tmdbMovieDto);
            
            _mockMovieService
                .Setup(x => x.GetMovieByTitleAndYearAsync("Test Movie", 2010))
                .ReturnsAsync((Movie?)null);
            
            _mockMovieService
                .Setup(x => x.CreateMovieAsync(It.IsAny<CreateMovieDto>()))
                .ReturnsAsync(expectedMovie);

            // Act
            var result = await _tmdbService.ImportMovieAsync(movieId);

            // Assert
            _mockMovieService.Verify(x => x.CreateMovieAsync(It.Is<CreateMovieDto>(dto => 
                dto.Rating == null && // Personal rating should be null for imports
                dto.TmdbRating == 8.4)), Times.Once); // TMDB rating should be stored as-is
        }

        [Fact]
        public async Task ImportTvShowAsync_ShouldStoreTmdbRatingCorrectly()
        {
            // Arrange
            var tvShowId = 12345;
            var tmdbTvShowDto = TestDataFactory.CreateTmdbTvShowDto(tvShowId, "Test TV Show");
            tmdbTvShowDto.VoteAverage = 7.8; // Should store as TmdbRating, not convert to personal Rating
            var expectedTvShow = TestDataFactory.CreateTvShow("Test TV Show", 2020, tvShowId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetTvShowDetailsAsync(tvShowId, "en-US"))
                .ReturnsAsync(tmdbTvShowDto);
            
            _mockTvShowService
                .Setup(x => x.GetTvShowByTitleAndYearAsync("Test TV Show", 2020))
                .ReturnsAsync((TvShow?)null);
            
            _mockTvShowService
                .Setup(x => x.CreateTvShowAsync(It.IsAny<CreateTvShowDto>()))
                .ReturnsAsync(expectedTvShow);

            // Act
            var result = await _tmdbService.ImportTvShowAsync(tvShowId);

            // Assert
            _mockTvShowService.Verify(x => x.CreateTvShowAsync(It.Is<CreateTvShowDto>(dto => 
                dto.Rating == null && // Personal rating should be null for imports
                dto.TmdbRating == 7.8)), Times.Once); // TMDB rating should be stored as-is
        }

        [Fact]
        public async Task ImportMovieAsync_ShouldStoreAllTmdbProperties()
        {
            // Arrange
            var movieId = 27205;
            var tmdbMovieDto = TestDataFactory.CreateTmdbMovieDto(movieId, "Inception");
            var expectedMovie = TestDataFactory.CreateMovie("Inception", 2010, movieId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetMovieDetailsAsync(movieId, "en-US"))
                .ReturnsAsync(tmdbMovieDto);
            
            _mockMovieService
                .Setup(x => x.GetMovieByTitleAndYearAsync("Inception", 2010))
                .ReturnsAsync((Movie?)null);
            
            _mockMovieService
                .Setup(x => x.CreateMovieAsync(It.IsAny<CreateMovieDto>()))
                .ReturnsAsync(expectedMovie);

            // Act
            var result = await _tmdbService.ImportMovieAsync(movieId);

            // Assert
            _mockMovieService.Verify(x => x.CreateMovieAsync(It.Is<CreateMovieDto>(dto => 
                dto.TmdbId == movieId.ToString() &&
                dto.TmdbRating == tmdbMovieDto.VoteAverage &&
                dto.TmdbBackdropPath == tmdbMovieDto.BackdropPath &&
                dto.Tagline == tmdbMovieDto.Tagline &&
                dto.Homepage == tmdbMovieDto.Homepage &&
                dto.OriginalLanguage == tmdbMovieDto.OriginalLanguage &&
                dto.OriginalTitle == tmdbMovieDto.OriginalTitle)), Times.Once);
        }

        [Fact]
        public async Task ImportTvShowAsync_ShouldStoreAllTmdbProperties()
        {
            // Arrange
            var tvShowId = 1399;
            var tmdbTvShowDto = TestDataFactory.CreateTmdbTvShowDto(tvShowId, "Game of Thrones");
            var expectedTvShow = TestDataFactory.CreateTvShow("Game of Thrones", 2011, tvShowId.ToString());

            _mockTmdbApiClient
                .Setup(x => x.GetTvShowDetailsAsync(tvShowId, "en-US"))
                .ReturnsAsync(tmdbTvShowDto);
            
            _mockTvShowService
                .Setup(x => x.GetTvShowByTitleAndYearAsync("Game of Thrones", 2011))
                .ReturnsAsync((TvShow?)null);
            
            _mockTvShowService
                .Setup(x => x.CreateTvShowAsync(It.IsAny<CreateTvShowDto>()))
                .ReturnsAsync(expectedTvShow);

            // Act
            var result = await _tmdbService.ImportTvShowAsync(tvShowId);

            // Assert
            _mockTvShowService.Verify(x => x.CreateTvShowAsync(It.Is<CreateTvShowDto>(dto => 
                dto.TmdbId == tvShowId.ToString() &&
                dto.TmdbRating == tmdbTvShowDto.VoteAverage &&
                dto.TmdbPosterPath == tmdbTvShowDto.PosterPath &&
                dto.Tagline == tmdbTvShowDto.Tagline &&
                dto.Homepage == tmdbTvShowDto.Homepage &&
                dto.OriginalLanguage == tmdbTvShowDto.OriginalLanguage &&
                dto.OriginalName == tmdbTvShowDto.OriginalName)), Times.Once);
        }

        [Fact]
        public async Task ImportMovieAsync_ShouldLogErrorAndRethrow_WhenExceptionOccurs()
        {
            // Arrange
            var movieId = 27205;
            var expectedException = new InvalidOperationException("TMDB API error");

            _mockTmdbApiClient
                .Setup(x => x.GetMovieDetailsAsync(movieId, "en-US"))
                .ThrowsAsync(expectedException);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                () => _tmdbService.ImportMovieAsync(movieId));
            
            exception.Should().Be(expectedException);
        }

        #endregion

        #region Utility Operations Tests

        [Fact]
        public void GetImageUrl_ShouldReturnCorrectUrl_WhenImagePathProvided()
        {
            // Arrange
            var imagePath = "/test-image.jpg";
            var size = "w500";
            var expectedUrl = "https://image.tmdb.org/t/p/w500/test-image.jpg";

            _mockTmdbApiClient
                .Setup(x => x.GetImageUrl(imagePath, size))
                .Returns(expectedUrl);

            // Act
            var result = _tmdbService.GetImageUrl(imagePath, size);

            // Assert
            result.Should().Be(expectedUrl);
            _mockTmdbApiClient.Verify(x => x.GetImageUrl(imagePath, size), Times.Once);
        }

        #endregion
    }
}
