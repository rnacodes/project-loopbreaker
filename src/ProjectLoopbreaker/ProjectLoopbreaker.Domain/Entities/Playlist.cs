using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Domain.Entities
{
    public class Playlist
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // Default to empty string to avoid null issues
        public string Thumbnail { get; set; } = string.Empty; // Default to empty string to avoid null issues
        // Navigation property for many-to-many
        public ICollection<PodcastSeries> PodcastSeries { get; set; } = new List<PodcastSeries>();
    }
}
