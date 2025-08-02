using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using System.Collections.Generic;

namespace ProjectLoopbreaker.Infrastructure.Data

{
    public class MediaLibraryDbContext : DbContext
    {
        public DbSet<BaseMediaItem> MediaItems { get; set; }
        public DbSet<Playlist> Playlists { get; set; }
        public DbSet<PodcastSeries> PodcastSeries { get; set; }
        public DbSet<PodcastEpisode> PodcastEpisodes { get; set; }


        public MediaLibraryDbContext(DbContextOptions<MediaLibraryDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure many-to-many relationship between BaseMediaItem and Playlist
            modelBuilder.Entity<BaseMediaItem>()
                .HasMany(m => m.Playlists)
                .WithMany(p => p.MediaItems)
                .UsingEntity(j => j.ToTable("MediaItemPlaylists"));

            // Configure Table-Per-Type (TPT) inheritance
            modelBuilder.Entity<BaseMediaItem>().ToTable("MediaItems");
            modelBuilder.Entity<PodcastSeries>().ToTable("PodcastSeries");
            modelBuilder.Entity<PodcastEpisode>().ToTable("PodcastEpisodes");

            // When you add other media types, configure them here
            // modelBuilder.Entity<Book>().ToTable("Books");
            // modelBuilder.Entity<Movie>().ToTable("Movies");

            // Configure one-to-many relationship between PodcastSeries and PodcastEpisode
            modelBuilder.Entity<PodcastEpisode>()
                .HasOne(e => e.PodcastSeries)
                .WithMany() // You might want to add a Episodes navigation property to PodcastSeries
                .HasForeignKey(e => e.PodcastSeriesId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete
        }


    }
}
