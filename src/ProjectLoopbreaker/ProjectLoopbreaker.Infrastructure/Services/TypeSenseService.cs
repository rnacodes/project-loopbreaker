using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Infrastructure.Models;
using ProjectLoopbreaker.Shared.Interfaces;
using Typesense;
using Typesense.Setup;

namespace ProjectLoopbreaker.Infrastructure.Services
{
    /// <summary>
    /// Service for managing Typesense search indexing and querying.
    /// Handles CRUD synchronization between PostgreSQL and Typesense.
    /// </summary>
    public class TypeSenseService : ITypeSenseService
    {
        private readonly ITypesenseClient _typesenseClient;
        private readonly IApplicationDbContext _context;
        private readonly ILogger<TypeSenseService> _logger;
        private const string COLLECTION_NAME = "media_items";

        public TypeSenseService(
            ITypesenseClient typesenseClient,
            IApplicationDbContext context,
            ILogger<TypeSenseService> logger)
        {
            _typesenseClient = typesenseClient;
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// Ensures the media_items collection exists with proper schema.
        /// Called once during application startup.
        /// </summary>
        public async Task EnsureCollectionExistsAsync()
        {
            try
            {
                // Try to retrieve the collection to check if it exists
                await _typesenseClient.RetrieveCollection(COLLECTION_NAME);
                _logger.LogInformation("Typesense collection '{CollectionName}' already exists.", COLLECTION_NAME);
            }
            catch (TypesenseApiNotFoundException)
            {
                // Collection doesn't exist, create it
                _logger.LogInformation("Creating Typesense collection '{CollectionName}'...", COLLECTION_NAME);

                var schema = new Schema(COLLECTION_NAME, new List<Field>
                {
                    new Field("id", FieldType.String, false), // Not facet, primary key
                    new Field("title", FieldType.String, false), // Searchable
                    new Field("media_type", FieldType.String, true), // Facetable for filtering
                    new Field("description", FieldType.String, false, optional: true), // Searchable, optional
                    new Field("topics", FieldType.StringArray, true), // Facetable array
                    new Field("genres", FieldType.StringArray, true), // Facetable array
                    new Field("date_added", FieldType.Int64, false), // Sortable timestamp
                    new Field("status", FieldType.String, true), // Facetable
                    new Field("rating", FieldType.String, true, optional: true), // Facetable, optional
                    new Field("thumbnail", FieldType.String, false, optional: true, index: false), // Not searchable, not indexed
                    new Field("author", FieldType.String, true, optional: true), // Searchable and facetable
                    new Field("director", FieldType.String, true, optional: true), // Searchable and facetable
                    new Field("creator", FieldType.String, true, optional: true), // Searchable and facetable
                    new Field("publisher", FieldType.String, true, optional: true), // Searchable and facetable
                    new Field("release_year", FieldType.Int32, true, optional: true), // Facetable
                    new Field("platform", FieldType.String, true, optional: true) // Facetable
                })
                {
                    DefaultSortingField = "date_added" // Sort by most recently added by default
                };

                await _typesenseClient.CreateCollection(schema);
                _logger.LogInformation("Successfully created Typesense collection '{CollectionName}'.", COLLECTION_NAME);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ensuring Typesense collection exists.");
                throw;
            }
        }

        /// <summary>
        /// Indexes or updates a single media item in Typesense.
        /// Uses upsert operation for efficiency.
        /// </summary>
        public async Task IndexMediaItemAsync(
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
            Dictionary<string, object>? additionalFields = null)
        {
            try
            {
                var document = new MediaItemDocument
                {
                    Id = id.ToString(),
                    Title = title,
                    MediaType = mediaType,
                    Description = description,
                    Topics = topics ?? new List<string>(),
                    Genres = genres ?? new List<string>(),
                    DateAdded = ((DateTimeOffset)dateAdded).ToUnixTimeSeconds(),
                    Status = status,
                    Rating = rating,
                    Thumbnail = thumbnail
                };

                // Add media-specific fields if provided
                if (additionalFields != null)
                {
                    if (additionalFields.TryGetValue("author", out var author))
                        document.Author = author?.ToString();
                    
                    if (additionalFields.TryGetValue("director", out var director))
                        document.Director = director?.ToString();
                    
                    if (additionalFields.TryGetValue("creator", out var creator))
                        document.Creator = creator?.ToString();
                    
                    if (additionalFields.TryGetValue("publisher", out var publisher))
                        document.Publisher = publisher?.ToString();
                    
                    if (additionalFields.TryGetValue("release_year", out var releaseYear) && releaseYear != null)
                        document.ReleaseYear = Convert.ToInt32(releaseYear);
                    
                    if (additionalFields.TryGetValue("platform", out var platform))
                        document.Platform = platform?.ToString();
                }

                // Upsert: creates if new, updates if exists
                await _typesenseClient.UpsertDocument<MediaItemDocument>(COLLECTION_NAME, document);
                
                _logger.LogDebug("Successfully indexed media item {Id} ({Title}) in Typesense.", id, title);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error indexing media item {Id} in Typesense.", id);
                throw;
            }
        }

        /// <summary>
        /// Deletes a media item from the Typesense index.
        /// </summary>
        public async Task DeleteMediaItemAsync(Guid id)
        {
            try
            {
                await _typesenseClient.DeleteDocument<MediaItemDocument>(COLLECTION_NAME, id.ToString());
                _logger.LogDebug("Successfully deleted media item {Id} from Typesense.", id);
            }
            catch (TypesenseApiNotFoundException)
            {
                _logger.LogWarning("Media item {Id} not found in Typesense (may have already been deleted).", id);
                // Don't throw - it's fine if the document doesn't exist
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting media item {Id} from Typesense.", id);
                throw;
            }
        }

        /// <summary>
        /// Searches the media_items collection in Typesense.
        /// </summary>
        public async Task<object> SearchAsync(string query, string? filters = null, int perPage = 20, int page = 1)
        {
            try
            {
                // Create search parameters with query and queryBy fields
                var searchParameters = new SearchParameters(
                    query,
                    // Search across these fields
                    "title,description,author,director,creator,publisher"
                )
                {
                    PerPage = perPage,
                    Page = page,
                    // Sort by relevance first, then by recency
                    SortBy = "_text_match:desc,date_added:desc"
                };

                // Add filters if provided (e.g., "media_type:=Book")
                if (!string.IsNullOrEmpty(filters))
                {
                    searchParameters.FilterBy = filters;
                }

                var searchResult = await _typesenseClient.Search<MediaItemDocument>(COLLECTION_NAME, searchParameters);
                
                _logger.LogDebug("Search for '{Query}' returned {Count} results.", query, searchResult.Found);
                
                return searchResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching Typesense for query '{Query}'.", query);
                throw;
            }
        }

        /// <summary>
        /// Re-indexes all media items from PostgreSQL into Typesense.
        /// Useful for initial setup or full synchronization.
        /// </summary>
        public async Task<int> BulkReindexAllMediaItemsAsync()
        {
            try
            {
                _logger.LogInformation("Starting bulk re-index of all media items...");

                // Fetch all media items with their topics and genres
                var mediaItems = await _context.MediaItems
                    .Include(m => m.Topics)
                    .Include(m => m.Genres)
                    .AsNoTracking()
                    .ToListAsync();

                var documents = new List<MediaItemDocument>();

                foreach (var item in mediaItems)
                {
                    var additionalFields = new Dictionary<string, object>();

                    // Extract media-specific fields based on type
                    switch (item.MediaType.ToString())
                    {
                        case "Article":
                            var article = await _context.Articles.AsNoTracking()
                                .FirstOrDefaultAsync(a => a.Id == item.Id);
                            if (article?.Author != null)
                                additionalFields["author"] = article.Author;
                            break;

                        case "Book":
                            var book = await _context.Books.AsNoTracking()
                                .FirstOrDefaultAsync(b => b.Id == item.Id);
                            if (book?.Author != null)
                                additionalFields["author"] = book.Author;
                            break;

                        case "Movie":
                            var movie = await _context.Movies.AsNoTracking()
                                .FirstOrDefaultAsync(m => m.Id == item.Id);
                            if (movie?.Director != null)
                                additionalFields["director"] = movie.Director;
                            if (movie?.ReleaseYear != null)
                                additionalFields["release_year"] = movie.ReleaseYear.Value;
                            break;

                        case "TVShow":
                            var tvShow = await _context.TvShows.AsNoTracking()
                                .FirstOrDefaultAsync(t => t.Id == item.Id);
                            if (tvShow?.Creator != null)
                                additionalFields["creator"] = tvShow.Creator;
                            if (tvShow?.FirstAirYear != null)
                                additionalFields["release_year"] = tvShow.FirstAirYear.Value;
                            break;

                        case "Podcast":
                            var podcast = await _context.PodcastSeries.AsNoTracking()
                                .FirstOrDefaultAsync(p => p.Id == item.Id);
                            if (podcast?.Publisher != null)
                                additionalFields["publisher"] = podcast.Publisher;
                            break;

                        case "Video":
                            var video = await _context.Videos.AsNoTracking()
                                .FirstOrDefaultAsync(v => v.Id == item.Id);
                            if (video?.Platform != null)
                                additionalFields["platform"] = video.Platform;
                            break;
                    }

                    var document = new MediaItemDocument
                    {
                        Id = item.Id.ToString(),
                        Title = item.Title,
                        MediaType = item.MediaType.ToString(),
                        Description = item.Description,
                        Topics = item.Topics.Select(t => t.Name).ToList(),
                        Genres = item.Genres.Select(g => g.Name).ToList(),
                        DateAdded = ((DateTimeOffset)item.DateAdded).ToUnixTimeSeconds(),
                        Status = item.Status.ToString(),
                        Rating = item.Rating?.ToString(),
                        Thumbnail = item.Thumbnail
                    };

                    // Apply additional fields
                    if (additionalFields.TryGetValue("author", out var author))
                        document.Author = author.ToString();
                    if (additionalFields.TryGetValue("director", out var director))
                        document.Director = director.ToString();
                    if (additionalFields.TryGetValue("creator", out var creator))
                        document.Creator = creator.ToString();
                    if (additionalFields.TryGetValue("publisher", out var publisher))
                        document.Publisher = publisher.ToString();
                    if (additionalFields.TryGetValue("release_year", out var releaseYear))
                        document.ReleaseYear = Convert.ToInt32(releaseYear);
                    if (additionalFields.TryGetValue("platform", out var platform))
                        document.Platform = platform.ToString();

                    documents.Add(document);
                }

                // Import documents in batch (more efficient than individual upserts)
                var importResults = await _typesenseClient.ImportDocuments<MediaItemDocument>(
                    COLLECTION_NAME, 
                    documents, 
                    40, // Batch size
                    ImportType.Upsert
                );

                var successCount = importResults.Count(r => r.Success);
                var failureCount = importResults.Count(r => !r.Success);

                _logger.LogInformation(
                    "Bulk re-index complete. Success: {SuccessCount}, Failures: {FailureCount}", 
                    successCount, 
                    failureCount
                );

                if (failureCount > 0)
                {
                    _logger.LogWarning("Some documents failed to index. Check Typesense logs for details.");
                }

                return successCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk re-index of media items.");
                throw;
            }
        }
    }
}
