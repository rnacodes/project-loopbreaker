# Background Services in ProjectLoopbreaker

This document lists all background hosted services in the application, their configuration, and manual control options.

## Overview

All background services are **disabled by default** (`Enabled = false`), giving you full manual control over these operations.

## Services

### 1. ObsidianNoteSyncHostedService

**Purpose**: Syncs notes from Quartz static sites (Obsidian vaults) into the database and Typesense.

| Setting | Default | Description |
|---------|---------|-------------|
| `Enabled` | `false` | Whether the background sync is active |
| `IntervalHours` | `6` | Hours between sync runs |
| `InitialDelayMinutes` | `5` | Delay before first run after app startup |

**Config Section**: `ObsidianNoteSync`

**Manual Trigger**: `POST /api/notes/sync`

---

### 2. NoteDescriptionGenerationHostedService

**Purpose**: Uses Gradient AI to generate descriptions for notes that don't have one. Only processes notes where `IsDescriptionManual = false`.

| Setting | Default | Description |
|---------|---------|-------------|
| `Enabled` | `false` | Whether the background generation is active |
| `IntervalHours` | `12` | Hours between generation runs |
| `InitialDelayMinutes` | `20` | Delay before first run (allows note sync to complete) |
| `BatchSize` | `20` | Number of notes to process per run |
| `MaxTokensPerDescription` | `200` | Max tokens for generated descriptions |

**Config Section**: `NoteDescriptionGeneration`

**Manual Triggers**:
- Single note: `POST /api/ai/notes/{id}/generate-description`
- Batch: `POST /api/ai/notes/generate-descriptions-batch?batchSize=20`

**Requires**: `GRADIENT_API_KEY` environment variable

---

### 3. EmbeddingGenerationHostedService

**Purpose**: Uses Gradient AI to generate vector embeddings for media items and notes. Embeddings enable similarity search and recommendations via pgvector.

| Setting | Default | Description |
|---------|---------|-------------|
| `Enabled` | `false` | Whether the background generation is active |
| `IntervalHours` | `24` | Hours between generation runs |
| `InitialDelayMinutes` | `30` | Delay before first run |
| `BatchSize` | `50` | Number of items to process per run |

**Config Section**: `EmbeddingGeneration`

**Manual Triggers**:
- Media item: `POST /api/ai/media/{id}/generate-embedding`
- Note: `POST /api/ai/notes/{id}/generate-embedding`
- Batch media: `POST /api/ai/media/generate-embeddings-batch?batchSize=50`
- Batch notes: `POST /api/ai/notes/generate-embeddings-batch?batchSize=50`

**Requires**:
- `GRADIENT_API_KEY` environment variable
- pgvector extension installed in PostgreSQL

---

### 4. BookDescriptionEnrichmentHostedService

**Purpose**: Enriches book descriptions by fetching additional information from Open Library API.

| Setting | Default | Description |
|---------|---------|-------------|
| `Enabled` | `false` | Whether the background enrichment is active |
| `IntervalHours` | `24` | Hours between enrichment runs |
| `InitialDelayMinutes` | `10` | Delay before first run |
| `BatchSize` | `10` | Number of books to process per run |

**Config Section**: `BookDescriptionEnrichment`

**Manual Trigger**: Use the Book API endpoints to trigger individual book enrichment.

---

## Configuration Example

Add to `appsettings.json` or set via environment variables:

```json
{
  "ObsidianNoteSync": {
    "Enabled": false,
    "IntervalHours": 6,
    "InitialDelayMinutes": 5
  },
  "NoteDescriptionGeneration": {
    "Enabled": false,
    "IntervalHours": 12,
    "InitialDelayMinutes": 20,
    "BatchSize": 20,
    "MaxTokensPerDescription": 200
  },
  "EmbeddingGeneration": {
    "Enabled": false,
    "IntervalHours": 24,
    "InitialDelayMinutes": 30,
    "BatchSize": 50
  },
  "BookDescriptionEnrichment": {
    "Enabled": false,
    "IntervalHours": 24,
    "InitialDelayMinutes": 10,
    "BatchSize": 10
  }
}
```

## Environment Variable Override

You can also configure via environment variables using the `__` separator:

```bash
# Enable note sync
ObsidianNoteSync__Enabled=true

# Enable AI description generation
NoteDescriptionGeneration__Enabled=true
NoteDescriptionGeneration__BatchSize=50

# Enable embedding generation
EmbeddingGeneration__Enabled=true
```

## Status Endpoints

Check the status of AI services:
- `GET /api/ai/status` - Returns AI service availability and pending item counts
- `GET /api/recommendation/status` - Returns recommendation service availability
