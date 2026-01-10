# Document Management Service Overview

## Summary

The Document Management Service integrates **Paperless-ngx** with ProjectLoopbreaker, enabling you to manage documents (PDFs, scanned papers, receipts, contracts, etc.) alongside your other media types like books, movies, and podcasts.

**Architecture**: Self-hosted Paperless-ngx → REST API → ProjectLoopbreaker

---

## How It Works

### Data Flow

```
┌─────────────────────┐      ┌──────────────────────────────────┐
│   Paperless-ngx     │      │       ProjectLoopbreaker         │
│  (Document Store)   │      │                                  │
│                     │ API  │  ┌────────────────────────────┐  │
│  • OCR Processing   │─────►│  │ PaperlessApiClient         │  │
│  • ML Tagging       │      │  └─────────┬──────────────────┘  │
│  • Full-text Search │      │            │                     │
│  • File Storage     │      │  ┌─────────▼──────────────────┐  │
│                     │      │  │ DocumentMappingService     │  │
└─────────────────────┘      │  │ (Tags → Topics/Genres)     │  │
                             │  └─────────┬──────────────────┘  │
                             │            │                     │
                             │  ┌─────────▼──────────────────┐  │
                             │  │ DocumentService            │  │
                             │  │ (CRUD, Sync, Search)       │  │
                             │  └─────────┬──────────────────┘  │
                             │            │                     │
                             │  ┌─────────▼──────────────────┐  │
                             │  │ PostgreSQL (Documents)     │  │
                             │  └────────────────────────────┘  │
                             └──────────────────────────────────┘
```

### Key Features

1. **Sync from Paperless**: Import document metadata (title, OCR text, tags, correspondent, document type) from Paperless-ngx into ProjectLoopbreaker
2. **Tag Mapping**: Paperless tags automatically map to PLB Topics/Genres:
   - `topic:finance` → Topic "finance"
   - `genre:reference` → Genre "reference"
   - Known genres (fiction, non-fiction, reference, etc.) → Genre
   - All other tags → Topic (default)
3. **Full-text Search**: OCR content stored locally for Typesense indexing
4. **Media Integration**: Documents appear in mixlists, search results, and media views like any other media type

---

## Implementation Status

### Backend - COMPLETE

| Component | Status | File Location |
|-----------|--------|---------------|
| Paperless DTOs | ✅ Done | `ProjectLoopbreaker.Shared/DTOs/Paperless/` |
| IPaperlessApiClient | ✅ Done | `ProjectLoopbreaker.Shared/Interfaces/IPaperlessApiClient.cs` |
| PaperlessApiClient | ✅ Done | `ProjectLoopbreaker.Infrastructure/Clients/PaperlessApiClient.cs` |
| Document Entity | ✅ Done | `ProjectLoopbreaker.Domain/Entities/Document.cs` |
| Document DTOs | ✅ Done | `ProjectLoopbreaker.DTOs/CreateDocumentDto.cs`, `DocumentResponseDto.cs`, `DocumentSyncResultDto.cs` |
| IDocumentService | ✅ Done | `ProjectLoopbreaker.Application/Interfaces/IDocumentService.cs` |
| DocumentService | ✅ Done | `ProjectLoopbreaker.Application/Services/DocumentService.cs` |
| IDocumentMappingService | ✅ Done | `ProjectLoopbreaker.Application/Interfaces/IDocumentMappingService.cs` |
| DocumentMappingService | ✅ Done | `ProjectLoopbreaker.Application/Services/DocumentMappingService.cs` |
| DocumentController | ✅ Done | `ProjectLoopbreaker.Web.API/Controllers/DocumentController.cs` |
| DbContext Updates | ✅ Done | `IApplicationDbContext.cs`, `MediaLibraryDbContext.cs` |
| Service Registration | ✅ Done | `Program.cs` (lines 311-313, 404-437) |
| Database Migration | ✅ Created | `20260105205100_AddDocumentEntity.cs` |

### Frontend - COMPLETE

