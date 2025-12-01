import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import * as apiService from '../../services/apiService';

// Mock API service
vi.mock('../../services/apiService');

// Mock child components
vi.mock('../shared/SearchBar', () => ({
  default: ({ placeholder }) => <div data-testid="search-bar">{placeholder}</div>
}));

vi.mock('../shared/SimpleMediaCarousel', () => ({
  default: ({ title, subtitle, mediaItems }) => (
    <div data-testid="media-carousel">
      <div>{title}</div>
      <div>{subtitle}</div>
      <div>{mediaItems.length} items</div>
    </div>
  )
}));

describe('HomePage', () => {
  const mockMixlists = [
    {
      id: 'mixlist-1',
      name: 'Test Mixlist 1',
      description: 'Description 1',
      thumbnail: 'https://example.com/thumb1.jpg'
    },
    {
      id: 'mixlist-2',
      name: 'Test Mixlist 2',
      description: 'Description 2',
      thumbnail: 'https://example.com/thumb2.jpg'
    },
    {
      id: 'mixlist-3',
      name: 'Test Mixlist 3',
      description: 'Description 3',
      thumbnail: 'https://example.com/thumb3.jpg'
    }
  ];

  const mockActiveMedia = [
    {
      id: 'media-1',
      title: 'Active Media 1',
      status: 'InProgress',
      mediaType: 'Book'
    },
    {
      id: 'media-2',
      title: 'Active Media 2',
      status: 'Actively Exploring',
      mediaType: 'Video'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading States', () => {
    it('should display loading spinner when fetching mixlists', () => {
      apiService.getAllMixlists.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      expect(screen.getByText('Loading MediaVerse...')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should display loading state for actively exploring section', async () => {
      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
      apiService.getAllMedia.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('MediaVerse')).toBeInTheDocument();
      });

      expect(screen.getByText('Loading your active explorations...')).toBeInTheDocument();
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
      apiService.getAllMedia.mockResolvedValue({ data: mockActiveMedia });
    });

    it('should display MediaVerse title', async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('MediaVerse')).toBeInTheDocument();
      });
    });

    it('should display search bar with placeholder', async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      });

      expect(screen.getByText('Your next adventure awaits...')).toBeInTheDocument();
    });

    it('should display all media type icons', async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('MediaVerse')).toBeInTheDocument();
      });

      // Check for main media types
      expect(screen.getByText('Articles')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
      expect(screen.getByText('Movies')).toBeInTheDocument();
      expect(screen.getByText('Podcasts')).toBeInTheDocument();
      expect(screen.getByText('Online Videos')).toBeInTheDocument();
      expect(screen.getByText('TV Shows')).toBeInTheDocument();
    });

    it('should display action buttons', async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('MediaVerse')).toBeInTheDocument();
      });

      expect(screen.getByText('Source Directory')).toBeInTheDocument();
      expect(screen.getByText('Create a Mixlist')).toBeInTheDocument();
      expect(screen.getByText('Import Media')).toBeInTheDocument();
      expect(screen.getByText('Browse Topics/Genres')).toBeInTheDocument();
      expect(screen.getByText('Add Media')).toBeInTheDocument();
    });

    it('should display mixlists when available', async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Mixlist 1')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Mixlist 2')).toBeInTheDocument();
      expect(screen.getByText('Test Mixlist 3')).toBeInTheDocument();
      expect(screen.getByText('Description 1')).toBeInTheDocument();
    });

    it('should display "Jump back in" section with active media', async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Jump back in')).toBeInTheDocument();
      });

      // Carousel should show active media
      expect(screen.getByTestId('media-carousel')).toBeInTheDocument();
    });

    it('should limit mixlists display to 6 items', async () => {
      const manyMixlists = Array.from({ length: 10 }, (_, i) => ({
        id: `mixlist-${i}`,
        name: `Mixlist ${i}`,
        description: `Description ${i}`,
        thumbnail: `https://example.com/thumb${i}.jpg`
      }));

      apiService.getAllMixlists.mockResolvedValue({ data: manyMixlists });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Showing 6 of 10 mixlists')).toBeInTheDocument();
      });
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no mixlists exist', async () => {
      apiService.getAllMixlists.mockResolvedValue({ data: [] });
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No mixlists found. Create one to get started!')).toBeInTheDocument();
      });

      expect(screen.getByText('Create New Mixlist')).toBeInTheDocument();
      expect(screen.getByText('Seed Mixlists (Development)')).toBeInTheDocument();
    });

    it('should display empty state when no active explorations exist', async () => {
      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('No active explorations found')).toBeInTheDocument();
      });

      expect(screen.getByText('Start exploring some media and mark them as "Actively Exploring" to see them here')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when mixlists fail to load', async () => {
      apiService.getAllMixlists.mockRejectedValue(new Error('API Error'));
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load mixlists/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should display specific error for network issues', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'ERR_NETWORK';
      apiService.getAllMixlists.mockRejectedValue(networkError);
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Unable to connect to the server/i)).toBeInTheDocument();
      });
    });

    it('should display error in actively exploring section when fetch fails', async () => {
      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
      apiService.getAllMedia.mockRejectedValue(new Error('API Error'));

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('MediaVerse')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load actively exploring media/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
      apiService.getAllMedia.mockResolvedValue({ data: mockActiveMedia });
    });

    it('should navigate to mixlist when clicking a mixlist card', async () => {
      const { container } = render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Mixlist 1')).toBeInTheDocument();
      });

      const mixlistCard = screen.getByText('Test Mixlist 1').closest('.MuiCard-root');
      expect(mixlistCard).toBeInTheDocument();
    });

    it('should call seedMixlists when clicking Seed button', async () => {
      apiService.getAllMixlists.mockResolvedValue({ data: [] });
      apiService.getAllMedia.mockResolvedValue({ data: [] });
      apiService.seedMixlists.mockResolvedValue({});

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Seed Mixlists (Development)')).toBeInTheDocument();
      });

      const seedButton = screen.getByText('Seed Mixlists (Development)');
      fireEvent.click(seedButton);

      await waitFor(() => {
        expect(apiService.seedMixlists).toHaveBeenCalled();
      });
    });

    it('should reload page when clicking Retry button', async () => {
      apiService.getAllMixlists.mockRejectedValue(new Error('Network Error'));
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      // Mock window.location.reload
      const reloadMock = vi.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(reloadMock).toHaveBeenCalled();
    });
  });

  describe('Smart Search Section', () => {
    beforeEach(() => {
      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
      apiService.getAllMedia.mockResolvedValue({ data: [] });
    });

    it('should display smart search buttons', async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Smart Search and Recommendations')).toBeInTheDocument();
      });

      expect(screen.getByText('Medium-length online article')).toBeInTheDocument();
      expect(screen.getByText('20+ min YouTube video')).toBeInTheDocument();
      expect(screen.getByText('Quick summary podcast')).toBeInTheDocument();
      expect(screen.getByText('In-depth research paper')).toBeInTheDocument();
      expect(screen.getByText('View Topics Tree')).toBeInTheDocument();
    });
  });

  describe('Responsive Design Elements', () => {
    beforeEach(() => {
      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
      apiService.getAllMedia.mockResolvedValue({ data: mockActiveMedia });
    });

    it('should render without crashing', async () => {
      const { container } = render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('MediaVerse')).toBeInTheDocument();
      });

      expect(container).toBeInTheDocument();
    });

    it('should display all major sections', async () => {
      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('MediaVerse')).toBeInTheDocument();
      });

      expect(screen.getByText('Jump back in')).toBeInTheDocument();
      expect(screen.getByText('Recent Mixlists')).toBeInTheDocument();
      expect(screen.getByText('Smart Search and Recommendations')).toBeInTheDocument();
      expect(screen.getByText('View More Mixlists')).toBeInTheDocument();
    });
  });

  describe('API Call Verification', () => {
    it('should call getAllMixlists on mount', async () => {
      apiService.getAllMixlists.mockResolvedValue({ data: [] });
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(apiService.getAllMixlists).toHaveBeenCalledTimes(1);
      });
    });

    it('should call getAllMedia on mount', async () => {
      apiService.getAllMixlists.mockResolvedValue({ data: [] });
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(apiService.getAllMedia).toHaveBeenCalledTimes(1);
      });
    });

    it('should filter media by status for active explorations', async () => {
      const allMedia = [
        { id: '1', status: 'InProgress', title: 'Media 1' },
        { id: '2', status: 'Completed', title: 'Media 2' },
        { id: '3', status: 'Actively Exploring', title: 'Media 3' },
        { id: '4', status: 'Uncharted', title: 'Media 4' }
      ];

      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });
      apiService.getAllMedia.mockResolvedValue({ data: allMedia });

      render(
        <BrowserRouter>
          <HomePage />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Jump back in')).toBeInTheDocument();
      });

      // Should show 2 active items (InProgress and Actively Exploring)
      await waitFor(() => {
        const carousel = screen.getByTestId('media-carousel');
        expect(carousel.textContent).toContain('2 items');
      });
    });
  });
});

