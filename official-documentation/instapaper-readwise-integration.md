# Instapaper and Readwise Integration

## Overview

ProjectLoopbreaker integrates with **Instapaper** and **Readwise** (including Readwise Reader) to sync articles and highlights. The system is designed with a **Readwise-first** approach, automatically deduplicating articles across sources and merging metadata intelligently.

**Scope**: Currently focused on **articles only**. While Readwise Reader supports videos, PDFs, tweets, and other media types, this integration specifically syncs article-type documents and their associated highlights. Other media types in PLB (videos, podcasts, books) are managed through their respective integrations (YouTube API, ListenNotes, Open Library, etc.).

## Architecture

### Data Storage
- **Articles**: Metadata and full HTML content stored directly in PostgreSQL
- **Highlights**: All highlight data stored in PostgreSQL with JSONB metadata field
- **No external storage**: S3/Spaces previously used but migrated to database-only storage

### Sync Status Tracking
Articles track their sync state using a `SyncStatus` enum (flags):
- `LocalOnly` (0): Manually added to PLB
- `InstapaperSynced` (1): Synced from Instapaper
- `ReadwiseSynced` (2): Highlights synced from Readwise
- `ReaderSynced` (4): Synced from Readwise Reader
- `FullySynced`: Combination of all flags

## Instapaper Integration

### Authentication
- Uses OAuth 1.0a (xAuth) for authentication
- Credentials stored in session storage (frontend)
- Access tokens used for API requests

### Article Import
**Endpoint**: `/api/article/import-instapaper`

**Process**:
1. User authenticates with username/password
2. Selects folder to import (Unread, Starred, Archive)
3. Articles imported with metadata:
   - `InstapaperBookmarkId`: External ID for sync tracking
   - `InstapaperHash`: For change detection
   - `IsStarred`, `IsArchived`: Status flags
   - `ReadingProgress`: Percentage (0-100)
   - `LastSyncDate`: Last sync timestamp

**Deduplication**: Checks for existing articles by `InstapaperBookmarkId` or normalized URL before creating.

### Ongoing Sync
**Endpoint**: `/api/article/sync-instapaper`

Syncs status changes (starred, archived, progress) using the `have` parameter with bookmark IDs and hashes to detect updates efficiently.

## Readwise Integration

### Readwise Highlights API (v2)
**Endpoint**: `/api/readwise/sync-highlights`

**Features**:
- Full sync: Imports all highlights
- Incremental sync: Uses `updatedAfter` parameter for new/updated highlights only
- Links highlights to articles/books by URL matching

**Data Stored**:
- Highlight text and notes
- Source metadata (title, author, category)
- Tags (normalized to lowercase)
- Location information
- Raw API response in `Metadata` JSONB field

### Readwise Reader API (v3)
**Endpoint**: `/api/readwise/reader/sync-documents`

**Category Filter**: Syncs only `category: "article"` documents. Videos, PDFs, tweets, and other document types are not imported.

**Process**:
1. Fetches Reader documents (articles from Reader inbox)
2. Creates/updates articles with Reader metadata:
   - `ReadwiseDocumentId`: External ID
   - `ReaderLocation`: new, later, archive, feed
   - `WordCount`, `ReadingProgress`
   - Metadata: title, author, publication, summary, thumbnail

**Content Fetching**:
**Endpoint**: `/api/article/fetch-content-bulk`

Fetches full HTML content for articles that have a `ReadwiseDocumentId` but no `FullTextContent`:
- Stored directly in PostgreSQL
- Rate-limited (300ms between requests)
- Batch processing (default 50 articles)

### Connection Validation
**Endpoint**: `/api/readwise/validate`

Validates Readwise API token before syncing operations.

## URL Normalization & Deduplication

### URL Normalization
All article URLs are normalized for accurate matching:
- Lowercase conversion
- Trailing slash removal
- Tracking parameters removed (`utm_*`, `ref`, etc.)
- Fragment identifiers removed
- Protocol standardization

### Deduplication Service
**Endpoints**:
- `/api/article/duplicates/find`: Find duplicate article groups
- `/api/article/duplicates/merge`: Merge duplicates

**Priority Logic** (highest to lowest):
1. Has Reader content (`ReadwiseDocumentId` + `FullTextContent`)
2. Has Reader metadata (`ReadwiseDocumentId`)
3. Most complete metadata (author, description, word count, etc.)
4. Oldest `DateAdded` (first imported)

