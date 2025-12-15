# CSV Upload Fix - Changes Summary

## Problem Identified

Your CSV upload was failing with a **500 Internal Server Error** because:

1. The `sample-mediaitems.csv` file contains **multiple different media types** (Book, Movie, TVShow, Article, Website, Video, PodcastSeries, PodcastEpisode) in a single file
2. The original implementation only supported **one media type per CSV** (determined from the first row)
3. **Missing handlers** for Video and Website media types
4. The backend tried to process all rows as the same type, causing processing errors

## Changes Made

### 1. Backend Changes

**File:** `src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API/Controllers/UploadController.cs`

#### Key Updates:

✅ **Per-Row Media Type Processing**
- Changed from single `mediaType` parameter to reading `MediaType` from each CSV row
- Made `mediaType` parameter optional for backward compatibility
- Each row can now have a different media type

✅ **Added Video Support**
- Created `ProcessVideoRow()` method
- Handles Video-specific properties: `Platform`, `LengthInSeconds`, `VideoType`, `ExternalId`

✅ **Added Website Support**
- Created `ProcessWebsiteRow()` method  
- Handles Website-specific properties: `Domain`, `RssFeedUrl`, `Author`, `Publication`

✅ **Better Error Handling**
- Clear error messages for unsupported types (PodcastSeries/PodcastEpisode)
- Validation for empty or invalid MediaType values
- Continues processing valid rows even if some fail

✅ **Updated Import Tracking**
- Properly tracks imported Video and Website items
- Returns detailed information for frontend display

### 2. Frontend Changes

**Files Modified:**
- `frontend/src/components/UploadMediaPage.jsx`
- `frontend/src/services/apiService.js`

#### Key Updates:

✅ **Removed Fixed Media Type**
- Frontend no longer sends a single `mediaType` parameter
- Lets backend read `MediaType` from each row

✅ **Updated Upload Logic**
- Modified `handleUpload()` to pass `null` for `mediaType`
- Backend now handles per-row processing automatically

✅ **Updated API Service**
- Made `mediaType` parameter optional in `uploadCsv()` function
- Only includes parameter in request if explicitly provided

✅ **Updated UI Instructions**
- Added information about mixed media type support
- Clarified that each row can have its own MediaType
- Added note about Podcast CSV import not being supported

## Files Created

1. **`CSV_UPLOAD_FIX.md`** - Detailed documentation about the fix and how to use it
2. **`temp-docs/sample-mediaitems-corrected.csv`** - A corrected version of your CSV with proper values
3. **`CSV_UPLOAD_CHANGES_SUMMARY.md`** (this file) - Summary of all changes

## Testing Instructions

### Step 1: Build the Backend

```powershell
cd src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API
dotnet build
```

### Step 2: Run the Backend

```powershell
dotnet run
```

Or if using Docker:
```powershell
docker-compose up
```

### Step 3: Test with the Corrected CSV

1. Navigate to the Upload Media page in your application
2. Upload the corrected CSV file: `temp-docs/sample-mediaitems-corrected.csv`
3. Check the results:
   - ✅ Books should import successfully
   - ✅ Movies should import successfully
   - ✅ TV Shows should import successfully
   - ✅ Articles should import successfully
   - ✅ Videos should import successfully
   - ✅ Websites should import successfully
   - ⚠️ PodcastSeries/PodcastEpisode rows will be skipped with informative messages

### Step 4: Review Import Results

The UI will show:
- **Success Count**: Number of successfully imported items
- **Error Count**: Number of failed items
- **Imported Items List**: Clickable list of all imported items
- **Error Details**: Expandable section showing any errors

## What's Different in the Corrected CSV

The corrected CSV (`sample-mediaitems-corrected.csv`) has:

### ✅ Fixed Enum Values

**Status** (old → new):
- ❌ "In Progress" → ✅ "ActivelyExploring"
- ❌ "Watching" → ✅ "ActivelyExploring"
- ❌ "Reading" → ✅ "ActivelyExploring"
- ❌ "Planning" → ✅ "Uncharted"

**Rating** (old → new):
- ❌ "5/5" → ✅ "SuperLike"
- ❌ "4/5" → ✅ "Like"
- ❌ "3/5" → ✅ "Neutral"

