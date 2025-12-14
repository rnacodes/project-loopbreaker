# Database Performance Issues and Solutions

## Summary
The application is experiencing slow database queries due to several Entity Framework Core configuration and querying patterns. Below are the identified issues and their solutions.

---

## Critical Issues Found

### 1. **Missing `AsNoTracking()` on Read-Only Queries** ⚠️ HIGH PRIORITY
**Problem:** All read operations (GetAll, GetById, etc.) are using change tracking even though they only need to read data. This consumes unnecessary memory and CPU.

**Example from BookService.cs (lines 26-29):**
```csharp
return await _context.Books
    .Include(b => b.Topics)
    .Include(b => b.Genres)
    .ToListAsync();
```

**Impact:** 
- Increased memory usage (tracking metadata for every entity)
- Slower query execution (20-30% overhead)
- Memory pressure on large result sets

**Solution:** Add `.AsNoTracking()` to all read-only queries

---

### 2. **Cartesian Explosion with Multiple `.Include()`** ⚠️ HIGH PRIORITY
**Problem:** When using multiple `.Include()` statements, EF Core creates a single SQL query with JOINs that produces a cartesian product, resulting in redundant data being transferred from the database.

**Example:** A media item with 3 Topics and 2 Genres results in 6 rows (3×2) being returned instead of 1+3+2.

**Impact:**
- Exponentially more data transferred from database
- Slower query execution on large datasets
- Network bandwidth waste

**Solution:** Use `.AsSplitQuery()` to split into separate SQL queries

---

### 3. **Table-Per-Type (TPT) Inheritance** ⚠️ MEDIUM PRIORITY
**Problem:** The `MediaLibraryDbContext` uses TPT inheritance where each entity type (Book, Movie, Video, etc.) has its own table. This requires JOINs for every query.

**Found in MediaLibraryDbContext.cs (lines 208-218):**
```csharp
modelBuilder.Entity<BaseMediaItem>().ToTable("MediaItems");
modelBuilder.Entity<PodcastSeries>().ToTable("PodcastSeries");
modelBuilder.Entity<Book>().ToTable("Books");
// ... etc
```

**Impact:**
- Every query requires JOIN operations
- Slower queries especially for GetAll operations
- More complex SQL execution plans

**Solution:** Consider migrating to Table-Per-Hierarchy (TPH) inheritance in the future, or add indexes on join columns

---

### 4. **N+1 Query Pattern in Loops** ⚠️ HIGH PRIORITY
**Problem:** Multiple `SaveChangesAsync()` calls inside loops cause multiple database round trips.

**Found in MediaController.cs (AddTopicsToMediaItemAsync, lines 130-140):**
```csharp
foreach (var topicName in topicNames.Where(t => !string.IsNullOrWhiteSpace(t)))
{
    var existingTopic = await _context.Topics
        .AsNoTracking()
        .FirstOrDefaultAsync(t => t.Name == normalizedTopicName);
    
    if (existingTopic == null)
    {
        existingTopic = new Topic { Name = normalizedTopicName };
        _context.Topics.Add(existingTopic);
        await _context.SaveChangesAsync(); // ❌ SLOW: Inside loop!
    }
}
```

**Impact:**
- Multiple database round trips (network latency multiplied)
- Potentially 10-20+ queries for a single operation
- Locks held longer

**Solution:** Batch operations and call `SaveChangesAsync()` once

---

### 5. **Missing Query Optimization for Search** ⚠️ MEDIUM PRIORITY
**Problem:** Search queries use `.Contains()` with `.ToLower()` which prevents index usage and requires full table scans.

**Found in MediaController.cs (line 694-702):**
```csharp
var results = await _context.MediaItems
    .Where(m => m.Title.ToLower().Contains(searchQuery) || 
           (m.Description != null && m.Description.ToLower().Contains(searchQuery)) ||
           (m.Topics.Any(t => t.Name.ToLower().Contains(searchQuery))))
```

**Impact:**
- Full table scans on large tables
- Unable to use indexes effectively
- Slow search response times

**Solution:** Use `EF.Functions.ILike()` for PostgreSQL, or computed columns with indexes

---

### 6. **Redundant Database Queries** ⚠️ MEDIUM PRIORITY
**Problem:** After creating/updating entities, the code re-queries the database with `.Include()` to load related data.

**Found in MediaController.cs (lines 88-92):**
```csharp
_context.Add(mediaItem);
await _context.SaveChangesAsync();

// Reload the entity with includes ❌ Redundant query!
var createdMediaItem = await _context.MediaItems
    .Include(m => m.Topics)
    .Include(m => m.Genres)
    .Include(m => m.Mixlists)
    .FirstOrDefaultAsync(m => m.Id == mediaItem.Id);
```

**Impact:**
- Extra database round trip
- Duplicated data transfer
- Increased latency

**Solution:** Load related entities during the initial query or use explicit loading

---

## Performance Optimization Priority

### Phase 1: Quick Wins (Implement Immediately)
1. Add `.AsNoTracking()` to all read-only queries
2. Add `.AsSplitQuery()` to queries with multiple `.Include()`
3. Batch `SaveChangesAsync()` calls outside loops

### Phase 2: Medium Term (Next Sprint)
4. Optimize search queries with PostgreSQL-specific functions
5. Review and optimize indexes
6. Add query result caching for frequently accessed data

### Phase 3: Long Term (Future Consideration)
7. Consider migration from TPT to TPH inheritance
8. Implement projection DTOs to reduce data transfer
9. Add database query logging to identify slow queries

---

## Estimated Performance Improvements

After implementing Phase 1 fixes:
- **Read queries:** 30-50% faster
- **Memory usage:** 40-60% reduction
- **Write operations:** 60-80% faster (batch operations)
- **Search queries:** Will remain slow until Phase 2

---

## Next Steps

1. Review the detailed fixes in the implementation plan
2. Run performance benchmarks before and after changes
3. Test thoroughly in a staging environment
4. Monitor query performance in production

---

**Created:** December 14, 2025
**Author:** AI Assistant
**Status:** Needs Implementation
