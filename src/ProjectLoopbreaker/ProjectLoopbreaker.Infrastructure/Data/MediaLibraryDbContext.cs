using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Domain.Interfaces;
using System.Collections.Generic;

namespace ProjectLoopbreaker.Infrastructure.Data

{
    public class MediaLibraryDbContext : DbContext, IApplicationDbContext
    {
        // Entity Framework DbSet properties
        public DbSet<BaseMediaItem> MediaItems { get; set; }
        public DbSet<Mixlist> Mixlists { get; set; }
        public DbSet<PodcastSeries> PodcastSeries { get; set; }
        public DbSet<PodcastEpisode> PodcastEpisodes { get; set; }
        public DbSet<Book> Books { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<TvShow> TvShows { get; set; }
        public DbSet<Video> Videos { get; set; }
        public DbSet<YouTubeChannel> YouTubeChannels { get; set; }
        public DbSet<Article> Articles { get; set; }
        public DbSet<Topic> Topics { get; set; }
        public DbSet<Genre> Genres { get; set; }

        // IApplicationDbContext interface implementations
        IQueryable<BaseMediaItem> IApplicationDbContext.MediaItems => MediaItems;
        IQueryable<Mixlist> IApplicationDbContext.Mixlists => Mixlists;
        IQueryable<PodcastSeries> IApplicationDbContext.PodcastSeries => PodcastSeries;
        IQueryable<PodcastEpisode> IApplicationDbContext.PodcastEpisodes => PodcastEpisodes;
        IQueryable<Book> IApplicationDbContext.Books => Books;
        IQueryable<Movie> IApplicationDbContext.Movies => Movies;
        IQueryable<TvShow> IApplicationDbContext.TvShows => TvShows;
        IQueryable<Video> IApplicationDbContext.Videos => Videos;
        IQueryable<YouTubeChannel> IApplicationDbContext.YouTubeChannels => YouTubeChannels;
        IQueryable<Article> IApplicationDbContext.Articles => Articles;
        IQueryable<Topic> IApplicationDbContext.Topics => Topics;
        IQueryable<Genre> IApplicationDbContext.Genres => Genres;


        public MediaLibraryDbContext(DbContextOptions<MediaLibraryDbContext> options) : base(options) { }




        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure BaseMediaItem entity
            modelBuilder.Entity<BaseMediaItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                // Configure enum conversions to store as strings for better readability
                entity.Property(e => e.Rating)
                    .HasConversion<string>()
                    .HasMaxLength(50);
                    
                entity.Property(e => e.MediaType)
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .IsRequired();
                    
                entity.Property(e => e.Status)
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .IsRequired();
                    
                entity.Property(e => e.OwnershipStatus)
                    .HasConversion<string>()
                    .HasMaxLength(50);

                // Configure string length constraints
                entity.Property(e => e.Title)
                    .HasMaxLength(500)
                    .IsRequired();
                    
                entity.Property(e => e.Link)
                    .HasMaxLength(2000);
                    
                // Topics and Genres are now navigation properties, no column configuration needed
                    
                entity.Property(e => e.Thumbnail)
                    .HasMaxLength(2000);
                    
                // Configure required fields
                entity.Property(e => e.DateAdded)
                    .IsRequired();
            });

            // Configure Mixlist entity
            modelBuilder.Entity<Mixlist>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.Property(e => e.Name)
                    .HasMaxLength(200)
                    .IsRequired();
                    
                entity.Property(e => e.Description)
                    .HasMaxLength(1000);
                    
                entity.Property(e => e.Thumbnail)
                    .HasMaxLength(2000);
                    
