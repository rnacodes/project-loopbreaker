# Obsidian Notes Integration

## Overview

ProjectLoopbreaker now supports integrating Obsidian notes from Quartz-published vaults. Notes are stored as a separate entity (not inheriting from BaseMediaItem) and can be linked to any media item via a many-to-many relationship. This enables you to connect your personal knowledge base with your media library.

### Key Features

- **Two Vault Support**: Sync notes from two Quartz vaults (general and programming)
- **Many-to-Many Linking**: Link any note to any media item with optional descriptions
- **Full-Text Search**: Notes are indexed in Typesense for fast searching
- **Background Sync**: Automatic periodic sync from Quartz vaults
- **Delta Sync**: Only updates changed notes using SHA-256 content hashing
- **Authentication Support**: Works with password-protected Quartz vaults

### Architecture

```
Note Entity (separate from BaseMediaItem)
    │
    ├── id, slug, title, content, description
    ├── vaultName ("general" or "programming")
    ├── sourceUrl (link back to Quartz page)
    ├── tags (array, stored as JSONB)
    ├── dateImported, lastSyncedAt
    └── contentHash (SHA-256 for change detection)

MediaItemNote Join Table
    │
    ├── noteId → Note
    ├── mediaItemId → BaseMediaItem
    ├── linkedAt
    └── linkDescription (optional context)
```

---

## Setup Steps

### 1. Database Migration

The migration `AddObsidianNotes` should already be applied. If not, run:

```powershell
cd src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API
dotnet ef database update --project ..\ProjectLoopbreaker.Infrastructure\ProjectLoopbreaker.Infrastructure.csproj
```

### 2. Configure Vault URLs

Add the following to your `appsettings.json` or environment variables:

#### Option A: appsettings.json

```json
{
  "ObsidianNoteSync": {
    "Enabled": true,
    "IntervalHours": 6,
    "InitialDelayMinutes": 10,
    "GeneralVaultUrl": "https://garden.mymediaverseuniverse.com",
    "GeneralVaultAuthToken": "",
    "ProgrammingVaultUrl": "https://hackerman.mymediaverseuniverse.com",
    "ProgrammingVaultAuthToken": ""
  }
}
```

#### Option B: Environment Variables (Recommended for Production)

```bash
# Enable background sync
OBSIDIAN_SYNC_ENABLED=true
OBSIDIAN_SYNC_INTERVAL_HOURS=6

# General vault (garden)
OBSIDIAN_GENERAL_VAULT_URL=https://garden.mymediaverseuniverse.com
OBSIDIAN_GENERAL_VAULT_AUTH_TOKEN=your-token-here

# Programming vault (hackerman)
OBSIDIAN_PROGRAMMING_VAULT_URL=https://hackerman.mymediaverseuniverse.com
OBSIDIAN_PROGRAMMING_VAULT_AUTH_TOKEN=your-token-here
```

### 3. Quartz Vault Requirements

Your Quartz vault must expose the content index at `/static/contentIndex.json`. This is the default behavior for Quartz 4.x sites.

The content index should have this structure:
```json
{
  "note-slug": {
    "title": "Note Title",
    "content": "Full markdown content...",
    "description": "Short excerpt",
    "tags": ["tag1", "tag2"],
    "date": "2024-01-15"
  }
}
```

### 4. Authentication (If Vault is Protected)

If your Quartz vault requires authentication (e.g., browser popup asking for username/password):

#### For HTTP Basic Authentication (username/password popup)

Set the auth token in `username:password` format:

```bash
# Format: username:password
OBSIDIAN_GENERAL_VAULT_AUTH_TOKEN=myusername:mypassword
OBSIDIAN_PROGRAMMING_VAULT_AUTH_TOKEN=myusername:mypassword
```

The system automatically detects the colon and uses HTTP Basic Authentication.

#### For Bearer Token Authentication (Cloudflare Access, etc.)

```bash
OBSIDIAN_GENERAL_VAULT_AUTH_TOKEN=your-bearer-token-here
```

#### Supported Auth Formats

| Format | Example | Auth Type |
|--------|---------|-----------|
| `username:password` | `admin:secret123` | Basic Auth |
| `Basic <base64>` | `Basic YWRtaW46c2VjcmV0` | Basic Auth (pre-encoded) |
| `Bearer <token>` | `Bearer eyJhbG...` | Bearer Token |
| `<token>` | `eyJhbG...` | Bearer Token (default) |

### 5. Initialize Typesense Collection

The notes collection is automatically created on application startup. If you need to manually reset it:

```http
POST /api/search/reset-notes
Authorization: Bearer <your-jwt-token>
```

### 6. Seed Demo Data (Development Only)

To populate demo notes for testing:

```http
POST /api/dev/seed-demo-notes
```

This creates 5 sample notes (2 general, 3 programming) and links some to existing demo media items.

---

## API Reference

### Note CRUD Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/note` | Get all notes (optional `?vault=general`) |
| GET | `/api/note/{id}` | Get note by ID |
| GET | `/api/note/slug/{vault}/{slug}` | Get note by vault and slug |
| POST | `/api/note` | Create note manually |
| PUT | `/api/note/{id}` | Update note |
| DELETE | `/api/note/{id}` | Delete note |

### Note Linking

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/note/{id}/link` | Link note to media item |
| DELETE | `/api/note/{noteId}/link/{mediaItemId}` | Unlink note from media |
| GET | `/api/note/{id}/media` | Get media items linked to note |
| GET | `/api/note/for-media/{mediaItemId}` | Get notes linked to media item |

**Link Request Body:**
```json
{
  "mediaItemId": "guid-here",
  "linkDescription": "Optional context about the relationship"
}
```

### Sync Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/note/sync/{vault}` | Sync specific vault (general/programming) |
| POST | `/api/note/sync` | Sync all configured vaults |
| GET | `/api/note/sync/status` | Get sync configuration and status |

