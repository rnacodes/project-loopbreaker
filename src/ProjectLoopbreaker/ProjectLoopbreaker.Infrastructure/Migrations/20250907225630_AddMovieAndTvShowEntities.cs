using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectLoopbreaker.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMovieAndTvShowEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Movies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Director = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Cast = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    ReleaseYear = table.Column<int>(type: "integer", nullable: true),
                    RuntimeMinutes = table.Column<int>(type: "integer", nullable: true),
                    MpaaRating = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    ImdbId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TmdbId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TmdbRating = table.Column<double>(type: "double precision", nullable: true),
                    TmdbBackdropPath = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Tagline = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Homepage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    OriginalLanguage = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    OriginalTitle = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Movies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Movies_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "TvShows",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Creator = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Cast = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FirstAirYear = table.Column<int>(type: "integer", nullable: true),
                    LastAirYear = table.Column<int>(type: "integer", nullable: true),
                    NumberOfSeasons = table.Column<int>(type: "integer", nullable: true),
                    NumberOfEpisodes = table.Column<int>(type: "integer", nullable: true),
                    ContentRating = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    Network = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    TmdbId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    TmdbRating = table.Column<double>(type: "double precision", nullable: true),
                    TmdbPosterPath = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    Tagline = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    Homepage = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    OriginalLanguage = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    OriginalName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TvShows", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TvShows_MediaItems_Id",
                        column: x => x.Id,
                        principalTable: "MediaItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Movies_Director",
                table: "Movies",
                column: "Director");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_ImdbId",
                table: "Movies",
                column: "ImdbId");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_ReleaseYear",
                table: "Movies",
                column: "ReleaseYear");

            migrationBuilder.CreateIndex(
                name: "IX_Movies_TmdbId",
                table: "Movies",
                column: "TmdbId");

            migrationBuilder.CreateIndex(
                name: "IX_TvShows_Creator",
                table: "TvShows",
                column: "Creator");

            migrationBuilder.CreateIndex(
                name: "IX_TvShows_FirstAirYear",
                table: "TvShows",
                column: "FirstAirYear");

            migrationBuilder.CreateIndex(
                name: "IX_TvShows_LastAirYear",
                table: "TvShows",
                column: "LastAirYear");

            migrationBuilder.CreateIndex(
                name: "IX_TvShows_Network",
                table: "TvShows",
                column: "Network");

            migrationBuilder.CreateIndex(
                name: "IX_TvShows_TmdbId",
                table: "TvShows",
                column: "TmdbId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Movies");

            migrationBuilder.DropTable(
                name: "TvShows");
        }
    }
}
