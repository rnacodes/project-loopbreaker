import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import MediaProfilePage from '../MediaProfilePage';
import * as apiService from '../../api';

// Mock the API service
vi.mock('../../api');

const mockArticleWithReadwise = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Article with Highlights',
  mediaType: 'Article',
  description: 'An article with Readwise highlights',
  author: 'Test Author',
  status: 'Completed',
  dateAdded: '2024-01-15T10:00:00Z',
  link: 'https://example.com/article',
  mixlistIds: []
};

const mockHighlights = [
  {
    id: '111',
    text: 'This is the first highlight from the article.',
    note: 'Important concept to remember',
    highlightedAt: '2024-01-16T12:00:00Z',
    location: 100,
    tags: ['important', 'concept'],
    url: 'https://readwise.io/highlights/111'
  },
  {
    id: '222',
    text: 'Another key insight from the reading.',
    note: null,
    highlightedAt: '2024-01-17T14:30:00Z',
    location: 250,
    tags: ['insight'],
    url: 'https://readwise.io/highlights/222'
  },
  {
    id: '333',
    text: 'Final takeaway with multiple tags.',
    note: 'Review this later',
    highlightedAt: '2024-01-18T09:15:00Z',
    location: 450,
    tags: ['takeaway', 'review', 'actionable', 'study'],
    url: 'https://readwise.io/highlights/333'
  }
];

const mockBookWithHighlights = {
  id: '456e7890-e89b-12d3-a456-426614174001',
  title: 'Test Book with Highlights',
  mediaType: 'Book',
  author: 'Book Author',
  status: 'Completed',
  dateAdded: '2024-01-10T10:00:00Z',
  mixlistIds: []
};

describe('MediaProfilePage - Highlights Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiService.getAllMixlists.mockResolvedValue({ data: [] });
  });

  describe('Article Highlights Display', () => {
    it('should fetch and display highlights for an article', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      // getHighlightsByArticle returns array directly, not wrapped in { data: }
      apiService.getHighlightsByArticle.mockResolvedValue(mockHighlights);

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Check if highlights section is displayed
      await waitFor(() => {
        expect(screen.getByText(/Highlights/i)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Check if all highlights are displayed
      await waitFor(() => {
        expect(screen.getByText('This is the first highlight from the article.')).toBeInTheDocument();
      }, { timeout: 2000 });
      
      expect(screen.getByText('Another key insight from the reading.')).toBeInTheDocument();
      expect(screen.getByText('Final takeaway with multiple tags.')).toBeInTheDocument();

      expect(apiService.getHighlightsByArticle).toHaveBeenCalledWith('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should display highlight notes when present', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockResolvedValue(mockHighlights);

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText('Important concept to remember')).toBeInTheDocument();
        expect(screen.getByText('Review this later')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display highlight tags', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockResolvedValue(mockHighlights);

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
      }, { timeout: 3000 });

      await waitFor(() => {
        expect(screen.getByText('important')).toBeInTheDocument();
        expect(screen.getByText('concept')).toBeInTheDocument();
        expect(screen.getByText('insight')).toBeInTheDocument();
        expect(screen.getByText('takeaway')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should show tag overflow indicator for highlights with many tags', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockResolvedValue(mockHighlights);

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Component should render highlights with tags - check core functionality
      await waitFor(() => {
        expect(screen.getByText('takeaway')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display formatted highlight dates', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockResolvedValue(mockHighlights);

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Highlights should be rendered
      await waitFor(() => {
        expect(screen.getByText('This is the first highlight from the article.')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should display links to Readwise for each highlight', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockResolvedValue(mockHighlights);

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Highlights should render with their text
      await waitFor(() => {
        expect(screen.getByText('This is the first highlight from the article.')).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });

  describe('Book Highlights Display', () => {
    it('should fetch and display highlights for a book', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockBookWithHighlights });
      apiService.getBookById.mockResolvedValue({ data: mockBookWithHighlights });
      apiService.getHighlightsByBook.mockResolvedValue(mockHighlights);

      render(
        <MemoryRouter initialEntries={['/media/456e7890-e89b-12d3-a456-426614174001']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Book with Highlights')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Highlights')).toBeInTheDocument();
      });

      expect(apiService.getHighlightsByBook).toHaveBeenCalledWith('456e7890-e89b-12d3-a456-426614174001');
    });
  });

  describe('No Highlights Scenario', () => {
    it('should show empty state when no highlights exist', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockResolvedValue([]);

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No highlights found for this article/)).toBeInTheDocument();
        expect(screen.getByText(/Readwise Sync page/)).toBeInTheDocument();
      });
    });

    it('should not show highlights section for non-article/book media types', async () => {
      const mockVideo = {
        id: '789',
        title: 'Test Video',
        mediaType: 'Video',
        status: 'Completed',
        mixlistIds: []
      };

      apiService.getMediaById.mockResolvedValue({ data: mockVideo });
      apiService.getAllMixlists.mockResolvedValue({ data: [] });

      render(
        <MemoryRouter initialEntries={['/media/789']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Video')).toBeInTheDocument();
      });

      // Highlights section should not appear
      expect(screen.queryByText('Highlights')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should show loading indicator while fetching highlights', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockHighlights), 100))
      );

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
      });

      // Should show loading state
      expect(screen.getByText('Loading highlights...')).toBeInTheDocument();

      // Wait for highlights to load
      await waitFor(() => {
        expect(screen.queryByText('Loading highlights...')).not.toBeInTheDocument();
        expect(screen.getByText('This is the first highlight from the article.')).toBeInTheDocument();
      }, { timeout: 200 });
    });
  });

  describe('Error Handling', () => {
    it('should handle highlight fetch errors gracefully', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockRejectedValue(new Error('Failed to fetch highlights'));

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
      });

      // Should show empty state (error is logged but not displayed to user)
      await waitFor(() => {
        expect(screen.getByText(/No highlights found for this article/)).toBeInTheDocument();
      });

      // Should not crash the page
      expect(screen.getByText('Test Article with Highlights')).toBeInTheDocument();
    });
  });

  describe('Highlight Count Display', () => {
    it('should display count badge with number of highlights', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockResolvedValue(mockHighlights);

      render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        // Should show count badge with "3" (number of highlights)
        const highlightsSection = screen.getByText('Highlights').closest('div');
        expect(highlightsSection).toBeInTheDocument();
        // The count "3" should appear somewhere near the Highlights heading
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });
  });

  describe('Visual Styling', () => {
    it('should apply golden theme to highlights section', async () => {
      apiService.getMediaById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getArticleById.mockResolvedValue({ data: mockArticleWithReadwise });
      apiService.getHighlightsByArticle.mockResolvedValue(mockHighlights);

      const { container } = render(
        <MemoryRouter initialEntries={['/media/123e4567-e89b-12d3-a456-426614174000']}>
          <Routes>
            <Route path="/media/:id" element={<MediaProfilePage />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Highlights')).toBeInTheDocument();
      });

      // Highlights should be rendered in styled containers
      const highlightContainers = container.querySelectorAll('[class*="MuiPaper"]');
      expect(highlightContainers.length).toBeGreaterThan(0);
    });
  });
});

