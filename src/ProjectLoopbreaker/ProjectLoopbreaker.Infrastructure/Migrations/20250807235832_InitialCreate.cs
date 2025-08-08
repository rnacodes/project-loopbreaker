using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MediaItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    MediaType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Link = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    DateAdded = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DateCompleted = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Rating = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    OwnershipStatus = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    Genre = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Topics = table.Column<string[]>(type: "jsonb", nullable: false),
                    Genres = table.Column<string[]>(type: "jsonb", nullable: false),
                    RelatedNotes = table.Column<string>(type: "text", nullable: true),
                    Thumbnail = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MediaItems", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Mixlists",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Thumbnail = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DateCreated = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Mixlists", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PodcastSeries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PodcastSeries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PodcastSeries_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MixlistMediaItems",
                columns: table => new
                {
                    MixlistId = table.Column<Guid>(type: "uuid", nullable: false),
                    MediaItemId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MixlistMediaItems", x => new { x.MixlistId, x.MediaItemId });
                    table.ForeignKey(
                        name: "FK_MixlistMediaItems_MediaItems_MediaItemId",
                        column: x => x.MediaItemId,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MixlistMediaItems_Mixlists_MixlistId",
                        column: x => x.MixlistId,
                        principalTable: "Mixlists",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PodcastEpisodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PodcastSeriesId = table.Column<Guid>(type: "uuid", nullable: false),
                    AudioLink = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DurationInSeconds = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PodcastEpisodes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PodcastEpisodes_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PodcastEpisodes_PodcastSeries_PodcastSeriesId",
                        column: x => x.PodcastSeriesId,
                        principalTable: "PodcastSeries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MixlistMediaItems_MediaItemId",
                table: "MixlistMediaItems",
                column: "MediaItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PodcastEpisodes_PodcastSeriesId",
                table: "PodcastEpisodes",
                column: "PodcastSeriesId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MixlistMediaItems");

            migrationBuilder.DropTable(
                name: "PodcastEpisodes");

            migrationBuilder.DropTable(
                name: "Mixlists");

            migrationBuilder.DropTable(
                name: "PodcastSeries");

            migrationBuilder.DropTable(
                name: "MediaItems");
        }
    }
}
