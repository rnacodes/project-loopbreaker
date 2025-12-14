# CSV Upload Fix - Mixed Media Types Support

## Issue Summary

The CSV upload was failing with a 500 error because:

1. **Single Media Type Limitation**: The original implementation only supported CSVs where ALL rows had the same MediaType (determined from the first data row)
2. **Missing Media Type Handlers**: Video and Website media types had no processing methods
3. **Your CSV**: `sample-mediaitems.csv` contained mixed media types (Book, Movie, TvShow, Article, Website, Video, PodcastSeries, PodcastEpisode), which caused the backend to try processing all rows as the first type encountered

## What Was Fixed

### Backend Changes (`UploadController.cs`)

1. **Per-Row Media Type Processing**: The controller now reads the `MediaType` column from each individual row instead of using a single type for the entire file
2. **Added Video Handler**: Created `ProcessVideoRow()` method to handle Video media type imports
3. **Added Website Handler**: Created `ProcessWebsiteRow()` method to handle Website media type imports
4. **Backward Compatibility**: Still supports the old behavior where you can specify a single media type for all rows via the `mediaType` parameter
5. **Better Error Handling**: Clear error messages for unsupported types (PodcastSeries/PodcastEpisode)

### Frontend Changes

1. **Updated `UploadMediaPage.jsx`**: Now sends the CSV without a fixed mediaType parameter, allowing the backend to read from each row
2. **Updated `apiService.js`**: Made mediaType parameter optional in `uploadCsv()` function
3. **Updated UI Instructions**: Clarified that mixed media type CSVs are now supported

## How to Use

### Option 1: Mixed Media Type CSV (Recommended)

Create a CSV with a `MediaType` column where each row can have a different type:

```csv
MediaType,Title,Link,Description,Notes,Status,Rating
Book,Neuromancer,http://example.com/neuro,A seminal cyberpunk novel,Classic read,Completed,SuperLike
Movie,The Matrix,https://imdb.com/matrix,Sci-fi action film,Mind-bending,Completed,SuperLike
Article,AI Ethics,https://example.com/ai-ethics,Article about AI,Must read,ActivelyExploring,Like
Website,GitHub,https://github.com,Code hosting platform,Dev tool,Uncharted,Like
Video,Tutorial,https://youtube.com/tutorial,How-to video,Helpful,Completed,Neutral
TVShow,Black Mirror,https://imdb.com/bm,Anthology series,Dark,ActivelyExploring,Like
```

### Option 2: Single Media Type CSV (Legacy)

You can still upload CSVs with all rows of the same type. The system will detect this automatically.

## Supported Media Types

✅ **Book** - Fully supported
✅ **Movie** - Fully supported  
✅ **TVShow** - Fully supported
✅ **Article** - Fully supported
✅ **Video** - Now supported!
✅ **Website** - Now supported!
❌ **PodcastSeries** - Use Import Media page instead
❌ **PodcastEpisode** - Use Import Media page instead

## Important CSV Format Notes

### Required Columns
- `MediaType` - REQUIRED for each row
- `Title` - REQUIRED for all media types

### Common Optional Columns
- `Description`
- `Link`
- `Notes`
- `RelatedNotes`
- `Thumbnail`
- `Status` (values: `Uncharted`, `ActivelyExploring`, `Completed`, `Abandoned`)
- `Rating` (values: `SuperLike`, `Like`, `Neutral`, `Dislike`)
- `OwnershipStatus` (values: `Own`, `Rented`, `Streamed`)
- `DateCompleted` (format: `2024-01-15` or `2024-01-15T10:00:00Z`)

### Media Type-Specific Columns

**Book:**
- `Author` (recommended)
- `ISBN`
- `ASIN`
- `Format` (values: `Digital`, `Physical`)
- `PartOfSeries` (boolean: `true`/`false`)
- `SeriesName`
- `PositionInSeries`
- `GoodreadsRating` (1-5 scale, auto-converts to PLB Rating if not set)

**Movie:**
- `Director`
- `ReleaseYear`
- `RuntimeMinutes`
- `TmdbId`
- `ImdbId`
- `Cast`
- `Tagline`
- `MpaaRating`

**TVShow:**
- `Creator`
- `FirstAirYear`
- `LastAirYear`
- `NumberOfSeasons`
- `NumberOfEpisodes`
- `TmdbId`
- `Cast`

**Video:**
- `Platform` (default: `YouTube`, values: `YouTube`, `Vimeo`, `Twitch`, etc.)
- `VideoId` or `ExternalId` (External platform ID)
- `LengthInSeconds` or `DurationInSeconds` (both work)
- `VideoType` (values: `Series`, `Episode`, `Channel` - default: `Episode`)

