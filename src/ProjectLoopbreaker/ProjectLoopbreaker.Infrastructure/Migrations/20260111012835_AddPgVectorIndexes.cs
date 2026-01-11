using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPgVectorIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Create IVFFlat index on MediaItems.Embedding for fast cosine similarity searches
            // The 'lists' parameter should be approximately sqrt(number_of_rows)
            // Starting with 100 lists, which is good for up to ~10,000 items
            // Adjust as dataset grows
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
            // Drop the indexes
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_media_items_embedding;");
            migrationBuilder.Sql(@"DROP INDEX IF EXISTS idx_notes_embedding;");
        }
    }
}
