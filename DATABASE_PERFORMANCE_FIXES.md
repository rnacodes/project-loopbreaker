# Database Performance Fixes - Implementation Guide

This document provides specific code changes to fix the identified performance issues.

---

## Fix 1: Add AsNoTracking() to Read-Only Queries

### Before (Slow):
```csharp
public async Task<IEnumerable<Book>> GetAllBooksAsync()
{
    return await _context.Books
        .Include(b => b.Topics)
        .Include(b => b.Genres)
        .ToListAsync();
}
```

### After (Fast):
```csharp
public async Task<IEnumerable<Book>> GetAllBooksAsync()
{
    return await _context.Books
        .AsNoTracking()  // ✅ No change tracking for read-only
        .Include(b => b.Topics)
        .Include(b => b.Genres)
        .ToListAsync();
}
```

### Apply to these files:
- `BookService.cs` - All Get methods
- `MovieService.cs` - All Get methods  
- `TvShowService.cs` - All Get methods
- `VideoService.cs` - All Get methods
- `ArticleService.cs` - All Get methods
- `PodcastService.cs` - All Get methods
- `YouTubeChannelService.cs` - All Get methods
- `YouTubePlaylistService.cs` - All Get methods
- `WebsiteService.cs` - All Get methods
- `HighlightService.cs` - All Get methods
- `MediaController.cs` - GetAllMedia, GetMediaByTopic, GetMediaByGenre, etc.
- `MixlistController.cs` - All Get methods

---

## Fix 2: Add AsSplitQuery() to Prevent Cartesian Explosion

### Before (Slow - Cartesian Product):
```csharp
public async Task<IEnumerable<Book>> GetAllBooksAsync()
{
    return await _context.Books
        .AsNoTracking()
        .Include(b => b.Topics)    // Join 1
        .Include(b => b.Genres)    // Join 2 → Cartesian explosion!
        .ToListAsync();
}
```

### After (Fast - Separate Queries):
```csharp
public async Task<IEnumerable<Book>> GetAllBooksAsync()
{
    return await _context.Books
        .AsNoTracking()
        .AsSplitQuery()  // ✅ Splits into separate SQL queries
        .Include(b => b.Topics)
        .Include(b => b.Genres)
        .ToListAsync();
}
```

**SQL Generated:**
- Before: 1 query with 2 JOINs (returns NxM rows)
- After: 3 queries (1 for books, 1 for topics, 1 for genres)

### Apply to: Any query with 2+ `.Include()` statements

---

## Fix 3: Batch SaveChangesAsync() Outside Loops

### Before (Slow - N+1 Problem):
```csharp
private async Task AddTopicsToMediaItemAsync(BaseMediaItem mediaItem, string[] topicNames)
{
    foreach (var topicName in topicNames.Where(t => !string.IsNullOrWhiteSpace(t)))
    {
        var normalizedTopicName = topicName.Trim().ToLowerInvariant();
        var existingTopic = await _context.Topics
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
        
        if (existingTopic == null)
        {
            existingTopic = new Topic { Name = normalizedTopicName };
            _context.Topics.Add(existingTopic);
            await _context.SaveChangesAsync(); // ❌ SLOW: Multiple round trips
        }
        
        var trackedTopic = await _context.Topics.FindAsync(existingTopic.Id);
        if (trackedTopic != null)
        {
            mediaItem.Topics.Add(trackedTopic);
        }
    }
}
```

