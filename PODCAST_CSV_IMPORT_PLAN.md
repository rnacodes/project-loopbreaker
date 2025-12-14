# Podcast CSV Import - Future Implementation Plan

## Context

Currently, podcasts must be imported via the Import Media page (ListenNotes API) because of their hierarchical structure (Series → Episodes). This plan outlines how to add CSV import support for podcast listening history exports.

## Use Case

- Export listening history from iPhone Podcast app
- Bulk import historical podcast data
- Future automated metadata enrichment via cron jobs/scripts

## Technical Approach

### 1. Two-Pass Processing Strategy

```csharp
// Phase 1: Process all PodcastSeries rows
// Phase 2: Process all PodcastEpisode rows and link to series
```

### 2. CSV Format

**Option A: Separate CSVs** (Simpler, recommended for initial implementation)
```csv
# podcast-series.csv
MediaType,Title,Publisher,Link,ExternalId,Description,Thumbnail
PodcastSeries,The Daily,The New York Times,https://...,ln-id-123,News podcast,...

# podcast-episodes.csv
MediaType,Title,SeriesExternalId,EpisodeNumber,DurationInSeconds,ReleaseDate
PodcastEpisode,Episode 1,ln-id-123,1,1800,2024-01-15
```

**Option B: Single CSV with Series Matching** (More complex)
```csv
MediaType,PodcastType,Title,ParentSeriesTitle,ParentSeriesExternalId,EpisodeNumber,...
Podcast,Series,The Daily,,ln-id-123,,
Podcast,Episode,Episode 1,The Daily,ln-id-123,1,
```

### 3. Implementation Steps

1. **Update `UploadController.cs`**
   - Add `ProcessPodcastSeriesRow()` method
   - Add `ProcessPodcastEpisodeRow()` method
   - Implement two-pass logic:
     ```csharp
     // Pass 1: Create series, build seriesMap
     Dictionary<string, Guid> seriesMap; // ExternalId/Title -> SeriesId
     
     // Pass 2: Create episodes, reference seriesMap for SeriesId
     ```

2. **Add Series Matching Logic**
   - Match by `ExternalId` (preferred, from ListenNotes)
   - Fallback to `Title` match (case-insensitive)
   - Log warnings for unmatched episodes

3. **Handle Edge Cases**
   - Episodes without matching series → Skip with error message
   - Duplicate series detection → Use existing series
   - Missing required fields → Clear validation errors

4. **Update Frontend**
   - Add podcast-specific CSV format instructions
   - Update sample CSV templates
   - Add warning about series-episode relationship requirements

## CSV Column Mappings

### PodcastSeries Columns
- `Title` (required)
- `Publisher`
- `ExternalId` (ListenNotes ID - recommended for matching)
- `Link` / `AudioLink`
- `Description`
- `Thumbnail`
- `Topics` (semicolon-separated)
- `Genres` (semicolon-separated)
- `IsSubscribed` (boolean)

### PodcastEpisode Columns
- `Title` (required)
- `SeriesExternalId` or `ParentSeriesTitle` (required - for matching)
- `EpisodeNumber`
- `DurationInSeconds`
- `ReleaseDate`
- `Description`
- `Link` / `AudioLink`
- `Thumbnail`
- `Topics` (semicolon-separated)
- `Genres` (semicolon-separated)

## iPhone Podcast Export Considerations

Common export formats from iOS podcast apps:
- **Apple Podcasts**: No native export (may need third-party tools)
- **Overcast**: OPML export (would need OPML parser)
- **Pocket Casts**: CSV export (check format)
- **Castro**: Limited export options

**Recommendation**: Create a converter script to transform various export formats into the standardized CSV format above.

## Future Metadata Enrichment Strategy

### Automated Script Approach
```bash
# Example cron job pseudocode
1. Query all PodcastSeries with ExternalId set
2. For each series:
   - Call ListenNotes API with ExternalId
   - Update metadata (description, thumbnail, publisher)
   - Fetch new episodes
   - Add episodes not in database
3. Log results
```

### Batch Processing
- Process in batches to respect API rate limits
- Use background jobs (Hangfire/Quartz)
- Store last sync timestamp per series
- Implement retry logic for failed API calls

## Estimated Effort

- **CSV Import Implementation**: 2-3 hours
  - Backend processing: 1.5 hours
  - Testing & validation: 0.5 hour
  - Frontend updates: 0.5 hour
  - Documentation: 0.5 hour

- **Metadata Enrichment Script**: 2-4 hours
  - Script creation: 1 hour
  - API integration: 1 hour
  - Error handling: 1 hour
  - Scheduling setup: 1 hour

## Priority

- **Phase 1** (When needed): CSV import for series and episodes
- **Phase 2** (Later): Metadata enrichment automation
- **Phase 3** (Optional): OPML/other format converters

## Related Files

- `UploadController.cs` - Main implementation
- `PodcastService.cs` - Existing podcast business logic
- `UploadMediaPage.jsx` - Frontend UI updates
- `apiService.js` - API call definitions

## Notes

- Consider using ExternalId as primary matching key (most reliable)
- Title matching should be case-insensitive and trim whitespace
- May want to add "dry run" mode to preview import results before committing
- Consider adding CSV validation endpoint to check format before upload

---

**Created**: December 14, 2025
**Status**: Planning - Not Yet Implemented
**Next Action**: Implement when iPhone podcast export is ready
