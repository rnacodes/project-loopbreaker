import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MediaProfilePage from '../MediaProfilePage';
import * as mediaService from '../../api/mediaService';
import * as mixlistService from '../../api/mixlistService';
import * as bookService from '../../api/bookService';
import * as movieService from '../../api/movieService';
import * as videoService from '../../api/videoService';
import * as highlightService from '../../api/highlightService';

// Mock the API services
vi.mock('../../api/mediaService');
vi.mock('../../api/mixlistService');
vi.mock('../../api/bookService');
vi.mock('../../api/movieService');
vi.mock('../../api/videoService');
vi.mock('../../api/highlightService');

// Mock child components to isolate page-level testing
vi.mock('../MediaHeader', () => ({
  default: ({ title }) => <div data-testid="media-header">{title}</div>
}));

vi.mock('../MediaInfoCard', () => ({
  default: ({ mediaItem }) => (
    <div data-testid="media-info-card">
      <span data-testid="media-type">{mediaItem.mediaType}</span>
      <span data-testid="media-status">{mediaItem.status}</span>
    </div>
  )
}));

vi.mock('../MediaDetailAccordion', () => ({
  default: () => <div data-testid="media-detail-accordion">Details</div>
}));

vi.mock('../HighlightsSection', () => ({
  default: ({ highlights }) => (
    <div data-testid="highlights-section">
      {highlights?.length || 0} highlights
    </div>
  )
}));

vi.mock('../TopicsGenresSection', () => ({
  default: ({ mediaItem }) => (
    <div data-testid="topics-genres-section">
      Topics: {mediaItem.topics?.length || 0}, Genres: {mediaItem.genres?.length || 0}
    </div>
  )
}));

vi.mock('../MixlistCarousel', () => ({
  default: ({ currentMixlists }) => (
    <div data-testid="mixlist-carousel">
      {currentMixlists?.length || 0} mixlists
    </div>
  )
}));

// Test data
const mockBook = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Book Title',
  mediaType: 'Book',
  author: 'Test Author',
  status: 'InProgress',
  dateAdded: '2024-01-15T10:00:00Z',
  description: 'A great book about testing',
  mixlistIds: [],
  topics: [{ id: '1', name: 'programming' }],
  genres: [{ id: '1', name: 'technical' }]
};

const mockMovie = {
  id: '456e7890-e89b-12d3-a456-426614174001',
  title: 'Test Movie Title',
  mediaType: 'Movie',
  director: 'Test Director',
  status: 'Completed',
  dateAdded: '2024-01-10T10:00:00Z',
  releaseYear: 2023,
  mixlistIds: ['mixlist-1'],
  topics: [],
  genres: [{ id: '1', name: 'action' }]
};

const mockVideo = {
  id: '789abcde-e89b-12d3-a456-426614174002',
  title: 'Test Video Title',
  mediaType: 'Video',
  platform: 'YouTube',
  status: 'Uncharted',
  dateAdded: '2024-01-20T10:00:00Z',
  mixlistIds: [],
  topics: [],
  genres: []
};

const mockPlaylist = {
  id: 'playlist-123',
  title: 'Test Playlist',
  mediaType: 'Playlist',
  status: 'Uncharted',
  mixlistIds: []
};

const mockChannel = {
  id: 'channel-123',
  title: 'Test Channel',
  mediaType: 'Channel',
  status: 'Uncharted',
  mixlistIds: []
};

const mockMixlists = [
  { id: 'mixlist-1', name: 'My Favorites', description: 'Best content' },
  { id: 'mixlist-2', name: 'Watch Later', description: 'To watch' }
];

const renderWithRouter = (id) => {
  return render(
    <MemoryRouter initialEntries={[`/media/${id}`]}>
      <Routes>
        <Route path="/media/:id" element={<MediaProfilePage />} />
        <Route path="/youtube-playlist/:id" element={<div data-testid="playlist-redirect">Playlist Page</div>} />
        <Route path="/youtube-channel/:id" element={<div data-testid="channel-redirect">Channel Page</div>} />
        <Route path="/all-media" element={<div data-testid="all-media">All Media</div>} />
      </Routes>
    </MemoryRouter>
  );
};

