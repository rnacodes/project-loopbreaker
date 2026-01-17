# Implementation Plan: Notes, Recommendations, AI Admin & Vibe Search

## Overview
Add four frontend features to complete the Gradient AI integration:
1. Notes Listing Page (`/notes`)
2. Recommendation UI Components on profile pages
3. AI Admin Controls (`/ai-admin`)
4. Search by Vibe (`/search-by-vibe`)

---

## Phase 1: API Services (Foundation)

### 1.1 Create `frontend/src/api/aiService.js`
```javascript
// Functions:
getAiStatus()                    // GET /api/ai/status
generateNoteDescription(id)      // POST /api/ai/notes/{id}/generate-description
generateNoteDescriptionsBatch()  // POST /api/ai/notes/generate-descriptions-batch
getPendingNoteDescriptions()     // GET /api/ai/notes/pending-descriptions
generateMediaEmbedding(id)       // POST /api/ai/media/{id}/generate-embedding
generateNoteEmbedding(id)        // POST /api/ai/notes/{id}/generate-embedding
generateMediaEmbeddingsBatch()   // POST /api/ai/media/generate-embeddings-batch
generateNoteEmbeddingsBatch()    // POST /api/ai/notes/generate-embeddings-batch
getPendingMediaEmbeddings()      // GET /api/ai/media/pending-embeddings
getPendingNoteEmbeddings()       // GET /api/ai/notes/pending-embeddings
```

### 1.2 Create `frontend/src/api/recommendationService.js`
```javascript
// Functions:
getRecommendationStatus()              // GET /api/recommendation/status
getSimilarMedia(id, limit?)            // GET /api/recommendation/similar/media/{id}
getSimilarNotes(id, limit?)            // GET /api/recommendation/similar/note/{id}
searchByVibe(query, mediaType?, limit?) // POST /api/recommendation/by-vibe
getForYouRecommendations(limit?)       // GET /api/recommendation/for-you
getMediaForNote(noteId, limit?)        // GET /api/recommendation/media-for-note/{noteId}
getNotesForMedia(mediaItemId, limit?)  // GET /api/recommendation/notes-for-media/{mediaItemId}
```

### 1.3 Update `frontend/src/api/index.js`
Add exports for both new services.

---

## Phase 2: AI Admin Page

### 2.1 Create `frontend/src/components/AiAdminPage.jsx`
Follow TypesenseAdminPage.jsx pattern:

**Section 1: Service Status**
- AI available indicator (Chip: green/red)
- Recommendation service status
- Refresh button

**Section 2: Note Descriptions**
- Pending count display
- "Generate Batch Descriptions" button
- Result/progress display

**Section 3: Media Embeddings**
- Pending count display
- "Generate Batch Embeddings" button
- Result display

**Section 4: Note Embeddings**
- Pending count display
- "Generate Batch Embeddings" button
- Result display

### 2.2 Update Routes & Navigation
- `App.jsx`: Add `/ai-admin` route with ConditionalProtectedRoute
- `ResponsiveNavigation.jsx`: Add to adminMenuItems

---

## Phase 3: Notes Listing Page

### 3.1 Create `frontend/src/components/NotesListingPage.jsx`
Follow AllMedia.jsx pattern:

**State:**
- notes, loading, error
- viewMode ('card'/'list')
- selectedVault ('all'/'general'/'programming')
- searchQuery

**Features:**
- Vault filter dropdown
- Card/list view toggle
- Note cards showing: title, vault badge, tags, description excerpt
- Click to navigate to /note/:id
- Search via Typesense (existing searchNotes function)

### 3.2 Update Routes & Navigation
- `App.jsx`: Add `/notes` route
- `ResponsiveNavigation.jsx`: Add "Notes" to browseMediaMenuItems

---

## Phase 4: Recommendation Components

### 4.1 Create `frontend/src/components/SimilarItemsSection.jsx`
For MediaProfilePage:
- Props: `{ mediaItem, setSnackbar }`
- Fetch: `getSimilarMedia(mediaItem.id)`
- Display: Horizontal scroll of small media cards
- Handles: loading, empty state, no embedding state

### 4.2 Create `frontend/src/components/SimilarNotesSection.jsx`
For NoteProfilePage:
- Props: `{ note, setSnackbar }`
- Fetch: `getSimilarNotes(note.id)`
- Display: List of similar notes with vault badges

### 4.3 Create `frontend/src/components/RelatedMediaByEmbeddingSection.jsx`
For NoteProfilePage:
- Props: `{ note, setSnackbar }`
- Fetch: `getMediaForNote(note.id)`
- Display: Grid of related media cards

### 4.4 Update Profile Pages
- `MediaProfilePage.jsx`: Add SimilarItemsSection after RelatedNotesSection
- `NoteProfilePage.jsx`: Add SimilarNotesSection and RelatedMediaByEmbeddingSection

---

## Phase 5: Search by Vibe

### 5.1 Create `frontend/src/components/SearchByVibePage.jsx`
**Layout:**
- Large TextField for natural language query
- Media type filter (optional Select)
- Limit slider (optional, default 20)
- Search button

**Results:**
- Card/list view toggle
- Display results using existing media card patterns
- Similarity score display
- Empty/no results state

### 5.2 Update Routes & Navigation
- `App.jsx`: Add `/search-by-vibe` route
- `ResponsiveNavigation.jsx`: Add to main navigation or search section

---

## Files to Create (8 new files)
1. `frontend/src/api/aiService.js`
2. `frontend/src/api/recommendationService.js`
3. `frontend/src/components/AiAdminPage.jsx`
4. `frontend/src/components/NotesListingPage.jsx`
5. `frontend/src/components/SimilarItemsSection.jsx`
6. `frontend/src/components/SimilarNotesSection.jsx`
7. `frontend/src/components/RelatedMediaByEmbeddingSection.jsx`
8. `frontend/src/components/SearchByVibePage.jsx`

## Files to Modify (5 files)
1. `frontend/src/api/index.js` - Add exports
2. `frontend/src/App.jsx` - Add routes
3. `frontend/src/components/shared/ResponsiveNavigation.jsx` - Add nav items
4. `frontend/src/components/MediaProfilePage.jsx` - Add SimilarItemsSection
5. `frontend/src/components/NoteProfilePage.jsx` - Add recommendation sections

---

## Implementation Order
1. API Services (Phase 1) - Foundation
2. AI Admin Page (Phase 2) - Enables embedding generation
3. Notes Listing Page (Phase 3) - Standalone feature
4. Recommendation Components (Phase 4) - Requires embeddings
5. Search by Vibe (Phase 5) - Requires embeddings

---

## Verification Plan
1. **API Services**: Check browser console for successful API calls
2. **AI Admin**:
   - Visit /ai-admin, verify status displays
   - Click batch generate buttons, verify results
3. **Notes Listing**:
   - Visit /notes, verify notes load
   - Test vault filter and view toggle
4. **Recommendations**:
   - Visit a media item with embeddings, verify similar items show
   - Visit a note with embeddings, verify similar notes show
5. **Search by Vibe**:
   - Enter natural language query
   - Verify results display with similarity scores
