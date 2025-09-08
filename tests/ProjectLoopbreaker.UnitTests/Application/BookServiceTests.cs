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
    public class BookServiceTests
    {
        private readonly Mock<IApplicationDbContext> _mockContext;
        private readonly Mock<ILogger<BookService>> _mockLogger;
        private readonly BookService _bookService;
        private readonly Mock<DbSet<Book>> _mockBooks;
        private readonly Mock<DbSet<Topic>> _mockTopics;
        private readonly Mock<DbSet<Genre>> _mockGenres;

        public BookServiceTests()
        {
            _mockContext = new Mock<IApplicationDbContext>();
            _mockLogger = new Mock<ILogger<BookService>>();
            _bookService = new BookService(_mockContext.Object, _mockLogger.Object);

            _mockBooks = new Mock<DbSet<Book>>();
            _mockTopics = new Mock<DbSet<Topic>>();
            _mockGenres = new Mock<DbSet<Genre>>();

            _mockContext.Setup(c => c.Books).Returns(_mockBooks.Object);
            _mockContext.Setup(c => c.Topics).Returns(_mockTopics.Object);
            _mockContext.Setup(c => c.Genres).Returns(_mockGenres.Object);
        }

        [Fact]
        public async Task GetAllBooksAsync_ShouldReturnAllBooks()
        {
            // Arrange
            var books = TestDataFactory.CreateBooks(3);
            var queryableBooks = books.AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            // Act
            var result = await _bookService.GetAllBooksAsync();

            // Assert
            result.Should().HaveCount(3);
            result.Should().BeEquivalentTo(books);
        }

        [Fact]
        public async Task GetBookByIdAsync_ShouldReturnBook_WhenBookExists()
        {
            // Arrange
            var book = TestDataFactory.CreateBook("Test Book", "Test Author");
            var queryableBooks = new[] { book }.AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            // Act
            var result = await _bookService.GetBookByIdAsync(book.Id);

            // Assert
            result.Should().NotBeNull();
            result.Should().BeEquivalentTo(book);
        }

        [Fact]
        public async Task GetBookByIdAsync_ShouldReturnNull_WhenBookDoesNotExist()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();
            var queryableBooks = new List<Book>().AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            // Act
            var result = await _bookService.GetBookByIdAsync(nonExistentId);

            // Assert
            result.Should().BeNull();
        }

        [Fact]
        public async Task GetBooksByAuthorAsync_ShouldReturnBooksByAuthor()
        {
            // Arrange
            var author = "Test Author";
            var books = new[]
            {
                TestDataFactory.CreateBook("Book 1", author),
                TestDataFactory.CreateBook("Book 2", author),
                TestDataFactory.CreateBook("Book 3", "Other Author")
            };
            var queryableBooks = books.AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            // Act
            var result = await _bookService.GetBooksByAuthorAsync(author);

            // Assert
            result.Should().HaveCount(2);
            result.Should().OnlyContain(b => b.Author.ToLower().Contains(author.ToLower()));
        }

        [Fact]
        public async Task GetBookSeriesAsync_ShouldReturnOnlyBooksInSeries()
        {
            // Arrange
            var books = new[]
            {
                TestDataFactory.CreateBook("Series Book 1", "Author 1"),
                TestDataFactory.CreateBook("Series Book 2", "Author 2"),
                TestDataFactory.CreateBook("Standalone Book", "Author 3")
            };
            books[0].PartOfSeries = true;
            books[1].PartOfSeries = true;
            books[2].PartOfSeries = false;

            var queryableBooks = books.AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            // Act
            var result = await _bookService.GetBookSeriesAsync();

            // Assert
            result.Should().HaveCount(2);
            result.Should().OnlyContain(b => b.PartOfSeries == true);
        }

        [Fact]
        public async Task CreateBookAsync_ShouldCreateNewBook_WhenBookDoesNotExist()
        {
            // Arrange
            var dto = TestDataFactory.CreateBookDto("New Book", "New Author");
            var queryableBooks = new List<Book>().AsQueryable();
            var queryableTopics = new List<Topic>().AsQueryable();
            var queryableGenres = new List<Genre>().AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.Provider).Returns(queryableTopics.Provider);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.Expression).Returns(queryableTopics.Expression);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.ElementType).Returns(queryableTopics.ElementType);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableTopics.GetEnumerator());

            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.Provider).Returns(queryableGenres.Provider);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.Expression).Returns(queryableGenres.Expression);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.ElementType).Returns(queryableGenres.ElementType);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableGenres.GetEnumerator());

            _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _bookService.CreateBookAsync(dto);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be(dto.Title);
            result.Author.Should().Be(dto.Author);
            result.MediaType.Should().Be(MediaType.Book);
            _mockContext.Verify(c => c.Add(It.IsAny<Book>()), Times.Once);
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreateBookAsync_ShouldThrowArgumentNullException_WhenDtoIsNull()
        {
            // Arrange
            CreateBookDto? dto = null;

            // Act & Assert
            await _bookService.Invoking(s => s.CreateBookAsync(dto!))
                .Should().ThrowAsync<ArgumentNullException>()
                .WithMessage("Book data is required (Parameter 'dto')");
        }

        [Fact]
        public async Task CreateBookAsync_ShouldReturnExistingBook_WhenBookAlreadyExists()
        {
            // Arrange
            var existingBook = TestDataFactory.CreateBook("Existing Book", "Existing Author");
            var dto = TestDataFactory.CreateBookDto("Existing Book", "Existing Author");
            var queryableBooks = new[] { existingBook }.AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.Provider).Returns(new List<Topic>().AsQueryable().Provider);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.Expression).Returns(new List<Topic>().AsQueryable().Expression);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.ElementType).Returns(new List<Topic>().AsQueryable().ElementType);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.GetEnumerator()).Returns(new List<Topic>().AsQueryable().GetEnumerator());

            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.Provider).Returns(new List<Genre>().AsQueryable().Provider);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.Expression).Returns(new List<Genre>().AsQueryable().Expression);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.ElementType).Returns(new List<Genre>().AsQueryable().ElementType);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.GetEnumerator()).Returns(new List<Genre>().AsQueryable().GetEnumerator());

            // Act
            var result = await _bookService.CreateBookAsync(dto);

            // Assert
            result.Should().BeEquivalentTo(existingBook);
            _mockContext.Verify(c => c.Add(It.IsAny<Book>()), Times.Never);
        }

        [Fact]
        public async Task UpdateBookAsync_ShouldUpdateExistingBook()
        {
            // Arrange
            var existingBook = TestDataFactory.CreateBook("Original Title", "Original Author");
            var dto = TestDataFactory.CreateBookDto("Updated Title", "Updated Author");
            var queryableBooks = new[] { existingBook }.AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.Provider).Returns(new List<Topic>().AsQueryable().Provider);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.Expression).Returns(new List<Topic>().AsQueryable().Expression);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.ElementType).Returns(new List<Topic>().AsQueryable().ElementType);
            _mockTopics.As<IQueryable<Topic>>()
                .Setup(m => m.GetEnumerator()).Returns(new List<Topic>().AsQueryable().GetEnumerator());

            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.Provider).Returns(new List<Genre>().AsQueryable().Provider);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.Expression).Returns(new List<Genre>().AsQueryable().Expression);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.ElementType).Returns(new List<Genre>().AsQueryable().ElementType);
            _mockGenres.As<IQueryable<Genre>>()
                .Setup(m => m.GetEnumerator()).Returns(new List<Genre>().AsQueryable().GetEnumerator());

            _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _bookService.UpdateBookAsync(existingBook.Id, dto);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be(dto.Title);
            result.Author.Should().Be(dto.Author);
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task UpdateBookAsync_ShouldThrowInvalidOperationException_WhenBookDoesNotExist()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();
            var dto = TestDataFactory.CreateBookDto("Updated Title", "Updated Author");
            var queryableBooks = new List<Book>().AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            // Act & Assert
            await _bookService.Invoking(s => s.UpdateBookAsync(nonExistentId, dto))
                .Should().ThrowAsync<InvalidOperationException>()
                .WithMessage($"Book with ID {nonExistentId} not found.");
        }

        [Fact]
        public async Task DeleteBookAsync_ShouldReturnTrue_WhenBookExists()
        {
            // Arrange
            var book = TestDataFactory.CreateBook("Book to Delete", "Author");
            _mockContext.Setup(c => c.FindAsync<Book>(book.Id, It.IsAny<CancellationToken>()))
                .ReturnsAsync(book);
            _mockContext.Setup(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _bookService.DeleteBookAsync(book.Id);

            // Assert
            result.Should().BeTrue();
            _mockContext.Verify(c => c.Remove(book), Times.Once);
            _mockContext.Verify(c => c.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task DeleteBookAsync_ShouldReturnFalse_WhenBookDoesNotExist()
        {
            // Arrange
            var nonExistentId = Guid.NewGuid();
            _mockContext.Setup(c => c.FindAsync<Book>(nonExistentId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Book?)null);

            // Act
            var result = await _bookService.DeleteBookAsync(nonExistentId);

            // Assert
            result.Should().BeFalse();
            _mockContext.Verify(c => c.Remove(It.IsAny<Book>()), Times.Never);
        }

        [Fact]
        public async Task BookExistsAsync_ShouldReturnTrue_WhenBookExists()
        {
            // Arrange
            var book = TestDataFactory.CreateBook("Existing Book", "Existing Author");
            var queryableBooks = new[] { book }.AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            // Act
            var result = await _bookService.BookExistsAsync("Existing Book", "Existing Author");

            // Assert
            result.Should().BeTrue();
        }

        [Fact]
        public async Task BookExistsAsync_ShouldReturnFalse_WhenBookDoesNotExist()
        {
            // Arrange
            var queryableBooks = new List<Book>().AsQueryable();
            
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Provider).Returns(queryableBooks.Provider);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.Expression).Returns(queryableBooks.Expression);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.ElementType).Returns(queryableBooks.ElementType);
            _mockBooks.As<IQueryable<Book>>()
                .Setup(m => m.GetEnumerator()).Returns(queryableBooks.GetEnumerator());

            // Act
            var result = await _bookService.BookExistsAsync("Non-existent Book", "Non-existent Author");

            // Assert
            result.Should().BeFalse();
        }
    }
}
