# Typesense Schema Reference

**Last Updated:** December 25, 2025  
**Project:** ProjectLoopbreaker  
**Typesense Version:** Compatible with v0.25+

This document defines the complete Typesense collection schemas used in ProjectLoopbreaker. The project uses Typesense for fast, typo-tolerant search across media items and mixlists.

---

## Overview

ProjectLoopbreaker uses **2 Typesense collections**:

1. **`media_items`** - Stores searchable media content (books, articles, movies, podcasts, etc.)
2. **`mixlists`** - Stores searchable playlists/collections of media items

Both collections are automatically created on application startup via the `TypeSenseService` if they don't already exist.

---

## Collection 1: `media_items`

### Purpose
Indexes all media items from the PostgreSQL database for fast search and filtering. Supports multiple media types with type-specific fields.

### Configuration
- **Collection Name:** `media_items`
- **Default Sorting Field:** `date_added` (descending - newest first)
- **Document Model:** `MediaItemDocument.cs`

### Schema Definition

| Field Name | Type | Facetable | Optional | Indexed | Description |
|------------|------|-----------|----------|---------|-------------|
| `id` | `string` | No | No | Yes | Primary key (UUID as string) |
| `title` | `string` | No | No | Yes | Media item title (searchable) |
| `media_type` | `string` | **Yes** | No | Yes | Type: Article, Book, Movie, TVShow, Video, Podcast, Website, Channel, Playlist |
| `description` | `string` | No | **Yes** | Yes | Full text description (searchable) |
| `topics` | `string[]` | **Yes** | No | Yes | Array of topic names for filtering |
| `genres` | `string[]` | **Yes** | No | Yes | Array of genre names for filtering |
| `date_added` | `int64` | No | No | Yes | Unix timestamp (seconds) when item was added |
| `status` | `string` | **Yes** | No | Yes | Uncharted, ActivelyExploring, Completed, Abandoned |
| `rating` | `string` | **Yes** | **Yes** | Yes | SuperLike, Like, Neutral, Dislike |
| `thumbnail` | `string` | No | **Yes** | **No** | Image URL (not searchable, display only) |
| `author` | `string` | **Yes** | **Yes** | Yes | Author name (Books, Articles) |
| `director` | `string` | **Yes** | **Yes** | Yes | Director name (Movies) |
| `creator` | `string` | **Yes** | **Yes** | Yes | Creator name (TV Shows) |
| `publisher` | `string` | **Yes** | **Yes** | Yes | Publisher/Host (Podcasts) |
| `release_year` | `int32` | **Yes** | **Yes** | Yes | Release year (Movies, TV Shows) |
| `platform` | `string` | **Yes** | **Yes** | Yes | Platform name (Videos - e.g., YouTube, Vimeo) |

### C# Schema Code

```csharp
var schema = new Schema("media_items", new List<Field>
{
    new Field("id", FieldType.String, false),
    new Field("title", FieldType.String, false),
    new Field("media_type", FieldType.String, true),
    new Field("description", FieldType.String, false, optional: true),
    new Field("topics", FieldType.StringArray, true),
    new Field("genres", FieldType.StringArray, true),
    new Field("date_added", FieldType.Int64, false),
    new Field("status", FieldType.String, true),
    new Field("rating", FieldType.String, true, optional: true),
    new Field("thumbnail", FieldType.String, false, optional: true, index: false),
    new Field("author", FieldType.String, true, optional: true),
    new Field("director", FieldType.String, true, optional: true),
    new Field("creator", FieldType.String, true, optional: true),
    new Field("publisher", FieldType.String, true, optional: true),
    new Field("release_year", FieldType.Int32, true, optional: true),
    new Field("platform", FieldType.String, true, optional: true)
})
{
    DefaultSortingField = "date_added"
};
```

