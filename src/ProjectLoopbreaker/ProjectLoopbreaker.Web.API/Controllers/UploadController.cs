using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Amazon.S3;
using Amazon.S3.Model;
using System.Linq;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;
        private readonly ILogger<UploadController> _logger;
        private readonly IAmazonS3? _s3Client;
        private readonly IConfiguration _configuration;

        public UploadController(
            MediaLibraryDbContext context,
            ILogger<UploadController> logger,
            IAmazonS3? s3Client,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _s3Client = s3Client;
            _configuration = configuration;
        }

        // POST: api/upload/thumbnail-from-url
        [HttpPost("thumbnail-from-url")]
        public async Task<IActionResult> UploadThumbnailFromUrl([FromBody] UploadFromUrlRequest request)
        {
            try
            {
                // Check if S3 client is configured
                if (_s3Client == null)
                {
                    return StatusCode(500, "DigitalOcean Spaces is not configured. Please configure DigitalOceanSpaces environment variables.");
                }

                if (string.IsNullOrEmpty(request.Url))
                {
                    return BadRequest("URL is required.");
                }

                // Download the image from the URL
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Add("User-Agent", "ProjectLoopbreaker/1.0");
                
                var response = await httpClient.GetAsync(request.Url);
                if (!response.IsSuccessStatusCode)
                {
                    return BadRequest($"Failed to download image from URL: {response.StatusCode}");
                }

                var contentType = response.Content.Headers.ContentType?.MediaType ?? "image/jpeg";
                
                // Validate content type
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(contentType.ToLower()))
                {
                    return BadRequest("URL must point to an image (JPEG, PNG, GIF, or WebP).");
                }

                // Get file extension from content type
                var extension = contentType.ToLower() switch
                {
                    "image/jpeg" => ".jpg",
                    "image/jpg" => ".jpg", 
                    "image/png" => ".png",
                    "image/gif" => ".gif",
                    "image/webp" => ".webp",
                    _ => ".jpg"
                };

                // Get DigitalOcean Spaces configuration
                var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
                var bucketName = spacesConfig["BucketName"];
                var endpoint = spacesConfig["Endpoint"];

                if (string.IsNullOrEmpty(bucketName) || string.IsNullOrEmpty(endpoint))
                {
                    return StatusCode(500, "DigitalOcean Spaces configuration is incomplete.");
                }

                // Generate a unique file name
                var uniqueFileName = $"thumbnails/{Guid.NewGuid()}{extension}";

                // Upload to DigitalOcean Spaces
                using var imageStream = await response.Content.ReadAsStreamAsync();
                
                var uploadRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = uniqueFileName,
                    InputStream = imageStream,
                    ContentType = contentType,
                    CannedACL = S3CannedACL.PublicRead // Make the file publicly accessible
                };

                await _s3Client.PutObjectAsync(uploadRequest);

                // Construct the public URL
                var publicUrl = $"https://{bucketName}.{endpoint}/{uniqueFileName}";

                _logger.LogInformation("Successfully uploaded thumbnail from URL to DigitalOcean Spaces: {Url} -> {PublicUrl}", request.Url, publicUrl);

                return Ok(new { url = publicUrl, fileName = uniqueFileName, originalUrl = request.Url });
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error downloading image from URL: {Url}", request.Url);
                return StatusCode(500, $"Error downloading image from URL: {ex.Message}");
            }
            catch (AmazonS3Exception ex)
            {
                _logger.LogError(ex, "Error uploading thumbnail to DigitalOcean Spaces");
                return StatusCode(500, $"Error uploading to DigitalOcean Spaces: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during thumbnail upload from URL");
                return StatusCode(500, new { error = "Failed to upload thumbnail from URL", details = ex.Message });
            }
        }

        // DELETE: api/upload/thumbnail
        [HttpDelete("thumbnail")]
        public async Task<IActionResult> DeleteThumbnail([FromQuery] string url)
        {
            try
            {
                // Check if S3 client is configured
                if (_s3Client == null)
                {
                    _logger.LogWarning("S3 client not configured, skipping thumbnail deletion");
                    return Ok(new { message = "S3 client not configured, thumbnail not deleted" });
                }

                if (string.IsNullOrEmpty(url))
                {
                    return BadRequest("Thumbnail URL is required.");
                }

                // Get DigitalOcean Spaces configuration
                var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
                var bucketName = spacesConfig["BucketName"];
                var endpoint = spacesConfig["Endpoint"];

                if (string.IsNullOrEmpty(bucketName) || string.IsNullOrEmpty(endpoint))
                {
                    _logger.LogWarning("S3 configuration incomplete, skipping thumbnail deletion");
                    return Ok(new { message = "S3 configuration incomplete, thumbnail not deleted" });
                }

                // Extract the key from the URL
                // URL format: https://{bucketName}.{endpoint}/{key}
                var expectedPrefix = $"https://{bucketName}.{endpoint}/";
                if (!url.StartsWith(expectedPrefix))
                {
                    _logger.LogWarning("Thumbnail URL doesn't match expected format: {Url}", url);
                    return Ok(new { message = "Thumbnail URL doesn't match expected format, skipping deletion" });
                }

                var key = url.Substring(expectedPrefix.Length);

                // Delete the object from S3
                var deleteRequest = new DeleteObjectRequest
                {
                    BucketName = bucketName,
                    Key = key
                };

                await _s3Client.DeleteObjectAsync(deleteRequest);

                _logger.LogInformation("Successfully deleted thumbnail from DigitalOcean Spaces: {Url}", url);

                return Ok(new { message = "Thumbnail deleted successfully", url = url });
            }
            catch (AmazonS3Exception ex)
            {
                _logger.LogError(ex, "Error deleting thumbnail from DigitalOcean Spaces: {Url}", url);
                // Don't fail the entire operation if thumbnail deletion fails
                return Ok(new { message = "Failed to delete thumbnail but operation continued", error = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during thumbnail deletion: {Url}", url);
                // Don't fail the entire operation if thumbnail deletion fails
                return Ok(new { message = "Failed to delete thumbnail but operation continued", error = ex.Message });
            }
        }

        // POST: api/upload/thumbnail
        [HttpPost("thumbnail")]
        public async Task<IActionResult> UploadThumbnail(IFormFile file)
        {
            try
            {
                // Check if S3 client is configured
                if (_s3Client == null)
                {
                    return StatusCode(500, "DigitalOcean Spaces is not configured. Please configure DigitalOceanSpaces environment variables.");
                }

                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded.");
                }

                // Validate file type (allow common image formats)
                var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                {
                    return BadRequest("File must be an image (JPEG, PNG, GIF, or WebP).");
                }

                // Validate file size (max 5MB)
                const int maxFileSize = 5 * 1024 * 1024; // 5MB
                if (file.Length > maxFileSize)
                {
                    return BadRequest("File size must be less than 5MB.");
                }

                // Get DigitalOcean Spaces configuration
                var spacesConfig = _configuration.GetSection("DigitalOceanSpaces");
                var bucketName = spacesConfig["BucketName"];
                var endpoint = spacesConfig["Endpoint"];

                if (string.IsNullOrEmpty(bucketName) || string.IsNullOrEmpty(endpoint))
                {
                    return StatusCode(500, "DigitalOcean Spaces configuration is incomplete.");
                }

                // Generate a unique file name
                var fileExtension = Path.GetExtension(file.FileName);
                var uniqueFileName = $"thumbnails/{Guid.NewGuid()}{fileExtension}";

                // Upload to DigitalOcean Spaces
                using var memoryStream = new MemoryStream();
                await file.CopyToAsync(memoryStream);
                memoryStream.Position = 0;

                var uploadRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = uniqueFileName,
                    InputStream = memoryStream,
                    ContentType = file.ContentType,
                    CannedACL = S3CannedACL.PublicRead // Make the file publicly accessible
                };

                await _s3Client.PutObjectAsync(uploadRequest);

                // Construct the public URL
                var publicUrl = $"https://{bucketName}.{endpoint}/{uniqueFileName}";

                _logger.LogInformation("Successfully uploaded thumbnail to DigitalOcean Spaces: {Url}", publicUrl);

                return Ok(new { url = publicUrl, fileName = uniqueFileName });
            }
            catch (AmazonS3Exception ex)
            {
                _logger.LogError(ex, "Error uploading thumbnail to DigitalOcean Spaces");
                return StatusCode(500, $"Error uploading to DigitalOcean Spaces: {ex.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during thumbnail upload");
                return StatusCode(500, new { error = "Failed to upload thumbnail", details = ex.Message });
            }
        }

        // POST: api/upload/csv
        [HttpPost("csv")]
        public async Task<IActionResult> UploadCsv(IFormFile file, [FromForm] string mediaType)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest("No file uploaded");
                }

                if (!file.FileName.EndsWith(".csv", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest("File must be a CSV");
                }

                if (string.IsNullOrEmpty(mediaType))
                {
                    return BadRequest("Media type must be specified");
                }

                var results = new List<object>();
                var errors = new List<string>();
                var importedItems = new List<object>();
                int successCount = 0;
                int errorCount = 0;

                using var reader = new StreamReader(file.OpenReadStream());
                using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

                // Read the header
                csv.Read();
                csv.ReadHeader();
                var headers = csv.HeaderRecord;

                if (headers == null)
                {
                    return BadRequest("CSV file must have headers");
                }

                // Parse the media type from the request
                if (!Enum.TryParse<MediaType>(mediaType, true, out var parsedMediaType))
                {
                    return BadRequest($"Invalid media type: {mediaType}. Supported types: Book, Podcast, Movie, TVShow, Article");
                }

                _logger.LogInformation("Processing CSV upload for media type: {MediaType}", parsedMediaType);

                // Process rows based on media type
                while (csv.Read())
                {
                    try
                    {
                        BaseMediaItem? mediaItem = null;

                        switch (parsedMediaType)
                        {
                            case MediaType.Book:
                                mediaItem = await ProcessBookRow(csv);
                                break;
                            case MediaType.Podcast:
                                // TODO: Update to handle PodcastSeries and PodcastEpisode separately
                                // mediaItem = await ProcessPodcastRow(csv);
                                _logger.LogWarning("Podcast CSV import not yet updated for new structure. Skipping row.");
                                continue;
                            case MediaType.Movie:
                                mediaItem = await ProcessMovieRow(csv);
                                break;
                            case MediaType.TVShow:
                                mediaItem = await ProcessTvShowRow(csv);
                                break;
                            case MediaType.Article:
                                mediaItem = await ProcessArticleRow(csv);
                                break;
                            default:
                                errors.Add($"Row {csv.CurrentIndex}: Unsupported media type {parsedMediaType}");
                                errorCount++;
                                continue;
                        }

                        if (mediaItem != null)
                        {
                            // Add to the appropriate DbSet based on the media type
                            if (mediaItem is Book book)
                            {
                                _context.Books.Add(book);
                                // Track the imported book for the response
                                importedItems.Add(new
                                {
                                    Id = book.Id,
                                    Title = book.Title,
                                    Author = book.Author,
                                    Thumbnail = book.Thumbnail,
                                    MediaType = "Book"
                                });
                            }
                            else if (mediaItem is PodcastSeries podcastSeries)
                            {
                                _context.PodcastSeries.Add(podcastSeries);
                                // Track the imported podcast series for the response
                                importedItems.Add(new
                                {
                                    Id = podcastSeries.Id,
                                    Title = podcastSeries.Title,
                                    Thumbnail = podcastSeries.Thumbnail,
                                    MediaType = "PodcastSeries"
                                });
                            }
                            else if (mediaItem is PodcastEpisode podcastEpisode)
                            {
                                _context.PodcastEpisodes.Add(podcastEpisode);
                                // Track the imported podcast episode for the response
                                importedItems.Add(new
                                {
                                    Id = podcastEpisode.Id,
                                    Title = podcastEpisode.Title,
                                    Thumbnail = podcastEpisode.Thumbnail,
                                    MediaType = "PodcastEpisode"
                                });
                            }
                            else if (mediaItem is Movie movie)
                            {
                                _context.Movies.Add(movie);
                                // Track the imported movie for the response
                                importedItems.Add(new
                                {
                                    Id = movie.Id,
                                    Title = movie.Title,
                                    Director = movie.Director,
                                    ReleaseYear = movie.ReleaseYear,
                                    Thumbnail = movie.Thumbnail,
                                    MediaType = "Movie"
                                });
                            }
                            else if (mediaItem is TvShow tvShow)
                            {
                                _context.TvShows.Add(tvShow);
                                // Track the imported TV show for the response
                                importedItems.Add(new
                                {
                                    Id = tvShow.Id,
                                    Title = tvShow.Title,
                                    Creator = tvShow.Creator,
                                    FirstAirYear = tvShow.FirstAirYear,
                                    Thumbnail = tvShow.Thumbnail,
                                    MediaType = "TVShow"
                                });
                            }
                            else if (mediaItem is Article article)
                            {
                                _context.Articles.Add(article);
                                // Track the imported article for the response
                                importedItems.Add(new
                                {
                                    Id = article.Id,
                                    Title = article.Title,
                                    Author = article.Author,
                                    Link = article.Link,
                                    IsArchived = article.IsArchived,
                                    IsStarred = article.IsStarred,
                                    MediaType = "Article"
                                });
                            }
                            else
                            {
                                _context.MediaItems.Add(mediaItem);
                                importedItems.Add(new
                                {
                                    Id = mediaItem.Id,
                                    Title = mediaItem.Title,
                                    Thumbnail = mediaItem.Thumbnail,
                                    MediaType = mediaItem.MediaType.ToString()
                                });
                            }
                            successCount++;
                        }
                    }
                    catch (Exception ex)
                    {
                        errors.Add($"Row {csv.CurrentIndex}: {ex.Message}");
                        errorCount++;
                        _logger.LogWarning(ex, "Error processing row {RowIndex}", csv.CurrentIndex);
                    }
                }

                // Save all changes
                await _context.SaveChangesAsync();

                var result = new
                {
                    Success = true,
                    Message = $"Processed {successCount + errorCount} rows. {successCount} successful, {errorCount} errors.",
                    SuccessCount = successCount,
                    ErrorCount = errorCount,
                    Errors = errors,
                    ImportedItems = importedItems
                };

                _logger.LogInformation("CSV upload completed: {SuccessCount} successful, {ErrorCount} errors", successCount, errorCount);
                _logger.LogInformation("Response result: {@Result}", result);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing CSV upload");
                return StatusCode(500, new { error = "Failed to process CSV upload", details = ex.Message });
            }
        }



        private async Task<Book?> ProcessBookRow(CsvReader csv)
        {
            var book = new Book
            {
                Title = GetCsvValue(csv, "Title") ?? "Unknown Title",
                MediaType = MediaType.Book,
                Author = GetCsvValue(csv, "Author") ?? "Unknown Author",
                DateAdded = DateTime.UtcNow,
                Status = ParseStatus(GetCsvValue(csv, "Status")) ?? Status.Uncharted
            };

            // Optional fields
            book.Description = GetCsvValue(csv, "Description");
            book.Link = GetCsvValue(csv, "Link");
            book.Notes = GetCsvValue(csv, "Notes");
            book.RelatedNotes = GetCsvValue(csv, "RelatedNotes");
            book.Thumbnail = GetCsvValue(csv, "Thumbnail");
            // Note: Genre is now handled through the navigation property via ProcessTopicsAndGenres
            book.ISBN = GetCsvValue(csv, "ISBN");
            book.ASIN = GetCsvValue(csv, "ASIN");

            // Debug logging for thumbnail
            _logger.LogInformation("Book '{Title}' thumbnail: {Thumbnail}", book.Title, book.Thumbnail ?? "null");
            
            // Parse boolean and enum fields
            if (bool.TryParse(GetCsvValue(csv, "PartOfSeries"), out bool partOfSeries))
                book.PartOfSeries = partOfSeries;

            var formatStr = GetCsvValue(csv, "Format");
            if (!string.IsNullOrEmpty(formatStr) && Enum.TryParse<BookFormat>(formatStr, true, out BookFormat format))
                book.Format = format;

            var ratingStr = GetCsvValue(csv, "Rating");
            if (!string.IsNullOrEmpty(ratingStr) && Enum.TryParse<Rating>(ratingStr, true, out Rating rating))
                book.Rating = rating;

            var ownershipStr = GetCsvValue(csv, "OwnershipStatus");
            if (!string.IsNullOrEmpty(ownershipStr) && Enum.TryParse<OwnershipStatus>(ownershipStr, true, out OwnershipStatus ownership))
                book.OwnershipStatus = ownership;

            // Parse Goodreads rating (1-5 scale)
            var goodreadsRatingStr = GetCsvValue(csv, "GoodreadsRating");
            if (!string.IsNullOrEmpty(goodreadsRatingStr) && decimal.TryParse(goodreadsRatingStr, out decimal goodreadsRating))
            {
                if (goodreadsRating >= 1 && goodreadsRating <= 5)
                {
                    book.GoodreadsRating = goodreadsRating;
                    
                    // If Rating (PLB rating) is not set, auto-convert from Goodreads rating
                    if (!book.Rating.HasValue)
                    {
                        book.Rating = goodreadsRating switch
                        {
                            5 => Rating.SuperLike,
                            4 => Rating.Like,
                            3 => Rating.Neutral,
                            >= 1 and < 3 => Rating.Dislike,
                            _ => null
                        };
                    }
                }
            }

            // Parse dates
            var dateCompletedStr = GetCsvValue(csv, "DateCompleted");
            if (!string.IsNullOrEmpty(dateCompletedStr) && DateTime.TryParse(dateCompletedStr, out DateTime dateCompleted))
                book.DateCompleted = dateCompleted;

            // Note: Topics and Genres can be assigned later through the UI
            // For now, we'll just create the basic book entity

            return book;
        }

        // TODO: Update for new PodcastSeries/PodcastEpisode structure
        /*
        private async Task<Podcast?> ProcessPodcastRow(CsvReader csv)
        {
            var podcast = new Podcast
            {
                Title = GetCsvValue(csv, "Title") ?? "Unknown Title",
                MediaType = MediaType.Podcast,
                DateAdded = DateTime.UtcNow,
                Status = ParseStatus(GetCsvValue(csv, "Status")) ?? Status.Uncharted,
                PodcastType = PodcastType.Series // Default to Series
            };

            // Optional fields
            podcast.Description = GetCsvValue(csv, "Description");
            podcast.Link = GetCsvValue(csv, "Link");
            podcast.Notes = GetCsvValue(csv, "Notes");
            podcast.RelatedNotes = GetCsvValue(csv, "RelatedNotes");
            podcast.Thumbnail = GetCsvValue(csv, "Thumbnail");
            // Note: Genre is now handled through the navigation property via ProcessTopicsAndGenres
            podcast.AudioLink = GetCsvValue(csv, "AudioLink");
            podcast.Publisher = GetCsvValue(csv, "Publisher");
            podcast.ExternalId = GetCsvValue(csv, "ExternalId");

            // Parse podcast type
            var podcastTypeStr = GetCsvValue(csv, "PodcastType");
            if (!string.IsNullOrEmpty(podcastTypeStr) && Enum.TryParse<PodcastType>(podcastTypeStr, true, out PodcastType podcastType))
                podcast.PodcastType = podcastType;

            // Parse duration
            var durationStr = GetCsvValue(csv, "DurationInSeconds");
            if (!string.IsNullOrEmpty(durationStr) && int.TryParse(durationStr, out int duration))
                podcast.DurationInSeconds = duration;

            // Parse dates
            var releaseDateStr = GetCsvValue(csv, "ReleaseDate");
            if (!string.IsNullOrEmpty(releaseDateStr) && DateTime.TryParse(releaseDateStr, out DateTime releaseDate))
                podcast.ReleaseDate = releaseDate;

            var dateCompletedStr = GetCsvValue(csv, "DateCompleted");
            if (!string.IsNullOrEmpty(dateCompletedStr) && DateTime.TryParse(dateCompletedStr, out DateTime dateCompleted))
                podcast.DateCompleted = dateCompleted;

            // Parse enums
            var ratingStr = GetCsvValue(csv, "Rating");
            if (!string.IsNullOrEmpty(ratingStr) && Enum.TryParse<Rating>(ratingStr, true, out Rating rating))
                podcast.Rating = rating;

            var ownershipStr = GetCsvValue(csv, "OwnershipStatus");
            if (!string.IsNullOrEmpty(ownershipStr) && Enum.TryParse<OwnershipStatus>(ownershipStr, true, out OwnershipStatus ownership))
                podcast.OwnershipStatus = ownership;

            // Note: Topics and Genres can be assigned later through the UI
            // For now, we'll just create the basic podcast entity

            return podcast;
        }
        */

        private async Task<Movie?> ProcessMovieRow(CsvReader csv)
        {
            var movie = new Movie
            {
                Title = GetCsvValue(csv, "Title") ?? "Unknown Title",
                MediaType = MediaType.Movie,
                DateAdded = DateTime.UtcNow,
                Status = ParseStatus(GetCsvValue(csv, "Status")) ?? Status.Uncharted
            };

            // Optional fields
            movie.Description = GetCsvValue(csv, "Description");
            movie.Link = GetCsvValue(csv, "Link");
            movie.Notes = GetCsvValue(csv, "Notes");
            movie.RelatedNotes = GetCsvValue(csv, "RelatedNotes");
            movie.Thumbnail = GetCsvValue(csv, "Thumbnail");
            movie.Director = GetCsvValue(csv, "Director");
            movie.Cast = GetCsvValue(csv, "Cast");
            movie.Tagline = GetCsvValue(csv, "Tagline");
            movie.Homepage = GetCsvValue(csv, "Homepage");
            movie.OriginalLanguage = GetCsvValue(csv, "OriginalLanguage");
            movie.OriginalTitle = GetCsvValue(csv, "OriginalTitle");
            movie.ImdbId = GetCsvValue(csv, "ImdbId");
            movie.TmdbId = GetCsvValue(csv, "TmdbId");
            movie.MpaaRating = GetCsvValue(csv, "MpaaRating");

            // Parse numeric fields
            var releaseYearStr = GetCsvValue(csv, "ReleaseYear");
            if (!string.IsNullOrEmpty(releaseYearStr) && int.TryParse(releaseYearStr, out int releaseYear))
                movie.ReleaseYear = releaseYear;

            var runtimeStr = GetCsvValue(csv, "RuntimeMinutes");
            if (!string.IsNullOrEmpty(runtimeStr) && int.TryParse(runtimeStr, out int runtime))
                movie.RuntimeMinutes = runtime;

            var tmdbRatingStr = GetCsvValue(csv, "TmdbRating");
            if (!string.IsNullOrEmpty(tmdbRatingStr) && double.TryParse(tmdbRatingStr, out double tmdbRating))
                movie.TmdbRating = tmdbRating;

            // Parse enums
            var ratingStr = GetCsvValue(csv, "Rating");
            if (!string.IsNullOrEmpty(ratingStr) && Enum.TryParse<Rating>(ratingStr, true, out Rating rating))
                movie.Rating = rating;

            var ownershipStr = GetCsvValue(csv, "OwnershipStatus");
            if (!string.IsNullOrEmpty(ownershipStr) && Enum.TryParse<OwnershipStatus>(ownershipStr, true, out OwnershipStatus ownership))
                movie.OwnershipStatus = ownership;

            // Parse dates
            var dateCompletedStr = GetCsvValue(csv, "DateCompleted");
            if (!string.IsNullOrEmpty(dateCompletedStr) && DateTime.TryParse(dateCompletedStr, out DateTime dateCompleted))
                movie.DateCompleted = dateCompleted;

            return movie;
        }

        private async Task<TvShow?> ProcessTvShowRow(CsvReader csv)
        {
            var tvShow = new TvShow
            {
                Title = GetCsvValue(csv, "Title") ?? "Unknown Title",
                MediaType = MediaType.TVShow,
                DateAdded = DateTime.UtcNow,
                Status = ParseStatus(GetCsvValue(csv, "Status")) ?? Status.Uncharted
            };

            // Optional fields
            tvShow.Description = GetCsvValue(csv, "Description");
            tvShow.Link = GetCsvValue(csv, "Link");
            tvShow.Notes = GetCsvValue(csv, "Notes");
            tvShow.RelatedNotes = GetCsvValue(csv, "RelatedNotes");
            tvShow.Thumbnail = GetCsvValue(csv, "Thumbnail");
            tvShow.Creator = GetCsvValue(csv, "Creator");
            tvShow.Cast = GetCsvValue(csv, "Cast");
            tvShow.Tagline = GetCsvValue(csv, "Tagline");
            tvShow.Homepage = GetCsvValue(csv, "Homepage");
            tvShow.OriginalLanguage = GetCsvValue(csv, "OriginalLanguage");
            tvShow.OriginalName = GetCsvValue(csv, "OriginalName");
            tvShow.TmdbId = GetCsvValue(csv, "TmdbId");
            tvShow.ContentRating = GetCsvValue(csv, "ContentRating");

            // Parse numeric fields
            var firstAirYearStr = GetCsvValue(csv, "FirstAirYear");
            if (!string.IsNullOrEmpty(firstAirYearStr) && int.TryParse(firstAirYearStr, out int firstAirYear))
                tvShow.FirstAirYear = firstAirYear;

            var lastAirYearStr = GetCsvValue(csv, "LastAirYear");
            if (!string.IsNullOrEmpty(lastAirYearStr) && int.TryParse(lastAirYearStr, out int lastAirYear))
                tvShow.LastAirYear = lastAirYear;

            var numberOfSeasonsStr = GetCsvValue(csv, "NumberOfSeasons");
            if (!string.IsNullOrEmpty(numberOfSeasonsStr) && int.TryParse(numberOfSeasonsStr, out int numberOfSeasons))
                tvShow.NumberOfSeasons = numberOfSeasons;

            var numberOfEpisodesStr = GetCsvValue(csv, "NumberOfEpisodes");
            if (!string.IsNullOrEmpty(numberOfEpisodesStr) && int.TryParse(numberOfEpisodesStr, out int numberOfEpisodes))
                tvShow.NumberOfEpisodes = numberOfEpisodes;

            var tmdbRatingStr = GetCsvValue(csv, "TmdbRating");
            if (!string.IsNullOrEmpty(tmdbRatingStr) && double.TryParse(tmdbRatingStr, out double tmdbRating))
                tvShow.TmdbRating = tmdbRating;

            // Parse enums
            var ratingStr = GetCsvValue(csv, "Rating");
            if (!string.IsNullOrEmpty(ratingStr) && Enum.TryParse<Rating>(ratingStr, true, out Rating rating))
                tvShow.Rating = rating;

            var ownershipStr = GetCsvValue(csv, "OwnershipStatus");
            if (!string.IsNullOrEmpty(ownershipStr) && Enum.TryParse<OwnershipStatus>(ownershipStr, true, out OwnershipStatus ownership))
                tvShow.OwnershipStatus = ownership;

            // Parse dates
            var dateCompletedStr = GetCsvValue(csv, "DateCompleted");
            if (!string.IsNullOrEmpty(dateCompletedStr) && DateTime.TryParse(dateCompletedStr, out DateTime dateCompleted))
                tvShow.DateCompleted = dateCompleted;

            return tvShow;
        }

        private async Task<Article?> ProcessArticleRow(CsvReader csv)
        {
            var article = new Article
            {
                Title = GetCsvValue(csv, "Title") ?? "Unknown Title",
                MediaType = MediaType.Article,
                DateAdded = DateTime.UtcNow,
                Status = ParseStatus(GetCsvValue(csv, "Status")) ?? Status.Uncharted
            };

            // Optional fields
            article.Description = GetCsvValue(csv, "Description");
            article.Link = GetCsvValue(csv, "Url") ?? GetCsvValue(csv, "Link"); // Support both column names
            article.Notes = GetCsvValue(csv, "Notes");
            article.RelatedNotes = GetCsvValue(csv, "RelatedNotes");
            article.Thumbnail = GetCsvValue(csv, "Thumbnail");
            article.Author = GetCsvValue(csv, "Author");
            article.Publication = GetCsvValue(csv, "Publication");
            article.InstapaperBookmarkId = GetCsvValue(csv, "InstapaperBookmarkId") ?? GetCsvValue(csv, "BookmarkId");
            article.InstapaperHash = GetCsvValue(csv, "InstapaperHash") ?? GetCsvValue(csv, "Hash");

            // Parse boolean fields
            var isArchivedStr = GetCsvValue(csv, "IsArchived") ?? GetCsvValue(csv, "Archived");
            if (!string.IsNullOrEmpty(isArchivedStr))
            {
                article.IsArchived = isArchivedStr.Equals("true", StringComparison.OrdinalIgnoreCase) ||
                                    isArchivedStr.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                                    isArchivedStr.Equals("yes", StringComparison.OrdinalIgnoreCase);
            }

            var isStarredStr = GetCsvValue(csv, "IsStarred") ?? GetCsvValue(csv, "Starred");
            if (!string.IsNullOrEmpty(isStarredStr))
            {
                article.IsStarred = isStarredStr.Equals("true", StringComparison.OrdinalIgnoreCase) ||
                                   isStarredStr.Equals("1", StringComparison.OrdinalIgnoreCase) ||
                                   isStarredStr.Equals("yes", StringComparison.OrdinalIgnoreCase);
            }

            // Parse numeric fields
            var wordCountStr = GetCsvValue(csv, "WordCount");
            if (!string.IsNullOrEmpty(wordCountStr) && int.TryParse(wordCountStr, out int wordCount))
                article.WordCount = wordCount;

            var readingProgressStr = GetCsvValue(csv, "ReadingProgress");
            if (!string.IsNullOrEmpty(readingProgressStr) && int.TryParse(readingProgressStr, out int readingProgress))
                article.ReadingProgress = readingProgress;

            // Parse dates
            var publicationDateStr = GetCsvValue(csv, "PublicationDate");
            if (!string.IsNullOrEmpty(publicationDateStr) && DateTime.TryParse(publicationDateStr, out DateTime publicationDate))
                article.PublicationDate = publicationDate;

            var dateCompletedStr = GetCsvValue(csv, "DateCompleted");
            if (!string.IsNullOrEmpty(dateCompletedStr) && DateTime.TryParse(dateCompletedStr, out DateTime dateCompleted))
                article.DateCompleted = dateCompleted;

            // Parse enums
            var ratingStr = GetCsvValue(csv, "Rating");
            if (!string.IsNullOrEmpty(ratingStr) && Enum.TryParse<Rating>(ratingStr, true, out Rating rating))
                article.Rating = rating;

            var ownershipStr = GetCsvValue(csv, "OwnershipStatus");
            if (!string.IsNullOrEmpty(ownershipStr) && Enum.TryParse<OwnershipStatus>(ownershipStr, true, out OwnershipStatus ownership))
                article.OwnershipStatus = ownership;

            return article;
        }

        private static string? GetCsvValue(CsvReader csv, string fieldName)
        {
            try
            {
                return csv.GetField(fieldName)?.Trim();
            }
            catch
            {
                return null;
            }
        }

        private static Status? ParseStatus(string? statusStr)
        {
            if (string.IsNullOrEmpty(statusStr))
                return null;

            return Enum.TryParse<Status>(statusStr, true, out Status status) ? status : null;
        }
    }

    public class UploadFromUrlRequest
    {
        public string Url { get; set; } = string.Empty;
    }
}


