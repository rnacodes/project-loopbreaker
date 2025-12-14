# Topics and Genres: CSV Import Information

## Current Behavior

### ❌ Topics/Genres are NOT automatically created during CSV upload

The current CSV upload implementation **does not process Topics and Genres columns** from your CSV file. The backend code has placeholder comments indicating these should be "assigned later through the UI."

### What happens when you upload a CSV with Topics/Genres columns?

1. ✅ The media item (Book, Movie, etc.) is created successfully
2. ❌ The Topics and Genres columns are ignored
3. ⚠️ You must manually add topics/genres to the media item after import

## New Feature: Create Topics/Genres from UI ✨

I've just added a new feature to the **Search by Topic or Genre** page:

### How to Create Topics and Genres:

1. Navigate to **Browse Topics/Genres** from the home page
2. Expand either the **Topics** or **Genres** section
3. Click the **➕ (plus icon)** button in the header
4. Enter the name of the new topic or genre
5. Click **Create**

### Features:
- ✅ Create topics and genres on-demand
- ✅ Duplicate checking (backend prevents duplicates automatically)
- ✅ Names are automatically normalized to lowercase
- ✅ Instant feedback with success/error messages
- ✅ Automatically refreshes the list after creation
- ✅ Press Enter to submit quickly

## How to Enable Automatic Topic/Genre Creation During CSV Import

If you want topics and genres to be automatically created from CSV files, you'll need to update the backend code:

### Required Changes in `UploadController.cs`

#### 1. Add helper methods to get or create topics/genres:

```csharp
private async Task<List<Topic>> ProcessTopicsFromCsv(string? topicsString)
{
    var topics = new List<Topic>();
    
    if (string.IsNullOrWhiteSpace(topicsString))
        return topics;
    
    // Split by semicolon or comma
    var topicNames = topicsString.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries);
    
    foreach (var topicName in topicNames)
    {
        var normalizedName = topicName.Trim().ToLowerInvariant();
        
        // Check if topic exists
        var existingTopic = await _context.Topics
            .FirstOrDefaultAsync(t => t.Name == normalizedName);
        
        if (existingTopic != null)
        {
            topics.Add(existingTopic);
        }
        else
        {
            // Create new topic
            var newTopic = new Topic { Name = normalizedName };
            _context.Topics.Add(newTopic);
            await _context.SaveChangesAsync(); // Save to get the ID
            topics.Add(newTopic);
        }
    }
    
    return topics;
}

private async Task<List<Genre>> ProcessGenresFromCsv(string? genresString)
{
    var genres = new List<Genre>();
    
    if (string.IsNullOrWhiteSpace(genresString))
        return genres;
    
    // Split by semicolon or comma
    var genreNames = genresString.Split(new[] { ';', ',' }, StringSplitOptions.RemoveEmptyEntries);
    
    foreach (var genreName in genreNames)
    {
        var normalizedName = genreName.Trim().ToLowerInvariant();
        
        // Check if genre exists
        var existingGenre = await _context.Genres
            .FirstOrDefaultAsync(g => g.Name == normalizedName);
        
        if (existingGenre != null)
        {
            genres.Add(existingGenre);
        }
        else
        {
            // Create new genre
            var newGenre = new Genre { Name = normalizedName };
            _context.Genres.Add(newGenre);
            await _context.SaveChangesAsync(); // Save to get the ID
            genres.Add(newGenre);
        }
    }
    
    return genres;
}
```

#### 2. Update each Process*Row method (ProcessBookRow, ProcessMovieRow, etc.):

Add these lines after parsing other fields:

```csharp
// In ProcessBookRow, ProcessMovieRow, ProcessTvShowRow, ProcessArticleRow:
var topicsString = GetCsvValue(csv, "Topics");
var genresString = GetCsvValue(csv, "Genres");

book.Topics = await ProcessTopicsFromCsv(topicsString);  // or movie.Topics, etc.
book.Genres = await ProcessGenresFromCsv(genresString);
```

### CSV Format for Topics and Genres

When the above changes are implemented, you can use these formats in your CSV:

```csv
Title,Author,Topics,Genres,...
"The Lean Startup","Eric Ries","entrepreneurship;business;startups","business;self-help",...
"Atomic Habits","James Clear","productivity;habits","self-help;psychology",...
```

**Separators supported:**
- Semicolon (`;`) - Recommended
- Comma (`,`) - Works but may need quotes around the entire field

## Summary

### Current State (Without Changes)
- ❌ CSV Topics/Genres columns are ignored
- ✅ Can create Topics/Genres manually from UI
- ⚠️ Must assign them to media items after import

### After Implementing Changes
- ✅ CSV Topics/Genres columns are processed
- ✅ Topics/Genres are auto-created if they don't exist
- ✅ Automatically linked to imported media items
- ✅ No duplicate topics/genres created

## Additional Resources

### Existing Controllers with Full CRUD:
- `TopicsController.cs` - Has POST endpoint for creating topics
- `GenresController.cs` - Has POST endpoint for creating genres

### Frontend Service Functions:
- `createTopic(topicData)` - Already implemented
- `createGenre(genreData)` - Already implemented

### Sample CSV Files:
Located in `/frontend/public/`:
- `sample-book-import.csv`
- `sample-movie-import.csv`
- `sample-tvshow-import.csv`
- `sample-podcast-import.csv`

These would need to be updated to show the Topics/Genres columns once the backend supports them.
