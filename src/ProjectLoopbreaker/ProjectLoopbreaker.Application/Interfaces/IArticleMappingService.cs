using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IArticleMappingService
    {
        Task<ArticleResponseDto> MapToResponseDtoAsync(Article article);
        Task<IEnumerable<ArticleResponseDto>> MapToResponseDtoAsync(IEnumerable<Article> articles);
    }
}
