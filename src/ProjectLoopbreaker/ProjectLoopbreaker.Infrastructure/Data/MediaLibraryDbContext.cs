using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Entities;
using System.Collections.Generic;

namespace ProjectLoopbreaker.Infrastructure.Data

{
    public class MediaLibraryDbContext : DbContext
    {
        public DbSet<BaseMediaItem> MediaItems { get; set; }

        public MediaLibraryDbContext(DbContextOptions<MediaLibraryDbContext> options) : base(options) { }
    }
}
