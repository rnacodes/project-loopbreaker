using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
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
        private readonly string _mediaCollectionName;
        private readonly string _mixlistCollectionName;

        public TypeSenseService(
            ITypesenseClient typesenseClient,
            IApplicationDbContext context,
            ILogger<TypeSenseService> logger,
            IConfiguration configuration)
        {
            _typesenseClient = typesenseClient;
            _context = context;
            _logger = logger;
            
            // Get the collection prefix from configuration (e.g., "demo_" for demo site)
            var collectionPrefix = Environment.GetEnvironmentVariable("TYPESENSE_COLLECTION_PREFIX") ?? 
                                 configuration["Typesense:CollectionPrefix"] ?? 
                                 string.Empty;
            
            // Dynamically set collection names with prefix
            _mediaCollectionName = $"{collectionPrefix}media_items";
            _mixlistCollectionName = $"{collectionPrefix}mixlists";
            
            _logger.LogInformation("TypeSense collections configured with prefix '{Prefix}': {MediaCollection}, {MixlistCollection}", 
                collectionPrefix, _mediaCollectionName, _mixlistCollectionName);
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
                await _typesenseClient.RetrieveCollection(_mediaCollectionName);
                _logger.LogInformation("Typesense collection '{CollectionName}' already exists.", _mediaCollectionName);
            }
            catch (TypesenseApiNotFoundException)
            {
                // Collection doesn't exist, create it
                _logger.LogInformation("Creating Typesense collection '{CollectionName}'...", _mediaCollectionName);

                var schema = new Schema(_mediaCollectionName, new List<Field>
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
                _logger.LogInformation("Successfully created Typesense collection '{CollectionName}'.", _mediaCollectionName);
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
                await _typesenseClient.UpsertDocument<MediaItemDocument>(_mediaCollectionName, document);
                
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
                await _typesenseClient.DeleteDocument<MediaItemDocument>(_mediaCollectionName, id.ToString());
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

                var searchResult = await _typesenseClient.Search<MediaItemDocument>(_mediaCollectionName, searchParameters);
                
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
                    _mediaCollectionName, 
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

        /// <summary>
        /// Ensures the mixlists collection exists with proper schema.
        /// Called during application startup.
        /// </summary>
        public async Task EnsureMixlistCollectionExistsAsync()
        {
            try
            {
                // Try to retrieve the collection to check if it exists
                await _typesenseClient.RetrieveCollection(_mixlistCollectionName);
                _logger.LogInformation("Typesense collection '{CollectionName}' already exists.", _mixlistCollectionName);
            }
            catch (TypesenseApiNotFoundException)
            {
                // Collection doesn't exist, create it
                _logger.LogInformation("Creating Typesense collection '{CollectionName}'...", _mixlistCollectionName);

                var schema = new Schema(_mixlistCollectionName, new List<Field>
                {
                    new Field("id", FieldType.String, false), // Primary key
                    new Field("name", FieldType.String, false), // Searchable
                    new Field("description", FieldType.String, false, optional: true), // Searchable, optional
                    new Field("thumbnail", FieldType.String, false, optional: true, index: false), // Not searchable
                    new Field("date_created", FieldType.Int64, false), // Sortable timestamp
                    new Field("media_item_count", FieldType.Int32, false), // Sortable/facetable
                    new Field("media_item_titles", FieldType.StringArray, false, optional: true), // Searchable array
                    new Field("topics", FieldType.StringArray, true, optional: true), // Facetable array
                    new Field("genres", FieldType.StringArray, true, optional: true) // Facetable array
                })
                {
                    DefaultSortingField = "date_created" // Sort by most recently created by default
                };

                await _typesenseClient.CreateCollection(schema);
                _logger.LogInformation("Successfully created Typesense collection '{CollectionName}'.", _mixlistCollectionName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error ensuring Typesense mixlist collection exists.");
                throw;
            }
        }

        /// <summary>
        /// Indexes or updates a single mixlist in Typesense.
        /// Uses upsert operation for efficiency.
        /// </summary>
        public async Task IndexMixlistAsync(
            Guid id,
            string name,
            string? description,
            string? thumbnail,
            DateTime dateCreated,
            List<string> mediaItemTitles,
            List<string> topics,
            List<string> genres)
        {
            try
            {
                var document = new MixlistDocument
                {
                    Id = id.ToString(),
                    Name = name,
                    Description = description,
                    Thumbnail = thumbnail,
                    DateCreated = ((DateTimeOffset)dateCreated).ToUnixTimeSeconds(),
                    MediaItemCount = mediaItemTitles.Count,
                    MediaItemTitles = mediaItemTitles ?? new List<string>(),
                    Topics = topics ?? new List<string>(),
                    Genres = genres ?? new List<string>()
                };

                // Upsert: creates if new, updates if exists
                await _typesenseClient.UpsertDocument<MixlistDocument>(_mixlistCollectionName, document);
                
                _logger.LogDebug("Successfully indexed mixlist {Id} ({Name}) in Typesense.", id, name);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error indexing mixlist {Id} in Typesense.", id);
                throw;
            }
        }

        /// <summary>
        /// Deletes a mixlist from the Typesense index.
        /// </summary>
        public async Task DeleteMixlistAsync(Guid id)
        {
            try
            {
                await _typesenseClient.DeleteDocument<MixlistDocument>(_mixlistCollectionName, id.ToString());
                _logger.LogDebug("Successfully deleted mixlist {Id} from Typesense.", id);
            }
            catch (TypesenseApiNotFoundException)
            {
                _logger.LogWarning("Mixlist {Id} not found in Typesense (may have already been deleted).", id);
                // Don't throw - it's fine if the document doesn't exist
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting mixlist {Id} from Typesense.", id);
                throw;
            }
        }

        /// <summary>
        /// Searches the mixlists collection in Typesense.
        /// </summary>
        public async Task<object> SearchMixlistsAsync(string query, string? filters = null, int perPage = 20, int page = 1)
        {
            try
            {
                // Create search parameters with query and queryBy fields
                var searchParameters = new SearchParameters(
                    query,
                    // Search across these fields
                    "name,description,media_item_titles"
                )
                {
                    PerPage = perPage,
                    Page = page,
                    // Sort by relevance first, then by recency
                    SortBy = "_text_match:desc,date_created:desc"
                };

                // Add filters if provided (e.g., "topics:=productivity")
                if (!string.IsNullOrEmpty(filters))
                {
                    searchParameters.FilterBy = filters;
                }

                var searchResult = await _typesenseClient.Search<MixlistDocument>(_mixlistCollectionName, searchParameters);
                
                _logger.LogDebug("Mixlist search for '{Query}' returned {Count} results.", query, searchResult.Found);
                
                return searchResult;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching Typesense mixlists for query '{Query}'.", query);
                throw;
            }
        }

        /// <summary>
        /// Re-indexes all mixlists from PostgreSQL into Typesense.
        /// Useful for initial setup or full synchronization.
        /// </summary>
        public async Task<int> BulkReindexAllMixlistsAsync()
        {
            try
            {
                _logger.LogInformation("Starting bulk re-index of all mixlists...");

                // Fetch all mixlists with their media items and related data
                var mixlists = await _context.Mixlists
                    .Include(m => m.MediaItems)
                        .ThenInclude(mi => mi.Topics)
                    .Include(m => m.MediaItems)
                        .ThenInclude(mi => mi.Genres)
                    .AsNoTracking()
                    .ToListAsync();

                var documents = new List<MixlistDocument>();

                foreach (var mixlist in mixlists)
                {
                    var mediaItemTitles = mixlist.MediaItems.Select(mi => mi.Title).ToList();
                    var topics = mixlist.MediaItems
                        .SelectMany(mi => mi.Topics.Select(t => t.Name))
                        .Distinct()
                        .ToList();
                    var genres = mixlist.MediaItems
                        .SelectMany(mi => mi.Genres.Select(g => g.Name))
                        .Distinct()
                        .ToList();

                    var document = new MixlistDocument
                    {
                        Id = mixlist.Id.ToString(),
                        Name = mixlist.Name,
                        Description = mixlist.Description,
                        Thumbnail = mixlist.Thumbnail,
                        DateCreated = ((DateTimeOffset)mixlist.DateCreated).ToUnixTimeSeconds(),
                        MediaItemCount = mixlist.MediaItems.Count,
                        MediaItemTitles = mediaItemTitles,
                        Topics = topics,
                        Genres = genres
                    };

                    documents.Add(document);
                }

                // Import documents in batch (more efficient than individual upserts)
                var importResults = await _typesenseClient.ImportDocuments<MixlistDocument>(
                    _mixlistCollectionName, 
                    documents, 
                    40, // Batch size
                    ImportType.Upsert
                );

                var successCount = importResults.Count(r => r.Success);
                var failureCount = importResults.Count(r => !r.Success);

                _logger.LogInformation(
                    "Bulk re-index of mixlists complete. Success: {SuccessCount}, Failures: {FailureCount}", 
                    successCount, 
                    failureCount
                );

                if (failureCount > 0)
                {
                    _logger.LogWarning("Some mixlist documents failed to index. Check Typesense logs for details.");
                }

                return successCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk re-index of mixlists.");
                throw;
            }
        }

        /// <summary>
        /// Deletes and recreates the media_items collection to completely clear all data.
        /// </summary>
        public async Task ResetMediaItemsCollectionAsync()
        {
            try
            {
                _logger.LogInformation("Resetting Typesense collection '{CollectionName}'...", _mediaCollectionName);

                // Delete the collection if it exists
                try
                {
                    await _typesenseClient.DeleteCollection(_mediaCollectionName);
                    _logger.LogInformation("Deleted existing collection '{CollectionName}'.", _mediaCollectionName);
                }
                catch (TypesenseApiNotFoundException)
                {
                    _logger.LogInformation("Collection '{CollectionName}' doesn't exist, skipping delete.", _mediaCollectionName);
                }

                // Recreate the collection with the schema
                await EnsureCollectionExistsAsync();
                
                _logger.LogInformation("Successfully reset collection '{CollectionName}'.", _mediaCollectionName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting Typesense collection '{CollectionName}'.", _mediaCollectionName);
                throw;
            }
        }

        /// <summary>
        /// Deletes and recreates the mixlists collection to completely clear all data.
        /// </summary>
        public async Task ResetMixlistsCollectionAsync()
        {
            try
            {
                _logger.LogInformation("Resetting Typesense collection '{CollectionName}'...", _mixlistCollectionName);

                // Delete the collection if it exists
                try
                {
                    await _typesenseClient.DeleteCollection(_mixlistCollectionName);
                    _logger.LogInformation("Deleted existing collection '{CollectionName}'.", _mixlistCollectionName);
                }
                catch (TypesenseApiNotFoundException)
                {
                    _logger.LogInformation("Collection '{CollectionName}' doesn't exist, skipping delete.", _mixlistCollectionName);
                }

                // Recreate the collection with the schema
                await EnsureMixlistCollectionExistsAsync();
                
                _logger.LogInformation("Successfully reset collection '{CollectionName}'.", _mixlistCollectionName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resetting Typesense collection '{CollectionName}'.", _mixlistCollectionName);
                throw;
            }
        }
    }
}
