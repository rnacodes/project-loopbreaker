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
        public DbSet<Podcast> Podcasts { get; set; }
        public DbSet<Book> Books { get; set; }
        public DbSet<Topic> Topics { get; set; }
        public DbSet<Genre> Genres { get; set; }

        // IApplicationDbContext interface implementations
        IQueryable<BaseMediaItem> IApplicationDbContext.MediaItems => MediaItems;
        IQueryable<Mixlist> IApplicationDbContext.Mixlists => Mixlists;
        IQueryable<Podcast> IApplicationDbContext.Podcasts => Podcasts;
        IQueryable<Book> IApplicationDbContext.Books => Books;
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
                    
                entity.Property(e => e.Genre)
                    .HasMaxLength(200);
                    
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
            modelBuilder.Entity<Podcast>().ToTable("Podcasts");
            modelBuilder.Entity<Book>().ToTable("Books");
            // TODO: Add configurations for other media types as they're implemented:
            // modelBuilder.Entity<Movie>().ToTable("Movies");
            // modelBuilder.Entity<Article>().ToTable("Articles");
            // etc.

            // Configure Podcast specific properties
            modelBuilder.Entity<Podcast>(entity =>
            {
                entity.Property(e => e.AudioLink)
                    .HasMaxLength(2000);
                    
                entity.Property(e => e.DurationInSeconds)
                    .HasDefaultValue(0);
                    
                entity.Property(e => e.PodcastType)
                    .HasConversion<string>()
                    .HasMaxLength(50)
                    .IsRequired();
                    
                entity.Property(e => e.ExternalId)
                    .HasMaxLength(200);
                    
                entity.Property(e => e.Publisher)
                    .HasMaxLength(500);
                    
                // Configure self-referencing relationship for Series->Episodes
                entity.HasOne(e => e.ParentPodcast)
                    .WithMany(s => s.Episodes)
                    .HasForeignKey(e => e.ParentPodcastId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete to avoid orphaned episodes
                    
                // Create index on PodcastType for better query performance
                entity.HasIndex(e => e.PodcastType);
                
                // Create index on ParentPodcastId for better query performance
                entity.HasIndex(e => e.ParentPodcastId);
                
                // Create index on ExternalId for API imports
                entity.HasIndex(e => e.ExternalId);
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
        }

        // IApplicationDbContext interface method implementations
        public void Add<TEntity>(TEntity entity) where TEntity : class
        {
            base.Add(entity);
        }

        public void Update<TEntity>(TEntity entity) where TEntity : class
        {
            base.Update(entity);
        }

        public void Remove<TEntity>(TEntity entity) where TEntity : class
        {
            base.Remove(entity);
        }

        public async Task<TEntity?> FindAsync<TEntity>(params object[] keyValues) where TEntity : class
        {
            return await base.FindAsync<TEntity>(keyValues);
        }

        public object Entry<TEntity>(TEntity entity) where TEntity : class
        {
            return base.Entry(entity);
        }
    }
}
