-- EMERGENCY: Clean up test data added in last 6 hours
-- Run this IMMEDIATELY to remove test data from production
-- Extended to 6 hours to catch test data from multiple test runs

BEGIN;

-- Show what will be deleted (review before committing)
SELECT 
    "Id",
    "Title",
    "MediaType",
    "DateAdded",
    "Description"
FROM "MediaItems" 
WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
ORDER BY "DateAdded" DESC;

-- Delete from junction tables first
DELETE FROM "MediaItemTopics" 
WHERE "MediaItemId" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "MediaItemGenres" 
WHERE "MediaItemId" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "MixlistMediaItems" 
WHERE "MediaItemId" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "Highlights"
WHERE "MediaItemId" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

-- Delete child table entries (Videos, Books, etc.)
DELETE FROM "Videos" 
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "YouTubeChannels"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "YouTubePlaylistVideos"
WHERE "VideoId" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "YouTubePlaylists"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "RefreshTokens"
WHERE "CreatedAt" > NOW() - INTERVAL '6 hours';

DELETE FROM "Books"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "Movies"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "TvShows"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "Websites"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "Articles"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "PodcastEpisodes"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

DELETE FROM "PodcastSeries"
WHERE "Id" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '6 hours'
);

-- Delete the media items themselves
DELETE FROM "MediaItems" 
WHERE "DateAdded" > NOW() - INTERVAL '6 hours';

-- Show results
SELECT 
    'Cleanup complete' as status,
    (SELECT COUNT(*) FROM "MediaItems") as remaining_media_count;

-- REVIEW THE OUTPUT ABOVE BEFORE RUNNING COMMIT!
-- If everything looks correct, run: COMMIT;
-- If something looks wrong, run: ROLLBACK;

-- COMMIT;

