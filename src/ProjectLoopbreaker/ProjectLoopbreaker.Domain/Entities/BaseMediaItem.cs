namespace ProjectLoopbreaker.Domain.Entities
{
    public class BaseMediaItem
    {
            public Guid Id { get; set; } = Guid.NewGuid(); // Primary Key
            public string Title { get; set; }
            public string MediaType { get; set; } // E.g., "Article", "Podcast", "Book"
            public string? Link { get; set; }
            public string? Notes { get; set; }
            public DateTime DateAdded { get; set; } = DateTime.UtcNow; 
            public bool Consumed { get; set; }
            public string? Rating { get; set; }

    }
}
