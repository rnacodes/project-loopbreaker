using Microsoft.EntityFrameworkCore;
using ProjectLoopbreaker.Domain.Interfaces;
using ProjectLoopbreaker.Domain.Entities;
using ProjectLoopbreaker.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using ProjectLoopbreaker.Application.Interfaces;

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
                _context.Add(podcast);
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
                var entry = _context.Entry(savedSeries);
                // Note: Collection loading is not available through the interface
                // This will need to be handled differently or the interface updated
            }

            return savedSeries;
        }

        public async Task<bool> PodcastExistsAsync(string title, string? publisher = null)
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

        public async Task<Podcast> GetPodcastByTitleAsync(string title, string? publisher = null)
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

        // New CRUD methods implementation
        public async Task<IEnumerable<Podcast>> GetAllPodcastsAsync()
        {
            return await _context.Podcasts.ToListAsync();
        }

        public async Task<IEnumerable<Podcast>> GetPodcastSeriesAsync()
        {
            return await _context.Podcasts
                .Where(p => p.PodcastType == PodcastType.Series)
                .ToListAsync();
        }

        public async Task<Podcast?> GetPodcastByIdAsync(Guid id)
        {
            return await _context.Podcasts
                .Include(p => p.Topics)
                .Include(p => p.Genres)
                .Include(p => p.Episodes)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Podcast>> GetEpisodesBySeriesIdAsync(Guid seriesId)
        {
            return await _context.Podcasts
                .Where(p => p.ParentPodcastId == seriesId && p.PodcastType == PodcastType.Episode)
                .Include(p => p.Topics)
                .Include(p => p.Genres)
                .ToListAsync();
        }

        public async Task<IEnumerable<Podcast>> SearchPodcastSeriesAsync(string query)
        {
            return await _context.Podcasts
                .Where(p => p.PodcastType == PodcastType.Series && 
                           (p.Title.Contains(query) || p.Publisher.Contains(query)))
                .ToListAsync();
        }

        public async Task<Podcast> CreatePodcastAsync(CreatePodcastDto dto)
        {
            // If creating an episode, verify the parent series exists
            if (dto.PodcastType == PodcastType.Episode && dto.ParentPodcastId.HasValue)
            {
                var parentSeries = await _context.Podcasts
                    .FirstOrDefaultAsync(p => p.Id == dto.ParentPodcastId.Value && p.PodcastType == PodcastType.Series);

                if (parentSeries == null)
                {
                    throw new ArgumentException($"Parent podcast series with ID {dto.ParentPodcastId.Value} not found.");
                }
            }

            var podcast = new Podcast
            {
                Title = dto.Title,
                MediaType = MediaType.Podcast,
                Link = dto.Link,
                Notes = dto.Notes,
                Status = dto.Status,
                DateAdded = DateTime.UtcNow,
                DateCompleted = dto.DateCompleted,
                Rating = dto.Rating,
                OwnershipStatus = dto.OwnershipStatus,
                Description = dto.Description,
                RelatedNotes = dto.RelatedNotes,
                Thumbnail = dto.Thumbnail,
                PodcastType = dto.PodcastType,
                ParentPodcastId = dto.ParentPodcastId,
                ExternalId = dto.ExternalId,
                Publisher = dto.Publisher,
                AudioLink = dto.AudioLink,
                ReleaseDate = dto.ReleaseDate,
                DurationInSeconds = dto.DurationInSeconds
            };

            // Handle Topics array conversion - check if they exist or create new ones
            if (dto.Topics?.Length > 0)
            {
                foreach (var topicName in dto.Topics.Where(t => !string.IsNullOrWhiteSpace(t)))
                {
                    var normalizedTopicName = topicName.ToLower();
                    var existingTopic = await _context.Topics
                        .FirstOrDefaultAsync(t => t.Name.ToLower() == normalizedTopicName);

                    if (existingTopic != null)
                    {
                        podcast.Topics.Add(existingTopic);
                    }
                    else
                    {
                        podcast.Topics.Add(new Topic { Name = normalizedTopicName });
                    }
                }
            }

            // Handle Genres array conversion - check if they exist or create new ones
            if (dto.Genres?.Length > 0)
            {
                foreach (var genreName in dto.Genres.Where(g => !string.IsNullOrWhiteSpace(g)))
                {
                    var normalizedGenreName = genreName.ToLower();
                    var existingGenre = await _context.Genres
                        .FirstOrDefaultAsync(g => g.Name.ToLower() == normalizedGenreName);

                    if (existingGenre != null)
                    {
                        podcast.Genres.Add(existingGenre);
                    }
                    else
                    {
                        podcast.Genres.Add(new Genre { Name = normalizedGenreName });
                    }
                }
            }

            _context.Add(podcast);
            await _context.SaveChangesAsync();

            return podcast;
        }

        public async Task<bool> DeletePodcastAsync(Guid id)
        {
            var podcast = await _context.FindAsync<Podcast>(id);
            if (podcast == null)
            {
                return false;
            }

            // If deleting a series, also delete all its episodes
            if (podcast.PodcastType == PodcastType.Series)
            {
                var episodes = await _context.Podcasts
                    .Where(p => p.ParentPodcastId == id)
                    .ToListAsync();
                
                foreach (var episode in episodes)
                {
                    _context.Remove(episode);
                }
            }

            _context.Remove(podcast);
            await _context.SaveChangesAsync();

            return true;
        }
    }
}
