using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAIEmbeddingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AiDescription",
                table: "Notes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "AiDescriptionGeneratedAt",
                table: "Notes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<float[]>(
                name: "Embedding",
                table: "Notes",
                type: "real[]",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmbeddingGeneratedAt",
                table: "Notes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmbeddingModel",
                table: "Notes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsDescriptionManual",
                table: "Notes",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<float[]>(
                name: "Embedding",
                table: "MediaItems",
                type: "real[]",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EmbeddingGeneratedAt",
                table: "MediaItems",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmbeddingModel",
                table: "MediaItems",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Notes_IsDescriptionManual",
                table: "Notes",
                column: "IsDescriptionManual");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Notes_IsDescriptionManual",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "AiDescription",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "AiDescriptionGeneratedAt",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "Embedding",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "EmbeddingGeneratedAt",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "EmbeddingModel",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "IsDescriptionManual",
                table: "Notes");

            migrationBuilder.DropColumn(
                name: "Embedding",
                table: "MediaItems");

            migrationBuilder.DropColumn(
                name: "EmbeddingGeneratedAt",
                table: "MediaItems");

            migrationBuilder.DropColumn(
                name: "EmbeddingModel",
                table: "MediaItems");
        }
    }
}
