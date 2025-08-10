using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Application.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectLoopbreaker.Application.Services
{
    public class PodcastService : IPodcastService
    {
        private readonly IApplicationDbContext _context;

        public PodcastService(IApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<Podcast> SavePodcastAsync(Podcast podcast, bool updateIfExists = true)
        {
            // Check if a podcast with the same title already exists
            var existingPodcast = await GetPodcastByTitleAsync(podcast.Title);

            if (existingPodcast != null)
            {
                if (updateIfExists)
                {
                    // Update existing podcast properties
                    existingPodcast.Link = podcast.Link ?? existingPodcast.Link;
                    existingPodcast.Notes = podcast.Notes ?? existingPodcast.Notes;
                    existingPodcast.Thumbnail = podcast.Thumbnail ?? existingPodcast.Thumbnail;
                    // Don't overwrite these if they exist
                    existingPodcast.Description = existingPodcast.Description ?? podcast.Description;
                    existingPodcast.RelatedNotes = existingPodcast.RelatedNotes ?? podcast.RelatedNotes;

                    await _context.SaveChangesAsync();
                    return existingPodcast;
                }
                else
                {
                    return existingPodcast; // Return existing without modifications
                }
            }
            else
            {
                // It's a new podcast, add it
                _context.Podcasts.Add(podcast);
                await _context.SaveChangesAsync();
                return podcast;
            }
        }

        // This method is now merged into SavePodcastAsync since episodes are just podcasts with PodcastType.Episode

        public async Task<Podcast> SavePodcastWithEpisodesAsync(Podcast podcastSeries, bool updateIfExists = true)
        {
            // First save or update the podcast series
            var savedSeries = await SavePodcastAsync(podcastSeries, updateIfExists);

            // If there are episodes to save
            if (podcastSeries.Episodes != null && podcastSeries.Episodes.Any())
            {
                foreach (var episode in podcastSeries.Episodes)
                {
                    // Make sure episode is linked to the correct series
                    episode.ParentPodcastId = savedSeries.Id;
                    episode.PodcastType = PodcastType.Episode;

                    // Save the episode (with duplicate checking)
                    await SavePodcastAsync(episode, updateIfExists);
                }

                // Refresh the series with all episodes
                await _context.Entry(savedSeries)
                    .Collection(s => s.Episodes)
                    .LoadAsync();
            }

            return savedSeries;
        }

        public async Task<bool> PodcastExistsAsync(string title, string publisher = null)
        {
            var query = _context.Podcasts.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(p => p.Title.ToLower() == title.ToLower());

            return await query.AnyAsync();
        }

        public async Task<bool> PodcastEpisodeExistsAsync(Guid? parentPodcastId, string episodeTitle)
        {
            return await _context.Podcasts
                .AnyAsync(e =>
                    e.ParentPodcastId == parentPodcastId &&
                    e.PodcastType == PodcastType.Episode &&
                    e.Title.ToLower() == episodeTitle.ToLower());
        }

        public async Task<Podcast> GetPodcastByTitleAsync(string title, string publisher = null)
        {
            var query = _context.Podcasts.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(p => p.Title.ToLower() == title.ToLower());

            return await query.FirstOrDefaultAsync();
        }

        public async Task<Podcast> GetPodcastEpisodeByTitleAsync(Guid? parentPodcastId, string episodeTitle)
        {
            return await _context.Podcasts
                .FirstOrDefaultAsync(e =>
                    e.ParentPodcastId == parentPodcastId &&
                    e.PodcastType == PodcastType.Episode &&
                    e.Title.ToLower() == episodeTitle.ToLower());
        }
    }
}
