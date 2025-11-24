using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using ProjectLoopbreaker.Application.Services;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.Interfaces;
using Xunit;

namespace ProjectLoopbreaker.UnitTests.Application
{
    public class HighlightServiceTests
    {
        private readonly Mock<IApplicationDbContext> _mockContext;
        private readonly Mock<IReadwiseApiClient> _mockReadwiseClient;
        private readonly Mock<ILogger<HighlightService>> _mockLogger;
        private readonly Mock<DbSet<Highlight>> _mockHighlightSet;
        private readonly HighlightService _service;

        public HighlightServiceTests()
        {
            _mockContext = new Mock<IApplicationDbContext>();
            _mockReadwiseClient = new Mock<IReadwiseApiClient>();
            _mockLogger = new Mock<ILogger<HighlightService>>();
            _mockHighlightSet = new Mock<DbSet<Highlight>>();

            _mockContext.Setup(c => c.Highlights).Returns(_mockHighlightSet.Object);

            _service = new HighlightService(_mockContext.Object, _mockReadwiseClient.Object, _mockLogger.Object);
        }

        [Fact]
        public async Task GetHighlightByIdAsync_ValidId_ReturnsHighlight()
        {
            // Arrange
            var highlightId = Guid.NewGuid();
            var highlight = new Highlight
            {
                Id = highlightId,
                Text = "Test highlight text",
                ReadwiseId = 123
            };

            var highlights = new List<Highlight> { highlight }.AsQueryable();
            SetupMockDbSet(_mockHighlightSet, highlights);

            // Act
            var result = await _service.GetHighlightByIdAsync(highlightId);

            // Assert
            result.Should().NotBeNull();
            result.Id.Should().Be(highlightId);
            result.Text.Should().Be("Test highlight text");
        }

        [Fact]
        public async Task GetHighlightsByArticleIdAsync_ValidArticleId_ReturnsHighlights()
        {
            // Arrange
            var articleId = Guid.NewGuid();
            var highlights = new List<Highlight>
            {
                new Highlight { Id = Guid.NewGuid(), ArticleId = articleId, Text = "Highlight 1", ReadwiseId = 1 },
                new Highlight { Id = Guid.NewGuid(), ArticleId = articleId, Text = "Highlight 2", ReadwiseId = 2 }
            }.AsQueryable();

            SetupMockDbSet(_mockHighlightSet, highlights);

            // Act
            var result = await _service.GetHighlightsByArticleIdAsync(articleId);

            // Assert
            result.Should().HaveCount(2);
            result.Should().AllSatisfy(h => h.ArticleId.Should().Be(articleId));
        }

        [Fact]
        public async Task GetHighlightsByBookIdAsync_ValidBookId_ReturnsHighlights()
        {
            // Arrange
            var bookId = Guid.NewGuid();
            var highlights = new List<Highlight>
            {
                new Highlight { Id = Guid.NewGuid(), BookId = bookId, Text = "Book Highlight 1", ReadwiseId = 1 },
                new Highlight { Id = Guid.NewGuid(), BookId = bookId, Text = "Book Highlight 2", ReadwiseId = 2 },
                new Highlight { Id = Guid.NewGuid(), BookId = bookId, Text = "Book Highlight 3", ReadwiseId = 3 }
            }.AsQueryable();

            SetupMockDbSet(_mockHighlightSet, highlights);

            // Act
            var result = await _service.GetHighlightsByBookIdAsync(bookId);

            // Assert
            result.Should().HaveCount(3);
            result.Should().AllSatisfy(h => h.BookId.Should().Be(bookId));
        }

