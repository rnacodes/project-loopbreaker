using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Domain.Entities
{
    public class Movie : BaseMediaItem
    {
        [StringLength(100)]
        public string? Director { get; set; }
        
        [StringLength(500)]
        public string? Cast { get; set; } // Comma-separated list of main cast members
        
        public int? ReleaseYear { get; set; }
        
        public int? RuntimeMinutes { get; set; }
        
        [StringLength(50)]
        public string? MpaaRating { get; set; } // MPAA rating (PG, PG-13, R, etc.)
        
        [StringLength(20)]
        public string? ImdbId { get; set; }
        
        [StringLength(20)]
        public string? TmdbId { get; set; } // The Movie Database ID
        
        public double? TmdbRating { get; set; }
        
        [StringLength(2000)]
        public string? TmdbBackdropPath { get; set; }
        
        [StringLength(1000)]
        public string? Tagline { get; set; }
        
        [StringLength(2000)]
        public string? Homepage { get; set; }
        
        [StringLength(10)]
        public string? OriginalLanguage { get; set; }
        
        [StringLength(500)]
        public string? OriginalTitle { get; set; }
        
        /// <summary>
        /// Gets the full TMDB backdrop URL
        /// </summary>
        public string? GetTmdbBackdropUrl(string size = "w1280")
        {
            if (string.IsNullOrEmpty(TmdbBackdropPath))
                return null;
                
            return $"https://image.tmdb.org/t/p/{size}{TmdbBackdropPath}";
        }
    }
}
