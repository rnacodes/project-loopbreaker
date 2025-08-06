using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Application.Interfaces;
using System.Collections.Generic;

namespace ProjectLoopbreaker.Infrastructure.Data

{
    public class MediaLibraryDbContext : DbContext, IApplicationDbContext
    {
        public DbSet<BaseMediaItem> MediaItems { get; set; }
        public DbSet<Playlist> Playlists { get; set; }
        public DbSet<PodcastSeries> PodcastSeries { get; set; }
        public DbSet<PodcastEpisode> PodcastEpisodes { get; set; }


        public MediaLibraryDbContext(DbContextOptions<MediaLibraryDbContext> options) : base(options) { }


        /// <summary>
        /// Completely resets table schema without dropping tables.
        /// Use with extreme caution - all data will be lost!
        /// </summary>
        public async Task ResetTableSchemaAsync()
        {
            // Disable foreign key constraints
            await Database.ExecuteSqlRawAsync("SET session_replication_role = 'replica';");

            try
            {
                // Clear all tables
                await Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"PodcastEpisodes\" CASCADE;");
                await Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"PodcastSeries\" CASCADE;");
                await Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"MediaItemPlaylists\" CASCADE;");
                await Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"Playlists\" CASCADE;");
                await Database.ExecuteSqlRawAsync("TRUNCATE TABLE \"MediaItems\" CASCADE;");

                // Drop columns and recreate them - this effectively overwrites the schema
                // For MediaItems
                await Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""MediaItems"" 
                    DROP COLUMN IF EXISTS ""Title"", 
                    DROP COLUMN IF EXISTS ""MediaType"",
                    DROP COLUMN IF EXISTS ""Link"",
                    DROP COLUMN IF EXISTS ""Notes"",
                    DROP COLUMN IF EXISTS ""DateAdded"",
                    DROP COLUMN IF EXISTS ""Consumed"",
                    DROP COLUMN IF EXISTS ""DateConsumed"",
                    DROP COLUMN IF EXISTS ""Rating"",
                    DROP COLUMN IF EXISTS ""Description"",
                    DROP COLUMN IF EXISTS ""RelatedNotes"",
                    DROP COLUMN IF EXISTS ""Thumbnail"";

                    ALTER TABLE ""MediaItems""
                    ADD COLUMN ""Title"" text NOT NULL,
                    ADD COLUMN ""MediaType"" integer NOT NULL,
                    ADD COLUMN ""Link"" text,
                    ADD COLUMN ""Notes"" text,
                    ADD COLUMN ""DateAdded"" timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    ADD COLUMN ""Consumed"" boolean NOT NULL DEFAULT false,
                    ADD COLUMN ""DateConsumed"" timestamp with time zone,
                    ADD COLUMN ""Rating"" integer,
                    ADD COLUMN ""Description"" text,
                    ADD COLUMN ""RelatedNotes"" text,
                    ADD COLUMN ""Thumbnail"" text;
                ");

                // Similarly for other tables
                // For Playlists
                await Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""Playlists"" 
                    DROP COLUMN IF EXISTS ""Name"",
                    DROP COLUMN IF EXISTS ""Thumbnail"";
                    
                    ALTER TABLE ""Playlists""
                    ADD COLUMN ""Name"" text NOT NULL,
                    ADD COLUMN ""Thumbnail"" text NOT NULL;
                ");

                // For PodcastEpisodes
                await Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""PodcastEpisodes"" 
                    DROP COLUMN IF EXISTS ""PodcastSeriesId"",
                    DROP COLUMN IF EXISTS ""AudioLink"",
                    DROP COLUMN IF EXISTS ""ReleaseDate"",
                    DROP COLUMN IF EXISTS ""DurationInSeconds"";
                    
                    ALTER TABLE ""PodcastEpisodes""
                    ADD COLUMN ""PodcastSeriesId"" uuid NOT NULL,
                    ADD COLUMN ""AudioLink"" text,
                    ADD COLUMN ""ReleaseDate"" timestamp with time zone,
                    ADD COLUMN ""DurationInSeconds"" integer NOT NULL DEFAULT 0;
                ");

                // Recreate foreign key constraints
                await Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE ""PodcastEpisodes"" 
                    ADD CONSTRAINT ""FK_PodcastEpisodes_PodcastSeries_PodcastSeriesId""
                    FOREIGN KEY (""PodcastSeriesId"") REFERENCES ""PodcastSeries""(""Id"") ON DELETE RESTRICT;
                ");
            }
            finally
            {
                // Re-enable foreign key constraints
                await Database.ExecuteSqlRawAsync("SET session_replication_role = 'origin';");
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure enum conversions
            modelBuilder.Entity<BaseMediaItem>()
                .Property(b => b.Rating)
                .HasConversion<int>();

            modelBuilder.Entity<BaseMediaItem>()
                .Property(b => b.MediaType)
                .HasConversion<int>();


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
                .WithMany(s => s.Episodes) // Reference the Episodes collection in PodcastSeries
                .HasForeignKey(e => e.PodcastSeriesId)
                .OnDelete(DeleteBehavior.Restrict); // Prevent cascade delete

        }


    }
}