### Example Document

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "The Pragmatic Programmer",
  "media_type": "Book",
  "description": "From Journeyman to Master",
  "topics": ["software engineering", "career development"],
  "genres": ["technical", "programming"],
  "date_added": 1703203200,
  "status": "ActivelyExploring",
  "rating": "SuperLike",
  "thumbnail": "https://example.com/book-cover.jpg",
  "author": "David Thomas, Andrew Hunt",
  "release_year": 1999
}
```

### Search Fields
When searching, the following fields are queried by default:
- `title` (highest weight)
- `description`
- `author`
- `director`
- `creator`
- `publisher`

### Common Queries

**Search by text:**
```
query: "pragmatic programmer"
query_by: "title,description,author"
```

**Filter by media type:**
```
filter_by: "media_type:=Book"
```

**Filter by multiple genres:**
```
filter_by: "genres:=[fiction,sci-fi]"
```

**Filter by status and rating:**
```
filter_by: "status:=ActivelyExploring && rating:=SuperLike"
```

---

## Collection 2: `mixlists`

### Purpose
Indexes user-created playlists/collections of media items for search and discovery. Allows searching mixlists by name, description, or contained media titles.

### Configuration
- **Collection Name:** `mixlists`
- **Default Sorting Field:** `date_created` (descending - newest first)
- **Document Model:** `MixlistDocument.cs`

### Schema Definition

| Field Name | Type | Facetable | Optional | Indexed | Description |
|------------|------|-----------|----------|---------|-------------|
| `id` | `string` | No | No | Yes | Primary key (UUID as string) |
| `name` | `string` | No | No | Yes | Mixlist name (searchable) |
| `description` | `string` | No | **Yes** | Yes | Mixlist description (searchable) |
| `thumbnail` | `string` | No | **Yes** | **No** | Image URL (not searchable, display only) |
| `date_created` | `int64` | No | No | Yes | Unix timestamp (seconds) when created |
| `media_item_count` | `int32` | No | No | Yes | Number of items in the mixlist |
| `media_item_titles` | `string[]` | No | **Yes** | Yes | Titles of contained media (searchable) |
| `topics` | `string[]` | **Yes** | **Yes** | Yes | Aggregated topics from all media items |
| `genres` | `string[]` | **Yes** | **Yes** | Yes | Aggregated genres from all media items |

### C# Schema Code

```csharp
var schema = new Schema("mixlists", new List<Field>
{
    new Field("id", FieldType.String, false),
    new Field("name", FieldType.String, false),
    new Field("description", FieldType.String, false, optional: true),
    new Field("thumbnail", FieldType.String, false, optional: true, index: false),
    new Field("date_created", FieldType.Int64, false),
    new Field("media_item_count", FieldType.Int32, false),
    new Field("media_item_titles", FieldType.StringArray, false, optional: true),
    new Field("topics", FieldType.StringArray, true, optional: true),
    new Field("genres", FieldType.StringArray, true, optional: true)
})
{
    DefaultSortingField = "date_created"
};
```

### Example Document

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440111",
  "name": "Best Tech Books of 2024",
  "description": "A curated collection of must-read programming books",
  "thumbnail": "https://example.com/mixlist-cover.jpg",
  "date_created": 1703289600,
  "media_item_count": 12,
  "media_item_titles": [
    "The Pragmatic Programmer",
    "Clean Code",
    "Design Patterns"
  ],
  "topics": ["software engineering", "career development", "design"],
  "genres": ["technical", "programming"]
}
```

### Search Fields
When searching, the following fields are queried by default:
- `name` (highest weight)
- `description`
- `media_item_titles` (allows finding mixlists by their contents)

### Common Queries

**Search by name:**
```
query: "tech books"
query_by: "name,description"
```

**Find mixlists containing specific media:**
```
query: "pragmatic programmer"
query_by: "media_item_titles"
```

**Filter by topic:**
```
filter_by: "topics:=[software engineering]"
```

**Sort by item count:**
```
sort_by: "media_item_count:desc"
```

---

## Data Synchronization

### When Documents are Indexed

**Media Items:**
- Created: When a new media item is added via any controller
- Updated: When media item properties change (title, description, topics, genres, etc.)
- Deleted: When a media item is removed from the database

**Mixlists:**
- Created: When a new mixlist is created
- Updated: When mixlist properties change OR when media items are added/removed
- Deleted: When a mixlist is removed from the database

### Automatic Indexing
The `TypesenseIndexingHelper` class automatically handles indexing after database operations through the service layer.

### Manual Reindexing
To manually rebuild all Typesense collections:
1. Use the Typesense Admin Page in the frontend (`/admin/typesense`)
2. Click "Rebuild Index" to sync all data from PostgreSQL

---

## Implementation Files

### Backend (C#)
- **Service:** `ProjectLoopbreaker.Infrastructure/Services/TypeSenseService.cs`
- **Models:** 
  - `ProjectLoopbreaker.Infrastructure/Models/MediaItemDocument.cs`
  - `ProjectLoopbreaker.Infrastructure/Models/MixlistDocument.cs`
- **Helper:** `ProjectLoopbreaker.Application/Helpers/TypesenseIndexingHelper.cs`
- **Interface:** `ProjectLoopbreaker.Shared/Interfaces/ITypeSenseService.cs`
- **Controller:** `ProjectLoopbreaker.Web.API/Controllers/SearchController.cs`

### Frontend (React)
- **Search Component:** `frontend/src/components/Search.jsx`
- **Admin Page:** `frontend/src/components/TypesenseAdminPage.jsx`
- **API Service:** `frontend/src/services/apiService.js`

---

## Configuration

### Environment Variables

```bash
# Required in appsettings.json or environment variables
TypesenseSettings__ApiKey=your-api-key-here
TypesenseSettings__Nodes__0__Host=localhost
TypesenseSettings__Nodes__0__Port=8108
TypesenseSettings__Nodes__0__Protocol=http
```

### Development Settings
See `appsettings.Development.json` for local Typesense configuration.

### Production Settings
Production Typesense URL and API keys are configured in Render.com environment variables.

---

## Performance Notes

- **Typo Tolerance:** Typesense automatically handles spelling mistakes
- **Prefix Search:** Supports autocomplete/search-as-you-type
- **Faceted Search:** Fast filtering by media_type, status, rating, topics, genres
- **Relevance Ranking:** Results sorted by text match relevance score
- **Scalability:** Collections can handle 100K+ documents with sub-10ms search times

---

## Troubleshooting

### Collection doesn't exist
The collections are created automatically on app startup. If missing:
1. Restart the backend application
2. Check logs for Typesense connection errors
3. Verify Typesense is running and accessible

### Data out of sync
If search results don't match database:
1. Use the Typesense Admin Page to rebuild the index
2. Check logs for indexing failures
3. Verify Typesense service is running

### Search not working
1. Verify Typesense API key is configured correctly
2. Check network connectivity to Typesense server
3. Review `SearchController` logs for errors

---

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2025-12-25 | 1.0 | Initial schema documentation for media_items and mixlists collections |
| 2025-12-14 | 0.9 | Added mixlist search integration |
| 2025-11-XX | 0.8 | Initial media_items collection implementation |