describe('MediaProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mixlistService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
  });

  describe('Loading State', () => {
    it('should display loading indicator while fetching media', async () => {
      mediaService.getMediaById.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderWithRouter('123');

      expect(screen.getByText('Loading media item...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show media ID in loading state', () => {
      mediaService.getMediaById.mockImplementation(() => new Promise(() => {}));

      renderWithRouter('test-media-id');

      expect(screen.getByText('ID: test-media-id')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display not found message when media item is null', async () => {
      mediaService.getMediaById.mockRejectedValue(new Error('Not found'));

      renderWithRouter('nonexistent-id');

      await waitFor(() => {
        expect(screen.getByText('Media item not found.')).toBeInTheDocument();
      });
    });

    it('should show back button when media not found', async () => {
      mediaService.getMediaById.mockRejectedValue(new Error('Not found'));

      renderWithRouter('nonexistent-id');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /back to all media/i })).toBeInTheDocument();
      });
    });
  });

  describe('Book Media Display', () => {
    it('should render book media item with all sections', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockBook });
      bookService.getBookById.mockResolvedValue({ data: mockBook });
      highlightService.getHighlightsByBook.mockResolvedValue([]);

      renderWithRouter(mockBook.id);

      await waitFor(() => {
        expect(screen.getByTestId('media-header')).toHaveTextContent('Test Book Title');
      });

      expect(screen.getByTestId('media-info-card')).toBeInTheDocument();
      expect(screen.getByTestId('media-type')).toHaveTextContent('Book');
      expect(screen.getByTestId('media-detail-accordion')).toBeInTheDocument();
      expect(screen.getByTestId('highlights-section')).toBeInTheDocument();
      expect(screen.getByTestId('topics-genres-section')).toBeInTheDocument();
      expect(screen.getByTestId('mixlist-carousel')).toBeInTheDocument();
    });

    it('should fetch detailed book data', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockBook });
      bookService.getBookById.mockResolvedValue({ data: { ...mockBook, isbn: '1234567890' } });
      highlightService.getHighlightsByBook.mockResolvedValue([]);

      renderWithRouter(mockBook.id);

      await waitFor(() => {
        expect(bookService.getBookById).toHaveBeenCalledWith(mockBook.id);
      });
    });
  });

  describe('Movie Media Display', () => {
    it('should render movie media item', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockMovie });
      movieService.getMovieById.mockResolvedValue({ data: mockMovie });

      renderWithRouter(mockMovie.id);

      await waitFor(() => {
        expect(screen.getByTestId('media-header')).toHaveTextContent('Test Movie Title');
        expect(screen.getByTestId('media-type')).toHaveTextContent('Movie');
      });
    });

    it('should fetch detailed movie data', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockMovie });
      movieService.getMovieById.mockResolvedValue({ data: mockMovie });

      renderWithRouter(mockMovie.id);

      await waitFor(() => {
        expect(movieService.getMovieById).toHaveBeenCalledWith(mockMovie.id);
      });
    });
  });

  describe('Video Media Display', () => {
    it('should render video media item', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockVideo });
      videoService.getVideoById.mockResolvedValue({ data: mockVideo });
      videoService.getPlaylistsForVideo.mockResolvedValue([]);

      renderWithRouter(mockVideo.id);

      await waitFor(() => {
        expect(screen.getByTestId('media-header')).toHaveTextContent('Test Video Title');
        expect(screen.getByTestId('media-type')).toHaveTextContent('Video');
      });
    });

    it('should fetch playlists for video', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockVideo });
      videoService.getVideoById.mockResolvedValue({ data: mockVideo });
      videoService.getPlaylistsForVideo.mockResolvedValue([{ id: 'pl1', name: 'Playlist 1' }]);

      renderWithRouter(mockVideo.id);

      await waitFor(() => {
        expect(videoService.getPlaylistsForVideo).toHaveBeenCalledWith(mockVideo.id);
      });
    });
  });

  describe('Media Type Redirects', () => {
    it('should redirect Playlist to YouTube playlist page', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockPlaylist });

      renderWithRouter(mockPlaylist.id);

      await waitFor(() => {
        expect(screen.getByTestId('playlist-redirect')).toBeInTheDocument();
      });
    });

    it('should redirect Channel to YouTube channel page', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockChannel });

      renderWithRouter(mockChannel.id);

      await waitFor(() => {
        expect(screen.getByTestId('channel-redirect')).toBeInTheDocument();
      });
    });
  });

  describe('Mixlist Integration', () => {
    it('should fetch and display mixlists', async () => {
      const movieWithMixlists = { ...mockMovie, mixlistIds: ['mixlist-1'] };
      mediaService.getMediaById.mockResolvedValue({ data: movieWithMixlists });
      movieService.getMovieById.mockResolvedValue({ data: movieWithMixlists });

      renderWithRouter(mockMovie.id);

      await waitFor(() => {
        expect(mixlistService.getAllMixlists).toHaveBeenCalled();
      });

      expect(screen.getByTestId('mixlist-carousel')).toBeInTheDocument();
    });
  });

  describe('API Error Handling', () => {
    it('should handle detailed book fetch failure gracefully', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockBook });
      bookService.getBookById.mockRejectedValue(new Error('Book details not found'));
      highlightService.getHighlightsByBook.mockResolvedValue([]);

      renderWithRouter(mockBook.id);

      // Should still render with basic data
      await waitFor(() => {
        expect(screen.getByTestId('media-header')).toHaveTextContent('Test Book Title');
      });
    });

    it('should handle video playlists fetch failure gracefully', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockVideo });
      videoService.getVideoById.mockResolvedValue({ data: mockVideo });
      videoService.getPlaylistsForVideo.mockRejectedValue(new Error('Failed to fetch playlists'));

      renderWithRouter(mockVideo.id);

      // Should still render without crashing
      await waitFor(() => {
        expect(screen.getByTestId('media-header')).toHaveTextContent('Test Video Title');
      });
    });

    it('should handle mixlists fetch failure gracefully', async () => {
      mediaService.getMediaById.mockResolvedValue({ data: mockBook });
      bookService.getBookById.mockResolvedValue({ data: mockBook });
      mixlistService.getAllMixlists.mockRejectedValue(new Error('Failed to fetch mixlists'));
      highlightService.getHighlightsByBook.mockResolvedValue([]);

      renderWithRouter(mockBook.id);

      // Should still render page
      await waitFor(() => {
        expect(screen.getByTestId('media-header')).toHaveTextContent('Test Book Title');
      });
    });
  });
});