| Component | Status | File Location |
|-----------|--------|---------------|
| Document API Service | ✅ Done | `frontend/src/api/documentService.js` |
| DocumentsPage | ✅ Done | `frontend/src/components/DocumentsPage.jsx` |
| DocumentCard | ✅ Done | `frontend/src/components/shared/DocumentCard.jsx` |
| Route Configuration | ✅ Done | `frontend/src/App.jsx` (route: `/documents`) |
| API Exports | ✅ Done | `frontend/src/api/index.js` |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/document` | Get all documents |
| GET | `/api/document/{id}` | Get document by ID |
| POST | `/api/document` | Create a document |
| PUT | `/api/document/{id}` | Update a document |
| DELETE | `/api/document/{id}` | Delete a document |
| GET | `/api/document/by-type/{type}` | Filter by document type |
| GET | `/api/document/by-correspondent/{correspondent}` | Filter by correspondent |
| GET | `/api/document/search?query=` | Search documents |
| POST | `/api/document/sync-paperless` | Sync all documents from Paperless |
| POST | `/api/document/sync-paperless/{paperlessId}` | Sync single document |
| GET | `/api/document/paperless-status` | Check Paperless connection status |

---

## Next Steps to Complete Setup

### Step 1: Deploy Paperless-ngx

Create a `docker-compose.yml` file for Paperless-ngx:

```yaml
version: "3.4"
services:
  broker:
    image: docker.io/library/redis:7
    restart: unless-stopped
    volumes:
      - redisdata:/data

  db:
    image: docker.io/library/postgres:15
    restart: unless-stopped
    volumes:
      - pgdata:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: paperless
      POSTGRES_USER: paperless
      POSTGRES_PASSWORD: paperless

  webserver:
    image: ghcr.io/paperless-ngx/paperless-ngx:latest
    restart: unless-stopped
    depends_on:
      - db
      - broker
    ports:
      - "8000:8000"
    volumes:
      - data:/usr/src/paperless/data
      - media:/usr/src/paperless/media
      - ./export:/usr/src/paperless/export
      - ./consume:/usr/src/paperless/consume
    environment:
      PAPERLESS_REDIS: redis://broker:6379
      PAPERLESS_DBHOST: db
      PAPERLESS_SECRET_KEY: <generate-a-random-secret>
      PAPERLESS_ADMIN_USER: admin
      PAPERLESS_ADMIN_PASSWORD: <your-password>
      PAPERLESS_OCR_LANGUAGE: eng

volumes:
  data:
  media:
  pgdata:
  redisdata:
```

Run with: `docker-compose up -d`

Access Paperless-ngx at: `http://localhost:8000`

### Step 2: Generate API Token

1. Log into Paperless-ngx admin panel
2. Navigate to **Settings → API Tokens** (or Admin → Django Admin → Auth Tokens)
3. Create a new token for your user
4. Copy the token value

### Step 3: Configure Environment Variables

Add to your ProjectLoopbreaker environment (or `appsettings.json`):

```bash
# Option A: Environment Variables
PAPERLESS_API_URL=http://localhost:8000/api
PAPERLESS_API_TOKEN=your-generated-token-here

# Option B: appsettings.json
{
  "Paperless": {
    "ApiUrl": "http://localhost:8000/api",
    "ApiToken": "your-generated-token-here"
  }
}
```

### Step 4: Apply Database Migration

From the `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/` directory:

```powershell
dotnet ef database update --project ..\ProjectLoopbreaker.Infrastructure
```

This creates the `Documents` table in your PostgreSQL database.

### Step 5: Verify Setup

1. Start ProjectLoopbreaker API
2. Check the console for: `"Paperless-ngx API client configured successfully."`
3. Test the connection: `GET /api/document/paperless-status`
4. Navigate to `/documents` in the frontend

### Step 6: Sync Documents

1. Upload some documents to Paperless-ngx (via web UI or consume folder)
2. Wait for OCR processing to complete
3. Click "Sync from Paperless" button on Documents page, or call:
   ```
   POST /api/document/sync-paperless
   ```

---

## Tag Mapping Strategy

When syncing from Paperless, tags are automatically mapped:

