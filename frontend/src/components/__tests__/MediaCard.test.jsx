import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import MediaCard from '../shared/MediaCard';

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('MediaCard', () => {
  const mockVideoMedia = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    title: 'Test Video',
    description: 'A test video description',
    mediaType: 'Video',
    status: 'Uncharted',
    dateAdded: '2024-01-15T10:00:00Z',
    link: 'https://youtube.com/watch?v=test',
    thumbnail: 'https://example.com/thumb.jpg',
    videoType: 'Series',
    platform: 'YouTube',
    channelName: 'Test Channel',
    lengthInSeconds: 3600,
    rating: 'Like',
    topics: ['technology', 'programming'],
    genres: ['educational', 'tutorial']
  };

  const mockVideoEpisode = {
    id: '456e7890-e89b-12d3-a456-426614174001',
    title: 'Episode 1: Introduction',
    description: 'First episode of the series',
    mediaType: 'Video',
    status: 'InProgress',
    dateAdded: '2024-01-16T10:00:00Z',
    link: 'https://youtube.com/watch?v=episode1',
    thumbnail: 'https://example.com/episode-thumb.jpg',
    videoType: 'Episode',
    parentVideoId: '123e4567-e89b-12d3-a456-426614174000',
    platform: 'YouTube',
    channelName: 'Test Channel',
    lengthInSeconds: 1800,
    rating: 'SuperLike',
    topics: ['introduction', 'basics'],
    genres: ['educational']
  };

  const mockBookMedia = {
    id: '789e1234-e89b-12d3-a456-426614174002',
    title: 'Test Book',
    description: 'A test book description',
    mediaType: 'Book',
    status: 'Completed',
    dateAdded: '2024-01-10T10:00:00Z',
    rating: 'Like',
    topics: ['fiction', 'mystery'],
    genres: ['thriller', 'crime']
  };

  describe('Video Media Display', () => {
    it('should display video series information correctly', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      expect(screen.getByText('Test Video')).toBeInTheDocument();
      expect(screen.getByText('A test video description')).toBeInTheDocument();
      expect(screen.getByText('YouTube')).toBeInTheDocument();
      expect(screen.getByText('Test Channel')).toBeInTheDocument();
      expect(screen.getByText('Series')).toBeInTheDocument();
      expect(screen.getByText('1h 0m')).toBeInTheDocument(); // 3600 seconds = 1 hour
    });

    it('should display video episode information correctly', () => {
      renderWithRouter(<MediaCard media={mockVideoEpisode} />);

      expect(screen.getByText('Episode 1: Introduction')).toBeInTheDocument();
      expect(screen.getByText('First episode of the series')).toBeInTheDocument();
      expect(screen.getByText('Episode')).toBeInTheDocument();
      expect(screen.getByText('30m')).toBeInTheDocument(); // 1800 seconds = 30 minutes
    });

    it('should show YouTube icon for video media type', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} showMediaTypeIcon={true} />);

      // The YouTube icon should be present (we can't easily test the actual icon, but we can test the container)
      const mediaTypeIcon = screen.getByTestId('media-type-icon');
      expect(mediaTypeIcon).toBeInTheDocument();
    });

    it('should not show media type icon when showMediaTypeIcon is false', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} showMediaTypeIcon={false} />);

      expect(screen.queryByTestId('media-type-icon')).not.toBeInTheDocument();
    });

    it('should display video thumbnail when provided', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      const thumbnail = screen.getByRole('img', { name: /Test Video/i });
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute('src', 'https://example.com/thumb.jpg');
    });

    it('should display default thumbnail when not provided', () => {
      const videoWithoutThumbnail = { ...mockVideoMedia, thumbnail: null };
      renderWithRouter(<MediaCard media={videoWithoutThumbnail} />);

      const thumbnail = screen.getByRole('img', { name: /Test Video/i });
      expect(thumbnail).toBeInTheDocument();
      expect(thumbnail).toHaveAttribute('src', '/default-thumbnail.jpg');
    });
  });

  describe('Video Status and Rating Display', () => {
    it('should display video status correctly', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      expect(screen.getByText('Uncharted')).toBeInTheDocument();
    });

    it('should display video rating correctly', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      // Rating should be displayed as stars or similar visual indicator
      const ratingElement = screen.getByTestId('rating-display');
      expect(ratingElement).toBeInTheDocument();
    });

    it('should display different status colors for different statuses', () => {
      const inProgressVideo = { ...mockVideoMedia, status: 'InProgress' };
      renderWithRouter(<MediaCard media={inProgressVideo} />);

      const statusChip = screen.getByText('InProgress');
      expect(statusChip).toBeInTheDocument();
      // The status chip should have appropriate styling based on status
    });
  });

  describe('Video Topics and Genres Display', () => {
    it('should display video topics as chips', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      expect(screen.getByText('technology')).toBeInTheDocument();
      expect(screen.getByText('programming')).toBeInTheDocument();
    });

    it('should display video genres as chips', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      expect(screen.getByText('educational')).toBeInTheDocument();
      expect(screen.getByText('tutorial')).toBeInTheDocument();
    });

    it('should handle empty topics and genres arrays', () => {
      const videoWithoutTopicsGenres = { 
        ...mockVideoMedia, 
        topics: [], 
        genres: [] 
      };
      renderWithRouter(<MediaCard media={videoWithoutTopicsGenres} />);

      // Should not crash and should still display other information
      expect(screen.getByText('Test Video')).toBeInTheDocument();
    });
  });

  describe('Video Duration Formatting', () => {
    it('should format duration correctly for hours and minutes', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      expect(screen.getByText('1h 0m')).toBeInTheDocument();
    });

    it('should format duration correctly for minutes only', () => {
      const shortVideo = { ...mockVideoMedia, lengthInSeconds: 1800 }; // 30 minutes
      renderWithRouter(<MediaCard media={shortVideo} />);

      expect(screen.getByText('30m')).toBeInTheDocument();
    });

    it('should format duration correctly for seconds only', () => {
      const veryShortVideo = { ...mockVideoMedia, lengthInSeconds: 45 }; // 45 seconds
      renderWithRouter(<MediaCard media={veryShortVideo} />);

      expect(screen.getByText('45s')).toBeInTheDocument();
    });

    it('should handle zero duration', () => {
      const zeroDurationVideo = { ...mockVideoMedia, lengthInSeconds: 0 };
      renderWithRouter(<MediaCard media={zeroDurationVideo} />);

      expect(screen.getByText('0s')).toBeInTheDocument();
    });

    it('should format long durations correctly', () => {
      const longVideo = { ...mockVideoMedia, lengthInSeconds: 7265 }; // 2h 1m 5s
      renderWithRouter(<MediaCard media={longVideo} />);

      expect(screen.getByText('2h 1m')).toBeInTheDocument(); // Typically seconds are omitted for long durations
    });
  });

  describe('Card Variants', () => {
    it('should render default variant correctly', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} variant="default" />);

      const card = screen.getByTestId('media-card');
      expect(card).toHaveClass('media-card-default');
    });

    it('should render compact variant correctly', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} variant="compact" />);

      const card = screen.getByTestId('media-card');
      expect(card).toHaveClass('media-card-compact');
    });

    it('should render featured variant correctly', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} variant="featured" />);

      const card = screen.getByTestId('media-card');
      expect(card).toHaveClass('media-card-featured');
    });
  });

  describe('Card Interactions', () => {
    it('should call onClick handler when card is clicked', () => {
      const mockOnClick = vi.fn();
      renderWithRouter(<MediaCard media={mockVideoMedia} onClick={mockOnClick} />);

      const card = screen.getByTestId('media-card');
      fireEvent.click(card);

      expect(mockOnClick).toHaveBeenCalledWith(mockVideoMedia);
    });

    it('should navigate to media profile when card is clicked without onClick handler', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      const card = screen.getByTestId('media-card');
      expect(card.closest('a')).toHaveAttribute('href', '/media/123e4567-e89b-12d3-a456-426614174000');
    });

    it('should prevent navigation when onClick handler is provided', () => {
      const mockOnClick = vi.fn();
      renderWithRouter(<MediaCard media={mockVideoMedia} onClick={mockOnClick} />);

      const card = screen.getByTestId('media-card');
      const clickEvent = new MouseEvent('click', { bubbles: true });
      
      // Mock preventDefault and stopPropagation
      clickEvent.preventDefault = vi.fn();
      clickEvent.stopPropagation = vi.fn();
      
      fireEvent(card, clickEvent);

      expect(mockOnClick).toHaveBeenCalled();
    });
  });

  describe('Media Type Comparison', () => {
    it('should display video media differently from book media', () => {
      const { rerender } = renderWithRouter(<MediaCard media={mockVideoMedia} />);

      // Video should show platform and channel
      expect(screen.getByText('YouTube')).toBeInTheDocument();
      expect(screen.getByText('Test Channel')).toBeInTheDocument();
      expect(screen.getByText('1h 0m')).toBeInTheDocument();

      // Rerender with book media
      rerender(
        <BrowserRouter>
          <MediaCard media={mockBookMedia} />
        </BrowserRouter>
      );

      // Book should not show platform, channel, or duration
      expect(screen.queryByText('YouTube')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Channel')).not.toBeInTheDocument();
      expect(screen.queryByText('1h 0m')).not.toBeInTheDocument();
      
      // But should show book-specific information
      expect(screen.getByText('Test Book')).toBeInTheDocument();
      expect(screen.getByText('A test book description')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper alt text for thumbnail images', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      const thumbnail = screen.getByRole('img', { name: /Test Video/i });
      expect(thumbnail).toHaveAttribute('alt', expect.stringContaining('Test Video'));
    });

    it('should have proper link accessibility', () => {
      renderWithRouter(<MediaCard media={mockVideoMedia} />);

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('aria-label', expect.stringContaining('Test Video'));
    });

    it('should have proper button accessibility when onClick is provided', () => {
      const mockOnClick = vi.fn();
      renderWithRouter(<MediaCard media={mockVideoMedia} onClick={mockOnClick} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Test Video'));
    });
  });

  describe('Error Handling', () => {
    it('should handle missing required fields gracefully', () => {
      const incompleteVideo = {
        id: '123',
        title: 'Incomplete Video',
        mediaType: 'Video'
        // Missing other fields
      };

      expect(() => {
        renderWithRouter(<MediaCard media={incompleteVideo} />);
      }).not.toThrow();

      expect(screen.getByText('Incomplete Video')).toBeInTheDocument();
    });

    it('should handle null/undefined media gracefully', () => {
      expect(() => {
        renderWithRouter(<MediaCard media={null} />);
      }).not.toThrow();
    });

    it('should handle invalid duration values', () => {
      const invalidDurationVideo = { ...mockVideoMedia, lengthInSeconds: -100 };
      
      expect(() => {
        renderWithRouter(<MediaCard media={invalidDurationVideo} />);
      }).not.toThrow();
    });
  });
});