**Website:**
- `Domain`
- `RssFeedUrl`
- `Author`
- `Publication`
- `LastCheckedDate`

**Article:**
- `Author`
- `Publication`
- `Link` (required for articles)
- `IsArchived` (boolean)
- `IsStarred` (boolean)
- `ReadingProgress` (0-100)
- `WordCount`
- `PublicationDate`

## Testing Your CSV

Your `sample-mediaitems.csv` should now work! However, note:

1. **PodcastSeries and PodcastEpisode rows will be skipped** with a message directing you to use the Import Media page
2. **Invalid enum values** (like "5/5" for Rating) will be ignored, and those fields will remain unset
3. **Status values** should be corrected:
   - ❌ "In Progress" → ✅ "ActivelyExploring"
   - ❌ "Watching" → ✅ "ActivelyExploring"
   - ❌ "Reading" → ✅ "ActivelyExploring"
   - ❌ "Planning" → ✅ "Uncharted"

4. **Rating values** should be corrected:
   - ❌ "5/5" → ✅ "SuperLike"
   - ❌ "4/5" → ✅ "Like"
   - ❌ "3/5" → ✅ "Neutral"

5. **OwnershipStatus values** should be corrected:
   - ❌ "Watched" → ✅ "Streamed"
   - ❌ "Borrowed" → ✅ "Rented"
   - ❌ "N/A" → Just leave empty

## Next Steps

1. ✅ The backend changes are complete
2. ✅ The frontend changes are complete
3. 🔄 **Test the upload** with your corrected CSV
4. 📝 Consider creating properly formatted sample CSV templates

## Future: Podcast CSV Import

Podcast CSV import is not yet implemented due to the hierarchical Series → Episodes structure. See `PODCAST_CSV_IMPORT_PLAN.md` for the implementation plan when needed.

## Example Corrected CSV

Here's a corrected version of your sample data:

```csv
MediaType,Title,Link,Notes,DateAdded,Status,DateCompleted,Rating,OwnershipStatus,Description,RelatedNotes,Thumbnail
Book,Neuromancer,http://example.com/neuro,Classic Cyberpunk read.,2025-01-10T10:00:00Z,Completed,2025-03-15T18:30:00Z,SuperLike,Own,A seminal cyberpunk novel.,N/A,http://img.com/neuro.jpg
Book,Dune,http://example.com/dune,Great world-building.,2025-02-20T11:00:00Z,ActivelyExploring,,Like,Rented,Epic planetary science fiction.,"Sandworms, spice.",http://img.com/dune.jpg
Movie,Get Out,https://imdb.com/go,Highly acclaimed horror.,2025-03-01T12:00:00Z,Completed,2025-03-01T20:45:00Z,SuperLike,Streamed,Psychological horror film.,The Sunken Place.,http://img.com/go.jpg
TVShow,The Expanse,https://tmdb.com/te,Political scifi drama.,2025-04-05T13:00:00Z,ActivelyExploring,,Like,Streamed,Humans colonize the solar system.,Need to watch Season 4.,http://img.com/te.jpg
TVShow,The Haunting of Hill House,https://netflix.com/thohh,Excellent family horror.,2025-05-15T14:00:00Z,Completed,2025-05-25T21:00:00Z,SuperLike,Streamed,A family faces ghosts of the past.,Emotional finale.,http://img.com/thohh.jpg
Article,How to Write Epic Fantasy,https://site.com/hwef,Writing tips.,2025-06-01T15:00:00Z,ActivelyExploring,,Neutral,,Article on fantasy tropes.,Check out the author's blog.,
Book,The Two Towers,http://example.com/towers,Middle installment.,2025-07-10T16:00:00Z,Uncharted,,,Own,Second book of LotR.,Re-read planned.,http://img.com/towers.jpg
Website,Lovecraft: A Biography,https://lovecraft.com/bio,Author's background.,2025-08-05T17:00:00Z,ActivelyExploring,,Like,,Information about H.P. Lovecraft.,,
Video,Scifi Short Film,https://youtube.com/scifi,Indie short.,2025-09-01T18:00:00Z,Completed,2025-09-01T18:15:00Z,Like,,A 15-minute futuristic short.,Great VFX.,
Video,Horror Movie Review,https://youtube.com/hmr,Review of Hereditary.,2025-10-20T19:00:00Z,Completed,2025-10-20T19:20:00Z,SuperLike,,A critical look at the film.,Good analysis.,
```

Note: The PodcastSeries and PodcastEpisode rows from your original CSV have been removed since they're not yet supported via CSV upload.
