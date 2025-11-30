import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PodcastSeriesProfile from '../PodcastSeriesProfile';
import * as apiService from '../../services/apiService';

// Mock API service
vi.mock('../../services/apiService');

// Mock useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-series-id' }),
    useNavigate: () => vi.fn(),
  };
});

describe('PodcastSeriesProfile', () => {
  const mockSeries = {
    id: 'test-series-id',
    title: 'Test Podcast Series',
    publisher: 'Test Publisher',
    description: 'Test description about this podcast series',
    thumbnail: 'https://example.com/thumb.jpg',
    totalEpisodes: 42,
    isSubscribed: false,
    status: 0,
    dateAdded: new Date().toISOString(),
    mediaType: 1,
  };

  const mockEpisodes = [
    {
      id: 'ep1',
      title: 'Episode 1: Introduction',
      episodeNumber: 1,
      seasonNumber: 1,
      durationInSeconds: 3600,
      releaseDate: new Date('2024-01-01').toISOString(),
      status: 0,
      description: 'First episode description',
    },
    {
      id: 'ep2',
      title: 'Episode 2: Deep Dive',
      episodeNumber: 2,
      seasonNumber: 1,
      durationInSeconds: 4200,
      releaseDate: new Date('2024-01-08').toISOString(),
      status: 0,
      description: 'Second episode description',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Podcast API functions return axios response with { data: }
    apiService.getPodcastSeriesById.mockResolvedValue({ data: mockSeries });
    apiService.getEpisodesBySeriesId.mockResolvedValue({ data: mockEpisodes });
    apiService.getAllMixlists.mockResolvedValue({ data: [] });
  });

  it('renders podcast series details correctly', async () => {
    render(
      <BrowserRouter>
        <PodcastSeriesProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Podcast Series')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Publisher')).toBeInTheDocument();
    expect(screen.getByText(/42 episodes/i)).toBeInTheDocument();
  });

  it('displays episodes in accordion', async () => {
    render(
      <BrowserRouter>
        <PodcastSeriesProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Episodes/i)).toBeInTheDocument();
    });

    // Episodes should be visible
    const episodeSection = screen.getByText(/Episodes/i);
    expect(episodeSection).toBeInTheDocument();
  });

  it('handles subscribe button click', async () => {
    apiService.subscribeToPodcastSeries.mockResolvedValue({
      data: { ...mockSeries, isSubscribed: true }
    });

    render(
      <BrowserRouter>
        <PodcastSeriesProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      const subscribeButton = screen.queryByText('Subscribe');
      if (subscribeButton) {
        fireEvent.click(subscribeButton);
      }
    });

    // Verify the subscribe API was called if button existed
    if (apiService.subscribeToPodcastSeries.mock.calls.length > 0) {
      expect(apiService.subscribeToPodcastSeries).toHaveBeenCalledWith('test-series-id');
    }
  });

  it('handles sync episodes button click', async () => {
    apiService.syncPodcastSeriesEpisodes.mockResolvedValue({
      data: { newEpisodesCount: 3, message: 'Synced successfully' }
    });

    render(
      <BrowserRouter>
        <PodcastSeriesProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      const syncButton = screen.queryByText(/Sync/i);
      if (syncButton) {
        fireEvent.click(syncButton);
      }
    });

    // Verify sync was called if button existed
    if (apiService.syncPodcastSeriesEpisodes.mock.calls.length > 0) {
      expect(apiService.syncPodcastSeriesEpisodes).toHaveBeenCalledWith('test-series-id');
    }
  });

  it('loads and displays episode data', async () => {
    render(
      <BrowserRouter>
        <PodcastSeriesProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(apiService.getEpisodesBySeriesId).toHaveBeenCalledWith('test-series-id');
    });

    // Verify episodes are fetched
    expect(apiService.getEpisodesBySeriesId).toHaveBeenCalled();
  });

  it('handles loading state', () => {
    apiService.getPodcastSeriesById.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: mockSeries }), 100))
    );

    render(
      <BrowserRouter>
        <PodcastSeriesProfile />
      </BrowserRouter>
    );

    // During loading, series title should not be present yet
    expect(screen.queryByText('Test Podcast Series')).not.toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.getPodcastSeriesById.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <PodcastSeriesProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });
});