**OwnershipStatus** (old → new):
- ❌ "Watched" → ✅ "Streamed"
- ❌ "Borrowed" → ✅ "Rented"
- ❌ "N/A" → ✅ (removed/empty)

### ✅ Removed Unsupported Types

The corrected CSV **does not include**:
- PodcastSeries rows
- PodcastEpisode rows

These must be imported via the Import Media page instead.

### ✅ Added Required Columns for New Types

**Video rows now have:**
- `Platform` (e.g., "YouTube")
- `LengthInSeconds` (duration in seconds)
- `VideoType` (e.g., "Episode")

**Website rows now have:**
- `Domain` (e.g., "lovecraft.com")
- `Publication` (e.g., "H.P. Lovecraft Biography")

## Supported Media Types

| Media Type | CSV Import | Import Media Page | Notes |
|------------|-----------|-------------------|-------|
| Book | ✅ Yes | ✅ Yes | Fully supported via both methods |
| Movie | ✅ Yes | ✅ Yes | Fully supported via both methods |
| TVShow | ✅ Yes | ✅ Yes | Fully supported via both methods |
| Article | ✅ Yes | ✅ Yes | Fully supported via both methods |
| Video | ✅ Yes | ✅ Yes | **NEW** - Now supports CSV import |
| Website | ✅ Yes | ✅ Yes | **NEW** - Now supports CSV import |
| PodcastSeries | ❌ No | ✅ Yes | Use Import Media page only |
| PodcastEpisode | ❌ No | ✅ Yes | Use Import Media page only |

## Common CSV Columns (All Media Types)

These columns work for ALL media types:

```csv
MediaType,Title,Description,Link,Notes,RelatedNotes,Thumbnail,Status,Rating,OwnershipStatus,DateCompleted
```

**Valid Enum Values:**

**Status:**
- `Uncharted` - Haven't started yet
- `ActivelyExploring` - Currently consuming
- `Completed` - Finished
- `Abandoned` - Started but gave up

**Rating:**
- `SuperLike` - Absolutely loved it
- `Like` - Enjoyed it
- `Neutral` - It was okay
- `Dislike` - Didn't enjoy it

**OwnershipStatus:**
- `Own` - You own it
- `Rented` - Rented/borrowed
- `Streamed` - Watched/accessed via streaming

## Troubleshooting

### Issue: Still getting 500 error

**Solution:**
1. Make sure the backend is rebuilt: `dotnet build`
2. Restart the backend server
3. Clear browser cache and reload the frontend
4. Check backend logs for specific error messages

### Issue: Some rows are being skipped

**Possible causes:**
1. Invalid `MediaType` value - must be one of: `Book`, `Movie`, `TVShow`, `Article`, `Video`, `Website`
2. Empty `MediaType` column
3. Invalid date formats - use `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`
4. PodcastSeries or PodcastEpisode types (not supported via CSV)

### Issue: Enum values not being set

**Solution:**
- Double-check that you're using the exact enum values (case-insensitive)
- Invalid values are silently ignored - the field will just be empty
- See "Valid Enum Values" section above for correct values

### Issue: Special characters in CSV causing problems

**Solution:**
- Wrap fields containing commas in double quotes
- Example: `"Title with, comma","Description"` 
- Escape double quotes by doubling them: `"Title with ""quotes"" in it"`

## Next Steps

1. ✅ **Build the backend** to compile the changes
2. ✅ **Run the backend** server
3. ✅ **Test with corrected CSV** file
4. ✅ **Verify import results** in the UI
5. 📝 **Update your CSV templates** with correct enum values
6. 🎉 **Enjoy mixed media type CSV imports!**

## Additional Resources

- **CSV Format Guide**: See `CSV_UPLOAD_FIX.md` for detailed column information
- **Sample CSV**: Use `temp-docs/sample-mediaitems-corrected.csv` as a template
- **Backend API**: See `UploadController.cs` for implementation details
- **Future Podcast CSV Import**: See `PODCAST_CSV_IMPORT_PLAN.md` for implementation plan

## Questions?

If you encounter any issues:

1. Check the backend logs for detailed error messages
2. Verify your CSV format matches the examples
3. Ensure all required columns are present
4. Double-check enum values match exactly

---

**Summary**: Your CSV upload now supports mixed media types! Upload a single CSV with Books, Movies, TVShows, Articles, Videos, and Websites all together. 🎉
