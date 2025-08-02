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

        public async Task<PodcastSeries> SavePodcastSeriesAsync(PodcastSeries podcastSeries, bool updateIfExists = true)
        {
            // Check if a podcast with the same title already exists
            var existingPodcast = await GetPodcastSeriesByTitleAsync(podcastSeries.Title);

            if (existingPodcast != null)
            {
                if (updateIfExists)
                {
                    // Update existing podcast properties
                    existingPodcast.Link = podcastSeries.Link ?? existingPodcast.Link;
                    existingPodcast.Notes = podcastSeries.Notes ?? existingPodcast.Notes;
                    existingPodcast.Thumbnail = podcastSeries.Thumbnail ?? existingPodcast.Thumbnail;
                    // Don't overwrite these if they exist
                    existingPodcast.Description = existingPodcast.Description ?? podcastSeries.Description;
                    existingPodcast.RelatedNotes = existingPodcast.RelatedNotes ?? podcastSeries.RelatedNotes;

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
                _context.PodcastSeries.Add(podcastSeries);
                await _context.SaveChangesAsync();
                return podcastSeries;
            }
        }

        public async Task<PodcastEpisode> SavePodcastEpisodeAsync(PodcastEpisode episode, bool updateIfExists = true)
        {
            // Check if an episode with the same title already exists in the series
            var existingEpisode = await GetPodcastEpisodeByTitleAsync(episode.PodcastSeriesId, episode.Title);

            if (existingEpisode != null)
            {
                if (updateIfExists)
                {
                    // Update existing episode properties
                    existingEpisode.Link = episode.Link ?? existingEpisode.Link;
                    existingEpisode.Notes = episode.Notes ?? existingEpisode.Notes;
                    existingEpisode.Thumbnail = episode.Thumbnail ?? existingEpisode.Thumbnail;
                    existingEpisode.AudioLink = episode.AudioLink ?? existingEpisode.AudioLink;
                    existingEpisode.ReleaseDate = episode.ReleaseDate ?? existingEpisode.ReleaseDate;

                    // Only update duration if it's greater than 0 (valid)
                    if (episode.DurationInSeconds > 0)
                    {
                        existingEpisode.DurationInSeconds = episode.DurationInSeconds;
                    }

                    await _context.SaveChangesAsync();
                    return existingEpisode;
                }
                else
                {
                    return existingEpisode; // Return existing without modifications
                }
            }
            else
            {
                // It's a new episode, add it
                _context.PodcastEpisodes.Add(episode);
                await _context.SaveChangesAsync();
                return episode;
            }
        }

        public async Task<PodcastSeries> SavePodcastWithEpisodesAsync(PodcastSeries podcastSeries, bool updateIfExists = true)
        {
            // First save or update the podcast series
            var savedSeries = await SavePodcastSeriesAsync(podcastSeries, updateIfExists);

            // If there are episodes to save
            if (podcastSeries.Episodes != null && podcastSeries.Episodes.Any())
            {
                foreach (var episode in podcastSeries.Episodes)
                {
                    // Make sure episode is linked to the correct series
                    episode.PodcastSeriesId = savedSeries.Id;

                    // Save the episode (with duplicate checking)
                    await SavePodcastEpisodeAsync(episode, updateIfExists);
                }

                // Refresh the series with all episodes
                await _context.Entry(savedSeries)
                    .Collection(s => s.Episodes)
                    .LoadAsync();
            }

            return savedSeries;
        }

        public async Task<bool> PodcastSeriesExistsAsync(string title, string publisher = null)
        {
            var query = _context.PodcastSeries.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(p => p.Title.ToLower() == title.ToLower());

            return await query.AnyAsync();
        }

        public async Task<bool> PodcastEpisodeExistsAsync(Guid seriesId, string episodeTitle)
        {
            return await _context.PodcastEpisodes
                .AnyAsync(e =>
                    e.PodcastSeriesId == seriesId &&
                    e.Title.ToLower() == episodeTitle.ToLower());
        }

        public async Task<PodcastSeries> GetPodcastSeriesByTitleAsync(string title, string publisher = null)
        {
            var query = _context.PodcastSeries.AsQueryable();

            // Always check title (case-insensitive)
            query = query.Where(p => p.Title.ToLower() == title.ToLower());

            return await query.FirstOrDefaultAsync();
        }

        public async Task<PodcastEpisode> GetPodcastEpisodeByTitleAsync(Guid seriesId, string episodeTitle)
        {
            return await _context.PodcastEpisodes
                .FirstOrDefaultAsync(e =>
                    e.PodcastSeriesId == seriesId &&
                    e.Title.ToLower() == episodeTitle.ToLower());
        }
    }
}
