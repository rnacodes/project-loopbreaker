using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddArticleEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Articles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    InstapaperBookmarkId = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OriginalUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Author = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    Publication = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    PublicationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SavedToInstapaperDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ReadingProgress = table.Column<double>(type: "double precision", nullable: false, defaultValue: 0.0),
                    ProgressTimestamp = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EstimatedReadingTimeMinutes = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    WordCount = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    IsStarred = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    FullTextContent = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Articles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Articles_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Author",
                table: "Articles",
                column: "Author");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_InstapaperBookmarkId",
                table: "Articles",
                column: "InstapaperBookmarkId");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_IsArchived",
                table: "Articles",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_IsStarred",
                table: "Articles",
                column: "IsStarred");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_Publication",
                table: "Articles",
                column: "Publication");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_PublicationDate",
                table: "Articles",
                column: "PublicationDate");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Articles");
        }
    }
}
