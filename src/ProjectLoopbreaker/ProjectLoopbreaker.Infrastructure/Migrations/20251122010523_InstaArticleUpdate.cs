using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InstaArticleUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstimatedReadingTimeMinutes",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "FullTextContent",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "OriginalUrl",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "ProgressTimestamp",
                table: "Articles");

            migrationBuilder.RenameColumn(
                name: "SavedToInstapaperDate",
                table: "Articles",
                newName: "LastSyncDate");

            migrationBuilder.AlterColumn<int>(
                name: "WordCount",
                table: "Articles",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer",
                oldDefaultValue: 0);

            migrationBuilder.AlterColumn<int>(
                name: "ReadingProgress",
                table: "Articles",
                type: "integer",
                nullable: true,
                oldClrType: typeof(double),
                oldType: "double precision",
                oldDefaultValue: 0.0);

            migrationBuilder.AlterColumn<string>(
                name: "InstapaperBookmarkId",
                table: "Articles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldMaxLength: 50,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Author",
                table: "Articles",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(300)",
                oldMaxLength: 300,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContentStoragePath",
                table: "Articles",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InstapaperHash",
                table: "Articles",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ContentStoragePath",
                table: "Articles");

            migrationBuilder.DropColumn(
                name: "InstapaperHash",
                table: "Articles");

            migrationBuilder.RenameColumn(
                name: "LastSyncDate",
                table: "Articles",
                newName: "SavedToInstapaperDate");

            migrationBuilder.AlterColumn<int>(
                name: "WordCount",
                table: "Articles",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<double>(
                name: "ReadingProgress",
                table: "Articles",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "InstapaperBookmarkId",
                table: "Articles",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Author",
                table: "Articles",
                type: "character varying(300)",
                maxLength: 300,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(200)",
                oldMaxLength: 200,
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "EstimatedReadingTimeMinutes",
                table: "Articles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "FullTextContent",
                table: "Articles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OriginalUrl",
                table: "Articles",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ProgressTimestamp",
                table: "Articles",
                type: "timestamp with time zone",
                nullable: true);
        }
    }
}
