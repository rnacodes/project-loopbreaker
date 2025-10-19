using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using ProjectLoopbreaker.Shared.DTOs.Instapaper;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IArticleMappingService
    {
        /// <summary>
        /// Maps an Instapaper bookmark DTO to an Article entity
        /// </summary>
        /// <param name="bookmarkDto">Instapaper bookmark data</param>
        /// <returns>Article entity</returns>
        Article MapInstapaperBookmarkToArticle(InstapaperBookmarkDto bookmarkDto);
        
        /// <summary>
        /// Maps a CreateArticleDto to an Article entity
        /// </summary>
        /// <param name="createDto">Create article DTO</param>
        /// <returns>Article entity</returns>
        Article MapCreateDtoToArticle(CreateArticleDto createDto);
        
        /// <summary>
        /// Maps an Article entity to ArticleResponseDto
        /// </summary>
        /// <param name="article">Article entity</param>
        /// <returns>Article response DTO</returns>
        ArticleResponseDto MapArticleToResponseDto(Article article);
        
        /// <summary>
        /// Updates an existing Article entity with data from CreateArticleDto
        /// </summary>
        /// <param name="existingArticle">Existing article entity</param>
        /// <param name="updateDto">Update data</param>
        void UpdateArticleFromDto(Article existingArticle, CreateArticleDto updateDto);
        
        /// <summary>
        /// Updates an existing Article entity with fresh data from Instapaper
        /// </summary>
        /// <param name="existingArticle">Existing article entity</param>
        /// <param name="bookmarkDto">Fresh Instapaper bookmark data</param>
        void UpdateArticleFromInstapaper(Article existingArticle, InstapaperBookmarkDto bookmarkDto);
    }
}