                entity.Property(e => e.DateCreated)
                    .IsRequired();
            });

            // Configure Topic entity
            modelBuilder.Entity<Topic>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired();
                    
                // Create unique index on topic name to prevent duplicates
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // Configure Genre entity
            modelBuilder.Entity<Genre>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name)
                    .HasMaxLength(100)
                    .IsRequired();
                    
                // Create unique index on genre name to prevent duplicates
                entity.HasIndex(e => e.Name).IsUnique();
            });

            // Configure many-to-many relationship between BaseMediaItem and Topic
            modelBuilder.Entity<BaseMediaItem>()
                .HasMany(m => m.Topics)
                .WithMany(t => t.MediaItems)
                .UsingEntity<Dictionary<string, object>>(
                    "MediaItemTopics",
                    j => j
                        .HasOne<Topic>()
                        .WithMany()
                        .HasForeignKey("TopicId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j => j
                        .HasOne<BaseMediaItem>()
                        .WithMany()
                        .HasForeignKey("MediaItemId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.HasKey("MediaItemId", "TopicId");
                        j.ToTable("MediaItemTopics");
                    });

            // Configure many-to-many relationship between BaseMediaItem and Genre
            modelBuilder.Entity<BaseMediaItem>()
                .HasMany(m => m.Genres)
                .WithMany(g => g.MediaItems)
                .UsingEntity<Dictionary<string, object>>(
                    "MediaItemGenres",
                    j => j
                        .HasOne<Genre>()
                        .WithMany()
                        .HasForeignKey("GenreId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j => j
                        .HasOne<BaseMediaItem>()
                        .WithMany()
                        .HasForeignKey("MediaItemId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.HasKey("MediaItemId", "GenreId");
                        j.ToTable("MediaItemGenres");
                    });

            // Configure many-to-many relationship between BaseMediaItem and Mixlist
            modelBuilder.Entity<BaseMediaItem>()
                .HasMany(m => m.Mixlists)
                .WithMany(m => m.MediaItems)
                .UsingEntity<Dictionary<string, object>>(
                    "MixlistMediaItems", // Join table name
                    j => j
                        .HasOne<Mixlist>()
                        .WithMany()
                        .HasForeignKey("MixlistId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j => j
                        .HasOne<BaseMediaItem>()
                        .WithMany()
                        .HasForeignKey("MediaItemId")
                        .OnDelete(DeleteBehavior.Cascade),
                    j =>
                    {
                        j.HasKey("MixlistId", "MediaItemId");
                        j.ToTable("MixlistMediaItems");
                    });

            // Configure Table-Per-Type (TPT) inheritance for all media entities
            modelBuilder.Entity<BaseMediaItem>().ToTable("MediaItems");
            modelBuilder.Entity<PodcastSeries>().ToTable("PodcastSeries");
            modelBuilder.Entity<PodcastEpisode>().ToTable("PodcastEpisodes");
            modelBuilder.Entity<Book>().ToTable("Books");
            modelBuilder.Entity<Movie>().ToTable("Movies");
            modelBuilder.Entity<TvShow>().ToTable("TvShows");
            modelBuilder.Entity<Video>().ToTable("Videos");
            modelBuilder.Entity<YouTubeChannel>().ToTable("YouTubeChannels");
            modelBuilder.Entity<Article>().ToTable("Articles");

            // Configure PodcastSeries specific properties
            modelBuilder.Entity<PodcastSeries>(entity =>
            {
                entity.Property(e => e.Publisher)
                    .HasMaxLength(500);
                    
                entity.Property(e => e.ExternalId)
                    .HasMaxLength(200);
                    
                entity.Property(e => e.IsSubscribed)
                    .HasDefaultValue(false);
                    
                entity.Property(e => e.TotalEpisodes)
                    .HasDefaultValue(0);
                    
                // Create index on ExternalId for API imports
                entity.HasIndex(e => e.ExternalId);
                
                // Create index on IsSubscribed for subscription queries
                entity.HasIndex(e => e.IsSubscribed);
            });

            // Configure PodcastEpisode specific properties
            modelBuilder.Entity<PodcastEpisode>(entity =>
            {
                entity.Property(e => e.AudioLink)
                    .HasMaxLength(2000);
                    
                entity.Property(e => e.DurationInSeconds)
                    .HasDefaultValue(0);
                    
                entity.Property(e => e.ExternalId)
                    .HasMaxLength(200);
                    
                entity.Property(e => e.Publisher)
                    .HasMaxLength(500);
                    
                // Configure relationship with PodcastSeries
                entity.HasOne(e => e.Series)
                    .WithMany(s => s.Episodes)
                    .HasForeignKey(e => e.SeriesId)
                    .OnDelete(DeleteBehavior.Cascade); // Cascade delete: when series deleted, delete episodes
                    
                // Create index on SeriesId for better query performance
                entity.HasIndex(e => e.SeriesId);
                
                // Create index on ExternalId for API imports
                entity.HasIndex(e => e.ExternalId);
                
                // Create index on ReleaseDate for chronological queries
                entity.HasIndex(e => e.ReleaseDate);
            });

            // Configure Book specific properties
            modelBuilder.Entity<Book>(entity =>
            {
                entity.Property(e => e.Author)
                    .HasMaxLength(300)
                    .IsRequired();
                    
                entity.Property(e => e.ISBN)
                    .HasMaxLength(17);
                    
                entity.Property(e => e.ASIN)
                    .HasMaxLength(20);
                    
                entity.Property(e => e.Format)
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .IsRequired();
                    
                // Create index on ISBN for better query performance
                entity.HasIndex(e => e.ISBN);
                
                // Create index on Author for better query performance
                entity.HasIndex(e => e.Author);
                
                // Create index on ASIN for better query performance
                entity.HasIndex(e => e.ASIN);
            });

            // Configure Movie specific properties
            modelBuilder.Entity<Movie>(entity =>
            {
                entity.Property(e => e.Director)
                    .HasMaxLength(100);
                    
                entity.Property(e => e.Cast)
                    .HasMaxLength(500);
                    
                entity.Property(e => e.MpaaRating)
                    .HasMaxLength(50);
                    
                entity.Property(e => e.ImdbId)
                    .HasMaxLength(20);
                    
                entity.Property(e => e.TmdbId)
                    .HasMaxLength(20);
                    
                entity.Property(e => e.TmdbBackdropPath)
                    .HasMaxLength(2000);
                    
                entity.Property(e => e.Tagline)
                    .HasMaxLength(1000);
                    
                entity.Property(e => e.Homepage)
                    .HasMaxLength(2000);
                    
                entity.Property(e => e.OriginalLanguage)
                    .HasMaxLength(10);
                    
                entity.Property(e => e.OriginalTitle)
                    .HasMaxLength(500);
                
                // Create indexes for better query performance
                entity.HasIndex(e => e.ReleaseYear);
                entity.HasIndex(e => e.ImdbId);
                entity.HasIndex(e => e.TmdbId);
                entity.HasIndex(e => e.Director);
            });

            // Configure TvShow specific properties
            modelBuilder.Entity<TvShow>(entity =>
            {
                entity.Property(e => e.Creator)
                    .HasMaxLength(100);
                    
                entity.Property(e => e.Cast)
                    .HasMaxLength(500);
                    
                entity.Property(e => e.ContentRating)
                    .HasMaxLength(50);
                    
                entity.Property(e => e.TmdbId)
                    .HasMaxLength(20);
                    
                entity.Property(e => e.TmdbPosterPath)
                    .HasMaxLength(2000);
                    
                entity.Property(e => e.Tagline)
                    .HasMaxLength(1000);
                    
                entity.Property(e => e.Homepage)
                    .HasMaxLength(2000);
                    
                entity.Property(e => e.OriginalLanguage)
                    .HasMaxLength(10);
                    
                entity.Property(e => e.OriginalName)
                    .HasMaxLength(500);
                
                // Create indexes for better query performance
                entity.HasIndex(e => e.FirstAirYear);
                entity.HasIndex(e => e.LastAirYear);
                entity.HasIndex(e => e.TmdbId);
                entity.HasIndex(e => e.Creator);
            });

            // Configure Video specific properties
            modelBuilder.Entity<Video>(entity =>
            {
                entity.Property(e => e.Platform)
                    .HasMaxLength(100)
                    .IsRequired();
                    
                entity.Property(e => e.LengthInSeconds)
                    .HasDefaultValue(0);
                    
                entity.Property(e => e.VideoType)
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .IsRequired();
                    
                entity.Property(e => e.ExternalId)
                    .HasMaxLength(200);
                    
                // Configure self-referencing relationship for Series->Episodes
                entity.HasOne(e => e.ParentVideo)
                    .WithMany(s => s.Episodes)
                    .HasForeignKey(e => e.ParentVideoId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete to avoid orphaned episodes
                    
                // Configure relationship with YouTubeChannel
                entity.HasOne(e => e.Channel)
                    .WithMany(c => c.Videos)
                    .HasForeignKey(e => e.ChannelId)
                    .OnDelete(DeleteBehavior.SetNull); // When channel deleted, videos remain but ChannelId becomes null
                    
                // Create indexes for better query performance
                entity.HasIndex(e => e.VideoType);
                entity.HasIndex(e => e.ParentVideoId);
                entity.HasIndex(e => e.ExternalId);
                entity.HasIndex(e => e.Platform);
                entity.HasIndex(e => e.ChannelId);
            });

            // Configure YouTubeChannel specific properties
            modelBuilder.Entity<YouTubeChannel>(entity =>
            {
                entity.Property(e => e.ChannelExternalId)
                    .HasMaxLength(100)
                    .IsRequired();
                    
                entity.Property(e => e.CustomUrl)
                    .HasMaxLength(200);
                    
                entity.Property(e => e.UploadsPlaylistId)
                    .HasMaxLength(100);
                    
                entity.Property(e => e.Country)
                    .HasMaxLength(10);
                    
                // Create unique index on ChannelExternalId to prevent duplicate channel imports
                entity.HasIndex(e => e.ChannelExternalId)
                    .IsUnique();
                    
                // Create indexes for better query performance
                entity.HasIndex(e => e.PublishedAt);
                entity.HasIndex(e => e.LastSyncedAt);
                entity.HasIndex(e => e.SubscriberCount);
            });

            // Configure Article specific properties
            modelBuilder.Entity<Article>(entity =>
            {
                entity.Property(e => e.InstapaperBookmarkId)
                    .HasMaxLength(100);
                    
                entity.Property(e => e.ContentStoragePath)
                    .HasMaxLength(500);
                    
                entity.Property(e => e.InstapaperHash)
                    .HasMaxLength(100);
                    
                entity.Property(e => e.Author)
                    .HasMaxLength(200);
                    
                entity.Property(e => e.Publication)
                    .HasMaxLength(200);
                    
                entity.Property(e => e.IsStarred)
                    .HasDefaultValue(false);
                    
                entity.Property(e => e.IsArchived)
                    .HasDefaultValue(false);
                    
                // Create indexes for better query performance
                entity.HasIndex(e => e.InstapaperBookmarkId);
                entity.HasIndex(e => e.Author);
                entity.HasIndex(e => e.Publication);
                entity.HasIndex(e => e.IsStarred);
                entity.HasIndex(e => e.IsArchived);
                entity.HasIndex(e => e.PublicationDate);
            });
        }

        // IApplicationDbContext interface method implementations
        public new void Add<TEntity>(TEntity entity) where TEntity : class
        {
            base.Add(entity);
        }

        public new void Update<TEntity>(TEntity entity) where TEntity : class
        {
            base.Update(entity);
        }

        public new void Remove<TEntity>(TEntity entity) where TEntity : class
        {
            base.Remove(entity);
        }

        public new async Task<TEntity?> FindAsync<TEntity>(params object[] keyValues) where TEntity : class
        {
            return await base.FindAsync<TEntity>(keyValues);
        }

        public new object Entry<TEntity>(TEntity entity) where TEntity : class
        {
            return base.Entry(entity);
        }
    }
}
