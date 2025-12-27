-- ============================================================================
-- Identify and Clean Up Test Data from Production Database
-- ============================================================================
-- Purpose: Find and remove any test data that may have leaked into production
-- Date: December 26, 2025
-- IMPORTANT: Review results before running DELETE statements!
-- ============================================================================

-- ============================================================================
-- STEP 1: IDENTIFY TEST DATA
-- ============================================================================

-- Check for media items with test-like titles
SELECT 
    'Media with test titles' as category,
    COUNT(*) as count
FROM "MediaItems" 
WHERE 
    "Title" ILIKE '%test%' OR
    "Title" ILIKE '%mock%' OR
    "Title" ILIKE '%placeholder%' OR
    "Title" ILIKE '%sample%' OR
    "Title" = 'Test Book' OR
    "Title" = 'Test Media Title' OR
    "Title" = 'Test Article' OR
    "Title" ILIKE 'Test %'
UNION ALL

-- Check for media items with test-like descriptions
SELECT 
    'Media with test descriptions' as category,
    COUNT(*) as count
FROM "MediaItems" 
WHERE 
    "Description" ILIKE '%test%' OR
    "Description" ILIKE '%mock%' OR
    "Description" ILIKE '%for testing%'
UNION ALL

-- Check for recently added media (last hour)
SELECT 
    'Media added in last hour' as category,
    COUNT(*) as count
FROM "MediaItems" 
WHERE "DateAdded" > NOW() - INTERVAL '1 hour'
UNION ALL

-- Check for mixlists with test-like names
SELECT 
    'Mixlists with test names' as category,
    COUNT(*) as count
FROM "Mixlists" 
WHERE 
    "Name" ILIKE '%test%' OR
    "Name" ILIKE '%mock%' OR
    "Name" ILIKE '%sample%';

-- ============================================================================
-- STEP 2: DETAILED VIEW OF SUSPECTED TEST DATA
-- ============================================================================

-- Show media items that look like test data
SELECT 
    "Id",
    "Title",
    "MediaType",
    "Description",
    "DateAdded",
    CASE 
        WHEN "Title" ILIKE '%test%' THEN 'Test in title'
        WHEN "Description" ILIKE '%test%' THEN 'Test in description'
        WHEN "DateAdded" > NOW() - INTERVAL '1 hour' THEN 'Recently added'
        ELSE 'Other pattern'
    END as reason
FROM "MediaItems" 
WHERE 
    "Title" ILIKE '%test%' OR
    "Title" ILIKE '%mock%' OR
    "Title" ILIKE '%placeholder%' OR
    "Title" ILIKE '%sample%' OR
    "Description" ILIKE '%test%' OR
    "Description" ILIKE '%mock%' OR
    "DateAdded" > NOW() - INTERVAL '1 hour'
ORDER BY "DateAdded" DESC
LIMIT 50;

-- Show mixlists that look like test data
SELECT 
    "Id",
    "Name",
    "Description",
    "DateCreated",
    CASE 
        WHEN "Name" ILIKE '%test%' THEN 'Test in name'
        WHEN "Description" ILIKE '%test%' THEN 'Test in description'
        WHEN "DateCreated" > NOW() - INTERVAL '1 hour' THEN 'Recently created'
        ELSE 'Other pattern'
    END as reason
FROM "Mixlists" 
WHERE 
    "Name" ILIKE '%test%' OR
    "Name" ILIKE '%mock%' OR
    "Name" ILIKE '%sample%' OR
    "Description" ILIKE '%test%' OR
    "DateCreated" > NOW() - INTERVAL '1 hour'
ORDER BY "DateCreated" DESC
LIMIT 50;

-- ============================================================================
-- STEP 3: CLEANUP (REVIEW BEFORE RUNNING!)
-- ============================================================================
-- IMPORTANT: Uncomment and run ONLY after reviewing the results above
-- ============================================================================

-- BACKUP FIRST!
-- pg_dump -U postgres -d projectloopbreaker -t media -t mixlists > backup_before_cleanup.sql

