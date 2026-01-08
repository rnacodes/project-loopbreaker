using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddObsidianNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Notes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Slug = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Content = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    VaultName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    SourceUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Tags = table.Column<List<string>>(type: "jsonb", nullable: false),
                    NoteDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DateImported = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ContentHash = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MediaItemNotes",
                columns: table => new
                {
                    MediaItemId = table.Column<Guid>(type: "uuid", nullable: false),
                    NoteId = table.Column<Guid>(type: "uuid", nullable: false),
                    LinkedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LinkDescription = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaItemNotes", x => new { x.MediaItemId, x.NoteId });
                    table.ForeignKey(
                        name: "FK_MediaItemNotes_MediaItems_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MediaItemNotes_Notes_NoteId",
                        column: x => x.NoteId,
                        principalTable: "Notes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MediaItemNotes_LinkedAt",
                table: "MediaItemNotes",
                column: "LinkedAt");

            migrationBuilder.CreateIndex(
                name: "IX_MediaItemNotes_NoteId",
                table: "MediaItemNotes",
                column: "NoteId");

            migrationBuilder.CreateIndex(
                name: "IX_Notes_DateImported",
                table: "Notes",
                column: "DateImported");

            migrationBuilder.CreateIndex(
                name: "IX_Notes_LastSyncedAt",
                table: "Notes",
                column: "LastSyncedAt");

            migrationBuilder.CreateIndex(
                name: "IX_Notes_VaultName",
                table: "Notes",
                column: "VaultName");

            migrationBuilder.CreateIndex(
                name: "IX_Notes_VaultName_Slug",
                table: "Notes",
                columns: new[] { "VaultName", "Slug" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MediaItemNotes");

            migrationBuilder.DropTable(
                name: "Notes");
        }
    }
}
