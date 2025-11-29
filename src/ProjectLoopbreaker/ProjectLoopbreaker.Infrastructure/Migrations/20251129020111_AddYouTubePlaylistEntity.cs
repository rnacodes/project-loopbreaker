using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddYouTubePlaylistEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "YouTubePlaylists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PlaylistExternalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ChannelExternalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    LinkedYouTubeChannelId = table.Column<Guid>(type: "uuid", nullable: true),
                    VideoCount = table.Column<int>(type: "integer", nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PrivacyStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_YouTubePlaylists", x => x.Id);
                    table.ForeignKey(
                        name: "FK_YouTubePlaylists_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_YouTubePlaylists_YouTubeChannels_LinkedYouTubeChannelId",
                        column: x => x.LinkedYouTubeChannelId,
                        principalTable: "YouTubeChannels",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "YouTubePlaylistVideo",
                columns: table => new
                {
                    YouTubePlaylistId = table.Column<Guid>(type: "uuid", nullable: false),
                    VideoId = table.Column<Guid>(type: "uuid", nullable: false),
                    Position = table.Column<int>(type: "integer", nullable: true),
                    AddedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VideoPublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_YouTubePlaylistVideo", x => new { x.YouTubePlaylistId, x.VideoId });
                    table.ForeignKey(
                        name: "FK_YouTubePlaylistVideo_Videos_VideoId",
                        column: x => x.VideoId,
                        principalTable: "Videos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_YouTubePlaylistVideo_YouTubePlaylists_YouTubePlaylistId",
                        column: x => x.YouTubePlaylistId,
                        principalTable: "YouTubePlaylists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_YouTubePlaylists_LastSyncedAt",
                table: "YouTubePlaylists",
                column: "LastSyncedAt");

            migrationBuilder.CreateIndex(
                name: "IX_YouTubePlaylists_LinkedYouTubeChannelId",
                table: "YouTubePlaylists",
                column: "LinkedYouTubeChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_YouTubePlaylists_PlaylistExternalId",
                table: "YouTubePlaylists",
                column: "PlaylistExternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_YouTubePlaylists_PublishedAt",
                table: "YouTubePlaylists",
                column: "PublishedAt");

            migrationBuilder.CreateIndex(
                name: "IX_YouTubePlaylistVideo_AddedAt",
                table: "YouTubePlaylistVideo",
                column: "AddedAt");

            migrationBuilder.CreateIndex(
                name: "IX_YouTubePlaylistVideo_Position",
                table: "YouTubePlaylistVideo",
                column: "Position");

            migrationBuilder.CreateIndex(
                name: "IX_YouTubePlaylistVideo_VideoId",
                table: "YouTubePlaylistVideo",
                column: "VideoId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "YouTubePlaylistVideo");

            migrationBuilder.DropTable(
                name: "YouTubePlaylists");
        }
    }
}
