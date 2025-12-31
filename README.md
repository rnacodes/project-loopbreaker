# My MediaVerse

My MediaVerse (formerly Project Loopbreaker) is an in-progress .NET 8 web API comprehensive media library management system with options to manually add items or fetch them using external APIs. The program is designed to help users manage and organize their media consumption across multiple content types. Each media item has its own profile page with thumbnail and content information. The organization system is based around "mixlists," which are themed user-created playlists that can contain any type of media or utilize any criteria.

## Features

### Media Library Management

- **Multi-format Support**: Can currently be used to track books and podcasts, with more media formats coming soon.
- **Status Tracking**: Mark items' status with Uncharted, In Progress, Consumed, Did Not Finish statuses.
- **Rating System**: Rate content with SuperLike, Like, Neutral, or Dislike ratings
- **Personal Notes**: Add custom notes and link to external documentation
- **Genre & Topic Classification**: Categorize content with genres and topics for better organization
- **Book-Specific Features**: Author tracking, ISBN/ASIN support, format classification (Digital, Paperback, Hardcover, Audiobook), series identification
- **Playlist Management**: Create themed collections of mixed media types (replacing the old "playlist" concept)
- **Ownership Status**: Track whether you own, want to buy, or have borrowed items

## External API Integrations

- **OpenLibrary API Integration**: Search and import books by title, author, or ISBN with automatic metadata retrieval
- **ListenNotes API Integration**: Search and import podcasts with comprehensive metadata
  - **Media Management**: Full CRUD operations for all media types
- **Book Management**: Specialized book operations with OpenLibrary integration
- **Mixlist Management**: Create, update, and manage themed collections

## File Management & Storage

- **DigitalOcean Spaces Integration**: Automatic thumbnail upload and storage
- **Bulk Import**: CSV and JSON import capabilities for existing media collections

## Technology Stack

- **.NET 8**: Modern C# web API framework
- **Entity Framework Core**: ORM with PostgreSQL database support
- **PostgreSQL**: Primary database for media library storage. Enhanced with proper indexing and relationship management.
- **ASP.NET Core**: Web API framework with CORS support
- **Swagger/OpenAPI**: API documentation and testing interface
- **Digital Ocean Spaces**: Cloud storage for thumbnails and eventually personal documents. 
- **Render.com**: platform to deploy app frontend and backend and also hosts Postgres database.
- **AWS SDK for .NET**: S3-compatible storage integration

## Roadmap

- **Additional Media Type Support**: App will support specific fields for articles, personal documents, movies, music, TV shows, videos, video games, and websites, with option to add other kinds of media.
- **Search & Filtering**: Advanced search by topic, genre, and media type
- **Search engine integration**: Likely Elasticsearch or Meilisearch. This will allow for indexing of the database and documents to produce more precise searches when looking for particular types of media to enjoy.
- **Connection with Digital Notebook**: I use Obsidian as a Commonplace Book/Second Brain/Zettelkasten.
- **File Upload Support**: Drag & drop interface for media files and thumbnails
- **AI Integration**: the user will be able to generate thumbnails for mixlists using AI. AI will also be used to provide more detailed search suggestions and recommendations.

*** Please do not copy or redistribute ***

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/rnacodes/project-loopbreaker)


