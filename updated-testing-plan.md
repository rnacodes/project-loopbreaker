# Updated Testing Plan for Project Loopbreaker

This document outlines the current state of testing in Project Loopbreaker and provides a plan for future tests based on existing and upcoming functionality.

## 1. Existing Tests

The following tests have already been implemented.

### Backend

#### Unit Tests

-   **`BaseMediaItemTests.cs`**:
    -   [x] Validates default constructor values for `BaseMediaItem`.
    -   [x] Tests property setters for `Title`, `Status`, `Rating`, `OwnershipStatus`, and `Link`.
    -   [x] Confirms collections (`Topics`, `Genres`, `Mixlists`) are initialized.

-   **`PodcastTests.cs`**:
    -   [x] Validates default constructor values for `Podcast`.
    -   [x] Tests `IsSeries` and `IsEpisode` boolean logic.
    -   [x] Verifies `GetEffectiveThumbnail()` logic for episodes inheriting from series.

-   **`BookServiceTests.cs`**:
    -   [x] Tests `GetAllBooksAsync`.
    -   [x] Tests `GetBookByIdAsync` (for existing and non-existing books).
    -   [x] Tests `GetBooksByAuthorAsync`.
    -   [x] Tests `GetBookSeriesAsync`.
    -   [x] Tests `CreateBookAsync` (new, existing, and null DTO).
    -   [x] Tests `UpdateBookAsync` (existing and non-existing).
    -   [x] Tests `DeleteBookAsync` (existing and non-existing).
    -   [x] Tests `BookExistsAsync`.

-   **`PodcastServiceTests.cs`**:
    -   [x] Tests `SavePodcastAsync` for creating and updating podcasts.
    -   [x] Tests `SavePodcastAsync` returns existing podcast if `updateIfExists` is false.
    -   [x] Tests `PodcastExistsAsync`.
    -   [x] Tests `GetPodcastByTitleAsync`.
    -   [x] Tests `PodcastEpisodeExistsAsync`.
    -   [x] Tests `GetPodcastEpisodeByTitleAsync`.

#### Integration Tests

-   **`BookControllerIntegrationTests.cs`**:
    -   [x] Tests `GET /api/book` when no books exist.
    -   [x] Tests `POST /api/book` with valid and invalid data.
    -   [x] Tests `GET /api/book/{id}` for existing and non-existing books.
    -   [x] Tests `PUT /api/book/{id}` for existing and non-existing books.
    -   [x] Tests `DELETE /api/book/{id}` for existing and non-existing books.
    -   [x] Tests `GET /api/book/by-author/{author}`.
    -   [x] Tests `GET /api/book/series`.

### Frontend

-   **`AddMediaForm.test.jsx`**:
    -   [x] Tests successful submission for regular media (Book).
    -   [x] Tests successful submission for Podcast Episode.
    -   [x] Tests successful submission for Podcast Series.
    -   [x] Tests required field validation (title, media type).
    -   [x] Tests adding created media to selected mixlists.
    -   [x] Tests graceful handling of API errors on submission.

-   **`CreateMixlistForm.test.jsx`**:
    -   [x] Tests successful form submission.
    -   [x] Tests name validation (empty, whitespace, trimming).
    -   [x] Tests that a unique thumbnail URL is generated for each submission.
    -   [x] Tests loading/disabled state during submission.
    -   [x] Tests API error handling.
    -   [x] Tests navigation on success and cancellation.

---

## 2. Tests to be Created (Existing Functionality)

The following tests are needed to ensure full coverage of the application's current features.

### Backend

#### Unit Tests

-   **`MixlistServiceTests.cs`**:
    -   [ ] Test `GetAllMixlistsAsync`.
    -   [ ] Test `GetMixlistByIdAsync`.
    -   [ ] Test `CreateMixlistAsync`.
    -   [ ] Test `UpdateMixlistAsync`.
    -   [ ] Test `DeleteMixlistAsync`.
    -   [ ] Test `AddMediaItemToMixlistAsync`.
    -   [ ] Test `RemoveMediaItemFromMixlistAsync`.

-   **`TopicServiceTests.cs` & `GenreServiceTests.cs`**:
    -   [ ] Test `GetAllAsync`.
    -   [ ] Test `GetByIdAsync`.
    -   [ ] Test `CreateAsync`.
    -   [ ] Test `DeleteAsync`.
    -   [ ] Test `SearchAsync`.

-   **`MediaServiceTests.cs`**:
    -   [ ] Test `AddMediaItemAsync` for all media types.
    -   [ ] Test `UpdateMediaItemAsync`.
    -   [ ] Test `GetMediaByTopicAsync`.
    -   [ ] Test `GetMediaByGenreAsync`.

