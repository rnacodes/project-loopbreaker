# Gradient AI Integration Plan for ProjectLoopbreaker

## Overview

Integrate DigitalOcean Gradient AI into ProjectLoopbreaker for:
1. **AI-Generated Note Descriptions** - Auto-generate descriptions for Obsidian notes (integrated with Note Profile Page plan)
2. **Media Recommendation Engine** - Semantic recommendations using vector embeddings

This plan integrates with and extends the existing `note-profile-page-plan.md`.

## Architecture Approach: "Better Together"

Following the documented preference from ai-typesense-and-pg-ideas.md:
- **PostgreSQL + pgvector**: Store embeddings alongside data (source of truth)
- **Typesense**: Hybrid search (keyword + semantic) for fast user-facing search
- **Gradient AI**: Generate embeddings and text (descriptions)

```
Gradient AI (Embeddings + Text Gen)
         |
         v
PostgreSQL + pgvector (Storage & Similarity)
         |
         v
Typesense (Hybrid Search UI)
```

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Embedding Model | GTE Large v1.5 (1024 dims) | Best balance of quality and token limit (8k) |
| Generation Model | GPT-4 Turbo via Gradient | Good quality, fast inference |
| Vector Storage | PostgreSQL pgvector | Keep embeddings with data, single source of truth |
| Search | Typesense hybrid | Fast UI, combines keyword + semantic |
| Embedding Dimension | 1024 | GTE Large default, good semantic capture |
| Implementation Order | Note descriptions first | Lower risk starting point, validates Gradient integration |

---

## Phase 1: Foundation Setup

### 1.1 Install pgvector Extension

Since pgvector is not yet installed:

**For DigitalOcean Managed PostgreSQL:**
pgvector is available as a trusted extension. Run:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**For self-hosted PostgreSQL:**
```bash
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install
```

Then in PostgreSQL:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 1.2 Entity Changes

**BaseMediaItem.cs** - Add new properties:
```csharp
public float[]? Embedding { get; set; }
public DateTime? EmbeddingGeneratedAt { get; set; }
public string? EmbeddingModel { get; set; }
```

**Note.cs** - Add new properties (integrates with note-profile-page-plan.md):
```csharp
// From note-profile-page-plan.md
public bool IsDescriptionManual { get; set; } = false;

// New AI fields
public string? AiDescription { get; set; }
public DateTime? AiDescriptionGeneratedAt { get; set; }
public float[]? Embedding { get; set; }
public DateTime? EmbeddingGeneratedAt { get; set; }
public string? EmbeddingModel { get; set; }
```

### 1.3 EF Core Migration

Create migration `AddAIEmbeddingFields`:
- Add vector columns with pgvector type (1024 dimensions)
- Add IVFFlat index for similarity search
- Add `IsDescriptionManual` flag to Notes
- Add AI description fields to Notes

### 1.4 Gradient AI Client

**New file:** `Infrastructure/Clients/GradientAIClient.cs`

Implements `IGradientAIClient` interface (replaces the simpler `IAiDescriptionService` from note-profile-page-plan):
```csharp
public interface IGradientAIClient
{
    Task<float[]> GenerateEmbeddingAsync(string text, CancellationToken ct = default);
    Task<List<float[]>> GenerateEmbeddingsBatchAsync(List<string> texts, CancellationToken ct = default);
    Task<string> GenerateTextAsync(string prompt, string systemPrompt = "", int maxTokens = 500, CancellationToken ct = default);
    Task<bool> IsAvailableAsync();
}
```

**Configuration (environment variables):**
```
GRADIENT_API_KEY=<your-key>
GRADIENT_EMBEDDING_MODEL=gte-large-v1.5
GRADIENT_GENERATION_MODEL=gpt-4-turbo
```

---

## Phase 2: Note Description Generation (Integrates with Note Profile Page Plan)

This phase implements the AI description functionality outlined in note-profile-page-plan.md using Gradient AI.

### 2.1 AI Service

**New file:** `Application/Services/AIService.cs`

Key methods:
- `GenerateNoteDescriptionAsync(Guid noteId)` - Generate description for single note
- `GenerateNoteDescriptionsBatchAsync(int batchSize)` - Batch process notes without descriptions
- `GetNotesNeedingDescriptionCountAsync()` - Count pending notes

**Prompt template for descriptions:**
```
System: You are a helpful assistant that creates concise, informative descriptions for notes.

User: Generate a 2-3 sentence description for this note for a media library catalog:
Title: {title}
Tags: {tags}
Content (first 2000 chars): {content}

The description should capture the main topic and purpose of the note.
```

### 2.2 Update NoteService Sync Logic (from note-profile-page-plan.md)

