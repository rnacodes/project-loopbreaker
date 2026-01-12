import { apiClient } from './apiClient';

// ============================================
// Script Execution API calls
// ============================================

/**
 * Check if the script runner service is available.
 */
export const checkScriptRunnerHealth = async () => {
    try {
        const response = await apiClient.get('/scriptexecution/health');
        return response.data;
    } catch (error) {
        console.error('Error checking script runner health:', error);
        throw error;
    }
};

/**
 * Get all script execution jobs.
 * @param {number} limit - Maximum number of jobs to return (default: 50)
 */
export const getScriptJobs = async (limit = 50) => {
    try {
        const response = await apiClient.get(`/scriptexecution/jobs?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error getting script jobs:', error);
        throw error;
    }
};

/**
 * Get status of a specific job.
 * @param {string} jobId - The job ID
 */
export const getScriptJob = async (jobId) => {
    try {
        const response = await apiClient.get(`/scriptexecution/jobs/${jobId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting script job:', error);
        throw error;
    }
};

/**
 * Run the normalize_notes script (database normalization).
 * @param {Object} options - Script options
 * @param {boolean} options.dryRun - Preview changes without making them
 * @param {boolean} options.verbose - Enable verbose output
 */
export const runNormalizeNotes = async (options = {}) => {
    try {
        const response = await apiClient.post('/scriptexecution/normalize-notes', {
            dryRun: options.dryRun || false,
            verbose: options.verbose || false
        });
        return response.data;
    } catch (error) {
        console.error('Error running normalize notes:', error);
        throw error;
    }
};

/**
 * Run the normalize_vault script (file system normalization).
 * @param {Object} options - Script options
 * @param {boolean} options.dryRun - Preview changes without making them
 * @param {boolean} options.verbose - Enable verbose output
 * @param {string} options.vaultPath - Path to the Obsidian vault
 * @param {boolean} options.useAI - Use AI to generate descriptions
 * @param {boolean} options.backup - Create backup before changes
 */
export const runNormalizeVault = async (options = {}) => {
    try {
        const response = await apiClient.post('/scriptexecution/normalize-vault', {
            dryRun: options.dryRun || false,
            verbose: options.verbose || false,
            vaultPath: options.vaultPath,
            useAI: options.useAI || false,
            backup: options.backup || false
        });
        return response.data;
    } catch (error) {
        console.error('Error running normalize vault:', error);
        throw error;
    }
};

/**
 * Cancel a running job.
 * @param {string} jobId - The job ID to cancel
 */
export const cancelScriptJob = async (jobId) => {
    try {
        const response = await apiClient.post(`/scriptexecution/jobs/${jobId}/cancel`);
        return response.data;
    } catch (error) {
        console.error('Error canceling script job:', error);
        throw error;
    }
};
