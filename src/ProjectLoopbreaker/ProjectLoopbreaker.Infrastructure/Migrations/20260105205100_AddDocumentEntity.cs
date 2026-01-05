using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Documents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PaperlessId = table.Column<int>(type: "integer", nullable: true),
                    OriginalFileName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ArchiveSerialNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    DocumentType = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Correspondent = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    OcrContent = table.Column<string>(type: "text", nullable: true),
                    DocumentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PageCount = table.Column<int>(type: "integer", nullable: true),
                    FileType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    FileSizeBytes = table.Column<long>(type: "bigint", nullable: true),
                    PaperlessTagsCsv = table.Column<string>(type: "text", nullable: true),
                    CustomFieldsJson = table.Column<string>(type: "text", nullable: true),
                    LastPaperlessSync = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaperlessUrl = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    IsArchived = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Documents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Documents_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Documents_Correspondent",
                table: "Documents",
                column: "Correspondent");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_DocumentDate",
                table: "Documents",
                column: "DocumentDate");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_DocumentType",
                table: "Documents",
                column: "DocumentType");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_FileType",
                table: "Documents",
                column: "FileType");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_IsArchived",
                table: "Documents",
                column: "IsArchived");

            migrationBuilder.CreateIndex(
                name: "IX_Documents_PaperlessId",
                table: "Documents",
                column: "PaperlessId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Documents");
        }
    }
}
