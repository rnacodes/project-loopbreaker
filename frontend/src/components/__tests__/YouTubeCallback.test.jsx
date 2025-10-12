import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import YouTubeCallback from '../../pages/YouTubeCallback';

// Create mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(window.location.search)],
  };
});

const renderWithRouter = (component, initialUrl = '/youtube/callback') => {
  // Set the URL for testing
  Object.defineProperty(window, 'location', {
    value: {
      href: `http://localhost:3000${initialUrl}`,
      search: initialUrl.includes('?') ? initialUrl.split('?')[1] : '',
    },
    writable: true,
  });

  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('YouTubeCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  describe('Success Flow', () => {
    it('should show loading state initially', () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      expect(screen.getByText('YouTube Authentication')).toBeInTheDocument();
      expect(screen.getByText('Processing your authentication...')).toBeInTheDocument();
      expect(screen.getByText('Please wait while we complete your YouTube authentication...')).toBeInTheDocument();
    });

    it('should show success state with valid authorization code', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      await waitFor(() => {
        expect(screen.getByText('YouTube authentication successful! You can now import videos from YouTube.')).toBeInTheDocument();
      });

      expect(screen.getByText('Redirecting to import page in a few seconds...')).toBeInTheDocument();
      expect(screen.getByText('Go to Home')).toBeInTheDocument();
      expect(screen.getByText('Go to Import')).toBeInTheDocument();
    });

    it('should redirect to import page after 3 seconds on success', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      await waitFor(() => {
        expect(screen.getByText('YouTube authentication successful! You can now import videos from YouTube.')).toBeInTheDocument();
      });

      // Fast-forward time by 3 seconds
      vi.advanceTimersByTime(3000);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/import-media');
      });
    });

    it('should navigate to home when Go to Home button is clicked', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      await waitFor(() => {
        expect(screen.getByText('Go to Home')).toBeInTheDocument();
      });

      const homeButton = screen.getByText('Go to Home');
      homeButton.click();

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should navigate to import when Go to Import button is clicked', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      await waitFor(() => {
        expect(screen.getByText('Go to Import')).toBeInTheDocument();
      });

      const importButton = screen.getByText('Go to Import');
      importButton.click();

      expect(mockNavigate).toHaveBeenCalledWith('/import-media');
    });
  });

  describe('Error Flow', () => {
    it('should show error state when OAuth error is present', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?error=access_denied&error_description=User%20denied%20access');

      await waitFor(() => {
        expect(screen.getByText('There was an error during YouTube authentication.')).toBeInTheDocument();
      });

      expect(screen.getByText('OAuth Error: access_denied')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('should show error state when no authorization code is present', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback');

      await waitFor(() => {
        expect(screen.getByText('The authorization code was not found in the callback URL.')).toBeInTheDocument();
      });

      expect(screen.getByText('No authorization code received')).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
      expect(screen.getByText('Go Home')).toBeInTheDocument();
    });

    it('should navigate to import page when Try Again is clicked', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      const tryAgainButton = screen.getByText('Try Again');
      tryAgainButton.click();

      expect(mockNavigate).toHaveBeenCalledWith('/import-media');
    });

    it('should navigate to home when Go Home is clicked from error state', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?error=access_denied');

      await waitFor(() => {
        expect(screen.getByText('Go Home')).toBeInTheDocument();
      });

      const goHomeButton = screen.getByText('Go Home');
      goHomeButton.click();

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Debug Information', () => {
    it('should show debug information in development mode', async () => {
      // Mock NODE_ENV to be development
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      await waitFor(() => {
        expect(screen.getByText('Debug Information:')).toBeInTheDocument();
      });

      expect(screen.getByText(/Code: Present/)).toBeInTheDocument();
      expect(screen.getByText(/State: test_state/)).toBeInTheDocument();
      expect(screen.getByText(/Error: None/)).toBeInTheDocument();

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });

    it('should not show debug information in production mode', async () => {
      // Mock NODE_ENV to be production
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      await waitFor(() => {
        expect(screen.getByText('YouTube authentication successful! You can now import videos from YouTube.')).toBeInTheDocument();
      });

      expect(screen.queryByText('Debug Information:')).not.toBeInTheDocument();

      // Restore original NODE_ENV
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('URL Parameter Handling', () => {
    it('should handle multiple URL parameters correctly', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state&scope=https://www.googleapis.com/auth/youtube.readonly');

      await waitFor(() => {
        expect(screen.getByText('YouTube authentication successful! You can now import videos from YouTube.')).toBeInTheDocument();
      });
    });

    it('should handle URL parameters with special characters', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code_with_special-chars.123&state=test%20state%20with%20spaces');

      await waitFor(() => {
        expect(screen.getByText('YouTube authentication successful! You can now import videos from YouTube.')).toBeInTheDocument();
      });
    });

    it('should handle empty state parameter', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=');

      await waitFor(() => {
        expect(screen.getByText('YouTube authentication successful! You can now import videos from YouTube.')).toBeInTheDocument();
      });
    });
  });

  describe('Component Cleanup', () => {
    it('should not navigate after component unmount', async () => {
      const { unmount } = renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      await waitFor(() => {
        expect(screen.getByText('YouTube authentication successful! You can now import videos from YouTube.')).toBeInTheDocument();
      });

      // Unmount the component before the timeout
      unmount();

      // Fast-forward time by 3 seconds
      vi.advanceTimersByTime(3000);

      // Should not navigate after unmount
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('YouTube Authentication');
    });

    it('should have accessible buttons', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?code=test_code&state=test_state');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Go to Home' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go to Import' })).toBeInTheDocument();
      });
    });

    it('should have accessible error buttons', async () => {
      renderWithRouter(<YouTubeCallback />, '/youtube/callback?error=access_denied');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go Home' })).toBeInTheDocument();
      });
    });
  });
});
