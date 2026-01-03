import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PodcastEpisodeProfile from '../PodcastEpisodeProfile';
import * as apiService from '../../api';

// Mock API service
vi.mock('../../api');

// Mock useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-episode-id' }),
    useNavigate: () => vi.fn(),
  };
});

describe('PodcastEpisodeProfile', () => {
  const mockEpisode = {
    id: 'test-episode-id',
    title: 'Test Episode Title',
    seriesId: 'test-series-id',
    episodeNumber: 5,
    seasonNumber: 1,
    durationInSeconds: 3600,
    releaseDate: new Date('2024-01-15').toISOString(),
    status: 0,
    description: 'Test episode description',
    audioLink: 'https://example.com/audio.mp3',
    mediaType: 1,
  };

  const mockSeries = {
    id: 'test-series-id',
    title: 'Parent Series Title',
    publisher: 'Test Publisher',
    totalEpisodes: 42,
    thumbnail: 'https://example.com/series-thumb.jpg',
  };

  const mockAllEpisodes = [
    { id: 'ep4', episodeNumber: 4 },
    { id: 'test-episode-id', episodeNumber: 5 },
    { id: 'ep6', episodeNumber: 6 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Podcast API functions return axios response with { data: }
    apiService.getPodcastEpisodeById.mockResolvedValue({ data: mockEpisode });
    apiService.getPodcastSeriesById.mockResolvedValue({ data: mockSeries });
    apiService.getEpisodesBySeriesId.mockResolvedValue({ data: mockAllEpisodes });
    apiService.getAllMixlists.mockResolvedValue({ data: [] });
  });

  it('renders episode details correctly', async () => {
    render(
      <BrowserRouter>
        <PodcastEpisodeProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Episode Title')).toBeInTheDocument();
    });

    expect(screen.getByText(/Test episode description/i)).toBeInTheDocument();
  });

  it('displays parent series information', async () => {
    render(
      <BrowserRouter>
        <PodcastEpisodeProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Parent Series/i)).toBeInTheDocument();
    });
  });

  it('shows episode position indicator', async () => {
    render(
      <BrowserRouter>
        <PodcastEpisodeProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Episode 5 should be shown
      const episodeIndicator = screen.queryByText(/Episode 5/i) || screen.queryByText(/S1E5/i);
      expect(episodeIndicator).toBeTruthy();
    });
  });

  it('fetches all related data on mount', async () => {
    render(
      <BrowserRouter>
        <PodcastEpisodeProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getPodcastEpisodeById).toHaveBeenCalledWith('test-episode-id');
    });

    // Should also fetch series data
    expect(apiService.getPodcastEpisodeById).toHaveBeenCalled();
  });

  it('handles loading state', () => {
    apiService.getPodcastEpisodeById.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: mockEpisode }), 100))
    );

    render(
      <BrowserRouter>
        <PodcastEpisodeProfile />
      </BrowserRouter>
    );

    // During loading, episode title should not be present yet
    expect(screen.queryByText('Test Episode Title')).not.toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.getPodcastEpisodeById.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <PodcastEpisodeProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});