| Paperless Tag | PLB Mapping |
|--------------|-------------|
| `topic:finance` | Topic: "finance" |
| `genre:reference` | Genre: "reference" |
| `fiction`, `non-fiction`, `reference`, `biography`, `history`, `science`, `technology`, `philosophy`, `self-help`, `business`, `health`, `travel`, `cooking`, `art`, `music`, `religion`, `politics`, `education`, `entertainment`, `sports`, `nature`, `memoir`, `essays`, `poetry`, `drama`, `comedy`, `horror`, `mystery`, `thriller`, `romance`, `fantasy`, `sci-fi`, `documentary` | Genre (auto-detected) |
| All other tags | Topic (default) |

Original Paperless tags are preserved in the `PaperlessTagsCsv` field for reference.

---

## Document Entity Properties

The Document entity extends `BaseMediaItem` and includes:

| Property | Type | Description |
|----------|------|-------------|
| PaperlessId | int? | External ID from Paperless-ngx |
| OriginalFileName | string? | Original uploaded filename |
| ArchiveSerialNumber | string? | Paperless archive number |
| DocumentType | string? | Category (Invoice, Receipt, Contract, etc.) |
| Correspondent | string? | Sender/source (Amazon, IRS, Bank, etc.) |
| OcrContent | string? | Full OCR text for search |
| DocumentDate | DateTime? | Date on the document itself |
| PageCount | int? | Number of pages |
| FileType | string? | Extension (pdf, png, jpg, etc.) |
| FileSizeBytes | long? | File size |
| PaperlessTagsCsv | string? | Original tags as CSV |
| CustomFieldsJson | string? | Custom fields as JSON |
| LastPaperlessSync | DateTime? | Last sync timestamp |
| PaperlessUrl | string? | URL to view in Paperless |
| IsArchived | bool | Whether finalized in Paperless |

Plus inherited from BaseMediaItem: Title, Description, Topics, Genres, Mixlists, CoverImageUrl, etc.

---

## Troubleshooting

### "Paperless-ngx API is not configured"

This warning appears at startup if environment variables are missing. Set `PAPERLESS_API_URL` and `PAPERLESS_API_TOKEN`.

### Sync returns no documents

- Verify Paperless-ngx is accessible at the configured URL
- Check that documents exist and have finished OCR processing
- Test API directly: `curl -H "Authorization: Token YOUR_TOKEN" http://localhost:8000/api/documents/`

### Documents not appearing in search

- Ensure Typesense is configured and running
- Documents are indexed during sync; try re-syncing
- Check that `OcrContent` is being populated

---

## Optional: Calibre Integration

See the "Phase 7 (Optional): Calibre eBook Library Sync" section in `document-management-integration-plan.md` for instructions on syncing your Calibre eBook library to the Book entity.

---

## Files Reference

### Backend Files

```
src/ProjectLoopbreaker/
├── ProjectLoopbreaker.Shared/
│   ├── DTOs/Paperless/
│   │   ├── PaperlessDocumentDto.cs
│   │   ├── PaperlessTagDto.cs
│   │   ├── PaperlessDocumentTypeDto.cs
│   │   └── PaperlessCorrespondentDto.cs
│   └── Interfaces/
│       └── IPaperlessApiClient.cs
├── ProjectLoopbreaker.Infrastructure/
│   ├── Clients/
│   │   └── PaperlessApiClient.cs
│   └── Migrations/
│       └── 20260105205100_AddDocumentEntity.cs
├── ProjectLoopbreaker.Domain/
│   └── Entities/
│       └── Document.cs
├── ProjectLoopbreaker.DTOs/
│   ├── CreateDocumentDto.cs
│   ├── DocumentResponseDto.cs
│   └── DocumentSyncResultDto.cs
├── ProjectLoopbreaker.Application/
│   ├── Interfaces/
│   │   ├── IDocumentService.cs
│   │   └── IDocumentMappingService.cs
│   └── Services/
│       ├── DocumentService.cs
│       └── DocumentMappingService.cs
└── ProjectLoopbreaker.Web.API/
    └── Controllers/
        └── DocumentController.cs
```

### Frontend Files

```
frontend/src/
├── api/
│   ├── documentService.js
│   └── index.js (exports)
├── components/
│   ├── DocumentsPage.jsx
│   └── shared/
│       └── DocumentCard.jsx
└── App.jsx (route: /documents)
```
