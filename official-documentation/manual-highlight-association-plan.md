# Manual Highlight Association Feature Plan

## Overview
Add functionality to manually associate highlights with books and articles through the ReadwiseSyncPage. Currently, highlights are auto-linked during Readwise sync based on URL (articles) or title+author (books), but some highlights remain unlinked.

---

## Backend Changes

### New Endpoint: Get Unlinked Highlights
Add `GET /api/highlight/unlinked` to `HighlightController.cs`:
- Returns highlights where `ArticleId == null && BookId == null`
- Ordered by `HighlightedAt` descending (most recent first)

### Service Layer Updates
Add `GetUnlinkedHighlightsAsync()` method to:
- `IHighlightService.cs` (interface)
- `HighlightService.cs` (implementation)

### Files to Modify
1. `src/ProjectLoopbreaker/ProjectLoopbreaker.Application/Interfaces/IHighlightService.cs`
   - Add: `Task<IEnumerable<Highlight>> GetUnlinkedHighlightsAsync();`

2. `src/ProjectLoopbreaker/ProjectLoopbreaker.Application/Services/HighlightService.cs`
   - Implement `GetUnlinkedHighlightsAsync()`

3. `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/HighlightController.cs`
   - Add: `GET /api/highlight/unlinked` endpoint

---

## Frontend Changes

### API Layer
Add to `highlightService.js`:
- `getUnlinkedHighlights()` - Fetch highlights not linked to any media
- `updateHighlight(id, data)` - Update highlight with ArticleId or BookId (may already exist)

### ReadwiseSyncPage Updates
Add new section "Manage Unlinked Highlights":

#### 1. Unlinked Highlights List
- Displays highlights not associated with any book/article
- Shows: text snippet (truncated), title, author, category, date
- "Link" button for each highlight

#### 2. Link Dialog/Expansion
- Tabs or dropdown: "Link to Book" / "Link to Article"
- Search input with autocomplete for books/articles
- Uses existing search endpoints:
  - `GET /api/book/search?query=...`
  - `GET /api/article/search?query=...` (or filter from media)
- Confirm button to save association

#### 3. State Management
- Loading states for fetch and save operations
- Success/error notifications
- Auto-refresh list after linking

### UI Design (consistent with existing ReadwiseSyncPage styling)
```
+---------------------------------------------+
| Manage Unlinked Highlights                  |
| ------------------------------------------- |
| 15 highlights need manual linking           |
|                                             |
| +------------------------------------------+|
| | "The key to understanding..."            ||
| | From: Thinking Fast and Slow | Kahneman  ||
| | Category: books | Jan 15, 2025           ||
| | [Link to Book v] [Link to Article v]     ||
| +------------------------------------------+|
|                                             |
| +------------------------------------------+|
| | "Another highlight text..."              ||
| | From: Some Article Title | Author        ||
| | Category: articles | Jan 10, 2025        ||
| | [Link to Book v] [Link to Article v]     ||
| +------------------------------------------+|
+---------------------------------------------+
```

### Files to Modify
1. `frontend/src/api/highlightService.js`
   - Add: `getUnlinkedHighlights()`

2. `frontend/src/components/ReadwiseSyncPage.jsx`
   - Add new "Manage Unlinked Highlights" section
   - Add state for unlinked highlights
   - Add search/select UI for books and articles
   - Add link action handlers

3. `frontend/src/components/ReadwiseSyncPage.css` (if needed)
   - Styles for unlinked highlights section

---

## Existing Infrastructure

### Backend (already exists)
- `PUT /api/highlight/{id}` - Can update ArticleId/BookId via CreateHighlightDto
- `CreateHighlightDto` already has `ArticleId` and `BookId` fields
- `POST /api/highlight/link` - Auto-link endpoint (for reference)

### Frontend (already exists)
- `updateHighlight(id, data)` in highlightService.js
- Book/article search components in various places

---

## Verification Plan

1. **Manual Association Verification**
   - Sync some highlights from Readwise
   - Verify unlinked highlights appear in new section
   - Search for a book and link a highlight
   - Search for an article and link a highlight
   - Navigate to book/article profile pages
   - Verify linked highlights now appear in HighlightsSection

2. **Edge Cases**
   - Test with no unlinked highlights (empty state)
   - Test search with no results
   - Test error handling for failed API calls
