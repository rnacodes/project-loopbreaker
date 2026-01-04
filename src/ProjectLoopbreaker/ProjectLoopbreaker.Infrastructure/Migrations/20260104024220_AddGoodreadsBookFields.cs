using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGoodreadsBookFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Articles_InstapaperBookmarkId",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "InstapaperBookmarkId",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "InstapaperHash",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "SavedToInstapaperDate",
                table: "Articles");

            migrationBuilder.AddColumn<decimal>(
                name: "AverageRating",
                table: "Books",
                type: "numeric",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateRead",
                table: "Books",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "GoodreadsTags",
                table: "Books",
                type: "jsonb",
                nullable: false,
                defaultValue: new List<string>());

            migrationBuilder.AddColumn<string>(
                name: "MyReview",
                table: "Books",
                type: "character varying(10000)",
                maxLength: 10000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "OriginalPublicationYear",
                table: "Books",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Publisher",
                table: "Books",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "YearPublished",
                table: "Books",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Books_DateRead",
                table: "Books",
                column: "DateRead");

            migrationBuilder.CreateIndex(
                name: "IX_Books_OriginalPublicationYear",
                table: "Books",
                column: "OriginalPublicationYear");

            migrationBuilder.CreateIndex(
                name: "IX_Books_YearPublished",
                table: "Books",
                column: "YearPublished");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Books_DateRead",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_OriginalPublicationYear",
                table: "Books");

            migrationBuilder.DropIndex(
                name: "IX_Books_YearPublished",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "AverageRating",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "DateRead",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "GoodreadsTags",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "MyReview",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "OriginalPublicationYear",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "Publisher",
                table: "Books");

            migrationBuilder.DropColumn(
                name: "YearPublished",
                table: "Books");

            migrationBuilder.AddColumn<string>(
                name: "InstapaperBookmarkId",
                table: "Articles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstapaperHash",
                table: "Articles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SavedToInstapaperDate",
                table: "Articles",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Articles_InstapaperBookmarkId",
                table: "Articles",
                column: "InstapaperBookmarkId");
        }
    }
}
