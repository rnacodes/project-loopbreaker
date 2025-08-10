using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateAsyncMappingServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
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
                    PodcastType = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    ParentPodcastId = table.Column<Guid>(type: "uuid", nullable: true),
                    AudioLink = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DurationInSeconds = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ExternalId = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Publisher = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Podcasts");

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
                name: "PodcastEpisodes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    PodcastSeriesId = table.Column<Guid>(type: "uuid", nullable: false),
                    AudioLink = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DurationInSeconds = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    ReleaseDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
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
                name: "IX_PodcastEpisodes_PodcastSeriesId",
                table: "PodcastEpisodes",
                column: "PodcastSeriesId");
        }
    }
}
