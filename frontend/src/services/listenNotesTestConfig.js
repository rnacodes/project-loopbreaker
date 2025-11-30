/**
 * ListenNotes API Test Configuration
 * 
 * This file provides configuration for using the ListenNotes MOCK API server
 * which returns fake data for testing purposes without requiring an API key.
 * 
 * Documentation: https://www.listennotes.com/api/docs/?test=1
 * 
 * Mock Server Base URL: https://listen-api-test.listennotes.com/api/v2
 * Production Server URL: https://listen-api.listennotes.com/api/v2
 */

export const LISTEN_NOTES_CONFIG = {
  // Use mock server for development/testing
  MOCK_BASE_URL: 'https://listen-api-test.listennotes.com/api/v2',
  
  // Production server (requires API key)
  PROD_BASE_URL: 'https://listen-api.listennotes.com/api/v2',
  
  // Use mock server in test environment
  getBaseUrl: () => {
    if (import.meta.env.MODE === 'test') {
      return LISTEN_NOTES_CONFIG.MOCK_BASE_URL;
    }
    // In production, use our backend API which proxies to ListenNotes
    return import.meta.env.VITE_API_URL || 'http://localhost:5033/api';
  }
};

/**
 * Example mock server responses:
 * 
 * GET /search?q=star%20wars
 * - Returns: SearchResultDto with fake podcast results
 * 
 * GET /podcasts/{id}
 * - Returns: PodcastSeriesDto with fake podcast details
 * 
 * GET /episodes/{id}
 * - Returns: PodcastEpisodeDto with fake episode details
 * 
 * GET /best_podcasts
 * - Returns: ListenNotesBestPodcastsDto with fake best podcasts
 * 
 * GET /genres
 * - Returns: ListenNotesGenresDto with fake genre list
 * 
 * All endpoints return consistent fake data for testing!
 */

