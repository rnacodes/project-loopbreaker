import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock axios BEFORE any imports that use it
vi.mock('axios', () => {
  const mockAxiosInstance = {
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      post: vi.fn(),
      get: vi.fn()
    }
  };
});

// Now import axios to get the mocked version
import axios from 'axios';

// Mock setAccessToken from api module
vi.mock('../../api/apiClient', () => ({
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn()
}));

import * as apiClient from '../../api/apiClient';
import { AuthProvider, useAuth } from '../AuthContext';

// Test component that uses useAuth hook
const TestConsumer = () => {
  const { user, token, loading, login, logout, isAuthenticated } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.username : 'no-user'}</div>
      <div data-testid="token">{token || 'no-token'}</div>
      <button
        data-testid="login-btn"
        onClick={async () => {
          const result = await login('testuser', 'testpass');
          return result;
        }}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for refresh token on mount - no valid session
    axios.post.mockRejectedValue(new Error('No session'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should show loading state initially', async () => {
      // Make the refresh call hang to capture loading state
      axios.post.mockImplementation(() => new Promise(() => {}));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should complete loading after refresh token check', async () => {
      axios.post.mockRejectedValue(new Error('No session'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });
    });

    it('should not be authenticated when no session exists', async () => {
      axios.post.mockRejectedValue(new Error('No session'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      });
    });

    it('should restore session from refresh token if valid', async () => {
      axios.post.mockResolvedValue({
        data: {
          token: 'restored-access-token',
          username: 'restoreduser',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('restoreduser');
        expect(screen.getByTestId('token')).toHaveTextContent('restored-access-token');
      });
    });
  });

  describe('Login', () => {
    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup();

      // Initial refresh fails (no session)
      axios.post.mockRejectedValueOnce(new Error('No session'));

      // Login succeeds
      axios.post.mockResolvedValueOnce({
        data: {
          token: 'new-access-token',
          username: 'testuser',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('testuser');
        expect(screen.getByTestId('token')).toHaveTextContent('new-access-token');
      });

      expect(apiClient.setAccessToken).toHaveBeenCalledWith('new-access-token');
    });

    it('should handle login failure', async () => {
      const user = userEvent.setup();

      // Initial refresh fails
      axios.post.mockRejectedValueOnce(new Error('No session'));

      // Login fails
      axios.post.mockRejectedValueOnce({
        response: { data: { message: 'Invalid credentials' } }
      });

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('ready');
      });

      await user.click(screen.getByTestId('login-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      });
    });
  });

  describe('Logout', () => {
    it('should clear auth state on logout', async () => {
      const user = userEvent.setup();

      // Initial state - user is logged in
      axios.post.mockResolvedValueOnce({
        data: {
          token: 'existing-token',
          username: 'loggeduser',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      });

      // Logout call succeeds
      axios.post.mockResolvedValueOnce({});

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      await user.click(screen.getByTestId('logout-btn'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
        expect(screen.getByTestId('user')).toHaveTextContent('no-user');
        expect(screen.getByTestId('token')).toHaveTextContent('no-token');
      });

      expect(apiClient.setAccessToken).toHaveBeenCalledWith(null);
    });

    it('should clear local state even if server logout fails', async () => {
      const user = userEvent.setup();

      // Initial state - user is logged in
      axios.post.mockResolvedValueOnce({
        data: {
          token: 'existing-token',
          username: 'loggeduser',
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        }
      });

      // Logout call fails
      axios.post.mockRejectedValueOnce(new Error('Server error'));

      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      await user.click(screen.getByTestId('logout-btn'));

      // Should still clear local state even if server call fails
      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const TestOutsideProvider = () => {
        useAuth();
        return <div>Should not render</div>;
      };

      expect(() => render(<TestOutsideProvider />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );

      consoleSpy.mockRestore();
    });
  });
});
