import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AddMediaForm from '../AddMediaForm';
import * as apiService from '../../services/apiService';

// Create mock navigate function
const mockNavigate = vi.fn();

// Mock the API service
vi.mock('../../services/apiService', () => ({
  addMedia: vi.fn(),
  addPodcastEpisode: vi.fn(),
  addPodcastSeries: vi.fn(),
  getAllMixlists: vi.fn(),
  addMediaToMixlist: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock getAllMixlists to return empty array
apiService.getAllMixlists.mockResolvedValue({ data: [] });

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('AddMediaForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    // Reset API mocks
    apiService.addMedia.mockResolvedValue({ data: { id: 1 } });
    apiService.addPodcastEpisode.mockResolvedValue({ data: { id: 1 } });
    apiService.addMediaToMixlist.mockResolvedValue({ data: {} });
  });

  describe('Form Submission - Regular Media', () => {
    it('should submit regular media form with all properties and save to database', async () => {
      renderWithRouter(<AddMediaForm />);

      // Fill in all form fields
      fireEvent.change(screen.getByPlaceholderText('Enter media title...'), {
        target: { value: 'Test Media Title' }
      });

      // Select media type
      const mediaTypeSelect = screen.getByLabelText('Media Type');
      fireEvent.mouseDown(mediaTypeSelect);
      fireEvent.click(screen.getByText('Book'));

      // Fill in link
      fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
        target: { value: 'https://example.com/test' }
      });

      // Fill in description
      fireEvent.change(screen.getByPlaceholderText('Brief description of the media...'), {
        target: { value: 'Test description' }
      });

      // Select status
      fireEvent.click(screen.getByLabelText('Completed'));

      // Fill in date completed
      fireEvent.change(screen.getByLabelText('Date Completed'), {
        target: { value: '2024-01-15' }
      });

      // Select rating
      const ratingSelect = screen.getByLabelText('Rating');
      fireEvent.mouseDown(ratingSelect);
      fireEvent.click(screen.getByText('Like'));

      // Select ownership status
      const ownershipSelect = screen.getByLabelText('Ownership Status');
      fireEvent.mouseDown(ownershipSelect);
      fireEvent.click(screen.getByText('Own'));

      // Fill in thumbnail URL
      fireEvent.change(screen.getByPlaceholderText('https://example.com/thumbnail.jpg'), {
        target: { value: 'https://example.com/thumb.jpg' }
      });

      // Add genres
      const genreInput = screen.getByPlaceholderText('Type a genre and press Enter...');
      fireEvent.change(genreInput, { target: { value: 'Fiction' } });
      fireEvent.keyPress(genreInput, { key: 'Enter', code: 'Enter' });
      fireEvent.change(genreInput, { target: { value: 'Mystery' } });
      fireEvent.keyPress(genreInput, { key: 'Enter', code: 'Enter' });

      // Add topics
      const topicInput = screen.getByPlaceholderText('Type a topic and press Enter...');
      fireEvent.change(topicInput, { target: { value: 'Crime' } });
      fireEvent.keyPress(topicInput, { key: 'Enter', code: 'Enter' });
      fireEvent.change(topicInput, { target: { value: 'Detective' } });
      fireEvent.keyPress(topicInput, { key: 'Enter', code: 'Enter' });

      // Fill in notes
      fireEvent.change(screen.getByPlaceholderText('Add any notes or thoughts about this media...'), {
        target: { value: 'Test notes about the media' }
      });

      // Submit form
      fireEvent.click(screen.getByText('Save Media'));

      // Verify API call with correct data structure
      await waitFor(() => {
        expect(apiService.addMedia).toHaveBeenCalledWith({
          Title: 'Test Media Title',
          MediaType: 'Book',
          Status: 'Completed',
          Topics: ['Crime', 'Detective'],
          Genres: ['Fiction', 'Mystery'],
          Link: 'https://example.com/test',
          Description: 'Test description',
          DateCompleted: '2024-01-15',
          Rating: 'Like',
          OwnershipStatus: 'Own',
          Thumbnail: 'https://example.com/thumb.jpg',
          Notes: 'Test notes about the media'
        });
      });
    });

    it('should handle required field validation', async () => {
      renderWithRouter(<AddMediaForm />);

      // Try to submit without required fields
      fireEvent.click(screen.getByText('Save Media'));

      // Should show validation error for title
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });
    });

    it('should handle media type validation', async () => {
      renderWithRouter(<AddMediaForm />);

      // Fill title but not media type
      fireEvent.change(screen.getByPlaceholderText('Enter media title...'), {
        target: { value: 'Test Title' }
      });

      // Try to submit
      fireEvent.click(screen.getByText('Save Media'));

      // Should show validation error for media type
      await waitFor(() => {
        expect(screen.getByText('Media Type is required')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission - Podcast Episode', () => {
    it('should submit podcast episode form with all properties and save to database', async () => {
      renderWithRouter(<AddMediaForm />);

      // Fill in basic fields
      fireEvent.change(screen.getByPlaceholderText('Enter media title...'), {
        target: { value: 'Test Podcast Episode' }
      });

      // Select Podcast media type
      const mediaTypeSelect = screen.getByLabelText('Media Type');
      fireEvent.mouseDown(mediaTypeSelect);
      fireEvent.click(screen.getByText('Podcast'));

      // Select Episode podcast type
      fireEvent.click(screen.getByLabelText('Episode'));

      // Fill in podcast-specific fields
      fireEvent.change(screen.getByLabelText('Podcast Series'), {
        target: { value: '123' }
      });

      fireEvent.change(screen.getByLabelText('Duration (Minutes)'), {
        target: { value: '45' }
      });

      // Fill in other required fields
      fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
        target: { value: 'https://example.com/episode' }
      });

      fireEvent.change(screen.getByPlaceholderText('Brief description of the media...'), {
        target: { value: 'Episode description' }
      });

      fireEvent.click(screen.getByLabelText('Completed'));

      fireEvent.change(screen.getByLabelText('Date Completed'), {
        target: { value: '2024-01-15' }
      });

      // Add genres and topics
      const genreInput = screen.getByPlaceholderText('Type a genre and press Enter...');
      fireEvent.change(genreInput, { target: { value: 'Technology' } });
      fireEvent.keyPress(genreInput, { key: 'Enter', code: 'Enter' });

      const topicInput = screen.getByPlaceholderText('Type a topic and press Enter...');
      fireEvent.change(topicInput, { target: { value: 'AI' } });
      fireEvent.keyPress(topicInput, { key: 'Enter', code: 'Enter' });

      // Submit form
      fireEvent.click(screen.getByText('Save Media'));

      // Verify podcast episode API call with correct data structure
      await waitFor(() => {
        expect(apiService.addPodcastEpisode).toHaveBeenCalledWith({
          Title: 'Test Podcast Episode',
          Link: 'https://example.com/episode',
          Notes: '',
          Description: 'Episode description',
          Status: 'Completed',
          DateCompleted: '2024-01-15',
          Rating: '',
          OwnershipStatus: '',
          Topics: ['AI'],
          Genres: ['Technology'],
          RelatedNotes: '',
          Thumbnail: '',
          PodcastSeriesId: '123',
          AudioLink: null,
          ReleaseDate: null,
          DurationInSeconds: 2700
        });
      });
    });
  });

  describe('Form Submission - Podcast Series', () => {
    it('should submit podcast series form and save to database', async () => {
      renderWithRouter(<AddMediaForm />);

      // Fill in basic fields
      fireEvent.change(screen.getByPlaceholderText('Enter media title...'), {
        target: { value: 'Test Podcast Series' }
      });

      // Select Podcast media type
      const mediaTypeSelect = screen.getByLabelText('Media Type');
      fireEvent.mouseDown(mediaTypeSelect);
      fireEvent.click(screen.getByText('Podcast'));

      // Select Series podcast type
      fireEvent.click(screen.getByLabelText('Series'));

      // Fill in other required fields
      fireEvent.change(screen.getByPlaceholderText('https://example.com'), {
        target: { value: 'https://example.com/series' }
      });

      // Add genres and topics
      const genreInput = screen.getByPlaceholderText('Type a genre and press Enter...');
      fireEvent.change(genreInput, { target: { value: 'Technology' } });
      fireEvent.keyPress(genreInput, { key: 'Enter', code: 'Enter' });

      const topicInput = screen.getByPlaceholderText('Type a topic and press Enter...');
      fireEvent.change(topicInput, { target: { value: 'Programming' } });
      fireEvent.keyPress(topicInput, { key: 'Enter', code: 'Enter' });

      // Submit form
      fireEvent.click(screen.getByText('Save Media'));

      // Verify regular media API call for series
      await waitFor(() => {
        expect(apiService.addMedia).toHaveBeenCalledWith({
          Title: 'Test Podcast Series',
          MediaType: 'Podcast',
          Status: 'Uncharted',
          Topics: ['Programming'],
          Genres: ['Technology'],
          Link: 'https://example.com/series'
        });
      });
    });
  });

  describe('Mixlist Integration', () => {
    it('should add media to selected mixlists after creation', async () => {
      // Mock mixlists data
      const mockMixlists = [
        { Id: 1, Name: 'Test Mixlist 1' },
        { Id: 2, Name: 'Test Mixlist 2' }
      ];
      apiService.getAllMixlists.mockResolvedValue({ data: mockMixlists });

      renderWithRouter(<AddMediaForm />);

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('Enter media title...'), {
        target: { value: 'Test Media' }
      });

      const mediaTypeSelect = screen.getByLabelText('Media Type');
      fireEvent.mouseDown(mediaTypeSelect);
      fireEvent.click(screen.getByText('Book'));

      // Add genres and topics
      const genreInput = screen.getByPlaceholderText('Type a genre and press Enter...');
      fireEvent.change(genreInput, { target: { value: 'Fiction' } });
      fireEvent.keyPress(genreInput, { key: 'Enter', code: 'Enter' });

      const topicInput = screen.getByPlaceholderText('Type a topic and press Enter...');
      fireEvent.change(topicInput, { target: { value: 'Adventure' } });
      fireEvent.keyPress(topicInput, { key: 'Enter', code: 'Enter' });

      // Select mixlists
      const mixlistInput = screen.getByPlaceholderText('Type to search mixlists...');
      fireEvent.change(mixlistInput, { target: { value: 'Test Mixlist 1' } });
      fireEvent.keyPress(mixlistInput, { key: 'Enter', code: 'Enter' });

      fireEvent.change(mixlistInput, { target: { value: 'Test Mixlist 2' } });
      fireEvent.keyPress(mixlistInput, { key: 'Enter', code: 'Enter' });

      // Submit form
      fireEvent.click(screen.getByText('Save Media'));

      // Verify media creation and mixlist addition
      await waitFor(() => {
        expect(apiService.addMedia).toHaveBeenCalled();
        expect(apiService.addMediaToMixlist).toHaveBeenCalledWith(1, 1);
        expect(apiService.addMediaToMixlist).toHaveBeenCalledWith(2, 1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      apiService.addMedia.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Validation failed' }
        }
      });

      renderWithRouter(<AddMediaForm />);

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('Enter media title...'), {
        target: { value: 'Test Media' }
      });

      const mediaTypeSelect = screen.getByLabelText('Media Type');
      fireEvent.mouseDown(mediaTypeSelect);
      fireEvent.click(screen.getByText('Book'));

      // Add genres and topics
      const genreInput = screen.getByPlaceholderText('Type a genre and press Enter...');
      fireEvent.change(genreInput, { target: { value: 'Fiction' } });
      fireEvent.keyPress(genreInput, { key: 'Enter', code: 'Enter' });

      const topicInput = screen.getByPlaceholderText('Type a topic and press Enter...');
      fireEvent.change(topicInput, { target: { value: 'Adventure' } });
      fireEvent.keyPress(topicInput, { key: 'Enter', code: 'Enter' });

      // Submit form
      fireEvent.click(screen.getByText('Save Media'));

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByText(/Failed to add media/)).toBeInTheDocument();
      });
    });
  });
});
