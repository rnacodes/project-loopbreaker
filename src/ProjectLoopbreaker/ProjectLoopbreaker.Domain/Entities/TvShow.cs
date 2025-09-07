using System.ComponentModel.DataAnnotations;

namespace ProjectLoopbreaker.Domain.Entities
{
    public class TvShow : BaseMediaItem
    {
        [StringLength(100)]
        public string? Creator { get; set; }
        
        [StringLength(500)]
        public string? Cast { get; set; } // Comma-separated list of main cast members
        
        public int? FirstAirYear { get; set; }
        
        public int? LastAirYear { get; set; }
        
        public int? NumberOfSeasons { get; set; }
        
        public int? NumberOfEpisodes { get; set; }
        
        [StringLength(50)]
        public string? ContentRating { get; set; } // TV rating (TV-PG, TV-14, etc.)
        
        [StringLength(200)]
        public string? Network { get; set; } // Primary network/streaming service
        
        [StringLength(20)]
        public string? TmdbId { get; set; } // The Movie Database ID
        
        public double? TmdbRating { get; set; }
        
        [StringLength(2000)]
        public string? TmdbPosterPath { get; set; }
        
        [StringLength(1000)]
        public string? Tagline { get; set; }
        
        [StringLength(2000)]
        public string? Homepage { get; set; }
        
        [StringLength(10)]
        public string? OriginalLanguage { get; set; }
        
        [StringLength(500)]
        public string? OriginalName { get; set; }
        
        /// <summary>
        /// Gets the full TMDB poster URL
        /// </summary>
        public string? GetTmdbPosterUrl(string size = "w500")
        {
            if (string.IsNullOrEmpty(TmdbPosterPath))
                return null;
                
            return $"https://image.tmdb.org/t/p/{size}{TmdbPosterPath}";
        }
        
        /// <summary>
        /// Gets the effective thumbnail (TMDB poster or fallback to base thumbnail)
        /// </summary>
        public string? GetEffectiveThumbnail()
        {
            return GetTmdbPosterUrl() ?? Thumbnail;
        }
        
        /// <summary>
        /// Gets the air years as a formatted string
        /// </summary>
        public string? GetAirYears()
        {
            if (FirstAirYear.HasValue && LastAirYear.HasValue)
            {
                if (FirstAirYear == LastAirYear)
                    return FirstAirYear.ToString();
                return $"{FirstAirYear}-{LastAirYear}";
            }
            else if (FirstAirYear.HasValue)
            {
                return $"{FirstAirYear}-";
            }
            return null;
        }
        
        /// <summary>
        /// Gets the episode count as a formatted string
        /// </summary>
        public string? GetEpisodeCount()
        {
            if (NumberOfSeasons.HasValue && NumberOfEpisodes.HasValue)
            {
                return $"{NumberOfSeasons} season{(NumberOfSeasons > 1 ? "s" : "")}, {NumberOfEpisodes} episode{(NumberOfEpisodes > 1 ? "s" : "")}";
            }
            else if (NumberOfSeasons.HasValue)
            {
                return $"{NumberOfSeasons} season{(NumberOfSeasons > 1 ? "s" : "")}";
            }
            else if (NumberOfEpisodes.HasValue)
            {
                return $"{NumberOfEpisodes} episode{(NumberOfEpisodes > 1 ? "s" : "")}";
            }
            return null;
        }
    }
}
