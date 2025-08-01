using ProjectLoopbreaker.Domain.Entities;

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
            public string? Rating { get; set; }
    }

       public enum MediaType
        {
            Article,
            Podcast,
            Book,
            Website,
            Document,
            Movie,
            TVShow,
            Music,
            Video,
            VideoGame,
            Other
        }
    }