-- DELETE test media items (UNCOMMENT TO RUN)

BEGIN;

-- Delete from junction tables first (foreign key constraints)
DELETE FROM "MediaItemTopics" 
WHERE "MediaItemId" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE 
        "Title" ILIKE '%test%' OR
        "Title" ILIKE '%mock%' OR
        "Title" ILIKE '%placeholder%' OR
        "Title" ILIKE '%sample%' OR
        "Title" = 'Test Book' OR
        "Title" = 'Test Media Title' OR
        "Title" = 'Test Article' OR
        "Description" ILIKE '%test%' OR
        "Description" ILIKE '%mock%'
);

DELETE FROM "MediaItemGenres" 
WHERE "MediaItemId" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE 
        "Title" ILIKE '%test%' OR
        "Title" ILIKE '%mock%' OR
        "Title" ILIKE '%placeholder%' OR
        "Title" ILIKE '%sample%' OR
        "Title" = 'Test Book' OR
        "Title" = 'Test Media Title' OR
        "Title" = 'Test Article' OR
        "Description" ILIKE '%test%' OR
        "Description" ILIKE '%mock%'
);

DELETE FROM "MixlistMediaItems" 
WHERE "MediaItemId" IN (
    SELECT "Id" FROM "MediaItems" 
    WHERE 
        "Title" ILIKE '%test%' OR
        "Title" ILIKE '%mock%' OR
        "Title" ILIKE '%placeholder%' OR
        "Title" ILIKE '%sample%' OR
        "Title" = 'Test Book' OR
        "Title" = 'Test Media Title' OR
        "Title" = 'Test Article' OR
        "Description" ILIKE '%test%' OR
        "Description" ILIKE '%mock%'
);

-- Delete the media items
DELETE FROM "MediaItems" 
WHERE 
    "Title" ILIKE '%test%' OR
    "Title" ILIKE '%mock%' OR
    "Title" ILIKE '%placeholder%' OR
    "Title" ILIKE '%sample%' OR
    "Title" = 'Test Book' OR
    "Title" = 'Test Media Title' OR
    "Title" = 'Test Article' OR
    "Description" ILIKE '%test%' OR
    "Description" ILIKE '%mock%';

-- Delete test mixlists
DELETE FROM "MixlistMediaItems" 
WHERE "MixlistId" IN (
    SELECT "Id" FROM "Mixlists" 
    WHERE 
        "Name" ILIKE '%test%' OR
        "Name" ILIKE '%mock%' OR
        "Name" ILIKE '%sample%' OR
        "Description" ILIKE '%test%'
);

DELETE FROM "Mixlists" 
WHERE 
    "Name" ILIKE '%test%' OR
    "Name" ILIKE '%mock%' OR
    "Name" ILIKE '%sample%' OR
    "Description" ILIKE '%test%';

-- Show what was deleted
SELECT 
    'Cleanup complete' as status,
    (SELECT COUNT(*) FROM "MediaItems") as remaining_media_count,
    (SELECT COUNT(*) FROM "Mixlists") as remaining_mixlist_count;

-- If everything looks good, commit:
COMMIT;

-- If something went wrong, rollback:
-- ROLLBACK;


-- ============================================================================
-- STEP 4: VERIFY CLEANUP
-- ============================================================================

-- Count remaining items
SELECT 
    'Total media items' as category,
    COUNT(*) as count
FROM "MediaItems"
UNION ALL
SELECT 
    'Total mixlists' as category,
    COUNT(*) as count
FROM "Mixlists";

-- Check for any remaining test-like data
SELECT 
    'Remaining test-like media' as category,
    COUNT(*) as count
FROM "MediaItems" 
WHERE 
    "Title" ILIKE '%test%' OR
    "Description" ILIKE '%test%'
UNION ALL
SELECT 
    'Remaining test-like mixlists' as category,
    COUNT(*) as count
FROM "Mixlists" 
WHERE 
    "Name" ILIKE '%test%' OR
    "Description" ILIKE '%test%';

