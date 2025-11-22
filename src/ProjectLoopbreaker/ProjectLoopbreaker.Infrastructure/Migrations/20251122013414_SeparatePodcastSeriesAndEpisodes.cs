using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SeparatePodcastSeriesAndEpisodes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Podcasts");

            migrationBuilder.CreateTable(
                name: "PodcastSeries",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Publisher = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ExternalId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsSubscribed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    LastSyncDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    TotalEpisodes = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
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
                name: "PodcastEpisodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    SeriesId = table.Column<Guid>(type: "uuid", nullable: false),
                    AudioLink = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DurationInSeconds = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    EpisodeNumber = table.Column<int>(type: "integer", nullable: true),
                    SeasonNumber = table.Column<int>(type: "integer", nullable: true),
                    ExternalId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Publisher = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
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
                        name: "FK_PodcastEpisodes_PodcastSeries_SeriesId",
                        column: x => x.SeriesId,
                        principalTable: "PodcastSeries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PodcastEpisodes_ExternalId",
                table: "PodcastEpisodes",
                column: "ExternalId");

            migrationBuilder.CreateIndex(
                name: "IX_PodcastEpisodes_ReleaseDate",
                table: "PodcastEpisodes",
                column: "ReleaseDate");

            migrationBuilder.CreateIndex(
                name: "IX_PodcastEpisodes_SeriesId",
                table: "PodcastEpisodes",
                column: "SeriesId");

            migrationBuilder.CreateIndex(
                name: "IX_PodcastSeries_ExternalId",
                table: "PodcastSeries",
                column: "ExternalId");

            migrationBuilder.CreateIndex(
                name: "IX_PodcastSeries_IsSubscribed",
                table: "PodcastSeries",
                column: "IsSubscribed");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PodcastEpisodes");

            migrationBuilder.DropTable(
                name: "PodcastSeries");

            migrationBuilder.CreateTable(
                name: "Podcasts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ParentPodcastId = table.Column<Guid>(type: "uuid", nullable: true),
                    AudioLink = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DurationInSeconds = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExternalId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    IsSubscribed = table.Column<bool>(type: "boolean", nullable: false),
                    LastSyncDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PodcastType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Publisher = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Podcasts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Podcasts_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Podcasts_Podcasts_ParentPodcastId",
                        column: x => x.ParentPodcastId,
                        principalTable: "Podcasts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Podcasts_ExternalId",
                table: "Podcasts",
                column: "ExternalId");

            migrationBuilder.CreateIndex(
                name: "IX_Podcasts_ParentPodcastId",
                table: "Podcasts",
                column: "ParentPodcastId");

            migrationBuilder.CreateIndex(
                name: "IX_Podcasts_PodcastType",
                table: "Podcasts",
                column: "PodcastType");
        }
    }
}
