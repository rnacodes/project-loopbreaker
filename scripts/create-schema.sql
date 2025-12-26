CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "Genres" (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        CONSTRAINT "PK_Genres" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "MediaItems" (
        "Id" uuid NOT NULL,
        "Title" character varying(500) NOT NULL,
        "MediaType" character varying(50) NOT NULL,
        "Link" character varying(2000),
        "Notes" text,
        "DateAdded" timestamp with time zone NOT NULL,
        "Status" character varying(50) NOT NULL,
        "DateCompleted" timestamp with time zone,
        "Rating" character varying(50),
        "OwnershipStatus" character varying(50),
        "Description" text,
        "Genre" character varying(200),
        "RelatedNotes" text,
        "Thumbnail" character varying(2000),
        CONSTRAINT "PK_MediaItems" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "Mixlists" (
        "Id" uuid NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Description" character varying(1000),
        "Thumbnail" character varying(2000),
        "DateCreated" timestamp with time zone NOT NULL,
        CONSTRAINT "PK_Mixlists" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "Topics" (
        "Id" uuid NOT NULL,
        "Name" character varying(100) NOT NULL,
        CONSTRAINT "PK_Topics" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "MediaItemGenres" (
        "MediaItemId" uuid NOT NULL,
        "GenreId" uuid NOT NULL,
        CONSTRAINT "PK_MediaItemGenres" PRIMARY KEY ("MediaItemId", "GenreId"),
        CONSTRAINT "FK_MediaItemGenres_Genres_GenreId" FOREIGN KEY ("GenreId") REFERENCES "Genres" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_MediaItemGenres_MediaItems_MediaItemId" FOREIGN KEY ("MediaItemId") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "PodcastSeries" (
        "Id" uuid NOT NULL,
        CONSTRAINT "PK_PodcastSeries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_PodcastSeries_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "MixlistMediaItems" (
        "MixlistId" uuid NOT NULL,
        "MediaItemId" uuid NOT NULL,
        CONSTRAINT "PK_MixlistMediaItems" PRIMARY KEY ("MixlistId", "MediaItemId"),
        CONSTRAINT "FK_MixlistMediaItems_MediaItems_MediaItemId" FOREIGN KEY ("MediaItemId") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_MixlistMediaItems_Mixlists_MixlistId" FOREIGN KEY ("MixlistId") REFERENCES "Mixlists" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "MediaItemTopics" (
        "MediaItemId" uuid NOT NULL,
        "TopicId" uuid NOT NULL,
        CONSTRAINT "PK_MediaItemTopics" PRIMARY KEY ("MediaItemId", "TopicId"),
        CONSTRAINT "FK_MediaItemTopics_MediaItems_MediaItemId" FOREIGN KEY ("MediaItemId") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_MediaItemTopics_Topics_TopicId" FOREIGN KEY ("TopicId") REFERENCES "Topics" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE TABLE "PodcastEpisodes" (
        "Id" uuid NOT NULL,
        "PodcastSeriesId" uuid NOT NULL,
        "AudioLink" character varying(2000),
        "ReleaseDate" timestamp with time zone,
        "DurationInSeconds" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_PodcastEpisodes" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_PodcastEpisodes_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_PodcastEpisodes_PodcastSeries_PodcastSeriesId" FOREIGN KEY ("PodcastSeriesId") REFERENCES "PodcastSeries" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Genres_Name" ON "Genres" ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE INDEX "IX_MediaItemGenres_GenreId" ON "MediaItemGenres" ("GenreId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE INDEX "IX_MediaItemTopics_TopicId" ON "MediaItemTopics" ("TopicId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE INDEX "IX_MixlistMediaItems_MediaItemId" ON "MixlistMediaItems" ("MediaItemId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE INDEX "IX_PodcastEpisodes_PodcastSeriesId" ON "PodcastEpisodes" ("PodcastSeriesId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_Topics_Name" ON "Topics" ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250809233540_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20250809233540_InitialCreate', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810025014_UpdateAsyncMappingServices') THEN
    DROP TABLE "PodcastEpisodes";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810025014_UpdateAsyncMappingServices') THEN
    DROP TABLE "PodcastSeries";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810025014_UpdateAsyncMappingServices') THEN
    CREATE TABLE "Podcasts" (
        "Id" uuid NOT NULL,
        "PodcastType" character varying(50) NOT NULL,
        "ParentPodcastId" uuid,
        "AudioLink" character varying(2000),
        "ReleaseDate" timestamp with time zone,
        "DurationInSeconds" integer NOT NULL DEFAULT 0,
        "ExternalId" character varying(200),
        "Publisher" character varying(500),
        CONSTRAINT "PK_Podcasts" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Podcasts_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_Podcasts_Podcasts_ParentPodcastId" FOREIGN KEY ("ParentPodcastId") REFERENCES "Podcasts" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810025014_UpdateAsyncMappingServices') THEN
    CREATE INDEX "IX_Podcasts_ExternalId" ON "Podcasts" ("ExternalId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810025014_UpdateAsyncMappingServices') THEN
    CREATE INDEX "IX_Podcasts_ParentPodcastId" ON "Podcasts" ("ParentPodcastId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810025014_UpdateAsyncMappingServices') THEN
    CREATE INDEX "IX_Podcasts_PodcastType" ON "Podcasts" ("PodcastType");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810025014_UpdateAsyncMappingServices') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20250810025014_UpdateAsyncMappingServices', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810213900_AddBookEntity') THEN
    CREATE TABLE "Books" (
        "Id" uuid NOT NULL,
        "Author" character varying(300) NOT NULL,
        "ISBN" character varying(17),
        "ASIN" character varying(20),
        "Format" character varying(50) NOT NULL,
        "PartOfSeries" boolean NOT NULL,
        CONSTRAINT "PK_Books" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Books_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810213900_AddBookEntity') THEN
    CREATE INDEX "IX_Books_ASIN" ON "Books" ("ASIN");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810213900_AddBookEntity') THEN
    CREATE INDEX "IX_Books_Author" ON "Books" ("Author");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810213900_AddBookEntity') THEN
    CREATE INDEX "IX_Books_ISBN" ON "Books" ("ISBN");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250810213900_AddBookEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20250810213900_AddBookEntity', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250905220513_RemoveLegacyGenreField') THEN
    ALTER TABLE "MediaItems" DROP COLUMN "Genre";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250905220513_RemoveLegacyGenreField') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20250905220513_RemoveLegacyGenreField', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE TABLE "Movies" (
        "Id" uuid NOT NULL,
        "Director" character varying(100),
        "Cast" character varying(500),
        "ReleaseYear" integer,
        "RuntimeMinutes" integer,
        "MpaaRating" character varying(50),
        "ImdbId" character varying(20),
        "TmdbId" character varying(20),
        "TmdbRating" double precision,
        "TmdbBackdropPath" character varying(2000),
        "Tagline" character varying(1000),
        "Homepage" character varying(2000),
        "OriginalLanguage" character varying(10),
        "OriginalTitle" character varying(500),
        CONSTRAINT "PK_Movies" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Movies_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE TABLE "TvShows" (
        "Id" uuid NOT NULL,
        "Creator" character varying(100),
        "Cast" character varying(500),
        "FirstAirYear" integer,
        "LastAirYear" integer,
        "NumberOfSeasons" integer,
        "NumberOfEpisodes" integer,
        "ContentRating" character varying(50),
        "Network" character varying(200),
        "TmdbId" character varying(20),
        "TmdbRating" double precision,
        "TmdbPosterPath" character varying(2000),
        "Tagline" character varying(1000),
        "Homepage" character varying(2000),
        "OriginalLanguage" character varying(10),
        "OriginalName" character varying(500),
        CONSTRAINT "PK_TvShows" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_TvShows_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_Movies_Director" ON "Movies" ("Director");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_Movies_ImdbId" ON "Movies" ("ImdbId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_Movies_ReleaseYear" ON "Movies" ("ReleaseYear");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_Movies_TmdbId" ON "Movies" ("TmdbId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_TvShows_Creator" ON "TvShows" ("Creator");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_TvShows_FirstAirYear" ON "TvShows" ("FirstAirYear");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_TvShows_LastAirYear" ON "TvShows" ("LastAirYear");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_TvShows_Network" ON "TvShows" ("Network");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    CREATE INDEX "IX_TvShows_TmdbId" ON "TvShows" ("TmdbId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250907225630_AddMovieAndTvShowEntities') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20250907225630_AddMovieAndTvShowEntities', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250914220608_AddMovieAndTvShowServices') THEN
    DROP INDEX "IX_TvShows_Network";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250914220608_AddMovieAndTvShowServices') THEN
    ALTER TABLE "TvShows" DROP COLUMN "Network";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250914220608_AddMovieAndTvShowServices') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20250914220608_AddMovieAndTvShowServices', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250921231850_AddVideoEntity') THEN
    CREATE TABLE "Videos" (
        "Id" uuid NOT NULL,
        "VideoType" character varying(50) NOT NULL,
        "ParentVideoId" uuid,
        "Platform" character varying(100) NOT NULL,
        "ChannelName" character varying(200) NOT NULL,
        "LengthInSeconds" integer NOT NULL DEFAULT 0,
        "ExternalId" character varying(200),
        CONSTRAINT "PK_Videos" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Videos_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_Videos_Videos_ParentVideoId" FOREIGN KEY ("ParentVideoId") REFERENCES "Videos" ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250921231850_AddVideoEntity') THEN
    CREATE INDEX "IX_Videos_ChannelName" ON "Videos" ("ChannelName");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250921231850_AddVideoEntity') THEN
    CREATE INDEX "IX_Videos_ExternalId" ON "Videos" ("ExternalId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250921231850_AddVideoEntity') THEN
    CREATE INDEX "IX_Videos_ParentVideoId" ON "Videos" ("ParentVideoId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250921231850_AddVideoEntity') THEN
    CREATE INDEX "IX_Videos_Platform" ON "Videos" ("Platform");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250921231850_AddVideoEntity') THEN
    CREATE INDEX "IX_Videos_VideoType" ON "Videos" ("VideoType");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250921231850_AddVideoEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20250921231850_AddVideoEntity', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20250927021208_UpdateVideoEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20250927021208_UpdateVideoEntity', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251109031337_AddArticleEntity') THEN
    CREATE TABLE "Articles" (
        "Id" uuid NOT NULL,
        "InstapaperBookmarkId" character varying(50),
        "OriginalUrl" character varying(2000),
        "Author" character varying(300),
        "Publication" character varying(200),
        "PublicationDate" timestamp with time zone,
        "SavedToInstapaperDate" timestamp with time zone,
        "ReadingProgress" double precision NOT NULL DEFAULT 0.0,
        "ProgressTimestamp" timestamp with time zone,
        "EstimatedReadingTimeMinutes" integer NOT NULL DEFAULT 0,
        "WordCount" integer NOT NULL DEFAULT 0,
        "IsStarred" boolean NOT NULL DEFAULT FALSE,
        "IsArchived" boolean NOT NULL DEFAULT FALSE,
        "FullTextContent" text,
        CONSTRAINT "PK_Articles" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Articles_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251109031337_AddArticleEntity') THEN
    CREATE INDEX "IX_Articles_Author" ON "Articles" ("Author");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251109031337_AddArticleEntity') THEN
    CREATE INDEX "IX_Articles_InstapaperBookmarkId" ON "Articles" ("InstapaperBookmarkId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251109031337_AddArticleEntity') THEN
    CREATE INDEX "IX_Articles_IsArchived" ON "Articles" ("IsArchived");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251109031337_AddArticleEntity') THEN
    CREATE INDEX "IX_Articles_IsStarred" ON "Articles" ("IsStarred");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251109031337_AddArticleEntity') THEN
    CREATE INDEX "IX_Articles_Publication" ON "Articles" ("Publication");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251109031337_AddArticleEntity') THEN
    CREATE INDEX "IX_Articles_PublicationDate" ON "Articles" ("PublicationDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251109031337_AddArticleEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251109031337_AddArticleEntity', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251117050818_AddGoodreadsRatingToBook') THEN
    ALTER TABLE "Books" ADD "GoodreadsRating" numeric;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251117050818_AddGoodreadsRatingToBook') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251117050818_AddGoodreadsRatingToBook', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251118000632_AddPodcastSubscriptionTracking') THEN
    ALTER TABLE "Podcasts" ADD "IsSubscribed" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251118000632_AddPodcastSubscriptionTracking') THEN
    ALTER TABLE "Podcasts" ADD "LastSyncDate" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251118000632_AddPodcastSubscriptionTracking') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251118000632_AddPodcastSubscriptionTracking', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" DROP COLUMN "EstimatedReadingTimeMinutes";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" DROP COLUMN "FullTextContent";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" DROP COLUMN "OriginalUrl";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" DROP COLUMN "ProgressTimestamp";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" RENAME COLUMN "SavedToInstapaperDate" TO "LastSyncDate";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" ALTER COLUMN "WordCount" DROP NOT NULL;
    ALTER TABLE "Articles" ALTER COLUMN "WordCount" DROP DEFAULT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" ALTER COLUMN "ReadingProgress" TYPE integer;
    ALTER TABLE "Articles" ALTER COLUMN "ReadingProgress" DROP NOT NULL;
    ALTER TABLE "Articles" ALTER COLUMN "ReadingProgress" DROP DEFAULT;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" ALTER COLUMN "InstapaperBookmarkId" TYPE character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" ALTER COLUMN "Author" TYPE character varying(200);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" ADD "ContentStoragePath" character varying(500);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    ALTER TABLE "Articles" ADD "InstapaperHash" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122010523_InstaArticleUpdate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251122010523_InstaArticleUpdate', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    DROP TABLE "Podcasts";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    CREATE TABLE "PodcastSeries" (
        "Id" uuid NOT NULL,
        "Publisher" character varying(500),
        "ExternalId" character varying(200),
        "IsSubscribed" boolean NOT NULL DEFAULT FALSE,
        "LastSyncDate" timestamp with time zone,
        "TotalEpisodes" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_PodcastSeries" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_PodcastSeries_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    CREATE TABLE "PodcastEpisodes" (
        "Id" uuid NOT NULL,
        "SeriesId" uuid NOT NULL,
        "AudioLink" character varying(2000),
        "ReleaseDate" timestamp with time zone,
        "DurationInSeconds" integer NOT NULL DEFAULT 0,
        "EpisodeNumber" integer,
        "SeasonNumber" integer,
        "ExternalId" character varying(200),
        "Publisher" character varying(500),
        CONSTRAINT "PK_PodcastEpisodes" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_PodcastEpisodes_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_PodcastEpisodes_PodcastSeries_SeriesId" FOREIGN KEY ("SeriesId") REFERENCES "PodcastSeries" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    CREATE INDEX "IX_PodcastEpisodes_ExternalId" ON "PodcastEpisodes" ("ExternalId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    CREATE INDEX "IX_PodcastEpisodes_ReleaseDate" ON "PodcastEpisodes" ("ReleaseDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    CREATE INDEX "IX_PodcastEpisodes_SeriesId" ON "PodcastEpisodes" ("SeriesId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    CREATE INDEX "IX_PodcastSeries_ExternalId" ON "PodcastSeries" ("ExternalId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    CREATE INDEX "IX_PodcastSeries_IsSubscribed" ON "PodcastSeries" ("IsSubscribed");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122013414_SeparatePodcastSeriesAndEpisodes') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251122013414_SeparatePodcastSeriesAndEpisodes', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122015911_CleanupOldPodcastRecords') THEN

                    -- Delete from join tables for orphaned media items
                    -- Find IDs that exist in MediaItems but not in any child table
                    DELETE FROM "MediaItemTopics" 
                    WHERE "MediaItemId" IN (
                        SELECT m."Id" 
                        FROM "MediaItems" m
                        LEFT JOIN "Books" b ON m."Id" = b."Id"
                        LEFT JOIN "Movies" mov ON m."Id" = mov."Id"
                        LEFT JOIN "TvShows" tv ON m."Id" = tv."Id"
                        LEFT JOIN "Videos" v ON m."Id" = v."Id"
                        LEFT JOIN "Articles" a ON m."Id" = a."Id"
                        LEFT JOIN "PodcastSeries" ps ON m."Id" = ps."Id"
                        LEFT JOIN "PodcastEpisodes" pe ON m."Id" = pe."Id"
                        WHERE b."Id" IS NULL 
                          AND mov."Id" IS NULL 
                          AND tv."Id" IS NULL 
                          AND v."Id" IS NULL 
                          AND a."Id" IS NULL
                          AND ps."Id" IS NULL
                          AND pe."Id" IS NULL
                    );
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122015911_CleanupOldPodcastRecords') THEN

                    DELETE FROM "MediaItemGenres" 
                    WHERE "MediaItemId" IN (
                        SELECT m."Id" 
                        FROM "MediaItems" m
                        LEFT JOIN "Books" b ON m."Id" = b."Id"
                        LEFT JOIN "Movies" mov ON m."Id" = mov."Id"
                        LEFT JOIN "TvShows" tv ON m."Id" = tv."Id"
                        LEFT JOIN "Videos" v ON m."Id" = v."Id"
                        LEFT JOIN "Articles" a ON m."Id" = a."Id"
                        LEFT JOIN "PodcastSeries" ps ON m."Id" = ps."Id"
                        LEFT JOIN "PodcastEpisodes" pe ON m."Id" = pe."Id"
                        WHERE b."Id" IS NULL 
                          AND mov."Id" IS NULL 
                          AND tv."Id" IS NULL 
                          AND v."Id" IS NULL 
                          AND a."Id" IS NULL
                          AND ps."Id" IS NULL
                          AND pe."Id" IS NULL
                    );
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122015911_CleanupOldPodcastRecords') THEN

                    DELETE FROM "MixlistMediaItems" 
                    WHERE "MediaItemId" IN (
                        SELECT m."Id" 
                        FROM "MediaItems" m
                        LEFT JOIN "Books" b ON m."Id" = b."Id"
                        LEFT JOIN "Movies" mov ON m."Id" = mov."Id"
                        LEFT JOIN "TvShows" tv ON m."Id" = tv."Id"
                        LEFT JOIN "Videos" v ON m."Id" = v."Id"
                        LEFT JOIN "Articles" a ON m."Id" = a."Id"
                        LEFT JOIN "PodcastSeries" ps ON m."Id" = ps."Id"
                        LEFT JOIN "PodcastEpisodes" pe ON m."Id" = pe."Id"
                        WHERE b."Id" IS NULL 
                          AND mov."Id" IS NULL 
                          AND tv."Id" IS NULL 
                          AND v."Id" IS NULL 
                          AND a."Id" IS NULL
                          AND ps."Id" IS NULL
                          AND pe."Id" IS NULL
                    );
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122015911_CleanupOldPodcastRecords') THEN

                    DELETE FROM "MediaItems" 
                    WHERE "Id" IN (
                        SELECT m."Id" 
                        FROM "MediaItems" m
                        LEFT JOIN "Books" b ON m."Id" = b."Id"
                        LEFT JOIN "Movies" mov ON m."Id" = mov."Id"
                        LEFT JOIN "TvShows" tv ON m."Id" = tv."Id"
                        LEFT JOIN "Videos" v ON m."Id" = v."Id"
                        LEFT JOIN "Articles" a ON m."Id" = a."Id"
                        LEFT JOIN "PodcastSeries" ps ON m."Id" = ps."Id"
                        LEFT JOIN "PodcastEpisodes" pe ON m."Id" = pe."Id"
                        WHERE b."Id" IS NULL 
                          AND mov."Id" IS NULL 
                          AND tv."Id" IS NULL 
                          AND v."Id" IS NULL 
                          AND a."Id" IS NULL
                          AND ps."Id" IS NULL
                          AND pe."Id" IS NULL
                    );
                
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251122015911_CleanupOldPodcastRecords') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251122015911_CleanupOldPodcastRecords', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    DROP INDEX "IX_Videos_ChannelName";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    ALTER TABLE "Videos" DROP COLUMN "ChannelName";
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    ALTER TABLE "Videos" ADD "ChannelId" uuid;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    CREATE TABLE "YouTubeChannels" (
        "Id" uuid NOT NULL,
        "ChannelExternalId" character varying(100) NOT NULL,
        "CustomUrl" character varying(200),
        "SubscriberCount" bigint,
        "VideoCount" bigint,
        "ViewCount" bigint,
        "UploadsPlaylistId" character varying(100),
        "Country" character varying(10),
        "PublishedAt" timestamp with time zone,
        "LastSyncedAt" timestamp with time zone,
        CONSTRAINT "PK_YouTubeChannels" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_YouTubeChannels_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    CREATE INDEX "IX_Videos_ChannelId" ON "Videos" ("ChannelId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    CREATE UNIQUE INDEX "IX_YouTubeChannels_ChannelExternalId" ON "YouTubeChannels" ("ChannelExternalId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    CREATE INDEX "IX_YouTubeChannels_LastSyncedAt" ON "YouTubeChannels" ("LastSyncedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    CREATE INDEX "IX_YouTubeChannels_PublishedAt" ON "YouTubeChannels" ("PublishedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    CREATE INDEX "IX_YouTubeChannels_SubscriberCount" ON "YouTubeChannels" ("SubscriberCount");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    ALTER TABLE "Videos" ADD CONSTRAINT "FK_Videos_YouTubeChannels_ChannelId" FOREIGN KEY ("ChannelId") REFERENCES "YouTubeChannels" ("Id") ON DELETE SET NULL;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123015905_AddYouTubeChannelEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251123015905_AddYouTubeChannelEntity', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    ALTER TABLE "Books" ADD "LastReadwiseSync" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    ALTER TABLE "Books" ADD "ReadwiseBookId" integer;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    ALTER TABLE "Articles" ADD "LastReaderSync" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    ALTER TABLE "Articles" ADD "ReaderLocation" character varying(50);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    ALTER TABLE "Articles" ADD "ReadwiseDocumentId" character varying(100);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE TABLE "Highlights" (
        "Id" uuid NOT NULL,
        "ReadwiseId" integer NOT NULL,
        "Text" character varying(8191) NOT NULL,
        "Note" character varying(8191),
        "Title" character varying(511),
        "Author" character varying(1024),
        "Category" character varying(50),
        "SourceUrl" character varying(2047),
        "ImageUrl" character varying(2047),
        "HighlightUrl" character varying(4095),
        "Location" integer,
        "LocationType" character varying(50),
        "HighlightedAt" timestamp with time zone,
        "UpdatedAt" timestamp with time zone,
        "Tags" character varying(1000),
        "ArticleId" uuid,
        "BookId" uuid,
        "ReadwiseBookId" integer,
        "CreatedAt" timestamp with time zone NOT NULL,
        "SourceType" character varying(64),
        "IsFavorite" boolean NOT NULL DEFAULT FALSE,
        "Color" character varying(50),
        CONSTRAINT "PK_Highlights" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Highlights_Articles_ArticleId" FOREIGN KEY ("ArticleId") REFERENCES "Articles" ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_Highlights_Books_BookId" FOREIGN KEY ("BookId") REFERENCES "Books" ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE INDEX "IX_Articles_ReaderLocation" ON "Articles" ("ReaderLocation");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE INDEX "IX_Articles_ReadwiseDocumentId" ON "Articles" ("ReadwiseDocumentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE INDEX "IX_Highlights_ArticleId" ON "Highlights" ("ArticleId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE INDEX "IX_Highlights_BookId" ON "Highlights" ("BookId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE INDEX "IX_Highlights_Category" ON "Highlights" ("Category");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE INDEX "IX_Highlights_HighlightedAt" ON "Highlights" ("HighlightedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE INDEX "IX_Highlights_IsFavorite" ON "Highlights" ("IsFavorite");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE INDEX "IX_Highlights_ReadwiseBookId" ON "Highlights" ("ReadwiseBookId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    CREATE UNIQUE INDEX "IX_Highlights_ReadwiseId" ON "Highlights" ("ReadwiseId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251123041435_AddReadwiseIntegration') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251123041435_AddReadwiseIntegration', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE TABLE "YouTubePlaylists" (
        "Id" uuid NOT NULL,
        "PlaylistExternalId" character varying(100) NOT NULL,
        "ChannelExternalId" character varying(100),
        "LinkedYouTubeChannelId" uuid,
        "VideoCount" integer,
        "PublishedAt" timestamp with time zone,
        "LastSyncedAt" timestamp with time zone,
        "PrivacyStatus" character varying(50),
        CONSTRAINT "PK_YouTubePlaylists" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_YouTubePlaylists_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_YouTubePlaylists_YouTubeChannels_LinkedYouTubeChannelId" FOREIGN KEY ("LinkedYouTubeChannelId") REFERENCES "YouTubeChannels" ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE TABLE "YouTubePlaylistVideo" (
        "YouTubePlaylistId" uuid NOT NULL,
        "VideoId" uuid NOT NULL,
        "Position" integer,
        "AddedAt" timestamp with time zone NOT NULL,
        "VideoPublishedAt" timestamp with time zone,
        CONSTRAINT "PK_YouTubePlaylistVideo" PRIMARY KEY ("YouTubePlaylistId", "VideoId"),
        CONSTRAINT "FK_YouTubePlaylistVideo_Videos_VideoId" FOREIGN KEY ("VideoId") REFERENCES "Videos" ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_YouTubePlaylistVideo_YouTubePlaylists_YouTubePlaylistId" FOREIGN KEY ("YouTubePlaylistId") REFERENCES "YouTubePlaylists" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE INDEX "IX_YouTubePlaylists_LastSyncedAt" ON "YouTubePlaylists" ("LastSyncedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE INDEX "IX_YouTubePlaylists_LinkedYouTubeChannelId" ON "YouTubePlaylists" ("LinkedYouTubeChannelId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE UNIQUE INDEX "IX_YouTubePlaylists_PlaylistExternalId" ON "YouTubePlaylists" ("PlaylistExternalId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE INDEX "IX_YouTubePlaylists_PublishedAt" ON "YouTubePlaylists" ("PublishedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE INDEX "IX_YouTubePlaylistVideo_AddedAt" ON "YouTubePlaylistVideo" ("AddedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE INDEX "IX_YouTubePlaylistVideo_Position" ON "YouTubePlaylistVideo" ("Position");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    CREATE INDEX "IX_YouTubePlaylistVideo_VideoId" ON "YouTubePlaylistVideo" ("VideoId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251129020111_AddYouTubePlaylistEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251129020111_AddYouTubePlaylistEntity', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251130234051_AddWebsiteEntity') THEN
    CREATE TABLE "Websites" (
        "Id" uuid NOT NULL,
        "RssFeedUrl" character varying(2000),
        "LastCheckedDate" timestamp with time zone,
        "Domain" character varying(200),
        "Author" character varying(200),
        "Publication" character varying(200),
        CONSTRAINT "PK_Websites" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_Websites_MediaItems_Id" FOREIGN KEY ("Id") REFERENCES "MediaItems" ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251130234051_AddWebsiteEntity') THEN
    CREATE INDEX "IX_Websites_Domain" ON "Websites" ("Domain");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251130234051_AddWebsiteEntity') THEN
    CREATE INDEX "IX_Websites_LastCheckedDate" ON "Websites" ("LastCheckedDate");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251130234051_AddWebsiteEntity') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251130234051_AddWebsiteEntity', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251214023406_AddRefreshTokens') THEN
    CREATE TABLE "RefreshTokens" (
        "Id" integer GENERATED BY DEFAULT AS IDENTITY,
        "Token" character varying(500) NOT NULL,
        "UserId" character varying(100) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "IsRevoked" boolean NOT NULL,
        "RevokedAt" timestamp with time zone,
        "ReplacedByToken" character varying(500),
        CONSTRAINT "PK_RefreshTokens" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251214023406_AddRefreshTokens') THEN
    CREATE INDEX "IX_RefreshTokens_ExpiresAt" ON "RefreshTokens" ("ExpiresAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251214023406_AddRefreshTokens') THEN
    CREATE INDEX "IX_RefreshTokens_IsRevoked" ON "RefreshTokens" ("IsRevoked");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251214023406_AddRefreshTokens') THEN
    CREATE UNIQUE INDEX "IX_RefreshTokens_Token" ON "RefreshTokens" ("Token");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251214023406_AddRefreshTokens') THEN
    CREATE INDEX "IX_RefreshTokens_UserId" ON "RefreshTokens" ("UserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251214023406_AddRefreshTokens') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251214023406_AddRefreshTokens', '9.0.7');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20251219223058_NewDemoMigration') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20251219223058_NewDemoMigration', '9.0.7');
    END IF;
END $EF$;
COMMIT;

