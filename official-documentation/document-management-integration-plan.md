# Document Management System Integration Plan

## Overview

Integrate **Paperless-ngx** as the document management backend for a new `Document` media type in ProjectLoopbreaker. Documents will appear alongside books, movies, etc. with full topics/genres/mixlists support.

**Architecture**: Self-hosted Paperless-ngx + REST API bridge to ProjectLoopbreaker

---

## Phase 1: Infrastructure Setup

### 1.1 Deploy Paperless-ngx via Docker Compose

Create `paperless-ngx/docker-compose.yml`:
- Redis broker for task queue
- PostgreSQL database (separate from PLB's database)
- Paperless-ngx webserver on port 8000
- Volumes for data, media, export, and consume folders

### 1.2 Environment Variables

Add to ProjectLoopbreaker:
```
PAPERLESS_API_URL=http://localhost:8000/api
PAPERLESS_API_TOKEN=<generated-token>
```

---

## Phase 2: Backend Implementation

### 2.1 Create Paperless DTOs
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Shared/DTOs/Paperless/PaperlessDocumentDto.cs`
- `PaperlessDocumentDto` - document metadata (id, title, content, correspondent, document_type, tags, etc.)
- `PaperlessDocumentListResponseDto` - paginated response
- `PaperlessTagDto`, `PaperlessDocumentTypeDto`, `PaperlessCorrespondentDto`
- `PaperlessSearchResultDto`

### 2.2 Create API Client Interface
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Shared/Interfaces/IPaperlessApiClient.cs`
- Document CRUD: `GetDocumentsAsync`, `GetDocumentByIdAsync`, `SearchDocumentsAsync`
- File operations: `GetDocumentContentAsync`, `GetDocumentThumbnailAsync`, `UploadDocumentAsync`
- Metadata: `GetTagsAsync`, `GetDocumentTypesAsync`, `GetCorrespondentsAsync`
- Health check: `IsAvailableAsync`

### 2.3 Implement API Client
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure/Clients/PaperlessApiClient.cs`
- Follow pattern from `OpenLibraryApiClient.cs`
- HttpClient with token authentication
- JSON deserialization with snake_case property naming
- Async/await with error logging

### 2.4 Create Document Entity
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Domain/Entities/Document.cs`
- Extends `BaseMediaItem` (inherits Title, Description, Topics, Genres, Mixlists, etc.)
- Document-specific properties:
  - `PaperlessId` (int?) - external ID for syncing
  - `OriginalFileName`, `ArchiveSerialNumber`
  - `DocumentType`, `Correspondent` (from Paperless categories)
  - `OcrContent` (full-text for local search)
  - `DocumentDate`, `PageCount`, `FileType`, `FileSizeBytes`
  - `PaperlessTags` (List<string>)
  - `PaperlessUrl`, `LastPaperlessSync`, `IsArchived`

### 2.5 Create Document DTOs
**New files**:
- `src/ProjectLoopbreaker/ProjectLoopbreaker.DTOs/CreateDocumentDto.cs`
- `src/ProjectLoopbreaker/ProjectLoopbreaker.DTOs/DocumentResponseDto.cs`
- `src/ProjectLoopbreaker/ProjectLoopbreaker.DTOs/DocumentSyncResultDto.cs`

### 2.6 Create Document Service
**New files**:
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Application/Interfaces/IDocumentService.cs`
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Application/Services/DocumentService.cs`

Methods:
- CRUD: `GetAllDocumentsAsync`, `GetDocumentByIdAsync`, `CreateDocumentAsync`, `UpdateDocumentAsync`, `DeleteDocumentAsync`
- Query: `GetDocumentsByTypeAsync`, `GetDocumentsByCorrespondentAsync`, `SearchDocumentsAsync`
- Sync: `SyncFromPaperlessAsync`, `SyncSingleDocumentAsync`

### 2.7 Create Document Mapping Service
**New files**:
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Application/Interfaces/IDocumentMappingService.cs`
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Application/Services/DocumentMappingService.cs`

Features:
- Map Paperless documents to PLB Document entities
- Map Paperless tags to Topics/Genres (prefix-based: `topic:`, `genre:`)
- Map to response DTOs

### 2.8 Create Document Controller
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/DocumentController.cs`

Endpoints:
- `GET /api/document` - Get all documents
- `GET /api/document/{id}` - Get single document
- `POST /api/document` - Create document
- `PUT /api/document/{id}` - Update document
- `DELETE /api/document/{id}` - Delete document
- `POST /api/document/sync-paperless` - Sync from Paperless
- `GET /api/document/by-type/{type}` - Filter by document type
- `GET /api/document/search?query=` - Search documents

### 2.9 Database Updates

**Modify**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Domain/Interfaces/IApplicationDbContext.cs`
- Add `IQueryable<Document> Documents { get; }`

**Modify**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure/Data/MediaLibraryDbContext.cs`
- Add `DbSet<Document> Documents`
- Add entity configuration with indexes on `PaperlessId`, `DocumentType`, `Correspondent`

**Create migration**:
```bash
cd src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API
dotnet ef migrations add AddDocumentEntity --project ..\ProjectLoopbreaker.Infrastructure
dotnet ef database update --project ..\ProjectLoopbreaker.Infrastructure
```

### 2.10 Register Services
**Modify**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Program.cs`
- Register `IPaperlessApiClient` with HttpClient and token auth
- Register `IDocumentService`, `IDocumentMappingService`

---

## Phase 3: Frontend Implementation

### 3.1 Create Document API Service
**New file**: `frontend/src/api/documentService.js`
- `getAllDocuments`, `getDocumentById`, `createDocument`, `updateDocument`, `deleteDocument`
- `syncDocumentsFromPaperless`
- `getDocumentsByType`, `searchDocuments`

### 3.2 Create Documents Page
**New file**: `frontend/src/components/DocumentsPage.jsx`
- Grid/list view toggle
- Search and filter by document type
- Sort by date added, document date, title
- Sync button for Paperless import
- File type icons (PDF, image, generic)

### 3.3 Create Document Card Component
**New file**: `frontend/src/components/shared/DocumentCard.jsx`
- Thumbnail or file type icon
- Title, correspondent, document type chip
- File size display
- Click to navigate to media profile

### 3.4 Update Routes
**Modify**: `frontend/src/App.jsx`
- Add route: `/documents` -> `DocumentsPage`

### 3.5 Update API Exports
**Modify**: `frontend/src/api/index.js`
- Export document service functions

### 3.6 Update Navigation (optional)
**Modify**: Navigation component to include Documents link

---

## Phase 4: Tag/Topic Mapping Strategy

### Paperless Tags -> PLB Topics/Genres

| Paperless Tag Pattern | Maps To |
|-----------------------|---------|
| `topic:finance` | Topic: "finance" |
| `genre:reference` | Genre: "reference" |
| Known genres (fiction, non-fiction, etc.) | Genre |
| All other tags | Topic (default) |

Store original tags in `PaperlessTags` field for reference.

---

## Phase 5: Search Integration

### Typesense Indexing
- Index document metadata: title, description, document_type, correspondent
- Index OCR content (truncated to 50KB) for full-text search
- Use existing `TypesenseIndexingHelper` pattern

### Local Search Fallback
- PostgreSQL ILike search on title, correspondent, description
- OCR content search when Typesense unavailable

---

## Phase 6: Testing

### Backend Tests
- `tests/ProjectLoopbreaker.UnitTests/Services/DocumentServiceTests.cs`
- `tests/ProjectLoopbreaker.UnitTests/Clients/PaperlessApiClientTests.cs`

### Frontend Tests
- `frontend/src/components/__tests__/DocumentsPage.test.jsx`
- `frontend/src/components/__tests__/DocumentCard.test.jsx`

---

## Phase 7 (Optional): Calibre eBook Library Sync

> **Status**: Optional enhancement for future consideration
> **Purpose**: Auto-populate Book entities from existing Calibre library
> **Prerequisite**: Existing Calibre library with `metadata.db`

### 7.1 Overview

Calibre is a dedicated eBook management tool (format conversion, e-reader sync, in-browser reading). This optional integration provides **one-way metadata sync** from Calibre to ProjectLoopbreaker's existing Book entity - not file serving.

| Tool | Role |
|------|------|
| **Calibre Desktop** | Manage actual eBook files (EPUB, MOBI, PDF), format conversion, send to devices |
| **ProjectLoopbreaker Books** | Track reading status, ratings, topics, genres, mixlists |
| **This Integration** | Import book metadata from Calibre → PLB Book entities |

### 7.2 Integration Options

#### Option A: Calibre Content Server AJAX API (Recommended)
Use Calibre's built-in content server which exposes a JSON API.

**Setup**:
1. Enable Calibre Content Server: `Preferences > Sharing > Sharing over the net`
2. Set port (default: 8080) and optionally enable authentication
3. Access API at `http://localhost:8080/ajax/`

**Key Endpoints**:
- `GET /ajax/library-info` - Library metadata
- `GET /ajax/books/{library_id}` - List all books with metadata
- `GET /ajax/book/{book_id}/{library_id}` - Single book details
- `GET /ajax/cover/{book_id}/{library_id}` - Book cover image

**Environment Variables**:
```
CALIBRE_SERVER_URL=http://localhost:8080
CALIBRE_SERVER_USERNAME=<optional>
CALIBRE_SERVER_PASSWORD=<optional>
```

#### Option B: calibre-rest (Third-Party Wrapper)
Use [calibre-rest](https://github.com/kencx/calibre-rest) - a Flask-based REST API wrapper.

**Pros**: Cleaner REST interface, better documentation
**Cons**: Additional service to deploy and maintain

#### Option C: Direct Database Access
Read Calibre's SQLite `metadata.db` directly.

**Pros**: No server required, fastest
**Cons**: Must have filesystem access to Calibre library, less flexible

### 7.3 Backend Implementation

#### 7.3.1 Create Calibre DTOs
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Shared/DTOs/Calibre/CalibreBookDto.cs`

```csharp
public class CalibreBookDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public List<string> Authors { get; set; }
    public string Isbn { get; set; }
    public string Publisher { get; set; }
    public DateTime? PublicationDate { get; set; }
    public string Description { get; set; }
    public List<string> Tags { get; set; }
    public string Series { get; set; }
    public double? SeriesIndex { get; set; }
    public List<string> Formats { get; set; } // epub, mobi, pdf, etc.
    public string CoverUrl { get; set; }
    public DateTime LastModified { get; set; }
}
```

#### 7.3.2 Create Calibre API Client Interface
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Shared/Interfaces/ICalibreApiClient.cs`

```csharp
public interface ICalibreApiClient
{
    Task<List<CalibreBookDto>> GetAllBooksAsync();
    Task<CalibreBookDto?> GetBookByIdAsync(int id);
    Task<byte[]> GetBookCoverAsync(int id);
    Task<List<string>> GetLibrariesAsync();
    Task<bool> IsAvailableAsync();
}
```

#### 7.3.3 Implement API Client
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure/Clients/CalibreApiClient.cs`
- HTTP client for Calibre Content Server AJAX endpoints
- Basic auth support if configured
- JSON parsing of Calibre's response format

#### 7.3.4 Create Calibre Sync Service
**New file**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Application/Services/CalibreSyncService.cs`

```csharp
public interface ICalibreSyncService
{
    Task<CalibreSyncResultDto> SyncBooksFromCalibreAsync();
    Task<Book?> SyncSingleBookAsync(int calibreId);
}
```

**Sync Logic**:
1. Fetch all books from Calibre
2. For each book, check if exists in PLB (by ISBN or title+author match)
3. If not exists → Create new Book entity
4. If exists → Update metadata (optional, configurable)
5. Download and upload cover images to DigitalOcean Spaces
6. Map Calibre tags to Topics/Genres

#### 7.3.5 Add Book Entity Fields
**Modify**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Domain/Entities/Book.cs`

Add optional fields:
```csharp
public int? CalibreId { get; set; }           // External ID for syncing
public DateTime? LastCalibreSync { get; set; } // Last sync timestamp
public string? CalibreFormats { get; set; }    // Available formats (epub, mobi, etc.)
```

#### 7.3.6 Add Controller Endpoint
**Modify**: `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/BookController.cs`

Add endpoint:
```csharp
// POST: api/book/sync-calibre
[HttpPost("sync-calibre")]
public async Task<ActionResult<CalibreSyncResultDto>> SyncFromCalibre()
```

### 7.4 Frontend Implementation

#### 7.4.1 Add Sync Button to Books Page
**Modify**: `frontend/src/components/BooksPage.jsx` (or equivalent)

Add "Sync from Calibre" button next to existing import options:
```jsx
<Button
    startIcon={<SyncIcon />}
    onClick={handleCalibreSync}
    disabled={syncing}
>
    {syncing ? 'Syncing...' : 'Sync from Calibre'}
</Button>
```

#### 7.4.2 Add API Service Function
**Modify**: `frontend/src/api/bookService.js`

```javascript
export const syncBooksFromCalibre = async () => {
    const response = await apiClient.post('/book/sync-calibre');
    return response.data;
};
```

### 7.5 Tag Mapping Strategy

| Calibre Tag | Maps To |
|-------------|---------|
| `topic:*` prefix | Topic |
| `genre:*` prefix | Genre |
| Common genres (fiction, mystery, sci-fi, etc.) | Genre |
| All other tags | Topic (default) |

### 7.6 Sync Behavior Options

Configure via environment variables or admin settings:

| Setting | Options |
|---------|---------|
| `CALIBRE_SYNC_MODE` | `add_only` (default), `update_existing`, `full_sync` |
| `CALIBRE_SYNC_COVERS` | `true` (default), `false` |
| `CALIBRE_MATCH_BY` | `isbn` (default), `title_author`, `both` |

### 7.7 Files to Create/Modify

**New Files**:
- `src/.../Shared/DTOs/Calibre/CalibreBookDto.cs`
- `src/.../Shared/Interfaces/ICalibreApiClient.cs`
- `src/.../Infrastructure/Clients/CalibreApiClient.cs`
- `src/.../Application/Services/CalibreSyncService.cs`
- `src/.../DTOs/CalibreSyncResultDto.cs`

**Modified Files**:
- `src/.../Domain/Entities/Book.cs` (add CalibreId, LastCalibreSync)
- `src/.../Web.API/Controllers/BookController.cs` (add sync endpoint)
- `src/.../Web.API/Program.cs` (register Calibre services)
- `frontend/src/api/bookService.js` (add sync function)
- `frontend/src/components/BooksPage.jsx` (add sync button)

### 7.8 When to Implement

Consider implementing Calibre sync if:
- You frequently add books to Calibre and want them auto-populated in PLB
- You want to avoid manual double-entry of book metadata
- You want Calibre tags to automatically become PLB topics/genres

Skip if:
- You primarily use Open Library/Goodreads import (already working)
- Your Calibre library is stable and you've already added books to PLB
- You prefer manual control over which books appear in PLB

---

## Critical Files to Reference

| Pattern | Reference File |
|---------|---------------|
| Entity structure | `src/.../Domain/Entities/Article.cs` |
| API client | `src/.../Infrastructure/Clients/OpenLibraryApiClient.cs` |
| Service implementation | `src/.../Application/Services/ArticleService.cs` |
| Controller | `src/.../Web.API/Controllers/ArticleController.cs` |
| Frontend API service | `frontend/src/api/articleService.js` |
| Frontend page | `frontend/src/components/ArticlesPage.jsx` |
| DI registration | `src/.../Web.API/Program.cs` |
| DbContext | `src/.../Infrastructure/Data/MediaLibraryDbContext.cs` |

---

## Implementation Order

1. **Infrastructure**: Deploy Paperless-ngx via Docker
2. **Backend DTOs & Client**: Create Paperless DTOs and API client
3. **Backend Entity & DB**: Create Document entity, run migration
4. **Backend Services**: Implement DocumentService, mapping service
5. **Backend Controller**: Create DocumentController with all endpoints
6. **Frontend API**: Create documentService.js
7. **Frontend UI**: Create DocumentsPage and DocumentCard components
8. **Testing**: Write unit and integration tests

---

## Sources Referenced

### Document Management (Paperless-ngx)
- [Paperless-ngx Documentation](https://docs.paperless-ngx.com/)
- [Paperless-ngx API](https://docs.paperless-ngx.com/api/)
- [FormKiQ - Best Open Source EDMS 2025](https://formkiq.com/blog/the-state-of-edms/the-ten-best-open-source-edms-in-2025/)
- [Self-Hosted DMS Applications](https://noted.lol/self-hosted-dms-applications/)

### eBook Management (Calibre) - Optional
- [Calibre Official Website](https://calibre-ebook.com/)
- [Calibre Content Server Documentation](https://manual.calibre-ebook.com/server.html)
- [Calibre Database API](https://manual.calibre-ebook.com/db_api.html)
- [calibre-rest - Third-Party REST API Wrapper](https://github.com/kencx/calibre-rest)
- [Calibre-Web - Web Interface for Calibre](https://github.com/janeczku/calibre-web)