### Search Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search/notes?q=query` | Search notes |
| GET | `/api/search/notes/by-vault/{vault}?q=query` | Search notes in specific vault |
| GET | `/api/search/all?q=query` | Multi-search (media + mixlists + notes) |
| POST | `/api/search/reindex-notes` | Reindex all notes in Typesense |
| POST | `/api/search/reset-notes` | Reset notes collection |

---

## Frontend Usage

### RelatedNotesSection Component

The `RelatedNotesSection` component is automatically included on media profile pages. It displays:

- Linked notes with title, vault badge, tags, and description
- Link description (if provided)
- "View in Quartz" button to open the original note
- "Link Note" button to search and link additional notes
- "Unlink" button to remove note associations

### API Service Functions

Available in `frontend/src/api/noteService.js`:

```javascript
import {
  getAllNotes,
  getNoteById,
  getNotesForMedia,
  linkNoteToMedia,
  unlinkNoteFromMedia,
  searchNotes,
  multiSearch,
  syncVault,
  syncAllVaults,
  getSyncStatus
} from '../api';
```

---

## Background Sync Service

The `ObsidianNoteSyncHostedService` runs periodically to sync notes from configured vaults.

### Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `Enabled` | `false` | Enable/disable background sync |
| `IntervalHours` | `6` | Hours between sync runs |
| `InitialDelayMinutes` | `10` | Delay before first sync after startup |

### Sync Behavior

1. Fetches `/static/contentIndex.json` from each configured vault
2. Compares content hash (SHA-256) to detect changes
3. Creates new notes, updates changed notes, skips unchanged
4. Indexes all affected notes in Typesense
5. Logs sync results (imported, updated, unchanged, failed counts)

### Sync vs Reindex: What's the Difference?

| Operation | Source | Destination | When to Use |
|-----------|--------|-------------|-------------|
| **Sync** | Quartz vault (external HTTP) | PostgreSQL → Typesense | When you've added/updated notes in your Obsidian vault and published via Quartz |
| **Reindex** | PostgreSQL database | Typesense only | When notes are already in the database but search isn't working correctly |

**Sync from Vaults:**
- Fetches notes from your external Quartz-published Obsidian vault(s) via HTTP
- Downloads the `contentIndex.json` from your Quartz site
- Compares content hashes (SHA-256) to detect changes
- Creates new notes in PostgreSQL or updates existing ones if content changed
- Also indexes each imported/updated note to Typesense

**Reindex Notes:**
- Only works with notes already in your PostgreSQL database
- Re-sends all existing notes to Typesense
- Use this if Typesense gets out of sync with your database (e.g., Typesense was down, index got corrupted, etc.)
- Does NOT fetch anything from your Obsidian vaults

**In short:**
- **Sync** = Pull notes from Quartz vault → PostgreSQL → Typesense
- **Reindex** = PostgreSQL → Typesense (no external fetch)

If you just added a new notebook to your Obsidian vault and published it via Quartz, use **Sync**. If your notes are already in the database but search isn't working, use **Reindex**.

### Manual Sync

Trigger a manual sync via the API:

```http
# Sync specific vault
POST /api/note/sync/general
Authorization: Bearer <token>

# Sync all vaults
POST /api/note/sync
Authorization: Bearer <token>
```

---

## Troubleshooting

### Notes Not Syncing

1. Check vault URLs are correct and accessible
2. Verify `/static/contentIndex.json` exists on your Quartz site
3. Check authentication tokens if vault is protected
4. Review application logs for sync errors

### Search Not Finding Notes

1. Ensure Typesense is running and accessible
2. Verify the `obsidian_notes` collection exists
3. Try reindexing: `POST /api/search/reindex-notes`

### Links Not Appearing

1. Check that the note and media item both exist
2. Verify the link was created (check `MediaItemNotes` table)
3. Refresh the media profile page

### Authentication Errors (401)

1. Verify the auth token is correctly set
2. Check token hasn't expired
3. Ensure the token format matches what your auth provider expects

---

## Database Schema

### Notes Table

| Column | Type | Description |
|--------|------|-------------|
| Id | UUID | Primary key |
| Slug | varchar(200) | URL path from Quartz |
| Title | varchar(500) | Note title |
| Content | text | Full markdown content |
| Description | text | Short excerpt |
| VaultName | varchar(50) | "general" or "programming" |
| SourceUrl | varchar(2000) | Full URL to Quartz page |
| Tags | jsonb | Array of tag strings |
| NoteDate | timestamp | Original note date |
| DateImported | timestamp | When imported to system |
| LastSyncedAt | timestamp | Last sync timestamp |
| ContentHash | varchar(64) | SHA-256 for change detection |

**Indexes:**
- Unique index on (VaultName, Slug)
- Index on VaultName

### MediaItemNotes Table (Join)

| Column | Type | Description |
|--------|------|-------------|
| MediaItemId | UUID | FK to MediaItems |
| NoteId | UUID | FK to Notes |
| LinkedAt | timestamp | When link was created |
| LinkDescription | varchar(500) | Optional context |

**Primary Key:** (MediaItemId, NoteId)

---

## Next Steps Checklist

- [ ] Configure vault URLs in environment variables
- [ ] Set up authentication tokens if vaults are protected
- [ ] Run manual sync to test: `POST /api/note/sync`
- [ ] Enable background sync: `OBSIDIAN_SYNC_ENABLED=true`
- [ ] Test the RelatedNotesSection on a media profile page
- [ ] Link some notes to media items to verify functionality
- [ ] (Optional) Create a dedicated Notes browsing page in the frontend
