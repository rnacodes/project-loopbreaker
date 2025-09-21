using ProjectLoopbreaker.Domain.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Domain.Interfaces
{
    public interface IApplicationDbContext
    {
        // Entity collections for querying
        IQueryable<BaseMediaItem> MediaItems { get; }
        IQueryable<Mixlist> Mixlists { get; }
        IQueryable<Podcast> Podcasts { get; }
        IQueryable<Book> Books { get; }
        IQueryable<Movie> Movies { get; }
        IQueryable<TvShow> TvShows { get; }
        IQueryable<Video> Videos { get; }
        IQueryable<Topic> Topics { get; }
        IQueryable<Genre> Genres { get; }

        // Basic operations
        Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
        
        // Entity tracking
        void Add<TEntity>(TEntity entity) where TEntity : class;
        void Update<TEntity>(TEntity entity) where TEntity : class;
        void Remove<TEntity>(TEntity entity) where TEntity : class;
        
        // Entity finding
        Task<TEntity?> FindAsync<TEntity>(params object[] keyValues) where TEntity : class;
        
        // Entity entry for complex operations
        object Entry<TEntity>(TEntity entity) where TEntity : class;
    }
}
