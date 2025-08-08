using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Domain.Entities
{
    public abstract class BaseMediaItem
    {
        public Guid Id { get; set; } = Guid.NewGuid(); // Primary Key
        
        [Required]
        [StringLength(500)]
        public required string Title { get; set; }
        
        [Required]
        public MediaType MediaType { get; set; }
        
        [Url]
        [StringLength(2000)]
        public string? Link { get; set; }
        
        public string? Notes { get; set; }
        
        public DateTime DateAdded { get; set; } = DateTime.UtcNow;
        
        [Required]
        public Status Status { get; set; } = Status.Uncharted;
        
        public DateTime? DateCompleted { get; set; } // Nullable to allow for items that haven't been consumed yet
        
        public Rating? Rating { get; set; }
        
        public OwnershipStatus? OwnershipStatus { get; set; }
        
        public string? Description { get; set; }
        
        [StringLength(200)]
        public string? Genre { get; set; }
        
        // Store as JSON array for better query performance
        public string[] Topics { get; set; } = Array.Empty<string>();
        
        // Store as JSON array for better query performance  
        public string[] Genres { get; set; } = Array.Empty<string>();
        
        // Add a field for one or more strings that would allow me to paste in links to my related Obsidian notes or other documents.
        public string? RelatedNotes { get; set; } // This can store links to Obsidian notes or other documents
        
        // Optional thumbnail for the media item
        [Url]
        [StringLength(2000)]
        public string? Thumbnail { get; set; }
        
        // Navigation property for many-to-many relationship with Mixlists
        public ICollection<Mixlist> Mixlists { get; set; } = new List<Mixlist>();
    }

    public enum MediaType
        {
        Article,
        Book,
        Document,
        Movie,
        Music,
        Other,
        Podcast,
        TVShow,
        Video,
        VideoGame,
        Website
    }

    public enum Status
    {
        Uncharted,
        ActivelyExploring,
        Completed,
        Abandoned
    }

    public enum Rating
    {
        SuperLike,
        Like,
        Neutral,
        Dislike
    }

    public enum OwnershipStatus
    {
        Own,
        Rented,
        Streamed
    }
}

