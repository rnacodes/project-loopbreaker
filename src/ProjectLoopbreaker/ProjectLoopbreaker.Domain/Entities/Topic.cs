using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Domain.Entities
{
    public class Topic
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        [StringLength(100)]
        public required string Name { get; set; }
        
        // Navigation property for many-to-many relationship with media items
        public ICollection<BaseMediaItem> MediaItems { get; set; } = new List<BaseMediaItem>();
    }
}
