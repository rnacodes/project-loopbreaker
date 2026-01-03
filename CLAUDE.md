# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ProjectLoopbreaker is a personal media library management application with a React + Vite frontend and ASP.NET Core 8.0 backend using PostgreSQL. It tracks various media types: podcasts, books, movies, TV shows, YouTube videos/channels/playlists, articles, and websites.

## Tech Stack

**Frontend:** React 18 + Vite, Material-UI, React Router v7, Vitest for testing
**Backend:** .NET 8, Entity Framework Core with PostgreSQL, JWT authentication
**External APIs:** ListenNotes (podcasts), TMDB (movies/TV), YouTube Data API, Readwise, Open Library
**Infrastructure:** DigitalOcean Spaces for file storage, Typesense for search

## Build & Run Commands

### Frontend (from `frontend/` directory)

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (defaults to localhost:5173)
npm run build        # Production build
npm run lint         # Run ESLint
npm test             # Run Vitest in watch mode
npm run test:run     # Run tests once
npm run test:coverage # Run tests with coverage
```

### Backend (from `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/` directory)

```bash
dotnet build         # Build the project
dotnet run           # Run the API (localhost:5033)
dotnet test          # Run tests
```

### Full Solution

```bash
# From root directory
dotnet build src/ProjectLoopbreaker/ProjectLoopbreaker.sln
dotnet test tests/ProjectLoopbreaker.UnitTests/ProjectLoopbreaker.UnitTests.csproj
dotnet test tests/ProjectLoopbreaker.IntegrationTests/ProjectLoopbreaker.IntegrationTests.csproj

# PowerShell scripts for comprehensive testing
.\run-all-tests.ps1       # Run backend + frontend tests with logging
.\run-backend-tests.ps1   # Backend only
.\run-frontend-tests.ps1  # Frontend only
```

## Architecture

### Backend Layer Structure

```
src/ProjectLoopbreaker/
├── ProjectLoopbreaker.Web.API/      # Controllers, middleware, Program.cs
├── ProjectLoopbreaker.Application/  # Application services, interfaces
├── ProjectLoopbreaker.Domain/       # Domain entities, interfaces
├── ProjectLoopbreaker.Infrastructure/ # EF Core, external API clients
├── ProjectLoopbreaker.DTOs/         # Data transfer objects
└── ProjectLoopbreaker.Shared/       # Shared utilities
```

### Frontend Structure

```
frontend/src/
├── components/          # React components (pages and reusable)
│   ├── __tests__/      # Component tests
│   ├── search/         # Search-related components
│   └── shared/         # Reusable UI components
├── contexts/           # React contexts (AuthContext)
├── services/           # API service layer (apiService.js)
├── pages/              # Page components
└── utils/              # Utility functions
```

### Key Patterns

- **Controllers:** REST API at `/api/{controller}` - all endpoints prefixed with `/api`
- **Services:** Business logic in Application layer, infrastructure details in Infrastructure layer
- **API Client:** Frontend uses `apiService.js` for all backend calls with axios
- **Auth:** JWT-based authentication via `AuthContext` and `ProtectedRoute` components

## Environment Variables

### Frontend

```
VITE_API_URL=https://www.api.mymediaverseuniverse.com/api  # MUST include /api suffix
```

### Backend (required)

```
DATABASE_URL or ConnectionStrings__DefaultConnection  # PostgreSQL connection
JWT_SECRET                     # Min 32 characters
AUTH_USERNAME / AUTH_PASSWORD  # Login credentials
FRONTEND_URL                   # For CORS
```

### Backend (optional API keys)

```
LISTENNOTES_API_KEY, TMDB_API_KEY, YOUTUBE_API_KEY, READWISE_API_KEY
DIGITALOCEANSPACES__ACCESSKEY, DIGITALOCEANSPACES__SECRETKEY
TYPESENSE_ADMIN_API_KEY, TYPESENSE_HOST
```

## API Endpoints

Base URL: `http://localhost:5033/api` (dev) or production domain with `/api`

Key controllers: `auth`, `media`, `mixlist`, `podcast`, `book`, `movie`, `tvshow`, `youtube`, `article`, `website`, `topics`, `genres`, `search`, `highlights`

## Testing

Frontend tests use Vitest with React Testing Library. Tests are in `frontend/src/components/__tests__/`.

Backend uses xUnit with unit tests and integration tests in separate projects under `tests/`.

Test logs are saved to `logs/` directory with timestamps.



## Rules carried over from Cursor

When starting the frontend, use 'npm start' as the command, and ask the user to run it since running in the IDE doesn't always work.

The user prefers the assistant to consistently use PascalCase or camelCase based on existing code conventions.

Cannot use && in terminal commands when using run_terminal_cmd tool. Must use separate commands instead of chaining with &&.

For ProjectLoopbreaker, Entity Framework commands should ALWAYS be run from the Web.API startup project directory: C:\Users\rashi\source\repos\ProjectLoopbreaker\src\ProjectLoopbreaker\ProjectLoopbreaker.Web.API. Use commands like: `dotnet ef migrations add [name] --project ..\ProjectLoopbreaker.Infrastructure` and `dotnet ef database update --project ..\ProjectLoopbreaker.Infrastructure`

