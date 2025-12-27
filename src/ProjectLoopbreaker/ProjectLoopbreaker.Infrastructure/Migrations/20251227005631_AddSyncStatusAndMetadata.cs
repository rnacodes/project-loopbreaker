using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSyncStatusAndMetadata : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add new columns
            migrationBuilder.AddColumn<string>(
                name: "Metadata",
                table: "Highlights",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SavedToInstapaperDate",
                table: "Articles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SyncStatus",
                table: "Articles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            // Create GIN index for JSONB metadata column (faster queries)
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_Highlights_Metadata"" 
                ON ""Highlights"" USING gin (""Metadata"");
            ");

            // Set initial SyncStatus values based on existing data
            // LocalOnly = 0, InstapaperSynced = 1, ReaderSynced = 4
            migrationBuilder.Sql(@"
                UPDATE ""Articles""
                SET ""SyncStatus"" = 
                    CASE 
                        WHEN ""InstapaperBookmarkId"" IS NOT NULL AND ""ReadwiseDocumentId"" IS NOT NULL THEN 5
                        WHEN ""ReadwiseDocumentId"" IS NOT NULL THEN 4
                        WHEN ""InstapaperBookmarkId"" IS NOT NULL THEN 1
                        ELSE 0
                    END;
            ");

            // Create URL normalization function
            migrationBuilder.Sql(@"
                CREATE OR REPLACE FUNCTION normalize_article_url(url TEXT) 
                RETURNS TEXT AS $$
                BEGIN
                    IF url IS NULL THEN
                        RETURN NULL;
                    END IF;
                    -- Remove trailing slashes and convert to lowercase
                    RETURN LOWER(TRIM(TRAILING '/' FROM url));
                END;
                $$ LANGUAGE plpgsql IMMUTABLE;
            ");

            // Create index on normalized URLs for faster lookups during deduplication
            // Using a partial index to exclude null URLs
            // Note: Link column is in MediaItems table (parent table in TPT inheritance)
            // We use MediaType = 'Article' to filter for articles
            // This is a non-unique index since deduplication is handled at the application level
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS ""IX_MediaItems_Link_Normalized_Articles"" 
                ON ""MediaItems"" (normalize_article_url(""Link""))
                WHERE ""Link"" IS NOT NULL 
                AND ""MediaType"" = 'Article';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop index and function
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_MediaItems_Link_Normalized_Articles"";");
            migrationBuilder.Sql(@"DROP FUNCTION IF EXISTS normalize_article_url(TEXT);");
            
            // Drop GIN index
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS ""IX_Highlights_Metadata"";");

            // Drop columns
            migrationBuilder.DropColumn(
                name: "Metadata",
                table: "Highlights");

            migrationBuilder.DropColumn(
                name: "SavedToInstapaperDate",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "SyncStatus",
                table: "Articles");
        }
    }
}