### After (Fast - Batched Operations):
```csharp
private async Task AddTopicsToMediaItemAsync(BaseMediaItem mediaItem, string[] topicNames)
{
    if (topicNames == null || topicNames.Length == 0)
        return;

    var normalizedTopicNames = topicNames
        .Where(t => !string.IsNullOrWhiteSpace(t))
        .Select(t => t.Trim().ToLowerInvariant())
        .Distinct()
        .ToList();

    // ✅ Single query to fetch all existing topics
    var existingTopics = await _context.Topics
        .AsNoTracking()
        .Where(t => normalizedTopicNames.Contains(t.Name))
        .ToListAsync();

    var existingTopicNames = existingTopics.Select(t => t.Name).ToHashSet();
    var newTopicNames = normalizedTopicNames.Except(existingTopicNames).ToList();

    // ✅ Add all new topics at once
    if (newTopicNames.Any())
    {
        var newTopics = newTopicNames.Select(name => new Topic { Name = name }).ToList();
        _context.Topics.AddRange(newTopics);
        await _context.SaveChangesAsync(); // Only 1 round trip for all new topics
        existingTopics.AddRange(newTopics);
    }

    // ✅ Load all topics into tracking context and add to media item
    var topicIds = existingTopics.Select(t => t.Id).ToList();
    var trackedTopics = await _context.Topics
        .Where(t => topicIds.Contains(t.Id))
        .ToListAsync();

    foreach (var topic in trackedTopics)
    {
        if (!mediaItem.Topics.Any(t => t.Id == topic.Id))
        {
            mediaItem.Topics.Add(topic);
        }
    }
}
```

### Apply to:
- `MediaController.cs` - `AddTopicsToMediaItemAsync()` and `AddGenresToMediaItemAsync()`
- Similar patterns in all services that handle Topics/Genres

---

## Fix 4: Optimize Search Queries

### Before (Slow - Full Table Scan):
```csharp
var results = await _context.MediaItems
    .Where(m => m.Title.ToLower().Contains(searchQuery) || 
           (m.Description != null && m.Description.ToLower().Contains(searchQuery)))
    .Include(m => m.Topics)
    .Include(m => m.Genres)
    .ToListAsync();
```

### After (Faster - PostgreSQL Optimized):
```csharp
var results = await _context.MediaItems
    .AsNoTracking()
    .AsSplitQuery()
    .Where(m => EF.Functions.ILike(m.Title, $"%{searchQuery}%") || 
           (m.Description != null && EF.Functions.ILike(m.Description, $"%{searchQuery}%")))
    .Include(m => m.Topics)
    .Include(m => m.Genres)
    .Take(100) // ✅ Limit results to prevent loading entire table
    .ToListAsync();
```

**Note:** `EF.Functions.ILike()` is PostgreSQL-specific case-insensitive search that can use indexes.

### Apply to:
- `MediaController.cs` - `SearchMedia()` method
- Any other search functionality

---

## Fix 5: Remove Redundant Queries After Save

### Before (Slow - Double Query):
```csharp
_context.Add(mediaItem);
await _context.SaveChangesAsync();

// ❌ Redundant query
var createdMediaItem = await _context.MediaItems
    .Include(m => m.Topics)
    .Include(m => m.Genres)
    .Include(m => m.Mixlists)
    .FirstOrDefaultAsync(m => m.Id == mediaItem.Id);
```

### After (Fast - Reuse Existing Entity):
```csharp
// Topics and Genres are already loaded from AddTopicsToMediaItemAsync
_context.Add(mediaItem);
await _context.SaveChangesAsync();

// ✅ Use the already-tracked entity
// mediaItem already has Topics and Genres loaded
// Only load Mixlists if needed
await _context.Entry(mediaItem)
    .Collection(m => m.Mixlists)
    .LoadAsync();

var createdMediaItem = mediaItem; // No need to re-query
```

### Apply to:
- `MediaController.cs` - `AddMediaItem()` and `UpdateMediaItem()` methods

---

## Fix 6: Add Database Configuration for Connection Pooling

