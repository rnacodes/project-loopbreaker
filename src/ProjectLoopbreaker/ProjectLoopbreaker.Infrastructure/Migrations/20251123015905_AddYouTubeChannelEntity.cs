using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddYouTubeChannelEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Videos_ChannelName",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "ChannelName",
                table: "Videos");

            migrationBuilder.AddColumn<Guid>(
                name: "ChannelId",
                table: "Videos",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "YouTubeChannels",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChannelExternalId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CustomUrl = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    SubscriberCount = table.Column<long>(type: "bigint", nullable: true),
                    VideoCount = table.Column<long>(type: "bigint", nullable: true),
                    ViewCount = table.Column<long>(type: "bigint", nullable: true),
                    UploadsPlaylistId = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Country = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    PublishedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    LastSyncedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_YouTubeChannels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_YouTubeChannels_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Videos_ChannelId",
                table: "Videos",
                column: "ChannelId");

            migrationBuilder.CreateIndex(
                name: "IX_YouTubeChannels_ChannelExternalId",
                table: "YouTubeChannels",
                column: "ChannelExternalId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_YouTubeChannels_LastSyncedAt",
                table: "YouTubeChannels",
                column: "LastSyncedAt");

            migrationBuilder.CreateIndex(
                name: "IX_YouTubeChannels_PublishedAt",
                table: "YouTubeChannels",
                column: "PublishedAt");

            migrationBuilder.CreateIndex(
                name: "IX_YouTubeChannels_SubscriberCount",
                table: "YouTubeChannels",
                column: "SubscriberCount");

            migrationBuilder.AddForeignKey(
                name: "FK_Videos_YouTubeChannels_ChannelId",
                table: "Videos",
                column: "ChannelId",
                principalTable: "YouTubeChannels",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Videos_YouTubeChannels_ChannelId",
                table: "Videos");

            migrationBuilder.DropTable(
                name: "YouTubeChannels");

            migrationBuilder.DropIndex(
                name: "IX_Videos_ChannelId",
                table: "Videos");

            migrationBuilder.DropColumn(
                name: "ChannelId",
                table: "Videos");

            migrationBuilder.AddColumn<string>(
                name: "ChannelName",
                table: "Videos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Videos_ChannelName",
                table: "Videos",
                column: "ChannelName");
        }
    }
}
