using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;

namespace ProjectLoopbreaker.Application.Services
{
    public class ArticleMappingService : IArticleMappingService
    {
        public Article MapInstapaperBookmarkToArticle(InstapaperBookmarkDto bookmarkDto)
        {
            var article = new Article
            {
                Title = !string.IsNullOrWhiteSpace(bookmarkDto.Title) ? bookmarkDto.Title : "Untitled Article",
                MediaType = MediaType.Article,
                OriginalUrl = bookmarkDto.Url,
                Link = bookmarkDto.Url,
                Description = bookmarkDto.Description,
                DateAdded = DateTime.UtcNow,
                SavedToInstapaperDate = bookmarkDto.GetDateAdded(),
                Status = Status.Uncharted,
                InstapaperBookmarkId = bookmarkDto.BookmarkId.ToString(),
                ReadingProgress = bookmarkDto.GetNormalizedProgress(),
                ProgressTimestamp = bookmarkDto.GetProgressDateTime(),
                IsStarred = bookmarkDto.IsStarred,
                IsArchived = false // This would be determined by the folder_id from the request
            };
            
            // Estimate reading time based on description length (rough approximation)
            if (!string.IsNullOrEmpty(bookmarkDto.Description))
            {
                var wordCount = CountWords(bookmarkDto.Description);
                article.WordCount = wordCount;
                article.EstimatedReadingTimeMinutes = EstimateReadingTime(wordCount);
            }
            
            return article;
        }
        
        public Article MapCreateDtoToArticle(CreateArticleDto createDto)
        {
            return new Article
            {
                Title = createDto.Title,
                MediaType = MediaType.Article,
                OriginalUrl = createDto.OriginalUrl,
                Link = createDto.Link,
                Notes = createDto.Notes,
                Status = createDto.Status,
                DateAdded = DateTime.UtcNow,
                DateCompleted = createDto.DateCompleted,
                Rating = createDto.Rating,
                OwnershipStatus = createDto.OwnershipStatus,
                Description = createDto.Description,
                Author = createDto.Author,
                Publication = createDto.Publication,
                PublicationDate = createDto.PublicationDate,
                ReadingProgress = createDto.ReadingProgress,
                EstimatedReadingTimeMinutes = createDto.EstimatedReadingTimeMinutes,
                WordCount = createDto.WordCount,
                IsStarred = createDto.IsStarred,
                IsArchived = createDto.IsArchived,
                FullTextContent = createDto.FullTextContent,
                RelatedNotes = createDto.RelatedNotes,
                Thumbnail = createDto.Thumbnail,
                InstapaperBookmarkId = createDto.InstapaperBookmarkId,
                SavedToInstapaperDate = createDto.SavedToInstapaperDate
            };
        }
        
        public ArticleResponseDto MapArticleToResponseDto(Article article)
        {
            return new ArticleResponseDto
            {
                Id = article.Id,
                Title = article.Title,
                MediaType = article.MediaType,
                OriginalUrl = article.OriginalUrl,
                Link = article.Link,
                EffectiveUrl = article.GetEffectiveUrl(),
                Notes = article.Notes,
                DateAdded = article.DateAdded,
                Status = article.Status,
                DateCompleted = article.DateCompleted,
                Rating = article.Rating,
                OwnershipStatus = article.OwnershipStatus,
                Description = article.Description,
                Author = article.Author,
                Publication = article.Publication,
                PublicationDate = article.PublicationDate,
                SavedToInstapaperDate = article.SavedToInstapaperDate,
                ReadingProgress = article.ReadingProgress,
                ProgressTimestamp = article.ProgressTimestamp,
                EstimatedReadingTimeMinutes = article.EstimatedReadingTimeMinutes,
                WordCount = article.WordCount,
                IsStarred = article.IsStarred,
                IsArchived = article.IsArchived,
                HasBeenStarted = article.HasBeenStarted,
                IsReadingCompleted = article.IsReadingCompleted,
                RelatedNotes = article.RelatedNotes,
                Thumbnail = article.Thumbnail,
                Topics = article.Topics.Select(t => t.Name).ToArray(),
                Genres = article.Genres.Select(g => g.Name).ToArray(),
                MixlistIds = article.Mixlists.Select(m => m.Id).ToArray(),
                InstapaperBookmarkId = article.InstapaperBookmarkId
            };
        }
        
        public void UpdateArticleFromDto(Article existingArticle, CreateArticleDto updateDto)
        {
            existingArticle.Title = updateDto.Title;
            existingArticle.OriginalUrl = updateDto.OriginalUrl;
            existingArticle.Link = updateDto.Link;
            existingArticle.Notes = updateDto.Notes;
            existingArticle.Status = updateDto.Status;
            existingArticle.DateCompleted = updateDto.DateCompleted;
            existingArticle.Rating = updateDto.Rating;
            existingArticle.OwnershipStatus = updateDto.OwnershipStatus;
            existingArticle.Description = updateDto.Description;
            existingArticle.Author = updateDto.Author;
            existingArticle.Publication = updateDto.Publication;
            existingArticle.PublicationDate = updateDto.PublicationDate;
            existingArticle.ReadingProgress = updateDto.ReadingProgress;
            existingArticle.EstimatedReadingTimeMinutes = updateDto.EstimatedReadingTimeMinutes;
            existingArticle.WordCount = updateDto.WordCount;
            existingArticle.IsStarred = updateDto.IsStarred;
            existingArticle.IsArchived = updateDto.IsArchived;
            existingArticle.FullTextContent = updateDto.FullTextContent;
            existingArticle.RelatedNotes = updateDto.RelatedNotes;
            existingArticle.Thumbnail = updateDto.Thumbnail;
            
            // Update progress timestamp if reading progress changed
            if (Math.Abs(existingArticle.ReadingProgress - updateDto.ReadingProgress) > 0.001)
            {
                existingArticle.ProgressTimestamp = DateTime.UtcNow;
            }
        }
        
        public void UpdateArticleFromInstapaper(Article existingArticle, InstapaperBookmarkDto bookmarkDto)
        {
            // Update fields that might have changed in Instapaper
            existingArticle.Title = !string.IsNullOrWhiteSpace(bookmarkDto.Title) ? bookmarkDto.Title : existingArticle.Title;
            existingArticle.Description = bookmarkDto.Description ?? existingArticle.Description;
            existingArticle.ReadingProgress = bookmarkDto.GetNormalizedProgress();
            existingArticle.ProgressTimestamp = bookmarkDto.GetProgressDateTime();
            existingArticle.IsStarred = bookmarkDto.IsStarred;
            
            // Update word count and reading time if description changed
            if (!string.IsNullOrEmpty(bookmarkDto.Description) && existingArticle.Description != bookmarkDto.Description)
            {
                var wordCount = CountWords(bookmarkDto.Description);
                existingArticle.WordCount = wordCount;
                existingArticle.EstimatedReadingTimeMinutes = EstimateReadingTime(wordCount);
            }
        }
        
        private int CountWords(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return 0;
                
            return text.Split(new char[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries).Length;
        }
        
        private int EstimateReadingTime(int wordCount)
        {
            // Average reading speed is about 200-250 words per minute
            // Using 225 as a middle ground
            const int wordsPerMinute = 225;
            return Math.Max(1, (int)Math.Ceiling((double)wordCount / wordsPerMinute));
        }
    }
}
