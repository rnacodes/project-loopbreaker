# Readwise Integration

## Overview

ProjectLoopbreaker integrates with **Readwise** and **Readwise Reader** to sync articles and highlights. The system uses Readwise as the **source of truth** for article status, automatically syncing reading progress and archival state.

**Scope**: Currently focused on **articles only**. While Readwise Reader supports videos, PDFs, tweets, and other media types, this integration specifically syncs article-type documents and their associated highlights. Other media types in PLB (videos, podcasts, books) are managed through their respective integrations (YouTube API, ListenNotes, Open Library, etc.).

## Architecture

### Data Storage
- **Articles**: Metadata and full HTML content stored directly in PostgreSQL
- **Highlights**: All highlight data stored in PostgreSQL with JSONB metadata field
- **No external storage**: Content stored directly in database

### Sync Status Tracking
Articles track their sync state using a `SyncStatus` enum (flags):
- `LocalOnly` (0): Manually added to PLB
- `ReadwiseSynced` (2): Highlights synced from Readwise
- `ReaderSynced` (4): Synced from Readwise Reader
- `FullySynced`: Combination of all flags

### Status Mapping (Readwise = Source of Truth)
When syncing from Readwise Reader, the PLB status is automatically updated based on Reader location:

| Reader Location | PLB Status | Notes |
|-----------------|------------|-------|
| `new` | Uncharted | To Be Explored |
| `later` | Uncharted | To Be Explored |
| `feed` | Uncharted | To Be Explored |
| `archive` | Completed | **Always updates** - Readwise is source of truth |

## Unified Sync Endpoint

### Sync All
**Endpoint**: `POST /api/readwise/sync`

**Parameters**:
- `incremental` (query, bool, default: true): If true, only syncs items from the last 7 days

**Process**:
1. Syncs Reader documents (article metadata)
2. Syncs Readwise highlights (with auto-linking to articles)
3. Returns combined result

**Response**:
```json
{
  "success": true,
  "articlesCreated": 5,
  "articlesUpdated": 12,
  "highlightsCreated": 25,
  "highlightsUpdated": 3,
  "highlightsLinked": 20,
  "startedAt": "2024-01-01T00:00:00Z",
  "completedAt": "2024-01-01T00:00:15Z"
}
```

### Fetch Content (Archival)
**Endpoint**: `POST /api/readwise/fetch-content`

**Parameters**:
- `batchSize` (query, int, default: 50): Number of articles to fetch
- `recentOnly` (query, bool, default: false): If true, only fetch articles synced in last 7 days

**Key Behavior**:
- **Only fetches Completed/Archived articles**: Content is only fetched for articles that have been archived in Reader (archival purpose)
- **Consistent ordering**: Articles are processed by DateAdded for proper pagination
- **Incremental progress**: Each fetch gets the next batch that doesn't have content yet

## Readwise Highlights API (v2)

### Export Endpoint (Optimized)
Uses the `/export/` endpoint instead of individual highlight fetches:
- Returns books with nested highlights array
- Eliminates N+1 queries
- Supports `updatedAfter` for incremental sync

### Auto-Linking
Highlights are automatically linked to articles during sync by matching source URLs.

### Data Stored
- Highlight text and notes
- Source metadata (title, author, category)
- Tags (normalized to lowercase)
- Location information
- Raw API response in `Metadata` JSONB field

## Readwise Reader API (v3)

### Document Sync
**Internal Method**: `ReaderService.SyncDocumentsAsync()`

**Category Filter**: Syncs only `category: "article"` documents. Videos, PDFs, tweets, and other document types are not imported.

**Process**:
1. Fetches Reader documents (articles from Reader inbox)
2. Creates/updates articles with Reader metadata:
   - `ReadwiseDocumentId`: External ID
   - `ReaderLocation`: new, later, archive, feed
   - `WordCount`, `ReadingProgress`
   - Metadata: title, author, publication, summary, thumbnail
3. Updates PLB Status based on Reader location (Readwise = source of truth)

### Content Fetching
**Internal Method**: `ReaderService.BulkFetchArticleContentsAsync()`

Fetches full HTML content for archived articles:
- Only articles with `Status == Completed` are fetched
- Ordered by `DateAdded` for consistent pagination
- Rate-limited (delays between requests)
- Stored directly in PostgreSQL

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
- `GET /api/article/duplicates`: Find duplicate article groups
- `POST /api/article/deduplicate`: Merge duplicates

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

## Frontend UI

### Readwise Sync Page (`/readwise-sync`)

Two main sections:

**Sync Articles & Highlights**
- Full Sync: Syncs all articles and highlights
- Sync Last 7 Days: Incremental sync for recent changes
- Automatic status mapping and highlight linking

**Fetch Article Content (Archival)**
- Fetch 25/50: Fetch next batch of archived articles
- Fetch Recently Synced: Only articles synced in last 7 days
- Pagination: Each click fetches next batch in order

## Database Schema

### Article Table (extends MediaItems)
```
IsArchived (bool): Archived status from Reader
IsStarred (bool): Starred/favorited status
ReadingProgress (int): 0-100 percentage
LastSyncDate (datetime): Last sync
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

## API Configuration

Environment variables (checked in order):
1. `READWISE_API_TOKEN` or `READWISE_API_KEY`
2. `appsettings.json`: `ApiKeys:Readwise`

## Best Practices

1. **Regular Sync**: Use incremental sync (7 days) for regular updates
2. **Content Archival**: Fetch content for archived articles periodically
3. **Deduplication**: Run periodically if importing from multiple sources
4. **Rate Limiting**: Built-in delays respect API limits

## Limitations

- **Article-only scope**: Only syncs documents with `category: "article"` from Readwise Reader
- **Video transcripts not supported**: YouTube videos/captions from Reader are not imported
- **PDFs/EPUBs**: May have formatting issues in content fetch
- **Tweets/threads**: Not currently supported
- **Highlight orphaning**: Highlights from non-article sources won't link to media items

## Future Enhancements

- PostgreSQL full-text search on article content
- Automatic scheduled syncs
- Webhook support for real-time updates
- Export highlights back to Readwise
