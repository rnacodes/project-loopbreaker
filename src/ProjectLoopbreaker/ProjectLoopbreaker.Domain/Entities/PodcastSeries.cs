namespace ProjectLoopbreaker.Domain.Entities
{
    public class PodcastSeries : BaseMediaItem
    {
        //Link to podcast episode entity

        // Navigation property for the episodes in this series
        public ICollection<PodcastEpisode> Episodes { get; set; } = new List<PodcastEpisode>();

    }
}