**File to modify:** `Application/Services/NoteService.cs`

**Changes:**
- Inject `IGradientAIClient` (via `IAIService`)
- During sync, if note is new OR (content changed AND `IsDescriptionManual` is false):
  - Call AI service to generate description
  - Store in `AiDescription` field
  - Update `Description` field with AI-generated text (if no manual description)
- Skip AI generation if `IsDescriptionManual` is true (preserve user's manual description)

### 2.3 Background Job

**New file:** `Infrastructure/Services/NoteDescriptionGenerationHostedService.cs`

- Runs after note sync (configurable interval, default 12 hours)
- Processes notes where `AiDescription IS NULL AND Content IS NOT NULL AND IsDescriptionManual = false`
- Batch size: 20 notes per run
- Delay between API calls: 1 second (rate limiting)

### 2.4 Update Typesense Note Schema

Add `ai_description` field to `obsidian_notes` collection.

---

## Phase 3: Note Profile Page (from note-profile-page-plan.md)

### 3.1 Create Note Profile Page (Frontend)

**New file:** `frontend/src/components/NoteProfilePage.jsx`

**Layout:**
```
+------------------------------------------+
| [Vault Badge]  Note Title                |
+------------------------------------------+
| Description (AI-generated or manual)     |
| [Edit Description button]                |
+------------------------------------------+
| Tags: [tag1] [tag2] [tag3]               |
+------------------------------------------+
| Metadata:                                |
| - Note Date: ...                         |
| - Imported: ...                          |
| - Last Synced: ...                       |
| - AI Description Generated: ... (if AI) |
+------------------------------------------+
| [View in Quartz] button                  |
+------------------------------------------+
| Linked Media Items                       |
| - [Media 1 card]                         |
| - [Media 2 card]                         |
+------------------------------------------+
```

**Features:**
- Fetch note by ID from API
- Display description prominently
- Inline edit for description (sets `IsDescriptionManual` to true on save)
- Show all linked media items with thumbnails and types
- "View in Quartz" button opens `sourceUrl` in new tab
- Show indicator if description is AI-generated vs manual

### 3.2 Add Route for Note Profile Page

**File to modify:** `frontend/src/App.jsx`

**Add route:** `/note/:id` → `NoteProfilePage`

### 3.3 Update RelatedNotesSection

**File to modify:** `frontend/src/components/RelatedNotesSection.jsx`

- Make note titles clickable links to `/note/:id`
- Keep "View in Quartz" button as well

### 3.4 Update Note API Endpoint

**File to modify:** `Web.API/Controllers/NoteController.cs`

- Ensure PUT endpoint can update description
- Add logic to set `IsDescriptionManual = true` when description is updated via API

---

## Phase 4: Embedding Generation

### 4.1 Embedding Text Composition

For **media items**, compose embedding text from:
```
{Title}
{Description}
Topics: {Topics joined by comma}
Genres: {Genres joined by comma}
{Type-specific: Author/Director/Publisher}
```

For **notes**, compose from:
```
{Title}
{Description or AiDescription}
Tags: {Tags joined by comma}
{First 4000 chars of Content}
```

### 4.2 AIService Extensions

Add methods:
- `GenerateMediaItemEmbeddingAsync(Guid mediaItemId)`
- `GenerateNoteEmbeddingAsync(Guid noteId)`
- `GenerateMediaItemEmbeddingsBatchAsync(int batchSize)`

### 4.3 Background Job

**New file:** `Infrastructure/Services/EmbeddingGenerationHostedService.cs`

- Runs daily (configurable)
- Processes items where `Embedding IS NULL`
- Batch size: 50 items per run
- Delay between batches: 200ms

### 4.4 Typesense Schema Update

Add to `media_items` and `obsidian_notes` collections:
```json
{
  "name": "embedding",
  "type": "float[]",
  "num_dim": 1024,
  "optional": true
}
```

---

## Phase 5: Hybrid Search

### 5.1 TypeSenseService Updates

**Update:** `Infrastructure/Services/TypeSenseService.cs`

Add new method:
```csharp
public async Task<SearchResult> HybridSearchMediaAsync(
    string query,
    float[]? queryEmbedding = null,
    string? mediaTypeFilter = null,
    float alpha = 0.5f,  // 0=keyword only, 1=vector only
    int perPage = 20)
```

When `queryEmbedding` is provided:
- Use Typesense's `vector_query` parameter
- Combine with existing keyword search via rank fusion

### 5.2 Search Controller Updates

Add endpoint:
```
POST /api/search/semantic
Body: { "query": "dark sci-fi movies", "alpha": 0.7 }
```

This endpoint:
1. Generates embedding for query text via Gradient AI
2. Calls HybridSearchMediaAsync with both query and embedding
3. Returns ranked results

---

## Phase 6: Recommendation Engine

### 6.1 Recommendation Service

**New file:** `Application/Services/RecommendationService.cs`

Key methods:
- `GetSimilarItemsAsync(Guid mediaItemId, int count)` - Find similar media using vector similarity
- `GetSimilarItemsByVibeAsync(string description, int count)` - "Find by vibe" search
- `GetRecommendationsByTopicsAsync(List<string> topics, int count)` - Topic-based recommendations

### 6.2 PostgreSQL Similarity Query

```sql
SELECT m.*, (m."Embedding" <=> @queryEmbedding) as distance
FROM "MediaItems" m
WHERE m."Embedding" IS NOT NULL
  AND m."Id" != @excludeId
ORDER BY distance
LIMIT @count;
```

### 6.3 Recommendation Controller

**New file:** `Web.API/Controllers/RecommendationController.cs`

Endpoints:
- `GET /api/recommendation/similar/{id}` - Similar to specific item
- `POST /api/recommendation/by-vibe` - Search by description/mood
- `GET /api/recommendation/for-you` - Personalized (based on liked items)

---

## New Files Summary

### Shared Layer
- `Interfaces/IGradientAIClient.cs`

### Application Layer
- `Interfaces/IAIService.cs`
- `Interfaces/IRecommendationService.cs`
- `Services/AIService.cs`
- `Services/RecommendationService.cs`

### Infrastructure Layer
- `Clients/GradientAIClient.cs`
- `Services/EmbeddingGenerationHostedService.cs`
- `Services/NoteDescriptionGenerationHostedService.cs`

### Web.API Layer
- `Controllers/AIController.cs`
- `Controllers/RecommendationController.cs`

### Frontend
- `components/NoteProfilePage.jsx` (from note-profile-page-plan.md)

### DTOs
- `AIStatusDto.cs`
- `NoteDescriptionResultDto.cs`
- `EmbeddingBatchResultDto.cs`
- `RecommendationResultDto.cs`
- `VibeSearchRequestDto.cs`

---

## Environment Variables

```bash
# Gradient AI
GRADIENT_API_KEY=<your-gradient-api-key>
GRADIENT_EMBEDDING_MODEL=gte-large-v1.5
GRADIENT_GENERATION_MODEL=gpt-4-turbo

# Feature Flags (optional)
AI_FEATURES_ENABLED=true
EMBEDDING_GENERATION_ENABLED=true
NOTE_DESCRIPTION_GENERATION_ENABLED=true

# Background Job Tuning (optional)
EMBEDDING_BATCH_SIZE=50
EMBEDDING_INTERVAL_HOURS=24
NOTE_DESCRIPTION_BATCH_SIZE=20
NOTE_DESCRIPTION_INTERVAL_HOURS=12
```

---

## Migration Strategy for Existing Data

1. **Run migration** - Add columns (non-breaking, all nullable)
2. **Deploy** - New code with AI features disabled
3. **Enable background jobs** - Let them process existing items over time
4. **Manual backfill endpoint** - `POST /api/ai/backfill` for faster initial population

---

## Verification Plan

### AI Description Generation (from note-profile-page-plan.md)
1. Trigger a vault sync
2. Verify new/updated notes get AI-generated descriptions
3. Verify notes with `IsDescriptionManual=true` keep their descriptions

### Note Profile Page (from note-profile-page-plan.md)
1. Navigate to `/note/{id}`
2. Verify description, tags, metadata display correctly
3. Verify "View in Quartz" opens correct URL
4. Verify linked media items are shown

### Description Editing
1. Edit description on profile page
2. Verify `IsDescriptionManual` is set to true
3. Re-sync vault
4. Verify manual description is preserved

### Embedding & Recommendation Features
1. Generate embeddings, test similarity search
2. Search by vibe, verify semantic results
3. `GET /api/ai/status` - Verify connectivity
4. `GET /api/recommendation/similar/{id}` - Test similar items

---

## Future Enhancements (Stretch Goals from ai-description-ideas.md)

- AI-suggested topics/genres at media creation time
- Article length categorization (short/medium/long)
- Cross-media recommendations (book -> movie adaptations)
- User preference learning from interactions
- Collaborative filtering based on usage patterns

---

## References

- [Gradient AI Platform](https://www.digitalocean.com/products/gradient/platform)
- [Gradient AI SDK](https://github.com/digitalocean/gradient-python)
- [pgvector](https://github.com/pgvector/pgvector)
- [Typesense Vector Search](https://typesense.org/docs/29.0/api/vector-search.html)
- [pgai Vectorizer](https://github.com/timescale/pgai)
