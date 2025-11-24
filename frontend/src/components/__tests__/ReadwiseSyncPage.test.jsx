import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ReadwiseSyncPage from '../ReadwiseSyncPage';
import * as apiService from '../../services/apiService';

// Mock the API service
vi.mock('../../services/apiService', () => ({
  validateReadwiseConnection: vi.fn(),
  syncHighlightsFromReadwise: vi.fn(),
  syncDocumentsFromReader: vi.fn(),
  bulkFetchArticleContents: vi.fn(),
  linkHighlightsToMedia: vi.fn(),
}));

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('ReadwiseSyncPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('should render the page with all sections', () => {
      renderWithRouter(<ReadwiseSyncPage />);

      expect(screen.getByText('📚 Readwise & Reader Sync')).toBeInTheDocument();
      expect(screen.getByText('🔌 Connection Status')).toBeInTheDocument();
      expect(screen.getByText('✨ Sync Highlights (Readwise API)')).toBeInTheDocument();
      expect(screen.getByText('📖 Sync Documents (Readwise Reader API)')).toBeInTheDocument();
      expect(screen.getByText('💾 Fetch Article Content (HTML)')).toBeInTheDocument();
      expect(screen.getByText('🔗 Link Highlights to Media')).toBeInTheDocument();
      expect(screen.getByText('💡 Quick Tips')).toBeInTheDocument();
    });

    it('should display all action buttons', () => {
      renderWithRouter(<ReadwiseSyncPage />);

      expect(screen.getByText('Validate Connection')).toBeInTheDocument();
      expect(screen.getByText('🔄 Full Sync')).toBeInTheDocument();
      expect(screen.getByText('⚡ Sync Last 7 Days')).toBeInTheDocument();
      expect(screen.getByText('🔄 Sync All Documents')).toBeInTheDocument();
      expect(screen.getByText('🆕 Sync "New" Only')).toBeInTheDocument();
      expect(screen.getByText('📦 Sync "Archive" Only')).toBeInTheDocument();
      expect(screen.getByText('📥 Fetch 25 Articles')).toBeInTheDocument();
      expect(screen.getByText('📥 Fetch 50 Articles')).toBeInTheDocument();
      expect(screen.getByText('🔗 Link Highlights')).toBeInTheDocument();
    });
  });

  describe('Connection Validation', () => {
    it('should validate connection successfully', async () => {
      apiService.validateReadwiseConnection.mockResolvedValue({
        data: { connected: true, message: 'Connection successful' }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const validateButton = screen.getByText('Validate Connection');
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText('✅')).toBeInTheDocument();
        expect(screen.getByText('Connection successful')).toBeInTheDocument();
      });

      expect(apiService.validateReadwiseConnection).toHaveBeenCalledTimes(1);
    });

    it('should show error when connection validation fails', async () => {
      apiService.validateReadwiseConnection.mockRejectedValue({
        response: { data: { details: 'Invalid API token' } }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const validateButton = screen.getByText('Validate Connection');
      fireEvent.click(validateButton);

      await waitFor(() => {
        expect(screen.getByText(/Connection validation failed/)).toBeInTheDocument();
        expect(screen.getByText(/Invalid API token/)).toBeInTheDocument();
      });
    });

    it('should disable buttons during validation', async () => {
      apiService.validateReadwiseConnection.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { connected: true } }), 100))
      );

      renderWithRouter(<ReadwiseSyncPage />);

      const validateButton = screen.getByText('Validate Connection');
      fireEvent.click(validateButton);

      expect(validateButton).toBeDisabled();
      expect(screen.getByText('Validating...')).toBeInTheDocument();

      await waitFor(() => {
        expect(validateButton).not.toBeDisabled();
      });
    });
  });

  describe('Highlight Sync', () => {
    it('should perform full highlight sync successfully', async () => {
      apiService.syncHighlightsFromReadwise.mockResolvedValue({
        data: {
          success: true,
          createdCount: 50,
          updatedCount: 10,
          totalProcessed: 60,
          duration: '0:00:05'
        }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      fireEvent.click(fullSyncButton);

      await waitFor(() => {
        expect(screen.getByText('Highlight Sync Results')).toBeInTheDocument();
        expect(screen.getByText('✅ Success')).toBeInTheDocument();
        expect(screen.getByText('50')).toBeInTheDocument(); // createdCount
        expect(screen.getByText('10')).toBeInTheDocument(); // updatedCount
        expect(screen.getByText('60')).toBeInTheDocument(); // totalProcessed
      });

      expect(apiService.syncHighlightsFromReadwise).toHaveBeenCalledWith(null);
    });

    it('should perform incremental highlight sync', async () => {
      apiService.syncHighlightsFromReadwise.mockResolvedValue({
        data: {
          success: true,
          createdCount: 5,
          updatedCount: 2,
          totalProcessed: 7,
          duration: '0:00:02'
        }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const incrementalSyncButton = screen.getByText('⚡ Sync Last 7 Days');
      fireEvent.click(incrementalSyncButton);

      await waitFor(() => {
        expect(screen.getByText('Highlight Sync Results')).toBeInTheDocument();
        expect(screen.getByText('5')).toBeInTheDocument(); // createdCount
        expect(screen.getByText('2')).toBeInTheDocument(); // updatedCount
      });

      // Should be called with a date parameter
      expect(apiService.syncHighlightsFromReadwise).toHaveBeenCalled();
      const callArg = apiService.syncHighlightsFromReadwise.mock.calls[0][0];
      expect(callArg).toBeInstanceOf(Date);
    });

    it('should handle highlight sync errors', async () => {
      apiService.syncHighlightsFromReadwise.mockRejectedValue({
        response: { data: { details: 'Rate limit exceeded' } }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      fireEvent.click(fullSyncButton);

      await waitFor(() => {
        expect(screen.getByText(/Highlight sync failed/)).toBeInTheDocument();
        expect(screen.getByText(/Rate limit exceeded/)).toBeInTheDocument();
      });
    });

    it('should show loading state during sync', async () => {
      apiService.syncHighlightsFromReadwise.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      );

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      fireEvent.click(fullSyncButton);

      expect(screen.getByText('⏳ Syncing...')).toBeInTheDocument();
      expect(fullSyncButton).toBeDisabled();

      await waitFor(() => {
        expect(screen.queryByText('⏳ Syncing...')).not.toBeInTheDocument();
      });
    });
  });

  describe('Reader Document Sync', () => {
    it('should sync all Reader documents', async () => {
      apiService.syncDocumentsFromReader.mockResolvedValue({
        data: {
          success: true,
          createdCount: 30,
          updatedCount: 5,
          totalProcessed: 35,
          duration: '0:00:08'
        }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const syncAllButton = screen.getByText('🔄 Sync All Documents');
      fireEvent.click(syncAllButton);

      await waitFor(() => {
        expect(screen.getByText('Reader Sync Results')).toBeInTheDocument();
        expect(screen.getByText('30')).toBeInTheDocument(); // createdCount
        expect(screen.getByText('35')).toBeInTheDocument(); // totalProcessed
      });

      expect(apiService.syncDocumentsFromReader).toHaveBeenCalledWith(null);
    });

    it('should sync only new documents', async () => {
      apiService.syncDocumentsFromReader.mockResolvedValue({
        data: { success: true, createdCount: 10, updatedCount: 0, totalProcessed: 10 }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const syncNewButton = screen.getByText('🆕 Sync "New" Only');
      fireEvent.click(syncNewButton);

      await waitFor(() => {
        expect(screen.getByText('Reader Sync Results')).toBeInTheDocument();
      });

      expect(apiService.syncDocumentsFromReader).toHaveBeenCalledWith('new');
    });

    it('should sync only archive documents', async () => {
      apiService.syncDocumentsFromReader.mockResolvedValue({
        data: { success: true, createdCount: 20, updatedCount: 5, totalProcessed: 25 }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const syncArchiveButton = screen.getByText('📦 Sync "Archive" Only');
      fireEvent.click(syncArchiveButton);

      await waitFor(() => {
        expect(screen.getByText('Reader Sync Results')).toBeInTheDocument();
      });

      expect(apiService.syncDocumentsFromReader).toHaveBeenCalledWith('archive');
    });
  });

  describe('Content Fetching', () => {
    it('should fetch 25 articles', async () => {
      apiService.bulkFetchArticleContents.mockResolvedValue({
        data: { fetchedCount: 25, message: 'Successfully fetched 25 articles' }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fetch25Button = screen.getByText('📥 Fetch 25 Articles');
      fireEvent.click(fetch25Button);

      await waitFor(() => {
        expect(screen.getByText('Content Fetch Results')).toBeInTheDocument();
        expect(screen.getByText('25 articles')).toBeInTheDocument();
      });

      expect(apiService.bulkFetchArticleContents).toHaveBeenCalledWith(25);
    });

    it('should fetch 50 articles', async () => {
      apiService.bulkFetchArticleContents.mockResolvedValue({
        data: { fetchedCount: 50, message: 'Successfully fetched 50 articles' }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fetch50Button = screen.getByText('📥 Fetch 50 Articles');
      fireEvent.click(fetch50Button);

      await waitFor(() => {
        expect(screen.getByText('50 articles')).toBeInTheDocument();
      });

      expect(apiService.bulkFetchArticleContents).toHaveBeenCalledWith(50);
    });
  });

  describe('Link Highlights', () => {
    it('should link highlights to media successfully', async () => {
      apiService.linkHighlightsToMedia.mockResolvedValue({
        data: { linkedCount: 100, message: 'Linked 100 highlights' }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const linkButton = screen.getByText('🔗 Link Highlights');
      fireEvent.click(linkButton);

      await waitFor(() => {
        expect(screen.getByText('Linking Results')).toBeInTheDocument();
        expect(screen.getByText('100 highlights')).toBeInTheDocument();
      });

      expect(apiService.linkHighlightsToMedia).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should clear error when starting new operation', async () => {
      apiService.syncHighlightsFromReadwise.mockRejectedValueOnce({
        response: { data: { details: 'First error' } }
      });
      apiService.syncHighlightsFromReadwise.mockResolvedValue({
        data: { success: true, createdCount: 10, updatedCount: 0, totalProcessed: 10 }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      
      // First attempt - should show error
      fireEvent.click(fullSyncButton);
      await waitFor(() => {
        expect(screen.getByText(/First error/)).toBeInTheDocument();
      });

      // Second attempt - error should be cleared
      fireEvent.click(fullSyncButton);
      await waitFor(() => {
        expect(screen.queryByText(/First error/)).not.toBeInTheDocument();
        expect(screen.getByText('Highlight Sync Results')).toBeInTheDocument();
      });
    });

    it('should handle network errors gracefully', async () => {
      apiService.syncHighlightsFromReadwise.mockRejectedValue({
        message: 'Network Error'
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      fireEvent.click(fullSyncButton);

      await waitFor(() => {
        expect(screen.getByText(/Highlight sync failed/)).toBeInTheDocument();
        expect(screen.getByText(/Network Error/)).toBeInTheDocument();
      });
    });
  });

  describe('Duration Formatting', () => {
    it('should format duration with hours', async () => {
      apiService.syncHighlightsFromReadwise.mockResolvedValue({
        data: {
          success: true,
          createdCount: 100,
          updatedCount: 20,
          totalProcessed: 120,
          duration: '1:23:45'
        }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      fireEvent.click(fullSyncButton);

      await waitFor(() => {
        expect(screen.getByText('1h 23m 45s')).toBeInTheDocument();
      });
    });

    it('should format duration with only minutes', async () => {
      apiService.syncHighlightsFromReadwise.mockResolvedValue({
        data: {
          success: true,
          createdCount: 50,
          updatedCount: 10,
          totalProcessed: 60,
          duration: '0:05:30'
        }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      fireEvent.click(fullSyncButton);

      await waitFor(() => {
        expect(screen.getByText('5m 30s')).toBeInTheDocument();
      });
    });

    it('should format duration with only seconds', async () => {
      apiService.syncHighlightsFromReadwise.mockResolvedValue({
        data: {
          success: true,
          createdCount: 10,
          updatedCount: 2,
          totalProcessed: 12,
          duration: '0:00:15'
        }
      });

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      fireEvent.click(fullSyncButton);

      await waitFor(() => {
        expect(screen.getByText('15s')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper button states', () => {
      renderWithRouter(<ReadwiseSyncPage />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });

    it('should disable all buttons during any operation', async () => {
      apiService.syncHighlightsFromReadwise.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { success: true } }), 100))
      );

      renderWithRouter(<ReadwiseSyncPage />);

      const fullSyncButton = screen.getByText('🔄 Full Sync');
      fireEvent.click(fullSyncButton);

      const allButtons = screen.getAllByRole('button');
      allButtons.forEach(button => {
        expect(button).toBeDisabled();
      });

      await waitFor(() => {
        allButtons.forEach(button => {
          expect(button).not.toBeDisabled();
        });
      });
    });
  });
});

