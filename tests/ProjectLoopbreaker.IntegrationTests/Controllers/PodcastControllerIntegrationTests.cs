using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using Xunit;

namespace ProjectLoopbreaker.IntegrationTests.Controllers
{
    public class PodcastControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly JsonSerializerOptions _jsonOptions;

        public PodcastControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
            _jsonOptions = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                // Add JsonStringEnumConverter to match API's expectation of string enums
                Converters = { new JsonStringEnumConverter() },
                ReferenceHandler = ReferenceHandler.IgnoreCycles,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            };
        }

        [Fact]
        public async Task GetAllPodcasts_ShouldReturnOk()
        {
            // Act
            var response = await _client.GetAsync("/api/podcast");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            
            // DEBUG: Print the actual JSON response
            Console.WriteLine("=== RAW API RESPONSE ===");
            Console.WriteLine(content);
            Console.WriteLine("=== END RAW RESPONSE ===");
            
            var podcasts = JsonSerializer.Deserialize<List<PodcastResponseDto>>(content, _jsonOptions);
            Assert.NotNull(podcasts);
        }

        [Fact]
        public async Task GetPodcastSeries_ShouldReturnOk()
        {
            // Act
            var response = await _client.GetAsync("/api/podcast/series");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            var series = JsonSerializer.Deserialize<List<object>>(content, _jsonOptions);
            Assert.NotNull(series);
        }

        [Fact]
        public async Task SearchPodcastSeries_WithValidQuery_ShouldReturnOk()
        {
            // Act
            var response = await _client.GetAsync("/api/podcast/series/search?query=test");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            var results = JsonSerializer.Deserialize<List<object>>(content, _jsonOptions);
            Assert.NotNull(results);
        }

        [Fact]
        public async Task SearchPodcastSeries_WithEmptyQuery_ShouldReturnBadRequest()
        {
            // Act
            var response = await _client.GetAsync("/api/podcast/series/search?query=");

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task CreatePodcast_WithValidData_ShouldReturnCreated()
        {
            // Arrange
            var createDto = new CreatePodcastDto
            {
                Title = "Integration Test Podcast",
                PodcastType = PodcastType.Series,
                Publisher = "Test Publisher",
                Status = Status.Uncharted,
                Description = "A test podcast for integration testing"
            };

            var json = JsonSerializer.Serialize(createDto, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/podcast", content);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var createdPodcast = JsonSerializer.Deserialize<PodcastResponseDto>(responseContent, _jsonOptions);
            Assert.NotNull(createdPodcast);
            Assert.Equal("Integration Test Podcast", createdPodcast.Title);
            Assert.Equal(PodcastType.Series, createdPodcast.PodcastType);
        }

        [Fact]
        public async Task CreatePodcast_WithNullData_ShouldReturnBadRequest()
        {
            // Arrange
            var content = new StringContent("null", Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/podcast", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task CreatePodcastEpisode_WithValidData_ShouldReturnCreated()
        {
            // Arrange - First create a series
            var seriesDto = new CreatePodcastDto
            {
                Title = "Parent Series for Episode Test",
                PodcastType = PodcastType.Series,
                Publisher = "Test Publisher",
                Status = Status.Uncharted
            };

            var seriesJson = JsonSerializer.Serialize(seriesDto, _jsonOptions);
            var seriesContent = new StringContent(seriesJson, Encoding.UTF8, "application/json");
            var seriesResponse = await _client.PostAsync("/api/podcast", seriesContent);
            
            Assert.Equal(HttpStatusCode.Created, seriesResponse.StatusCode);
            var seriesResponseContent = await seriesResponse.Content.ReadAsStringAsync();
            var createdSeries = JsonSerializer.Deserialize<PodcastResponseDto>(seriesResponseContent, _jsonOptions);

            // Now create an episode
            var episodeDto = new CreatePodcastDto
            {
                Title = "Integration Test Episode",
                PodcastType = PodcastType.Series, // This should be overridden to Episode
                ParentPodcastId = createdSeries.Id,
                Status = Status.Uncharted,
                Description = "A test episode for integration testing"
            };

            var episodeJson = JsonSerializer.Serialize(episodeDto, _jsonOptions);
            var episodeContent = new StringContent(episodeJson, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/podcast/episode", episodeContent);

            // Assert
            Assert.Equal(HttpStatusCode.Created, response.StatusCode);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var createdEpisode = JsonSerializer.Deserialize<PodcastResponseDto>(responseContent, _jsonOptions);
            Assert.NotNull(createdEpisode);
            Assert.Equal("Integration Test Episode", createdEpisode.Title);
            Assert.Equal(PodcastType.Episode, createdEpisode.PodcastType);
            Assert.Equal(createdSeries.Id, createdEpisode.ParentPodcastId);
        }

        [Fact]
        public async Task GetPodcast_WithValidId_ShouldReturnOk()
        {
            // Arrange - Create a podcast first
            var createDto = new CreatePodcastDto
            {
                Title = "Test Podcast for Get",
                PodcastType = PodcastType.Series,
                Status = Status.Uncharted
            };

            var json = JsonSerializer.Serialize(createDto, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var createResponse = await _client.PostAsync("/api/podcast", content);
            
            var createResponseContent = await createResponse.Content.ReadAsStringAsync();
            var createdPodcast = JsonSerializer.Deserialize<Podcast>(createResponseContent, _jsonOptions);

            // Act
            var response = await _client.GetAsync($"/api/podcast/{createdPodcast.Id}");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var retrievedPodcast = JsonSerializer.Deserialize<PodcastResponseDto>(responseContent, _jsonOptions);
            Assert.NotNull(retrievedPodcast);
            Assert.Equal(createdPodcast.Id, retrievedPodcast.Id);
            Assert.Equal("Test Podcast for Get", retrievedPodcast.Title);
        }

        [Fact]
        public async Task GetPodcast_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var invalidId = Guid.NewGuid();

            // Act
            var response = await _client.GetAsync($"/api/podcast/{invalidId}");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task GetEpisodesBySeriesId_WithValidSeriesId_ShouldReturnOk()
        {
            // Arrange - Create a series and episode
            var seriesDto = new CreatePodcastDto
            {
                Title = "Series for Episodes Test",
                PodcastType = PodcastType.Series,
                Status = Status.Uncharted
            };

            var seriesJson = JsonSerializer.Serialize(seriesDto, _jsonOptions);
            var seriesContent = new StringContent(seriesJson, Encoding.UTF8, "application/json");
            var seriesResponse = await _client.PostAsync("/api/podcast", seriesContent);
            
            var seriesResponseContent = await seriesResponse.Content.ReadAsStringAsync();
            var createdSeries = JsonSerializer.Deserialize<PodcastResponseDto>(seriesResponseContent, _jsonOptions);

            var episodeDto = new CreatePodcastDto
            {
                Title = "Episode for Series Test",
                PodcastType = PodcastType.Episode,
                ParentPodcastId = createdSeries.Id,
                Status = Status.Uncharted
            };

            var episodeJson = JsonSerializer.Serialize(episodeDto, _jsonOptions);
            var episodeContent = new StringContent(episodeJson, Encoding.UTF8, "application/json");
            await _client.PostAsync("/api/podcast/episode", episodeContent);

            // Act
            var response = await _client.GetAsync($"/api/podcast/series/{createdSeries.Id}/episodes");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var responseContent = await response.Content.ReadAsStringAsync();
            var episodes = JsonSerializer.Deserialize<List<PodcastResponseDto>>(responseContent, _jsonOptions);
            Assert.NotNull(episodes);
            Assert.Single(episodes);
            Assert.Equal("Episode for Series Test", episodes[0].Title);
        }

        [Fact]
        public async Task DeletePodcast_WithValidId_ShouldReturnNoContent()
        {
            // Arrange - Create a podcast first
            var createDto = new CreatePodcastDto
            {
                Title = "Test Podcast for Delete",
                PodcastType = PodcastType.Series,
                Status = Status.Uncharted
            };

            var json = JsonSerializer.Serialize(createDto, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            var createResponse = await _client.PostAsync("/api/podcast", content);
            
            var createResponseContent = await createResponse.Content.ReadAsStringAsync();
            var createdPodcast = JsonSerializer.Deserialize<Podcast>(createResponseContent, _jsonOptions);

            // Act
            var response = await _client.DeleteAsync($"/api/podcast/{createdPodcast.Id}");

            // Assert
            Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

            // Verify it's actually deleted
            var getResponse = await _client.GetAsync($"/api/podcast/{createdPodcast.Id}");
            Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
        }

        [Fact]
        public async Task DeletePodcast_WithInvalidId_ShouldReturnNotFound()
        {
            // Arrange
            var invalidId = Guid.NewGuid();

            // Act
            var response = await _client.DeleteAsync($"/api/podcast/{invalidId}");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        public async Task DeletePodcastSeries_ShouldDeleteSeriesAndEpisodes()
        {
            // Arrange - Create a series with episodes
            var seriesDto = new CreatePodcastDto
            {
                Title = "Series to Delete with Episodes",
                PodcastType = PodcastType.Series,
                Status = Status.Uncharted
            };

            var seriesJson = JsonSerializer.Serialize(seriesDto, _jsonOptions);
            var seriesContent = new StringContent(seriesJson, Encoding.UTF8, "application/json");
            var seriesResponse = await _client.PostAsync("/api/podcast", seriesContent);
            
            var seriesResponseContent = await seriesResponse.Content.ReadAsStringAsync();
            var createdSeries = JsonSerializer.Deserialize<PodcastResponseDto>(seriesResponseContent, _jsonOptions);

            // Create episodes
            var episode1Dto = new CreatePodcastDto
            {
                Title = "Episode 1 to Delete",
                PodcastType = PodcastType.Episode,
                ParentPodcastId = createdSeries.Id,
                Status = Status.Uncharted
            };

            var episode2Dto = new CreatePodcastDto
            {
                Title = "Episode 2 to Delete",
                PodcastType = PodcastType.Episode,
                ParentPodcastId = createdSeries.Id,
                Status = Status.Uncharted
            };

            var episode1Json = JsonSerializer.Serialize(episode1Dto, _jsonOptions);
            var episode1Content = new StringContent(episode1Json, Encoding.UTF8, "application/json");
            var episode1Response = await _client.PostAsync("/api/podcast/episode", episode1Content);
            var episode1ResponseContent = await episode1Response.Content.ReadAsStringAsync();
            var createdEpisode1 = JsonSerializer.Deserialize<PodcastResponseDto>(episode1ResponseContent, _jsonOptions);

            var episode2Json = JsonSerializer.Serialize(episode2Dto, _jsonOptions);
            var episode2Content = new StringContent(episode2Json, Encoding.UTF8, "application/json");
            var episode2Response = await _client.PostAsync("/api/podcast/episode", episode2Content);
            var episode2ResponseContent = await episode2Response.Content.ReadAsStringAsync();
            var createdEpisode2 = JsonSerializer.Deserialize<PodcastResponseDto>(episode2ResponseContent, _jsonOptions);

            // Act - Delete the series
            var deleteResponse = await _client.DeleteAsync($"/api/podcast/{createdSeries.Id}");

            // Assert
            Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);

            // Verify series is deleted
            var getSeriesResponse = await _client.GetAsync($"/api/podcast/{createdSeries.Id}");
            Assert.Equal(HttpStatusCode.NotFound, getSeriesResponse.StatusCode);

            // Verify episodes are also deleted
            var getEpisode1Response = await _client.GetAsync($"/api/podcast/{createdEpisode1.Id}");
            Assert.Equal(HttpStatusCode.NotFound, getEpisode1Response.StatusCode);

            var getEpisode2Response = await _client.GetAsync($"/api/podcast/{createdEpisode2.Id}");
            Assert.Equal(HttpStatusCode.NotFound, getEpisode2Response.StatusCode);
        }

        [Fact]
        public async Task ImportPodcastByName_WithEmptyName_ShouldReturnBadRequest()
        {
            // Arrange
            var importDto = new ImportPodcastByNameDto { PodcastName = "" };
            var json = JsonSerializer.Serialize(importDto, _jsonOptions);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/podcast/from-api/by-name", content);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        // Note: Import tests that require actual API calls are commented out
        // as they would require valid API keys and external dependencies
        
        /*
        [Fact]
        public async Task ImportPodcastFromApi_WithValidId_ShouldReturnCreated()
        {
            // This test would require a valid ListenNotes API key and external API call
            // Uncomment and modify when testing with real API
        }

        [Fact]
        public async Task ImportPodcastByName_WithValidName_ShouldReturnCreated()
        {
            // This test would require a valid ListenNotes API key and external API call
            // Uncomment and modify when testing with real API
        }
        */
    }
}
