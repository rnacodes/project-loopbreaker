import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import AllMedia from '../AllMedia';
import * as apiService from '../../services/apiService';

// Mock API service
vi.mock('../../services/apiService');

describe('AllMedia', () => {
  const mockMediaItems = [
    {
      id: 'media-1',
      title: 'Test Book',
      mediaType: 'Book',
      status: 'Completed',
      dateAdded: '2024-01-15T10:00:00Z',
      thumbnailUrl: 'https://example.com/book.jpg'
    },
    {
      id: 'media-2',
      title: 'Test Video',
      mediaType: 'Video',
      status: 'InProgress',
      dateAdded: '2024-01-16T10:00:00Z',
      thumbnailUrl: 'https://example.com/video.jpg',
      lengthInSeconds: 3600
    },
    {
      id: 'media-3',
      title: 'Test Movie',
      mediaType: 'Movie',
      status: 'Uncharted',
      dateAdded: '2024-01-17T10:00:00Z',
      thumbnailUrl: 'https://example.com/movie.jpg'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should display loading spinner when fetching media', () => {
      apiService.getAllMedia.mockImplementation(() => 
        new Promise(() => {}) // Never resolves
      );

      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should hide loading spinner after data loads', async () => {
      apiService.getAllMedia.mockResolvedValue({ data: mockMediaItems });

      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      apiService.getAllMedia.mockResolvedValue({ data: mockMediaItems });
    });

    it('should display all media items', async () => {
      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Video')).toBeInTheDocument();
      expect(screen.getByText('Test Movie')).toBeInTheDocument();
    });

    it('should display media count', async () => {
      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Total Media: 3')).toBeInTheDocument();
      });
    });

    it('should call getAllMedia on mount when no mediaType filter', async () => {
      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(apiService.getAllMedia).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Media Type Filtering', () => {
    it('should call getMediaByType when mediaType param is provided', async () => {
      apiService.getMediaByType.mockResolvedValue({ data: [mockMediaItems[0]] });

      render(
        <MemoryRouter initialEntries={['/all-media?mediaType=Book']}>
          <AllMedia />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiService.getMediaByType).toHaveBeenCalledWith('Book');
      });
    });

    it('should display filtered media items', async () => {
      apiService.getMediaByType.mockResolvedValue({ data: [mockMediaItems[0]] });

      render(
        <MemoryRouter initialEntries={['/all-media?mediaType=Book']}>
          <AllMedia />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      expect(screen.queryByText('Test Video')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Movie')).not.toBeInTheDocument();
    });

    it('should update when mediaType param changes', async () => {
      apiService.getMediaByType.mockResolvedValue({ data: [mockMediaItems[1]] });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/all-media?mediaType=Book']}>
          <AllMedia />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiService.getMediaByType).toHaveBeenCalledWith('Book');
      });

      // Rerender with different mediaType
      rerender(
        <MemoryRouter initialEntries={['/all-media?mediaType=Video']}>
          <AllMedia />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiService.getMediaByType).toHaveBeenCalledWith('Video');
      });
    });
  });

  describe('View Modes', () => {
    beforeEach(() => {
      apiService.getAllMedia.mockResolvedValue({ data: mockMediaItems });
    });

    it('should default to card view mode', async () => {
      const { container } = render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      // Card view shows Grid container
      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should switch to list view when list button is clicked', async () => {
      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      // Find and click list view button
      const listViewButton = screen.getByLabelText(/list view/i);
      fireEvent.click(listViewButton);

      await waitFor(() => {
        expect(screen.getByRole('list')).toBeInTheDocument();
      });
    });
  });

  describe('Selection and Bulk Actions', () => {
    beforeEach(() => {
      apiService.getAllMedia.mockResolvedValue({ data: mockMediaItems });
    });

    it('should allow selecting individual items', async () => {
      const { container } = render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      // Find and click checkbox for first item
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      expect(checkboxes[0]).toBeChecked();
    });

    it('should display selection count when items are selected', async () => {
      const { container } = render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);
      fireEvent.click(checkboxes[1]);

      await waitFor(() => {
        expect(screen.getByText(/2 items selected/i)).toBeInTheDocument();
      });
    });

    it('should select all items when select all is clicked', async () => {
      const { container } = render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      const selectAllButton = screen.getByText(/Select All/i);
      fireEvent.click(selectAllButton);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).toBeChecked();
    });

    it('should deselect all items when deselect all is clicked', async () => {
      const { container } = render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      // First select all
      const selectAllButton = screen.getByText(/Select All/i);
      fireEvent.click(selectAllButton);

      // Then deselect all
      const deselectAllButton = screen.getByText(/Deselect All/i);
      fireEvent.click(deselectAllButton);

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });

    it('should open delete confirmation dialog when delete is clicked', async () => {
      const { container } = render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      // Select an item
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      // Click delete button
      const deleteButton = screen.getByLabelText(/delete selected/i);
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
      });
    });

    it('should call bulkDeleteMedia when deletion is confirmed', async () => {
      apiService.bulkDeleteMedia.mockResolvedValue({});

      const { container } = render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      // Select an item
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      // Click delete
      const deleteButton = screen.getByLabelText(/delete selected/i);
      fireEvent.click(deleteButton);

      // Confirm deletion
      const confirmButton = await screen.findByText(/Delete/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(apiService.bulkDeleteMedia).toHaveBeenCalled();
      });
    });
  });

  describe('Empty States', () => {
    it('should display empty state when no media items exist', async () => {
      apiService.getAllMedia.mockResolvedValue({ data: [] });

      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No media items found/i)).toBeInTheDocument();
      });
    });

    it('should display empty state message when filter returns no results', async () => {
      apiService.getMediaByType.mockResolvedValue({ data: [] });

      render(
        <MemoryRouter initialEntries={['/all-media?mediaType=Book']}>
          <AllMedia />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No media items found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when fetch fails', async () => {
      apiService.getAllMedia.mockRejectedValue(new Error('Network error'));

      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Failed to load media items/i)).toBeInTheDocument();
      });
    });

    it('should display error message with API error details', async () => {
      const apiError = new Error('API Error');
      apiError.response = { data: { error: 'Invalid request' } };
      apiService.getAllMedia.mockRejectedValue(apiError);

      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Invalid request/i)).toBeInTheDocument();
      });
    });

    it('should display snackbar error when bulk delete fails', async () => {
      apiService.getAllMedia.mockResolvedValue({ data: mockMediaItems });
      apiService.bulkDeleteMedia.mockRejectedValue(new Error('Delete failed'));

      const { container } = render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      // Select and try to delete
      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      fireEvent.click(checkboxes[0]);

      const deleteButton = screen.getByLabelText(/delete selected/i);
      fireEvent.click(deleteButton);

      const confirmButton = await screen.findByText(/Delete/i);
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to delete/i)).toBeInTheDocument();
      });
    });
  });

  describe('Export Functionality', () => {
    beforeEach(() => {
      apiService.getAllMedia.mockResolvedValue({ data: mockMediaItems });
    });

    it('should display export button', async () => {
      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      apiService.getAllMedia.mockResolvedValue({ data: mockMediaItems });
    });

    it('should have proper ARIA labels on view mode buttons', async () => {
      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/card view/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/list view/i)).toBeInTheDocument();
    });

    it('should have proper ARIA labels on action buttons', async () => {
      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book')).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('should fetch media on mount', async () => {
      apiService.getAllMedia.mockResolvedValue({ data: mockMediaItems });

      render(
        <BrowserRouter>
          <AllMedia />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(apiService.getAllMedia).toHaveBeenCalledTimes(1);
      });
    });

    it('should refetch media when URL parameters change', async () => {
      apiService.getMediaByType.mockResolvedValue({ data: mockMediaItems });

      const { rerender } = render(
        <MemoryRouter initialEntries={['/all-media']}>
          <AllMedia />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiService.getAllMedia).toHaveBeenCalled();
      });

      vi.clearAllMocks();

      rerender(
        <MemoryRouter initialEntries={['/all-media?mediaType=Book']}>
          <AllMedia />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(apiService.getMediaByType).toHaveBeenCalledWith('Book');
      });
    });
  });
});

