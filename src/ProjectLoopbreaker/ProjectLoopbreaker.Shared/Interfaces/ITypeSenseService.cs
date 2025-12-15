namespace ProjectLoopbreaker.Shared.Interfaces
{
    /// <summary>
    /// Service interface for Typesense search integration.
    /// Manages document indexing and search operations for the media_items collection.
    /// </summary>
    public interface ITypeSenseService
    {
        /// <summary>
        /// Ensures the media_items collection exists in Typesense.
        /// Creates the collection if it doesn't exist, or skips if it does.
        /// Should be called once during application startup.
        /// </summary>
        Task EnsureCollectionExistsAsync();

        /// <summary>
        /// Indexes or updates a media item document in Typesense.
        /// Uses upsert operation - creates if new, updates if exists.
        /// </summary>
        /// <param name="id">The unique ID of the media item (from PostgreSQL)</param>
        /// <param name="title">The title of the media item</param>
        /// <param name="mediaType">The type of media (Article, Book, Movie, etc.)</param>
        /// <param name="description">Optional description text</param>
        /// <param name="topics">List of topic names associated with the item</param>
        /// <param name="genres">List of genre names associated with the item</param>
        /// <param name="dateAdded">When the item was added to the library</param>
        /// <param name="status">Current status (Uncharted, ActivelyExploring, etc.)</param>
        /// <param name="rating">Optional rating (SuperLike, Like, etc.)</param>
        /// <param name="thumbnail">Optional thumbnail URL</param>
        /// <param name="additionalFields">Optional dictionary for media-specific fields (e.g., author, director, publisher)</param>
        Task IndexMediaItemAsync(
            Guid id,
            string title,
            string mediaType,
            string? description,
            List<string> topics,
            List<string> genres,
            DateTime dateAdded,
            string status,
            string? rating,
            string? thumbnail,
            Dictionary<string, object>? additionalFields = null);

        /// <summary>
        /// Deletes a media item document from Typesense.
        /// </summary>
        /// <param name="id">The unique ID of the media item to delete</param>
        Task DeleteMediaItemAsync(Guid id);

        /// <summary>
        /// Performs a search across the media_items collection.
        /// </summary>
        /// <param name="query">The search query text</param>
        /// <param name="filters">Optional filter by string (e.g., "mediaType:=Book")</param>
        /// <param name="perPage">Number of results per page (default 20)</param>
        /// <param name="page">Page number (default 1)</param>
        /// <returns>Search results as dynamic objects</returns>
        Task<object> SearchAsync(string query, string? filters = null, int perPage = 20, int page = 1);

        /// <summary>
        /// Performs a bulk re-index of all media items from the database.
        /// Useful for initial setup or full data synchronization.
        /// </summary>
        Task<int> BulkReindexAllMediaItemsAsync();
    }
}
