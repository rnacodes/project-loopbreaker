using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGenreAndTopicsToMediaItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Genre",
                table: "MediaItems",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Topics",
                table: "MediaItems",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Genre",
                table: "MediaItems");

            migrationBuilder.DropColumn(
                name: "Topics",
                table: "MediaItems");
        }
    }
    public class CreateMediaItemDto
    {
        public string Title { get; set; }
        public string MediaType { get; set; }
        public string? Link { get; set; }
        public string? Notes { get; set; }
        public bool Consumed { get; set; }
        public string? Rating { get; set; }
        public string? RelatedNotes { get; set; }
        public string? Thumbnail { get; set; }
        public string? Description { get; set; }
        public string? Genre { get; set; }
        public string? Topics { get; set; }
    }
}
