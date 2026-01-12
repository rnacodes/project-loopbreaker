using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class ConvertToPgVectorType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Enable pgvector extension (must be done by superuser or have CREATE privilege)
            migrationBuilder.Sql(@"CREATE EXTENSION IF NOT EXISTS vector;");

            // Convert MediaItems.Embedding from real[] to vector(1024)
            // This preserves existing data while changing the type
            migrationBuilder.Sql(@"
                ALTER TABLE ""MediaItems""
                ALTER COLUMN ""Embedding"" TYPE vector(1024)
                USING ""Embedding""::vector(1024);
            ");

            // Convert Notes.Embedding from real[] to vector(1024)
            migrationBuilder.Sql(@"
                ALTER TABLE ""Notes""
                ALTER COLUMN ""Embedding"" TYPE vector(1024)
                USING ""Embedding""::vector(1024);
            ");

            // Create IVFFlat index on MediaItems.Embedding for fast cosine similarity searches
            // The 'lists' parameter should be approximately sqrt(number_of_rows)
            // Starting with 100 lists, good for up to ~10,000 items
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS idx_media_items_embedding
                ON ""MediaItems"" USING ivfflat (""Embedding"" vector_cosine_ops)
                WITH (lists = 100);
            ");

            // Create IVFFlat index on Notes.Embedding for fast cosine similarity searches
            migrationBuilder.Sql(@"
                CREATE INDEX IF NOT EXISTS idx_notes_embedding
                ON ""Notes"" USING ivfflat (""Embedding"" vector_cosine_ops)
                WITH (lists = 100);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop the indexes first
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_media_items_embedding;");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_notes_embedding;");

            // Convert back to real[] type
            migrationBuilder.Sql(@"
                ALTER TABLE ""MediaItems""
                ALTER COLUMN ""Embedding"" TYPE real[]
                USING ""Embedding""::real[];
            ");

            migrationBuilder.Sql(@"
                ALTER TABLE ""Notes""
                ALTER COLUMN ""Embedding"" TYPE real[]
                USING ""Embedding""::real[];
            ");

            // Note: We don't drop the pgvector extension as it might be used elsewhere
        }
    }
}