-   **External API Client Unit Tests (`ListenNotesClient`, `OpenLibraryClient`, `TmdbClient`)**:
    -   [ ] Test successful deserialization of sample JSON responses.
    -   [ ] Test handling of null or missing fields in API responses.
    -   [ ] Test correct URL and parameter construction for API calls.

#### Integration Tests

-   **`MediaControllerIntegrationTests.cs`**:
    -   [ ] Test `GET /api/media`.
    -   [ ] Test `POST /api/media` for various media types.
    -   [ ] Test `GET /api/media/{id}`.
    -   [ ] Test `GET /api/media/search`.
    -   [ ] Test `GET /api/media/by-topic/{topicId}`.
    -   [ ] Test `GET /api/media/by-genre/{genreId}`.

-   **`MixlistControllerIntegrationTests.cs`**:
    -   [ ] Test all `MixlistController` endpoints (`GET`, `POST`, `PUT`, `DELETE`).
    -   [ ] Test adding and removing media items from a mixlist.

-   **`PodcastControllerIntegrationTests.cs`**:
    -   [ ] Test all `PodcastController` endpoints.
    -   [ ] Test podcast import from API endpoints (`/from-api/{podcastId}`, `/from-api/by-name`).

-   **`TopicsControllerIntegrationTests.cs` & `GenresControllerIntegrationTests.cs`**:
    -   [ ] Test all endpoints for both controllers.

-   **Repository Integration Tests (`MediaRepository`, etc.)**:
    -   [ ] Test basic CRUD operations against a test database.
    -   [ ] Test complex filtering and search logic.

### Frontend

-   **`ImportMediaPage.test.jsx`**:
    -   [ ] Test podcast search and import (by search, ID, name).
    -   [ ] Test book search and import (by search, ISBN, title/author).
    -   [ ] Test movie/TV show search and import.
    -   [ ] Test API error handling for each import source.
    -   [ ] Test navigation after successful import.

-   **`AllMedia.test.jsx`**:
    -   [ ] Test that media items are displayed correctly.
    -   [ ] Test filtering by media type.
    -   [ ] Test search functionality.

-   **`MixlistsPage.test.jsx` & `MixlistDetailPage.test.jsx`**:
    -   [ ] Test that mixlists are displayed.
    -   [ ] Test navigation to detail page.
    -   [ ] Test that media items within a mixlist are displayed on the detail page.

-   **`MediaItemProfile.test.jsx`**:
    -   [ ] Test that all media item details are rendered correctly.
    -   [ ] Test navigation to source link.

-   **`HomePage.test.jsx`**:
    -   [ ] Test rendering of mixlists and "Actively Exploring" carousels.
    -   [ ] Test navigation from media icons and action buttons.
    -   [ ] Test search bar functionality.

---

## 3. Tests for Upcoming Functionality

The following tests will need to be created as new features are developed.

### Backend

-   **Media Edit/Delete**:
    -   [ ] Unit tests for `UpdateAsync` and `DeleteAsync` in `MediaService`.
    -   [ ] Integration tests for `PUT /api/media/{id}` and `DELETE /api/media/{id}` endpoints.

-   **TypeSense Search Integration**:
    -   [ ] Unit tests for `TypeSenseService` mocking `ITypeSenseClient`.
    -   [ ] Test that `IndexMediaItemAsync` is called after creating/updating media.
    -   [ ] Integration tests for the new `GET /api/search` endpoint.

-   **Object Storage**:
    -   [ ] Unit tests for `S3CompatibleStorageClient` to ensure correct interaction with an S3-compatible API (using mocks).
    -   [ ] Integration test for file upload logic in `AddMediaItemAsync`.

-   **AI Content Enrichment**:
    -   [ ] Unit tests for `AISuggestionService` to verify calls to the LLM client.
    -   [ ] Unit tests for the web scraper client.
    -   [ ] Test the orchestration logic in `MediaAppService` to ensure scraper and AI services are called correctly.

-   **New Media Types (Movies, TV Shows, Music, etc.)**:
    -   [ ] Domain unit tests for new entities (e.g., `Movie`, `TvShow`).
    -   [ ] Service-level unit tests for any specific business logic related to new media types.
    -   [ ] Controller integration tests for CRUD operations on new media types.

### Frontend

-   **EditMediaForm.jsx**:
    -   [ ] Test that the form is pre-filled with the correct media item data.
    -   [ ] Test successful submission of updated data.
    -   [ ] Test handling of API errors.

-   **Delete Confirmation Dialog**:
    -   [ ] Test that the confirmation dialog appears on delete button click.
    -   [ ] Test that the delete API call is made on confirmation.
    -   [ ] Test that the item is removed from the UI after successful deletion.

-   **TypeSense-powered Search**:
    -   [ ] Test that the main search bar calls the new `/api/search` endpoint.
    -   [ ] Test that search results from TypeSense are displayed correctly.

-   **Displaying AI-Generated Content**:
    -   [ ] Test that the AI summary and categories are displayed on the media profile page.

