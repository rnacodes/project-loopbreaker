import { apiClient } from './apiClient';

// ============================================
// Background Jobs API calls
// ============================================

// Book Description Enrichment
// ============================================

/**
 * Get the status of book description enrichment
 * Returns count of books needing enrichment
 */
export const getBookEnrichmentStatus = async () => {
    const response = await apiClient.get('/bookenrichment/status');
    return response.data;
};

/**
 * Run a single batch of book description enrichment
 * @param {Object} options - Optional parameters
 * @param {number} options.batchSize - Number of books to process (1-500, default: 50)
 * @param {number} options.delayBetweenCallsMs - Delay between API calls in ms (100-10000, default: 1000)
 */
export const runBookEnrichment = async (options = {}) => {
    const response = await apiClient.post('/bookenrichment/run', {
        batchSize: options.batchSize || 50,
        delayBetweenCallsMs: options.delayBetweenCallsMs || 1000
    });
    return response.data;
};

/**
 * Run book description enrichment for all books without descriptions
 * Processes multiple batches until maxBooks is reached
 * @param {Object} options - Optional parameters
 * @param {number} options.batchSize - Books per batch (1-200, default: 50)
 * @param {number} options.delayBetweenCallsMs - Delay between API calls in ms (default: 1000)
 * @param {number} options.maxBooks - Maximum total books to process (1-10000, default: 500)
 * @param {number} options.pauseBetweenBatchesSeconds - Pause between batches in seconds (default: 30)
 */
export const runBookEnrichmentAll = async (options = {}) => {
    const response = await apiClient.post('/bookenrichment/run-all', {
        batchSize: options.batchSize || 50,
        delayBetweenCallsMs: options.delayBetweenCallsMs || 1000,
        maxBooks: options.maxBooks || 500,
        pauseBetweenBatchesSeconds: options.pauseBetweenBatchesSeconds || 30
    });
    return response.data;
};
