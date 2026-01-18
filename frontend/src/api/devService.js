import { apiClient } from './apiClient';

// ============================================
// Database Cleanup API calls
// ============================================

export const cleanupYouTubeData = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-youtube-data');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up YouTube data:', error);
        throw error;
    }
};

export const cleanupPodcasts = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-podcasts');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up podcasts:', error);
        throw error;
    }
};

export const cleanupBooks = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-books');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up books:', error);
        throw error;
    }
};

export const cleanupMovies = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-movies');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up movies:', error);
        throw error;
    }
};

export const cleanupTvShows = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-tvshows');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up TV shows:', error);
        throw error;
    }
};

export const cleanupArticles = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-articles');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up articles:', error);
        throw error;
    }
};

export const cleanupHighlights = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-highlights');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up highlights:', error);
        throw error;
    }
};

export const cleanupMixlists = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-mixlists');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up mixlists:', error);
        throw error;
    }
};

export const cleanupAllTopics = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-all-topics');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up all topics:', error);
        throw error;
    }
};

export const cleanupAllGenres = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-all-genres');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up all genres:', error);
        throw error;
    }
};

export const cleanupOrphanedTopics = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-orphaned-topics');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up orphaned topics:', error);
        throw error;
    }
};

export const cleanupOrphanedGenres = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-orphaned-genres');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up orphaned genres:', error);
        throw error;
    }
};

export const cleanupAllMedia = async () => {
    try {
        const response = await apiClient.post('/dev/cleanup-all-media');
        return response.data;
    } catch (error) {
        console.error('Error cleaning up all media:', error);
        throw error;
    }
};

// ============================================
// Feature Flag API calls
// ============================================

export const getAllFeatureFlags = async () => {
    try {
        const response = await apiClient.get('/dev/feature-flags');
        return response.data;
    } catch (error) {
        console.error('Error getting feature flags:', error);
        throw error;
    }
};

export const getFeatureFlag = async (key) => {
    try {
        const response = await apiClient.get(`/dev/feature-flags/${key}`);
        return response.data;
    } catch (error) {
        console.error(`Error getting feature flag ${key}:`, error);
        throw error;
    }
};

export const enableFeatureFlag = async (key, description = null) => {
    try {
        const response = await apiClient.post(`/dev/feature-flags/${key}/enable`,
            description ? { description } : {});
        return response.data;
    } catch (error) {
        console.error(`Error enabling feature flag ${key}:`, error);
        throw error;
    }
};

export const disableFeatureFlag = async (key, description = null) => {
    try {
        const response = await apiClient.post(`/dev/feature-flags/${key}/disable`,
            description ? { description } : {});
        return response.data;
    } catch (error) {
        console.error(`Error disabling feature flag ${key}:`, error);
        throw error;
    }
};
