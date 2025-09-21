using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVideoEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Videos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VideoType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParentVideoId = table.Column<Guid>(type: "uuid", nullable: true),
                    Platform = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ChannelName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    LengthInSeconds = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExternalId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Videos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Videos_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Videos_Videos_ParentVideoId",
                        column: x => x.ParentVideoId,
                        principalTable: "Videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Videos_ChannelName",
                table: "Videos",
                column: "ChannelName");

            migrationBuilder.CreateIndex(
                name: "IX_Videos_ExternalId",
                table: "Videos",
                column: "ExternalId");

            migrationBuilder.CreateIndex(
                name: "IX_Videos_ParentVideoId",
                table: "Videos",
                column: "ParentVideoId");

            migrationBuilder.CreateIndex(
                name: "IX_Videos_Platform",
                table: "Videos",
                column: "Platform");

            migrationBuilder.CreateIndex(
                name: "IX_Videos_VideoType",
                table: "Videos",
                column: "VideoType");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Videos");
        }
    }
}
