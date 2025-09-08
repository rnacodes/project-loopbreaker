using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Infrastructure.Data;
using ProjectLoopbreaker.UnitTests.TestData;

namespace ProjectLoopbreaker.IntegrationTests.Controllers
{
    public class BookControllerIntegrationTests : IClassFixture<WebApplicationFactory>
    {
        private readonly WebApplicationFactory _factory;
        private readonly HttpClient _client;

        public BookControllerIntegrationTests(WebApplicationFactory factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task GetAllBooks_ShouldReturnEmptyList_WhenNoBooksExist()
        {
            // Act
            var response = await _client.GetAsync("/api/book");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var books = await response.Content.ReadFromJsonAsync<IEnumerable<Book>>();
            books.Should().NotBeNull().And.BeEmpty();
        }

        [Fact]
        public async Task CreateBook_ShouldCreateBook_WhenValidDataProvided()
        {
            // Arrange
            var dto = TestDataFactory.CreateBookDto("Test Book", "Test Author");
            dto.Description = "A test book description";
            dto.Status = Status.Uncharted;
            dto.Format = BookFormat.Digital;

            // Act
            var response = await _client.PostAsJsonAsync("/api/book", dto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.Created);
            var createdBook = await response.Content.ReadFromJsonAsync<Book>();
            createdBook.Should().NotBeNull();
            createdBook!.Title.Should().Be(dto.Title);
            createdBook.Author.Should().Be(dto.Author);
            createdBook.Description.Should().Be(dto.Description);
            createdBook.Status.Should().Be(dto.Status);
            createdBook.Format.Should().Be(dto.Format);
        }

        [Fact]
        public async Task CreateBook_ShouldReturnBadRequest_WhenInvalidDataProvided()
        {
            // Arrange
            var dto = new CreateBookDto
            {
                Title = "", // Invalid: empty title
                Author = "Test Author"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/book", dto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        }

        [Fact]
        public async Task GetBookById_ShouldReturnBook_WhenBookExists()
        {
            // Arrange
            var dto = TestDataFactory.CreateBookDto("Test Book", "Test Author");
            var createResponse = await _client.PostAsJsonAsync("/api/book", dto);
            var createdBook = await createResponse.Content.ReadFromJsonAsync<Book>();

            // Act
            var response = await _client.GetAsync($"/api/book/{createdBook!.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var book = await response.Content.ReadFromJsonAsync<Book>();
            book.Should().NotBeNull();
            book!.Id.Should().Be(createdBook.Id);
            book.Title.Should().Be(createdBook.Title);
            book.Author.Should().Be(createdBook.Author);
        }

        [Fact]
        public async Task GetBookById_ShouldReturnNotFound_WhenBookDoesNotExist()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();

            // Act
            var response = await _client.GetAsync($"/api/book/{nonExistentId}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task UpdateBook_ShouldUpdateBook_WhenBookExists()
        {
            // Arrange
            var dto = TestDataFactory.CreateBookDto("Original Title", "Original Author");
            var createResponse = await _client.PostAsJsonAsync("/api/book", dto);
            var createdBook = await createResponse.Content.ReadFromJsonAsync<Book>();

            var updateDto = TestDataFactory.CreateBookDto("Updated Title", "Updated Author");
            updateDto.Description = "Updated description";

            // Act
            var response = await _client.PutAsJsonAsync($"/api/book/{createdBook!.Id}", updateDto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var updatedBook = await response.Content.ReadFromJsonAsync<Book>();
            updatedBook.Should().NotBeNull();
            updatedBook!.Title.Should().Be(updateDto.Title);
            updatedBook.Author.Should().Be(updateDto.Author);
            updatedBook.Description.Should().Be(updateDto.Description);
        }

        [Fact]
        public async Task UpdateBook_ShouldReturnNotFound_WhenBookDoesNotExist()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();
            var dto = TestDataFactory.CreateBookDto("Updated Title", "Updated Author");

            // Act
            var response = await _client.PutAsJsonAsync($"/api/book/{nonExistentId}", dto);

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task DeleteBook_ShouldDeleteBook_WhenBookExists()
        {
            // Arrange
            var dto = TestDataFactory.CreateBookDto("Book to Delete", "Author");
            var createResponse = await _client.PostAsJsonAsync("/api/book", dto);
            var createdBook = await createResponse.Content.ReadFromJsonAsync<Book>();

            // Act
            var response = await _client.DeleteAsync($"/api/book/{createdBook!.Id}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NoContent);

            // Verify book is deleted
            var getResponse = await _client.GetAsync($"/api/book/{createdBook.Id}");
            getResponse.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task DeleteBook_ShouldReturnNotFound_WhenBookDoesNotExist()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();

            // Act
            var response = await _client.DeleteAsync($"/api/book/{nonExistentId}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.NotFound);
        }

        [Fact]
        public async Task GetBooksByAuthor_ShouldReturnBooksByAuthor()
        {
            // Arrange
            var author = "Test Author";
            var books = new[]
            {
                TestDataFactory.CreateBookDto("Book 1", author),
                TestDataFactory.CreateBookDto("Book 2", author),
                TestDataFactory.CreateBookDto("Book 3", "Other Author")
            };

            foreach (var book in books)
            {
                await _client.PostAsJsonAsync("/api/book", book);
            }

            // Act
            var response = await _client.GetAsync($"/api/book/by-author/{Uri.EscapeDataString(author)}");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = await response.Content.ReadFromJsonAsync<IEnumerable<Book>>();
            result.Should().NotBeNull().And.HaveCount(2);
            result!.Should().OnlyContain(b => b.Author.ToLower().Contains(author.ToLower()));
        }

        [Fact]
        public async Task GetBookSeries_ShouldReturnOnlyBooksInSeries()
        {
            // Arrange
            var seriesBooks = new[]
            {
                TestDataFactory.CreateBookDto("Series Book 1", "Author 1"),
                TestDataFactory.CreateBookDto("Series Book 2", "Author 2")
            };
            var standaloneBook = TestDataFactory.CreateBookDto("Standalone Book", "Author 3");

            foreach (var book in seriesBooks)
            {
                book.PartOfSeries = true;
                await _client.PostAsJsonAsync("/api/book", book);
            }

            standaloneBook.PartOfSeries = false;
            await _client.PostAsJsonAsync("/api/book", standaloneBook);

            // Act
            var response = await _client.GetAsync("/api/book/series");

            // Assert
            response.StatusCode.Should().Be(HttpStatusCode.OK);
            var result = await response.Content.ReadFromJsonAsync<IEnumerable<Book>>();
            result.Should().NotBeNull().And.HaveCount(2);
            result!.Should().OnlyContain(b => b.PartOfSeries == true);
        }
    }
}
