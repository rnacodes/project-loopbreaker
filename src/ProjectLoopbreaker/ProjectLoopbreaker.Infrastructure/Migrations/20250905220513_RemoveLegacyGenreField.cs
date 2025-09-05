using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveLegacyGenreField : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Genre",
                table: "MediaItems");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Genre",
                table: "MediaItems",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
