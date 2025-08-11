using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using Amazon.S3;
using Amazon.S3.Model;

namespace ProjectLoopbreaker.Web.API.Controllers
{
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
        public async Task<IActionResult> UploadCsv(IFormFile file)
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

                var results = new List<object>();
                var errors = new List<string>();
                int successCount = 0;
                int errorCount = 0;

                using var reader = new StreamReader(file.OpenReadStream());
                using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);

                // Read the header to determine the media type based on columns
                csv.Read();
                csv.ReadHeader();
                var headers = csv.HeaderRecord;

                if (headers == null)
                {
                    return BadRequest("CSV file must have headers");
                }

                // Determine media type based on headers
                var mediaType = DetermineMediaType(headers);
                
                if (mediaType == null)
                {
                    return BadRequest("Could not determine media type from CSV headers. Supported types: Book, Podcast");
                }

                _logger.LogInformation("Processing CSV upload for media type: {MediaType}", mediaType);

                // Process rows based on media type
                while (csv.Read())
                {
                    try
                    {
                        BaseMediaItem? mediaItem = null;

                        switch (mediaType)
                        {
                            case MediaType.Book:
                                mediaItem = await ProcessBookRow(csv);
                                break;
                            case MediaType.Podcast:
                                mediaItem = await ProcessPodcastRow(csv);
                                break;
                            default:
                                errors.Add($"Row {csv.CurrentIndex}: Unsupported media type {mediaType}");
                                errorCount++;
                                continue;
                        }

                        if (mediaItem != null)
                        {
                            _context.MediaItems.Add(mediaItem);
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
                    Errors = errors
                };

                _logger.LogInformation("CSV upload completed: {SuccessCount} successful, {ErrorCount} errors", successCount, errorCount);
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing CSV upload");
                return StatusCode(500, new { error = "Failed to process CSV upload", details = ex.Message });
            }
        }

        private static MediaType? DetermineMediaType(string[] headers)
        {
            var headerSet = headers.Select(h => h.ToLower()).ToHashSet();

            // Check for Book-specific headers
            if (headerSet.Contains("author") || headerSet.Contains("isbn") || headerSet.Contains("asin"))
            {
                return MediaType.Book;
            }

            // Check for Podcast-specific headers
            if (headerSet.Contains("publisher") || headerSet.Contains("podcasttype") || headerSet.Contains("audioduration"))
            {
                return MediaType.Podcast;
            }

            return null;
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
            book.Genre = GetCsvValue(csv, "Genre");
            book.ISBN = GetCsvValue(csv, "ISBN");
            book.ASIN = GetCsvValue(csv, "ASIN");
            
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

            // Parse dates
            var dateCompletedStr = GetCsvValue(csv, "DateCompleted");
            if (!string.IsNullOrEmpty(dateCompletedStr) && DateTime.TryParse(dateCompletedStr, out DateTime dateCompleted))
                book.DateCompleted = dateCompleted;

            // Handle topics and genres
            await ProcessTopicsAndGenres(book, csv);

            return book;
        }

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
            podcast.Genre = GetCsvValue(csv, "Genre");
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

            // Handle topics and genres
            await ProcessTopicsAndGenres(podcast, csv);

            return podcast;
        }

        private async Task ProcessTopicsAndGenres(BaseMediaItem mediaItem, CsvReader csv)
        {
            // Handle topics (comma-separated)
            var topicsStr = GetCsvValue(csv, "Topics");
            if (!string.IsNullOrEmpty(topicsStr))
            {
                var topicNames = topicsStr.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                          .Select(t => t.Trim())
                                          .Where(t => !string.IsNullOrEmpty(t));

                foreach (var topicName in topicNames)
                {
                    var existingTopic = await _context.Topics.FirstOrDefaultAsync(t => t.Name == topicName);
                    if (existingTopic != null)
                    {
                        mediaItem.Topics.Add(existingTopic);
                    }
                    else
                    {
                        mediaItem.Topics.Add(new Topic { Name = topicName });
                    }
                }
            }

            // Handle genres (comma-separated)
            var genresStr = GetCsvValue(csv, "Genres");
            if (!string.IsNullOrEmpty(genresStr))
            {
                var genreNames = genresStr.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                          .Select(g => g.Trim())
                                          .Where(g => !string.IsNullOrEmpty(g));

                foreach (var genreName in genreNames)
                {
                    var existingGenre = await _context.Genres.FirstOrDefaultAsync(g => g.Name == genreName);
                    if (existingGenre != null)
                    {
                        mediaItem.Genres.Add(existingGenre);
                    }
                    else
                    {
                        mediaItem.Genres.Add(new Genre { Name = genreName });
                    }
                }
            }
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
}


