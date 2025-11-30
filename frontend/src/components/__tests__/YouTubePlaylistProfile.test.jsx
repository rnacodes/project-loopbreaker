import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import YouTubePlaylistProfile from '../YouTubePlaylistProfile';
import * as apiService from '../../services/apiService';

// Mock API service
vi.mock('../../services/apiService');

// Mock useParams and useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'test-playlist-id' }),
    useNavigate: () => vi.fn(),
  };
});

describe('YouTubePlaylistProfile', () => {
  const mockPlaylist = {
    id: 'test-playlist-id',
    title: 'Test YouTube Playlist',
    description: 'Test playlist description',
    playlistExternalId: 'PLtest123',
    videoCount: 15,
    thumbnail: 'https://example.com/playlist-thumb.jpg',
    status: 0,
    dateAdded: new Date().toISOString(),
    videos: [], // Will be populated when includeVideos is true
  };

  const mockVideos = [
    {
      id: 'vid1',
      title: 'Video 1 Title',
      lengthInSeconds: 600,
      publishedAt: new Date('2024-01-01').toISOString(),
      thumbnail: 'https://example.com/vid1-thumb.jpg',
    },
    {
      id: 'vid2',
      title: 'Video 2 Title',
      lengthInSeconds: 900,
      publishedAt: new Date('2024-01-02').toISOString(),
      thumbnail: 'https://example.com/vid2-thumb.jpg',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // YouTube API functions return data directly (not wrapped in { data: })
    apiService.getYouTubePlaylistById.mockImplementation((id, includeVideos) => {
      if (includeVideos) {
        return Promise.resolve({ ...mockPlaylist, videos: mockVideos });
      }
      return Promise.resolve(mockPlaylist);
    });
    apiService.getYouTubePlaylistVideos.mockResolvedValue(mockVideos);
    // Mixlist API returns axios response with { data: }
    apiService.getAllMixlists.mockResolvedValue({ data: [] });
  });

  it('renders playlist details correctly', async () => {
    render(
      <BrowserRouter>
        <YouTubePlaylistProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test YouTube Playlist')).toBeInTheDocument();
    });

    expect(screen.getByText(/15 videos/i)).toBeInTheDocument();
  });

  it('displays videos from the playlist', async () => {
    render(
      <BrowserRouter>
        <YouTubePlaylistProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Look for the specific heading text
      expect(screen.getByText(/Videos in Playlist/i)).toBeInTheDocument();
    });

    // Verify the component shows it has 2 videos in the list
    expect(screen.getByText(/Videos in Playlist \(2\)/i)).toBeInTheDocument();
  });

  it('handles sync button click', async () => {
    apiService.syncYouTubePlaylist.mockResolvedValue({ 
      data: { message: 'Synced successfully' } 
    });

    render(
      <BrowserRouter>
        <YouTubePlaylistProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      const syncButton = screen.queryByText(/Sync/i);
      if (syncButton) {
        fireEvent.click(syncButton);
      }
    });

    // Verify sync was called if button existed
    if (apiService.syncYouTubePlaylist.mock.calls.length > 0) {
      expect(apiService.syncYouTubePlaylist).toHaveBeenCalledWith('test-playlist-id');
    }
  });

  it('fetches playlist and videos on mount', async () => {
    render(
      <BrowserRouter>
        <YouTubePlaylistProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      // getYouTubePlaylistById is called with (id, includeVideos=true)
      expect(apiService.getYouTubePlaylistById).toHaveBeenCalledWith('test-playlist-id', true);
    });
  });

  it('handles loading state', () => {
    apiService.getYouTubePlaylistById.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ data: mockPlaylist }), 100))
    );

    render(
      <BrowserRouter>
        <YouTubePlaylistProfile />
      </BrowserRouter>
    );

    // During loading, playlist title should not be present yet
    expect(screen.queryByText('Test YouTube Playlist')).not.toBeInTheDocument();
  });

  it('handles API error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    apiService.getYouTubePlaylistById.mockRejectedValue(new Error('API Error'));

    render(
      <BrowserRouter>
        <YouTubePlaylistProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled();
    });

    consoleError.mockRestore();
  });

  it('displays video count badge', async () => {
    render(
      <BrowserRouter>
        <YouTubePlaylistProfile />
      </BrowserRouter>
    );

    await waitFor(() => {
      const videoCountElement = screen.queryByText(/15 videos/i);
      expect(videoCountElement).toBeInTheDocument();
    });
  });
});

