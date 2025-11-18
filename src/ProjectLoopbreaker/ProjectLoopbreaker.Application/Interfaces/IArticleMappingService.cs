using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IArticleMappingService
    {
        Task<ArticleResponseDto> MapToResponseDtoAsync(Article article);
        Task<IEnumerable<ArticleResponseDto>> MapToResponseDtoAsync(IEnumerable<Article> articles);
        
        // Instapaper mapping methods
        Article MapInstapaperBookmarkToArticle(InstapaperBookmarkDto bookmark);
        Task UpdateArticleFromInstapaper(Article article, InstapaperBookmarkDto bookmark);
    }
}
