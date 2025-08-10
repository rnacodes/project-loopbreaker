using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.Infrastructure.Data;
using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;

namespace ProjectLoopbreaker.Web.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly MediaLibraryDbContext _context;
        private readonly ILogger<UploadController> _logger;

        public UploadController(
            MediaLibraryDbContext context,
            ILogger<UploadController> logger)
        {
            _context = context;
            _logger = logger;
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


