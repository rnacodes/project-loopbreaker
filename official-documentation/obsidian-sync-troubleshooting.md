# Obsidian Notes Sync - Troubleshooting & Normalization Guide

This document covers the troubleshooting process for Obsidian notes sync issues and the tools available for normalizing note data.

## Table of Contents

- [Overview](#overview)
- [Common Issues & Solutions](#common-issues--solutions)
- [Environment Variables](#environment-variables)
- [Typesense Schema](#typesense-schema)
- [Normalization Script](#normalization-script)
- [Quartz Configuration](#quartz-configuration)

---

## Overview

ProjectLoopbreaker syncs notes from Quartz-published Obsidian vaults by fetching `/static/contentIndex.json` from the vault URL. The sync process:

1. Fetches the content index from the Quartz vault
2. Parses note metadata (title, content, tags, etc.)
3. Stores notes in PostgreSQL
4. Indexes notes in Typesense for search

**Key Files:**
- `QuartzApiClient.cs` - HTTP client for fetching from Quartz vaults
- `NoteService.cs` - Core sync logic and CRUD operations
- `NoteController.cs` - REST API endpoints
- `TypeSenseService.cs` - Search indexing

---

## Common Issues & Solutions

### 1. Authentication Errors (401)

**Symptoms:** Sync fails with 401 Unauthorized error.

**Causes:**
- Environment variables not set
- API not restarted after setting env vars
- Incorrect credential format

**Solution:**

1. Set environment variables (machine-level on Windows):
   ```
   OBSIDIAN_GENERAL_VAULT_URL=https://garden.mymediaverseuniverse.com
   OBSIDIAN_GENERAL_VAULT_AUTH_TOKEN=username:password
   ```

2. **Restart the .NET API** - Machine-level env vars are only read at process startup.

3. Verify with PowerShell:
   ```powershell
   [Environment]::GetEnvironmentVariable('OBSIDIAN_GENERAL_VAULT_AUTH_TOKEN', 'Machine')
   ```

**Auth Token Formats Supported:**
| Format | Example | How it's sent |
|--------|---------|---------------|
| `username:password` | `admin:secret123` | Basic Auth (auto-detected) |
| `Basic <base64>` | `Basic YWRtaW46c2VjcmV0` | Pre-formatted Basic Auth |
| `Bearer <token>` | `Bearer abc123xyz` | Bearer token |
| Plain token | `abc123xyz` | Defaults to Bearer |

### 2. Tags Not Being Saved

**Symptoms:** All notes show empty tags `[]` in database even though Quartz has tags.

**Causes:**
- Previous sync ran before tags were properly configured
- Sync only updated tags when content changed (fixed)

**Solution:**

The sync code was updated to always check and update tags even when content hasn't changed. After restarting the API and re-syncing:

```csharp
// Now checks tags even for "unchanged" notes
var tagsChanged = !TagsAreEqual(existingNote.Tags, noteDto.Tags);
if (tagsChanged)
{
    existingNote.Tags = noteDto.Tags ?? new List<string>();
}
```

**Note:** Most notes (307/328 in testing) legitimately have empty tags because they don't have frontmatter tags in Obsidian. Quartz only captures **frontmatter tags**, not inline `#tags`.

### 3. Description is NULL

**Cause:** By design. Quartz's `contentIndex.tsx` explicitly deletes the description before writing to `contentIndex.json`:

```typescript
// In contentIndex.tsx lines 143-147
delete content.description
delete content.date
```

**Solution Options:**
1. Use the normalization script to auto-generate descriptions from content
2. Use AI to generate descriptions (separate process)
3. Modify Quartz config (not recommended - increases JSON size)

### 4. Content Appears Empty

**Symptoms:** Many notes have empty content or just whitespace.

**Causes:**
- Notes have no body text (only frontmatter)
- Notes use Dataview queries that don't render to text
- Notes have only embedded content/transclusions

**Solution:** This is expected behavior. Use the normalization script to set empty string instead of null for consistency.

### 5. CSV Export Looks "Mixed Up"

**Symptoms:** When exporting notes to CSV, content appears to span multiple rows.

**Cause:** This is normal CSV behavior - multi-line content in a field appears on multiple lines. The data is correct; it's just the CSV format display.

---

## Environment Variables

### Required for Sync

| Variable | Description | Example |
|----------|-------------|---------|
| `OBSIDIAN_GENERAL_VAULT_URL` | Base URL of general vault | `https://garden.mymediaverseuniverse.com` |
| `OBSIDIAN_GENERAL_VAULT_AUTH_TOKEN` | Auth credentials | `username:password` |
| `OBSIDIAN_PROGRAMMING_VAULT_URL` | Base URL of programming vault | `https://hackerman.mymediaverseuniverse.com` |
| `OBSIDIAN_PROGRAMMING_VAULT_AUTH_TOKEN` | Auth credentials | `username:password` |

### Optional for Auto-Sync

| Variable | Description | Default |
|----------|-------------|---------|
| `OBSIDIAN_SYNC_ENABLED` | Enable background sync | `false` |
| `OBSIDIAN_SYNC_INTERVAL_HOURS` | Hours between syncs | `6` |

---

## Typesense Schema

The `obsidian_notes` collection uses this schema:

| Field | Type | Required | Facetable | Notes |
|-------|------|----------|-----------|-------|
| `id` | string | Yes | No | UUID |
| `slug` | string | Yes | No | URL-friendly identifier |
| `title` | string | Yes | No | Note title |
| `content` | string | No | No | Full markdown content |
| `description` | string | No | No | Short excerpt |
| `vault_name` | string | Yes | Yes | "general" or "programming" |
| `source_url` | string | No | No | Link to Quartz (not indexed) |
| `tags` | string[] | Yes | Yes | Array of tags |
| `date_imported` | int64 | Yes | No | Unix timestamp |
| `note_date` | int64 | No | No | Unix timestamp |
| `linked_media_count` | int32 | Yes | No | Count of linked media items |

---

## Normalization Scripts

Two Python scripts are provided for normalizing note data.

### 1. Database Normalization Script

Normalizes notes stored in the PostgreSQL database (does NOT modify Obsidian files).

### Location

```
scripts/normalize_notes.py
scripts/requirements.txt
```

### Installation

```bash
pip install psycopg2-binary
```

### Usage

```bash
# Dry run - preview changes without modifying
python scripts/normalize_notes.py \
  --database-url "postgresql://user:pass@host:5432/dbname" \
  --dry-run \
  --verbose

# Apply changes
python scripts/normalize_notes.py \
  --database-url "postgresql://user:pass@host:5432/dbname"
```

### What It Normalizes

| Field | Normalization |
|-------|---------------|
| `content` | Null → empty string, strips whitespace-only |
| `description` | Null → auto-generates from first 150 chars of content |
| `tags` | Null → empty array, lowercases all tags |
| `source_url` | Null → generates from vault URL + slug |

### Options

| Flag | Description |
|------|-------------|
| `--database-url, -d` | PostgreSQL connection string |
| `--dry-run, -n` | Preview changes without modifying |
| `--verbose, -v` | Show detailed output per note |

### Environment Variable

Instead of `--database-url`, you can set:
```bash
export DATABASE_URL="postgresql://user:pass@host:5432/dbname"
```

---

### 2. Obsidian Vault Normalization Script

Normalizes the actual Obsidian markdown files in your vault. Changes will propagate to Quartz when rebuilt and then to ProjectLoopbreaker on next sync.

#### Location

```
scripts/normalize_obsidian_vault.py
```

#### Installation

```bash
pip install pyyaml requests
```

#### Usage

```bash
# Dry run - preview changes without modifying files
python scripts/normalize_obsidian_vault.py /path/to/vault --dry-run --verbose

# Create backup first, then normalize
python scripts/normalize_obsidian_vault.py /path/to/vault --backup

# Just normalize (no backup)
python scripts/normalize_obsidian_vault.py /path/to/vault

# Use AI for description generation
export GRADIENT_API_KEY=your_api_key_here
python scripts/normalize_obsidian_vault.py /path/to/vault --use-ai --gradient-base-url https://api.gradient.ai/v1
```

#### What It Normalizes

| Normalization | Description |
|---------------|-------------|
| **Inline tags → frontmatter** | Extracts `#tag` from content and adds to frontmatter `tags` array |
| **Standardize tag casing** | Lowercases all tags for consistency |
| **Ensure title** | Adds `title` field from filename if missing |
| **Add description** | Generates description from first ~150 chars of content |

#### Options

| Flag | Description |
|------|-------------|
| `--dry-run, -n` | Preview changes without modifying files |
| `--backup, -b` | Create backup before making changes |
| `--backup-dir` | Directory to store backup |
| `--verbose, -v` | Show detailed output per file |
| `--include-pattern` | Glob pattern for files (default: `*.md`) |
| `--use-ai` | Enable AI-generated descriptions |
| `--gradient-base-url` | Gradient AI API URL (default: `https://api.gradient.ai/v1`) |
| `--ai-model` | AI model to use (default: `llama-3.1-8b-instruct`) |

#### AI Description Generation

The script can use Gradient AI (or any OpenAI-compatible API) to generate high-quality descriptions.

**Setup:**
```bash
# Set your API key as environment variable
export GRADIENT_API_KEY=your_api_key_here

# Or on Windows PowerShell
$env:GRADIENT_API_KEY="your_api_key_here"
```

**Usage:**
```bash
# Use AI for descriptions
python scripts/normalize_obsidian_vault.py /path/to/vault --use-ai

# Custom API endpoint/model
python scripts/normalize_obsidian_vault.py /path/to/vault \
    --use-ai \
    --gradient-base-url https://your-api.com/v1 \
    --ai-model your-model-name
```

**Notes:**
- Falls back to simple extraction if AI fails for a note
- Rate-limited to ~2 requests/second to avoid API throttling
- Truncates long content to ~2000 chars before sending to AI

#### Example Output

```
Obsidian Vault Normalizer
==================================================
Vault: D:\Repos\digital-garden\content
Dry run: True

Found 328 markdown files to process.

[MODIFIED] notes/my-note.md
  - tags: [] -> ['programming', 'javascript']
  - title: (none) -> 'My Note'
  - description: (none) -> 'This note covers the basics of...'

==================================================
SUMMARY
==================================================
Total files processed: 328
Files modified:        45
Files unchanged:       283
Errors:                0

Changes by type:
  Tags updated:        30
  Titles added:        45
  Descriptions added:  40

DRY RUN - No files were modified.
```

#### Ignored Directories

The script automatically ignores:
- `.obsidian/`
- `.git/`
- `.trash/`
- `node_modules/`
- `.quartz-cache/`
- `templates/` / `Templates/`

#### Frontmatter Handling

The script **merges** with existing frontmatter:
- Preserves existing values
- Only adds missing fields
- Combines inline tags with existing frontmatter tags

---

## Quartz Configuration

The Quartz vault must be configured to publish `contentIndex.json`.

### Required Plugin

In `quartz.config.ts`:

```typescript
Plugin.ContentIndex({
  enableSiteMap: true,
  enableRSS: true,
})
```

### Tags in Quartz

**Important:** Quartz only captures **frontmatter tags**, not inline `#tags`.

To have tags appear in the sync:

```markdown
---
title: My Note
tags:
  - programming
  - javascript
---

Note content here...
```

Inline tags like `#programming` will NOT be captured in `contentIndex.json`.

### Content Index Location

Quartz publishes the index at:
```
https://your-vault-url/static/contentIndex.json
```

---

## API Endpoints

### Sync Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/note/sync/{vault}` | Sync specific vault |
| `POST` | `/api/note/sync` | Sync all configured vaults |
| `GET` | `/api/note/sync/status` | Get sync configuration status |

### Check Sync Status

```bash
curl -X GET "http://localhost:5033/api/note/sync/status" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response includes:
- `enabled` - Whether auto-sync is enabled
- `intervalHours` - Sync interval
- `generalVaultUrl` / `programmingVaultUrl` - Configured URLs
- `generalVaultHasAuth` / `programmingVaultHasAuth` - Whether auth is configured
- `lastSyncGeneral` / `lastSyncProgramming` - Last sync timestamps
- `totalNotesGeneral` / `totalNotesProgramming` - Note counts

---

## Troubleshooting Checklist

1. **Auth failing?**
   - [ ] Environment variables set correctly
   - [ ] API restarted after setting env vars
   - [ ] Credentials format is `username:password`
   - [ ] Test with curl: `curl -u "user:pass" "https://vault-url/static/contentIndex.json"`

2. **Tags empty?**
   - [ ] Check if notes have frontmatter tags (not inline #tags)
   - [ ] Re-sync after API restart
   - [ ] Run normalization script

3. **Content missing?**
   - [ ] Check if note has body content in Obsidian
   - [ ] Quartz Description plugin must be configured
   - [ ] Run normalization script to set defaults

4. **Sync not running?**
   - [ ] Check `OBSIDIAN_SYNC_ENABLED=true`
   - [ ] Check API logs for errors
   - [ ] Manually trigger sync via API
