-- EMERGENCY: Clean up test data added in last 8 hours (SAFE VERSION)
-- This version checks table/column existence before deletion
-- Run this IMMEDIATELY to remove test data from production

DO $$ 
DECLARE
    rows_affected INT := 0;
    total_deleted INT := 0;
BEGIN
    -- Show what will be deleted
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CHECKING FOR TEST DATA TO DELETE';
    RAISE NOTICE '==========================================';
    
    SELECT COUNT(*) INTO rows_affected
    FROM "MediaItems" 
    WHERE "DateAdded" > NOW() - INTERVAL '8 hours';
    
    RAISE NOTICE 'Found % media items to delete', rows_affected;
    
    -- Delete from junction tables (checking column names dynamically)
    RAISE NOTICE 'Deleting from junction tables...';
    
    -- MediaItemTopics
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'MediaItemTopics') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MediaItemTopics' AND column_name = 'MediaItemId') THEN
            DELETE FROM "MediaItemTopics" 
            WHERE "MediaItemId" IN (
                SELECT "Id" FROM "MediaItems" 
                WHERE "DateAdded" > NOW() - INTERVAL '8 hours'
            );
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from MediaItemTopics', rows_affected;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MediaItemTopics' AND column_name = 'BaseMediaItemId') THEN
            EXECUTE 'DELETE FROM "MediaItemTopics" 
                WHERE "BaseMediaItemId" IN (
                    SELECT "Id" FROM "MediaItems" 
                    WHERE "DateAdded" > NOW() - INTERVAL ''8 hours''
                )';
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from MediaItemTopics (using BaseMediaItemId)', rows_affected;
        END IF;
    END IF;
    
    -- MediaItemGenres  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'MediaItemGenres') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MediaItemGenres' AND column_name = 'MediaItemId') THEN
            DELETE FROM "MediaItemGenres" 
            WHERE "MediaItemId" IN (
                SELECT "Id" FROM "MediaItems" 
                WHERE "DateAdded" > NOW() - INTERVAL '8 hours'
            );
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from MediaItemGenres', rows_affected;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MediaItemGenres' AND column_name = 'BaseMediaItemId') THEN
            EXECUTE 'DELETE FROM "MediaItemGenres" 
                WHERE "BaseMediaItemId" IN (
                    SELECT "Id" FROM "MediaItems" 
                    WHERE "DateAdded" > NOW() - INTERVAL ''8 hours''
                )';
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from MediaItemGenres (using BaseMediaItemId)', rows_affected;
        END IF;
    END IF;
    
    -- MixlistMediaItems
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'MixlistMediaItems') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MixlistMediaItems' AND column_name = 'MediaItemId') THEN
            DELETE FROM "MixlistMediaItems" 
            WHERE "MediaItemId" IN (
                SELECT "Id" FROM "MediaItems" 
                WHERE "DateAdded" > NOW() - INTERVAL '8 hours'
            );
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from MixlistMediaItems', rows_affected;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'MixlistMediaItems' AND column_name = 'MediaItemsId') THEN
            EXECUTE 'DELETE FROM "MixlistMediaItems" 
                WHERE "MediaItemsId" IN (
                    SELECT "Id" FROM "MediaItems" 
                    WHERE "DateAdded" > NOW() - INTERVAL ''8 hours''
                )';
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from MixlistMediaItems (using MediaItemsId)', rows_affected;
        END IF;
    END IF;
    
    -- Highlights
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Highlights') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Highlights' AND column_name = 'MediaItemId') THEN
            DELETE FROM "Highlights" 
            WHERE "MediaItemId" IN (
                SELECT "Id" FROM "MediaItems" 
                WHERE "DateAdded" > NOW() - INTERVAL '8 hours'
            );
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from Highlights', rows_affected;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Highlights' AND column_name = 'ArticleId') THEN
            -- Highlights might only be linked to Articles, not all MediaItems
            DELETE FROM "Highlights" 
            WHERE "ArticleId" IN (
                SELECT "Id" FROM "MediaItems" 
                WHERE "DateAdded" > NOW() - INTERVAL '8 hours'
            );
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from Highlights (using ArticleId)', rows_affected;
        ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Highlights' AND column_name = 'BookId') THEN
            -- Try BookId as well
            DELETE FROM "Highlights" 
            WHERE "BookId" IN (
                SELECT "Id" FROM "MediaItems" 
                WHERE "DateAdded" > NOW() - INTERVAL '8 hours'
            ) OR "ArticleId" IN (
                SELECT "Id" FROM "MediaItems" 
                WHERE "DateAdded" > NOW() - INTERVAL '8 hours'
            );
            GET DIAGNOSTICS rows_affected = ROW_COUNT;
            RAISE NOTICE 'Deleted % rows from Highlights (using ArticleId and BookId)', rows_affected;
        ELSE
            RAISE NOTICE 'Could not find MediaItemId, ArticleId, or BookId column in Highlights table - skipping';
        END IF;
    END IF;
    
    -- Delete from child tables (checking existence first)
    RAISE NOTICE 'Deleting from child tables...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Videos') THEN
        DELETE FROM "Videos" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % Videos', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'YouTubeChannels') THEN
        DELETE FROM "YouTubeChannels" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % YouTubeChannels', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'YouTubePlaylistVideos') THEN
        DELETE FROM "YouTubePlaylistVideos" WHERE "VideoId" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % YouTubePlaylistVideos', rows_affected;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'YouTubePlaylistVideo') THEN
        DELETE FROM "YouTubePlaylistVideo" WHERE "VideoId" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % YouTubePlaylistVideo', rows_affected;
    ELSE
        RAISE NOTICE 'YouTubePlaylistVideos/YouTubePlaylistVideo table not found - skipping';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'YouTubePlaylists') THEN
        DELETE FROM "YouTubePlaylists" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % YouTubePlaylists', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'RefreshTokens') THEN
        DELETE FROM "RefreshTokens" WHERE "CreatedAt" > NOW() - INTERVAL '8 hours';
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % RefreshTokens', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Books') THEN
        DELETE FROM "Books" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % Books', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Movies') THEN
        DELETE FROM "Movies" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % Movies', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TvShows') THEN
        DELETE FROM "TvShows" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % TvShows', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Websites') THEN
        DELETE FROM "Websites" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % Websites', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Articles') THEN
        DELETE FROM "Articles" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % Articles', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PodcastEpisodes') THEN
        DELETE FROM "PodcastEpisodes" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % PodcastEpisodes', rows_affected;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'PodcastSeries') THEN
        DELETE FROM "PodcastSeries" WHERE "Id" IN (SELECT "Id" FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours');
        GET DIAGNOSTICS rows_affected = ROW_COUNT;
        RAISE NOTICE 'Deleted % PodcastSeries', rows_affected;
    END IF;
    
    -- Delete the media items themselves
    DELETE FROM "MediaItems" WHERE "DateAdded" > NOW() - INTERVAL '8 hours';
    GET DIAGNOSTICS total_deleted = ROW_COUNT;
    RAISE NOTICE 'Deleted % MediaItems', total_deleted;
    
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'CLEANUP COMPLETE';
    RAISE NOTICE 'Total media items deleted: %', total_deleted;
    RAISE NOTICE '==========================================';
    
END $$;

-- Show remaining count
SELECT 
    'Cleanup complete' as status,
    (SELECT COUNT(*) FROM "MediaItems") as remaining_media_count;

