using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddBookEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Books",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Author = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false),
                    ISBN = table.Column<string>(type: "character varying(17)", maxLength: 17, nullable: true),
                    ASIN = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Format = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    PartOfSeries = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Books", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Books_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Books_ASIN",
                table: "Books",
                column: "ASIN");

            migrationBuilder.CreateIndex(
                name: "IX_Books_Author",
                table: "Books",
                column: "Author");

            migrationBuilder.CreateIndex(
                name: "IX_Books_ISBN",
                table: "Books",
                column: "ISBN");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Books");
        }
    }
}
