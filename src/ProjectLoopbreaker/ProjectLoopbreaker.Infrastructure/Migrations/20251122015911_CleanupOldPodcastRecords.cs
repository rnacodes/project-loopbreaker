using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class CleanupOldPodcastRecords : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Clean up orphaned MediaItems that don't have corresponding entries in any child table
            // This happens when the Podcasts table was removed but MediaItems records remained
            
            // We're using Table-Per-Type (TPT) inheritance, so we need to find MediaItems
            // that don't have a corresponding record in any of the child tables
            
            migrationBuilder.Sql(@"
                -- Delete from join tables for orphaned media items
                -- Find IDs that exist in MediaItems but not in any child table
                DELETE FROM ""MediaItemTopics"" 
                WHERE ""MediaItemId"" IN (
                    SELECT m.""Id"" 
                    FROM ""MediaItems"" m
                    LEFT JOIN ""Books"" b ON m.""Id"" = b.""Id""
                    LEFT JOIN ""Movies"" mov ON m.""Id"" = mov.""Id""
                    LEFT JOIN ""TvShows"" tv ON m.""Id"" = tv.""Id""
                    LEFT JOIN ""Videos"" v ON m.""Id"" = v.""Id""
                    LEFT JOIN ""Articles"" a ON m.""Id"" = a.""Id""
                    LEFT JOIN ""PodcastSeries"" ps ON m.""Id"" = ps.""Id""
                    LEFT JOIN ""PodcastEpisodes"" pe ON m.""Id"" = pe.""Id""
                    WHERE b.""Id"" IS NULL 
                      AND mov.""Id"" IS NULL 
                      AND tv.""Id"" IS NULL 
                      AND v.""Id"" IS NULL 
                      AND a.""Id"" IS NULL
                      AND ps.""Id"" IS NULL
                      AND pe.""Id"" IS NULL
                );
            ");
            
            migrationBuilder.Sql(@"
                DELETE FROM ""MediaItemGenres"" 
                WHERE ""MediaItemId"" IN (
                    SELECT m.""Id"" 
                    FROM ""MediaItems"" m
                    LEFT JOIN ""Books"" b ON m.""Id"" = b.""Id""
                    LEFT JOIN ""Movies"" mov ON m.""Id"" = mov.""Id""
                    LEFT JOIN ""TvShows"" tv ON m.""Id"" = tv.""Id""
                    LEFT JOIN ""Videos"" v ON m.""Id"" = v.""Id""
                    LEFT JOIN ""Articles"" a ON m.""Id"" = a.""Id""
                    LEFT JOIN ""PodcastSeries"" ps ON m.""Id"" = ps.""Id""
                    LEFT JOIN ""PodcastEpisodes"" pe ON m.""Id"" = pe.""Id""
                    WHERE b.""Id"" IS NULL 
                      AND mov.""Id"" IS NULL 
                      AND tv.""Id"" IS NULL 
                      AND v.""Id"" IS NULL 
                      AND a.""Id"" IS NULL
                      AND ps.""Id"" IS NULL
                      AND pe.""Id"" IS NULL
                );
            ");
            
            migrationBuilder.Sql(@"
                DELETE FROM ""MixlistMediaItems"" 
                WHERE ""MediaItemId"" IN (
                    SELECT m.""Id"" 
                    FROM ""MediaItems"" m
                    LEFT JOIN ""Books"" b ON m.""Id"" = b.""Id""
                    LEFT JOIN ""Movies"" mov ON m.""Id"" = mov.""Id""
                    LEFT JOIN ""TvShows"" tv ON m.""Id"" = tv.""Id""
                    LEFT JOIN ""Videos"" v ON m.""Id"" = v.""Id""
                    LEFT JOIN ""Articles"" a ON m.""Id"" = a.""Id""
                    LEFT JOIN ""PodcastSeries"" ps ON m.""Id"" = ps.""Id""
                    LEFT JOIN ""PodcastEpisodes"" pe ON m.""Id"" = pe.""Id""
                    WHERE b.""Id"" IS NULL 
                      AND mov.""Id"" IS NULL 
                      AND tv.""Id"" IS NULL 
                      AND v.""Id"" IS NULL 
                      AND a.""Id"" IS NULL
                      AND ps.""Id"" IS NULL
                      AND pe.""Id"" IS NULL
                );
            ");
            
            // Finally, delete orphaned MediaItems records
            migrationBuilder.Sql(@"
                DELETE FROM ""MediaItems"" 
                WHERE ""Id"" IN (
                    SELECT m.""Id"" 
                    FROM ""MediaItems"" m
                    LEFT JOIN ""Books"" b ON m.""Id"" = b.""Id""
                    LEFT JOIN ""Movies"" mov ON m.""Id"" = mov.""Id""
                    LEFT JOIN ""TvShows"" tv ON m.""Id"" = tv.""Id""
                    LEFT JOIN ""Videos"" v ON m.""Id"" = v.""Id""
                    LEFT JOIN ""Articles"" a ON m.""Id"" = a.""Id""
                    LEFT JOIN ""PodcastSeries"" ps ON m.""Id"" = ps.""Id""
                    LEFT JOIN ""PodcastEpisodes"" pe ON m.""Id"" = pe.""Id""
                    WHERE b.""Id"" IS NULL 
                      AND mov.""Id"" IS NULL 
                      AND tv.""Id"" IS NULL 
                      AND v.""Id"" IS NULL 
                      AND a.""Id"" IS NULL
                      AND ps.""Id"" IS NULL
                      AND pe.""Id"" IS NULL
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback needed - this is a data cleanup migration
            // Old podcast data cannot be restored
        }
    }
}