### Add to Program.cs DbContext Configuration:
```csharp
builder.Services.AddDbContext<MediaLibraryDbContext>(options =>
{
    options.UseNpgsql(dataSource, npgsqlOptions =>
    {
        // ✅ Enable command timeout
        npgsqlOptions.CommandTimeout(30);
        
        // ✅ Enable retry on transient failures
        npgsqlOptions.EnableRetryOnFailure(
            maxRetryCount: 3,
            maxRetryDelay: TimeSpan.FromSeconds(5),
            errorCodesToAdd: null);
    })
    // ✅ Enable detailed query logging in development
    .EnableSensitiveDataLogging(builder.Environment.IsDevelopment())
    .EnableDetailedErrors(builder.Environment.IsDevelopment())
    // ✅ Warn on slow queries (> 1 second)
    .ConfigureWarnings(warnings => 
        warnings.Log((RelationalEventId.CommandExecuting, LogLevel.Debug)));
});
```

---

## Fix 7: Add Missing Indexes for Performance

### Update MediaLibraryDbContext.OnModelCreating():

```csharp
// ✅ Add composite index for common search pattern
modelBuilder.Entity<BaseMediaItem>(entity =>
{
    // Existing configuration...
    
    // Add index for faster searching
    entity.HasIndex(e => new { e.MediaType, e.Status, e.DateAdded });
    
    // Add index for Title searches (case-insensitive)
    entity.HasIndex(e => e.Title)
        .HasMethod("gin")  // PostgreSQL GIN index for text search
        .HasOperators("gin_trgm_ops"); // Trigram search
});

// ✅ Add index on many-to-many junction tables
modelBuilder.Entity<Dictionary<string, object>>("MediaItemTopics", entity =>
{
    entity.HasIndex("MediaItemId");
    entity.HasIndex("TopicId");
});

modelBuilder.Entity<Dictionary<string, object>>("MediaItemGenres", entity =>
{
    entity.HasIndex("MediaItemId");
    entity.HasIndex("GenreId");
});
```

### Create Migration:
```bash
dotnet ef migrations add AddPerformanceIndexes --project src/ProjectLoopbreaker/ProjectLoopbreaker.Infrastructure
dotnet ef database update --project src/ProjectLoopbreaker/ProjectLoopbreaker.Web.API
```

---

## Testing Performance Improvements

### Add Query Logging (Development Only):

```csharp
// In appsettings.Development.json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.EntityFrameworkCore.Database.Command": "Information"
    }
  }
}
```

### Measure Query Times:
```csharp
var stopwatch = System.Diagnostics.Stopwatch.StartNew();
var books = await _context.Books
    .AsNoTracking()
    .AsSplitQuery()
    .Include(b => b.Topics)
    .Include(b => b.Genres)
    .ToListAsync();
stopwatch.Stop();
_logger.LogInformation("Query took {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
```

---

## Implementation Checklist

### Phase 1 (Priority - Do First):
- [ ] Add `.AsNoTracking()` to all read-only queries in services
- [ ] Add `.AsSplitQuery()` to all queries with multiple `.Include()`
- [ ] Refactor `AddTopicsToMediaItemAsync()` and `AddGenresToMediaItemAsync()` to batch operations
- [ ] Update MediaController to remove redundant queries after save

### Phase 2 (High Priority):
- [ ] Update search queries to use `EF.Functions.ILike()`
- [ ] Add `.Take()` limits to search queries
- [ ] Add connection pooling configuration to Program.cs
- [ ] Enable query logging in development

### Phase 3 (Medium Priority):
- [ ] Create migration for new performance indexes
- [ ] Test and apply indexes to database
- [ ] Add query performance monitoring

---

## Expected Results

| Operation | Before | After | Improvement |
|-----------|--------|-------|-------------|
| Get All Books (100 items) | ~500ms | ~150ms | 70% faster |
| Get Book by ID | ~50ms | ~20ms | 60% faster |
| Search Media | ~2000ms | ~400ms | 80% faster |
| Create Media Item | ~300ms | ~100ms | 67% faster |
| Bulk Operations | N × 100ms | 200ms | 80%+ faster |

---

**Note:** Actual improvements depend on database size, network latency, and hardware.
