using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using ProjectLoopbreaker.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Application.Interfaces
{
    public interface IApplicationDbContext
    {
        DbSet<BaseMediaItem> MediaItems { get; }
        DbSet<Mixlist> Mixlists { get; }
        DbSet<Podcast> Podcasts { get; }
        DbSet<Book> Books { get; }
        DbSet<Topic> Topics { get; }
        DbSet<Genre> Genres { get; }

        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        EntityEntry<TEntity> Entry<TEntity>(TEntity entity) where TEntity : class;

    }
}