        [Fact]
        public async Task GetHighlightsByTagAsync_ValidTag_ReturnsMatchingHighlights()
        {
            // Arrange
            var tag = "important";
            var highlights = new List<Highlight>
            {
                new Highlight { Id = Guid.NewGuid(), Text = "Tagged highlight", Tags = "important,review", ReadwiseId = 1 },
                new Highlight { Id = Guid.NewGuid(), Text = "Another tagged highlight", Tags = "important", ReadwiseId = 2 },
                new Highlight { Id = Guid.NewGuid(), Text = "Untagged highlight", Tags = "", ReadwiseId = 3 }
            }.AsQueryable();

            SetupMockDbSet(_mockHighlightSet, highlights);

            // Act
            var result = await _service.GetHighlightsByTagAsync(tag);

            // Assert
            result.Should().HaveCount(2);
            result.Should().AllSatisfy(h => h.Tags.Should().Contain(tag));
        }

        [Fact]
        public async Task CreateHighlightAsync_ValidData_CreatesHighlight()
        {
            // Arrange
            var createDto = new CreateHighlightDto
            {
                Text = "New highlight",
                Note = "Test note",
                Tags = new List<string> { "test" }
            };

            _mockContext.Setup(c => c.SaveChangesAsync(default))
                .ReturnsAsync(1);

            // Act
            var result = await _service.CreateHighlightAsync(createDto);

            // Assert
            result.Should().NotBeNull();
            result.Text.Should().Be("New highlight");
            result.Note.Should().Be("Test note");
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
        }

        [Fact]
        public async Task UpdateHighlightAsync_ValidData_UpdatesHighlight()
        {
            // Arrange
            var highlightId = Guid.NewGuid();
            var existingHighlight = new Highlight
            {
                Id = highlightId,
                Text = "Original text",
                Note = "Original note",
                ReadwiseId = 123
            };

            var highlights = new List<Highlight> { existingHighlight }.AsQueryable();
            SetupMockDbSet(_mockHighlightSet, highlights);

            var updateDto = new CreateHighlightDto
            {
                Text = "Updated text",
                Note = "Updated note"
            };

            _mockContext.Setup(c => c.SaveChangesAsync(default))
                .ReturnsAsync(1);

            // Act
            var result = await _service.UpdateHighlightAsync(highlightId, updateDto);

            // Assert
            result.Should().NotBeNull();
            result.Text.Should().Be("Updated text");
            result.Note.Should().Be("Updated note");
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
        }

        [Fact]
        public async Task DeleteHighlightAsync_ValidId_DeletesHighlight()
        {
            // Arrange
            var highlightId = Guid.NewGuid();
            var highlight = new Highlight { Id = highlightId, Text = "To be deleted", ReadwiseId = 123 };

            var highlights = new List<Highlight> { highlight }.AsQueryable();
            SetupMockDbSet(_mockHighlightSet, highlights);

            _mockContext.Setup(c => c.SaveChangesAsync(default))
                .ReturnsAsync(1);

            // Act
            var result = await _service.DeleteHighlightAsync(highlightId);

            // Assert
            result.Should().BeTrue();
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Once);
        }

        [Fact]
        public async Task DeleteHighlightAsync_InvalidId_ReturnsFalse()
        {
            // Arrange
            var highlights = new List<Highlight>().AsQueryable();
            SetupMockDbSet(_mockHighlightSet, highlights);

            // Act
            var result = await _service.DeleteHighlightAsync(Guid.NewGuid());

            // Assert
            result.Should().BeFalse();
            _mockContext.Verify(c => c.SaveChangesAsync(default), Times.Never);
        }

        private void SetupMockDbSet<T>(Mock<DbSet<T>> mockSet, IQueryable<T> data) where T : class
        {
            mockSet.As<IQueryable<T>>().Setup(m => m.Provider).Returns(data.Provider);
            mockSet.As<IQueryable<T>>().Setup(m => m.Expression).Returns(data.Expression);
            mockSet.As<IQueryable<T>>().Setup(m => m.ElementType).Returns(data.ElementType);
            mockSet.As<IQueryable<T>>().Setup(m => m.GetEnumerator()).Returns(data.GetEnumerator());
        }
    }
}

