using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Application.Interfaces;
using System.Collections.Generic;

namespace ProjectLoopbreaker.Infrastructure.Data

{
    public class MediaLibraryDbContext : DbContext, IApplicationDbContext
    {
        public DbSet<BaseMediaItem> MediaItems { get; set; }
        public DbSet<Mixlist> Mixlists { get; set; }
        public DbSet<PodcastSeries> PodcastSeries { get; set; }
        public DbSet<PodcastEpisode> PodcastEpisodes { get; set; }
        public DbSet<Topic> Topics { get; set; }
        public DbSet<Genre> Genres { get; set; }


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
            modelBuilder.Entity<PodcastSeries>().ToTable("PodcastSeries");
            modelBuilder.Entity<PodcastEpisode>().ToTable("PodcastEpisodes");
            // TODO: Add configurations for other media types as they're implemented:
            // modelBuilder.Entity<Book>().ToTable("Books");
            // modelBuilder.Entity<Movie>().ToTable("Movies");
            // modelBuilder.Entity<Article>().ToTable("Articles");
            // etc.

            // Configure PodcastEpisode specific properties
            modelBuilder.Entity<PodcastEpisode>(entity =>
            {
                entity.Property(e => e.AudioLink)
                    .HasMaxLength(2000);
                    
                entity.Property(e => e.DurationInSeconds)
                    .HasDefaultValue(0);
                    
                // Configure one-to-many relationship between PodcastSeries and PodcastEpisode
                entity.HasOne(e => e.PodcastSeries)
                    .WithMany(s => s.Episodes)
                    .HasForeignKey(e => e.PodcastSeriesId)
                    .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete to avoid orphaned episodes
            });
        }


    }
}
