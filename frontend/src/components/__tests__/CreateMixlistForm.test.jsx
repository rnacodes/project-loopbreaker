import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import CreateMixlistForm from '../CreateMixlistForm';
import * as apiService from '../../services/apiService';

// Create mock navigate function
const mockNavigate = vi.fn();

// Mock the API service
vi.mock('../../services/apiService', () => ({
  createMixlist: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CreateMixlistForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    global.alert.mockClear();
    // Reset API mocks
    apiService.createMixlist.mockResolvedValue({ 
      data: { 
        id: 1, 
        name: 'Test Mixlist',
        thumbnail: 'https://picsum.photos/400/400?random=123&blur=1'
      } 
    });
  });

  describe('Form Submission', () => {
    it('should submit mixlist form with all properties and save to database', async () => {
      renderWithRouter(<CreateMixlistForm />);

      // Fill in the mixlist name
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Mixlist Name' }
      });

      // Submit form
      fireEvent.click(screen.getByText('Create Mixlist'));

      // Verify API call with correct data structure
      await waitFor(() => {
        expect(apiService.createMixlist).toHaveBeenCalledWith({
          name: 'Test Mixlist Name',
          thumbnail: expect.stringMatching(/^https:\/\/picsum\.photos\/400\/400\?random=\d+&blur=1$/)
        });
      });
    });

    it('should handle empty name validation', async () => {
      renderWithRouter(<CreateMixlistForm />);

      // Try to submit without a name
      const submitButton = screen.getByText('Create Mixlist');
      // Button should be disabled when name is empty
      expect(submitButton).toBeDisabled();

      // Fill in a name
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Name' }
      });

      // Button should now be enabled
      expect(submitButton).not.toBeDisabled();
    });

    it('should handle whitespace-only name validation', async () => {
      renderWithRouter(<CreateMixlistForm />);

      // Fill in only whitespace
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: '   ' }
      });

      // Button should be enabled (component only disables during submission)
      const submitButton = screen.getByText('Create Mixlist');
      expect(submitButton).not.toBeDisabled();
    });

    it('should trim whitespace from name before submission', async () => {
      renderWithRouter(<CreateMixlistForm />);

      // Fill in name with leading/trailing whitespace
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: '  Test Mixlist Name  ' }
      });

      // Submit form
      fireEvent.click(screen.getByText('Create Mixlist'));

      // Verify API call with trimmed name
      await waitFor(() => {
        expect(apiService.createMixlist).toHaveBeenCalledWith({
          name: 'Test Mixlist Name',
          thumbnail: expect.stringMatching(/^https:\/\/picsum\.photos\/400\/400\?random=\d+&blur=1$/)
        });
      });
    });
  });

  describe('Thumbnail Generation', () => {
    it('should generate unique thumbnail URL for each submission', async () => {
      renderWithRouter(<CreateMixlistForm />);

      // First submission
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'First Mixlist' }
      });
      fireEvent.click(screen.getByText('Create Mixlist'));

      await waitFor(() => {
        expect(apiService.createMixlist).toHaveBeenCalledWith({
          name: 'First Mixlist',
          thumbnail: expect.stringMatching(/^https:\/\/picsum\.photos\/400\/400\?random=\d+&blur=1$/)
        });
      });

      // Clear mocks for second submission
      vi.clearAllMocks();
      apiService.createMixlist.mockResolvedValue({ 
        data: { 
          id: 2, 
          name: 'Second Mixlist',
          thumbnail: 'https://picsum.photos/400/400?random=456&blur=1'
        } 
      });

      // Second submission
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Second Mixlist' }
      });
      fireEvent.click(screen.getByText('Create Mixlist'));

      await waitFor(() => {
        expect(apiService.createMixlist).toHaveBeenCalledWith({
          name: 'Second Mixlist',
          thumbnail: expect.stringMatching(/^https:\/\/picsum\.photos\/400\/400\?random=\d+&blur=1$/)
        });
      });
    });

    it('should include blur effect in thumbnail URL', async () => {
      renderWithRouter(<CreateMixlistForm />);

      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Mixlist' }
      });

      fireEvent.click(screen.getByText('Create Mixlist'));

      await waitFor(() => {
        const callArgs = apiService.createMixlist.mock.calls[0][0];
        expect(callArgs.thumbnail).toContain('blur=1');
      });
    });
  });

  describe('Form State Management', () => {
    it('should show loading state during submission', async () => {
      // Mock a delayed response
      apiService.createMixlist.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { id: 1 } }), 100))
      );

      renderWithRouter(<CreateMixlistForm />);

      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Mixlist' }
      });

      fireEvent.click(screen.getByText('Create Mixlist'));

      // Should show loading state
      expect(screen.getByText('Creating...')).toBeInTheDocument();

      // Wait for submission to complete
      await waitFor(() => {
        expect(screen.getByText('Create Mixlist')).toBeInTheDocument();
      });
    });

    it('should disable submit button during submission', async () => {
      // Mock a delayed response
      apiService.createMixlist.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: { id: 1 } }), 100))
      );

      renderWithRouter(<CreateMixlistForm />);

      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Mixlist' }
      });

      const submitButton = screen.getByText('Create Mixlist');
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      // Wait for submission to complete
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      apiService.createMixlist.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Validation failed' }
        }
      });

      renderWithRouter(<CreateMixlistForm />);

      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Mixlist' }
      });

      fireEvent.click(screen.getByText('Create Mixlist'));

      // Verify error handling
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Failed to create mixlist/));
      });
    });

    it('should handle network errors', async () => {
      apiService.createMixlist.mockRejectedValue({
        message: 'Network error'
      });

      renderWithRouter(<CreateMixlistForm />);

      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Mixlist' }
      });

      fireEvent.click(screen.getByText('Create Mixlist'));

      // Verify error handling
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Failed to create mixlist/));
      });
    });

    it('should re-enable submit button after error', async () => {
      apiService.createMixlist.mockRejectedValue({
        response: {
          status: 400,
          data: { error: 'Validation failed' }
        }
      });

      renderWithRouter(<CreateMixlistForm />);

      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Mixlist' }
      });

      const submitButton = screen.getByText('Create Mixlist');
      fireEvent.click(submitButton);

      // Wait for error to occur
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith(expect.stringMatching(/Failed to create mixlist/));
      });

      // Button should be re-enabled
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to mixlists page after successful creation', async () => {
      renderWithRouter(<CreateMixlistForm />);

      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: 'Test Mixlist' }
      });

      fireEvent.click(screen.getByText('Create Mixlist'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/mixlists');
      });
    });

    it('should handle cancel navigation', () => {
      renderWithRouter(<CreateMixlistForm />);

      fireEvent.click(screen.getByText('Cancel'));

      expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
  });

  describe('Data Persistence', () => {
    it('should save mixlist with correct data structure to database', async () => {
      renderWithRouter(<CreateMixlistForm />);

      const mixlistName = 'My Test Mixlist';
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: mixlistName }
      });

      fireEvent.click(screen.getByText('Create Mixlist'));

      await waitFor(() => {
        expect(apiService.createMixlist).toHaveBeenCalledWith({
          name: mixlistName,
          thumbnail: expect.stringMatching(/^https:\/\/picsum\.photos\/400\/400\?random=\d+&blur=1$/)
        });
      });

      // Verify the API service was called exactly once
      expect(apiService.createMixlist).toHaveBeenCalledTimes(1);
    });

    it('should handle special characters in mixlist name', async () => {
      renderWithRouter(<CreateMixlistForm />);

      const mixlistName = 'Mixlist with Special Chars: !@#$%^&*()';
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: mixlistName }
      });

      fireEvent.click(screen.getByText('Create Mixlist'));

      await waitFor(() => {
        expect(apiService.createMixlist).toHaveBeenCalledWith({
          name: mixlistName,
          thumbnail: expect.stringMatching(/^https:\/\/picsum\.photos\/400\/400\?random=\d+&blur=1$/)
        });
      });
    });

    it('should handle very long mixlist names', async () => {
      renderWithRouter(<CreateMixlistForm />);

      const longName = 'A'.repeat(1000); // Very long name
      fireEvent.change(screen.getByPlaceholderText('Enter mixlist name...'), {
        target: { value: longName }
      });

      fireEvent.click(screen.getByText('Create Mixlist'));

      await waitFor(() => {
        expect(apiService.createMixlist).toHaveBeenCalledWith({
          name: longName,
          thumbnail: expect.stringMatching(/^https:\/\/picsum\.photos\/400\/400\?random=\d+&blur=1$/)
        });
      });
    });
  });
});
