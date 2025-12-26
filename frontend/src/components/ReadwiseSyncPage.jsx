import React, { useState } from 'react';
import { 
  syncHighlightsFromReadwise, 
  syncDocumentsFromReader,
  bulkFetchArticleContents,
  validateReadwiseConnection,
  linkHighlightsToMedia
} from '../services/apiService';
import './ReadwiseSyncPage.css';

const ReadwiseSyncPage = () => {
  const [highlightSyncResult, setHighlightSyncResult] = useState(null);
  const [readerSyncResult, setReaderSyncResult] = useState(null);
  const [contentFetchResult, setContentFetchResult] = useState(null);
  const [linkResult, setLinkResult] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleValidateConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await validateReadwiseConnection();
      setConnectionStatus(response.data);
      
      // Show detailed error if connection failed
      if (!response.data.connected && response.data.details) {
        setError(response.data.details);
      }
    } catch (err) {
      const errorDetails = err.response?.data?.details || err.response?.data?.message || err.message;
      setError(`Connection validation failed: ${errorDetails}`);
      setConnectionStatus({ 
        connected: false, 
        message: err.response?.data?.message || 'Connection failed',
        details: errorDetails
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHighlightSync = async (incremental = false) => {
    setLoading(true);
    setError(null);
    setHighlightSyncResult(null);
    try {
      const lastSync = incremental ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) : null; // Last 7 days
      const response = await syncHighlightsFromReadwise(lastSync);
      setHighlightSyncResult(response.data);
    } catch (err) {
      setError(`Highlight sync failed: ${err.response?.data?.details || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReaderSync = async (location = null) => {
    setLoading(true);
    setError(null);
    setReaderSyncResult(null);
    try {
      const response = await syncDocumentsFromReader(location);
      setReaderSyncResult(response.data);
    } catch (err) {
      setError(`Reader sync failed: ${err.response?.data?.details || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleContentFetch = async (batchSize = 50) => {
    setLoading(true);
    setError(null);
    setContentFetchResult(null);
    try {
      const response = await bulkFetchArticleContents(batchSize);
      setContentFetchResult(response.data);
    } catch (err) {
      setError(`Content fetch failed: ${err.response?.data?.details || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkHighlights = async () => {
    setLoading(true);
    setError(null);
    setLinkResult(null);
    try {
      const response = await linkHighlightsToMedia();
      setLinkResult(response.data);
    } catch (err) {
      setError(`Linking highlights failed: ${err.response?.data?.details || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return 'N/A';
    const match = duration.match(/(\d+):(\d+):(\d+)/);
    if (!match) return duration;
    const [, hours, minutes, seconds] = match;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="readwise-sync-page">
      <div className="page-header">
        <h1>📚 Readwise & Reader Sync</h1>
        <p className="subtitle">
          Import and manage your highlights from Readwise and articles from Reader
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Connection Status Section */}
      <section className="sync-section">
        <h2>🔌 Connection Status</h2>
        <p>Verify your Readwise API connection before syncing</p>
        
        <button
          onClick={handleValidateConnection}
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? 'Validating...' : 'Validate Connection'}
        </button>

        {connectionStatus && (
          <div className={`connection-status ${connectionStatus.connected ? 'connected' : 'disconnected'}`}>
            <span className="status-icon">{connectionStatus.connected ? '✅' : '❌'}</span>
            <span className="status-message">{connectionStatus.message}</span>
          </div>
        )}
      </section>

      {/* Highlight Sync Section */}
      <section className="sync-section">
        <h2>✨ Sync Highlights (Readwise API)</h2>
        <p>Import all your highlights from Readwise (Kindle, Instapaper, Reader, etc.)</p>
        
        <div className="sync-buttons">
          <button
            onClick={() => handleHighlightSync(false)}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '⏳ Syncing...' : '🔄 Full Sync'}
          </button>
          <button
            onClick={() => handleHighlightSync(true)}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? '⏳ Syncing...' : '⚡ Sync Last 7 Days'}
          </button>
        </div>

        {highlightSyncResult && (
          <div className={`sync-result ${highlightSyncResult.success ? 'success' : 'error'}`}>
            <h3>Highlight Sync Results</h3>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Status:</span>
                <span className="result-value">
                  {highlightSyncResult.success ? '✅ Success' : '❌ Failed'}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Created:</span>
                <span className="result-value">{highlightSyncResult.createdCount}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Updated:</span>
                <span className="result-value">{highlightSyncResult.updatedCount}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Total Processed:</span>
                <span className="result-value">{highlightSyncResult.totalProcessed}</span>
              </div>
              {highlightSyncResult.duration && (
                <div className="result-item">
                  <span className="result-label">Duration:</span>
                  <span className="result-value">{formatDuration(highlightSyncResult.duration)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Reader Document Sync Section */}
      <section className="sync-section">
        <h2>📖 Sync Documents (Readwise Reader API)</h2>
        <p>Import articles saved in Readwise Reader</p>
        
        <div className="sync-buttons">
          <button
            onClick={() => handleReaderSync(null)}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '⏳ Syncing...' : '🔄 Sync All Documents'}
          </button>
          <button
            onClick={() => handleReaderSync('new')}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? '⏳ Syncing...' : '🆕 Sync "New" Only'}
          </button>
          <button
            onClick={() => handleReaderSync('archive')}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? '⏳ Syncing...' : '📦 Sync "Archive" Only'}
          </button>
        </div>

        {readerSyncResult && (
          <div className={`sync-result ${readerSyncResult.success ? 'success' : 'error'}`}>
            <h3>Reader Sync Results</h3>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Status:</span>
                <span className="result-value">
                  {readerSyncResult.success ? '✅ Success' : '❌ Failed'}
                </span>
              </div>
              <div className="result-item">
                <span className="result-label">Created:</span>
                <span className="result-value">{readerSyncResult.createdCount}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Updated:</span>
                <span className="result-value">{readerSyncResult.updatedCount}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Total Processed:</span>
                <span className="result-value">{readerSyncResult.totalProcessed}</span>
              </div>
              {readerSyncResult.duration && (
                <div className="result-item">
                  <span className="result-label">Duration:</span>
                  <span className="result-value">{formatDuration(readerSyncResult.duration)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Content Fetch Section */}
      <section className="sync-section">
        <h2>💾 Fetch Article Content (HTML)</h2>
        <p>Download full HTML content for articles and store in S3</p>
        
        <div className="sync-buttons">
          <button
            onClick={() => handleContentFetch(25)}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? '⏳ Fetching...' : '📥 Fetch 25 Articles'}
          </button>
          <button
            onClick={() => handleContentFetch(50)}
            disabled={loading}
            className="btn btn-secondary"
          >
            {loading ? '⏳ Fetching...' : '📥 Fetch 50 Articles'}
          </button>
        </div>

        {contentFetchResult && (
          <div className="sync-result success">
            <h3>Content Fetch Results</h3>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Fetched:</span>
                <span className="result-value">{contentFetchResult.fetchedCount} articles</span>
              </div>
              {contentFetchResult.message && (
                <div className="result-item full-width">
                  <span className="result-value">{contentFetchResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Link Highlights Section */}
      <section className="sync-section">
        <h2>🔗 Link Highlights to Media</h2>
        <p>Connect highlights to their corresponding articles and books in your library</p>
        
        <button
          onClick={handleLinkHighlights}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? '⏳ Linking...' : '🔗 Link Highlights'}
        </button>

        {linkResult && (
          <div className="sync-result success">
            <h3>Linking Results</h3>
            <div className="result-grid">
              <div className="result-item">
                <span className="result-label">Linked:</span>
                <span className="result-value">{linkResult.linkedCount} highlights</span>
              </div>
              {linkResult.message && (
                <div className="result-item full-width">
                  <span className="result-value">{linkResult.message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Info Box */}
      <section className="info-box">
        <h3>💡 Quick Tips</h3>
        <ul>
          <li><strong>First Time?</strong> Start with "Validate Connection" to ensure your API key is working</li>
          <li><strong>Full Sync:</strong> Imports all your historical highlights (may take several minutes)</li>
          <li><strong>Incremental Sync:</strong> Only syncs highlights from the last 7 days (faster)</li>
          <li><strong>Reader Sync:</strong> Imports article metadata from Reader</li>
          <li><strong>Content Fetch:</strong> Downloads the actual HTML content of articles for offline reading</li>
          <li><strong>Link Highlights:</strong> Matches highlights to existing articles/books in your library</li>
        </ul>
      </section>
    </div>
  );
};

export default ReadwiseSyncPage;

