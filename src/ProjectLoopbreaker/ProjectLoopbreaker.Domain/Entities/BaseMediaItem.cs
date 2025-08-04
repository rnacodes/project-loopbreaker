using ProjectLoopbreaker.Domain.Entities;
using System.Collections.Generic;

namespace ProjectLoopbreaker.Domain.Entities
{
    public class BaseMediaItem
    {
            public Guid Id { get; set; } = Guid.NewGuid(); // Primary Key
            public required string Title { get; set; }
            public MediaType MediaType { get; set; }
            public string? Link { get; set; }
            public string? Notes { get; set; }
            public DateTime DateAdded { get; set; } = DateTime.UtcNow; 
            public bool Consumed { get; set; }
            public DateTime? DateConsumed { get; set; } // Nullable to allow for items that haven't been consumed yet
            public Rating? Rating { get; set; }
            public string? Description { get; set; }
            public string? Genre { get; set; }
            public string? Topics { get; set; }

        //Add a field for one or more strings that would allow me to paste in links to my related Obsidian notes or other documents.
            public string? RelatedNotes { get; set; } // This can store links to Obsidian notes or other documents
                                             // Navigation properties can be added later if needed for relationships with other entities
            public string? Thumbnail { get; set; } // Optional thumbnail for the media item
            
            // Navigation property for many-to-many relationship with Playlist
            public ICollection<Playlist> Playlists { get; set; } = new List<Playlist>();
    }
    public class CreateMediaItemDto
    {
        public string Title { get; set; }
        public string MediaType { get; set; }
        public string? Link { get; set; }
        public string? Notes { get; set; }
        public bool Consumed { get; set; }
        public string? Rating { get; set; }
        public string? RelatedNotes { get; set; }
        public string? Thumbnail { get; set; }
        public string? Description { get; set; }
        public string? Genre { get; set; }
        public string? Topics { get; set; }
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

    public enum Rating
        {
            SuperLike,
            Like,
            Neutral,
            Dislike
        }

    }