**Merge Strategy**:
- Primary article selected by priority
- Metadata merged (fill gaps, don't overwrite)
- Highlights transferred to primary
- Topics and genres combined
- Duplicates deleted after merge

## Data Flow Example

### Typical User Journey
1. **Readwise Reader Sync**: User clicks "Sync Documents from Reader"
   - Articles imported with metadata
   - `SyncStatus` set to `ReaderSynced`

2. **Content Fetch**: User clicks "Fetch 25 Articles"
   - HTML content fetched for articles without `FullTextContent`
   - Stored in PostgreSQL

3. **Highlights Sync**: User clicks "Sync Readwise Highlights"
   - Highlights imported and linked to articles by URL
   - `SyncStatus` updated to include `ReadwiseSynced`

4. **Instapaper Sync** (optional): User syncs Instapaper bookmarks
   - If article URL already exists (from Reader), metadata merged
   - `SyncStatus` updated to include `InstapaperSynced`
   - Instapaper-specific fields updated (starred, archived, progress)

5. **Deduplication**: User runs "Find & Merge Duplicates"
   - Groups identified by normalized URLs
   - Preview shown before merge
   - Duplicates merged based on priority logic

## Key Features

### Cross-Source Data Merging
- Reader provides best full-text content
- Readwise provides highlights and annotations
- Instapaper provides reading progress and status flags
- All sources contribute metadata where available

### Conflict Resolution
- Reader metadata preferred (most complete)
- Instapaper status flags preserved
- Timestamps track last sync from each source
- User data (PLB-specific fields) never overwritten

### API Configuration
Environment variables (checked in order):
1. `READWISE_API_TOKEN` or `READWISE_API_KEY`
2. `appsettings.json`: `ApiKeys:Readwise`

For Instapaper:
1. `INSTAPAPER_CONSUMER_KEY`
2. `INSTAPAPER_CONSUMER_SECRET`

## Frontend Pages

- **Instapaper Auth**: `/instapaper/auth` - Authentication flow
- **Instapaper Import**: `/instapaper/import` - Import bookmarks
- **Readwise Sync**: `/readwise/sync` - All Readwise operations
- **Typesense Admin**: `/admin/typesense` - Deduplication controls

## Database Schema

### Article Table (extends MediaItems)
```
InstapaperBookmarkId (string): Instapaper bookmark ID
InstapaperHash (string): Hash for change detection
SavedToInstapaperDate (datetime): When saved to Instapaper
IsArchived (bool): Archived status
IsStarred (bool): Starred/favorited status
ReadingProgress (int): 0-100 percentage
LastSyncDate (datetime): Last Instapaper sync
ReadwiseDocumentId (string): Reader document ID
ReaderLocation (string): Reader location (new/later/archive/feed)
LastReaderSync (datetime): Last Reader sync
FullTextContent (text): Full HTML content (stored in DB)
ContentStoragePath (string): Legacy S3 path (no longer used)
SyncStatus (enum): Bitwise flags for sync sources
```

### Highlight Table
```
ReadwiseId (int): Readwise highlight ID
Text (string): Highlight text (max 8191 chars)
Note (string): User's note
SourceUrl (string): Source article URL
ArticleId (guid): Foreign key to Article
BookId (guid): Foreign key to Book
ReadwiseBookId (int): Readwise book ID
Tags (string): Comma-separated tags
Metadata (jsonb): Raw Readwise API response
```

## Best Practices

1. **Sync Order**: Reader → Readwise Highlights → Instapaper (if used)
2. **Content Fetch**: Always sync Reader documents before fetching content
3. **Deduplication**: Run periodically after imports from multiple sources
4. **Rate Limiting**: Respect API limits (Reader: 20 req/min, built-in delays)
5. **Incremental Syncs**: Use incremental highlight sync for regular updates

## Limitations

- **Article-only scope**: Only syncs documents with `category: "article"` from Readwise Reader
- **Video transcripts not supported**: YouTube videos/captions from Reader are not imported (use PLB's YouTube integration instead)
- **PDFs/EPUBs**: Treated as articles if imported to Reader, but may have formatting issues
- **Tweets/threads**: Not currently supported
- **Highlight orphaning**: Highlights from non-article sources in Readwise will be imported but won't link to media items

## Future Enhancements

- PostgreSQL full-text search on article content
- Automatic scheduled syncs
- Webhook support for real-time updates
- Export highlights back to Readwise
- Bi-directional sync with Instapaper
- Optional multi-media-type support (videos, podcasts) with configurable category filters

