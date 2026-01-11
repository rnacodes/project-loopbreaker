# Plan: Note Profile Page & AI Description Generation

## Summary
Create a lightweight note profile page that shows description + metadata + linked media items, with a link to Quartz for full content. Add AI-powered description generation during sync (with manual override support).

## Design Decisions
- **No content preview** on profile page - just description, metadata, and "View in Quartz" link
- **AI descriptions** auto-generated during sync, with manual override capability
- **OpenAI SDK compatible** client to support DigitalOcean GenAI Platform (or any OpenAI-compatible endpoint)

---

## Implementation Steps

### 1. Add AI Service for Description Generation

**Files to create/modify:**
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Shared/Interfaces/IAiDescriptionService.cs` (new)
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure/Clients/AiDescriptionService.cs` (new)
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Program.cs` (register service)
- `appsettings.json` (add configuration section - will ask permission first)

**Implementation:**
- Create interface with `GenerateDescriptionAsync(string content, string title)` method
- Use OpenAI SDK NuGet package (`OpenAI` or `Azure.AI.OpenAI`)
- Configure endpoint URL + API key from environment variables:
  - `AI_ENDPOINT_URL` (defaults to OpenAI, can point to DO GenAI)
  - `AI_API_KEY`
  - `AI_MODEL` (e.g., `gpt-4o-mini`)
- Use a simple prompt: "Summarize this note in 2-3 sentences for a media library catalog"

### 2. Update Note Entity & DTO

**Files to modify:**
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Domain/Entities/Note.cs`
- `src/ProjectLoopbreaker/ProjectLoopbreaker.DTOs/Notes/NoteResponseDto.cs`
- `src/ProjectLoopbreaker/ProjectLoopbreaker.DTOs/Notes/UpdateNoteDto.cs`
- Add EF migration for new column

**Changes:**
- Add `IsDescriptionManual` (bool, default false) - tracks if user manually edited description
- When user edits description, set flag to true to prevent auto-regeneration

### 3. Update NoteService Sync Logic

**File to modify:**
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Application/Services/NoteService.cs`

**Changes:**
- Inject `IAiDescriptionService`
- During sync, if note is new OR (content changed AND `IsDescriptionManual` is false):
  - Call AI service to generate description
  - Update description field
- Skip AI generation if `IsDescriptionManual` is true (preserve user's manual description)

### 4. Create Note Profile Page (Frontend)

**Files to create:**
- `frontend/src/components/NoteProfilePage.jsx` (new)

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
+------------------------------------------+
| [View in Quartz] button                  |
+------------------------------------------+
| Linked Media Items                       |
| - [Media 1 card]                         |
| - [Media 2 card]                         |
| - ...                                    |
+------------------------------------------+
```

**Features:**
- Fetch note by ID from API
- Display description prominently (this is the main content)
- Inline edit for description (sets `IsDescriptionManual` to true on save)
- Show all linked media items with thumbnails and types
- "View in Quartz" button opens `sourceUrl` in new tab

### 5. Add Route for Note Profile Page

**File to modify:**
- `frontend/src/App.jsx` (or wherever routes are defined)

**Add route:**
- `/note/:id` → `NoteProfilePage`

### 6. Update RelatedNotesSection

**File to modify:**
- `frontend/src/components/RelatedNotesSection.jsx`

**Changes:**
- Make note titles clickable links to `/note/:id`
- Keep "View in Quartz" button as well

### 7. Add Note API Endpoint for Description Update

**File to modify:**
- `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/NoteController.cs`

**Changes:**
- Ensure PUT endpoint can update description
- Add logic to set `IsDescriptionManual = true` when description is updated via API

---

## Configuration (Environment Variables)

```
AI_ENDPOINT_URL=https://api.openai.com/v1  (or DO GenAI endpoint)
AI_API_KEY=your-api-key
AI_MODEL=gpt-4o-mini
```

---

## Verification

1. **AI Description Generation:**
   - Trigger a vault sync
   - Verify new/updated notes get AI-generated descriptions
   - Verify notes with `IsDescriptionManual=true` keep their descriptions

2. **Note Profile Page:**
   - Navigate to `/note/{id}`
   - Verify description, tags, metadata display correctly
   - Verify "View in Quartz" opens correct URL
   - Verify linked media items are shown

3. **Description Editing:**
   - Edit description on profile page
   - Verify `IsDescriptionManual` is set to true
   - Re-sync vault
   - Verify manual description is preserved

4. **Navigation:**
   - Click note title in RelatedNotesSection
   - Verify it navigates to note profile page
