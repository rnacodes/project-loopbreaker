using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddReadwiseIntegration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastReadwiseSync",
                table: "Books",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ReadwiseBookId",
                table: "Books",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastReaderSync",
                table: "Articles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReaderLocation",
                table: "Articles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ReadwiseDocumentId",
                table: "Articles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Highlights",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ReadwiseId = table.Column<int>(type: "integer", nullable: false),
                    Text = table.Column<string>(type: "character varying(8191)", maxLength: 8191, nullable: false),
                    Note = table.Column<string>(type: "character varying(8191)", maxLength: 8191, nullable: true),
                    Title = table.Column<string>(type: "character varying(511)", maxLength: 511, nullable: true),
                    Author = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true),
                    Category = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    SourceUrl = table.Column<string>(type: "character varying(2047)", maxLength: 2047, nullable: true),
                    ImageUrl = table.Column<string>(type: "character varying(2047)", maxLength: 2047, nullable: true),
                    HighlightUrl = table.Column<string>(type: "character varying(4095)", maxLength: 4095, nullable: true),
                    Location = table.Column<int>(type: "integer", nullable: true),
                    LocationType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    HighlightedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Tags = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    ArticleId = table.Column<Guid>(type: "uuid", nullable: true),
                    BookId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReadwiseBookId = table.Column<int>(type: "integer", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SourceType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    IsFavorite = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    Color = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Highlights", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Highlights_Articles_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Articles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Highlights_Books_BookId",
                        column: x => x.BookId,
                        principalTable: "Books",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Articles_ReaderLocation",
                table: "Articles",
                column: "ReaderLocation");

            migrationBuilder.CreateIndex(
                name: "IX_Articles_ReadwiseDocumentId",
                table: "Articles",
                column: "ReadwiseDocumentId");

            migrationBuilder.CreateIndex(
                name: "IX_Highlights_ArticleId",
                table: "Highlights",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_Highlights_BookId",
                table: "Highlights",
                column: "BookId");

            migrationBuilder.CreateIndex(
                name: "IX_Highlights_Category",
                table: "Highlights",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Highlights_HighlightedAt",
                table: "Highlights",
                column: "HighlightedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Highlights_IsFavorite",
                table: "Highlights",
                column: "IsFavorite");

            migrationBuilder.CreateIndex(
                name: "IX_Highlights_ReadwiseBookId",
                table: "Highlights",
                column: "ReadwiseBookId");

            migrationBuilder.CreateIndex(
                name: "IX_Highlights_ReadwiseId",
                table: "Highlights",
                column: "ReadwiseId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Highlights");

            migrationBuilder.DropIndex(
                name: "IX_Articles_ReaderLocation",
                table: "Articles");

            migrationBuilder.DropIndex(
                name: "IX_Articles_ReadwiseDocumentId",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "LastReadwiseSync",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "ReadwiseBookId",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "LastReaderSync",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "ReaderLocation",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "ReadwiseDocumentId",
                table: "Articles");
        }
    }
}