For ProjectLoopbreaker frontend, these are the exact route URLs that must be used consistently: "/" (HomePage), "/add-media" (AddMediaForm), "/all-media" (AllMedia), "/mixlists" (MixlistsPage), "/mixlist/:id" (MixlistDetailPage), "/create-mixlist" (CreateMixlistForm), "/import-media" (ImportMediaPage), "/search-by-topic-genre" (SearchByTopicOrGenre), "/search-results" (SearchResults), "/media/:id" (MediaItemProfile), "/demo" (DemoPage). Never change these base page routes unless specifically requested.

ProjectLoopbreaker backend API endpoints: 
**Media Controller (/api/media):** GET / (GetAllMedia), POST / (AddMediaItem), GET /{id} (GetMediaItem), PUT /{id} (UpdateMediaItem), GET /search (SearchMedia), GET /by-topic/{topicId} (GetMediaByTopic), GET /by-genre/{genreId} (GetMediaByGenre)
**Mixlist Controller (/api/mixlist):** GET / (GetAllMixlists), GET /{id} (GetMixlist), POST / (CreateMixlist), POST /{mixlistId}/items/{mediaItemId} (AddMediaItemToMixlist), PUT /{id} (UpdateMixlist), DELETE /{mixlistId}/items/{mediaItemId} (RemoveMediaFromMixlist)
**Podcast Controller (/api/podcast):** GET / (GetAllPodcasts), GET /series (GetPodcastSeries), GET /series/search (SearchPodcastSeries), GET /{id} (GetPodcast), GET /series/{seriesId}/episodes (GetEpisodesBySeriesId), POST / (CreatePodcast), POST /episode (CreatePodcastEpisode), POST /from-api/{podcastId} (ImportPodcastFromApi), POST /from-api/by-name (ImportPodcastByName), DELETE /{id} (DeletePodcast)
**Topics Controller (/api/topics):** GET / (GetAllTopics), GET /search (SearchTopics), GET /{id} (GetTopic), POST / (CreateTopic), DELETE /{id} (DeleteTopic)
**Genres Controller (/api/genres):** GET / (GetAllGenres), GET /search (SearchGenres), GET /{id} (GetGenre), POST / (CreateGenre), DELETE /{id} (DeleteGenre)
**ListenNotes Controller (/api/ListenNotes):** GET /podcasts/{id}, GET /playlists, GET /playlists/{id}, GET /search, GET /genres, GET /episodes/{id}, GET /best-podcasts, GET /curated-podcasts, GET /curated-podcasts/{id}, GET /podcasts/{id}/recommendations, GET /episodes/{id}/recommendations
**MockListenNotes Controller (/api/MockListenNotes):** GET /search, GET /search-episode-titles, GET /best-podcasts, GET /podcasts/{id}, GET /episodes/{id}, GET /curated-podcasts/{id}, GET /genres, GET /playlists, GET /playlists/{id}
**Dev Controller (/api/dev):** POST /reset-database
These endpoints must not be changed unless specifically requested.

For ProjectLoopbreaker, all internal API properties (DTOs, controllers, clients) should use camelCase for both requests and responses. The only exception is when importing from external APIs that use different casing - in those cases, preserve the external API's casing.

The project API runs on port 5033, and the frontend uses http://localhost:5033/api for API requests.

When running terminal commands in ProjectLoopbreaker, use PowerShell syntax with semicolons (;) instead of && for command chaining. Additionally, && cannot be used in commands for this program at all. For web requests, use Invoke-WebRequest instead of curl -X GET. For example: "Invoke-WebRequest -Uri 'url' -Method GET" instead of "curl -X GET 'url'", and "cd src; dotnet build" instead of "cd src && dotnet build".

NEVER EVER create any documentation files (.md, .txt, README, guides, etc.) without EXPLICITLY asking the user first. This is CRITICAL to avoid wasting tokens. This applies to ALL documentation including: markdown files, README files, troubleshooting guides, testing guides, change logs, summaries, migration plans, implementation plans, incident reports, and any other documentation. The ONLY exception is when the user explicitly asks "create documentation" or "write a guide" or similar direct requests. Even for critical incidents, bugs, or important information, ASK FIRST before creating documentation. Before creating ANY documentation: 1) Ask the user for permission, 2) Check if existing docs can be updated instead. The user has emphasized this is VERY IMPORTANT multiple times to avoid token waste.

The mock ListenNotes podcast API importer should be ignored. All API endpoints must use the real ListenNotes API.

User prefers that genres and topics (where applicable and relevant, including via ListenNotes import, OpenLibrary import, and manual frontend entry) always be converted to lowercase before being stored in the database.

The user prefers that the assistant not edit the appsettings files unless explicitly asked or given explicit permission.

Always maintain clean architecture and dependency inversion principles when making code changes. Key rules: 1) Application layer should never directly reference Infrastructure layer - use interfaces in Shared layer instead, 2) Dependencies should flow inward: Infrastructure → Shared, Application → Shared, Web.API → Infrastructure/Application/Shared, 3) Avoid circular dependencies at all costs, 4) Use dependency injection to register concrete implementations against interfaces, 5) Place shared interfaces in Shared layer where multiple layers need access, not in Application layer if Infrastructure needs to implement them.

The user prefers the assistant to consistently use PascalCase or camelCase based on existing code conventions.
